import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { X, Save } from 'lucide-react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebaseconfig";

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
  if (!showModal) return null;

  // Utility function to generate a URL-friendly slug
  const generateSlug = async (title) => {
    if (!title || typeof title !== 'string') return '';
    let slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .substring(0, 100); // Limit length

    // Check for duplicate slugs
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, gambar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitWithLog = async () => {
    try {
      // Generate new slug based on title
      const newSlug = await generateSlug(formData.judul);
      
      // Update formData with new slug
      const updatedFormData = { ...formData, slug: newSlug };
      setFormData(updatedFormData);

      // Call handleSubmit with updated formData and get the newsId
      const newsId = await handleSubmit(updatedFormData);

      if (!loading) {
        const action = editingNews ? 'NEWS_EDIT' : 'NEWS_ADD';
        await logActivity(action, { 
          newsId: editingNews?.id || newsId || 'new', 
          title: formData.judul, 
          category: formData.kategori,
          slug: newSlug
        });
      }
      setShowModal(false);
      resetForm();
      // Dispatch event for redirection
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
              onChange={(e) => setFormData(prev => ({ ...prev, judul: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, kategori: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nama penulis..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Gambar (atau biarkan kosong untuk unggah lokal)
            </label>
            <input
              type="url"
              value={formData.gambar}
              onChange={(e) => setFormData(prev => ({ ...prev, gambar: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unggah Gambar Lokal
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi Gambar
            </label>
            <input
              type="text"
              value={formData.gambarDeskripsi || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, gambarDeskripsi: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Contoh: Presiden saat konferensi pers"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ringkasan
            </label>
            <textarea
              value={formData.ringkasan}
              onChange={(e) => setFormData(prev => ({ ...prev, ringkasan: e.target.value }))}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ringkasan singkat berita..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konten Berita
            </label>
            <ReactQuill
              theme="snow"
              value={formData.konten}
              onChange={(val) => setFormData(prev => ({ ...prev, konten: val }))}
              className="bg-white text-black"
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
              onClick={handleSubmitWithLog}
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

export default NewsModal;