import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaSave, FaTimes, FaBroadcastTower, FaPlay, FaPause } from 'react-icons/fa';
import { db } from '../../firebaseconfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

const BreakingNewsAdmin = () => {
  const [breakingNews, setBreakingNews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({
    text: '',
    isActive: true,
    priority: 1
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchBreakingNews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'breakingNews'), orderBy('priority', 'asc')); // Changed to 'asc' for clarity
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
    setFormData({ text: '', isActive: true, priority: breakingNews.length + 1 });
    setIsModalOpen(true);
  };

  const handleEditNews = (news) => {
    setEditingNews(news);
    setFormData({
      text: news.text,
      isActive: news.isActive,
      priority: news.priority
    });
    setIsModalOpen(true);
  };

  const handleSaveNews = async () => {
    if (!formData.text.trim()) return;

    setLoading(true);
    try {
      if (editingNews) {
        await updateDoc(doc(db, 'breakingNews', editingNews.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'breakingNews'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      fetchBreakingNews();
      setIsModalOpen(false);
      setEditingNews(null);
      setFormData({ text: '', isActive: true, priority: 1 });
    } catch (error) {
      console.error('Error saving breaking news:', error);
    }
    setLoading(false);
  };

  const handleDeleteNews = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus breaking news ini?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'breakingNews', id));
        fetchBreakingNews();
      } catch (error) {
        console.error('Error deleting breaking news:', error);
      }
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentIsActive) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'breakingNews', id), {
        isActive: !currentIsActive,
        updatedAt: serverTimestamp()
      });
      fetchBreakingNews();
    } catch (error) {
      console.error('Error toggling breaking news status:', error);
    }
    setLoading(false);
  };

  const activeNews = breakingNews.filter(news => news.isActive).sort((a, b) => a.priority - b.priority);

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
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
                      ? 'bg-red-500 text-white hover:bg-red-600' 
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

          {/* Live Preview */}
          {isPreviewMode && activeNews.length > 0 && (
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaEye className="mr-2 text-red-500" />
                  Live Preview
                </h3>
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg overflow-hidden">
                  <div className="flex items-center py-3 px-4">
                    <span className="bg-white text-red-600 px-3 py-1 rounded-full text-xs font-bold mr-4 flex-shrink-0">
                      BREAKING
                    </span>
                    <div className="overflow-hidden flex-1">
                      <div className="flex animate-marquee whitespace-nowrap text-white font-medium">
                        {activeNews.map((news, index) => (
                          <span key={news.id} className="mr-16">
                            {news.text}
                            {index < activeNews.length - 1 && ' | '}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
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
                  <p className="text-gray-600 text-sm font-medium">Prioritas Tinggi</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {breakingNews.filter(news => news.priority <= 2).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FaBroadcastTower className="text-orange-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Breaking News List */}
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
                      <td colSpan="5" className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : breakingNews.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
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
                                {news.text}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {news.updatedAt?.toDate().toLocaleString('id-ID')}
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

          {/* Modal */}
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

                  {/* Preview */}
                  {formData.text && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preview
                      </label>
                      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg overflow-hidden">
                        <div className="flex items-center py-2 px-4">
                          <span className="bg-white text-red-600 px-2 py-1 rounded-full text-xs font-bold mr-3 flex-shrink-0">
                            BREAKING
                          </span>
                          <div className="overflow-hidden flex-1">
                            <div className="text-white text-sm font-medium whitespace-nowrap">
                              {formData.text}
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
        </div>
      </div>

      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          
          .animate-marquee {
            animation: marquee 25s linear infinite;
          }
          
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}
      </style>
    </>
  );
};

export default BreakingNewsAdmin;
