import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseconfig';
import Navbar from '../navbar';
import Footer from '../footer';

const ShareButton = ({ icon, onClick }) => {
  const iconMap = {
    instagram: <img src="/icons/ig.svg" alt="IG" className="h-6 w-6" />,
    facebook: <img src="/icons/fb.svg" alt="FB" className="h-6 w-6" />,
    whatsapp: <img src="/icons/wa.svg" alt="WA" className="h-6 w-6" />,
    link: <img src="/icons/link.svg" alt="Copy Link" className="h-6 w-6" />,
  };

  return (
    <button
      className="p-2 rounded-full hover:bg-gray-200 transition"
      onClick={onClick}
    >
      {iconMap[icon]}
    </button>
  );
};

const AdminUploadBox = ({ beritaId }) => {
  return (
    <div className="mt-10 border rounded-lg p-4 bg-gray-50 shadow-sm">
      <h3 className="font-semibold mb-2">Pengaturan Admin</h3>
      <div className="flex space-x-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Edit Berita
        </button>
        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Hapus Berita
        </button>
      </div>
    </div>
  );
};

const ViewBerita = () => {
  const { id } = useParams();
  const [berita, setBerita] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchBerita = async () => {
      const docRef = doc(db, 'posts', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setBerita({ id: snapshot.id, ...snapshot.data() });
      }
    };

    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) setUser(storedUser);

    fetchBerita();
  }, [id]);

  if (!berita) return <div className="p-4">Loading...</div>;

  const handleShare = (platform) => {
    alert(`Share via ${platform}`);
  };

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <img
          src={berita.gambar?.trim() ? berita.gambar : 'https://via.placeholder.com/800x400'}   
          alt="Gambar Berita"
          className="w-full rounded-lg shadow"
        />

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{berita.judul}</h1>
          <div className="flex space-x-2">
            <ShareButton icon="instagram" onClick={() => handleShare('Instagram')} />
            <ShareButton icon="facebook" onClick={() => handleShare('Facebook')} />
            <ShareButton icon="whatsapp" onClick={() => handleShare('WhatsApp')} />
            <ShareButton icon="link" onClick={() => handleShare('Link')} />
          </div>
        </div>

        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {berita.konten}
        </p>

        {(user?.email === 'fari_noveriwinanto@teknokrat.ac.id' ||
          user?.email === 'cahayalunamaharani1@gmail.com') && (
          <AdminUploadBox beritaId={berita.id} />
        )}
      </main>
      <Footer />
    </>
  );
};

export default ViewBerita;
