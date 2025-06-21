import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseconfig';
import { collection, getDocs, query, orderBy, doc, getDoc, deleteDoc } from 'firebase/firestore';

const CommentManagement = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        console.log('Fetching comments from all news subcollections');
        const newsQuery = query(collection(db, 'news'));
        const newsSnapshot = await getDocs(newsQuery);
        let allComments = [];

        for (const newsDoc of newsSnapshot.docs) {
          const commentsQuery = query(
            collection(db, 'news', newsDoc.id, 'comments'),
            orderBy('createdAt', 'desc')
          );
          const commentsSnapshot = await getDocs(commentsQuery);
          const commentsData = await Promise.all(commentsSnapshot.docs.map(async (commentDoc) => {
            const commentData = { id: commentDoc.id, ...commentDoc.data(), newsId: newsDoc.id };
            let displayName = commentData.author || 'Unknown';
            let userIdField = commentData.uid || commentData.userId || commentData.authorId || commentDoc.id;
            if (userIdField) {
              const userDoc = await getDoc(doc(db, 'users', userIdField));
              if (userDoc.exists()) {
                displayName = userDoc.data().displayName || displayName;
              }
            }
            return { ...commentData, displayName };
          }));
          allComments = [...allComments, ...commentsData];
        }

        setComments(allComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
      setLoading(false);
    };

    fetchComments();
  }, []);

  const handleDelete = async (newsId, commentId) => {
    if (window.confirm("Yakin ingin menghapus komentar ini?")) {
      try {
        await deleteDoc(doc(db, "news", newsId, "comments", commentId));
        setComments(comments.filter(comment => comment.id !== commentId));
        console.log("Komentar berhasil dihapus:", commentId);
      } catch (err) {
        console.error("Gagal menghapus komentar:", err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Pengguna
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Komentar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Berita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                  </td>
                </tr>
              ) : comments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada komentar ditemukan
                  </td>
                </tr>
              ) : (
                comments.map(comment => (
                  <tr key={comment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{comment.displayName || ''}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{comment.text}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {comment.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{comment.newsId}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDelete(comment.newsId, comment.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommentManagement;
