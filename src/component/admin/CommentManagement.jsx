import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseconfig';
import { collection, getDocs, query, orderBy, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const CommentManagement = ({ logActivity }) => {
  const [comments, setComments] = useState([]);
  const [filteredComments, setFilteredComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchText: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    const fetchComments = async () => {
      try {
        console.log('Fetching comments from all news subcollections');
        const newsQuery = query(collection(db, 'news'));
        const newsSnapshot = await getDocs(newsQuery);
        let allComments = [];

        for (const newsDoc of newsSnapshot.docs) {
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
            return { ...commentData, displayName };
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

  // Filter comments berdasarkan kriteria
  useEffect(() => {
    let filtered = [...comments];

    // Filter berdasarkan teks pencarian (nama pengguna atau komentar)
    if (filters.searchText) {
      filtered = filtered.filter(comment =>
        (comment.displayName || '').toLowerCase().includes(filters.searchText.toLowerCase()) ||
        (comment.text || '').toLowerCase().includes(filters.searchText.toLowerCase())
      );
    }

    // Filter berdasarkan tanggal
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(comment => {
        if (!comment.createdAt) return false;
        const commentDate = comment.createdAt.toDate();
        return commentDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(comment => {
        if (!comment.createdAt) return false;
        const commentDate = comment.createdAt.toDate();
        return commentDate <= toDate;
      });
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
    if (window.confirm("Yakin ingin menghapus komentar ini?")) {
      try {
        const commentDoc = await getDoc(doc(db, "news", newsId, "comments", commentId));
        if (commentDoc.exists()) {
          const commentData = commentDoc.data();
          await deleteDoc(doc(db, "news", newsId, "comments", commentId));
          logActivity('COMMENT_DELETE', { newsId, commentId, text: commentData.text, displayName: commentData.displayName });
          const updatedComments = comments.filter(comment => comment.id !== commentId);
          setComments(updatedComments);
          setFilteredComments(updatedComments.filter(comment => {
            let include = true;
            
            if (filters.searchText) {
              include = include && (
                (comment.displayName || '').toLowerCase().includes(filters.searchText.toLowerCase()) ||
                (comment.text || '').toLowerCase().includes(filters.searchText.toLowerCase())
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
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Komentar</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Nama/Komentar
            </label>
            <input
              type="text"
              value={filters.searchText}
              onChange={(e) => handleFilterChange('searchText', e.target.value)}
              placeholder="Masukkan nama pengguna atau komentar..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Filter Actions */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Hapus Semua Filter
          </button>
          <div className="text-sm text-gray-600">
            Menampilkan {filteredComments.length} dari {comments.length} komentar
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Pengguna
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Komentar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Berita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredComments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    {comments.length === 0 ? 'Tidak ada komentar ditemukan' : 'Tidak ada komentar yang sesuai dengan filter'}
                  </td>
                </tr>
              ) : (
                filteredComments.map(comment => (
                  <tr key={comment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{comment.displayName || ''}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{comment.text}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {comment.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-500 hover:underline">
                      <Link to={`/berita/${comment.newsId}`}>Lihat Berita</Link>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDelete(comment.newsId, comment.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommentManagement;