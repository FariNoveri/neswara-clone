import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../../firebaseconfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate, Link } from 'react-router-dom';
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
  addDoc,
  onSnapshot
} from 'firebase/firestore';
import { createNews } from '../config/createNews.js';
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
  Bell,
  AlertCircle,
  X,
  Flag
} from 'lucide-react';
import { toast } from 'react-toastify';
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
import ReportManagement from './ReportManagement';

const ADMIN_EMAILS = ['cahayalunamaharani1@gmail.com', 'fari_noveriwinanto@teknokrat.ac.id'];

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform animate-scaleIn">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:rotate-90 transform"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>
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
    totalBreakingNews: 0,
    totalReports: 0
  });
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, id: null, title: '', message: '' });
  const [showGif, setShowGif] = useState(true);

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
      toast.error('Gagal mencatat aktivitas.');
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

      const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
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

      const handleNewsEdited = (event) => {
        const { newsId, newSlug, oldSlug } = event.detail;
        console.log(`News edited event received: newsId=${newsId}, newSlug=${newSlug}, oldSlug=${oldSlug}`);
        if (editingNews && newsId === editingNews.id && newSlug) {
          console.log(`Redirecting to new slug: /berita/${newSlug}`);
          navigate(`/berita/${newSlug}`, { replace: true });
        }
      };

      window.addEventListener('newsEdited', handleNewsEdited);

      return () => {
        unsubscribeAuth();
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
      toast.error('Gagal logout.');
      navigate('/');
    }
  };

  const handleAdminLogout = async () => {
    try {
      await auth.signOut();
      await logActivity('ADMIN_LOGOUT', { userEmail: user?.email || null });
      toast.success('Berhasil logout.');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Gagal logout.');
      navigate('/');
    }
  };

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
        await logActivity('FETCH_NEWS_ERROR', { error: error.message });
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

  const fetchUsers = () => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      try {
        const totalUsers = snapshot.size;
        setStats(prev => ({
          ...prev,
          totalUsers
        }));
      } catch (error) {
        console.error('Error fetching users:', error);
        logActivity('FETCH_USERS_ERROR', { error: error.message });
        toast.error('Gagal memuat data pengguna.');
      }
    }, (error) => {
      console.error('Error in users snapshot:', error);
      logActivity('FETCH_USERS_SNAPSHOT_ERROR', { error: error.message });
      toast.error('Gagal memuat pembaruan pengguna.');
    });

    return unsubscribe;
  };

  const fetchComments = () => {
    const q = query(collectionGroup(db, 'comments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const totalComments = snapshot.size;
        setStats(prev => ({
          ...prev,
          totalComments
        }));
      } catch (error) {
        console.error('Error fetching comments:', error.message);
        if (error.message.includes('index')) {
          console.log('Missing index for comments collection group. Please create it in Firebase Console.');
        }
        logActivity('FETCH_COMMENTS_ERROR', { error: error.message });
        toast.error('Gagal memuat komentar.');
      }
    }, (error) => {
      console.error('Error in comments snapshot:', error);
      logActivity('FETCH_COMMENTS_SNAPSHOT_ERROR', { error: error.message });
      toast.error('Gagal memuat pembaruan komentar.');
    });

    return unsubscribe;
  };

  const fetchNotifications = () => {
    const unsubscribe = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      try {
        const totalNotifications = snapshot.size;
        setStats(prev => ({
          ...prev,
          totalNotifications
        }));
      } catch (error) {
        console.error('Error fetching notifications:', error);
        logActivity('FETCH_NOTIFICATIONS_ERROR', { error: error.message });
        toast.error('Gagal memuat notifikasi.');
      }
    }, (error) => {
      console.error('Error in notifications snapshot:', error);
      logActivity('FETCH_NOTIFICATIONS_SNAPSHOT_ERROR', { error: error.message });
      toast.error('Gagal memuat pembaruan notifikasi.');
    });

    return unsubscribe;
  };

  const fetchBreakingNews = () => {
    const unsubscribe = onSnapshot(collection(db, 'breakingNews'), (snapshot) => {
      try {
        const totalBreakingNews = snapshot.size;
        setStats(prev => ({
          ...prev,
          totalBreakingNews
        }));
      } catch (error) {
        console.error('Error fetching breaking news:', error);
        logActivity('FETCH_BREAKING_NEWS_ERROR', { error: error.message });
        toast.error('Gagal memuat breaking news.');
      }
    }, (error) => {
      console.error('Error in breaking news snapshot:', error);
      logActivity('FETCH_BREAKING_NEWS_SNAPSHOT_ERROR', { error: error.message });
      toast.error('Gagal memuat pembaruan breaking news.');
    });

    return unsubscribe;
  };

  const fetchReports = () => {
    const unsubscribe = onSnapshot(collection(db, 'reports'), (snapshot) => {
      try {
        const totalReports = snapshot.size;
        setStats(prev => ({
          ...prev,
          totalReports
        }));
      } catch (error) {
        console.error('Error fetching reports:', error);
        logActivity('FETCH_REPORTS_ERROR', { error: error.message });
        toast.error('Gagal memuat laporan.');
      }
    }, (error) => {
      console.error('Error in reports snapshot:', error);
      logActivity('FETCH_REPORTS_SNAPSHOT_ERROR', { error: error.message });
      toast.error('Gagal memuat pembaruan laporan.');
    });

    return unsubscribe;
  };

  const handleViewsUpdated = async () => {
    console.log('Views updated, refreshing data...');
    await logActivity('VIEWS_UPDATED', { totalViews: stats.totalViews || null });
    // No need to manually refresh since onSnapshot handles real-time updates
  };

  useEffect(() => {
    let unsubscribeNews, unsubscribeUsers, unsubscribeComments, unsubscribeNotifications, unsubscribeBreakingNews, unsubscribeReports;

    if (isAuthorized) {
      unsubscribeNews = fetchNews();
      unsubscribeUsers = fetchUsers();
      unsubscribeComments = fetchComments();
      unsubscribeNotifications = fetchNotifications();
      unsubscribeBreakingNews = fetchBreakingNews();
      unsubscribeReports = fetchReports();
    }

    return () => {
      if (unsubscribeNews) unsubscribeNews();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeComments) unsubscribeComments();
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeBreakingNews) unsubscribeBreakingNews();
      if (unsubscribeReports) unsubscribeReports();
    };
  }, [isAuthorized, filterTitle, filterCategory, filterAuthor, filterDate, filterCustomDate, filterSortBy]);

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

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  const navButtonVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (index) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut', delay: index * 0.1 }
    })
  };

  const gifVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-indigo-600 font-medium animate-pulse">Memuat...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center animate-slideRight">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <span className="text-indigo-100 text-sm">Neswara News</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-indigo-100">
                Selamat datang, {user?.displayName || user?.email}
              </div>
              <button
                onClick={handleAdminLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all duration-200 hover:scale-105"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-4 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'news', label: 'Kelola Berita', icon: FileText },
              { id: 'users', label: 'Kelola Pengguna', icon: Users },
              { id: 'comments', label: 'Kelola Komentar', icon: MessageCircle },
              { id: 'breaking-news', label: 'Kelola Breaking News', icon: RadioTower },
              { id: 'notifications', label: 'Kelola Notifikasi', icon: Bell },
              { id: 'views', label: 'Kelola Views', icon: Eye },
              { id: 'reports', label: 'Kelola Laporan', icon: Flag },
              { id: 'logs', label: 'Kelola Log', icon: FileText }
            ].map((tab, index) => (
              <motion.button
                key={tab.id}
                custom={index}
                variants={navButtonVariants}
                initial="hidden"
                animate="visible"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700 shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </motion.button>
            ))}
          </nav>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { icon: FileText, title: 'Total Berita', value: stats.totalNews, color: '#10B981' },
                    { icon: MessageCircle, title: 'Total Komentar', value: stats.totalComments, color: '#3B82F6' },
                    { icon: Eye, title: 'Total Views', value: stats.totalViews, color: '#F59E0B' },
                    { icon: Users, title: 'Total Pengguna', value: stats.totalUsers, color: '#EF4444' },
                    { icon: Bell, title: 'Total Notifikasi', value: stats.totalNotifications, color: '#8B5CF6' },
                    { icon: RadioTower, title: 'Total Breaking News', value: stats.totalBreakingNews, color: '#EC4899' },
                    { icon: Flag, title: 'Total Laporan', value: stats.totalReports, color: '#F97316' }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.title}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                    >
                      <StatCard
                        icon={stat.icon}
                        title={stat.title}
                        value={stat.value}
                        color={stat.color}
                        className="animate-scaleIn"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      />
                    </motion.div>
                  ))}
                </div>
                <div className="animate-slideUp">
                  <TrendsChart isAuthorized={isAuthorized} activeTab={activeTab} />
                </div>
                <motion.div
                  className="mt-6 text-center"
                  variants={gifVariants}
                  initial="hidden"
                  animate={showGif ? 'visible' : 'hidden'}
                >
                  {showGif && (
                    <img
                      src=""
                      alt="Fate/Stay Night GIF"
                      className="w-full max-h-96 rounded-lg shadow-md object-contain"
                    />
                  )}
                  <button
                    onClick={() => setShowGif(!showGif)}
                    className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all duration-200 hover:scale-105"
                  >
                    {showGif ? 'Sembunyikan GIF' : 'Tampilkan GIF'}
                  </button>
                </motion.div>
              </div>
            )}

            {activeTab === 'news' && (
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
              </div>
            )}

            {activeTab === 'users' && <UserManagement adminEmails={ADMIN_EMAILS} logActivity={logActivity} />}

            {activeTab === 'comments' && <CommentManagement logActivity={logActivity} />}

            {activeTab === 'breaking-news' && <BreakingNewsAdmin logActivity={logActivity} />}

            {activeTab === 'notifications' && <NotificationManagement logActivity={logActivity} />}

            {activeTab === 'views' && (
              <ManageViews onViewsUpdated={handleViewsUpdated} logActivity={logActivity} />
            )}

            {activeTab === 'reports' && <ReportManagement logActivity={logActivity} />}

            {activeTab === 'logs' && <LogActivity logActivity={logActivity} />}
          </motion.div>
        </AnimatePresence>

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

        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal({ isOpen: false, id: null, title: '', message: '' })}
          onConfirm={confirmDelete}
          title={confirmationModal.title}
          message={confirmationModal.message}
        />

        <style jsx>{`
          .animate-slideUp {
            animation: slideUp 0.3s ease-out;
          }
          .animate-slideRight {
            animation: slideRight 0.3s ease-out;
          }
          .animate-scaleIn {
            animation: scaleIn 0.3s ease-out;
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
          @keyframes slideRight {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          /* Ensure table cells do not overflow */
          td, th {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AdminDashboard;