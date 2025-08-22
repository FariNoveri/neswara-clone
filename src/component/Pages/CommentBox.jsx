import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { db } from '../../firebaseconfig';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Heart, Reply, Edit2, Trash2, Flag, Send, X, User } from 'lucide-react';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';

// Hook to fetch and monitor user role in real-time
const useUserRole = (userId) => {
  const [isAdmin, setIsAdmin] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        setIsAdmin(userDoc.exists() && userDoc.data().isAdmin === true);
      } catch (err) {
        console.warn(`Error fetching user ${userId} from Firestore:`, err);
        setIsAdmin(false);
        setError('Gagal memverifikasi status admin.');
      }
    };

    fetchRole();
  }, [userId]);

  return { isAdmin, error };
};

const CommentBox = ({ newsId, currentUser, onCommentCountChange }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyComment, setReplyComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [spamWarning, setSpamWarning] = useState(false);
  const [spamTimer, setSpamTimer] = useState(0);
  const [reportModal, setReportModal] = useState({ isOpen: false, commentId: '', newsId: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, commentId: '', newsId: '' });
  const prevCommentCount = useRef(0);
  const unsubscribeRef = useRef({});
  const spamTimestamps = useRef([]);
  const userCache = useRef(new Map());

  // Get current user's admin status
  const { isAdmin: currentUserIsAdmin } = useUserRole(currentUser?.uid);

  const memoizedComments = useMemo(() => comments, [comments]);

  const countAllComments = useCallback((comments) => {
    return comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0);
  }, []);

  // Optimized user data fetching with caching
  const fetchUserData = useCallback(async (userId) => {
    if (!userId) return { displayName: 'Unknown', isAdmin: false };
    
    if (userCache.current.has(userId)) {
      return userCache.current.get(userId);
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = {
        displayName: userDoc.exists() ? userDoc.data().displayName || 'Unknown' : 'Unknown',
        isAdmin: userDoc.exists() && userDoc.data().isAdmin === true
      };
      
      userCache.current.set(userId, userData);
      return userData;
    } catch (error) {
      console.warn(`Error fetching user data for ${userId}:`, error);
      const fallbackData = { displayName: 'Unknown', isAdmin: false };
      userCache.current.set(userId, fallbackData);
      return fallbackData;
    }
  }, []);

  useEffect(() => {
    if (!newsId || !currentUser?.uid) {
      setError('ID berita atau autentikasi pengguna tidak valid.');
      setLoading(false);
      return;
    }

    const setupRealTimeComments = async () => {
      setLoading(true);
      setError(null);

      try {
        const newsRef = doc(db, 'news', newsId);
        const newsDoc = await getDoc(newsRef);
        if (!newsDoc.exists()) {
          setError(`Dokumen berita ${newsId} tidak ditemukan.`);
          setLoading(false);
          return;
        }

        // Query untuk semua komentar root (tidak mengecualikan yang dihapus)
        const rootCommentsQuery = query(
          collection(db, 'news', newsId, 'comments'),
          where('parentId', '==', null),
          orderBy('createdAt', 'desc')
        );

        const unsubscribeComments = onSnapshot(rootCommentsQuery, async (rootSnapshot) => {
          try {
            const commentsData = [];

            for (const rootDoc of rootSnapshot.docs) {
              const rootCommentData = { id: rootDoc.id, ...rootDoc.data() };
              
              const userData = await fetchUserData(rootCommentData.userId);
              rootCommentData.displayName = userData.displayName;
              rootCommentData.isAdmin = userData.isAdmin;

              // Query untuk semua replies (tidak mengecualikan yang dihapus)
              const repliesQuery = query(
                collection(db, 'news', newsId, 'comments'),
                where('parentId', '==', rootDoc.id),
                orderBy('createdAt', 'asc')
              );

              const commentWithReplies = await new Promise((resolve) => {
                const unsubscribeReplies = onSnapshot(repliesQuery, async (repliesSnapshot) => {
                  const repliesData = [];

                  for (const replyDoc of repliesSnapshot.docs) {
                    const replyData = { id: replyDoc.id, ...replyDoc.data() };
                    const replyUserData = await fetchUserData(replyData.userId);
                    replyData.displayName = replyUserData.displayName;
                    replyData.isAdmin = replyUserData.isAdmin;

                    const replyLikesQuery = query(
                      collection(db, 'news', newsId, 'likes'),
                      where('commentId', '==', replyDoc.id)
                    );

                    const unsubscribeReplyLikes = onSnapshot(replyLikesQuery, (likesSnapshot) => {
                      const likeCount = likesSnapshot.size;
                      const userHasLiked = currentUser
                        ? likesSnapshot.docs.some(doc => doc.data().userId === currentUser.uid)
                        : false;
                      
                      replyData.likeCount = likeCount;
                      replyData.userHasLiked = userHasLiked;

                      setComments(prevComments => 
                        prevComments.map(comment => 
                          comment.id === rootDoc.id
                            ? {
                                ...comment,
                                replies: comment.replies?.map(reply => 
                                  reply.id === replyDoc.id ? replyData : reply
                                ) || []
                              }
                            : comment
                        )
                      );
                    });

                    unsubscribeRef.current[`replyLikes_${replyDoc.id}`] = unsubscribeReplyLikes;
                    repliesData.push(replyData);
                  }

                  unsubscribeRef.current[`replies_${rootDoc.id}`] = unsubscribeReplies;
                  
                  resolve({
                    ...rootCommentData,
                    replies: repliesData
                  });
                });
              });

              const likesQuery = query(
                collection(db, 'news', newsId, 'likes'),
                where('commentId', '==', rootDoc.id)
              );

              const unsubscribeLikes = onSnapshot(likesQuery, (likesSnapshot) => {
                const likeCount = likesSnapshot.size;
                const userHasLiked = currentUser
                  ? likesSnapshot.docs.some(doc => doc.data().userId === currentUser.uid)
                  : false;

                commentWithReplies.likeCount = likeCount;
                commentWithReplies.userHasLiked = userHasLiked;

                setComments(prevComments => 
                  prevComments.map(comment => 
                    comment.id === rootDoc.id 
                      ? { ...comment, likeCount, userHasLiked }
                      : comment
                  )
                );
              });

              unsubscribeRef.current[`likes_${rootDoc.id}`] = unsubscribeLikes;
              commentsData.push(commentWithReplies);
            }

            setComments(commentsData);
            setLoading(false);
          } catch (error) {
            console.error('Error processing comments:', error);
            setError('Gagal memuat komentar: ' + error.message);
            setLoading(false);
            toast.error('Gagal memuat komentar.');
          }
        });

        unsubscribeRef.current.comments = unsubscribeComments;

      } catch (error) {
        console.error('Error setting up real-time comments:', error);
        setError('Gagal mengatur pemantauan real-time: ' + error.message);
        setLoading(false);
        toast.error('Gagal mengatur pemantauan real-time.');
      }
    };

    setupRealTimeComments();

    return () => {
      Object.values(unsubscribeRef.current).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      unsubscribeRef.current = {};
    };
  }, [newsId, currentUser, fetchUserData]);

  useEffect(() => {
    const totalComments = countAllComments(memoizedComments);
    if (totalComments !== prevCommentCount.current) {
      onCommentCountChange?.(totalComments);
      prevCommentCount.current = totalComments;
    }
  }, [memoizedComments, countAllComments, onCommentCountChange]);

  useEffect(() => {
    let timer;
    if (spamWarning && spamTimer > 0) {
      timer = setInterval(() => {
        setSpamTimer((prev) => {
          if (prev <= 1) {
            setSpamWarning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [spamWarning, spamTimer]);

  const checkSpamLimit = useCallback(() => {
    const now = Date.now();
    spamTimestamps.current = spamTimestamps.current.filter(ts => now - ts < 10000);
    if (spamTimestamps.current.length >= 3) {
      setSpamWarning(true);
      setSpamTimer(10);
      return true;
    }
    spamTimestamps.current.push(now);
    return false;
  }, []);

  const sanitizeInput = (input) => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    }).trim();
  };

  const handleSubmit = async (e, parentId = null, replyToAuthor = null) => {
    e.preventDefault();
    if (!currentUser?.uid) {
      toast.warn('Silakan masuk untuk menambahkan komentar.');
      return;
    }
    if (!newsId) {
      toast.error('ID berita tidak valid.');
      return;
    }
    if (checkSpamLimit()) {
      toast.warn(`Anda menulis terlalu cepat! Tunggu ${spamTimer} detik.`);
      return;
    }

    const text = parentId ? replyComment : newComment;
    if (!text.trim()) {
      toast.warn('Komentar tidak boleh kosong.');
      return;
    }

    const sanitizedText = sanitizeInput(text);
    if (!sanitizedText) {
      toast.warn('Komentar tidak valid.');
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const displayName = userDoc.exists() ? userDoc.data().displayName || currentUser.email || 'anonymous' : currentUser.email || 'anonymous';
      const isAdmin = userDoc.exists() && userDoc.data().isAdmin === true;

      const commentData = {
        text: sanitizedText,
        author: displayName,
        userId: currentUser.uid,
        userEmail: currentUser.email?.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
          ? currentUser.email
          : 'anonymous',
        createdAt: serverTimestamp(),
        parentId,
        replyToAuthor,
        isEdited: false,
        isDeleted: false,
        isAdmin,
        photoURL: currentUser.photoURL || null
      };

      await addDoc(collection(db, 'news', newsId, 'comments'), commentData);
      
      if (!parentId) {
        setNewComment('');
      } else {
        setReplyComment('');
        setReplyTo(null);
      }
      
      toast.success('Komentar berhasil ditambahkan!');
    } catch (error) {
      console.error('Error adding comment:', error, { newsId, parentId, text: sanitizedText });
      toast.error('Gagal menambahkan komentar: ' + error.message);
    }
  };

  const handleEdit = async (comment) => {
    if (!currentUser || comment.userId !== currentUser.uid) {
      toast.warn('Anda tidak memiliki izin untuk mengedit komentar ini.');
      return;
    }
    const createdAt = comment.createdAt?.toDate();
    if (createdAt && (Date.now() - createdAt.getTime()) > 5 * 60 * 1000) {
      toast.warn('Batas waktu pengeditan (5 menit) telah berlalu.');
      return;
    }
    setEditingComment(comment.id);
    setEditText(comment.text);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editText.trim()) {
      toast.warn('Komentar tidak boleh kosong.');
      return;
    }
    const sanitizedText = sanitizeInput(editText);
    if (!sanitizedText) {
      toast.warn('Komentar tidak valid.');
      return;
    }

    try {
      const commentRef = doc(db, 'news', newsId, 'comments', editingComment);
      const commentDoc = await getDoc(commentRef);
      if (!commentDoc.exists()) {
        toast.error('Komentar tidak ditemukan.');
        return;
      }
      await setDoc(commentRef, {
        text: sanitizedText,
        isEdited: true,
        originalText: commentDoc.data().text
      }, { merge: true });
      setEditingComment(null);
      setEditText('');
      toast.success('Komentar berhasil diedit!');
    } catch (error) {
      console.error('Error editing comment:', error, { commentId: editingComment, text: sanitizedText });
      toast.error('Gagal mengedit komentar: ' + error.message);
    }
  };

  const handleDelete = async (commentId) => {
    if (!currentUser?.uid) {
      toast.warn('Silakan masuk untuk menghapus komentar.');
      return;
    }
    setDeleteModal({ isOpen: true, commentId, newsId });
  };

  const confirmDelete = async () => {
    const { commentId, newsId } = deleteModal;
    try {
      const commentRef = doc(db, 'news', newsId, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
      if (!commentDoc.exists()) {
        toast.error('Komentar tidak ditemukan.');
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const isAdmin = userDoc.exists() && userDoc.data().isAdmin === true;
      if (commentDoc.data().userId !== currentUser.uid && !isAdmin) {
        toast.warn('Anda tidak memiliki izin untuk menghapus komentar ini.');
        return;
      }
      
      await setDoc(commentRef, { isDeleted: true }, { merge: true });
      
      if (!commentDoc.data().parentId) {
        const repliesQuery = query(
          collection(db, 'news', newsId, 'comments'),
          where('parentId', '==', commentId)
        );
        const repliesSnapshot = await getDocs(repliesQuery);
        const updatePromises = repliesSnapshot.docs.map(replyDoc =>
          setDoc(replyDoc.ref, { isDeleted: true }, { merge: true })
        );
        await Promise.all(updatePromises);
      }
      
      toast.success('Komentar berhasil dihapus!');
    } catch (error) {
      console.error('Error soft-deleting comment:', error, { commentId, newsId });
      toast.error('Gagal menghapus komentar: ' + error.message);
    } finally {
      setDeleteModal({ isOpen: false, commentId: '', newsId: '' });
    }
  };

  const confirmReport = async (reason) => {
    if (!reason.trim()) {
      toast.warn('Alasan pelaporan tidak boleh kosong.');
      return;
    }
    const sanitizedReason = sanitizeInput(reason);
    if (!sanitizedReason) {
      toast.warn('Alasan pelaporan tidak valid.');
      return;
    }

    try {
      const commentRef = doc(db, 'news', newsId, 'comments', reportModal.commentId);
      const commentDoc = await getDoc(commentRef);
      if (!commentDoc.exists()) {
        toast.error('Komentar tidak ditemukan.');
        return;
      }
      const commentData = commentDoc.data();

      await addDoc(collection(db, 'reports'), {
        userId: currentUser.uid,
        userEmail: currentUser.email?.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
          ? currentUser.email
          : 'anonymous',
        reason: sanitizedReason,
        customReason: sanitizedReason,
        commentText: commentData.text,
        commentId: reportModal.commentId,
        newsId: reportModal.newsId,
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      toast.success('Laporan berhasil dikirim!');
    } catch (error) {
      console.error('Error reporting comment:', error, {
        commentId: reportModal.commentId,
        newsId: reportModal.newsId,
        reason: sanitizedReason
      });
      toast.error('Gagal mengirim laporan: ' + error.message);
    } finally {
      setReportModal({ isOpen: false, commentId: '', newsId: '' });
    }
  };

  const handleReport = (commentId) => {
    if (!currentUser?.uid) {
      toast.warn('Silakan masuk untuk melaporkan komentar.');
      return;
    }
    if (!newsId) {
      toast.error('ID berita tidak valid.');
      return;
    }
    setReportModal({ isOpen: true, commentId, newsId });
  };

  const handleLike = async (commentId) => {
    if (!currentUser?.uid) {
      toast.warn('Silakan masuk untuk menyukai komentar.');
      return;
    }
    if (checkSpamLimit()) {
      toast.warn(`Anda menyukai terlalu cepat! Tunggu ${spamTimer} detik.`);
      return;
    }

    try {
      const likeRef = doc(db, 'news', newsId, 'likes', `${currentUser.uid}_${commentId}`);
      const likeDoc = await getDoc(likeRef);
      if (likeDoc.exists()) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, {
          userId: currentUser.uid,
          timestamp: serverTimestamp(),
          newsId,
          commentId
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error, { commentId, newsId });
      toast.error('Gagal menyukai komentar: ' + error.message);
    }
  };

  const DeleteModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform animate-scaleIn">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Hapus Komentar</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:rotate-90 transform">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mb-8 leading-relaxed">Yakin ingin menghapus komentar ini? Tindakan ini tidak dapat dibatalkan.</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium hover:scale-105"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium hover:scale-105 transform shadow-lg"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ReportModal = ({ isOpen, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform animate-scaleIn">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Flag className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Laporkan Komentar</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:rotate-90 transform">
              <X className="w-6 h-6" />
            </button>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Masukkan alasan pelaporan..."
            className="w-full h-24 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 resize-none mb-6"
          />
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium hover:scale-105"
            >
              Batal
            </button>
            <button
              onClick={() => onConfirm(reason)}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium hover:scale-105 transform shadow-lg"
            >
              Kirim Laporan
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
        <p className="text-red-600">Gagal memuat data: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {currentUser?.uid && (
        <form onSubmit={(e) => handleSubmit(e)} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Tulis Komentar</h4>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Tambahkan komentar Anda..."
            className="w-full h-24 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 resize-none"
          />
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl hover:from-cyan-600 hover:to-purple-600 transition-all duration-200 font-medium hover:scale-105 transform shadow-lg"
            >
              <Send className="w-5 h-5" />
              <span>Kirim</span>
            </button>
          </div>
          {spamWarning && (
            <p className="text-red-500 text-sm mt-2">Anda menulis terlalu cepat! Tunggu {spamTimer} detik.</p>
          )}
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-cyan-200 rounded-full animate-spin"></div>
            <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
        </div>
      ) : memoizedComments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <p className="text-gray-500">Belum ada komentar.</p>
        </div>
      ) : (
        memoizedComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUser={currentUser}
            currentUserIsAdmin={currentUserIsAdmin}
            newsId={newsId}
            handleLike={handleLike}
            handleReport={handleReport}
            handleDelete={handleDelete}
            handleEdit={handleEdit}
            editingComment={editingComment}
            setEditingComment={setEditingComment}
            editText={editText}
            setEditText={setEditText}
            handleSaveEdit={handleSaveEdit}
            setReplyTo={setReplyTo}
            replyTo={replyTo}
            replyComment={replyComment}
            setReplyComment={setReplyComment}
            handleSubmit={handleSubmit}
          />
        ))
      )}

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, commentId: '', newsId: '' })}
        onConfirm={confirmDelete}
      />
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, commentId: '', newsId: '' })}
        onConfirm={confirmReport}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

