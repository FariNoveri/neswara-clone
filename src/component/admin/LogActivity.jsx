import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebaseconfig';
import { collection, query, orderBy, onSnapshot, limit, doc, getDoc, deleteDoc, collection as firestoreCollection } from 'firebase/firestore';
import { ChevronDown, ChevronUp, Eye, EyeOff, Trash } from 'lucide-react';

// Custom date formatting function
const formatDate = (date) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
};

// Constants untuk admin emails
const ADMIN_EMAILS = [
  'cahayalunamaharani1@gmail.com',
  'fari_noveriwinanto@teknokrat.ac.id'
];

// Constants untuk excluded actions
const EXCLUDED_ACTIONS = [
  'ADMIN_LOGIN',
  'ADMIN_LOGOUT', 
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
  SYSTEM_MAINTENANCE: 'Pemeliharaan Sistem'
};

// Utility function to check if user is admin
const isAdminUser = (userEmail, details) => {
  return ADMIN_EMAILS.includes(userEmail) || details?.isAdmin === true;
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

// Component untuk menampilkan before/after values
const BeforeAfterDisplay = ({ oldValue, newValue, label }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!oldValue && !newValue) return null;

  const hasLongContent = (oldValue && oldValue.length > 50) || (newValue && newValue.length > 50);

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        {hasLongContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
          >
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{isExpanded ? 'Sembunyikan' : 'Lihat Detail'}</span>
          </button>
        )}
      </div>
      
      <div className="mt-2 space-y-2">
        {oldValue && (
          <div className="bg-red-50 p-2 rounded border-l-2 border-red-300">
            <div className="text-xs text-red-600 font-medium mb-1">Sebelum:</div>
            <div className="text-sm text-red-800">
              {hasLongContent && !isExpanded 
                ? `${oldValue.substring(0, 50)}...` 
                : oldValue
              }
            </div>
          </div>
        )}
        
        {newValue && (
          <div className="bg-green-50 p-2 rounded border-l-2 border-green-300">
            <div className="text-xs text-green-600 font-medium mb-1">Sesudah:</div>
            <div className="text-sm text-green-800">
              {hasLongContent && !isExpanded 
                ? `${newValue.substring(0, 50)}...` 
                : newValue
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Component untuk action description dengan news title fetching
const ActionDescription = ({ log }) => {
  const { action, details = {}, userEmail } = log;
  const isAdmin = isAdminUser(userEmail, details);
  const roleLabel = isAdmin ? 'Admin' : 'User';
  
  const newsId = details.newsId || details.id;
  const { title: fetchedTitle, loading: titleLoading } = useNewsTitle(newsId);
  
  const getActionDescription = () => {
    switch (action) {
      case 'PROFILE_UPDATE':
        return `memperbarui profil${details.type ? ` (${details.type})` : ''}`;
      
      case 'SPEED_UPDATE':
        const oldSpeed = details.oldSpeed || details.oldValue;
        const newSpeed = details.newSpeed || details.newValue;
        return `mengubah kecepatan global${oldSpeed ? ` dari ${oldSpeed} detik` : ''} menjadi ${newSpeed || 'N/A'} detik`;
      
      case 'NEWS_ADD':
        const newsTitle = fetchedTitle || details.title || details.judul || details.newsTitle;
        return `menambahkan berita "${titleLoading ? 'Memuat...' : newsTitle}"`;
      
      case 'EDIT_NEWS':
        const editedTitle = fetchedTitle || details.title || details.judul || details.newsTitle;
        return `mengedit berita "${titleLoading ? 'Memuat...' : editedTitle}"`;
      
      case 'DELETE_NEWS':
        const deletedTitle = fetchedTitle || details.title || details.judul || details.newsTitle;
        return `menghapus berita "${titleLoading ? 'Memuat...' : deletedTitle}"`;
      
      case 'COMMENT_ADD':
        const commentNewsTitle = fetchedTitle || details.newsTitle || details.title;
        return `menambahkan komentar untuk berita "${titleLoading ? 'Memuat...' : commentNewsTitle}"`;
      
      case 'COMMENT_DELETE':
        const commentDeletedNewsTitle = fetchedTitle || details.newsTitle || details.title;
        return `menghapus komentar dari berita "${titleLoading ? 'Memuat...' : commentDeletedNewsTitle}"`;
      
      case 'USER_ADD':
        return `menambahkan pengguna "${details.email || details.userEmail || 'Email tidak tersedia'}"`;
      
      case 'USER_EDIT':
        return `mengedit pengguna "${details.email || details.userEmail || 'Email tidak tersedia'}"`;
      
      case 'USER_DELETE':
        return `menghapus pengguna "${details.email || details.userEmail || 'Email tidak tersedia'}"`;
      
      case 'NOTIFICATION_ADD':
        return `menambahkan notifikasi "${details.title || details.message || 'Judul tidak tersedia'}"`;
      
      case 'NOTIFICATION_EDIT':
        return `mengedit notifikasi "${details.title || details.message || 'Judul tidak tersedia'}"`;
      
      case 'NOTIFICATION_DELETE':
        return `menghapus notifikasi "${details.title || details.message || 'Judul tidak tersedia'}"`;
      
      case 'NOTIFICATION_SENT':
        return `mengirim notifikasi "${details.message || details.title || 'Pesan tidak tersedia'}"`;
      
      case 'VIEWS_UPDATED':
        return `memperbarui total views menjadi ${details.totalViews || details.newValue || 'N/A'}`;
      
      case 'UNAUTHORIZED_ACCESS':
        return `mencoba akses tanpa izin${details.path ? ` ke ${details.path}` : ''}`;
      
      case 'AUTH_ERROR':
        return `mengalami error otorisasi: ${details.error || details.message || 'Error tidak diketahui'}`;
      
      case 'DATA_EXPORT':
        return `mengekspor data ${details.dataType || 'sistem'}`;
      
      case 'DATA_IMPORT':
        return `mengimpor data ${details.dataType || 'sistem'}`;
      
      case 'BACKUP_CREATED':
        return `membuat backup ${details.backupType || 'sistem'}`;
      
      case 'SYSTEM_MAINTENANCE':
        return `melakukan pemeliharaan sistem: ${details.description || 'Tidak ada deskripsi'}`;
      
      default:
        return `melakukan aksi "${ACTION_LABELS[action] || action.replace(/_/g, ' ').toLowerCase()}"`;
    }
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-900 mb-1">
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mr-2 ${
          isAdmin ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {roleLabel}
        </span>
        <span className="text-gray-700">{userEmail}</span>
      </p>
      <p className="text-sm text-gray-800 font-medium">
        {getActionDescription()}
      </p>
    </div>
  );
};

// Component untuk detail information dengan before/after
const DetailInformation = ({ details, action }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!details || Object.keys(details).length === 0) return null;

  const renderDetail = (key, value) => {
    if (!value || key === 'isAdmin' || key === 'newsId' || key === 'id') return null;
    
    const labelMap = {
      oldValue: 'Nilai Lama',
      newValue: 'Nilai Baru',
      oldSpeed: 'Kecepatan Lama',
      newSpeed: 'Kecepatan Baru',
      message: 'Pesan',
      email: 'Email',
      userEmail: 'Email Pengguna',
      totalViews: 'Total Views',
      title: 'Judul',
      judul: 'Judul',
      newsTitle: 'Judul Berita',
      type: 'Tipe',
      path: 'Path',
      error: 'Error',
      dataType: 'Tipe Data',
      backupType: 'Tipe Backup',
      description: 'Deskripsi',
      oldContent: 'Konten Lama',
      newContent: 'Konten Baru'
    };

    const label = labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
    
    return (
      <div key={key} className="text-xs text-gray-600 mb-1">
        <span className="font-medium">{label}:</span> {String(value)}
      </div>
    );
  };

  const hasBeforeAfter = (details.oldValue && details.newValue) || 
                        (details.oldSpeed && details.newSpeed) ||
                        (details.oldContent && details.newContent);

  const hasDetailedInfo = Object.keys(details).length > 2;

  return (
    <div className="mt-2">
      {details.oldValue && details.newValue && (
        <BeforeAfterDisplay 
          oldValue={details.oldValue} 
          newValue={details.newValue} 
          label="Perubahan Nilai" 
        />
      )}
      
      {details.oldSpeed && details.newSpeed && (
        <BeforeAfterDisplay 
          oldValue={`${details.oldSpeed} detik`} 
          newValue={`${details.newSpeed} detik`} 
          label="Perubahan Kecepatan" 
        />
      )}
      
      {details.oldContent && details.newContent && (
        <BeforeAfterDisplay 
          oldValue={details.oldContent} 
          newValue={details.newContent} 
          label="Perubahan Konten" 
        />
      )}

      {hasDetailedInfo && (
        <div className="mt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{isExpanded ? 'Sembunyikan Detail' : 'Lihat Detail Lainnya'}</span>
          </button>
          
          {isExpanded && (
            <div className="mt-2 pl-4 border-l-2 border-gray-200">
              {Object.entries(details)
                .filter(([key]) => !['oldValue', 'newValue', 'oldSpeed', 'newSpeed', 'oldContent', 'newContent', 'isAdmin', 'newsId', 'id'].includes(key))
                .map(([key, value]) => renderDetail(key, value))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LogActivity = () => {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadLimit, setLoadLimit] = useState(50);
  const [filters, setFilters] = useState({
    role: 'all',
    userEmail: '',
    action: 'all',
    dateRange: 'all'
  });

  // Real-time fetch for total logs
  useEffect(() => {
    const q = query(collection(db, 'logs'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTotalLogs(snapshot.size);
    }, (error) => {
      console.error('Error fetching total logs:', error);
      setTotalLogs(0);
    });
    return () => unsubscribe();
  }, []);

  // Fetch logs from Firestore
  useEffect(() => {
    const fetchLogs = () => {
      try {
        setLoading(true);
        setError(null);
        
        const q = query(
          collection(db, 'logs'),
          orderBy('timestamp', 'desc'),
          limit(loadLimit)
        );
        
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            try {
              const logsData = snapshot.docs
                .map(doc => {
                  const data = doc.data();
                  return {
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp || null
                  };
                })
                .filter(log => !EXCLUDED_ACTIONS.includes(log.action))
                .filter(log => log.action && log.userEmail && log.timestamp);
              
              console.log('Fetched logs:', logsData.length);
              setLogs(logsData);
              setLoading(false);
            } catch (processingError) {
              console.error('Error processing logs:', processingError);
              setError('Error memproses data log');
              setLoading(false);
            }
          },
          (firestoreError) => {
            console.error('Firestore error:', firestoreError);
            setError('Error mengambil data dari server');
            setLoading(false);
          }
        );

        return unsubscribe;
      } catch (setupError) {
        console.error('Error setting up log listener:', setupError);
        setError('Error menginisialisasi log');
        setLoading(false);
        return () => {};
      }
    };

    const unsubscribe = fetchLogs();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [loadLimit]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const isAdmin = isAdminUser(log.userEmail, log.details);
      
      const matchesRole = filters.role === 'all' || 
        (filters.role === 'admin' && isAdmin) ||
        (filters.role === 'user' && !isAdmin);
      
      const matchesUser = !filters.userEmail || 
        log.userEmail.toLowerCase().includes(filters.userEmail.toLowerCase());
      
      const matchesAction = filters.action === 'all' || log.action === filters.action;
      
      let matchesDate = true;
      if (filters.dateRange !== 'all' && log.timestamp) {
        const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        const now = new Date();
        const diffTime = now.getTime() - logDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (filters.dateRange) {
          case 'today':
            matchesDate = diffDays <= 1;
            break;
          case 'week':
            matchesDate = diffDays <= 7;
            break;
          case 'month':
            matchesDate = diffDays <= 30;
            break;
          default:
            matchesDate = true;
        }
      }
      
      return matchesRole && matchesUser && matchesAction && matchesDate;
    });
  }, [logs, filters]);

  const availableActions = useMemo(() => {
    const actions = [...new Set(logs.map(log => log.action))];
    return actions.sort();
  }, [logs]);

  const resetFilters = () => {
    setFilters({
      role: 'all',
      userEmail: '',
      action: 'all',
      dateRange: 'all'
    });
  };

  const loadMore = () => {
    setLoadLimit(prev => prev + 50);
  };

  const clearAllLogs = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua log? Aksi ini tidak dapat dibatalkan.')) {
      try {
        const q = query(collection(db, 'logs'));
        const snapshot = await onSnapshot(q, (querySnapshot) => {
          querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
          });
        });
        console.log('Semua log telah dihapus.');
      } catch (error) {
        console.error('Error menghapus log:', error);
        alert('Gagal menghapus log. Periksa konsol untuk detail.');
      }
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Memuat log aktivitas...</p>
          <p className="text-gray-500 text-sm">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Log Aktivitas</h3>
          <p className="text-gray-600 text-sm mt-1">
            Total: {totalLogs} log | Menampilkan {filteredLogs.length} dari {logs.length} log aktivitas
          </p>
        </div>
        <div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm mr-2"
          >
            Reset Filter
          </button>
          <button
            onClick={clearAllLogs}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            <Trash className="h-4 w-4 mr-2 inline" /> Hapus Semua Log
          </button>
        </div>
      </div>

      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-3">Filter Data</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="text"
              placeholder="Cari berdasarkan email..."
              value={filters.userEmail}
              onChange={(e) => setFilters({ ...filters, userEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aksi</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Aksi</option>
              {availableActions.map(action => (
                <option key={action} value={action}>
                  {ACTION_LABELS[action] || action}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="week">7 Hari Terakhir</option>
              <option value="month">30 Hari Terakhir</option>
            </select>
          </div>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak ada log ditemukan</h3>
          <p className="text-gray-500">
            {logs.length === 0 
              ? 'Belum ada aktivitas yang tercatat dalam sistem.'
              : 'Coba ubah filter untuk melihat log aktivitas lainnya.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log, index) => (
            <div
              key={log.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <ActionDescription log={log} />
                  <DetailInformation details={log.details} action={log.action} />
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {logs.length >= loadLimit && (
            <div className="text-center mt-6">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        .hover\\:animate-pulse:hover {
          animation: pulse 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default LogActivity;