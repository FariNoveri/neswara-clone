import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../../firebaseconfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  getDocs,
  query,
  collectionGroup,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  BarChart3,
  User,
  LogOut,
  Users,
  MessageCircle,
  RadioTower,
  Bell,
  Eye,
  FileText,
  Flag,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import UnauthorizedModal from './UnauthorizedModal';
import StatCard from './StatCard';
import UserManagement from './UserManagement';
import CommentManagement from './CommentManagement';
import TrendsChart from './TrendsChart';
import BreakingNewsAdmin from './BreakingNewsAdmin';
import NotificationManagement from './NotificationManagement';
import ManageViews from './ManageViews';
import LogActivity from './LogActivity';
import ReportManagement from './ReportManagement';
import NewsManagement from './NewsManagement';

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

  const navigate = useNavigate();

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

      return () => {
        unsubscribeAuth();
      };
    } else if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

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

  // Fetch total news and views from the 'news' collection
  const fetchNews = () => {
    const unsubscribe = onSnapshot(collection(db, 'news'), (snapshot) => {
      try {
        let totalNews = snapshot.size;
        let totalViews = 0;
        snapshot.forEach(doc => {
          totalViews += doc.data().views || 0;
        });
        setStats(prev => ({
          ...prev,
          totalNews,
          totalViews
        }));
      } catch (error) {
        console.error('Error fetching news:', error);
        toast.error('Gagal memuat data berita.');
      }
    }, (error) => {
      console.error('Error in news snapshot:', error);
      toast.error('Gagal memuat pembaruan berita.');
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
        toast.error('Gagal memuat data pengguna.');
      }
    }, (error) => {
      console.error('Error in users snapshot:', error);
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
        toast.error('Gagal memuat komentar.');
      }
    }, (error) => {
      console.error('Error in comments snapshot:', error);
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
        toast.error('Gagal memuat notifikasi.');
      }
    }, (error) => {
      console.error('Error in notifications snapshot:', error);
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
        toast.error('Gagal memuat breaking news.');
      }
    }, (error) => {
      console.error('Error in breaking news snapshot:', error);
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
        toast.error('Gagal memuat laporan.');
      }
    }, (error) => {
      console.error('Error in reports snapshot:', error);
      toast.error('Gagal memuat pembaruan laporan.');
    });

    return unsubscribe;
  };

  const handleViewsUpdated = async () => {
    console.log('Views updated, refreshing data...');
    await logActivity('VIEWS_UPDATED', { totalViews: stats.totalViews || null });
  };

  useEffect(() => {
    let unsubscribeNews, unsubscribeUsers, unsubscribeComments, unsubscribeNotifications, unsubscribeBreakingNews, unsubscribeReports;

    if (isAuthorized) {
      // Fetch all stats immediately when the dashboard loads
      unsubscribeNews = fetchNews(); // Added to fetch news and views
      unsubscribeUsers = fetchUsers();
      unsubscribeComments = fetchComments();
      unsubscribeNotifications = fetchNotifications();
      unsubscribeBreakingNews = fetchBreakingNews();
      unsubscribeReports = fetchReports();
    }

    return () => {
      // Cleanup all listeners to prevent memory leaks
      if (unsubscribeNews) unsubscribeNews();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeComments) unsubscribeComments();
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeBreakingNews) unsubscribeBreakingNews();
      if (unsubscribeReports) unsubscribeReports();
    };
  }, [isAuthorized]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 animate-slideRight">
            {/* Logo dan Title */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
                <span className="text-indigo-100 text-xs sm:text-sm">Neswara News</span>
              </div>
            </div>

            {/* User Info dan Logout */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              {/* User Info - Responsive layout */}
              <div className="text-xs sm:text-sm text-indigo-100 truncate max-w-full sm:max-w-none">
                Selamat datang, {user?.displayName || user?.email}
              </div>
              
              {/* Avatar and Logout Container */}
              <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                {/* User Avatar */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500 rounded-full flex items-center justify-center overflow-hidden">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleAdminLogout}
                  className="flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all duration-200 hover:scale-105"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm sm:text-base">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2">
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
                className={`flex items-center px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700 shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[1] || tab.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>

        {/* Explanatory Comment for Admins */}
        {/* Penjelasan untuk Admin: Bagian ini menampilkan kartu statistik (StatCard) untuk total berita, komentar, tayangan, pengguna, notifikasi, breaking news, dan laporan. Semua data diambil secara real-time menggunakan onSnapshot dari Firestore untuk memastikan angka selalu terbaru tanpa perlu navigasi ke tab lain (misalnya, "Kelola Berita"). Fungsi fetchNews, fetchUsers, dll., dijalankan saat dashboard dimuat (isAuthorized=true) untuk sinkronisasi data langsung. */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                  <TrendsChart isAuthorized={isAuthorized} activeTab={activeTab} logActivity={logActivity} />
                </div>
              </div>
            )}

            {activeTab === 'news' && (
              <NewsManagement logActivity={logActivity} setStats={setStats} />
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

        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal({ isOpen: false, id: null, title: '', message: '' })}
          onConfirm={() => setConfirmationModal({ isOpen: false, id: null, title: '', message: '' })}
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
        `}</style>
      </div>
    </div>
  );
};

export default AdminDashboard;