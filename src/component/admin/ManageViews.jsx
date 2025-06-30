import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseconfig';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { Eye, RefreshCw, User, UserX, Trash, Shield, AlertCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';

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

const ManageViews = ({ logActivity, onViewsUpdated }) => {
  const [newsItems, setNewsItems] = useState([]);
  const [selectedNewsId, setSelectedNewsId] = useState('');
  const [selectedNewsTitle, setSelectedNewsTitle] = useState('');
  const [viewDetails, setViewDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalViews, setTotalViews] = useState(0);
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });

  useEffect(() => {
    fetchNewsItems();
  }, []);

  useEffect(() => {
    if (selectedNewsId) {
      fetchViewDetails(selectedNewsId);
    }
  }, [selectedNewsId]);

  const fetchNewsItems = async () => {
    setLoading(true);
    try {
      const newsSnapshot = await getDocs(collection(db, 'news'));
      const newsData = newsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        views: doc.data().views || 0, 
        judul: doc.data().judul 
      }));
      setNewsItems(newsData);
    } catch (err) {
      console.error('Error fetching news data:', err);
      setError('Gagal memuat data berita.');
      toast.error('Gagal memuat data berita.');
    }
    setLoading(false);
  };

  const fetchViewDetails = async (newsId) => {
    setLoading(true);
    try {
      const viewsSnapshot = await getDocs(
        query(collection(db, 'views'), where('newsId', '==', newsId))
      );
      
      const viewsData = [];
      let total = 0;
      
      for (const viewDoc of viewsSnapshot.docs) {
        const viewData = viewDoc.data();
        let userData = null;
        
        if (viewData.userId) {
          try {
            const userDoc = await getDocs(
              query(collection(db, 'users'), where('__name__', '==', viewData.userId))
            );
            if (!userDoc.empty) {
              userData = userDoc.docs[0].data();
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
        
        viewsData.push({
          id: viewDoc.id,
          ...viewData,
          userData,
          viewedAt: viewData.viewedAt?.toDate() || new Date()
        });
        
        total += viewData.count || 1;
      }
      
      viewsData.sort((a, b) => b.viewedAt - a.viewedAt);
      
      setViewDetails(viewsData);
      setTotalViews(total);
      
      const selectedNews = newsItems.find(item => item.id === newsId);
      setSelectedNewsTitle(selectedNews?.judul || '');
      
    } catch (err) {
      console.error('Error fetching view details:', err);
      setError('Gagal memuat detail views.');
      toast.error('Gagal memuat detail views.');
    }
    setLoading(false);
  };

  const handleResetViews = () => {
    if (!selectedNewsId) {
      toast.warn('Pilih berita untuk direset.');
      return;
    }

    setConfirmationModal({
      isOpen: true,
      type: 'single',
      id: selectedNewsId,
      title: 'Reset Views Berita',
      message: `Apakah Anda yakin ingin mereset semua views untuk berita "${selectedNewsTitle}"? Tindakan ini tidak dapat dibatalkan.`
    });
  };

  const confirmResetViews = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'news', selectedNewsId), {
        views: 0
      });

      const viewsSnapshot = await getDocs(
        query(collection(db, 'views'), where('newsId', '==', selectedNewsId))
      );
      
      const deletePromises = viewsSnapshot.docs.map(viewDoc => 
        deleteDoc(doc(db, 'views', viewDoc.id))
      );
      
      await Promise.all(deletePromises);

      logActivity('VIEWS_UPDATED', { newsId: selectedNewsId, title: selectedNewsTitle, action: 'reset', newTotal: 0 });
      toast.success('Views telah direset untuk berita ini.');
      
      await fetchNewsItems();
      await fetchViewDetails(selectedNewsId);
      
      if (onViewsUpdated) {
        onViewsUpdated();
      }
      
    } catch (err) {
      console.error('Error resetting views:', err);
      setError('Gagal mereset views.');
      toast.error('Gagal mereset views. Silakan coba lagi.');
    }
    setLoading(false);
    setConfirmationModal({ isOpen: false, type: '', id: null, title: '', message: '' });
  };

  const handleResetAllViews = () => {
    setConfirmationModal({
      isOpen: true,
      type: 'all',
      id: null,
      title: 'Reset Semua Views',
      message: 'Apakah Anda yakin ingin mereset SEMUA views untuk SEMUA berita? Tindakan ini tidak dapat dibatalkan.'
    });
  };

  const confirmResetAllViews = async () => {
    setLoading(true);
    try {
      const newsSnapshot = await getDocs(collection(db, 'news'));
      const updatePromises = newsSnapshot.docs.map(newsDoc => 
        updateDoc(doc(db, 'news', newsDoc.id), { views: 0 })
      );
      
      await Promise.all(updatePromises);

      const allViewsSnapshot = await getDocs(collection(db, 'views'));
      const deletePromises = allViewsSnapshot.docs.map(viewDoc => 
        deleteDoc(doc(db, 'views', viewDoc.id))
      );
      
      await Promise.all(deletePromises);

      logActivity('VIEWS_UPDATED', { action: 'reset_all', newTotal: 0 });
      toast.success('Semua views telah direset.');
      
      await fetchNewsItems();
      if (selectedNewsId) {
        await fetchViewDetails(selectedNewsId);
      }
      
      if (onViewsUpdated) {
        onViewsUpdated();
      }
      
    } catch (err) {
      console.error('Error resetting all views:', err);
      setError('Gagal mereset semua views.');
      toast.error('Gagal mereset semua views. Silakan coba lagi.');
    }
    setLoading(false);
    setConfirmationModal({ isOpen: false, type: '', id: null, title: '', message: '' });
  };

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
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  const getViewerName = (viewData) => {
    if (viewData.userData) {
      return viewData.userData.displayName || viewData.userData.email || 'User Terdaftar';
    }
    return viewData.userAgent ? 'Pengunjung Anonim' : 'Pengunjung Tidak Dikenal';
  };

  const getViewerInfo = (viewData) => {
    const info = [];
    if (viewData.userData?.email) {
      info.push(`Email: ${viewData.userData.email}`);
    }
    if (viewData.ipAddress) {
      info.push(`IP: ${viewData.ipAddress}`);
    }
    if (viewData.userAgent) {
      info.push(`Browser: ${viewData.userAgent.substring(0, 50)}...`);
    }
    return info.join(' | ');
  };

  if (loading && !newsItems.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-indigo-600 font-medium animate-pulse">Memuat data views...</p>
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
              <Eye className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Kelola Views</h1>
              <p className="text-indigo-100 text-lg">Pantau dan kelola data views berita</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8 animate-slideUp">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Eye className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Manajemen Views</h2>
            </div>
            <button
              onClick={handleResetAllViews}
              disabled={loading || newsItems.length === 0}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                loading || newsItems.length === 0
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <Trash className="w-5 h-5" />
              <span>{loading ? 'Menghapus...' : 'Reset Semua Views'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - News Selection */}
            <div className="space-y-6">
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                  <Eye className="h-4 w-4 mr-2 text-indigo-600" />
                  Pilih Berita
                </label>
                <select
                  value={selectedNewsId}
                  onChange={(e) => setSelectedNewsId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-200 text-gray-900"
                >
                  <option value="">Pilih Berita</option>
                  {newsItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.judul} ({item.views} views)
                    </option>
                  ))}
                </select>
              </div>

              {selectedNewsId && (
                <button
                  onClick={handleResetViews}
                  disabled={loading}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                    loading
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg'
                  }`}
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Reset Views Berita Ini</span>
                </button>
              )}

              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  Total Views per Berita
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {newsItems.map((item, index) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 animate-fadeInUp ${
                        selectedNewsId === item.id 
                          ? 'bg-indigo-50 border-indigo-200 shadow-lg' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => setSelectedNewsId(item.id)}
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-gray-900 truncate">
                          {item.judul}
                        </h5>
                        <div className="flex items-center text-sm text-gray-600">
                          <Eye className="h-4 w-4 mr-1" />
                          {item.views}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - View Details */}
            <div className="lg:col-span-2">
              {selectedNewsId ? (
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <h4 className="text-md font-semibold text-gray-800">
                      Detail Views: {selectedNewsTitle}
                    </h4>
                    <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                      Total: {totalViews} views
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin"></div>
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                      </div>
                    </div>
                  ) : viewDetails.length > 0 ? (
                    <div className="space-y-3 max-h-[32rem] overflow-y-auto">
                      {viewDetails.map((view, index) => (
                        <div 
                          key={view.id} 
                          className={`p-4 rounded-xl border-2 transition-all duration-300 animate-fadeInUp ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                {view.userData ? (
                                  <User className="h-5 w-5 text-indigo-600" />
                                ) : (
                                  <UserX className="h-5 w-5 text-gray-500" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {getViewerName(view)}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {getViewerInfo(view)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Dilihat: {formatDate(view.viewedAt)}
                                </div>
                                {view.count > 1 && (
                                  <div className="text-xs text-indigo-600 font-medium">
                                    Dilihat {view.count} kali
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-semibold text-gray-600">Data Privasi Terlindungi</p>
                      <p className="text-sm text-gray-500">Tidak ada riwayat viewing yang tersimpan untuk berita ini</p>
                      <p className="text-xs mt-2 text-gray-400">Informasi pengunjung dijaga kerahasiaannya</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <Eye className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold text-gray-600">Pilih Berita</p>
                  <p className="text-sm text-gray-500">untuk melihat detail views dan pengunjung</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, type: '', id: null, title: '', message: '' })}
        onConfirm={confirmationModal.type === 'single' ? confirmResetViews : confirmResetAllViews}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />

      <div className="h-16"></div> {/* Bottom spacing */}
    </div>
  );
};

export default ManageViews;