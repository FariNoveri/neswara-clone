import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseconfig';
import Navbar from '../navbar';
import Footer from '../footer';
import { Share2, Edit3, Trash2, Calendar, Clock, User, Eye } from 'lucide-react';

const ShareButton = ({ icon, label, onClick, color = "bg-gradient-to-r from-gray-100 to-gray-200" }) => {
  const iconMap = {
    instagram: <div className="w-6 h-6 bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center text-white text-xs font-bold">IG</div>,
    facebook: <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">f</div>,
    whatsapp: <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">W</div>,
    link: <Share2 size={18} className="text-gray-600" />,
  };

  return (
    <button
      className={`group relative px-4 py-2.5 ${color} hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 rounded-xl border border-white/20 backdrop-blur-sm`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {iconMap[icon]}
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
          {label}
        </span>
      </div>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
};

const AdminPanel = ({ beritaId }) => {
  return (
    <div className="mt-12 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-2xl blur-xl" />
      <div className="relative bg-white/70 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Admin Panel</h3>
            <p className="text-sm text-gray-600">Kelola konten berita</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2">
            <Edit3 size={18} />
            Edit Berita
          </button>
          <button className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2">
            <Trash2 size={18} />
            Hapus Berita
          </button>
        </div>
      </div>
    </div>
  );
};

const ViewBerita = () => {
  const { id } = useParams();
  const [berita, setBerita] = useState(null);
  const [user, setUser] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const fetchBerita = async () => {
      const docRef = doc(db, 'posts', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setBerita({ id: snapshot.id, ...snapshot.data() });
      }
    };

    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (storedUser) setUser(storedUser);

    fetchBerita();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrolled / maxHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!berita) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 font-medium">Memuat berita...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleShare = (platform) => {
    const shareData = {
      title: berita.judul,
      text: berita.konten.substring(0, 100) + '...',
      url: window.location.href
    };

    if (navigator.share && platform === 'native') {
      navigator.share(shareData);
    } else {
      // Fallback sharing logic
      alert(`Berbagi via ${platform}`);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Tanggal tidak tersedia';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200/50 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <Navbar />
      
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Image */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl z-10" />
          <img
            src={berita.gambar?.trim() ? berita.gambar : 'https://via.placeholder.com/800x400'}   
            alt={berita.judul}
            className={`w-full h-[400px] object-cover rounded-2xl shadow-2xl transition-all duration-700 ${
              isImageLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
            }`}
            onLoad={() => setIsImageLoaded(true)}
          />
          
          {/* Floating metadata */}
          <div className="absolute bottom-6 left-6 right-6 z-20">
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20">
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>{formatDate(berita.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>5 min read</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye size={16} />
                  <span>1.2k views</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent leading-tight mb-6">
            {berita.judul}
          </h1>
          
          {/* Share buttons */}
          <div className="flex flex-wrap gap-3">
            <ShareButton 
              icon="whatsapp" 
              label="WhatsApp" 
              onClick={() => handleShare('WhatsApp')}
              color="bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200"
            />
            <ShareButton 
              icon="facebook" 
              label="Facebook" 
              onClick={() => handleShare('Facebook')}
              color="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200"
            />
            <ShareButton 
              icon="instagram" 
              label="Instagram" 
              onClick={() => handleShare('Instagram')}
              color="bg-gradient-to-r from-pink-50 to-purple-100 hover:from-pink-100 hover:to-purple-200"
            />
            <ShareButton 
              icon="link" 
              label="Salin Link" 
              onClick={() => handleShare('Link')}
              color="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200"
            />
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            
            <div 
              className="text-gray-700 leading-relaxed text-lg whitespace-pre-line"
              style={{ 
                fontFamily: 'Georgia, serif',
                lineHeight: '1.8'
              }}
            >
              {berita.konten}
            </div>
          </div>
        </div>

        {/* Admin Panel */}
        {(user?.email === 'fari_noveriwinanto@teknokrat.ac.id' ||
          user?.email === 'cahayalunamaharani1@gmail.com') && (
          <AdminPanel beritaId={berita.id} />
        )}

        {/* Related Articles Placeholder */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Artikel Terkait</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((item) => (
              <div key={item} className="group">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-full h-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-4 animate-pulse" />
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    Artikel Menarik Lainnya #{item}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </article>
      
      <Footer />
    </div>
  );
};

export default ViewBerita;