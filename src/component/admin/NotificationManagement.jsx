import React, { useState, useCallback, useRef, useEffect } from 'react';
import { db } from '../../firebaseconfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp, 
  onSnapshot,
  getDoc 
} from 'firebase/firestore';
import { PlusCircle, Edit3, Trash, X, Upload, Image, FileText, AlertCircle, Link } from 'lucide-react';
import { toast } from 'react-toastify';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100 animate-fadeIn" role="dialog" aria-labelledby="confirmation-modal-title">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform animate-scaleIn">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 id="confirmation-modal-title" className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:rotate-90 transform"
            aria-label="Tutup modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium hover:scale-105 transform"
            aria-label="Batal"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium hover:scale-105 transform shadow-lg"
            aria-label="Konfirmasi hapus"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificationModal = React.memo(({ 
  showModal, 
  setShowModal, 
  editingNotification, 
  notificationForm, 
  setNotificationForm, 
  handleSubmit, 
  resetForm, 
  loading,
  uploadType,
  setUploadType,
  previewImage,
  setPreviewImage,
  handleImageUpload,
  handleUrlChange,
  newsArticles
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const modalRef = useRef(null);
  const titleInputRef = useRef(null);

  const handleClose = useCallback(() => {
    setShowModal(false);
    resetForm();
  }, [setShowModal, resetForm]);

  const handleModalClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  useEffect(() => {
    if (showModal && editingNotification && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showModal, editingNotification]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload({ target: { files: e.dataTransfer.files } });
    }
  }, [handleImageUpload]);

  const [dragActive, setDragActive] = useState(false);

  return (
    <div 
      className={`fixed inset-0 z-[100000] overflow-y-auto transition-all duration-300 ${
        showModal ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0 pointer-events-none'
      }`} 
      onClick={handleClose} 
      role="dialog" 
      aria-labelledby="notification-modal-title"
    >
      <div 
        className={`relative w-full max-w-4xl mx-auto my-8 transform transition-all duration-300 ${
          showModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`} 
        onClick={handleModalClick}
        ref={modalRef}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="notification-modal-title" className="text-2xl font-bold text-white mb-1">
                  {editingNotification ? '✏️ Edit Notifikasi' : '✨ Buat Notifikasi Baru'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {editingNotification ? 'Perbarui informasi notifikasi' : 'Kirim pesan baru kepada pengguna'}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 group"
                aria-label="Tutup modal"
              >
                <X className="h-5 w-5 text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>
            <div className="flex justify-center mt-6 space-x-8">
              {[
                { id: 1, title: "Info Dasar", icon: FileText },
                { id: 2, title: "Media", icon: Image }
              ].map((step) => (
                <div key={step.id} className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full transition-all duration-300 ${
                    activeStep >= step.id 
                      ? 'bg-white text-purple-600 shadow-lg scale-110' 
                      : 'bg-white/20 text-white/70'
                  }`}>
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    activeStep >= step.id ? 'text-white' : 'text-white/70'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-8 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Title Input */}
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    <FileText className="h-4 w-4 mr-2 text-purple-500" />
                    Judul Notifikasi
                  </label>
                  <div className="relative">
                    <input
                      ref={titleInputRef}
                      key={`title-${editingNotification?.id || 'new'}`}
                      type="text"
                      required
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500"
                      placeholder="Tulis judul yang menarik perhatian..."
                      onFocus={() => setActiveStep(1)}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>

                {/* Message Input */}
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    <FileText className="h-4 w-4 mr-2 text-purple-500" />
                    Pesan Notifikasi
                  </label>
                  <textarea
                    key={`message-${editingNotification?.id || 'new'}`}
                    required
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 resize-none text-gray-900 placeholder-gray-500"
                    placeholder="Tulis pesan singkat yang informatif..."
                    rows={4}
                    onFocus={() => setActiveStep(1)}
                  />
                </div>

                {/* News Article Selection */}
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    <Link className="h-4 w-4 mr-2 text-purple-500" />
                    Tautan Berita
                  </label>
                  <select
                    value={notificationForm.newsSlug || ''}
                    onChange={(e) => setNotificationForm({ ...notificationForm, newsSlug: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900"
                    onFocus={() => setActiveStep(1)}
                  >
                    <option value="">Pilih artikel berita (opsional)</option>
                    {newsArticles.map((article) => (
                      <option key={article.id} value={article.slug}>
                        {article.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Pilih artikel berita untuk ditautkan ke notifikasi ini
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Image Upload Section */}
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    <Image className="h-4 w-4 mr-2 text-purple-500" />
                    Gambar Notifikasi
                  </label>
                  
                  {/* Image Preview */}
                  {previewImage && (
                    <div className="mb-4 relative group/preview">
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="w-full h-40 object-cover rounded-xl shadow-lg transition-transform duration-300 group-hover/preview:scale-105"
                        onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                        <button
                          onClick={() => {
                            setPreviewImage('');
                            setNotificationForm({ ...notificationForm, image: '' });
                          }}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-200"
                          aria-label="Hapus gambar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* URL Input */}
                  <input
                    key={`image-url-${editingNotification?.id || 'new'}`}
                    type="url"
                    value={notificationForm.image}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 mb-3 text-gray-900 placeholder-gray-500"
                    placeholder="https://example.com/image.jpg"
                    onFocus={() => setActiveStep(2)}
                  />

                  {/* Drag & Drop Area */}
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${
                      dragActive 
                        ? 'border-purple-500 bg-purple-50 scale-105' 
                        : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      key={`image-file-${editingNotification?.id || 'new'}`}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="image-upload"
                      aria-label="Unggah gambar"
                    />
                    <div className="text-center">
                      <Upload className={`mx-auto h-8 w-8 mb-2 transition-colors duration-300 ${
                        dragActive ? 'text-purple-500' : 'text-gray-400'
                      }`} />
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-purple-600">Klik untuk upload</span> atau drag & drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF hingga 5MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium hover:scale-105"
                aria-label="Batal"
              >
                Batal
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium disabled:opacity-50 flex items-center hover:scale-105 hover:shadow-lg"
                aria-label={editingNotification ? "Perbarui notifikasi" : "Publikasikan notifikasi"}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {editingNotification ? 'Perbarui Notifikasi' : 'Publikasikan Notifikasi'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const NotificationManagement = ({ logActivity }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    newsSlug: ''
  });
  const [newsArticles, setNewsArticles] = useState([]);
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, id: null, title: '', message: '' });
  const editDataRef = useRef(null);

  const generateSlug = (text) => {
    if (!text) return `berita-${Date.now()}`;
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 100);
  };

  const resetForm = useCallback(() => {
    setNotificationForm({ title: '', message: '', image: '', type: 'news', newsSlug: '' });
    setEditingNotification(null);
    setPreviewImage('');
    setImageFile(null);
    setUploadType('url');
    editDataRef.current = null;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(notificationsData);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('Gagal memuat notifikasi.');
        setLoading(false);
      }
    }, (error) => {
      console.error('Snapshot error:', error);
      setError('Gagal memuat notifikasi.');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          try {
            const newsData = [];
            const updates = [];

            for (const docSnapshot of snapshot.docs) {
              const data = docSnapshot.data();
              const slug = data.slug || generateSlug(data.judul || data.title || `berita-${docSnapshot.id}`);

              if (!data.slug) {
                const newsRef = doc(db, 'news', docSnapshot.id);
                updates.push(
                  updateDoc(newsRef, { slug }).catch(err => 
                    console.error('Error updating slug:', err)
                  )
                );
              }

              newsData.push({
                id: docSnapshot.id,
                title: data.judul || data.title || 'Tanpa Judul',
                slug: slug,
                link: `/berita/${slug}`,
                createdAt: data.createdAt
              });
            }

            await Promise.all(updates);

            setNewsArticles(newsData.sort((a, b) => {
              const aTime = a.createdAt?.toDate() || new Date(0);
              const bTime = b.createdAt?.toDate() || new Date(0);
              return bTime - aTime;
            }));
          } catch (error) {
            console.error('Error processing news articles:', error);
            toast.error('Gagal memuat artikel berita.');
          }
        }, (error) => {
          console.error('Snapshot error:', error);
          toast.error('Gagal memuat artikel berita.');
        });
        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching news articles:', error);
        toast.error('Gagal memuat artikel berita.');
      }
    };

    fetchNews();
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
        toast.error('Harap pilih file gambar.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file harus kurang dari 5MB.');
        return;
      }
      try {
        const base64 = await convertFileToBase64(file);
        setImageFile(file);
        setPreviewImage(base64);
        setNotificationForm({ ...notificationForm, image: base64 });
      } catch (error) {
        console.error('Error converting file:', error);
        toast.error('Error memproses file gambar.');
      }
    }
  };

  const handleUrlChange = useCallback((url) => {
    setNotificationForm({ ...notificationForm, image: url });
    setPreviewImage(url);
  }, [notificationForm, setNotificationForm, setPreviewImage]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!notificationForm.title || !notificationForm.message) {
      toast.error('Mohon lengkapi judul dan pesan notifikasi.');
      return;
    }

    try {
      setLoading(true);
      if (editingNotification) {
        const notificationRef = doc(db, 'notifications', editingNotification.id);
        await updateDoc(notificationRef, {
          ...notificationForm,
          updatedAt: serverTimestamp()
        });
        logActivity('NOTIFICATION_EDIT', { 
          notificationId: editingNotification.id, 
          title: notificationForm.title, 
          type: notificationForm.type,
          newsSlug: notificationForm.newsSlug
        });
        toast.success('Notifikasi berhasil diperbarui.');
      } else {
        const docRef = await addDoc(collection(db, 'notifications'), {
          ...notificationForm,
          timestamp: serverTimestamp(),
          isRead: false
        });
        logActivity('NOTIFICATION_ADD', { 
          notificationId: docRef.id, 
          title: notificationForm.title, 
          type: notificationForm.type,
          newsSlug: notificationForm.newsSlug
        });
        toast.success('Notifikasi berhasil ditambahkan.');
      }
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving notification:', error);
      toast.error('Gagal menyimpan notifikasi: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [editingNotification, notificationForm, logActivity, resetForm, setShowModal]);

  const handleDelete = useCallback((id) => {
    setConfirmationModal({
      isOpen: true,
      id,
      title: 'Hapus Notifikasi',
      message: 'Apakah Anda yakin ingin menghapus notifikasi ini? Tindakan ini tidak dapat dibatalkan.'
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    const { id } = confirmationModal;
    if (!id) {
      toast.error('ID notifikasi tidak valid.');
      return;
    }
    try {
      setLoading(true);
      const notificationDoc = await getDoc(doc(db, 'notifications', id));
      if (notificationDoc.exists()) {
        const notificationData = notificationDoc.data();
        await deleteDoc(doc(db, 'notifications', id));
        logActivity('NOTIFICATION_DELETE', { 
          notificationId: id, 
          title: notificationData.title || 'N/A', 
          type: notificationData.type || 'N/A',
          newsSlug: notificationData.newsSlug || 'N/A'
        });
        toast.success('Notifikasi berhasil dihapus.');
      } else {
        toast.error('Notifikasi tidak ditemukan.');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Gagal menghapus notifikasi: ' + error.message);
    } finally {
      setLoading(false);
      setConfirmationModal({ isOpen: false, id: null, title: '', message: '' });
    }
  }, [confirmationModal, logActivity]);

  const handleEdit = useCallback((notification) => {
    console.log('Editing notification:', notification);
    try {
      if (!notification || !notification.id) {
        console.error('Invalid notification data:', notification);
        toast.error('Data notifikasi tidak valid.');
        return;
      }

      const formData = {
        title: notification.title || '',
        message: notification.message || '',
        image: notification.image || '',
        type: notification.type || 'news',
        newsSlug: notification.newsSlug || ''
      };

      editDataRef.current = notification;
      setEditingNotification(notification);
      setNotificationForm(formData);
      setPreviewImage(formData.image);
      setUploadType(formData.image && formData.image.startsWith('data:') ? 'file' : 'url');
      setShowModal(true);
    } catch (error) {
      console.error('Error preparing edit notification:', error);
      toast.error('Gagal memuat data notifikasi untuk diedit: ' + error.message);
    }
  }, [setShowModal, setNotificationForm, setPreviewImage, setUploadType]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Baru';
    try {
      const date = timestamp.toDate();
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
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Tanggal tidak valid';
    }
  };

  if (loading && !notifications.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-indigo-600 font-medium animate-pulse">Memuat data notifikasi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 text-center">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <p className="text-xl font-semibold text-gray-900">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center space-x-4 animate-slideRight">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <PlusCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Manajemen Notifikasi</h1>
              <p className="text-indigo-100 text-lg">Kelola dan pantau notifikasi sistem</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8 animate-slideUp">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <PlusCircle className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Daftar Notifikasi</h2>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
              aria-label="Tambah notifikasi"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Tambah Notifikasi</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Judul</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Pesan</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Gambar</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Tautan Berita</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <PlusCircle className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Notifikasi</h3>
                        <p className="text-gray-600">Belum ada notifikasi yang tersedia.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  notifications.map((notification, index) => (
                    <tr 
                      key={notification.id} 
                      className={`transition-all duration-300 transform hover:scale-[1.01] animate-fadeInUp ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{notification.title || 'Tanpa Judul'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{notification.message || 'Tanpa Pesan'}</td>
                      <td className="px-6 py-4 text-sm">
                        {notification.image ? (
                          <div className="flex items-center space-x-2">
                            <img
                              src={notification.image}
                              alt="Preview"
                              className="h-10 w-10 rounded-lg object-cover border border-gray-200 shadow-sm"
                              onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                            />
                            <Image className="h-4 w-4 text-indigo-500" />
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">Tidak ada</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {notification.newsSlug ? (
                          <a 
                            href={`/berita/${notification.newsSlug}`} 
                            className="text-indigo-600 hover:text-indigo-900 underline truncate block max-w-xs"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {newsArticles.find(article => article.slug === notification.newsSlug)?.title || notification.newsSlug}
                          </a>
                        ) : (
                          <span className="text-gray-500 italic">Tidak ada tautan</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(notification.timestamp)}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => handleEdit(notification)} 
                            className="text-indigo-600 hover:text-indigo-900 transition-all duration-200 hover:scale-110"
                            aria-label="Edit notifikasi"
                          >
                            <Edit3 className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(notification.id)} 
                            className="text-red-600 hover:text-red-900 transition-all duration-200 hover:scale-110"
                            aria-label="Hapus notifikasi"
                          >
                            <Trash className="h-5 w-5" />
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
      <NotificationModal
        showModal={showModal}
        setShowModal={setShowModal}
        editingNotification={editingNotification}
        notificationForm={notificationForm}
        setNotificationForm={setNotificationForm}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        loading={loading}
        uploadType={uploadType}
        setUploadType={setUploadType}
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
        handleImageUpload={handleImageUpload}
        handleUrlChange={handleUrlChange}
        newsArticles={newsArticles}
      />
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, id: null, title: '', message: '' })}
        onConfirm={confirmDelete}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />
      <div className="h-16"></div>
    </div>
  );
};

export default NotificationManagement;