import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebaseconfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  onSnapshot,
  getDoc 
} from 'firebase/firestore';
import { PlusCircle, Edit3, Trash2, X, Upload, Link, Image } from 'lucide-react';

const NotificationManagement = ({ logActivity }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [uploadType, setUploadType] = useState('url');
  const [previewImage, setPreviewImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    image: '',
    type: 'news',
    newsLink: ''
  });
  const [newsArticles, setNewsArticles] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('error'); // 'error' atau 'confirm'
  const [deleteId, setDeleteId] = useState(null); // State untuk menyimpan ID yang akan dihapus
  const modalRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notificationsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'news')); // No orderBy to avoid issues
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Snapshot data:', snapshot.docs.map(doc => doc.data()));
      const newsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.judul || data.title || 'Tanpa Judul',
          link: `/berita/${doc.id}`
        };
      });
      console.log('Processed news articles:', newsData);
      if (newsData.length === 0) {
        console.warn('No news articles found in the collection.');
      }
      setNewsArticles(newsData);
    }, (error) => {
      console.error('Error fetching news articles:', error);
    });
    return () => unsubscribe();
  }, []);

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showPopupMessage('Please select an image file', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showPopupMessage('File size should be less than 5MB', 'error');
        return;
      }
      try {
        const base64 = await convertFileToBase64(file);
        setImageFile(file);
        setPreviewImage(base64);
        setNotificationForm({ ...notificationForm, image: base64 });
      } catch (error) {
        console.error('Error converting file:', error);
        showPopupMessage('Error processing image file', 'error');
      }
    }
  };

  const handleUrlChange = (url) => {
    setNotificationForm({ ...notificationForm, image: url });
    setPreviewImage(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notificationForm.title || !notificationForm.message) {
      showPopupMessage('Mohon lengkapi judul dan pesan notifikasi', 'error');
      return;
    }

    try {
      setLoading(true);
      if (editingNotification) {
        await updateDoc(doc(db, 'notifications', editingNotification.id), {
          ...notificationForm,
          updatedAt: serverTimestamp()
        });
        logActivity('NOTIFICATION_EDIT', { notificationId: editingNotification.id, title: notificationForm.title, type: notificationForm.type });
      } else {
        const docRef = await addDoc(collection(db, 'notifications'), {
          ...notificationForm,
          timestamp: serverTimestamp(),
          isRead: false
        });
        logActivity('NOTIFICATION_ADD', { notificationId: docRef.id, title: notificationForm.title, type: notificationForm.type });
      }
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving notification:', error);
      showPopupMessage('Error saving notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id); // Simpan ID notifikasi yang akan dihapus
    setPopupType('confirm');
    setPopupMessage('Apakah Anda yakin ingin menghapus notifikasi ini?');
    setShowPopup(true);
  };

  const confirmDelete = async () => {
    const id = deleteId; // Ambil ID dari state
    if (!id) {
      showPopupMessage('ID notifikasi tidak valid', 'error');
      return;
    }
    setShowPopup(false);
    try {
      setLoading(true);
      const notificationDoc = await getDoc(doc(db, 'notifications', id));
      if (notificationDoc.exists()) {
        const notificationData = notificationDoc.data();
        await deleteDoc(doc(db, 'notifications', id));
        logActivity('NOTIFICATION_DELETE', { notificationId: id, title: notificationData.title || 'N/A', type: notificationData.type || 'N/A' });
        console.log('Log activity called for NOTIFICATION_DELETE:', { notificationId: id, title: notificationData.title, type: notificationData.type });
        const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      showPopupMessage('Error deleting notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowPopup(false);
    setDeleteId(null); // Reset ID setelah pembatalan
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setNotificationForm({
      title: notification.title,
      message: notification.message,
      image: notification.image || '',
      type: notification.type || 'news',
      newsLink: notification.newsLink || ''
    });
    setPreviewImage(notification.image || '');
    setUploadType(notification.image && notification.image.startsWith('data:') ? 'file' : 'url');
    setShowModal(true);
  };

  const resetForm = () => {
    setNotificationForm({ title: '', message: '', image: '', type: 'news', newsLink: '' });
    setEditingNotification(null);
    setPreviewImage('');
    setImageFile(null);
    setUploadType('url');
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const showPopupMessage = (message, type = 'error') => {
    setPopupType(type);
    setPopupMessage(message);
    setShowPopup(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    };
    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModal]);

  return (
    <div className="space-y-6 p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">Manajemen Notifikasi</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 flex items-center transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Tambah Notifikasi
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">Judul</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">Pesan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">Tipe</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">Gambar</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
                      <span className="ml-3 text-black">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-gray-400 text-6xl mb-4">📭</div>
                      <p className="text-black text-lg">Tidak ada notifikasi</p>
                    </div>
                  </td>
                </tr>
              ) : (
                notifications.map((notification, index) => (
                  <tr 
                    key={notification.id} 
                    className="hover:bg-gray-50 transform transition-all duration-200 hover:scale-[1.01]"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-black">{notification.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 max-w-xs"><div className="line-clamp-2">{notification.message}</div></td>
                    <td className="px-6 py-4 text-sm"><span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{notification.type}</span></td>
                    <td className="px-6 py-4 text-sm text-black">
                      {notification.image ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={notification.image}
                            alt="Preview"
                            className="h-10 w-10 rounded-lg object-cover border border-gray-300 shadow-sm"
                          />
                          <Image className="h-4 w-4 text-green-500" />
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{notification.timestamp?.toDate().toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) || 'Baru'}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button onClick={() => handleEdit(notification)} className="text-indigo-600 hover:text-indigo-900 transform transition-all duration-200 hover:scale-110"><Edit3 className="h-5 w-5" /></button>
                        <button onClick={() => handleDelete(notification.id)} className="text-red-600 hover:text-red-900 transform transition-all duration-200 hover:scale-110"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn" onClick={closeModal}>
          <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black">{editingNotification ? 'Edit Notifikasi' : 'Tambah Notifikasi'}</h2>
              <button onClick={closeModal} className="text-gray-600 hover:text-gray-800 transform transition-all duration-200 hover:scale-110"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[80vh] text-black">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-black">Judul *</label>
                <input
                  type="text"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Masukkan judul notifikasi"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-black">Pesan *</label>
                <textarea
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Masukkan pesan notifikasi"
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-black">Gambar</label>
                <div className="flex space-x-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setUploadType('url')}
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${uploadType === 'url' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType('file')}
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${uploadType === 'file' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </button>
                </div>
                {uploadType === 'url' ? (
                  <input
                    type="url"
                    value={uploadType === 'url' ? notificationForm.image : ''}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://example.com/image.jpg"
                  />
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors duration-200">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                      <p className="text-black">Klik untuk upload gambar</p>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF hingga 5MB</p>
                    </label>
                  </div>
                )}
              </div>
              {previewImage && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black">Preview Gambar</label>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <img src={previewImage} alt="Preview" className="max-w-full h-40 object-contain mx-auto rounded-lg shadow-sm" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-black">Tipe</label>
                <select
                  value={notificationForm.type}
                  onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="news">Berita</option>
                  <option value="weather">Cuaca</option>
                  <option value="sports">Olahraga</option>
                  <option value="tech">Teknologi</option>
                  <option value="economy">Ekonomi</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-black">Link Berita (Opsional)</label>
                <select
                  value={notificationForm.newsLink}
                  onChange={(e) => setNotificationForm({ ...notificationForm, newsLink: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Tidak ada link</option>
                  {newsArticles.length > 0 ? (
                    newsArticles.map((article) => (
                      <option key={article.id} value={article.link}>{article.title}</option>
                    ))
                  ) : (
                    <option disabled>Tidak ada berita tersedia</option>
                  )}
                </select>
              </div>
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg hover:from-green-600 hover:to-green-700 font-medium transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Menyimpan...
                    </div>
                  ) : (
                    editingNotification ? 'Perbarui' : 'Simpan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn" onClick={popupType === 'confirm' ? null : () => setShowPopup(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full transform transition-all duration-300 animate-slideUpAndBounce" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              {popupType === 'error' ? (
                <div className="text-red-600 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : (
                <div className="text-yellow-600 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4.732c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
              <p className="text-lg font-semibold text-gray-900 mb-4">{popupMessage}</p>
              {popupType === 'confirm' ? (
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={confirmDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    Ya
                  </button>
                  <button
                    onClick={cancelDelete}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Tidak
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPopup(false)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUpAndBounce {
          0% { 
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          50% { 
            transform: translateY(-5px) scale(1.05);
          }
          100% { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUpAndBounce {
          animation: slideUpAndBounce 0.5s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        body.modal-open {
          overflow: hidden;
        }
        
        .max-h-\[80vh\] {
          max-height: 80vh;
        }
        
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .bounce-animation {
          animation: bounce 0.5s ease-in-out;
        }
        
        .bg-white {
          background-color: #ffffff !important;
        }
        .bg-gray-50 {
          background-color: #f9fafb !important;
        }
        .bg-gray-100 {
          background-color: #f3f4f6 !important;
        }
        .text-black {
          color: #000000 !important;
        }
        .text-gray-800 {
          color: #1f2937 !important;
        }
        .text-gray-700 {
          color: #374151 !important;
        }
        .text-gray-600 {
          color: #4b5563 !important;
        }
        .text-gray-500 {
          color: #6b7280 !important;
        }
        input, textarea, select {
          color: #000000 !important;
        }
        .placeholder-gray-400::placeholder {
          color: #9ca3af !important;
        }
      `}</style>
    </div>
  );
};

export default NotificationManagement;