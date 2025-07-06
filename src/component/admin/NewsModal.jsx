import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { X, Save, Upload, Image, FileText, User, Tag, Globe, Edit3, Camera, Eye, EyeOff } from 'lucide-react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebaseconfig";
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";

const NewsModal = ({ 
  showModal, 
  setShowModal, 
  editingNews, 
  formData, 
  setFormData, 
  handleSubmit, 
  resetForm, 
  loading,
  logActivity
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [useUserName, setUseUserName] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (showModal) {
      setIsAnimating(true);
      // Set image preview if editing
      if (editingNews && formData.gambar) {
        setImagePreview(formData.gambar);
      }
      // Set initial showProfilePicture based on editingNews
      if (editingNews && editingNews.hideProfilePicture !== undefined) {
        setShowProfilePicture(!editingNews.hideProfilePicture); // Invert because hideProfilePicture=true means showProfilePicture=false
      }
    } else {
      setIsAnimating(false);
      setImagePreview('');
      setUseUserName(false); // Reset to manual input when closing
      // Do not reset showProfilePicture here to preserve the last state
    }
  }, [showModal, editingNews, formData.gambar]);

  useEffect(() => {
    // Sync showProfilePicture with formData.hideProfilePicture
    setFormData(prev => ({
      ...prev,
      hideProfilePicture: !showProfilePicture // true if hidden, false if shown
    }));
  }, [showProfilePicture, setFormData]);

  useEffect(() => {
    if (formData.gambar && formData.gambar.startsWith('http')) {
      if (formData.gambar.startsWith('https://')) {
        setImagePreview(formData.gambar);
      } else {
        alert('Only HTTPS image URLs are supported due to security restrictions.');
        setFormData(prev => ({ ...prev, gambar: '' }));
      }
    }
  }, [formData.gambar]);

  if (!showModal) return null;

  // Utility function to generate a URL-friendly slug
  const generateSlug = async (title) => {
    if (!title || typeof title !== 'string') return '';
    let slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);

    let baseSlug = slug;
    let counter = 1;
    while (true) {
      const slugQuery = query(collection(db, "news"), where("slug", "==", slug));
      const snapshot = await getDocs(slugQuery);
      if (snapshot.empty || (editingNews && snapshot.docs[0].id === editingNews.id)) {
        return slug;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  };

  // Validate image file
  const validateImageFile = (file, callback) => {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      callback(new Error(`Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`));
      return;
    }

    if (!allowedMimeTypes.includes(file.type)) {
      callback(new Error(`Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`));
      return;
    }

    if (file.size > maxSize) {
      callback(new Error('File size exceeds 5MB limit.'));
      return;
    }

    createImageBitmap(file).then(() => {
      callback(null);
    }).catch(() => {
      callback(new Error('File is not a valid image.'));
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    validateImageFile(file, async (error) => {
      if (error) {
        alert(error.message);
        return;
      }

      setUploading(true);
      const formDataImg = new FormData();
      formDataImg.append("image", file);

      try {
        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
          { method: "POST", body: formDataImg }
        );

        const data = await response.json();
        if (!data.success) throw new Error("Upload failed: " + (data.error?.message || "Unknown error"));

        const publicUrl = data.data.display_url;
        if (!publicUrl.startsWith('https://')) {
          throw new Error('Uploaded image URL is not secure (HTTPS).');
        }
        setFormData(prev => ({ ...prev, gambar: publicUrl }));
        setImagePreview(publicUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image: " + error.message);
      } finally {
        setUploading(false);
      }
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        validateImageFile(file, async (error) => {
          if (error) {
            alert(error.message);
            return;
          }

          setUploading(true);
          const formDataImg = new FormData();
          formDataImg.append("image", file);

          try {
            const response = await fetch(
              `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
              { method: "POST", body: formDataImg }
            );

            const data = await response.json();
            if (!data.success) throw new Error("Upload failed: " + (data.error?.message || "Unknown error"));

            const publicUrl = data.data.display_url;
            if (!publicUrl.startsWith('https://')) {
              throw new Error('Uploaded image URL is not secure (HTTPS).');
            }
            setFormData(prev => ({ ...prev, gambar: publicUrl }));
            setImagePreview(publicUrl);
          } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error uploading image: " + error.message);
          } finally {
            setUploading(false);
          }
        });
      }
    }
  };

  const handleSubmitWithLog = async () => {
    try {
      const newSlug = await generateSlug(formData.judul);
      const updatedFormData = { ...formData, slug: newSlug };
      setFormData(updatedFormData);

      const newsId = await handleSubmit(updatedFormData);

      if (!loading) {
        const action = editingNews ? 'NEWS_EDIT' : 'NEWS_ADD';
        await logActivity(action, { 
          newsId: editingNews?.id || newsId || 'new', 
          title: formData.judul, 
          category: formData.kategori,
          slug: newSlug,
          hideProfilePicture: formData.hideProfilePicture // Log the hide status
        });
      }
      setShowModal(false);
      resetForm();
      window.dispatchEvent(new CustomEvent('newsEdited', { 
        detail: { 
          newsId: editingNews?.id || newsId, 
          newSlug,
          oldSlug: editingNews?.slug
        }
      }));
      return newsId;
    } catch (error) {
      console.error('Error submitting news:', error);
      alert(`Gagal menyimpan berita: ${error.message}`);
      await logActivity('SUBMIT_NEWS_ERROR', {
        newsId: editingNews?.id || 'new',
        title: formData.judul,
        error: error.message
      });
      return null;
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShowModal(false);
      // Do not reset showProfilePicture here to preserve the last state
      resetForm();
      setUseUserName(false); // Reset to manual input when closing
    }, 200);
  };

  const handleUseUserName = () => {
    if (currentUser && currentUser.displayName) {
      setFormData(prev => ({ ...prev, author: currentUser.displayName }));
      setUseUserName(true);
    } else {
      alert('No username available. Please enter a name manually.');
    }
  };

  const handleSwitchToManual = () => {
    setUseUserName(false);
    setFormData(prev => ({ ...prev, author: '' }));
  };

  const categories = [
    { value: "Nasional", icon: "📰", color: "bg-yellow-50 text-yellow-800 border-yellow-200" },
    { value: "Internasional", icon: "🌐", color: "bg-green-50 text-green-800 border-green-200" },
    { value: "Olahraga", icon: "⚽", color: "bg-blue-50 text-blue-800 border-blue-200" },
    { value: "Ekonomi", icon: "💰", color: "bg-green-50 text-green-800 border-green-200" },
    { value: "Teknologi", icon: "💻", color: "bg-purple-50 text-purple-800 border-purple-200" },
    { value: "Lifestyle", icon: "🌿", color: "bg-pink-50 text-pink-800 border-pink-200" },
    { value: "Daerah", icon: "🏘️", color: "bg-orange-50 text-orange-800 border-orange-200" },
    { value: "Pendidikan", icon: "📚", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
    { value: "Kesehatan", icon: "🏥", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    { value: "Otomotif", icon: "🚗", color: "bg-red-50 text-red-800 border-red-200" },
    { value: "Wisata", icon: "🏞️", color: "bg-teal-50 text-teal-800 border-teal-200" },
    { value: "Kuliner", icon: "🍽️", color: "bg-amber-50 text-amber-800 border-amber-200" },
    { value: "Entertainment", icon: "🎬", color: "bg-violet-50 text-violet-800 border-violet-200" },
  ];

  const steps = [
    { id: 1, title: "Info Dasar", icon: FileText },
    { id: 2, title: "Media", icon: Image },
    { id: 3, title: "Konten", icon: Globe }
  ];

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto transition-all duration-300 ${
      isAnimating ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'
    }`}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full max-w-4xl transform transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {editingNews ? '✏️ Edit Berita' : '✨ Buat Berita Baru'}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {editingNews ? 'Perbarui informasi berita' : 'Bagikan cerita terbaru kepada dunia'}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 group"
                >
                  <X className="h-5 w-5 text-white group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="flex justify-center mt-6 space-x-8">
                {steps.map((step) => (
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

            {/* Content */}
            <div className="p-8 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Title Input */}
                  <div className="group">
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                      <FileText className="h-4 w-4 mr-2 text-purple-500" />
                      Judul Berita
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.judul}
                        onChange={(e) => setFormData(prev => ({ ...prev, judul: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500"
                        placeholder="Tulis judul yang menarik perhatian..."
                        onFocus={() => setActiveStep(1)}
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="group">
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                      <Tag className="h-4 w-4 mr-2 text-purple-500" />
                      Kategori
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, kategori: cat.value }))}
                          className={`p-3 rounded-xl border-2 transition-all duration-300 flex items-center space-x-2 hover:scale-105 ${
                            formData.kategori === cat.value
                              ? `${cat.color} border-current transform scale-105 shadow-lg`
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <span className="text-lg">{cat.icon}</span>
                          <span className="text-sm font-medium">{cat.value}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Author Input */}
                  <div className="group">
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                      <User className="h-4 w-4 mr-2 text-purple-500" />
                      Penulis
                    </label>
                    
                    {/* Profile Picture Section */}
                    {currentUser && currentUser.photoURL && (
                      <div className="flex items-center justify-between mb-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {showProfilePicture ? (
                            <img 
                              src={currentUser.photoURL} 
                              alt="Profile" 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700">
                              {currentUser.displayName || currentUser.email}
                            </span>
                            {!showProfilePicture && (
                              <span className="text-xs text-gray-500 italic">
                                [Foto profil disembunyikan]
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowProfilePicture(!showProfilePicture)}
                          className="p-1 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                          title={showProfilePicture ? "Sembunyikan foto profil" : "Tampilkan foto profil"}
                        >
                          {showProfilePicture ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    )}

                    {/* Author Input Field */}
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          required
                          value={formData.author}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, author: e.target.value }));
                            setUseUserName(false); // Switch to manual input when typing
                          }}
                          className={`w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500 ${
                            useUserName ? 'bg-blue-50 border-blue-300' : ''
                          }`}
                          placeholder="Masukkan nama penulis..."
                          readOnly={useUserName}
                        />
                        {useUserName && (
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none" />
                        )}
                      </div>
                      
                      {/* Toggle Button */}
                      {useUserName ? (
                        <button
                          type="button"
                          onClick={handleSwitchToManual}
                          className="px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-300 flex items-center space-x-2"
                          title="Ketik manual"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span className="text-sm">Manual</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleUseUserName}
                          className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 flex items-center space-x-2"
                          disabled={!currentUser || !currentUser.displayName}
                          title="Gunakan username"
                        >
                          <User className="h-4 w-4" />
                          <span className="text-sm">Username</span>
                        </button>
                      )}
                    </div>
                    
                    {/* Helper Text */}
                    <div className="mt-2 text-xs text-gray-500">
                      {useUserName ? (
                        <div className="flex items-center space-x-1">
                          <span>✓ Menggunakan username akun</span>
                          <button
                            type="button"
                            onClick={handleSwitchToManual}
                            className="text-blue-500 hover:text-blue-700 underline"
                          >
                            Ganti ke manual
                          </button>
                        </div>
                      ) : (
                        currentUser && currentUser.displayName && (
                          <div className="flex items-center space-x-1">
                            <span>💡 Username tersedia:</span>
                            <button
                              type="button"
                              onClick={handleUseUserName}
                              className="text-blue-500 hover:text-blue-700 underline"
                            >
                              {currentUser.displayName}
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Image Upload Section */}
                  <div className="group">
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                      <Image className="h-4 w-4 mr-2 text-purple-500" />
                      Gambar Berita
                    </label>
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mb-4 relative group/preview">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-40 object-cover rounded-xl shadow-lg transition-transform duration-300 group-hover/preview:scale-105"
                          onError={(e) => {
                            e.target.src = '';
                            alert('Failed to load image. Please use a valid HTTPS URL or upload a new image.');
                            setFormData(prev => ({ ...prev, gambar: '' }));
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                          <button
                            onClick={() => {
                              setImagePreview('');
                              setFormData(prev => ({ ...prev, gambar: '' }));
                            }}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* URL Input */}
                    <input
                      type="url"
                      value={formData.gambar}
                      onChange={(e) => setFormData(prev => ({ ...prev, gambar: e.target.value }))}
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
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                      />
                      <div className="text-center">
                        <Upload className={`mx-auto h-8 w-8 mb-2 transition-colors duration-300 ${
                          dragActive ? 'text-purple-500' : 'text-gray-400'
                        }`} />
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold text-purple-600">Klik untuk upload</span> atau drag & drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WEBP hingga 5MB</p>
                      </div>
                    </div>

                    {/* Image Description */}
                    <input
                      type="text"
                      value={formData.gambarDeskripsi || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, gambarDeskripsi: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 mt-3 text-gray-900 placeholder-gray-500"
                      placeholder="Deskripsi gambar (opsional)..."
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-8 group">
                <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                  <Globe className="h-4 w-4 mr-2 text-purple-500" />
                  Ringkasan Berita
                </label>
                <textarea
                  value={formData.ringkasan}
                  onChange={(e) => setFormData(prev => ({ ...prev, ringkasan: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 resize-none text-gray-900 placeholder-gray-500"
                  placeholder="Tulis ringkasan singkat yang menarik..."
                  onFocus={() => setActiveStep(3)}
                />
              </div>

              {/* Content Editor */}
              <div className="mt-6 group">
                <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                  <FileText className="h-4 w-4 mr-2 text-purple-500" />
                  Konten Berita
                </label>
                <div className="rounded-xl overflow-hidden border-2 border-gray-200 focus-within:border-purple-500 transition-colors duration-300 bg-white">
                  <ReactQuill
                    theme="snow"
                    value={formData.konten}
                    onChange={(val) => setFormData(prev => ({ ...prev, konten: val }))}
                    className="text-gray-900"
                    style={{ minHeight: '300px' }}
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                      ],
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium hover:scale-105"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitWithLog}
                  disabled={loading || uploading}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium disabled:opacity-50 flex items-center hover:scale-105 hover:shadow-lg"
                >
                  {loading || uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingNews ? 'Update Berita' : 'Publikasikan'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsModal;