import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebaseconfig';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Flag, Search, X, Filter, Calendar, Clock, User, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
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

// Confirmation Modal Component
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
            onConfirm={onConfirm}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium hover:scale-105 transform shadow-lg"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

// Report Item Component
const ReportItem = ({ report, expanded, toggleExpand, onDelete, index, logActivity }) => {
  const getStatusColor = () => {
    return 'bg-red-50 border-red-200'; // Reports are associated with negative actions
  };

  return (
    <div 
      className={`p-6 hover:bg-gray-50 transition-all duration-300 ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
      } transform hover:scale-[1.01] animate-fadeInUp`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${getStatusColor()}`}>
            <Flag className="w-5 h-5 text-red-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                Laporan: {report.reason || 'N/A'}
              </h3>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Laporan
              </span>
            </div>
            
            <p className="text-gray-700 mb-3 leading-relaxed">
              Konten: {report.reportedContent || 'N/A'}
            </p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{report.reporterEmail || 'Email tidak tersedia'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{formatTimestamp(report.createdAt)}</span>
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
            title="Hapus laporan ini"
          >
            <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
          </button>
        </div>
      </div>
      
      {expanded && <ReportDetails details={report} />}
    </div>
  );
};

// Report Details Component
const ReportDetails = ({ details }) => {
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

    if (key.toLowerCase().includes('timestamp') || key.toLowerCase().includes('createdat')) {
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
      reason: '📢',
      reportedContent: '📜',
      reporterEmail: '📧',
      createdAt: '🕒',
      userId: '👤',
      contentId: '📄',
      type: '🏷️',
      status: '⚙️'
    };
    return iconMap[key] || '📋';
  };

  const getFieldLabel = (key) => {
    const labelMap = {
      reason: 'Alasan Laporan',
      reportedContent: 'Konten yang Dilaporkan',
      reporterEmail: 'Email Pelapor',
      createdAt: 'Waktu Laporan',
      userId: 'ID Pengguna',
      contentId: 'ID Konten',
      type: 'Tipe Laporan',
      status: 'Status'
    };
    return labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
  };

  const validDetails = Object.entries(details || {}).filter(([key, value]) => 
    value !== null && value !== undefined && value !== ''
  );

  return (
    <div className="mt-6 animate-slideDown">
      <div className="bg-gradient-to-r from-gray-50 to-red-50 border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <Flag className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900">Detail Laporan</h4>
            <p className="text-sm text-gray-600">Informasi lengkap tentang laporan ini</p>
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
              <Flag className="w-8 h-8 text-gray-400" />
            </div>
            <h5 className="text-lg font-semibold text-gray-600 mb-2">Tidak Ada Detail Tambahan</h5>
            <p className="text-gray-500">Laporan ini tidak memiliki informasi detail tambahan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ReportManagement = ({ logActivity }) => {
  const [reports, setReports] = useState([]);
  const [expandedReports, setExpandedReports] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, type: '', id: null });

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const reportData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReports(reportData);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError('Gagal memuat laporan.');
        toast.error('Gagal memuat laporan.');
      }
      setLoading(false);
    };

    fetchReports();
  }, [logActivity]);

  const toggleExpandReport = (reportId) => {
    setExpandedReports(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  const handleDeleteReport = (reportId) => {
    setConfirmationModal({
      isOpen: true,
      type: 'single',
      id: reportId,
      title: 'Hapus Laporan',
      message: 'Yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.'
    });
  };

  const confirmDeleteReport = async () => {
    const { id } = confirmationModal;
    try {
      const reportDoc = await getDoc(doc(db, 'reports', id));
      if (reportDoc.exists()) {
        const reportData = reportDoc.data();
        await deleteDoc(doc(db, 'reports', id));
        setReports(prev => prev.filter(report => report.id !== id));
        await logActivity('DELETE_REPORT', { reportId: id, reportedContent: reportData.reportedContent || 'N/A' });
        toast.success('Laporan berhasil dihapus!');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      setError('Gagal menghapus laporan.');
      await logActivity('DELETE_REPORT_ERROR', { reportId: id, error: error.message });
      toast.error('Gagal menghapus laporan.');
    } finally {
      setConfirmationModal({ isOpen: false, type: '', id: null });
    }
  };

  const handleDeleteAllReports = async () => {
    setConfirmationModal({
      isOpen: true,
      type: 'all',
      id: null,
      title: 'Hapus Semua Laporan',
      message: 'Yakin ingin menghapus semua laporan? Tindakan ini tidak dapat dibatalkan dan akan menghapus seluruh riwayat laporan.'
    });
  };

  const confirmDeleteAllReports = async () => {
    setIsDeletingAll(true);
    try {
      const reportsQuery = query(collection(db, 'reports'));
      const reportsSnapshot = await getDocs(reportsQuery);
      const batch = reportsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(batch);
      setReports([]);
      setError(null);
      await logActivity('DELETE_ALL_REPORTS', { totalReportsDeleted: reportsSnapshot.docs.length });
      toast.success('Semua laporan berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting all reports:', error);
      setError('Gagal menghapus semua laporan.');
      await logActivity('DELETE_ALL_REPORTS_ERROR', { error: error.message });
      toast.error('Gagal menghapus semua laporan.');
    } finally {
      setIsDeletingAll(false);
      setConfirmationModal({ isOpen: false, type: '', id: null });
    }
  };

  const filteredReports = useMemo(() => {
    let result = reports;

    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(report => {
        const reason = report.reason?.toLowerCase() || '';
        const reportedContent = report.reportedContent?.toLowerCase() || '';
        const reporterEmail = report.reporterEmail?.toLowerCase() || '';
        const timestampStr = formatTimestamp(report.createdAt).toLowerCase();
        return (
          reason.includes(lowerQuery) ||
          reportedContent.includes(lowerQuery) ||
          reporterEmail.includes(lowerQuery) ||
          timestampStr.includes(lowerQuery)
        );
      });
    }

    // Apply date range filter
    if (dateFrom || dateTo) {
      result = result.filter(report => {
        if (!report.createdAt) return false;
        const reportDate = report.createdAt.toDate();
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
        return (!from || reportDate >= from) && (!to || reportDate <= to);
      });
    }

    return result;
  }, [reports, searchQuery, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-indigo-600 font-medium animate-pulse">Memuat laporan...</p>
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
              <Flag className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Kelola Laporan</h1>
              <p className="text-indigo-100 text-lg">Pantau dan kelola laporan pengguna</p>
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
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors duration-200 group-focus-within:text-indigo-600" />
              <input
                type="text"
                placeholder="Cari laporan (alasan, konten, email)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
              />
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
              <User className="w-4 h-4" />
              <span>Menampilkan {filteredReports.length} dari {reports.length} laporan</span>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleDeleteAllReports}
                disabled={isDeletingAll || reports.length === 0}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                  isDeletingAll || reports.length === 0
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                <Trash2 className="w-5 h-5" />
                <span>{isDeletingAll ? 'Menghapus...' : 'Hapus Semua Laporan'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reports Display */}
        {filteredReports.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl shadow-xl border border-gray-200 animate-slideUp">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Flag className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Laporan</h3>
            <p className="text-gray-600">Belum ada laporan yang cocok dengan filter yang dipilih.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slideUp">
            <div className="divide-y divide-gray-100">
              {filteredReports.map((report, index) => (
                <ReportItem
                  key={report.id}
                  report={report}
                  expanded={!!expandedReports[report.id]}
                  toggleExpand={() => toggleExpandReport(report.id)}
                  onDelete={() => handleDeleteReport(report.id)}
                  index={index}
                  logActivity={logActivity}
                />
              ))}
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal({ isOpen: false, type: '', id: null })}
          onConfirm={confirmationModal.type === 'single' ? confirmDeleteReport : confirmDeleteAllReports}
          title={confirmationModal.title}
          message={confirmationModal.message}
        />
      </div>
      
      <div className="h-16"></div> {/* Bottom spacing */}
    </div>
  );
};

export default ReportManagement;