import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { db, auth } from '../../firebaseconfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { PlusCircle, Edit3, Trash2, Eye, EyeOff, Save, X, AlertCircle, Play, Pause, Gauge, Settings, Radio } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-700 mb-4">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-medium"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

const BreakingNewsAdmin = ({ logActivity }) => {
  const [breakingNews, setBreakingNews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSpeedModalOpen, setIsSpeedModalOpen] = useState(false);
  const [isSpeedWarningOpen, setIsSpeedWarningOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, id: null, title: '', message: '' });
  const [editingNews, setEditingNews] = useState(null);
  const [globalSpeed, setGlobalSpeed] = useState(15);
  const [formData, setFormData] = useState({
    text: '',
    isActive: true,
    priority: 1,
    speed: 15,
    isEmergency: false,
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchBreakingNews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'breakingNews'), orderBy('priority', 'asc'));
      const snapshot = await getDocs(q);
      const newsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
      }));
      setBreakingNews(newsData);
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      toast.error('Gagal memuat breaking news.');
      await logActivity('FETCH_BREAKING_NEWS_ERROR', { error: error.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBreakingNews();
  }, []);

  const handleAddNews = () => {
    setEditingNews(null);
    setFormData({ 
      text: '', 
      isActive: true, 
      priority: breakingNews.length + 1, 
      speed: globalSpeed,
      isEmergency: false,
    });
    setIsModalOpen(true);
  };

  const handleEditNews = (news) => {
    setEditingNews(news);
    setFormData({
      text: news.text,
      isActive: news.isActive,
      priority: news.priority,
      speed: globalSpeed,
      isEmergency: news.isEmergency || false,
    });
    setIsModalOpen(true);
  };

  const handleSaveNews = async () => {
    if (!formData.text.trim()) {
      toast.error('Teks breaking news tidak boleh kosong.');
      return;
    }

    const speedValue = parseInt(globalSpeed) || 15;
    if (speedValue < 5 || speedValue > 30) {
      setIsSpeedWarningOpen(true);
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('User tidak terautentikasi. Silakan login kembali.');
        setLoading(false);
        return;
      }

      const tokenResult = await user.getIdTokenResult(true);
      console.log('User claims in handleSaveNews:', tokenResult.claims);

      if (!tokenResult.claims.isAdmin) {
        toast.error('Anda tidak memiliki izin untuk mengubah breaking news.');
        setLoading(false);
        return;
      }

      if (formData.isEmergency) {
        const batch = writeBatch(db);
        breakingNews.forEach((news) => {
          if (!news.isEmergency && news.isActive) {
            const newsRef = doc(db, 'breakingNews', news.id);
            batch.update(newsRef, { isActive: false, updatedAt: serverTimestamp() });
          }
        });
        await batch.commit();
      }

      if (editingNews) {
        await updateDoc(doc(db, 'breakingNews', editingNews.id), {
          ...formData,
          speed: speedValue,
          updatedAt: serverTimestamp()
        });
        await logActivity('NEWS_EDIT', { 
          newsId: editingNews.id, 
          title: formData.text, 
          newSpeed: speedValue, 
          oldSpeed: editingNews.speed,
        });
        toast.success('Breaking news berhasil diperbarui.');
      } else {
        const docRef = await addDoc(collection(db, 'breakingNews'), {
          ...formData,
          speed: speedValue,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        await logActivity('NEWS_ADD', { 
          newsId: docRef.id, 
          title: formData.text, 
          newSpeed: speedValue,
        });
        toast.success('Breaking news berhasil ditambahkan.');
      }
      fetchBreakingNews();
      setIsModalOpen(false);
      setFormData({ 
        text: '', 
        isActive: true, 
        priority: 1, 
        speed: globalSpeed, 
        isEmergency: false,
      });
    } catch (error) {
      console.error('Error saving breaking news:', error);
      if (error.code === 'permission-denied') {
        toast.error('Izin ditolak: Anda tidak memiliki hak akses untuk mengubah breaking news.');
      } else {
        toast.error('Gagal menyimpan breaking news.');
      }
      await logActivity('SAVE_BREAKING_NEWS_ERROR', { error: error.message, title: formData.text });
    }
    setLoading(false);
  };

  const handleDeleteNews = (id, title) => {
    setConfirmationModal({
      isOpen: true,
      id,
      title: 'Hapus Breaking News',
      message: `Apakah Anda yakin ingin menghapus "${title}"? Tindakan ini tidak dapat dibatalkan.`
    });
  };

  const confirmDelete = async () => {
    const { id } = confirmationModal;
    if (!id) {
      toast.error('ID breaking news tidak valid.');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('User tidak terautentikasi. Silakan login kembali.');
        setLoading(false);
        return;
      }

      const tokenResult = await user.getIdTokenResult(true);
      console.log('User claims in confirmDelete:', tokenResult.claims);

      if (!tokenResult.claims.isAdmin) {
        toast.error('Anda tidak memiliki izin untuk menghapus breaking news.');
        setLoading(false);
        return;
      }

      await deleteDoc(doc(db, 'breakingNews', id));
      await logActivity('NEWS_DELETE', { newsId: id, title: confirmationModal.message });
      toast.success('Breaking news berhasil dihapus.');
      fetchBreakingNews();
    } catch (error) {
      console.error('Error deleting breaking news:', error);
      if (error.code === 'permission-denied') {
        toast.error('Izin ditolak: Anda tidak memiliki hak akses untuk menghapus.');
      } else {
        toast.error('Gagal menghapus breaking news.');
      }
      await logActivity('DELETE_BREAKING_NEWS_ERROR', { newsId: id, error: error.message });
    } finally {
      setLoading(false);
      setConfirmationModal({ isOpen: false, id: null, title: '', message: '' });
    }
  };

  const handleToggleActive = async (id, currentIsActive, isEmergency) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('User tidak terautentikasi. Silakan login kembali.');
        setLoading(false);
        return;
      }

      const tokenResult = await user.getIdTokenResult(true);
      console.log('User claims in handleToggleActive:', tokenResult.claims);

      if (!tokenResult.claims.isAdmin) {
        toast.error('Anda tidak memiliki izin untuk mengubah status breaking news.');
        setLoading(false);
        return;
      }

      if (isEmergency && !currentIsActive) {
        const batch = writeBatch(db);
        breakingNews.forEach((news) => {
          if (!news.isEmergency && news.isActive) {
            const newsRef = doc(db, 'breakingNews', news.id);
            batch.update(newsRef, { isActive: false, updatedAt: serverTimestamp() });
          }
        });
        await batch.commit();
      }

      await updateDoc(doc(db, 'breakingNews', id), {
        isActive: !currentIsActive,
        updatedAt: serverTimestamp()
      });
      await logActivity('TOGGLE_NEWS_STATUS', { newsId: id, newStatus: !currentIsActive });
      toast.success(`Breaking news ${!currentIsActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
      fetchBreakingNews();
    } catch (error) {
      console.error('Error toggling breaking news status:', error);
      if (error.code === 'permission-denied') {
        toast.error('Izin ditolak: Anda tidak memiliki hak akses untuk mengubah status.');
      } else {
        toast.error('Gagal mengubah status breaking news.');
      }
      await logActivity('TOGGLE_NEWS_STATUS_ERROR', { newsId: id, error: error.message });
    }
    setLoading(false);
  };

  const handleUpdateAllSpeeds = async () => {
    if (breakingNews.length === 0) {
      toast.info('Tidak ada breaking news untuk diperbarui.');
      setIsSpeedModalOpen(false);
      return;
    }

    const speedValue = parseInt(globalSpeed) || 15;
    if (speedValue < 5 || speedValue > 30) {
      setIsSpeedWarningOpen(true);
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('User tidak terautentikasi. Silakan login kembali.');
        setLoading(false);
        return;
      }

      const tokenResult = await user.getIdTokenResult(true);
      console.log('User claims in handleUpdateAllSpeeds:', tokenResult.claims);

      if (!tokenResult.claims.isAdmin) {
        toast.error('Anda tidak memiliki izin untuk memperbarui kecepatan global.');
        setLoading(false);
        return;
      }

      const batch = writeBatch(db);
      breakingNews.forEach((news) => {
        const newsRef = doc(db, 'breakingNews', news.id);
        batch.update(newsRef, {
          speed: speedValue,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      await logActivity('SPEED_UPDATE', { newSpeed: speedValue, count: breakingNews.length });
      toast.success(`Kecepatan semua breaking news diatur ke ${speedValue} detik.`);
      fetchBreakingNews();
      setIsSpeedModalOpen(false);
    } catch (error) {
      console.error('Error during batch update:', error);
      if (error.code === 'permission-denied') {
        toast.error('Izin ditolak: Anda tidak memiliki hak akses untuk memperbarui kecepatan.');
      } else {
        toast.error('Gagal memperbarui kecepatan global.');
      }
      await logActivity('SPEED_UPDATE_ERROR', { error: error.message, newSpeed: speedValue });
    } finally {
      setLoading(false);
    }
  };

  const handleSpeedWarningConfirm = async () => {
    const speedValue = parseInt(globalSpeed) || 15;
    const adjustedSpeed = Math.max(5, Math.min(30, speedValue));

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('User tidak terautentikasi. Silakan login kembali.');
        setLoading(false);
        return;
      }

      const tokenResult = await user.getIdTokenResult(true);
      console.log('User claims in handleSpeedWarningConfirm:', tokenResult.claims);

      if (!tokenResult.claims.isAdmin) {
        toast.error('Anda tidak memiliki izin untuk memperbarui kecepatan.');
        setLoading(false);
        return;
      }

      if (isSpeedModalOpen) {
        const batch = writeBatch(db);
        breakingNews.forEach((news) => {
          const newsRef = doc(db, 'breakingNews', news.id);
          batch.update(newsRef, {
            speed: adjustedSpeed,
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
        await logActivity('SPEED_UPDATE', { newSpeed: adjustedSpeed, count: breakingNews.length });
        toast.success(`Kecepatan semua breaking news diatur ke ${adjustedSpeed} detik.`);
        fetchBreakingNews();
        setIsSpeedModalOpen(false);
      } else if (isModalOpen) {
        setFormData(prev => ({ ...prev, speed: adjustedSpeed }));
        if (editingNews) {
          await updateDoc(doc(db, 'breakingNews', editingNews.id), {
            ...formData,
            speed: adjustedSpeed,
            updatedAt: serverTimestamp()
          });
          await logActivity('NEWS_EDIT', { 
            newsId: editingNews.id, 
            title: formData.text, 
            newSpeed: adjustedSpeed, 
            oldSpeed: editingNews.speed,
          });
          toast.success('Breaking news berhasil diperbarui.');
          fetchBreakingNews();
          setIsModalOpen(false);
          setFormData({ 
            text: '', 
            isActive: true, 
            priority: 1, 
            speed: globalSpeed,
            isEmergency: false,
          });
        } else {
          const docRef = await addDoc(collection(db, 'breakingNews'), {
            ...formData,
            speed: adjustedSpeed,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          await logActivity('NEWS_ADD', { 
            newsId: docRef.id, 
            title: formData.text, 
            newSpeed: adjustedSpeed,
          });
          toast.success('Breaking news berhasil ditambahkan.');
          fetchBreakingNews();
          setIsModalOpen(false);
          setFormData({ 
            text: '', 
            isActive: true, 
            priority: 1, 
            speed: globalSpeed,
            isEmergency: false,
          });
        }
      }
    } catch (error) {
      console.error('Error in speed warning confirmation:', error);
      if (error.code === 'permission-denied') {
        toast.error('Izin ditolak: Anda tidak memiliki hak akses untuk memperbarui kecepatan.');
      } else {
        toast.error('Gagal memproses kecepatan.');
      }
      await logActivity('SPEED_WARNING_CONFIRM_ERROR', { error: error.message });
    } finally {
      setIsSpeedWarningOpen(false);
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const activeNews = breakingNews.filter(news => news.isActive).sort((a, b) => a.priority - b.priority);
  const isEmergencyActive = activeNews.some(n => n.isEmergency);
  const speed = activeNews.length > 0 ? (activeNews[0].speed || globalSpeed) : globalSpeed;

  const emergencyNews = breakingNews.filter(news => news.isEmergency).sort((a, b) => a.priority - b.priority);
  const nonEmergencyNews = breakingNews.filter(news => !news.isEmergency).sort((a, b) => a.priority - b.priority);

  const newsContent = activeNews.map((news, index) => (
    `${news.text || 'Tidak ada teks'} ${index < activeNews.length - 1 ? ' - ' : ''}`
  )).join('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <Radio className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kelola Breaking News</h1>
                <p className="text-gray-600">Atur teks breaking news yang berjalan di navbar</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg ${
                  isPreviewMode 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                }`}
                disabled={loading}
              >
                {isPreviewMode ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Stop Preview</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Preview Live</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setIsSpeedModalOpen(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg"
                disabled={loading || breakingNews.length === 0}
              >
                <Gauge className="w-4 h-4" />
                <span>Kecepatan Global</span>
              </button>
              <button
                onClick={handleAddNews}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 shadow-lg"
                disabled={loading}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Breaking News</span>
              </button>
            </div>
          </div>
        </div>

        {isPreviewMode && activeNews.length > 0 && (
          <div className="mb-6">
            <div className={`bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border ${isEmergencyActive ? 'border-red-300 animate-pulse' : 'border-gray-200'} p-6`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="w-5 h-5 text-indigo-600 mr-2" />
                Live Preview
              </h3>
              <div className={`bg-gradient-to-r ${isEmergencyActive ? 'from-red-500 to-red-600' : 'from-indigo-500 to-purple-500'} rounded-xl overflow-hidden shadow-md`}>
                <div className="flex items-center py-3 px-4">
                  <span className={`bg-white ${isEmergencyActive ? 'text-red-600 animate-pulse' : 'text-indigo-600'} px-3 py-1 rounded-full text-xs font-bold mr-4 flex-shrink-0`}>
                    {isEmergencyActive ? 'DARURAT' : 'BREAKING'}
                  </span>
                  <div className="overflow-hidden flex-1">
                    <div 
                      className="breaking-news-text whitespace-nowrap text-white font-medium" 
                      style={{ 
                        animation: `marquee linear ${speed}s infinite`,
                        display: 'inline-block',
                        willChange: 'transform'
                      }}
                    >
                      {newsContent} {newsContent}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-6 transition-all duration-200 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Breaking News</p>
                <p className="text-2xl font-bold text-gray-900">{breakingNews.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Radio className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-6 transition-all duration-200 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Aktif</p>
                <p className="text-2xl font-bold text-green-600">{activeNews.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-6 transition-all duration-200 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Non-Aktif</p>
                <p className="text-2xl font-bold text-red-600">{breakingNews.length - activeNews.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <EyeOff className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-6 transition-all duration-200 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Rata-rata Kecepatan</p>
                <p className="text-2xl font-bold text-purple-600">
                  {breakingNews.length > 0 ? Math.round(breakingNews.reduce((acc, news) => acc + (news.speed || globalSpeed), 0) / breakingNews.length) : 0}s
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Gauge className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Breaking News Darurat</h2>
          </div>
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-100">
            <div className="sm:hidden space-y-2 p-4">
              {emergencyNews.length === 0 ? (
                <div className="text-center py-6">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Radio className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">Tidak Ada Breaking News Darurat</h3>
                    <p className="text-gray-600 text-xs">Belum ada breaking news darurat yang tersedia.</p>
                  </div>
                </div>
              ) : (
                emergencyNews.map((news, index) => (
                  <div 
                    key={news.id} 
                    className="bg-white rounded-lg shadow-md p-3 border border-gray-200"
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-start">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{news.text || 'Tidak ada teks'}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleToggleActive(news.id, news.isActive, true)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 touch-target ${
                            news.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                          disabled={loading}
                        >
                          {news.isActive ? (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Non-Aktif
                            </>
                          )}
                        </button>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          news.priority <= 2 ? 'bg-red-100 text-red-800' : news.priority <= 4 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          #{news.priority}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {news.speed || globalSpeed}s
                        </span>
                        <div className="text-xs text-gray-600">{formatDate(news.updatedAt)}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditNews(news)}
                          className="text-indigo-600 hover:text-indigo-900 transition-all duration-200 hover:scale-110 touch-target"
                          title="Edit"
                          disabled={loading}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNews(news.id, news.text)}
                          className="text-red-600 hover:text-red-900 transition-all duration-200 hover:scale-110 touch-target"
                          title="Hapus"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <table className="min-w-full divide-y divide-gray-100 hidden sm:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Breaking News</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Prioritas</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Kecepatan (detik)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Terakhir Update</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {emergencyNews.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Radio className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Breaking News Darurat</h3>
                        <p className="text-gray-600">Belum ada breaking news darurat yang tersedia.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  emergencyNews.map((news, index) => (
                    <tr 
                      key={news.id} 
                      className={`transition-all duration-300 transform hover:scale-[1.01] ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{news.text || 'Tidak ada teks'}</p>
                            <p className="text-xs text-gray-500 mt-1">ID: {news.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(news.id, news.isActive, true)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${
                            news.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                          disabled={loading}
                        >
                          {news.isActive ? (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 mr-1" />
                              Non-Aktif
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          news.priority <= 2 ? 'bg-red-100 text-red-800' : news.priority <= 4 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          #{news.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {news.speed || globalSpeed}s
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(news.updatedAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleEditNews(news)}
                            className="text-indigo-600 hover:text-indigo-900 transition-all duration-200 hover:scale-110"
                            title="Edit"
                            disabled={loading}
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNews(news.id, news.text)}
                            className="text-red-600 hover:text-red-900 transition-all duration-200 hover:scale-110"
                            title="Hapus"
                            disabled={loading}
                          >
                            <Trash2 className="w-5 h-5" />
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

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Breaking News Non-Darurat</h2>
          </div>
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-100">
            <div className="sm:hidden space-y-2 p-4">
              {nonEmergencyNews.length === 0 ? (
                <div className="text-center py-6">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Radio className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">Tidak Ada Breaking News Non-Darurat</h3>
                    <p className="text-gray-600 text-xs">Belum ada breaking news non-darurat yang tersedia.</p>
                  </div>
                </div>
              ) : (
                nonEmergencyNews.map((news, index) => (
                  <div 
                    key={news.id} 
                    className="bg-white rounded-lg shadow-md p-3 border border-gray-200"
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-start">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{news.text || 'Tidak ada teks'}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleToggleActive(news.id, news.isActive, false)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 touch-target ${
                            news.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                          disabled={loading || (isEmergencyActive && !news.isActive)}
                        >
                          {news.isActive ? (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Non-Aktif
                            </>
                          )}
                        </button>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          news.priority <= 2 ? 'bg-red-100 text-red-800' : news.priority <= 4 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          #{news.priority}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {news.speed || globalSpeed}s
                        </span>
                        <div className="text-xs text-gray-600">{formatDate(news.updatedAt)}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditNews(news)}
                          className="text-indigo-600 hover:text-indigo-900 transition-all duration-200 hover:scale-110 touch-target"
                          title="Edit"
                          disabled={loading}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNews(news.id, news.text)}
                          className="text-red-600 hover:text-red-900 transition-all duration-200 hover:scale-110 touch-target"
                          title="Hapus"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <table className="min-w-full divide-y divide-gray-100 hidden sm:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Breaking News</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Prioritas</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Kecepatan (detik)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Terakhir Update</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {nonEmergencyNews.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Radio className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Breaking News Non-Darurat</h3>
                        <p className="text-gray-600">Belum ada breaking news non-darurat yang tersedia.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  nonEmergencyNews.map((news, index) => (
                    <tr 
                      key={news.id} 
                      className={`transition-all duration-300 transform hover:scale-[1.01] ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{news.text || 'Tidak ada teks'}</p>
                            <p className="text-xs text-gray-500 mt-1">ID: {news.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(news.id, news.isActive, false)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${
                            news.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                          disabled={loading || (isEmergencyActive && !news.isActive)}
                        >
                          {news.isActive ? (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 mr-1" />
                              Non-Aktif
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          news.priority <= 2 ? 'bg-red-100 text-red-800' : news.priority <= 4 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          #{news.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {news.speed || globalSpeed}s
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(news.updatedAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleEditNews(news)}
                            className="text-indigo-600 hover:text-indigo-900 transition-all duration-200 hover:scale-110"
                            title="Edit"
                            disabled={loading}
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNews(news.id, news.text)}
                            className="text-red-600 hover:text-red-900 transition-all duration-200 hover:scale-110"
                            title="Hapus"
                            disabled={loading}
                          >
                            <Trash2 className="w-5 h-5" />
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

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">
                    {editingNews ? 'Edit Breaking News' : 'Tambah Breaking News'}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-all duration-200"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Teks Breaking News
                  </label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Masukkan teks breaking news... (gunakan emoji untuk menarik perhatian)"
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-300 text-xs placeholder-gray-500 resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Gunakan emoji seperti 🔴, ⚡, 🏆 untuk membuat breaking news lebih menarik
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                      className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-300 text-xs"
                    >
                      <option value={true}>Aktif</option>
                      <option value={false}>Non-Aktif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Prioritas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-300 text-xs"
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Prioritas rendah (1-2) akan ditampilkan lebih dulu
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Mode Darurat
                  </label>
                  <select
                    value={formData.isEmergency}
                    onChange={(e) => setFormData(prev => ({ ...prev, isEmergency: e.target.value === 'true' }))}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-300 text-xs"
                    disabled={activeNews.length > 0 && formData.isEmergency && !editingNews}
                  >
                    <option value={false}>Tidak</option>
                    <option value={true}>Ya</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Aktifkan untuk mode darurat (warna merah dan label DARURAT)
                  </p>
                </div>
                {formData.text && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Preview
                    </label>
                    <div className={`bg-gradient-to-r ${formData.isEmergency ? 'from-red-500 to-red-600' : 'from-indigo-500 to-purple-500'} rounded-lg overflow-hidden shadow-md`}>
                      <div className="flex items-center py-2 px-3">
                        <span className={`bg-white ${formData.isEmergency ? 'text-red-600 animate-pulse' : 'text-indigo-600'} px-2 py-1 rounded-full text-xs font-bold mr-3 flex-shrink-0`}>
                          {formData.isEmergency ? 'DARURAT' : 'BREAKING'}
                        </span>
                        <div className="overflow-hidden flex-1">
                          <div 
                            className="breaking-news-text whitespace-nowrap text-white font-medium text-xs" 
                            style={{ 
                              animation: `marquee linear ${globalSpeed}s infinite`,
                              display: 'inline-block',
                              willChange: 'transform'
                            }}
                          >
                            {formData.text} {formData.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveNews}
                  disabled={!formData.text.trim() || loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingNews ? 'Update' : 'Simpan'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isSpeedModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center">
                    <Settings className="w-4 h-4 text-purple-600 mr-2" />
                    Pengaturan Kecepatan Global
                  </h3>
                  <button
                    onClick={() => setIsSpeedModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-all duration-200"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                  <div className="flex">
                    <Gauge className="w-4 h-4 text-indigo-600 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-xs font-medium text-indigo-900">Informasi</h4>
                      <p className="text-xs text-indigo-700 mt-1">
                        Fitur ini akan mengubah kecepatan scroll semua breaking news ({breakingNews.length} item) secara bersamaan.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Kecepatan Global (detik)
                  </label>
                  <input
                    type="number"
                    value={globalSpeed || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setGlobalSpeed(value === '' ? '' : parseInt(value));
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-xs"
                    placeholder="15"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Kecepatan yang lebih rendah = scrolling lebih cepat (5-30 detik direkomendasikan)
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="text-xs font-medium text-gray-900 mb-2">Preview Kecepatan</h5>
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg overflow-hidden shadow-md">
                    <div className="flex items-center py-2 px-3">
                      <span className="bg-white text-indigo-600 px-2 py-1 rounded-full text-xs font-bold mr-3 flex-shrink-0">
                        BREAKING
                      </span>
                      <div className="overflow-hidden flex-1">
                        <div 
                          className="breaking-news-text whitespace-nowrap text-white font-medium text-xs" 
                          style={{ 
                            animation: `marquee linear ${(globalSpeed || 15)}s infinite`,
                            display: 'inline-block',
                            willChange: 'transform'
                          }}
                        >
                          Contoh breaking news dengan kecepatan {(globalSpeed || 15)} detik - Test preview kecepatan scroll
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-xs font-medium text-yellow-900">Peringatan</h4>
                      <p className="text-xs text-yellow-700 mt-1">
                        Perubahan ini akan diterapkan ke semua breaking news dan tidak dapat dibatalkan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  onClick={() => setIsSpeedModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdateAllSpeeds}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Gauge className="w-4 h-4" />
                  <span>Terapkan ke Semua</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isSpeedWarningOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Peringatan Kecepatan
                </h3>
                <button
                  onClick={() => setIsSpeedWarningOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-all duration-200"
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-700 mb-4">
                Kecepatan {globalSpeed} detik di luar rentang normal (5-30 detik). Apakah Anda yakin ingin melanjutkan dengan menyesuaikan ke {Math.max(5, Math.min(30, parseInt(globalSpeed) || 15))} detik?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsSpeedWarningOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                  disabled={loading}
                >
                  Tidak
                </button>
                <button
                  onClick={handleSpeedWarningConfirm}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-medium"
                  disabled={loading}
                >
                  Ya
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal({ isOpen: false, id: null, title: '', message: '' })}
          onConfirm={confirmDelete}
          title={confirmationModal.title}
          message={confirmationModal.message}
        />

        <style jsx>{`
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .breaking-news-text {
            display: inline-block;
            white-space: nowrap;
          }
          .scrollbar-thin {
            scrollbar-width: thin;
            scrollbar-color: #6366f1 #e5e7eb;
          }
          .scrollbar-thumb-indigo-500::-webkit-scrollbar-thumb {
            background-color: #6366f1;
            border-radius: 9999px;
          }
          .scrollbar-track-gray-100::-webkit-scrollbar-track {
            background-color: #e5e7eb;
          }
          .touch-target {
            min-width: 32px;
            min-height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          /* Mobile-specific styles */
          @media (max-width: 640px) {
            .min-h-screen {
              padding: 0.5rem;
            }
            .max-w-7xl {
              max-width: 100%;
            }
            .p-6 {
              padding: 0.5rem;
            }
            .mb-6 {
              margin-bottom: 0.5rem;
            }
            .space-x-4 > :not(:last-child) {
              margin-right: 0.25rem;
            }
            .space-x-2 > :not(:last-child) {
              margin-right: 0.25rem;
            }
            .space-y-4 > :not(:last-child) {
              margin-bottom: 0.5rem;
            }
            .space-y-2 > :not(:last-child) {
              margin-bottom: 0.25rem;
            }
            .text-2xl {
              font-size: 1rem;
            }
            .text-xl {
              font-size: 0.875rem;
            }
            .text-lg {
              font-size: 0.75rem;
            }
            .text-base {
              font-size: 0.75rem;
            }
            .text-sm {
              font-size: 0.7rem;
            }
            .text-xs {
              font-size: 0.65rem;
            }
            .w-12.h-12 {
              width: 1.5rem;
              height: 1.5rem;
            }
            .w-8.h-8 {
              width: 1rem;
              height: 1rem;
            }
            .w-6.h-6 {
              width: 0.875rem;
              height: 0.875rem;
            }
            .w-5.h-5 {
              width: 0.75rem;
              height: 0.75rem;
            }
            .w-4.h-4 {
              width: 0.625rem;
              height: 0.625rem;
            }
            .w-3.h-3 {
              width: 0.5rem;
              height: 0.5rem;
            }
            .px-6.py-4 {
              padding-left: 0.5rem;
              padding-right: 0.5rem;
              padding-top: 0.25rem;
              padding-bottom: 0.25rem;
            }
            .px-4.py-2 {
              padding-left: 0.5rem;
              padding-right: 0.5rem;
              padding-top: 0.25rem;
              padding-bottom: 0.25rem;
            }
            .px-3.py-1 {
              padding-left: 0.375rem;
              padding-right: 0.375rem;
              padding-top: 0.125rem;
              padding-bottom: 0.125rem;
            }
            .px-2.py-1 {
              padding-left: 0.25rem;
              padding-right: 0.25rem;
              padding-top: 0.125rem;
              padding-bottom: 0.125rem;
            }
            .p-4 {
              padding: 0.5rem;
            }
            .p-3 {
              padding: 0.375rem;
            }
            .p-2 {
              padding: 0.25rem;
            }
            .p-1 {
              padding: 0.125rem;
            }
            .grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4 {
              grid-template-columns: 1fr;
            }
            .gap-6 {
              gap: 0.5rem;
            }
            .gap-4 {
              gap: 0.5rem;
            }
            .gap-2 {
              gap: 0.25rem;
            }
            .w-24.h-24 {
              width: 3rem;
              height: 3rem;
            }
            .w-16.h-16 {
              width: 2rem;
              height: 2rem;
            }
            .py-12 {
              padding-top: 0.75rem;
              padding-bottom: 0.75rem;
            }
            .py-6 {
              padding-top: 0.5rem;
              padding-bottom: 0.5rem;
            }
            .mb-4 {
              margin-bottom: 0.5rem;
            }
            .mb-3 {
              margin-bottom: 0.375rem;
            }
            .mt-2 {
              margin-top: 0.25rem;
            }
            .mt-1 {
              margin-top: 0.125rem;
            }
            .rounded-2xl {
              border-radius: 0.5rem;
            }
            .rounded-xl {
              border-radius: 0.375rem;
            }
            .rounded-lg {
              border-radius: 0.25rem;
            }
            .breaking-news-text {
              font-size: 0.65rem;
            }
            .max-w-md {
              max-width: 100%;
            }
            .grid-cols-1.sm\\:grid-cols-2 {
              grid-template-columns: 1fr;
            }
            .flex-wrap {
              flex-wrap: wrap;
            }
            .animate-scaleIn, .animate-slideUp, .animate-fadeIn, .animate-fadeInUp {
              animation: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default BreakingNewsAdmin;