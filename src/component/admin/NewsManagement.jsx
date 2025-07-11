import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, PlusCircle, Eye, Edit3, Trash2, MessageCircle } from 'lucide-react';
import { collection, getDocs, query, orderBy, onSnapshot, doc, getDoc, deleteDoc, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseconfig';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import NewsModal from './NewsModal';
import { createNews } from '../config/createNews.js';

const NewsManagement = ({ logActivity, setStats }) => {
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [filterTitle, setFilterTitle] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [filterCustomDate, setFilterCustomDate] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('none');
  const [categories, setCategories] = useState(['']);
  const [formData, setFormData] = useState({
    judul: '',
    konten: '',
    kategori: '',
    author: '',
    gambar: '',
    ringkasan: '',
    gambarDeskripsi: '',
    slug: ''
  });
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, id: null, title: '', message: '' });

  const navigate = useNavigate();

  const fetchNews = () => {
    setNewsLoading(true);
    const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        let newsData = await Promise.all(snapshot.docs.map(async (doc) => {
          const newsItem = { id: doc.id, ...doc.data() };
          const commentsQuery = query(collection(db, 'news', doc.id, 'comments'));
          const commentsSnapshot = await getDocs(commentsQuery);
          newsItem.komentar = commentsSnapshot.size;
          return newsItem;
        }));

        const totalViews = newsData.reduce((sum, item) => sum + (item.views || 0), 0);
        const totalComments = newsData.reduce((sum, item) => sum + (item.komentar || 0), 0);
        const totalNews = newsData.length;

        const uniqueCategories = [...new Set(newsData.map(item => item.kategori || ''))];
        setCategories(['', ...uniqueCategories]);

        if (filterTitle) {
          newsData = newsData.filter(item =>
            item.judul?.toLowerCase().includes(filterTitle.toLowerCase())
          );
        }
        if (filterCategory) {
          newsData = newsData.filter(item =>
            item.kategori?.toLowerCase() === filterCategory.toLowerCase()
          );
        }
        if (filterAuthor) {
          newsData = newsData.filter(item =>
            item.author?.toLowerCase().includes(filterAuthor.toLowerCase())
          );
        }
        if (filterDate === 'last7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          newsData = newsData.filter(item => item.createdAt?.toDate() >= sevenDaysAgo);
        } else if (filterDate === 'last30days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          newsData = newsData.filter(item => item.createdAt?.toDate() >= thirtyDaysAgo);
        } else if (filterDate === 'custom' && filterCustomDate) {
          const customDate = new Date(filterCustomDate);
          newsData = newsData.filter(item => {
            const itemDate = item.createdAt?.toDate();
            return itemDate && itemDate.toDateString() === customDate.toDateString();
          });
        }

        switch (filterSortBy) {
          case 'views-desc':
            newsData.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
          case 'comments-desc':
            newsData.sort((a, b) => (b.komentar || 0) - (a.komentar || 0));
            break;
          default:
            break;
        }

        setNews(newsData);
        setStats(prev => ({
          ...prev,
          totalNews,
          totalViews,
          totalComments
        }));
      } catch (error) {
        console.error('Error fetching news:', error);
        logActivity('FETCH_NEWS_ERROR', { error: error.message });
        toast.error('Gagal memuat berita.');
      } finally {
        setNewsLoading(false);
      }
    }, (error) => {
      console.error('Error in news snapshot:', error);
      logActivity('FETCH_NEWS_SNAPSHOT_ERROR', { error: error.message });
      toast.error('Gagal memuat pembaruan berita.');
      setNewsLoading(false);
    });

    return unsubscribe;
  };

  useEffect(() => {
    let unsubscribeNews;
    if (fetchNews) {
      unsubscribeNews = fetchNews();
    }
    return () => {
      if (unsubscribeNews) unsubscribeNews();
    };
  }, [filterTitle, filterCategory, filterAuthor, filterDate, filterCustomDate, filterSortBy]);

  const handleSubmit = async (formData) => {
    setNewsLoading(true);

    if (!formData.judul || !formData.konten || !formData.kategori || !formData.author) {
      toast.error('Mohon lengkapi semua field yang wajib diisi.');
      setNewsLoading(false);
      return null;
    }

    try {
      let newsId;
      if (editingNews) {
        const newsRef = doc(db, 'news', editingNews.id);
        await updateDoc(newsRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
        const bookmarkQuery = query(
          collection(db, 'savedArticles'),
          where('articleId', '==', editingNews.id)
        );
        const bookmarkSnapshot = await getDocs(bookmarkQuery);
        for (const bookmarkDoc of bookmarkSnapshot.docs) {
          await updateDoc(doc(db, 'savedArticles', bookmarkDoc.id), {
            slug: formData.slug,
            title: formData.judul
          });
        }
        await logActivity('EDIT_NEWS', { 
          newsId: editingNews.id, 
          title: formData.judul, 
          slug: formData.slug,
          oldSlug: editingNews.slug
        });
        toast.success('Berita berhasil diperbarui.');
        newsId = editingNews.id;
      } else {
        newsId = await createNews({ ...formData, createdAt: serverTimestamp(), views: 0, likeCount: 0 });
        await logActivity('ADD_NEWS', { 
          newsId, 
          title: formData.judul, 
          category: formData.kategori, 
          slug: formData.slug 
        });
        toast.success('Berita berhasil ditambahkan.');
      }

      resetForm();
      setShowModal(false);
      return newsId;
    } catch (error) {
      console.error('Error saving news:', error);
      await logActivity('SAVE_NEWS_ERROR', { error: error.message, title: formData.judul, slug: formData.slug });
      toast.error(`Gagal menyimpan berita: ${error.message}`);
      throw error;
    } finally {
      setNewsLoading(false);
    }
  };

  const handleDeleteNews = (id) => {
    setConfirmationModal({
      isOpen: true,
      id,
      title: 'Hapus Berita',
      message: 'Apakah Anda yakin ingin menghapus berita ini? Tindakan ini tidak dapat dibatalkan.'
    });
  };

  const confirmDelete = async () => {
    const { id, title } = confirmationModal;
    if (!id) {
      toast.error('ID tidak valid.');
      return;
    }
    try {
      if (title === 'Hapus Berita') {
        setNewsLoading(true);
        const newsDoc = await getDoc(doc(db, 'news', id));
        if (newsDoc.exists()) {
          const newsData = newsDoc.data();
          await deleteDoc(doc(db, 'news', id));
          const bookmarkQuery = query(
            collection(db, 'savedArticles'),
            where('articleId', '==', id)
          );
          const bookmarkSnapshot = await getDocs(bookmarkQuery);
          for (const bookmarkDoc of bookmarkSnapshot.docs) {
            await deleteDoc(doc(db, 'savedArticles', bookmarkDoc.id));
          }
          await logActivity('DELETE_NEWS', { newsId: id, title: newsData.judul || 'N/A' });
          toast.success('Berita berhasil dihapus.');
        }
      }
    } catch (error) {
      console.error('Error deleting:', error);
      await logActivity('DELETE_NEWS_ERROR', { id, error: error.message });
      toast.error('Gagal menghapus berita.');
    } finally {
      setNewsLoading(false);
      setConfirmationModal({ isOpen: false, id: null, title: '', message: '' });
    }
  };

  const handleEdit = (newsItem) => {
    setEditingNews(newsItem);
    setFormData({
      judul: newsItem.judul || '',
      konten: newsItem.konten || '',
      kategori: newsItem.kategori || '',
      author: newsItem.author || '',
      gambar: newsItem.gambar || '',
      ringkasan: newsItem.ringkasan || '',
      gambarDeskripsi: newsItem.gambarDeskripsi || '',
      slug: newsItem.slug || ''
    });
    setShowModal(true);
  };

  const handleViewNews = (slug, judul) => {
    if (slug) {
      navigate(`/berita/${slug}`);
      logActivity('VIEW_NEWS', { slug, title: judul });
    } else {
      toast.error('Slug berita tidak tersedia.');
      logActivity('VIEW_NEWS_ERROR', { title: judul, error: 'Missing slug' });
    }
  };

  const resetForm = () => {
    setFormData({
      judul: '',
      konten: '',
      kategori: '',
      author: '',
      gambar: '',
      ringkasan: '',
      gambarDeskripsi: '',
      slug: ''
    });
    setEditingNews(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Baru';
    const date = timestamp.toDate();
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const filteredNews = news;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-slideUp">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Kelola Berita</h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Tambah Berita</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 animate-slideUp">
          <input
            type="text"
            placeholder="Filter by Judul"
            value={filterTitle}
            onChange={(e) => setFilterTitle(e.target.value)}
            className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900"
          >
            <option value="">Pilih Kategori</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>{cat || 'Tanpa Kategori'}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filter by Penulis"
            value={filterAuthor}
            onChange={(e) => setFilterAuthor(e.target.value)}
            className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500"
          />
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900"
          >
            <option value="all">Semua Tanggal</option>
            <option value="last7days">7 Hari Terakhir</option>
            <option value="last30days">30 Hari Terakhir</option>
            <option value="custom">Tanggal Kustom</option>
          </select>
          {filterDate === 'custom' && (
            <input
              type="date"
              value={filterCustomDate}
              onChange={(e) => setFilterCustomDate(e.target.value)}
              className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900"
            />
          )}
          <select
            value={filterSortBy}
            onChange={(e) => setFilterSortBy(e.target.value)}
            className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900"
          >
            <option value="none">Sort by Stats</option>
            <option value="views-desc">Views (Desc)</option>
            <option value="comments-desc">Komentar (Desc)</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Berita
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Penulis
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {newsLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="relative">
                          <div className="w-10 h-10 border-4 border-indigo-200 rounded-full animate-spin"></div>
                          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredNews.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <FileText className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Berita</h3>
                        <p className="text-gray-600">Belum ada berita yang tersedia.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredNews.map((item, index) => (
                    <motion.tr 
                      key={item.id} 
                      className={`transition-all duration-300 transform hover:scale-[1.01] ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          {item.gambar && (
                            <img
                              className="h-12 w-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                              src={item.gambar}
                              alt={item.gambarDeskripsi || item.judul}
                            />
                          )}
                          <div>
                            <div 
                              className="text-sm font-medium text-blue-600 hover:underline cursor-pointer max-w-xs truncate"
                              onClick={() => handleViewNews(item.slug, item.judul)}
                            >
                              {item.judul}
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">{item.ringkasan}</div>
                            {item.gambarDeskripsi && (
                              <div className="text-xs text-gray-400 italic">{item.gambarDeskripsi}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.author}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4 text-indigo-500" />
                            <span>{item.views || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4 text-indigo-500" />
                            <span>{item.komentar || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewNews(item.slug, item.judul)}
                            className="text-cyan-600 hover:text-cyan-900 transition-all duration-200 hover:scale-110"
                            title="Lihat Berita"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-indigo-600 hover:text-indigo-900 transition-all duration-200 hover:scale-110"
                            title="Edit Berita"
                          >
                            <Edit3 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNews(item.id)}
                            className="text-red-600 hover:text-red-900 transition-all duration-200 hover:scale-110"
                            title="Hapus Berita"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <NewsModal
        showModal={showModal}
        setShowModal={setShowModal}
        editingNews={editingNews}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        loading={newsLoading}
        logActivity={logActivity}
      />
    </div>
  );
};

export default NewsManagement;
