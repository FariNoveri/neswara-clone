import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaSave, FaTimes, FaBroadcastTower, FaPlay, FaPause, FaTachometerAlt, FaCog, FaExclamationTriangle } from 'react-icons/fa';
import { db } from '../../firebaseconfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';

const BreakingNewsAdmin = ({ logActivity }) => {
  const [breakingNews, setBreakingNews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSpeedModalOpen, setIsSpeedModalOpen] = useState(false);
  const [isSpeedWarningOpen, setIsSpeedWarningOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [globalSpeed, setGlobalSpeed] = useState(15);
  const [formData, setFormData] = useState({
    text: '',
    isActive: true,
    priority: 1,
    speed: 15,
    isEmergency: false
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchBreakingNews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'breakingNews'), orderBy('priority', 'asc'));
      const snapshot = await getDocs(q);
      const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBreakingNews(newsData);
    } catch (error) {
      console.error('Error fetching breaking news:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBreakingNews();
  }, []);

  const handleAddNews = () => {
    setEditingNews(null);
    setFormData({ text: '', isActive: true, priority: breakingNews.length + 1, speed: 15, isEmergency: false });
    setIsModalOpen(true);
  };

  const handleEditNews = (news) => {
    setEditingNews(news);
    setFormData({
      text: news.text,
      isActive: news.isActive,
      priority: news.priority,
      speed: news.speed || 15,
      isEmergency: news.isEmergency || false
    });
    setIsModalOpen(true);
  };

  const handleSaveNews = async () => {
    if (!formData.text.trim()) return;

    const speedValue = parseInt(formData.speed) || 15;
    if (speedValue < 5 || speedValue > 30) {
      setIsSpeedWarningOpen(true);
      return;
    }

    setLoading(true);
    try {
      if (editingNews) {
        await updateDoc(doc(db, 'breakingNews', editingNews.id), {
          ...formData,
          speed: speedValue,
          updatedAt: serverTimestamp()
        });
        logActivity('NEWS_EDIT', { newsId: editingNews.id, title: formData.text, newSpeed: speedValue, oldSpeed: editingNews.speed });
      } else {
        const docRef = await addDoc(collection(db, 'breakingNews'), {
          ...formData,
          speed: speedValue,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        logActivity('NEWS_ADD', { newsId: docRef.id, title: formData.text, newSpeed: speedValue });
      }
      fetchBreakingNews();
      setIsModalOpen(false);
      setFormData({ text: '', isActive: true, priority: 1, speed: 15, isEmergency: false });
    } catch (error) {
      console.error('Error saving breaking news:', error);
    }
    setLoading(false);
  };

  const handleDeleteNews = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus breaking news ini?')) {
      setLoading(true);
      try {
        const newsDoc = await getDoc(doc(db, 'breakingNews', id));
        if (newsDoc.exists()) {
          const newsData = newsDoc.data();
          await deleteDoc(doc(db, 'breakingNews', id));
          logActivity('NEWS_DELETE', { newsId: id, title: newsData.text });
          fetchBreakingNews();
        }
      } catch (error) {
        console.error('Error deleting breaking news:', error);
      }
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentIsActive) => {
    setLoading(true);
    try {
      const newsDoc = await getDoc(doc(db, 'breakingNews', id));
      if (newsDoc.exists()) {
        const newsData = newsDoc.data();
        await updateDoc(doc(db, 'breakingNews', id), {
          isActive: !currentIsActive,
          updatedAt: serverTimestamp()
        });
        logActivity('TOGGLE_NEWS_STATUS', { newsId: id, title: newsData.text, newStatus: !currentIsActive });
        fetchBreakingNews();
      }
    } catch (error) {
      console.error('Error toggling breaking news status:', error);
    }
    setLoading(false);
  };

  const handleUpdateAllSpeeds = async () => {
    if (breakingNews.length === 0) {
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
      const batch = writeBatch(db);
      breakingNews.forEach((news) => {
        const newsRef = doc(db, 'breakingNews', news.id);
        batch.update(newsRef, {
          speed: speedValue,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      logActivity('SPEED_UPDATE', { newSpeed: speedValue, count: breakingNews.length });
      fetchBreakingNews();
      setIsSpeedModalOpen(false);
    } catch (error) {
      console.error('Error during batch update:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeedWarningConfirm = () => {
    const speedValue = isSpeedModalOpen ? parseInt(globalSpeed) || 15 : parseInt(formData.speed) || 15;
    
    // Override speed to be within 5-30 range
    const adjustedSpeed = Math.max(5, Math.min(30, speedValue));
    
    setLoading(true);
    try {
      if (isSpeedModalOpen) {
        // Update global speed
        setGlobalSpeed(adjustedSpeed);
        const batch = writeBatch(db);
        breakingNews.forEach((news) => {
          const newsRef = doc(db, 'breakingNews', news.id);
          batch.update(newsRef, {
            speed: adjustedSpeed,
            updatedAt: serverTimestamp()
          });
        });
        batch.commit().then(() => {
          logActivity('SPEED_UPDATE', { newSpeed: adjustedSpeed, count: breakingNews.length });
          fetchBreakingNews();
          setIsSpeedModalOpen(false);
        });
      } else if (isModalOpen) {
        // Update single news item
        setFormData(prev => ({ ...prev, speed: adjustedSpeed }));
        if (editingNews) {
          updateDoc(doc(db, 'breakingNews', editingNews.id), {
            ...formData,
            speed: adjustedSpeed,
            updatedAt: serverTimestamp()
          }).then(() => {
            logActivity('NEWS_EDIT', { newsId: editingNews.id, title: formData.text, newSpeed: adjustedSpeed, oldSpeed: editingNews.speed });
            fetchBreakingNews();
            setIsModalOpen(false);
            setFormData({ text: '', isActive: true, priority: 1, speed: 15, isEmergency: false });
          });
        } else {
          addDoc(collection(db, 'breakingNews'), {
            ...formData,
            speed: adjustedSpeed,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }).then(() => {
            logActivity('NEWS_ADD', { newsId: docRef.id, title: formData.text, newSpeed: adjustedSpeed });
            fetchBreakingNews();
            setIsModalOpen(false);
            setFormData({ text: '', isActive: true, priority: 1, speed: 15, isEmergency: false });
          });
        }
      }
    } catch (error) {
      console.error('Error in speed warning confirmation:', error);
    } finally {
      setIsSpeedWarningOpen(false);
      setLoading(false);
    }
  };

  const activeNews = breakingNews.filter(news => news.isActive).sort((a, b) => a.priority - b.priority);
  const isEmergency = activeNews.some(n => n.isEmergency);
  const speed = activeNews.length > 0 ? (activeNews[0].speed || 15) : 15;

  const newsContent = activeNews.map((news, index) => (
    `${news.text || 'No text available'}${index < activeNews.length - 1 ? ' - ' : ''}`
  )).join('');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FaBroadcastTower className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Breaking News Management</h1>
                <p className="text-gray-600">Kelola teks breaking news yang berjalan di navbar</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isPreviewMode 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                disabled={loading}
              >
                {isPreviewMode ? (
                  <>
                    <FaPause className="text-sm" />
                    <span>Stop Preview</span>
                  </>
                ) : (
                  <>
                    <FaPlay className="text-sm" />
                    <span>Preview Live</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setIsSpeedModalOpen(true)}
                className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors"
                disabled={loading || breakingNews.length === 0}
              >
                <FaTachometerAlt className="text-sm" />
                <span>Atur Kecepatan Global</span>
              </button>
              <button
                onClick={handleAddNews}
                className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
                disabled={loading}
              >
                <FaPlus className="text-sm" />
                <span>Tambah Breaking News</span>
              </button>
            </div>
          </div>
        </div>

        {isPreviewMode && activeNews.length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaEye className="mr-2 text-blue-500" />
                Live Preview
              </h3>
              <div className={`bg-gradient-to-r ${isEmergency ? 'from-red-500 to-red-600' : 'from-blue-500 to-blue-600'} rounded-lg overflow-hidden`}>
                <div className="flex items-center py-3 px-4">
                  <span className={`bg-white ${isEmergency ? 'text-red-600 animate-pulse' : 'text-blue-600'} px-3 py-1 rounded-full text-xs font-bold mr-4 flex-shrink-0`}>
                    {isEmergency ? 'DARURAT' : 'BREAKING'}
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Breaking News</p>
                <p className="text-2xl font-bold text-gray-900">{breakingNews.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaBroadcastTower className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Aktif</p>
                <p className="text-2xl font-bold text-green-600">{activeNews.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaEye className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Non-Aktif</p>
                <p className="text-2xl font-bold text-red-600">{breakingNews.length - activeNews.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FaEyeSlash className="text-red-600 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Rata-rata Kecepatan</p>
                <p className="text-2xl font-bold text-orange-600">
                  {breakingNews.length > 0 ? Math.round(breakingNews.reduce((acc, news) => acc + (news.speed || 15), 0) / breakingNews.length) : 0}s
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaTachometerAlt className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Daftar Breaking News</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Breaking News
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioritas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kecepatan (detik)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mode Darurat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Terakhir Update
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : breakingNews.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      Tidak ada breaking news ditemukan
                    </td>
                  </tr>
                ) : (
                  breakingNews.sort((a, b) => a.priority - b.priority).map((news) => (
                    <tr key={news.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {news.text || 'No text available'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {news.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(news.id, news.isActive)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            news.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                          disabled={loading}
                        >
                          {news.isActive ? (
                            <>
                              <FaEye className="mr-1" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <FaEyeSlash className="mr-1" />
                              Non-Aktif
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          news.priority <= 2
                            ? 'bg-red-100 text-red-800'
                            : news.priority <= 4
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          #{news.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {news.speed || 15}s
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          news.isEmergency ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {news.isEmergency ? 'Ya' : 'Tidak'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {news.updatedAt?.toDate ? news.updatedAt.toDate().toLocaleString('id-ID') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditNews(news)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Edit"
                            disabled={loading}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteNews(news.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Hapus"
                            disabled={loading}
                          >
                            <FaTrash />
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingNews ? 'Edit Breaking News' : 'Tambah Breaking News'}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded hover:bg-gray-100"
                    disabled={loading}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teks Breaking News
                  </label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Masukkan teks breaking news... (gunakan emoji untuk menarik perhatian)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Gunakan emoji seperti 🔴, ⚡, 🏆 untuk membuat breaking news lebih menarik
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={true}>Aktif</option>
                      <option value={false}>Non-Aktif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioritas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Prioritas rendah (1-2) akan ditampilkan lebih dulu
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kecepatan (detik)
                  </label>
                  <input
                    type="number"
                    value={formData.speed || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        speed: value === '' ? '' : parseInt(value)
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="15"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Atur kecepatan scroll (5-30 detik direkomendasikan)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode Darurat
                  </label>
                  <select
                    value={formData.isEmergency}
                    onChange={(e) => setFormData(prev => ({ ...prev, isEmergency: e.target.value === 'true' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview
                    </label>
                    <div className={`bg-gradient-to-r ${formData.isEmergency ? 'from-red-500 to-red-600' : 'from-blue-500 to-blue-600'} rounded-lg overflow-hidden`}>
                      <div className="flex items-center py-2 px-4">
                        <span className={`bg-white ${formData.isEmergency ? 'text-red-600 animate-pulse' : 'text-blue-600'} px-2 py-1 rounded-full text-xs font-bold mr-3 flex-shrink-0`}>
                          {formData.isEmergency ? 'DARURAT' : 'BREAKING'}
                        </span>
                        <div className="overflow-hidden flex-1">
                          <div 
                            className="breaking-news-text whitespace-nowrap text-white font-medium" 
                            style={{ 
                              animation: `marquee linear ${(formData.speed || 15)}s infinite`,
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
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveNews}
                  disabled={!formData.text.trim() || loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaSave className="text-sm" />
                  <span>{editingNews ? 'Update' : 'Simpan'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isSpeedModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FaCog className="mr-2 text-purple-500" />
                    Pengaturan Kecepatan Global
                  </h3>
                  <button
                    onClick={() => setIsSpeedModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded hover:bg-gray-100"
                    disabled={loading}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <FaTachometerAlt className="text-blue-500 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Informasi</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Fitur ini akan mengubah kecepatan scroll semua breaking news ({breakingNews.length} item) secara bersamaan.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kecepatan Global (detik)
                  </label>
                  <input
                    type="number"
                    value={globalSpeed || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setGlobalSpeed(value === '' ? '' : parseInt(value));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="15"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Kecepatan yang lebih rendah = scrolling lebih cepat (5-30 detik direkomendasikan)
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Preview Kecepatan</h5>
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg overflow-hidden">
                    <div className="flex items-center py-2 px-3">
                      <span className="bg-white text-blue-600 px-2 py-1 rounded-full text-xs font-bold mr-3 flex-shrink-0">
                        BREAKING
                      </span>
                      <div className="overflow-hidden flex-1">
                        <div 
                          className="breaking-news-text whitespace-nowrap text-white font-medium text-sm" 
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

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900">Peringatan</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Perubahan ini akan diterapkan ke semua breaking news dan tidak dapat dibatalkan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setIsSpeedModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdateAllSpeeds}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaTachometerAlt className="text-sm" />
                  <span>Terapkan ke Semua</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isSpeedWarningOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 transform transition-all duration-300 ease-out animate-fadeInSlideDown">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600 flex items-center">
                  <FaExclamationTriangle className="mr-2" />
                  Peringatan Kecepatan
                </h3>
                <button
                  onClick={() => setIsSpeedWarningOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded hover:bg-gray-100"
                  disabled={loading}
                >
                  <FaTimes />
                </button>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Kecepatan {isSpeedModalOpen ? (parseInt(globalSpeed) || 15) : (parseInt(formData.speed) || 15)} detik di luar rentang normal (5-30 detik). Apakah Anda yakin ingin melanjutkan?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsSpeedWarningOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={loading}
                >
                  Tidak
                </button>
                <button
                  onClick={handleSpeedWarningConfirm}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  disabled={loading}
                >
                  Ya
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          @keyframes fadeInSlideDown {
            0% { opacity: 0; transform: translateY(-20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeInSlideDown {
            animation: fadeInSlideDown 0.3s ease-out;
          }
          .breaking-news-text {
            display: inline-block;
            white-space: nowrap;
          }
        `}</style>
      </div>
    </div>
  );
};

export default BreakingNewsAdmin;