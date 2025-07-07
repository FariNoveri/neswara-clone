import { X, Save, Upload, Image, FileText, User, Tag, Globe, Edit3, Camera, Eye, EyeOff } from 'lucide-react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebaseconfig";
import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';

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
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [imageError, setImageError] = useState('');
  const [cropKey, setCropKey] = useState(0);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [crop, setCrop] = useState({ unit: '%', x: 0, y: 0, width: 100, height: 100 * (9 / 16), aspect: 16 / 9 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [zoom, setZoom] = useState(1);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: formData.konten,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, konten: editor.getHTML() }));
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (showModal) {
      setIsAnimating(true);
      if (editingNews && formData.gambar) {
        setImagePreview(formData.gambar);
      }
      if (editingNews && editingNews.hideProfilePicture !== undefined) {
        setShowProfilePicture(!editingNews.hideProfilePicture);
      }
      if (editor && editingNews) {
        editor.commands.setContent(formData.konten);
      }
    } else {
      setIsAnimating(false);
      setImagePreview('');
      setUseUserName(false);
      setCropModalOpen(false);
      setImageToCrop(null);
      setOriginalImage(null);
      setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 * (9 / 16), aspect: 16 / 9 });
      setCompletedCrop(null);
      setZoom(1);
      setImageError('');
      setCropKey(prev => prev + 1);
      if (editor) {
        editor.commands.setContent('');
      }
    }
  }, [showModal, editingNews, formData.gambar, formData.konten, editor]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      hideProfilePicture: !showProfilePicture
    }));
  }, [showProfilePicture, setFormData]);

  useEffect(() => {
    if (formData.gambar && formData.gambar.startsWith('https://')) {
      const cacheBustedUrl = `${formData.gambar}?t=${Date.now()}`;
      fetch(cacheBustedUrl, { method: 'HEAD', cache: 'no-cache', mode: 'cors' })
        .then(response => {
          if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
            setImagePreview(cacheBustedUrl);
            setImageError('');
          } else {
            throw new Error('Invalid or inaccessible image URL.');
          }
        })
        .catch((error) => {
          setImageError(`Failed to load image: ${error.message}. Please use a valid HTTPS URL or upload a new image.`);
          setFormData(prev => ({ ...prev, gambar: '' }));
          setImagePreview('');
          setOriginalImage(null);
        });
    } else if (formData.gambar) {
      setImageError('Only HTTPS image URLs are supported.');
      setFormData(prev => ({ ...prev, gambar: '' }));
      setImagePreview('');
      setOriginalImage(null);
    } else {
      setImageError('');
      setOriginalImage(null);
    }
  }, [formData.gambar]);

  useEffect(() => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) return;

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');
    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );
  }, [completedCrop]);

  useEffect(() => {
    if (cropModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [cropModalOpen]);

  if (!showModal) return null;

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

  const getCroppedImg = () => {
    return new Promise((resolve, reject) => {
      if (!completedCrop || !canvasRef.current) {
        reject(new Error('No crop data available.'));
        return;
      }

      canvasRef.current.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create cropped image.'));
            return;
          }
          const croppedFile = new File([blob], `cropped-image-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(croppedFile);
        },
        'image/jpeg',
        1
      );
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    validateImageFile(file, async (error) => {
      if (error) {
        setImageError(error.message);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setOriginalImage(reader.result);
        setImageToCrop(reader.result);
        setCropModalOpen(true);
        setCropKey(prev => prev + 1);
      };
      reader.onerror = () => {
        setImageError('Failed to read image file. Please try another image.');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCropConfirm = async () => {
    if (!imageToCrop || !completedCrop) {
      console.log('No image or crop data available');
      setCropModalOpen(false);
      return;
    }

    setUploading(true);
    try {
      const croppedFile = await getCroppedImg();

      const formDataImg = new FormData();
      formDataImg.append("image", croppedFile);

      let attempts = 0;
      const maxAttempts = 3;
      let uploadSuccess = false;
      let publicUrl = '';

      while (attempts < maxAttempts && !uploadSuccess) {
        try {
          const response = await fetch(
            `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
            { 
              method: "POST", 
              body: formDataImg,
              headers: {
                'Accept': 'application/json',
              }
            }
          );

          const data = await response.json();
          if (!data.success) {
            throw new Error(`Upload failed: ${data.error?.message || "Unknown error"}`);
          }

          publicUrl = data.data.display_url;
          if (!publicUrl.startsWith('https://')) {
            throw new Error('Uploaded image URL is not secure (HTTPS).');
          }

          await fetch(`${publicUrl}?t=${Date.now()}`, { method: 'HEAD', cache: 'no-cache', mode: 'cors' })
            .then(res => {
              if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) {
                throw new Error('Uploaded image is inaccessible or invalid.');
              }
            });
          
          uploadSuccess = true;
        } catch (error) {
          attempts++;
          console.error(`Upload attempt ${attempts} failed:`, error);
          if (attempts === maxAttempts) {
            throw new Error(`Failed to upload image after ${maxAttempts} attempts: ${error.message}`);
          }
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }

      setFormData(prev => ({ ...prev, gambar: publicUrl }));
      setImagePreview(`${publicUrl}?t=${Date.now()}`);
      setImageError('');
      console.log('Cropped image uploaded:', publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      setImageError(`Error uploading image: ${error.message}. Please try again or use a different image.`);
    } finally {
      setUploading(false);
      setCropModalOpen(false);
      setImageToCrop(null);
      setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 * (9 / 16), aspect: 16 / 9 });
      setCompletedCrop(null);
      setZoom(1);
      setCropKey(prev => prev + 1);
    }
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
            setImageError(error.message);
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            setOriginalImage(reader.result);
            setImageToCrop(reader.result);
            setCropModalOpen(true);
            setCropKey(prev => prev + 1);
          };
          reader.onerror = () => {
            setImageError('Failed to read image file. Please try another image.');
          };
          reader.readAsDataURL(file);
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
          hideProfilePicture: formData.hideProfilePicture
        });
      }
      setShowModal(false);
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
      resetForm();
      setUseUserName(false);
      setCropModalOpen(false);
      setImageToCrop(null);
      setOriginalImage(null);
      setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 * (9 / 16), aspect: 16 / 9 });
      setCompletedCrop(null);
      setZoom(1);
      setImageError('');
      setCropKey(prev => prev + 1);
      if (editor) {
        editor.commands.setContent('');
      }
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

  const Toolbar = () => (
    <div className="border-b border-gray-200 bg-gray-50 p-2 rounded-t-xl">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 ${editor?.isActive('bold') ? 'bg-purple-100' : ''}`}
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 ${editor?.isActive('italic') ? 'bg-purple-100' : ''}`}
        title="Italic"
      >
        <i>I</i>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 ${editor?.isActive('bulletList') ? 'bg-purple-100' : ''}`}
        title="Bullet List"
      >
        •
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 ${editor?.isActive('orderedList') ? 'bg-purple-100' : ''}`}
        title="Numbered List"
      >
        1.
      </button>
      <button
        onClick={() => {
          const url = prompt('Enter image URL:');
          if (url && url.startsWith('https://')) {
            editor.chain().focus().setImage({ src: url }).run();
          } else {
            alert('Please enter a valid HTTPS image URL.');
          }
        }}
        className="px-2 py-1"
        title="Insert Image"
      >
        <Image className="h-4 w-4 inline" />
      </button>
      <button
        onClick={() => editor.chain().focus().undo().run()}
        className="px-2 py-1"
        title="Undo"
      >
        ↺
      </button>
    </div>
  );

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
    <>
      <div className={`fixed inset-0 z-50 overflow-y-auto transition-all duration-300 ${isAnimating ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'}`}>
        <div className="flex min-h-full items-center justify-center p-4">
          <div className={`relative w-full max-w-4xl transform transition-all duration-300 ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
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
                <div className="flex justify-center mt-6 space-x-8">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full transition-all duration-300 ${activeStep >= step.id ? 'bg-white text-purple-600 shadow-lg scale-110' : 'bg-white/20 text-white/70'}`}>
                        <step.icon className="h-4 w-4" />
                      </div>
                      <span className={`text-sm font-medium transition-colors duration-300 ${activeStep >= step.id ? 'text-white' : 'text-white/70'}`}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-8 bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
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
                          onChange={(e) => {
                            if (e.target.value.length <= 50) {
                              setFormData(prev => ({ ...prev, judul: e.target.value }));
                            }
                          }}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500"
                          placeholder="Tulis judul (max 50 karakter)..."
                          onFocus={() => setActiveStep(1)}
                          maxLength={50}
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <div className="text-xs text-gray-500 mt-1">
                          {formData.judul.length}/50 karakter
                        </div>
                      </div>
                    </div>
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
                            className={`p-3 rounded-xl border-2 transition-all duration-300 flex items-center space-x-2 hover:scale-105 ${formData.kategori === cat.value ? `${cat.color} border-current transform scale-105 shadow-lg` : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'}`}
                          >
                            <span className="text-lg">{cat.icon}</span>
                            <span className="text-sm font-medium">{cat.value}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="group">
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                        <User className="h-4 w-4 mr-2 text-purple-500" />
                        Penulis
                      </label>
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
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            required
                            value={formData.author}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, author: e.target.value }));
                              setUseUserName(false);
                            }}
                            className={`w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500 ${useUserName ? 'bg-blue-50 border-blue-300' : ''}`}
                            placeholder="Masukkan nama penulis..."
                            readOnly={useUserName}
                          />
                          {useUserName && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none" />
                          )}
                        </div>
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
                  <div className="space-y-6">
                    <div className="group">
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                        <Image className="h-4 w-4 mr-2 text-purple-500" />
                        Gambar Berita
                      </label>
                      {imageError && (
                        <div className="mb-3 text-sm text-red-600">{imageError}</div>
                      )}
                      {imagePreview && !imageError && (
                        <div className="mb-4 relative group/preview">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-40 object-cover rounded-xl shadow-lg transition-transform duration-300 group-hover/preview:scale-105"
                            onError={(e) => {
                              e.target.src = '';
                              setImageError('Failed to load image. Please use a valid HTTPS URL or upload a new image.');
                              setFormData(prev => ({ ...prev, gambar: '' }));
                              setImagePreview('');
                              setOriginalImage(null);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center space-x-4">
                            <button
                              onClick={() => {
                                if (originalImage) {
                                  setImageToCrop(originalImage);
                                } else if (imagePreview.startsWith('https://')) {
                                  setImageToCrop(imagePreview);
                                }
                                setCropModalOpen(true);
                                setCropKey(prev => prev + 1);
                              }}
                              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors duration-200"
                            >
                              <Camera className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setImagePreview('');
                                setFormData(prev => ({ ...prev, gambar: '' }));
                                setOriginalImage(null);
                                setImageError('');
                              }}
                              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-200"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      <input
                        type="url"
                        value={formData.gambar}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, gambar: e.target.value }));
                          setImageError('');
                          setOriginalImage(null);
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 mb-3 text-gray-900 placeholder-gray-500"
                        placeholder="https://example.com/image.jpg"
                        onFocus={() => setActiveStep(2)}
                      />
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${dragActive ? 'border-purple-500 bg-purple-50 scale-105' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'}`}
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
                          <Upload className={`mx-auto h-8 w-8 mb-2 transition-colors duration-300 ${dragActive ? 'text-purple-500' : 'text-gray-400'}`} />
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold text-purple-600">Klik untuk upload</span> atau drag & drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WEBP hingga 5MB</p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.gambarDeskripsi || ''}
                          onChange={(e) => {
                            if (e.target.value.length <= 30) {
                              setFormData(prev => ({ ...prev, gambarDeskripsi: e.target.value }));
                            }
                          }}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 mt-3 text-gray-900 placeholder-gray-500"
                          placeholder="Deskripsi gambar (max 30 karakter)..."
                          maxLength={30}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {formData.gambarDeskripsi?.length || 0}/30 karakter
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                <div className="mt-6 group">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    <FileText className="h-4 w-4 mr-2 text-purple-500" />
                    Konten Berita
                  </label>
                  <div className="rounded-xl overflow-hidden border-2 border-gray-200 focus-within:border-purple-500 transition-colors duration-300 bg-white">
                    <Toolbar />
                    <EditorContent editor={editor} className="p-4 min-h-[300px] text-gray-900" />
                  </div>
                </div>
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
      {cropModalOpen && imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit Gambar</h3>
              <button
                onClick={() => {
                  setCropModalOpen(false);
                  setImageToCrop(null);
                  setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 * (9 / 16), aspect: 16 / 9 });
                  setCompletedCrop(null);
                  setZoom(1);
                  setCropKey(prev => prev + 1);
                }}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="mb-4">
              <ReactCrop
                key={cropKey}
                crop={crop}
                onChange={(c, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={16 / 9}
                minWidth={100}
                minHeight={100}
              >
                <img
                  ref={imgRef}
                  src={imageToCrop}
                  alt="Crop"
                  style={{ maxHeight: '400px', width: '100%', objectFit: 'contain', transform: `scale(${zoom})` }}
                  onLoad={() => {
                    setCrop({
                      unit: '%',
                      x: 0,
                      y: 0,
                      width: 100,
                      height: 100 * (9 / 16),
                      aspect: 16 / 9
                    });
                    setImageError('');
                    console.log('Crop image loaded:', imageToCrop);
                  }}
                  onError={() => {
                    setImageError('Failed to load image for cropping. Please try uploading again.');
                    setCropModalOpen(false);
                    setImageToCrop(null);
                    setCropKey(prev => prev + 1);
                    console.log('Crop image failed:', imageToCrop);
                  }}
                />
              </ReactCrop>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Zoom</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => {
                  const newZoom = parseFloat(e.target.value);
                  setZoom(newZoom);
                  if (imgRef.current) {
                    imgRef.current.style.transform = `scale(${newZoom})`;
                  }
                }}
                className="w-full"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setCrop({
                    unit: '%',
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100 * (9 / 16),
                    aspect: 16 / 9
                  });
                  setZoom(1);
                  if (imgRef.current) {
                    imgRef.current.style.transform = 'scale(1)';
                  }
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
              >
                Reset
              </button>
              <button
                onClick={handleCropConfirm}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                disabled={uploading || !completedCrop}
              >
                {uploading ? 'Mengunggah...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewsModal;
