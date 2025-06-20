import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseconfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  query,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Eye, 
  MessageCircle, 
  Calendar, 
  User, 
  Save, 
  X, 
  Search,
  BarChart3,
  FileText,
  Users
} from 'lucide-react';

// Pindahkan NewsModal ke luar komponen utama untuk menghindari re-render
const NewsModal = ({ 
  showModal, 
  setShowModal, 
  editingNews, 
  formData, 
  setFormData, 
  handleSubmit, 
  resetForm, 
  loading 
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {editingNews ? 'Edit Berita' : 'Tambah Berita Baru'}
          </h3>
          <button
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul Berita
            </label>
            <input
              type="text"
              required
              value={formData.judul}
              onChange={(e) => setFormData(prev => ({...prev, judul: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Masukkan judul berita..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              required
              value={formData.kategori}
              onChange={(e) => setFormData(prev => ({...prev, kategori: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Pilih Kategori</option>
              <option value="Politik">Politik</option>
              <option value="Ekonomi">Ekonomi</option>
              <option value="Olahraga">Olahraga</option>
              <option value="Teknologi">Teknologi</option>
              <option value="Hiburan">Hiburan</option>
              <option value="Kesehatan">Kesehatan</option>
              <option value="Pendidikan">Pendidikan</option>
              <option value="Daerah">Daerah</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Penulis
            </label>
            <input
              type="text"
              required
              value={formData.author}
              onChange={(e) => setFormData(prev => ({...prev, author: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nama penulis..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Gambar
            </label>
            <input
              type="url"
              value={formData.gambar}
              onChange={(e) => setFormData(prev => ({...prev, gambar: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ringkasan
            </label>
            <textarea
              value={formData.ringkasan}
              onChange={(e) => setFormData(prev => ({...prev, ringkasan: e.target.value}))}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ringkasan singkat berita..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konten Berita
            </label>
            <textarea
              required
              value={formData.konten}
              onChange={(e) => setFormData(prev => ({...prev, konten: e.target.value}))}
              rows="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Tulis konten berita lengkap..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Komponen StatCard juga dipindahkan keluar
const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <Icon className="h-8 w-8" style={{ color }} />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalNews: 0,
    totalComments: 0,
    totalViews: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    judul: '',
    konten: '',
    kategori: '',
    author: '',
    gambar: '',
    ringkasan: ''
  });

  // Fetch news from Firebase
  const fetchNews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const newsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNews(newsData);
      
      // Calculate stats
      const totalComments = newsData.reduce((sum, item) => sum + (item.komentar || 0), 0);
      const totalViews = newsData.reduce((sum, item) => sum + (item.views || 0), 0);
      setStats({
        totalNews: newsData.length,
        totalComments,
        totalViews
      });
    } catch (error) {
      console.error("Error fetching news:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Handle form submit
  const handleSubmit = async () => {
    setLoading(true);
    
    // Basic validation
    if (!formData.judul || !formData.konten || !formData.kategori || !formData.author) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      setLoading(false);
      return;
    }
    
    try {
      if (editingNews) {
        // Update existing news
        await updateDoc(doc(db, "news", editingNews.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Add new news
        await addDoc(collection(db, "news"), {
          ...formData,
          createdAt: serverTimestamp(),
          views: 0,
          komentar: 0
        });
      }
      
      resetForm();
      fetchNews();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving news:", error);
    }
    setLoading(false);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus berita ini?')) {
      try {
        await deleteDoc(doc(db, "news", id));
        fetchNews();
      } catch (error) {
        console.error("Error deleting news:", error);
      }
    }
  };

  // Handle edit
  const handleEdit = (newsItem) => {
    setEditingNews(newsItem);
    setFormData({
      judul: newsItem.judul || '',
      konten: newsItem.konten || '',
      kategori: newsItem.kategori || '',
      author: newsItem.author || '',
      gambar: newsItem.gambar || '',
      ringkasan: newsItem.ringkasan || ''
    });
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      judul: '',
      konten: '',
      kategori: '',
      author: '',
      gambar: '',
      ringkasan: ''
    });
    setEditingNews(null);
  };

  // Filter news based on search
  const filteredNews = news.filter(item => 
    item.judul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kategori?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <span className="ml-2 text-sm text-gray-500">Neswara News</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Welcome, Admin
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'news', label: 'Kelola Berita', icon: FileText },
              { id: 'comments', label: 'Komentar', icon: MessageCircle }
            ].map((tab) => (
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

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Berita Terbaru</h3>
              <div className="space-y-3">
                {news.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.judul}</h4>
                      <p className="text-sm text-gray-500">
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

        {/* News Management Tab */}
        {activeTab === 'news' && (
          <div className="space-y-6">
            {/* Header with search and add button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Cari berita..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Tambah Berita
              </button>
            </div>

            {/* News Table */}
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
                    {loading ? (
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
                      filteredNews.map((item) => (
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
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {item.kategori}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.author}
                          </td>
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
                                onClick={() => handleDelete(item.id)}
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

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Manajemen Komentar</h3>
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Fitur manajemen komentar akan segera hadir</p>
              <p className="text-sm">Saat ini fokus pada pengelolaan berita</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <NewsModal
        showModal={showModal}
        setShowModal={setShowModal}
        editingNews={editingNews}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        loading={loading}
      />
    </div>
  );
};

export default AdminDashboard;