const CommentItem = ({
  comment,
  currentUser,
  currentUserIsAdmin,
  newsId,
  handleLike,
  handleReport,
  handleDelete,
  handleEdit,
  editingComment,
  setEditingComment,
  editText,
  setEditText,
  handleSaveEdit,
  setReplyTo,
  replyTo,
  replyComment,
  setReplyComment,
  handleSubmit
}) => {
  const createdAt = comment.createdAt?.toDate();
  const isEditable = createdAt && (Date.now() - createdAt.getTime()) <= 5 * 60 * 1000;
  const isReplying = replyTo?.id === comment.id;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
          {comment.photoURL ? (
            <img src={comment.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-gray-500" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900">{comment.displayName}</span>
              {comment.isAdmin && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">Admin</span>
              )}
              {comment.isEdited && !comment.isDeleted && (
                <span className="text-gray-500 text-xs flex items-center">
                  <Edit2 className="w-3 h-3 mr-1" /> Diedit
                </span>
              )}
            </div>
            <span className="text-gray-500 text-sm">
              {comment.createdAt?.toDate().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) || 'N/A'}
            </span>
          </div>
          {comment.isDeleted ? (
            <p className="text-gray-500 italic mb-4">[KOMENTAR INI TELAH DIHAPUS]</p>
          ) : editingComment === comment.id ? (
            <form onSubmit={handleSaveEdit} className="mb-4">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full h-24 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white text-gray-900"
              />
              <div className="flex justify-end space-x-4 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingComment(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl hover:from-cyan-600 hover:to-purple-600 transition-all duration-200"
                >
                  Simpan
                </button>
              </div>
            </form>
          ) : (
            <p className="text-gray-700 mb-4">{comment.text}</p>
          )}
          
          {/* Action buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleLike(comment.id)}
              className={`flex items-center space-x-2 transition-colors duration-200 ${
                comment.userHasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${comment.userHasLiked ? 'fill-red-500' : ''}`} />
              <span>{comment.likeCount || 0} Like{(comment.likeCount || 0) !== 1 ? 's' : ''}</span>
            </button>
            
            {!comment.parentId && currentUser?.uid && (
              <button
                onClick={() => setReplyTo({ id: comment.id, author: comment.displayName })}
                className="flex items-center space-x-2 text-gray-500 hover:text-cyan-500 transition-colors duration-200"
              >
                <Reply className="w-5 h-5" />
                <span>Balas</span>
              </button>
            )}
            
            {!comment.isDeleted && currentUser?.uid && comment.userId === currentUser.uid && isEditable && (
              <button
                onClick={() => handleEdit(comment)}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors duration-200"
              >
                <Edit2 className="w-5 h-5" />
                <span>Edit</span>
              </button>
            )}
            
            {currentUser?.uid && (
              <button
                onClick={() => handleReport(comment.id)}
                className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors duration-200"
              >
                <Flag className="w-5 h-5" />
                <span>Lapor</span>
              </button>
            )}
            
            {!comment.isDeleted && (currentUser?.uid && (comment.userId === currentUser.uid || currentUserIsAdmin)) && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors duration-200"
              >
                <Trash2 className="w-5 h-5" />
                <span>Hapus</span>
              </button>
            )}
          </div>
          
          {/* Reply form */}
          {isReplying && (
            <form onSubmit={(e) => handleSubmit(e, comment.id, comment.displayName)} className="mt-4 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-500 text-sm">Membalas {comment.displayName}</span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={replyComment}
                onChange={(e) => setReplyComment(e.target.value)}
                placeholder="Tulis balasan Anda..."
                className="w-full h-20 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl hover:from-cyan-600 hover:to-purple-600 transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim</span>
                </button>
              </div>
            </form>
          )}
          
          {/* Replies section */}
          {comment.replies?.length > 0 && (
            <div className="mt-6 space-y-4">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      {reply.photoURL ? (
                        <img src={reply.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">{reply.displayName}</span>
                          {reply.isAdmin && (
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">Admin</span>
                          )}
                          {reply.isEdited && !reply.isDeleted && (
                            <span className="text-gray-500 text-xs flex items-center">
                              <Edit2 className="w-3 h-3 mr-1" /> Diedit
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500 text-sm">
                          {reply.createdAt?.toDate().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) || 'N/A'}
                        </span>
                      </div>
                      {reply.isDeleted ? (
                        <p className="text-gray-500 italic mb-4">[KOMENTAR INI TELAH DIHAPUS]</p>
                      ) : (
                        <p className="text-gray-700 mb-4">{reply.text}</p>
                      )}
                      
                      {/* Reply action buttons */}
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLike(reply.id)}
                          className={`flex items-center space-x-2 transition-colors duration-200 ${
                            reply.userHasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${reply.userHasLiked ? 'fill-red-500' : ''}`} />
                          <span>{reply.likeCount || 0} Like{(reply.likeCount || 0) !== 1 ? 's' : ''}</span>
                        </button>
                        
                        {currentUser?.uid && (
                          <button
                            onClick={() => setReplyTo({ id: comment.id, author: comment.displayName })}
                            className="flex items-center space-x-2 text-gray-500 hover:text-cyan-500 transition-colors duration-200"
                          >
                            <Reply className="w-5 h-5" />
                            <span>Balas</span>
                          </button>
                        )}
                        
                        {currentUser?.uid && (
                          <button
                            onClick={() => handleReport(reply.id)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors duration-200"
                          >
                            <Flag className="w-5 h-5" />
                            <span>Lapor</span>
                          </button>
                        )}
                        
                        {!reply.isDeleted && (currentUser?.uid && (reply.userId === currentUser.uid || currentUserIsAdmin)) && (
                          <button
                            onClick={() => handleDelete(reply.id)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors duration-200"
                          >
                            <Trash2 className="w-5 h-5" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentBox;