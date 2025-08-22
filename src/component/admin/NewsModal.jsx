import { X, Save, Upload, Image, FileText, User, Tag, Globe, Edit3, Camera, Eye, EyeOff, RefreshCw, Shield, Link } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebaseconfig";
import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import 'react-image-crop/dist/ReactCrop.css';
import ReactCrop from 'react-image-crop';

const NewsModal = ({
  showModal,
  setShowModal,
  editingNews,
  formData,
  setFormData,
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [useUserName, setUseUserName] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState(true);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [imageError, setImageError] = useState('');
  const [cropKey, setCropKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [originalAuthorData, setOriginalAuthorData] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [isAuthorOverridden, setIsAuthorOverridden] = useState(false);
  const [newsSearchModalOpen, setNewsSearchModalOpen] = useState(false);
  const [newsSearchQuery, setNewsSearchQuery] = useState('');
  const [newsSearchResults, setNewsSearchResults] = useState([]);
  const [allNewsArticles, setAllNewsArticles] = useState([]);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [crop, setCrop] = useState({ unit: '%', x: 0, y: 0, width: 100, height: 100 * (9 / 16), aspect: 16 / 9 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [zoom, setZoom] = useState(1);
  const loggedLegacyArticles = useRef(new Set());

  const TITLE_MAX_LENGTH = 200;

  const isOriginalAuthor = !editingNews || 
    (editingNews && (
      (editingNews.authorId && editingNews.authorId === currentUser?.uid) || 
      (!editingNews.authorId && isAdmin) || 
      isAuthorOverridden
    ));

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
        protocols: ['https'],
        validate: href => /^https?:\/\//.test(href),
      }),
    ],
    content: formData.konten || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setFormData(prev => ({ ...prev, konten: html }));
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && formData.konten && editor.getHTML() !== formData.konten) {
      editor.commands.setContent(formData.konten);
    }
  }, [editor, formData.konten]);

  useEffect(() => {
    const fetchAllNews = async () => {
      try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const newsData = [];
          snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const slug = data.slug || createSlug(data.judul || `berita-${docSnap.id}`);
            newsData.push({
              id: docSnap.id,
              judul: data.judul || 'Tanpa Judul',
              slug: slug,
              ringkasan: data.ringkasan || '',
              kategori: data.kategori || '',
              createdAt: data.createdAt,
              ...data
            });
          });
          setAllNewsArticles(newsData);
          console.log('[NewsModal] Loaded news articles:', newsData.length);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error('[NewsModal] Error fetching all news:', error);
      }
    };

    if (showModal) {
      fetchAllNews();
    }
  }, [showModal]);

  useEffect(() => {
    const fetchRelatedNews = async () => {
      if (formData.kategori && allNewsArticles.length > 0) {
        try {
          const related = allNewsArticles
            .filter(article => 
              article.kategori === formData.kategori && 
              article.id !== editingNews?.id
            )
            .slice(0, 3);
          setRelatedNews(related);
        } catch (error) {
          console.error('[NewsModal] Error fetching related news:', error);
        }
      }
    };
    fetchRelatedNews();
  }, [formData.kategori, editingNews, allNewsArticles]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const tokenResult = await getIdTokenResult(user, true);
          setCurrentUser({ ...user, displayName: user.displayName, email: user.email });
          setIsAdmin(tokenResult.claims.isAdmin === true);
        } catch (error) {
          console.error('[NewsModal] Error checking admin status:', error);
          setErrorMessage('Gagal memverifikasi status admin.');
          setIsAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAuthorData = async () => {
      if (editingNews && editingNews.authorId) {
        try {
          const userDoc = await getDoc(doc(db, "users", editingNews.authorId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setOriginalAuthorData({
              displayName: userData.displayName || editingNews.author || 'Tanpa Nama',
              email: userData.email || 'Tidak tersedia',
              photoURL: userData.photoURL || null,
            });
          } else {
            setOriginalAuthorData({
              displayName: editingNews.author || 'Tanpa Nama',
              email: editingNews.authorEmail || 'Tidak tersedia',
              photoURL: editingNews.authorPhotoURL || null,
            });
          }
        } catch (error) {
          console.error('[NewsModal] Error fetching original author data:', error);
          setOriginalAuthorData({
            displayName: editingNews.author || 'Tanpa Nama',
            email: editingNews.authorEmail || 'Tidak tersedia',
            photoURL: editingNews.authorPhotoURL || null,
          });
        }
      } else if (editingNews && !editingNews.authorId) {
        setOriginalAuthorData({
          displayName: editingNews.author || 'Tanpa Nama',
          email: editingNews.authorEmail || 'Tidak tersedia',
          photoURL: editingNews.authorPhotoURL || null,
        });
      } else {
        setOriginalAuthorData(null);
      }
    };
    fetchAuthorData();
  }, [editingNews]);

  const refreshUserData = async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.getIdToken(true);
        const user = auth.currentUser;
        setCurrentUser({ ...user, displayName: user.displayName, email: user.email });
        if (editingNews && editingNews.authorId) {
          const userDoc = await getDoc(doc(db, "users", editingNews.authorId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setOriginalAuthorData({
              displayName: userData.displayName || editingNews.author || 'Tanpa Nama',
              email: userData.email || 'Tidak tersedia',
              photoURL: userData.photoURL || null,
            });
          } else {
            setOriginalAuthorData({
              displayName: editingNews.author || 'Tanpa Nama',
              email: editingNews.authorEmail || 'Tidak tersedia',
              photoURL: editingNews.authorPhotoURL || null,
            });
          }
        }
      } catch (error) {
        console.error('[NewsModal] Error refreshing user data:', error);
        setErrorMessage('Gagal memperbarui data pengguna.');
      }
    }
  };

  useEffect(() => {
    if (showModal && editingNews) {
      setIsAnimating(true);
      if (formData.gambar) {
        setImagePreview(formData.gambar);
      }
      if (editingNews.hideProfilePicture !== undefined) {
        setShowProfilePicture(!editingNews.hideProfilePicture);
      }
      setFormData(prev => ({ ...prev, author: editingNews.author || '' }));
      setUseUserName(editingNews.author === currentUser?.displayName);
      setIsAuthorOverridden(false);
    } else if (showModal) {
      setIsAnimating(true);
      setUseUserName(false);
      setIsAuthorOverridden(false);
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
      setErrorMessage('');
      setCropKey(prev => prev + 1);
      setIsAuthorOverridden(false);
      setNewsSearchModalOpen(false);
      setNewsSearchQuery('');
      setNewsSearchResults([]);
      if (editor) {
        editor.commands.setContent('');
      }
    }
  }, [showModal, editingNews, formData.gambar, editor, currentUser, setFormData]);

  useEffect(() => {
    if (!editingNews || isOriginalAuthor) {
      setFormData(prev => ({
        ...prev,
        hideProfilePicture: !showProfilePicture
      }));
    }
  }, [showProfilePicture, setFormData, editingNews, isOriginalAuthor]);

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
          setImageError(`Gagal memuat gambar: ${error.message}.`);
          setFormData(prev => ({ ...prev, gambar: '' }));
          setImagePreview('');
          setOriginalImage(null);
        });
    } else if (formData.gambar) {
      setImageError('Hanya URL gambar HTTPS yang didukung.');
      setFormData(prev => ({ ...prev, gambar: '' }));
      setImagePreview('');
      setOriginalImage(null);
    } else {
      setImageError('');
      setOriginalImage(null);
    }
  }, [formData.gambar, setFormData]);

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
    if (cropModalOpen || newsSearchModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [cropModalOpen, newsSearchModalOpen]);

  useEffect(() => {
    if (editingNews && !editingNews.authorId && !loggedLegacyArticles.current.has(editingNews.id)) {
      console.warn(
        `[NewsModal] Legacy article detected (ID: ${editingNews.id}). No authorId found. Using author name fallback: "${editingNews.author}".`
      );
      loggedLegacyArticles.current.add(editingNews.id);
    }
  }, [editingNews]);

  const createSlug = (title) => {
    if (!title) return "";
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  };

  const createUniqueSlug = async (title, docId, existingSlug = null) => {
    let slug = createSlug(title || `news-${docId}`);
    let suffix = 1;
    let uniqueSlug = existingSlug || slug;
    while (true) {
      const q = query(collection(db, "news"), where("slug", "==", uniqueSlug));
      const snapshot = await getDocs(q);
      if (snapshot.empty || (snapshot.docs[0].id === docId && snapshot.size === 1)) break;
      uniqueSlug = `${slug}-${suffix++}`;
    }
    return uniqueSlug;
  };

  const createNews = async (newsData, isUpdate = false) => {
    try {
      const requiredFields = ['judul', 'kategori', 'author', 'authorId', 'konten'];
      for (const field of requiredFields) {
        if (!newsData[field] || newsData[field] === '') {
          throw new Error(`Field ${field} wajib diisi.`);
        }
      }

      const dataToSave = {
        judul: String(newsData.judul),
        kategori: String(newsData.kategori),
        author: String(newsData.author),
        authorId: String(newsData.authorId),
        authorEmail: String(currentUser?.email || 'Tidak tersedia'),
        authorPhotoURL: String(currentUser?.photoURL || ''),
        konten: String(newsData.konten),
        ringkasan: newsData.ringkasan ? String(newsData.ringkasan) : '',
        gambar: newsData.gambar ? String(newsData.gambar) : '',
        gambarDeskripsi: newsData.gambarDeskripsi ? String(newsData.gambarDeskripsi) : '',
        slug: newsData.slug || '',
        hideProfilePicture: Boolean(newsData.hideProfilePicture),
        views: Number(newsData.views || 0),
        komentar: Number(newsData.komentar || 0),
        updatedAt: serverTimestamp(),
      };

      const newsRef = isUpdate ? doc(db, "news", editingNews.id) : doc(collection(db, "news"));
      dataToSave.slug = await createUniqueSlug(newsData.judul, newsRef.id, isUpdate ? newsData.slug : null);

      if (!isUpdate) {
        dataToSave.createdAt = serverTimestamp();
      }

      await setDoc(newsRef, dataToSave, { merge: true });
      console.log(`[NewsModal] News ${isUpdate ? 'updated' : 'created'} with ID: ${newsRef.id}, Slug: ${dataToSave.slug}`);
      return newsRef.id;
    } catch (error) {
      console.error("[NewsModal] Error creating/updating news:", error);
      throw error;
    }
  };

  const generateSlug = async (title) => {
    if (!title || typeof title !== 'string') return '';
    return createSlug(title).substring(0, 100);
  };

  const validateImageFile = (file, callback) => {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      callback(new Error(`Ekstensi file tidak valid. Diizinkan: ${allowedExtensions.join(', ')}`));
      return;
    }

    if (!allowedMimeTypes.includes(file.type)) {
      callback(new Error(`Tipe file tidak valid. Diizinkan: ${allowedMimeTypes.join(', ')}`));
      return;
    }

    if (file.size > maxSize) {
      callback(new Error('Ukuran file melebihi batas 5MB.'));
      return;
    }

    createImageBitmap(file).then(() => {
      callback(null);
    }).catch(() => {
      callback(new Error('File bukan gambar yang valid.'));
    });
  };

  const getCroppedImg = () => {
    return new Promise((resolve, reject) => {
      if (!completedCrop || !canvasRef.current) {
        reject(new Error('Tidak ada data crop yang tersedia.'));
        return;
      }

      canvasRef.current.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Gagal membuat gambar yang telah dipotong.'));
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
        setImageError('Gagal membaca file gambar.');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCropConfirm = async () => {
    if (!imageToCrop || !completedCrop) {
      console.log('[NewsModal] No image or crop data available');
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
            throw new Error(`Upload gagal: ${data.error?.message || "Kesalahan tidak diketahui"}`);
          }

          publicUrl = data.data.display_url;
          if (!publicUrl.startsWith('https://')) {
            throw new Error('URL gambar yang diunggah tidak aman (HTTPS).');
          }

          await fetch(`${publicUrl}?t=${Date.now()}`, { method: 'HEAD', cache: 'no-cache', mode: 'cors' })
            .then(res => {
              if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) {
                throw new Error('Gagal memuat gambar yang diunggah.');
              }
            });

          uploadSuccess = true;
        } catch (error) {
          attempts++;
          console.error(`[NewsModal] Upload attempt ${attempts} failed:`, error);
          if (attempts === maxAttempts) {
            throw new Error(`Gagal mengunggah gambar setelah ${maxAttempts} percobaan: ${error.message}`);
          }
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }

      setFormData(prev => ({ ...prev, gambar: publicUrl }));
      setImagePreview(`${publicUrl}?t=${Date.now()}`);
      setImageError('');
      console.log('[NewsModal] Cropped image uploaded:', publicUrl);
    } catch (error) {
      console.error("[NewsModal] Error uploading image:", error);
      setImageError(`Gagal mengunggah gambar: ${error.message}.`);
      await logActivity('UPLOAD_IMAGE_ERROR', {
        newsId: editingNews?.id || 'new',
        title: formData.judul,
        error: error.message
      });
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
            setImageError('Gagal membaca file gambar.');
          };
          reader.readAsDataURL(file);
        });
      }
    }
  };

  const handleOverrideAuthor = async () => {
    if (isAdmin && editingNews && editingNews.authorId) {
      try {
        await logActivity('AUTHOR_OVERRIDE', {
          newsId: editingNews.id,
          originalAuthorId: editingNews.authorId,
          originalAuthor: editingNews.author,
          newAuthorId: currentUser.uid,
          newAuthor: currentUser.displayName,
          userId: currentUser.uid
        });
        setIsAuthorOverridden(true);
        setFormData(prev => ({
          ...prev,
          author: currentUser.displayName,
          authorId: currentUser.uid,
          authorEmail: currentUser.email || 'Tidak tersedia',
          authorPhotoURL: currentUser.photoURL || ''
        }));
        setErrorMessage('');
      } catch (error) {
        console.error('[NewsModal] Error overriding author:', error);
        setErrorMessage('Gagal mengambil alih kepemilikan artikel.');
      }
    }
  };

  const handleSearchNews = async () => {
    if (!newsSearchQuery.trim()) {
      setNewsSearchResults([]);
      return;
    }
    
    try {
      const results = allNewsArticles
        .filter(article => 
          article.judul.toLowerCase().includes(newsSearchQuery.toLowerCase()) &&
          article.id !== editingNews?.id
        )
        .slice(0, 5);
      setNewsSearchResults(results);
      console.log('[NewsModal] Search results:', results);
    } catch (error) {
      console.error('[NewsModal] Error searching news:', error);
      setErrorMessage('Gagal mencari berita.');
    }
  };

  const handleInsertNewsLink = (news) => {
    if (editor && news.slug) {
      const url = `/berita/${news.slug}`;
      const selectedText = editor.state.selection.empty ? news.judul : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
      editor.chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .insertContent(selectedText)
        .run();
      setNewsSearchModalOpen(false);
      setNewsSearchQuery('');
      setNewsSearchResults([]);
    }
  };

  useEffect(() => {
    if (newsSearchModalOpen && newsSearchQuery.trim()) {
      handleSearchNews();
    } else if (!newsSearchQuery.trim()) {
      setNewsSearchResults([]);
    }
  }, [newsSearchQuery, newsSearchModalOpen, allNewsArticles]);

  const handleSubmitWithLog = async () => {
    try {
      if (!isAdmin) {
        throw new Error('Hanya admin yang dapat membuat atau mengedit berita.');
      }

      const newSlug = await generateSlug(formData.judul);
      const updatedFormData = {
        ...formData,
        slug: newSlug,
        updatedAt: new Date().toISOString(),
        createdAt: editingNews ? formData.createdAt : new Date().toISOString(),
        authorId: isAuthorOverridden ? currentUser.uid : (editingNews ? (editingNews.authorId || currentUser.uid) : currentUser.uid),
        authorEmail: isAuthorOverridden ? (currentUser.email || 'Tidak tersedia') : (editingNews ? (editingNews.authorEmail || currentUser.email || 'Tidak tersedia') : currentUser.email || 'Tidak tersedia'),
        authorPhotoURL: isAuthorOverridden ? (currentUser.photoURL || '') : (editingNews ? (editingNews.authorPhotoURL || currentUser.photoURL || '') : currentUser.photoURL || '')
      };

      if (!updatedFormData.judul || updatedFormData.judul.length > TITLE_MAX_LENGTH) {
        throw new Error(`Judul harus diisi dan maksimum ${TITLE_MAX_LENGTH} karakter.`);
      }
      if (!updatedFormData.kategori) {
        throw new Error('Kategori harus diisi.');
      }
      if (!updatedFormData.author) {
        throw new Error('Nama penulis harus diisi.');
      }
      if (!updatedFormData.konten) {
        throw new Error('Konten berita harus diisi.');
      }

      const newsId = await createNews(updatedFormData, !!editingNews);

      if (!loading) {
        const action = editingNews ? 'NEWS_EDIT' : 'NEWS_ADD';
        await logActivity(action, {
          newsId: editingNews?.id || newsId || 'new',
          title: formData.judul,
          category: formData.kategori,
          slug: newSlug,
          hideProfilePicture: formData.hideProfilePicture,
          userId: currentUser.uid
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
      console.error('[NewsModal] Error submitting news:', error);
      let userMessage = 'Gagal menyimpan berita: ';
      if (error.code === 'permission-denied') {
        userMessage += 'Anda tidak memiliki izin admin.';
      } else if (error.code === 'invalid-argument' || error.message.includes('Invalid document')) {
        userMessage += 'Data tidak valid.';
      } else {
        userMessage += `${error.message}.`;
      }
      setErrorMessage(userMessage);
      await logActivity('SUBMIT_NEWS_ERROR', {
        newsId: editingNews?.id || 'new',
        title: formData.judul,
        error: error.message,
        userId: currentUser.uid
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
      setErrorMessage('');
      setCropKey(prev => prev + 1);
      setIsAuthorOverridden(false);
      setNewsSearchModalOpen(false);
      setNewsSearchQuery('');
      setNewsSearchResults([]);
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
      setErrorMessage('Tidak ada username tersedia.');
    }
  };

  const handleSwitchToManual = () => {
    setUseUserName(false);
    setFormData(prev => ({ ...prev, author: editingNews?.author || '' }));
  };

  const Toolbar = () => (
    <div className="border-b border-gray-200 bg-gray-50 p-2 rounded-t-xl">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 ${editor?.isActive('bold') ? 'bg-purple-100 text-black' : 'text-gray-700'}`}
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 ${editor?.isActive('italic') ? 'bg-purple-100 text-black' : 'text-gray-700'}`}
        title="Italic"
      >
        <i>I</i>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 ${editor?.isActive('bulletList') ? 'bg-purple-100 text-black' : 'text-gray-700'}`}
        title="Bullet List"
      >
        •
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 ${editor?.isActive('orderedList') ? 'bg-purple-100 text-black' : 'text-gray-700'}`}
        title="Numbered List"
      >
        1.
      </button>
      <button
        onClick={() => {
          const url = prompt('Masukkan URL gambar:');
          if (url && url.startsWith('https://')) {
            editor.chain().focus().setImage({ src: url }).run();
          } else {
            setErrorMessage('Masukkan URL gambar HTTPS yang valid.');
          }
        }}
        className="px-2 py-1 text-gray-700"
        title="Insert Image"
      >
        <Image className="h-4 w-4 inline" />
      </button>
      <button
        onClick={() => setNewsSearchModalOpen(true)}
        className="px-2 py-1 text-gray-700"
        title="Insert News Link"
      >
        <Link className="h-4 w-4 inline" />📰
      </button>
      <button
        onClick={() => editor.chain().focus().unsetLink().run()}
        className={`px-2 py-1 ${editor?.isActive('link') ? 'bg-purple-100 text-black' : 'text-gray-700'}`}
        title="Remove Link"
        disabled={!editor?.isActive('link')}
      >
        <Link className="h-4 w-4 inline" />✗
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

  if (!showModal || !currentUser) {
    return null;
  }

  if (!isAdmin) {
    return (
      <>
        <style jsx>{`
          .tiptap-editor {
            color: #1f2937;
          }
          .tiptap-editor p {
            margin-bottom: 1rem;
          }
          .tiptap-editor strong {
            font-weight: 700;
            color: #111827;
          }
          .tiptap-editor em {
            font-style: italic;
          }
          .tiptap-editor ul,
          .tiptap-editor ol {
            margin: 1rem 0;
            padding-left: 2rem;
          }
          .tiptap-editor ul {
            list-style-type: disc;
          }
          .tiptap-editor ol {
            list-style-type: decimal;
          }
          .tiptap-editor li {
            margin-bottom: 0.5rem;
          }
          .tiptap-editor img {
            max-width: 100%;
            height: auto;
            margin: 1rem 0;
            border-radius: 0.5rem;
          }
          .tiptap-editor a {
            color: #2563eb;
            text-decoration: underline;
          }
          .tiptap-editor a:hover {
            color: #1d4ed8;
          }
        `}</style>
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Akses Ditolak</h3>
            <p className="text-sm text-gray-600 mb-6">
              {errorMessage || 'Hanya admin yang dapat membuat atau mengedit berita.'}
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
            >
              Tutup
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        .tiptap-editor {
          color: #1f2937;
        }
        .tiptap-editor p {
          margin-bottom: 1rem;
        }
        .tiptap-editor strong {
          font-weight: 700;
          color: #111827;
        }
        .tiptap-editor em {
          font-style: italic;
        }
        .tiptap-editor ul,
        .tiptap-editor ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }
        .tiptap-editor ul {
          list-style-type: disc;
        }
        .tiptap-editor ol {
          list-style-type: decimal;
        }
        .tiptap-editor li {
          margin-bottom: 0.5rem;
        }
        .tiptap-editor img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
          border-radius: 0.5rem;
        }
        .tiptap-editor a {
          color: #2563eb;
          text-decoration: underline;
        }
        .tiptap-editor a:hover {
          color: #1d4ed8;
        }
      `}</style>
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
                      {editingNews ? 'Perbarui informasi berita' : 'Bagikan cerita terbaru'}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30"
                  >
                    <X className="h-5 w-5 text-white group-hover:rotate-90" />
                  </button>
                </div>
                <div className="flex justify-center mt-6 space-x-8">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${activeStep >= step.id ? 'bg-white text-purple-600' : 'bg-white/20 text-white/70'}`}>
                        <step.icon className="h-4 w-4" />
                      </div>
                      <span className={`text-sm font-medium ${activeStep >= step.id ? 'text-white' : 'text-white/70'}`}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-8 bg-white">
                {errorMessage && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl">
                    {errorMessage}
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="group">
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                        <FileText className="h-4 w-4 mr-2 text-purple-600" />
                        Judul Berita
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formData.judul}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, judul: e.target.value }));
                          }}
                          className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-500 ${
                            formData.judul.length > TITLE_MAX_LENGTH
                              ? 'border-red-500'
                              : 'border-gray-200 focus:border-blue-600'
                          }`}
                          placeholder={`Tulis judul (max ${TITLE_MAX_LENGTH} karakter)...`}
                          onFocus={() => setActiveStep(1)}
                          maxLength={TITLE_MAX_LENGTH + 50}
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 pointer-events-none" />
                        <div className={`text-xs mt-1 ${
                          formData.judul.length > TITLE_MAX_LENGTH
                            ? 'text-red-600 font-semibold'
                            : 'text-gray-900'
                        }`}>
                          {formData.judul.length}/{TITLE_MAX_LENGTH} karakter
                          {formData.judul.length > TITLE_MAX_LENGTH && ', melebihi batas!'}
                        </div>
                      </div>
                    </div>
                    <div className="group">
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                        <Tag className="h-4 w-4 mr-2 text-purple-600" />
                        Kategori
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, kategori: cat.value }))}
                            className={`p-3 rounded-xl border-2 flex items-center space-x-2 ${formData.kategori === cat.value ? `${cat.color} border-current` : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                          >
                            <span className="text-lg">{cat.icon}</span>
                            <span className="text-sm font-medium">{cat.value}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="group">
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                        <User className="h-4 w-4 mr-2 text-purple-600" />
                        Penulis
                      </label>
                      {(editingNews && originalAuthorData) ? (
                        <div className="flex items-center justify-between mb-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {showProfilePicture && originalAuthorData.photoURL && !editingNews?.hideProfilePicture ? (
                              <img
                                src={originalAuthorData.photoURL}
                                alt="Profile"
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm font-medium text-gray-700">
                                {originalAuthorData.displayName}
                              </span>
                              <span className="text-xs text-gray-900">
                                ID: {editingNews?.authorId || '(Legacy)'}
                              </span>
                              <span className="text-xs text-gray-900">
                                Email: {originalAuthorData.email}
                              </span>
                              {!showProfilePicture && (
                                <span className="text-xs text-gray-500 italic">
                                  [Foto profil disembunyikan]
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setShowProfilePicture(!showProfilePicture)}
                              disabled={!isOriginalAuthor}
                              className={`p-1 ${
                                isOriginalAuthor
                                  ? 'text-gray-500 hover:text-gray-700'
                                  : 'text-gray-300 cursor-not-allowed'
                              }`}
                              title={
                                isOriginalAuthor
                                  ? showProfilePicture
                                    ? "Sembunyikan foto profil"
                                    : "Tampilkan foto profil"
                                  : editingNews?.authorId
                                    ? "Hanya penulis asli yang dapat mengubah"
                                    : "Hanya admin yang dapat mengubah"
                              }
                            >
                              {showProfilePicture ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={refreshUserData}
                              className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                              title="Perbarui data pengguna"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            {isAdmin && editingNews?.authorId && !isAuthorOverridden && (
                              <button
                                type="button"
                                onClick={handleOverrideAuthor}
                                className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                                title="Ambil alih kepemilikan artikel"
                              >
                                <Shield className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mb-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {showProfilePicture && currentUser?.photoURL ? (
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
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm font-medium text-gray-700">
                                {formData.author || currentUser?.displayName || 'Tanpa Nama'}
                              </span>
                              <span className="text-xs text-gray-900">
                                ID: {currentUser?.uid || 'N/A'}
                              </span>
                              <span className="text-xs text-gray-900">
                                Email: {currentUser?.email || 'Tidak tersedia'}
                              </span>
                              {!showProfilePicture && (
                                <span className="text-xs text-gray-500 italic">
                                  [Foto profil disembunyikan]
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setShowProfilePicture(!showProfilePicture)}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title={showProfilePicture ? "Sembunyikan foto profil" : "Tampilkan foto profil"}
                            >
                              {showProfilePicture ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={refreshUserData}
                              className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                              title="Perbarui data pengguna"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            required
                            value={formData.author}
                            onChange={(e) => {
                              if (isOriginalAuthor) {
                                setFormData(prev => ({ ...prev, author: e.target.value }));
                                setUseUserName(false);
                              }
                            }}
                            className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-500 ${
                              useUserName || !isOriginalAuthor
                                ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                                : 'border-gray-200 focus:border-purple-500'
                            }`}
                            placeholder="Masukkan nama penulis..."
                            readOnly={useUserName || !isOriginalAuthor}
                          />
                          {(useUserName || !isOriginalAuthor) && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none" />
                          )}
                        </div>
                        {isOriginalAuthor ? (
                          useUserName ? (
                            <button
                              type="button"
                              onClick={handleSwitchToManual}
                              className="px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 flex items-center space-x-2"
                              title="Ketik manual"
                            >
                              <Edit3 className="h-4 w-4" />
                              <span className="text-sm">Manual</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleUseUserName}
                              className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center space-x-2"
                              disabled={!currentUser || !currentUser.displayName}
                              title="Gunakan username"
                            >
                              <User className="h-4 w-4" />
                              <span className="text-sm">Gunakan Username</span>
                            </button>
                          )
                        ) : null}
                      </div>
                      <div className="mt-2 text-xs text-gray-900">
                        {!isOriginalAuthor ? (
                          <span className="text-red-600 font-semibold">
                            {editingNews?.authorId
                              ? 'Hanya penulis asli yang dapat mengedit nama penulis.'
                              : 'Hanya admin yang dapat mengedit nama penulis.'}
                          </span>
                        ) : useUserName ? (
                          <div className="flex items-center space-x-1">
                            <span>✓ Menggunakan username akun</span>
                            <button
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
                                onClick={handleUseUserName}
                                className="text-blue-500 hover:text-blue-700 underline"
                              >
                                {currentUser.displayName}
                              </button>
                            </div>
                          )
                        )}
                        {isOriginalAuthor && (
                          <span className="block mt-1 text-gray-500">
                            {editingNews?.authorId
                              ? 'Sebagai penulis asli, Anda dapat mengedit nama penulis.'
                              : 'Sebagai admin, Anda dapat mengedit nama penulis untuk artikel legacy.'}
                          </span>
                        )}
                        {isAuthorOverridden && (
                          <span className="block mt-1 text-green-600 font-semibold">
                            Kepemilikan artikel telah diambil alih.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="group">
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                        <Image className="h-4 w-4 mr-2 text-purple-600" />
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
                            className="w-full h-40 object-cover rounded-xl"
                            onError={(e) => {
                              e.target.src = '';
                              setImageError('Gagal memuat gambar.');
                              setFormData(prev => ({ ...prev, gambar: '' }));
                              setImagePreview('');
                              setOriginalImage(null);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 rounded-xl flex items-center justify-center space-x-4">
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
                              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
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
                              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
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
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500"
                        placeholder="https://example.com/image.jpg"
                        onFocus={() => setActiveStep(2)}
                      />
                      <div className={`relative border-2 border-dashed rounded-xl p-6 ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'}`}
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
                          <Upload className={`mx-auto h-8 w-8 ${dragActive ? 'text-yellow-800' : 'text-gray-400'}`} />
                          <p className="text-sm text-gray-700">
                            <span className="text-purple-600">Klik untuk upload</span> atau drag &amp; drop
                          </p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, max 5MB</p>
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
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400"
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
                    <Globe className="h-4 w-4 mr-2 text-blue-500" />
                    Ringkasan Berita
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400"
                    value={formData.ringkasan}
                    onChange={(e) => setFormData(prev => ({ ...prev, ringkasan: e.target.value }))}
                    rows="3"
                    onFocus={() => setActiveStep(3)}
                  />
                </div>
                <div className="mt-6 group">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    <FileText className="h-4 w-4 mr-2 text-purple-600" />
                    Konten Berita
                  </label>
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    <Toolbar />
                    <EditorContent className="p-4 min-h-[400px] text-gray-900 tiptap-editor" editor={editor} />
                  </div>
                </div>
                {relatedNews.length > 0 && (
                  <div className="mt-6 group">
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                      <Globe className="h-4 w-4 mr-2 text-blue-500" />
                      Berita Terkait
                    </label>
                    <div className="grid grid-cols-1 gap-4">
                      {relatedNews.map((news) => (
                        <a
                          key={news.id}
                          href={`/berita/${news.slug}`}
                          className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                        >
                          {news.gambar && (
                            <img
                              src={news.gambar}
                              alt={news.gambarDeskripsi || news.judul}
                              className="w-16 h-16 object-cover rounded-lg mr-4"
                            />
                          )}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800">{news.judul}</h4>
                            <p className="text-xs text-gray-600">{news.ringkasan}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitWithLog}
                    disabled={loading || uploading || !isAdmin || formData.judul.length > TITLE_MAX_LENGTH}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading || uploading ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2 inline" />
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
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
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
                    setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 * (9 / 16), aspect: 16 / 9 });
                    setImageError('');
                    console.log('[CropModal] Image loaded:', imageToCrop);
                  }}
                  onError={() => {
                    setImageError('Gagal memuat gambar untuk cropping.');
                    setCropModalOpen(false);
                    setImageToCrop(null);
                    setCropKey(prev => prev + 1);
                    console.log('[CropModal] Error loading image:', imageToCrop);
                  }}
                />
              </ReactCrop>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Zoom</label>
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
                  setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 * (9 / 16), aspect: 16 / 9 });
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
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                disabled={uploading || !completedCrop}
              >
                {uploading ? 'Uploading...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
      {newsSearchModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Cari Berita untuk Ditautkan</h3>
              <button
                onClick={() => {
                  setNewsSearchModalOpen(false);
                  setNewsSearchQuery('');
                  setNewsSearchResults([]);
                }}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="mb-4">
              <input
                type="text"
                value={newsSearchQuery}
                onChange={(e) => setNewsSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500"
                placeholder="Cari judul berita..."
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {newsSearchResults.length > 0 ? (
                newsSearchResults.map((news) => (
                  <button
                    key={news.id}
                    onClick={() => handleInsertNewsLink(news)}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 mb-2"
                  >
                    <span className="text-sm font-medium text-gray-800">{news.judul}</span>
                    <p className="text-xs text-gray-600">{news.ringkasan}</p>
                  </button>
                ))
              ) : newsSearchQuery.trim() ? (
                <p className="text-sm text-gray-600">Tidak ada berita ditemukan untuk "{newsSearchQuery}".</p>
              ) : (
                <p className="text-sm text-gray-600">Mulai mengetik untuk mencari berita...</p>
              )}
            </div>
            {allNewsArticles.length > 0 && (
              <div className="mt-4 text-xs text-gray-500 text-center">
                Total {allNewsArticles.length} artikel tersedia
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NewsModal;