import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseconfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';

const LogActivity = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp // Pastikan timestamp ada
      })).filter(log => log.timestamp); // Filter out logs without timestamp
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching logs:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat log aktivitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 min-h-screen">
      <h3 className="text-lg font-semibold mb-4">Log Aktivitas</h3>
      {logs.length === 0 ? (
        <p className="text-gray-500 text-center">Tidak ada log aktivitas ditemukan.</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log, index) => (
            <div
              key={log.id}
              className="bg-gray-50 p-4 rounded-lg shadow-sm animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {log.action === 'PROFILE_UPDATE'
                      ? `${log.userEmail} memperbarui profil (${log.details?.type || 'N/A'})`
                      : log.action === 'SPEED_UPDATE'
                      ? `${log.userEmail} mengubah kecepatan global menjadi ${log.details?.newSpeed || 'N/A'} detik`
                      : log.action === 'NEWS_ADD'
                      ? `${log.userEmail} menambahkan berita "${log.details?.title || 'N/A'}"`
                      : log.action === 'NEWS_EDIT'
                      ? `${log.userEmail} mengedit berita "${log.details?.title || 'N/A'}"`
                      : log.action === 'NEWS_DELETE'
                      ? `${log.userEmail} menghapus berita "${log.details?.title || 'N/A'}"`
                      : `${log.userEmail} ${log.action.replace('_', ' ').toLowerCase()} berita`}
                  </p>
                  {log.details?.oldValue && (
                    <p className="text-xs text-gray-500">Nilai Lama: {log.details.oldValue}</p>
                  )}
                  {log.details?.newValue && (
                    <p className="text-xs text-gray-500">Nilai Baru: {log.details.newValue}</p>
                  )}
                  {log.details?.newSpeed && (
                    <p className="text-xs text-gray-500">Kecepatan Baru: {log.details.newSpeed} detik</p>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'dd/MM/yyyy HH:mm') : 'Baru'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .loading-pulse {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default LogActivity;