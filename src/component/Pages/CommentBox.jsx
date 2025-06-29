import React, { useEffect, useState } from "react";
import { db } from "../../firebaseconfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ADMIN_EMAILS } from "../config/Constants";

const CommentBox = ({ newsId, currentUser }) => {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastCommentTime, setLastCommentTime] = useState(0);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedComment, setFocusedComment] = useState(null);

  // Debug: Log currentUser untuk debugging
  console.log("Current User:", currentUser);
  console.log("Current User Type:", typeof currentUser);
  console.log("Current User UID:", currentUser?.uid);
  console.log("Current User Email:", currentUser?.email);
  console.log("Current User DisplayName:", currentUser?.displayName);

  useEffect(() => {
    if (!newsId) {
      setError("ID berita tidak valid.");
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "news", newsId, "comments"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching comments:", err);
        setError("Gagal memuat komentar: " + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [newsId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = comment.trim();
    setIsSubmitting(true);

    // Periksa apakah user sudah login
    if (!currentUser || !currentUser.uid || !currentUser.email) {
      setError("Silakan login terlebih dahulu untuk mengirim komentar.");
      setIsSubmitting(false);
      return;
    }

    // Validasi panjang komentar
    if (trimmed.length < 3 || trimmed.length > 500) {
      setError("Komentar harus antara 3 hingga 500 karakter.");
      setIsSubmitting(false);
      return;
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastCommentTime < 3000) {
      setError("Tunggu beberapa detik sebelum mengirim komentar lagi.");
      setIsSubmitting(false);
      return;
    }

    try {
      const commentRef = await addDoc(collection(db, "news", newsId, "comments"), {
        text: trimmed.slice(0, 500),
        author: currentUser.displayName || currentUser.email || "User",
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      // Log COMMENT_ADD action
      const isAdmin = ADMIN_EMAILS.includes(currentUser.email);
      await addDoc(collection(db, "logs"), {
        action: "COMMENT_ADD",
        userEmail: currentUser.email,
        details: {
          newsId,
          commentId: commentRef.id,
          text: trimmed.slice(0, 500),
          isAdmin,
        },
        timestamp: new Date(),
      });

      setComment("");
      setLastCommentTime(now);
      setError(null);
    } catch (err) {
      console.error("Gagal mengirim komentar:", err);
      setError("Gagal mengirim komentar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!currentUser || !currentUser.uid || !currentUser.email) {
      setError("Silakan login untuk menghapus komentar.");
      return;
    }

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) {
      setError("Komentar tidak ditemukan.");
      return;
    }

    const isAdmin = ADMIN_EMAILS.includes(currentUser.email);
    const isOwner =
      comment.author === (currentUser.displayName || currentUser.email) ||
      comment.userId === currentUser.uid;

    if (!isAdmin && !isOwner) {
      setError("Anda tidak memiliki izin untuk menghapus komentar ini.");
      return;
    }

    if (!window.confirm("Yakin ingin menghapus komentar ini?")) return;

    try {
      await deleteDoc(doc(db, "news", newsId, "comments", commentId));

      // Log COMMENT_DELETE action
      await addDoc(collection(db, "logs"), {
        action: "COMMENT_DELETE",
        userEmail: currentUser.email,
        details: {
          newsId,
          commentId,
          text: comment.text,
          isAdmin,
        },
        timestamp: new Date(),
      });

      console.log("Komentar berhasil dihapus:", commentId);
      setError(null);
    } catch (err) {
      console.error("Gagal menghapus komentar:", err);
      setError("Gagal menghapus komentar: " + err.message);
    }
  };

  const formatTimeAgo = (date) => {
    if (!date || !date.toDate) return "Baru saja";
    const now = new Date();
    const diff = now - date.toDate();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  // Tentukan apakah user bisa menulis komentar
  const canComment = Boolean(currentUser && currentUser.uid && currentUser.email);
  const isCommentEmpty = comment.trim() === "";

  // Debug log untuk canComment
  console.log("Can Comment:", canComment);
  console.log("Has UID:", Boolean(currentUser?.uid));
  console.log("Has Email:", Boolean(currentUser?.email));

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .fade-in {
            animation: fadeIn 0.6s ease-out forwards;
          }
          
          .scroll-smooth::-webkit-scrollbar {
            width: 6px;
          }
          
          .scroll-smooth::-webkit-scrollbar-track {
            background: rgba(75, 85, 99, 0.1);
            border-radius: 3px;
          }
          
          .scroll-smooth::-webkit-scrollbar-thumb {
            background: rgba(251, 146, 60, 0.3);
            border-radius: 3px;
          }
          
          .scroll-smooth::-webkit-scrollbar-thumb:hover {
            background: rgba(251, 146, 60, 0.5);
          }
        `}
      </style>
      
      <div className="mt-12 max-w-4xl mx-auto scroll-smooth">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
          <h3 className="text-2xl font-bold text-gray-100">
            Diskusi & Komentar
          </h3>
          <div className="flex-1 h-px bg-gradient-to-r from-orange-400/20 to-transparent"></div>
          <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
            {comments.length} komentar
          </span>
        </div>

        {/* Error Alert with Animation */}
        {error && (
          <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 backdrop-blur-sm text-red-300 p-4 mb-6 rounded-xl animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Comment Form */}
        <div className="relative mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <textarea
                className={`w-full p-4 rounded-2xl bg-gray-900/70 backdrop-blur-sm border transition-all duration-300 resize-none
                  ${canComment 
                    ? 'border-gray-700 focus:border-orange-400 focus:bg-gray-900/90 text-white' 
                    : 'border-gray-800 bg-gray-900/30 text-gray-500 cursor-not-allowed'
                  }
                  focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:shadow-lg focus:shadow-orange-400/10
                  placeholder-gray-400`}
                rows="4"
                placeholder={canComment ? "Bagikan pendapat Anda..." : "Silakan login untuk bergabung dalam diskusi"}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!canComment}
                maxLength={500}
              />
              {canComment && (
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {comment.length}/500
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                {canComment ? "Siap untuk mengirim" : "Login diperlukan"}
              </div>
              
              <button
                type="submit"
                disabled={!canComment || isCommentEmpty || isSubmitting}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
                  !canComment || isCommentEmpty || isSubmitting
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed scale-95"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Mengirim...
                  </div>
                ) : canComment ? (
                  "Kirim Komentar"
                ) : (
                  "Harus Login"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-gray-700 border-t-orange-400 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-orange-600 rounded-full animate-spin" style={{animationDelay: '150ms'}}></div>
              </div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-600 border-dashed rounded-full"></div>
              </div>
              <p className="text-gray-400 text-lg">Belum ada diskusi</p>
              <p className="text-gray-500 text-sm mt-1">Jadilah yang pertama berbagi pendapat!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((cmt, index) => {
                const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email);
                const isOwner = currentUser && (
                  cmt.author === (currentUser.displayName || currentUser.email) ||
                  cmt.userId === currentUser.uid
                );
                const canDelete = isAdmin || isOwner;

                return (
                  <div
                    key={cmt.id}
                    className={`group relative bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-sm border border-gray-700/50 
                      rounded-2xl p-6 transition-all duration-500 hover:border-orange-400/30 hover:shadow-lg hover:shadow-orange-400/5
                      transform hover:-translate-y-1 fade-in ${focusedComment === cmt.id ? 'ring-2 ring-orange-400/30' : ''}`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                    onMouseEnter={() => setFocusedComment(cmt.id)}
                    onMouseLeave={() => setFocusedComment(null)}
                  >
                    {/* Comment Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            {(cmt.author || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">
                              {cmt.author || "User"}
                            </span>
                            {isAdmin && (
                              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            {formatTimeAgo(cmt.createdAt)}
                          </span>
                        </div>
                      </div>

                      {canDelete && (
                        <button
                          onClick={() => handleDelete(cmt.id)}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-red-400 hover:text-red-300 
                            hover:bg-red-500/10 p-2 rounded-lg transform hover:scale-110 active:scale-95"
                          title="Hapus komentar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Comment Text */}
                    <div className="relative">
                      <p className="text-gray-200 leading-relaxed whitespace-pre-wrap break-words pl-1">
                        {cmt.text}
                      </p>
                      <div className="absolute -left-3 top-0 w-0.5 h-full bg-gradient-to-b from-orange-400/50 to-transparent rounded-full"></div>
                    </div>

                    {/* Comment Actions Bar */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700/30">
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <button className="flex items-center gap-1 hover:text-orange-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>Suka</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-orange-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>Balas</span>
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CommentBox;