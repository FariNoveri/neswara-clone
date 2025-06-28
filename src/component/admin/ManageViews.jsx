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
import { Eye, RefreshCw, User, UserX, Trash2, Shield } from 'lucide-react';

const ManageViews = ({ onViewsUpdated }) => {
  const [newsItems, setNewsItems] = useState([]);
  const [selectedNewsId, setSelectedNewsId] = useState('');
  const [selectedNewsTitle, setSelectedNewsTitle] = useState('');
  const [viewDetails, setViewDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalViews, setTotalViews] = useState(0);

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
    }
    setLoading(false);
  };

  const fetchViewDetails = async (newsId) => {
    setLoading(true);
    try {
      // Fetch view history from views collection
      const viewsSnapshot = await getDocs(
        query(collection(db, 'views'), where('newsId', '==', newsId))
      );
      
      const viewsData = [];
      let total = 0;
      
      for (const viewDoc of viewsSnapshot.docs) {
        const viewData = viewDoc.data();
        let userData = null;
        
        // If userId exists, fetch user data
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
      
      // Sort by most recent views
      viewsData.sort((a, b) => b.viewedAt - a.viewedAt);
      
      setViewDetails(viewsData);
      setTotalViews(total);
      
      // Update selected news title
      const selectedNews = newsItems.find(item => item.id === newsId);
      setSelectedNewsTitle(selectedNews?.judul || '');
      
    } catch (err) {
      console.error('Error fetching view details:', err);
      setError('Gagal memuat detail views.');
    }
    setLoading(false);
  };

  const handleResetViews = async () => {
    if (!selectedNewsId) {
      alert('Pilih berita untuk direset.');
      return;
    }

    if (!window.confirm('Apakah Anda yakin ingin mereset semua views untuk berita ini?')) {
      return;
    }

    setLoading(true);
    try {
      // Reset views count in news document
      await updateDoc(doc(db, 'news', selectedNewsId), {
        views: 0
      });

      // Delete all view records for this news
      const viewsSnapshot = await getDocs(
        query(collection(db, 'views'), where('newsId', '==', selectedNewsId))
      );
      
      const deletePromises = viewsSnapshot.docs.map(viewDoc => 
        deleteDoc(doc(db, 'views', viewDoc.id))
      );
      
      await Promise.all(deletePromises);

      alert('Views telah direset untuk berita ini.');
      
      // Refresh data
      await fetchNewsItems();
      await fetchViewDetails(selectedNewsId);
      
      // Notify parent component to refresh stats
      if (onViewsUpdated) {
        onViewsUpdated();
      }
      
    } catch (err) {
      console.error('Error resetting views:', err);
      setError('Gagal mereset views.');
      alert('Gagal mereset views. Silakan coba lagi.');
    }
    setLoading(false);
  };

  const handleResetAllViews = async () => {
    if (!window.confirm('Apakah Anda yakin ingin mereset SEMUA views untuk SEMUA berita? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    setLoading(true);
    try {
      // Reset all news views to 0
      const newsSnapshot = await getDocs(collection(db, 'news'));
      const updatePromises = newsSnapshot.docs.map(newsDoc => 
        updateDoc(doc(db, 'news', newsDoc.id), { views: 0 })
      );
      
      await Promise.all(updatePromises);

      // Delete all view records
      const allViewsSnapshot = await getDocs(collection(db, 'views'));
      const deletePromises = allViewsSnapshot.docs.map(viewDoc => 
        deleteDoc(doc(db, 'views', viewDoc.id))
      );
      
      await Promise.all(deletePromises);

      alert('Semua views telah direset.');
      
      // Refresh data
      await fetchNewsItems();
      if (selectedNewsId) {
        await fetchViewDetails(selectedNewsId);
      }
      
      // Notify parent component to refresh stats
      if (onViewsUpdated) {
        onViewsUpdated();
      }
      
    } catch (err) {
      console.error('Error resetting all views:', err);
      setError('Gagal mereset semua views.');
      alert('Gagal mereset semua views. Silakan coba lagi.');
    }
    setLoading(false);
  };

  const formatDate = (date) => {
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Kelola Views</h3>
          <button
            onClick={handleResetAllViews}
            className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 flex items-center text-sm"
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset Semua Views
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel - News Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Berita untuk Detail Views
              </label>
              <select
                value={selectedNewsId}
                onChange={(e) => setSelectedNewsId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Views Berita Ini
              </button>
            )}

            {/* News List with Views */}
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">
                Total Views per Berita
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {newsItems.map(item => (
                  <div 
                    key={item.id} 
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedNewsId === item.id 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedNewsId(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-gray-900 truncate">
                          {item.judul}
                        </h5>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 ml-2">
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
          <div className="md:col-span-2">
            {selectedNewsId ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-700">
                    Detail Views: {selectedNewsTitle}
                  </h4>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Total: {totalViews} views
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  </div>
                ) : viewDetails.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {viewDetails.map(view => (
                      <div key={view.id} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {view.userData ? (
                              <User className="h-5 w-5 text-green-600" />
                            ) : (
                              <UserX className="h-5 w-5 text-gray-500" />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {getViewerName(view)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {getViewerInfo(view)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Dilihat: {formatDate(view.viewedAt)}
                              </div>
                              {view.count > 1 && (
                                <div className="text-xs text-blue-600 font-medium">
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
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Data Privasi Terlindungi</p>
                    <p className="text-sm">Tidak ada riwayat viewing yang tersimpan untuk berita ini</p>
                    <p className="text-xs mt-2 text-gray-400">Informasi pengunjung dijaga kerahasiaannya</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Eye className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Pilih Berita</p>
                <p className="text-sm">untuk melihat detail views dan pengunjung</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageViews;