import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseconfig';
import { toast } from 'react-toastify';

const ReportModal = ({ isOpen, onClose, newsId, currentUser, newsTitle }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { value: 'inappropriate', label: 'Konten Tidak Pantas' },
    { value: 'fake_news', label: 'Berita Palsu' },
    { value: 'offensive', label: 'Konten Menyinggung' },
    { value: 'spam', label: 'Spam atau Iklan' },
    { value: 'other', label: 'Lainnya' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.warn('Silakan masuk untuk melaporkan berita.');
      return;
    }
    if (!newsId) {
      toast.error('ID berita tidak valid.');
      return;
    }
    if (!selectedReason) {
      toast.error('Harap pilih alasan pelaporan.');
      return;
    }
    if (selectedReason === 'other' && !customReason.trim()) {
      toast.error('Harap masukkan alasan lainnya.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check for existing report by the same user for this news article
      const q = query(
        collection(db, 'reports'),
        where('newsId', '==', newsId),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        toast.warn('Anda sudah melaporkan berita ini.');
        setIsSubmitting(false);
        return;
      }

      // Submit new report
      await addDoc(collection(db, 'reports'), {
        newsId,
        userId: currentUser.uid,
        userEmail: currentUser.email || 'anonymous',
        reason: selectedReason,
        customReason: selectedReason === 'other' ? customReason.trim() : '',
        title: newsTitle || 'Unknown Title',
        timestamp: serverTimestamp(),
        status: 'pending', // Added for ReportManagement to track status
      });
      await addDoc(collection(db, 'logs'), {
        action: 'REPORT_NEWS',
        userEmail: currentUser.email || 'anonymous',
        details: {
          newsId,
          title: newsTitle,
          reason: selectedReason,
          customReason: selectedReason === 'other' ? customReason.trim() : '',
        },
        timestamp: serverTimestamp(),
      });
      toast.success('Laporan berhasil dikirim!');
      setSelectedReason('');
      setCustomReason('');
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Gagal mengirim laporan.');
      await addDoc(collection(db, 'logs'), {
        action: 'REPORT_NEWS_ERROR',
        userEmail: currentUser.email || 'anonymous',
        details: { newsId, title: newsTitle, error: error.message },
        timestamp: serverTimestamp(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Flag className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-bold text-slate-800">Laporkan Berita</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-600 mb-2">Pilih alasan pelaporan:</h3>
                <div className="space-y-2">
                  {reportReasons.map((reason) => (
                    <label key={reason.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="h-4 w-4 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-sm text-slate-700">{reason.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {selectedReason === 'other' && (
                <div>
                  <label htmlFor="customReason" className="text-sm font-medium text-slate-600">
                    Alasan Lainnya:
                  </label>
                  <textarea
                    id="customReason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                    rows="4"
                    placeholder="Masukkan alasan lainnya..."
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;