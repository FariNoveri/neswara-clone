import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebaseconfig';
import { collection, query, orderBy, onSnapshot, limit, doc, getDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { ChevronDown, ChevronUp, Eye, EyeOff, Trash, Search, X, Filter, Calendar, Activity, Users, AlertCircle, Clock, User, MessageSquare, Heart, Bookmark, BookmarkX, PlusCircle, Edit3, Trash2, MessageCircle } from 'lucide-react';
import { ADMIN_EMAILS } from '../config/Constants';
import { toast } from 'react-toastify';

// Custom date formatting function
const formatDate = (date) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
};

// Constants untuk excluded actions
const EXCLUDED_ACTIONS = [
  'UNAUTHORIZED_LOGOUT',
  'USER_LOGIN',
  'USER_LOGOUT'
];

// Action labels mapping
const ACTION_LABELS = {
  PROFILE_UPDATE: 'Profil Diperbarui',
  SPEED_UPDATE: 'Kecepatan Diperbarui',
  NEWS_ADD: 'Berita Ditambahkan',
  EDIT_NEWS: 'Berita Diedit',
  DELETE_NEWS: 'Berita Dihapus',
  COMMENT_ADD: 'Komentar Ditambahkan',
  COMMENT_DELETE: 'Komentar Dihapus',
  REPLY_COMMENT: 'Balasan Komentar Ditambahkan',
  LIKE_COMMENT: 'Komentar Disukai/Dibatalkan',
  USER_ADD: 'Pengguna Ditambahkan',
  USER_EDIT: 'Pengguna Diedit',
  USER_DELETE: 'Pengguna Dihapus',
  NOTIFICATION_ADD: 'Notifikasi Ditambahkan',
  NOTIFICATION_EDIT: 'Notifikasi Diedit',
  NOTIFICATION_DELETE: 'Notifikasi Dihapus',
  NOTIFICATION_SENT: 'Notifikasi Dikirim',
  VIEWS_UPDATED: 'Views Diperbarui',
  UNAUTHORIZED_ACCESS: 'Akses Tanpa Izin',
  AUTH_ERROR: 'Error Otorisasi',
  DATA_EXPORT: 'Data Diekspor',
  DATA_IMPORT: 'Data Diimpor',
  BACKUP_CREATED: 'Backup Dibuat',
  SYSTEM_MAINTENANCE: 'Pemeliharaan Sistem',
  LIKE_NEWS: 'Berita Disukai/Dibatalkan',
  SAVE_NEWS: 'Berita Disimpan',
  UNSAVE_NEWS: 'Berita Dihapus dari Tersimpan'
};

// Utility function to check if user is admin
const isAdminUser = (userEmail, details) => {
  if (ADMIN_EMAILS.includes(userEmail)) {
    return true;
  }
  if (details && (details.isAdmin === true || details.adminStatus === true || details.admin === true)) {
    return true;
  }
  return false;
};

// Utility function to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Waktu tidak tersedia';
  
  try {
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Format waktu tidak valid';
    }
    
    if (isNaN(date.getTime())) {
      return 'Tanggal tidak valid';
    }
    
    return formatDate(date);
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Error format waktu';
  }
};

// Hook untuk fetch news title
const useNewsTitle = (newsId) => {
  const [title, setTitle] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!newsId) return;

    const fetchNewsTitle = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'news', newsId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.judul || data.title || 'Judul tidak tersedia');
        } else {
          setTitle('Berita tidak ditemukan');
        }
      } catch (error) {
        console.error('Error fetching news title:', error);
        setTitle('Error mengambil judul');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsTitle();
  }, [newsId]);

  return { title, loading };
};

