import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseconfig';
import { collection, getDocs, query, orderBy, doc, getDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Trash2, AlertCircle, Search, X, Filter, Calendar, MessageSquare, Edit2, Eye } from 'lucide-react';
import DOMPurify from 'dompurify';

const CommentManagement = ({ logActivity }) => {
  const [comments, setComments] = useState([]);
  const [filteredComments, setFilteredComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchText: '',
    dateFrom: '',
    dateTo: ''
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, newsId: '', commentId: '' });
  const [originalCommentModal, setOriginalCommentModal] = useState({ isOpen: false, originalText: '', commentId: '' });

  useEffect(() => {
    const fetchComments = async () => {
      try {
        console.log('Fetching comments from all news subcollections');
        const newsQuery = query(collection(db, 'news'));
        const newsSnapshot = await getDocs(newsQuery);
        let allComments = [];

        for (const newsDoc of newsSnapshot.docs) {
          const newsData = newsDoc.data();
          const commentsQuery = query(
            collection(db, 'news', newsDoc.id, 'comments'),
            orderBy('createdAt', 'desc')
          );
          const commentsSnapshot = await getDocs(commentsQuery);
          const commentsData = await Promise.all(commentsSnapshot.docs.map(async (commentDoc) => {
            const commentData = { id: commentDoc.id, ...commentDoc.data(), newsId: newsDoc.id };
            let displayName = commentData.author || 'Unknown';
            let userIdField = commentData.uid || commentData.userId || commentData.authorId || commentDoc.id;
            if (userIdField) {
              const userDoc = await getDoc(doc(db, 'users', userIdField));
              if (userDoc.exists()) {
                displayName = userDoc.data().displayName || displayName;
              }
            }
            return { 
              ...commentData, 
              displayName, 
              newsSlug: newsData.slug || newsDoc.id,
              isEdited: commentData.isEdited || false,
              replyToAuthor: commentData.replyToAuthor || null,
              originalText: commentData.originalText || null
            };
          }));
          allComments = [...allComments, ...commentsData];
        }

        setComments(allComments);
        setFilteredComments(allComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
      setLoading(false);
    };

    fetchComments();
  }, []);

  useEffect(() => {
    let filtered = [...comments];

    if (filters.searchText) {
      filtered = filtered.filter(comment =>
        (comment.displayName || '').toLowerCase().includes(filters.searchText.toLowerCase()) ||
        (comment.text || '').toLowerCase().includes(filters.searchText.toLowerCase()) ||
        (comment.replyToAuthor || '').toLowerCase().includes(filters.searchText.toLowerCase()) ||
        (comment.originalText || '').toLowerCase().includes(filters.searchText.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(comment => comment.createdAt && comment.createdAt.toDate() >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(comment => comment.createdAt && comment.createdAt.toDate() <= toDate);
    }

    setFilteredComments(filtered);
  }, [filters, comments]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchText: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleDelete = async (newsId, commentId) => {
    setDeleteModal({ isOpen: true, newsId, commentId });
  };

  const confirmDelete = async () => {
    const { newsId, commentId } = deleteModal;
    try {
      const commentDoc = await getDoc(doc(db, "news", newsId, "comments", commentId));
      if (commentDoc.exists()) {
        const commentData = commentDoc.data();
        await deleteDoc(doc(db, "news", newsId, "comments", commentId));
        logActivity('COMMENT_DELETE', { 
          newsId, 
          commentId, 
          text: commentData.text, 
          displayName: commentData.displayName,
          isEdited: commentData.isEdited || false,
          replyToAuthor: commentData.replyToAuthor || null,
          originalText: commentData.originalText || null
        });
        const updatedComments = comments.filter(comment => comment.id !== commentId);
        setComments(updatedComments);
        setFilteredComments(updatedComments.filter(comment => {
          let include = true;
          if (filters.searchText) {
            include = include && (
              (comment.displayName || '').toLowerCase().includes(filters.searchText.toLowerCase()) ||
              (comment.text || '').toLowerCase().includes(filters.searchText.toLowerCase()) ||
              (comment.replyToAuthor || '').toLowerCase().includes(filters.searchText.toLowerCase()) ||
              (comment.originalText || '').toLowerCase().includes(filters.searchText.toLowerCase())
            );
          }
          if (filters.dateFrom && comment.createdAt) {
            const fromDate = new Date(filters.dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            include = include && comment.createdAt.toDate() >= fromDate;
          }
          if (filters.dateTo && comment.createdAt) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            include = include && comment.createdAt.toDate() <= toDate;
          }
          return include;
        }));
        console.log("Komentar berhasil dihapus:", commentId);
      }
    } catch (err) {
      console.error("Gagal menghapus komentar:", err);
    } finally {
      setDeleteModal({ isOpen: false, newsId: '', commentId: '' });
    }
  };

  const handleShowOriginalClick = (commentId, originalText) => {
    if (!originalText) {
      console.warn("Original comment text not available for comment:", commentId);
      return;
    }
    setOriginalCommentModal({ isOpen: true, originalText, commentId });
  };

  const sanitizeInput = (input) => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    }).trim();
  };

  const DeleteModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform animate-scaleIn">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Hapus Komentar</h3>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:rotate-90 transform"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mb-8 leading-relaxed">Yakin ingin menghapus komentar ini? Tindakan ini tidak dapat dibatalkan.</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium hover:scale-105 transform"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium hover:scale-105 transform shadow-lg"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    );
  };

  const OriginalCommentModal = ({ isOpen, onClose, originalText }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform animate-scaleIn">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Komentar Asli</h3>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:rotate-90 transform"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200 mb-8 leading-relaxed">
            {sanitizeInput(originalText || 'Komentar asli tidak tersedia.')}
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-medium hover:scale-105 transform shadow-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center space-x-4 animate-slideRight">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Manajemen Komentar</h1>
              <p className="text-indigo-100 text-lg">Kelola dan pantau semua komentar pengguna</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8 animate-slideUp">
          <div className="flex items-center space-x-3 mb-6">
            <Filter className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Filter & Pencarian</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors duration-200 group-focus-within:text-indigo-600" />
              <input
                type="text"
                value={filters.searchText}
                onChange={(e) => handleFilterChange('searchText', e.target.value)}
                placeholder="Cari nama pengguna, komentar, balasan, atau teks asli..."
                className="pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors duration-200 group-focus-within:text-indigo-600" />
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full transition-all duration-200 bg-white text-gray-900"
              />
            </div>
            
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors duration-200 group-focus-within:text-indigo-600" />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full transition-all duration-200 bg-white text-gray-900"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MessageSquare className="w-4 h-4" />
              <span>Menampilkan {filteredComments.length} dari {comments.length} komentar</span>
            </div>
            
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
            >
              <X className="w-5 h-5" />
              <span>Hapus Semua Filter</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slideUp">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Pengguna
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Komentar
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Berita
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin"></div>
                          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredComments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {comments.length === 0 ? 'Tidak ada komentar ditemukan' : 'Tidak ada komentar yang sesuai dengan filter'}
                    </td>
                  </tr>
                ) : (
                  filteredComments.map((comment, index) => (
                    <tr key={comment.id} className={`hover:bg-gray-50 transition-all duration-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} transform hover:scale-[1.01] animate-fadeInUp`} style={{ animationDelay: `${index * 0.1}s` }}>
                      <td className="px-6 py-4 text-sm text-gray-900">{comment.displayName || ''}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{comment.text}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex flex-col space-y-1">
                          <span className={`flex items-center ${comment.isEdited ? 'text-blue-600' : 'text-gray-400'}`}>
                            <Edit2 className="w-4 h-4 mr-1" />
                            {comment.isEdited ? 'Edited' : 'Not Edited'}
                            {comment.isEdited && (
                              <button
                                onClick={() => handleShowOriginalClick(comment.id, comment.originalText)}
                                className="ml-2 text-xs text-blue-500 hover:text-blue-700 hover:underline"
                                title="Lihat komentar asli"
                              >
                                Lihat Asli
                              </button>
                            )}
                          </span>
                          <span>
                            {comment.parentId ? (
                              <span className="text-cyan-600">
                                Balasan ke {sanitizeInput(comment.replyToAuthor || 'Unknown')}
                              </span>
                            ) : (
                              <span className="text-gray-400">Tanpa Balasan</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {comment.createdAt?.toDate().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-500 hover:underline">
                        <Link to={`/berita/${comment.newsSlug}`}>{comment.newsSlug}</Link>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleDelete(comment.newsId, comment.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                          title="Hapus komentar"
                        >
                          <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DeleteModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, newsId: '', commentId: '' })}
          onConfirm={confirmDelete}
        />
        <OriginalCommentModal
          isOpen={originalCommentModal.isOpen}
          onClose={() => setOriginalCommentModal({ isOpen: false, originalText: '', commentId: '' })}
          originalText={originalCommentModal.originalText}
        />
      </div>
    </div>
  );
};

export default CommentManagement;

<style jsx>{`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  @keyframes slideRight {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
  
  .animate-scaleIn {
    animation: scaleIn 0.3s ease-out;
  }
  
  .animate-slideRight {
    animation: slideRight 0.3s ease-out;
  }
  
  .animate-fadeInUp {
    animation: fadeIn 0.3s ease-out;
  }

  /* Table responsiveness */
  @media (max-width: 768px) {
    table {
      display: block;
      overflow-x: auto;
      white-space: nowrap;
    }

    th, td {
      min-width: 120px;
    }
  }
`}</style>