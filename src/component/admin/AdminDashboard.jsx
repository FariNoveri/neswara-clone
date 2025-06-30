import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebaseconfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  collectionGroup,
  where,
  getDoc,
  addDoc
} from 'firebase/firestore';
import { createNews } from './../config/createNews.js';
import {
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  MessageCircle,
  User,
  LogOut,
  BarChart3,
  FileText,
  Users,
  RadioTower,
  Bell
} from 'lucide-react';
import UnauthorizedModal from './UnauthorizedModal';
import NewsModal from './NewsModal';
import StatCard from './StatCard';
import UserManagement from './UserManagement';
import CommentManagement from './CommentManagement';
import TrendsChart from './TrendsChart';
import BreakingNewsAdmin from './BreakingNewsAdmin';
import NotificationManagement from './NotificationManagement';
import ManageViews from './ManageViews';
import LogActivity from './LogActivity';

const ADMIN_EMAILS = ['cahayalunamaharani1@gmail.com', 'fari_noveriwinanto@teknokrat.ac.id'];

const AdminDashboard = () => {
  const [user, loading] = useAuthState(auth);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
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
  const [stats, setStats] = useState({
    totalNews: 0,
    totalComments: 0,
    totalViews: 0,
    totalUsers: 0,
    totalNotifications: 0,
    totalBreakingNews: 0
  });

  const navigate = useNavigate();

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

  const logActivity = async (action, details = {}) => {
    try {
      const cleanedDetails = Object.fromEntries(
        Object.entries(details).filter(([_, value]) => value !== undefined)
      );

      await addDoc(collection(db, 'logs'), {
        userId: user?.uid || null,
        userEmail: user?.email || null,
        action: action,
        details: cleanedDetails,
        timestamp: serverTimestamp(),
        ipAddress: null
      });
      console.log(`Logged ${action}:`, cleanedDetails);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      const checkAuthorization = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const isAdmin = userData?.isAdmin || ADMIN_EMAILS.includes(user.email);
            if (isAdmin) {
              setIsAuthorized(true);
              await logActivity('ADMIN_LOGIN', { userEmail: user.email });
            } else {
              setIsAuthorized(false);
              setShowUnauthorizedModal(true);
              await logActivity('UNAUTHORIZED_ACCESS', { userEmail: user.email });
            }
          } else {
            setIsAuthorized(false);
            setShowUnauthorizedModal(true);
            await logActivity('UNAUTHORIZED_ACCESS', { userEmail: user.email });
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          setShowUnauthorizedModal(true);
          await logActivity('AUTH_ERROR', { userEmail: user?.email, error: error.message });
        }
      };
      checkAuthorization();

      const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        if (currentUser && currentUser.uid === user.uid) {
          if (currentUser.photoURL !== user.photoURL) {
            logActivity('PROFILE_UPDATE', { type: 'photo', newValue: currentUser.photoURL || null });
          }
          if (currentUser.email !== user.email) {
            logActivity('PROFILE_UPDATE', { type: 'email', newValue: currentUser.email || null });
          }
          if (currentUser.displayName !== user.displayName) {
            logActivity('PROFILE_UPDATE', { type: 'displayName', newValue: currentUser.displayName || null });
          }
        }
      });

      // Listen for newsEdited event to redirect
      const handleNewsEdited = (event) => {
        const { newsId, newSlug, oldSlug } = event.detail;
        console.log(`News edited event received: newsId=${newsId}, newSlug=${newSlug}, oldSlug=${oldSlug}`);
        if (newSlug && editingNews && newsId === editingNews.id) {
          console.log(`Redirecting to new slug: /berita/${newSlug}`);
          navigate(`/berita/${newSlug}`, { replace: true });
        }
      };

      window.addEventListener('newsEdited', handleNewsEdited);

      return () => {
        unsubscribe();
        window.removeEventListener('newsEdited', handleNewsEdited);
      };
    } else if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate, editingNews]);

  const handleUnauthorizedClose = async () => {
    try {
      await auth.signOut();
      await logActivity('UNAUTHORIZED_LOGOUT', { userEmail: user?.email || null });
      setShowUnauthorizedModal(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/');
    }
  };

  const handleAdminLogout = async () => {
    try {
      await auth.signOut();
      await logActivity('ADMIN_LOGOUT', { userEmail: user?.email || null });
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/');
    }
  };

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
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

      setStats(prev => ({
        ...prev,
        totalNews,
        totalViews,
        totalComments
      }));

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
    } catch (error) {
      console.error('Error fetching news:', error);
      await logActivity('FETCH_NEWS_ERROR', { error: error.message });
    }
    setNewsLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      setStats(prev => ({
        ...prev,
        totalUsers
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      await logActivity('FETCH_USERS_ERROR', { error: error.message });
    }
  };

  const fetchComments = async () => {
    try {
      const q = query(collectionGroup(db, 'comments'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setStats(prev => ({
        ...prev,
        totalComments: snapshot.size
      }));
    } catch (error) {
      console.error('Error fetching comments:', error.message);
      if (error.message.includes('index')) {
        console.log('Missing index for comments collection group. Please create it in Firebase Console.');
      }
      await logActivity('FETCH_COMMENTS_ERROR', { error: error.message });
    }
  };

  const fetchNotifications = async () => {
    try {
      const notificationsSnapshot = await getDocs(collection(db, 'notifications'));
      const totalNotifications = notificationsSnapshot.size;
      setStats(prev => ({
        ...prev,
        totalNotifications
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      await logActivity('FETCH_NOTIFICATIONS_ERROR', { error: error.message });
    }
  };

  const fetchBreakingNews = async () => {
    try {
      const breakingNewsSnapshot = await getDocs(collection(db, 'breakingNews'));
      const totalBreakingNews = breakingNewsSnapshot.size;
      setStats(prev => ({
        ...prev,
        totalBreakingNews
      }));
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      await logActivity('FETCH_BREAKING_NEWS_ERROR', { error: error.message });
    }
  };

  const handleViewsUpdated = async () => {
    console.log('Views updated, refreshing data...');
    await fetchNews();
    await fetchUsers();
    await fetchComments();
    await fetchNotifications();
    await fetchBreakingNews();
    await logActivity('VIEWS_UPDATED', { totalViews: stats.totalViews || null });
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchNews();
      fetchUsers();
      fetchComments();
      fetchNotifications();
      fetchBreakingNews();
    }
  }, [isAuthorized, filterTitle, filterCategory, filterAuthor, filterDate, filterCustomDate, filterSortBy]);

  const handleSubmit = async (formData) => {
    setNewsLoading(true);

    if (!formData.judul || !formData.konten || !formData.kategori || !formData.author) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      setNewsLoading(false);
      return null;
    }

    try {
      let newsId;
      if (editingNews) {
        // Update existing news
        const newsRef = doc(db, 'news', editingNews.id);
        await updateDoc(newsRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
        // Update savedArticles with new slug and title
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
        console.log(`Updated news ID: ${editingNews.id}, new slug: ${formData.slug}`);
        newsId = editingNews.id;
      } else {
        // Create new news
        newsId = await createNews({ ...formData, createdAt: serverTimestamp(), views: 0, likeCount: 0 });
        await logActivity('ADD_NEWS', { 
          newsId, 
          title: formData.judul, 
          category: formData.kategori, 
          slug: formData.slug 
        });
      }

      resetForm();
      await fetchNews();
      setShowModal(false);
      return newsId;
    } catch (error) {
      console.error('Error saving news:', error);
      await logActivity('SAVE_NEWS_ERROR', { error: error.message, title: formData.judul, slug: formData.slug });
      alert(`Gagal menyimpan berita: ${error.message}`);
      throw error;
    } finally {
      setNewsLoading(false);
    }
  };

  const handleDeleteNews = async id => {
    if (window.confirm('Apakah Anda yakin ingin menghapus berita ini?')) {
      try {
        const newsDoc = await getDoc(doc(db, 'news', id));
        if (newsDoc.exists()) {
          const newsData = newsDoc.data();
          await deleteDoc(doc(db, 'news', id));
          // Delete associated savedArticles
          const bookmarkQuery = query(
            collection(db, 'savedArticles'),
            where('articleId', '==', id)
          );
          const bookmarkSnapshot = await getDocs(bookmarkQuery);
          for (const bookmarkDoc of bookmarkSnapshot.docs) {
            await deleteDoc(doc(db, 'savedArticles', bookmarkDoc.id));
          }
          await logActivity('DELETE_NEWS', { newsId: id, title: newsData.judul || null });
          await fetchNews();
        }
      } catch (error) {
        console.error('Error deleting news:', error);
        await logActivity('DELETE_NEWS_ERROR', { newsId: id, error: error.message });
      }
    }
  };

  const handleEdit = newsItem => {
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

  const filteredNews = news;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized && user) {
    return (
      <UnauthorizedModal
        show={showUnauthorizedModal}
        onClose={handleUnauthorizedClose}
        userEmail={user?.email}
        logActivity={logActivity}
      />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <span className="ml-2 text-sm text-gray-500">Neswara News</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Welcome, {user?.displayName || user?.email}
              </div>
              <button
                onClick={handleAdminLogout}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'news', label: 'Kelola Berita', icon: FileText },
              { id: 'users', label: 'Kelola Pengguna', icon: Users },
              { id: 'comments', label: 'Kelola Komentar', icon: MessageCircle },
              { id: 'breaking-news', label: 'Kelola Breaking News', icon: RadioTower },
              { id: 'notifications', label: 'Kelola Notifikasi', icon: Bell },
              { id: 'views', label: 'Kelola Views', icon: Eye },
              { id: 'logs', label: 'Kelola Log', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-end overflow-x-auto">
              <div className="flex space-x-6">
                <StatCard
                  icon={FileText}
                  title="Total Berita"
                  value={stats.totalNews}
                  color="#10B981"
                />
                <StatCard
                  icon={MessageCircle}
                  title="Total Komentar"
                  value={stats.totalComments}
                  color="#3B82F6"
                />
                <StatCard
                  icon={Eye}
                  title="Total Views"
                  value={stats.totalViews}
                  color="#F59E0B"
                />
                <StatCard
                  icon={Users}
                  title="Total Pengguna"
                  value={stats.totalUsers}
                  color="#EF4444"
                />
                <StatCard
                  icon={Bell}
                  title="Total Notifikasi"
                  value={stats.totalNotifications}
                  color="#8B5CF6"
                />
                <StatCard
                  icon={RadioTower}
                  title="Total Breaking News"
                  value={stats.totalBreakingNews}
                  color="#EC4899"
                />
              </div>
            </div>

            <TrendsChart isAuthorized={isAuthorized} activeTab={activeTab} />

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Berita Terbaru</h3>
              <div className="space-y-3">
                {news.slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 max-w-xs truncate">
                        {item.judul}
                      </h4>
                      <p className="text-sm text-gray-500 max-w-xs truncate">
                        {item.kategori} • {item.author} • {item.views || 0} views
                      </p>
                    </div>
                    <div className="text-sm text-gray-400">
                      {item.createdAt?.seconds
                        ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                        : 'Baru'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <input
                  type="text"
                  placeholder="Filter by Berita"
                  value={filterTitle}
                  onChange={(e) => setFilterTitle(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
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
                  className="px-3 py-2 border rounded-lg"
                />
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
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
                    className="px-3 py-2 border rounded-lg"
                  />
                )}
                <select
                  value={filterSortBy}
                  onChange={(e) => setFilterSortBy(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="none">Sort by Stats</option>
                  <option value="views-desc">Views (Desc)</option>
                  <option value="comments-desc">Komentar (Desc)</option>
                </select>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Tambah Berita
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Berita
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Penulis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {newsLoading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredNews.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          Tidak ada berita ditemukan
                        </td>
                      </tr>
                    ) : (
                      filteredNews.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {item.gambar && (
                                <img
                                  className="h-10 w-10 rounded-lg object-cover mr-4"
                                  src={item.gambar}
                                  alt=""
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                  {item.judul}
                                </div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {item.ringkasan}
                                </div>
                                {item.gambarDeskripsi && (
                                  <div className="text-xs text-gray-400 italic">
                                    {item.gambarDeskripsi}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {item.kategori}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.author}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.createdAt?.seconds
                              ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                              : 'Baru'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-2">
                              <Eye className="h-4 w-4" />
                              <span>{item.views || 0}</span>
                              <MessageCircle className="h-4 w-4 ml-2" />
                              <span>{item.komentar || 0}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteNews(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement adminEmails={ADMIN_EMAILS} logActivity={logActivity} />}

        {activeTab === 'comments' && <CommentManagement logActivity={logActivity} />}

        {activeTab === 'breaking-news' && <BreakingNewsAdmin logActivity={logActivity} />}

        {activeTab === 'notifications' && <NotificationManagement logActivity={logActivity} />}

        {activeTab === 'views' && (
          <ManageViews onViewsUpdated={handleViewsUpdated} logActivity={logActivity} />
        )}

        {activeTab === 'logs' && <LogActivity />}

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

        <style jsx>{`
          .flex {
            display: flex;
          }
          .justify-end {
            justify-content: flex-end;
          }
          .space-x-6 > * + * {
            margin-left: 1.5rem;
          }
          .overflow-x-auto {
            overflow-x: auto;
          }
          .animate-slideUp {
            animation: slideUp 0.3s ease-out;
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AdminDashboard;