// Enhanced Modal Component with animations
const DeleteModal = ({ isOpen, onClose, onConfirm, title, message }) => {
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

const LogActivity = () => {
  const [logs, setLogs] = useState([]);
  const [expandedLogs, setExpandedLogs] = useState({});
  const [showExcluded, setShowExcluded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', id: null });

  useEffect(() => {
    const q = query(
      collection(db, 'logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(fetchedLogs);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching logs:', err);
      setError('Gagal memuat log aktivitas.');
      setLoading(false);
      toast.error('Gagal memuat log aktivitas.');
    });

    return () => unsubscribe();
  }, []);

  const toggleExpandLog = (logId) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const handleDeleteLog = async (logId) => {
    setDeleteModal({
      isOpen: true,
      type: 'single',
      id: logId,
      title: 'Hapus Log',
      message: 'Yakin ingin menghapus log ini? Tindakan ini tidak dapat dibatalkan.'
    });
  };

  const confirmDeleteLog = async () => {
    const { id } = deleteModal;
    try {
      await deleteDoc(doc(db, 'logs', id));
      setLogs(prev => prev.filter(log => log.id !== id));
      toast.success('Log berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting log:', error);
      setError('Gagal menghapus log.');
      toast.error('Gagal menghapus log.');
    } finally {
      setDeleteModal({ isOpen: false, type: '', id: null });
    }
  };

  const handleDeleteAllLogs = async () => {
    setDeleteModal({
      isOpen: true,
      type: 'all',
      id: null,
      title: 'Hapus Semua Log',
      message: 'Yakin ingin menghapus semua log aktivitas? Tindakan ini tidak dapat dibatalkan dan akan menghapus seluruh riwayat aktivitas.'
    });
  };

  const confirmDeleteAllLogs = async () => {
    setIsDeletingAll(true);
    try {
      const logsQuery = query(collection(db, 'logs'));
      const logsSnapshot = await getDocs(logsQuery);
      const batch = logsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(batch);
      setLogs([]);
      setError(null);
      toast.success('Semua log berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting all logs:', error);
      setError('Gagal menghapus semua log.');
      toast.error('Gagal menghapus semua log.');
    } finally {
      setIsDeletingAll(false);
      setDeleteModal({ isOpen: false, type: '', id: null });
    }
  };

  const filteredLogs = useMemo(() => {
    let result = logs;

    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(log => {
        const actionLabel = ACTION_LABELS[log.action] || log.action;
        const detailsStr = log.details ? JSON.stringify(log.details).toLowerCase() : '';
        const timestampStr = formatTimestamp(log.timestamp).toLowerCase();
        return (
          log.userEmail?.toLowerCase().includes(lowerQuery) ||
          actionLabel.toLowerCase().includes(lowerQuery) ||
          detailsStr.includes(lowerQuery) ||
          timestampStr.includes(lowerQuery)
        );
      });
    }

    // Apply action filter
    if (selectedAction) {
      result = result.filter(log => log.action === selectedAction);
    }

    // Apply date range filter
    if (dateFrom || dateTo) {
      result = result.filter(log => {
        if (!log.timestamp) return false;
        const logDate = log.timestamp.toDate();
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
        return (!from || logDate >= from) && (!to || logDate <= to);
      });
    }

    // Apply excluded actions filter
    if (!showExcluded) {
      result = result.filter(log => !EXCLUDED_ACTIONS.includes(log.action));
    }

    return result;
  }, [logs, showExcluded, searchQuery, selectedAction, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-indigo-600 font-medium animate-pulse">Memuat log aktivitas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-xl max-w-md w-full mx-4 animate-slideUp">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-red-800">Terjadi Kesalahan</h3>
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center space-x-4 animate-slideRight">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Log Aktivitas</h1>
              <p className="text-indigo-100 text-lg">Pantau semua aktivitas sistem dan pengguna</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        {/* Filter Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8 animate-slideUp">
          <div className="flex items-center space-x-3 mb-6">
            <Filter className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Filter & Pencarian</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors duration-200 group-focus-within:text-indigo-600" />
              <input
                type="text"
                placeholder="Cari log aktivitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div className="relative">
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="appearance-none w-full py-4 px-4 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-gray-900"
              >
                <option value="" className="text-gray-900">Semua Aksi</option>
                {Object.keys(ACTION_LABELS).map(action => (
                  <option key={action} value={action} className="text-gray-900">{ACTION_LABELS[action]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 pointer-events-none" />
            </div>
            
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors duration-200 group-focus-within:text-indigo-600" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full transition-all duration-200 bg-white text-gray-900"
              />
            </div>
            
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors duration-200 group-focus-within:text-indigo-600" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full transition-all duration-200 bg-white text-gray-900"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Menampilkan {filteredLogs.length} dari {logs.length} log</span>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setShowExcluded(!showExcluded)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                  showExcluded 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {showExcluded ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                <span>{showExcluded ? 'Sembunyikan Log Sistem' : 'Tampilkan Log Sistem'}</span>
              </button>
              
              <button
                onClick={handleDeleteAllLogs}
                disabled={isDeletingAll || logs.length === 0}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                  isDeletingAll || logs.length === 0
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                <Trash className="w-5 h-5" />
                <span>{isDeletingAll ? 'Menghapus...' : 'Hapus Semua Log'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Logs Display */}
        {filteredLogs.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl shadow-xl border border-gray-200 animate-slideUp">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2already">Tidak Ada Log</h3>
            <p className="text-gray-600">Belum ada log aktivitas yang cocok dengan filter yang dipilih.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-x-auto animate-slideUp">
            <div className="divide-y divide-gray-100">
              {filteredLogs.map((log, index) => (
                <LogItem
                  key={log.id}
                  log={log}
                  expanded={!!expandedLogs[log.id]}
                  toggleExpand={() => toggleExpandLog(log.id)}
                  onDelete={() => handleDeleteLog(log.id)}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        <DeleteModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, type: '', id: null })}
          onConfirm={deleteModal.type === 'single' ? confirmDeleteLog : confirmDeleteAllLogs}
          title={deleteModal.title}
          message={deleteModal.message}
        />
      </div>
      
      <div className="h-16"></div> {/* Bottom spacing */}
    </div>
  );
};

const LogItem = ({ log, expanded, toggleExpand, onDelete, index }) => {
  const { title, loading: titleLoading } = useNewsTitle(log.details?.newsId || log.details?.articleId);

  const getActionDescription = () => {
    const actionLabel = ACTION_LABELS[log.action] || log.action;
    const userEmail = log.userEmail || 'Pengguna tidak diketahui';
    const isAdmin = isAdminUser(log.userEmail, log.details);
    const adminLabel = isAdmin ? ' (Admin)' : '';

    switch (log.action) {
      case 'PROFILE_UPDATE':
        return `${userEmail}${adminLabel} memperbarui profil`;
      case 'LIKE_NEWS':
        return `${userEmail}${adminLabel} ${
          log.details.actionType === 'like' ? 'menyukai' : 'membatalkan like pada'
        } berita "${titleLoading ? 'Memuat judul...' : title || 'Judul tidak tersedia'}"`;
      case 'SAVE_NEWS':
        return `${userEmail}${adminLabel} menyimpan berita "${
          titleLoading ? 'Memuat judul...' : title || 'Judul tidak tersedia'
        }"`;
      case 'UNSAVE_NEWS':
        return `${userEmail}${adminLabel} batal simpan berita "${
          titleLoading ? 'Memuat judul...' : title || 'Judul tidak tersedia'
        }"`;
      case 'COMMENT_ADD':
        return `${userEmail}${adminLabel} menambahkan komentar pada berita "${
          titleLoading ? 'Memuat judul...' : title || 'Judul tidak tersedia'
        }"`;
      case 'COMMENT_DELETE':
        return `${userEmail}${adminLabel} menghapus komentar pada berita "${
          titleLoading ? 'Memuat judul...' : title || 'Judul tidak tersedia'
        }"`;
      case 'REPLY_COMMENT':
        return `${userEmail}${adminLabel} membalas komentar dari "${
          log.details.replyToEmail || 'Anonim'
        }" pada berita "${titleLoading ? 'Memuat judul...' : title || 'Judul tidak tersedia'}"`;
      case 'LIKE_COMMENT':
        return `${userEmail}${adminLabel} ${
          log.details.actionType === 'like' ? 'menyukai' : 'membatalkan like pada'
        } komentar di berita "${titleLoading ? 'Memuat judul...' : title || 'Judul tidak tersedia'}"`;
      case 'SPEED_UPDATE':
        return `${userEmail}${adminLabel} memperbarui pengaturan kecepatan`;
      case 'NEWS_ADD':
        return `${userEmail}${adminLabel} menambahkan berita baru`;
      case 'EDIT_NEWS':
        return `${userEmail}${adminLabel} mengedit berita "${
          titleLoading ? 'Memuat judul...' : title || 'Judul tidak tersedia'
        }"`;
      case 'DELETE_NEWS':
        return `${userEmail}${adminLabel} menghapus berita "${
          titleLoading ? 'Memuat judul...' : title || 'Judul tidak tersedia'
        }"`;
      default:
        return `${userEmail}${adminLabel} melakukan aksi: ${actionLabel}`;
    }
  };

  const getActionIcon = () => {
    switch (log.action) {
      case 'LIKE_NEWS':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'SAVE_NEWS':
        return <Bookmark className="w-5 h-5 text-blue-500" />;
      case 'UNSAVE_NEWS':
        return <BookmarkX className="w-5 h-5 text-gray-500" />;
      case 'COMMENT_ADD':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'COMMENT_DELETE':
        return <Trash2 className="w-5 h-5 text-red-500" />;
      case 'REPLY_COMMENT':
        return <MessageCircle className="w-5 h-5 text-green-600" />;
      case 'LIKE_COMMENT':
        return <Heart className="w-5 h-5 text-red-400" />;
      case 'NEWS_ADD':
        return <PlusCircle className="w-5 h-5 text-green-500" />;
      case 'EDIT_NEWS':
        return <Edit3 className="w-5 h-5 text-blue-500" />;
      case 'DELETE_NEWS':
        return <Trash2 className="w-5 h-5 text-red-500" />;
      case 'PROFILE_UPDATE':
        return <User className="w-5 h-5 text-blue-500" />;
      case 'SPEED_UPDATE':
        return <Activity className="w-5 h-5 text-purple-500" />;
      case 'NOTIFICATION_ADD':
        return <PlusCircle className="w-5 h-5 text-green-500" />;
      case 'NOTIFICATION_SENT':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'VIEWS_UPDATED':
        return <Eye className="w-5 h-5 text-blue-500" />;
      case 'DATA_EXPORT':
        return <PlusCircle className="w-5 h-5 text-green-500" />;
      case 'DATA_IMPORT':
        return <PlusCircle className="w-5 h-5 text-green-500" />;
      case 'BACKUP_CREATED':
        return <PlusCircle className="w-5 h-5 text-green-500" />;
      case 'SYSTEM_MAINTENANCE':
        return <Activity className="w-5 h-5 text-gray-500" />;
      case 'USER_ADD':
        return <User className="w-5 h-5 text-green-500" />;
      case 'USER_EDIT':
        return <Edit3 className="w-5 h-5 text-blue-500" />;
      case 'USER_DELETE':
        return <Trash2 className="w-5 h-5 text-red-500" />;
      case 'UNAUTHORIZED_ACCESS':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'AUTH_ERROR':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (log.action) {
      case 'DELETE_NEWS':
      case 'COMMENT_DELETE':
      case 'USER_DELETE':
      case 'NOTIFICATION_DELETE':
      case 'UNAUTHORIZED_ACCESS':
      case 'AUTH_ERROR':
        return 'bg-red-50 border-red-200';
      case 'NEWS_ADD':
      case 'COMMENT_ADD':
      case 'REPLY_COMMENT':
      case 'USER_ADD':
      case 'NOTIFICATION_ADD':
      case 'NOTIFICATION_SENT':
        return 'bg-green-50 border-green-200';
      case 'EDIT_NEWS':
      case 'PROFILE_UPDATE':
      case 'SPEED_UPDATE':
      case 'NOTIFICATION_EDIT':
      case 'USER_EDIT':
        return 'bg-blue-50 border-blue-200';
      case 'LIKE_NEWS':
      case 'LIKE_COMMENT':
      case 'SAVE_NEWS':
      case 'UNSAVE_NEWS':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div 
      className={`p-6 hover:bg-gray-50 transition-all duration-300 ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
      } transform hover:scale-[1.01] animate-fadeInUp min-w-[800px]`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${getStatusColor()}`}>
            {getActionIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {ACTION_LABELS[log.action] || log.action}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isAdminUser(log.userEmail, log.details) 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isAdminUser(log.userEmail, log.details) ? 'Admin' : 'User'}
              </span>
            </div>
            
            <p className="text-gray-700 mb-3 leading-relaxed">
              {getActionDescription()}
            </p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500 flex-wrap gap-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{log.userEmail || 'Email tidak tersedia'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{formatTimestamp(log.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={toggleExpand}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
            title={expanded ? 'Sembunyikan detail' : 'Lihat detail'}
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
            )}
          </button>
          
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-50 rounded-lg transition-all duration-200 group"
            title="Hapus log ini"
          >
            <Trash className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
          </button>
        </div>
      </div>
      
      {expanded && <EnhancedActivityDetails details={log.details} action={log.action} />}
    </div>
  );
};

// Component Enhanced Activity Details dengan UI yang lebih baik
const EnhancedActivityDetails = ({ details, action }) => {
  const getDetailValue = (key, value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">Tidak tersedia</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? '✓ Ya' : '✗ Tidak'}
        </span>
      );
    }

    if (key.toLowerCase().includes('timestamp') || key.toLowerCase().includes('time')) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formatDate(date)}</span>
            </div>
          );
        }
      } catch (e) {
        // Continue to default handling
      }
    }

    if (key.toLowerCase().includes('email') && typeof value === 'string' && value.includes('@')) {
      return (
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{value}</span>
        </div>
      );
    }

    if (key.toLowerCase().includes('id') && typeof value === 'string') {
      return (
        <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded border">
          {value}
        </span>
      );
    }

    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('www'))) {
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
        >
          {value}
        </a>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div className="bg-gray-50 rounded-lg p-3 mt-2">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      );
    }

    if (typeof value === 'string' && value.length > 100) {
      return (
        <div className="bg-gray-50 rounded-lg p-3 mt-2">
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
            {value}
          </p>
        </div>
      );
    }

    return <span className="break-words">{String(value)}</span>;
  };

  const getFieldIcon = (key) => {
    const iconMap = {
      newsId: '📄',
      articleId: '📰',
      userId: '👤',
      userEmail: '📧',
      commentId: '💬',
      parentId: '↳',
      replyToEmail: '📧',
      actionType: '⚡',
      timestamp: '🕒',
      isAdmin: '👑',
      previousValue: '📝',
      newValue: '✨',
      ipAddress: '🌐',
      userAgent: '🖥️',
      deviceInfo: '📱',
      location: '📍',
      sessionId: '🔗',
      content: '📜',
      text: '📜',
      title: '📝',
      category: '🏷️',
      status: '⚙️',
      priority: '🔝'
    };
    return iconMap[key] || '📋';
  };

  const getFieldLabel = (key) => {
    const labelMap = {
      newsId: 'ID Berita',
      articleId: 'ID Artikel', 
      userId: 'ID Pengguna',
      userEmail: 'Email Pengguna',
      commentId: 'ID Komentar',
      parentId: 'ID Komentar Induk',
      replyToEmail: 'Email Dibalas',
      actionType: 'Jenis Aksi',
      timestamp: 'Waktu',
      isAdmin: 'Status Admin',
      previousValue: 'Nilai Sebelumnya',
      newValue: 'Nilai Baru',
      ipAddress: 'Alamat IP',
      userAgent: 'User Agent',
      deviceInfo: 'Info Device',
      location: 'Lokasi',
      sessionId: 'ID Sesi',
      content: 'Konten',
      text: 'Teks Komentar',
      title: 'Judul',
      category: 'Kategori',
      status: 'Status',
      priority: 'Prioritas'
    };
    return labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
  };

  const getActionIcon = () => {
    const iconMap = {
      'LIKE_NEWS': <Heart className="w-5 h-5 text-red-500" />,
      'SAVE_NEWS': <Bookmark className="w-5 h-5 text-blue-500" />,
      'UNSAVE_NEWS': <BookmarkX className="w-5 h-5 text-gray-500" />,
      'COMMENT_ADD': <MessageSquare className="w-5 h-5 text-green-500" />,
      'COMMENT_DELETE': <Trash2 className="w-5 h-5 text-red-500" />,
      'REPLY_COMMENT': <MessageCircle className="w-5 h-5 text-green-600" />,
      'LIKE_COMMENT': <Heart className="w-5 h-5 text-red-400" />,
      'NEWS_ADD': <PlusCircle className="w-5 h-5 text-green-500" />,
      'EDIT_NEWS': <Edit3 className="w-5 h-5 text-blue-500" />,
      'DELETE_NEWS': <Trash2 className="w-5 h-5 text-red-500" />,
      'PROFILE_UPDATE': <User className="w-5 h-5 text-blue-500" />,
      'SPEED_UPDATE': <Activity className="w-5 h-5 text-purple-500" />,
      'NOTIFICATION_ADD': <PlusCircle className="w-5 h-5 text-green-500" />,
      'NOTIFICATION_SENT': <MessageSquare className="w-5 h-5 text-blue-500" />,
      'VIEWS_UPDATED': <Eye className="w-5 h-5 text-blue-500" />,
      'DATA_EXPORT': <PlusCircle className="w-5 h-5 text-green-500" />,
      'DATA_IMPORT': <PlusCircle className="w-5 h-5 text-green-500" />,
      'BACKUP_CREATED': <PlusCircle className="w-5 h-5 text-green-500" />,
      'SYSTEM_MAINTENANCE': <Activity className="w-5 h-5 text-gray-500" />,
      'USER_ADD': <User className="w-5 h-5 text-green-500" />,
      'USER_EDIT': <Edit3 className="w-5 h-5 text-blue-500" />,
      'USER_DELETE': <Trash2 className="w-5 h-5 text-red-500" />,
      'UNAUTHORIZED_ACCESS': <AlertCircle className="w-5 h-5 text-red-500" />,
      'AUTH_ERROR': <AlertCircle className="w-5 h-5 text-red-500" />
    };
    return iconMap[action] || <Activity className="w-5 h-5 text-gray-500" />;
  };

  const validDetails = Object.entries(details || {}).filter(([key, value]) => 
    value !== null && value !== undefined && value !== ''
  );

  return (
    <div className="mt-6 animate-slideDown">
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
            {getActionIcon()}
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900">Detail Aktivitas</h4>
            <p className="text-sm text-gray-600">Informasi lengkap tentang aktivitas ini</p>
          </div>
        </div>
        
        {validDetails.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {validDetails.map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg p-4 border border-gray-100 hover:shadow-sm transition-shadow duration-200">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm">{getFieldIcon(key)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm mb-2">
                      {getFieldLabel(key)}
                    </div>
                    <div className="text-gray-700 text-sm">
                      {getDetailValue(key, value)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <h5 className="text-lg font-semibold text-gray-600 mb-2">Tidak Ada Detail Tambahan</h5>
            <p className="text-gray-500">Aktivitas ini tidak memiliki informasi detail tambahan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogActivity;