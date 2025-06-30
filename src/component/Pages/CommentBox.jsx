import React, { useEffect, useState, useCallback } from "react";
import { Reply, Heart, Trash2, MessageCircle } from "lucide-react";
import { db } from "../../firebaseconfig";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  updateDoc 
} from "firebase/firestore";
import { toast } from "react-toastify";
import { ADMIN_EMAILS } from "../config/Constants";

const CommentBox = ({ newsId, currentUser, onCommentCountChange }) => {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastCommentTime, setLastCommentTime] = useState(0);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedComment, setFocusedComment] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyComment, setReplyComment] = useState("");
  const [commentLikes, setCommentLikes] = useState({});

  // Fetch comments and likes in real-time
  const fetchComments = useCallback(() => {
    if (!newsId) {
      console.warn("fetchComments: newsId is undefined or null");
      setLoading(false);
      return () => {};
    }
    console.log("fetchComments: Subscribing to newsId:", newsId);

    const commentsQuery = query(
      collection(db, `news/${newsId}/comments`),
      orderBy("createdAt", "desc")
    );
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      console.log("fetchComments: Snapshot received, docs length:", snapshot.docs.length);
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt
      }));
      setComments(commentsData);
      if (onCommentCountChange) onCommentCountChange(commentsData.length);
      setLoading(false); // Ensure loading is turned off after data is received
    }, (err) => {
      console.error("Error fetching comments:", err);
      setError("Gagal memuat komentar.");
      toast.error("Gagal memuat komentar.");
      setLoading(false); // Turn off loading on error
    });

    // Fetch likes for each comment
    const unsubscribeLikes = onSnapshot(commentsQuery, (snapshot) => {
      const likesData = {};
      snapshot.docs.forEach(commentDoc => {
        const likesQuery = query(
          collection(db, `news/${newsId}/comments/${commentDoc.id}/likes`)
        );
        onSnapshot(likesQuery, (likesSnapshot) => {
          const count = likesSnapshot.size;
          const userLiked = currentUser ? !!likesSnapshot.docs.find(doc => doc.data().userId === currentUser.uid) : false;
          likesData[commentDoc.id] = { count, userLiked };
        }, (err) => {
          console.error("Error fetching likes:", err);
        });
      });
      setCommentLikes(likesData);
    }, (err) => {
      console.error("Error setting up likes listener:", err);
    });

    return () => {
      unsubscribeComments();
      unsubscribeLikes();
    };
  }, [newsId, currentUser, onCommentCountChange]);

  useEffect(() => {
    const cleanup = fetchComments();
    return cleanup;
  }, [fetchComments]);

  const handleSubmit = async (e, parentId = null, replyToAuthor = null) => {
    e.preventDefault();
    const textToSubmit = parentId ? replyComment.trim() : comment.trim();
    if (!currentUser) {
      setError("Silakan masuk untuk mengirim komentar.");
      return;
    }
    setIsSubmitting(true);

    if (textToSubmit.length < 3 || textToSubmit.length > 500) {
      setError("Komentar harus antara 3 hingga 500 karakter.");
      setIsSubmitting(false);
      return;
    }

    const now = Date.now();
    if (now - lastCommentTime < 3000) {
      setError("Tunggu beberapa detik sebelum mengirim komentar lagi.");
      setIsSubmitting(false);
      return;
    }

    try {
      const commentsRef = collection(db, `news/${newsId}/comments`);
      await addDoc(commentsRef, {
        text: textToSubmit,
        author: currentUser.displayName || currentUser.email || "User",
        userId: currentUser.uid,
        userEmail: currentUser.email,
        createdAt: serverTimestamp(),
        parentId: parentId || null,
        ...(parentId && { replyToAuthor })
      });

      if (parentId) {
        setReplyComment("");
        setReplyTo(null);
      } else {
        setComment("");
      }
      setLastCommentTime(now);
      setError(null);
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError("Gagal mengirim komentar.");
      toast.error("Gagal mengirim komentar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!currentUser) {
      setError("Silakan masuk untuk menghapus komentar.");
      return;
    }

    const comment = comments.find(c => c.id === commentId);
    if (!comment) {
      setError("Komentar tidak ditemukan.");
      return;
    }

    const isAdmin = ADMIN_EMAILS.includes(currentUser.email);
    const isOwner = comment.userId === currentUser.uid;

    if (!isAdmin && !isOwner) {
      setError("Anda tidak memiliki izin untuk menghapus komentar ini.");
      return;
    }

    try {
      await deleteDoc(doc(db, `news/${newsId}/comments`, commentId));
      // Remove nested replies
      const replies = comments.filter(c => c.parentId === commentId);
      replies.forEach(reply => handleDelete(reply.id));
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Gagal menghapus komentar.");
      toast.error("Gagal menghapus komentar.");
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!currentUser) {
      setError("Silakan masuk untuk menyukai komentar.");
      return;
    }

    const likes = commentLikes[commentId] || { count: 0, userLiked: false };
    const likeRef = doc(db, `news/${newsId}/comments/${commentId}/likes`, currentUser.uid);

    try {
      if (likes.userLiked) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, { userId: currentUser.uid, timestamp: serverTimestamp() });
      }
    } catch (err) {
      console.error("Error liking comment:", err);
      setError("Gagal menyukai komentar.");
      toast.error("Gagal menyukai komentar.");
    }
  };

  const formatTimeAgo = (date) => {
    if (!date || !date.toDate) return "Baru saja";
    const now = new Date();
    const diff = now - date.toDate();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  const organizeComments = (comments) => {
    const commentMap = {};
    const rootComments = [];

    comments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    comments.forEach(comment => {
      if (comment.parentId && commentMap[comment.parentId]) {
        commentMap[comment.parentId].replies.push(commentMap[comment.id]);
      } else if (!comment.parentId) {
        rootComments.push(commentMap[comment.id]);
      }
    });

    rootComments.sort((a, b) => {
      const timeA = a.createdAt?.toDate?.() || new Date(0);
      const timeB = b.createdAt?.toDate?.() || new Date(0);
      return timeB - timeA;
    });

    return rootComments;
  };

  const renderComment = (cmt, depth = 0) => {
    const isAdmin = ADMIN_EMAILS.includes(currentUser?.email || "");
    const isOwner = cmt.userId === currentUser?.uid;
    const canDelete = isAdmin || isOwner;
    const likes = commentLikes[cmt.id] || { count: 0, userLiked: currentUser ? !!currentUser.uid : false };

    return (
      <div key={cmt.id} className={`space-y-4`}>
        <div
          className={`group relative bg-white rounded-xl p-6 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md hover:border-cyan-300 ${focusedComment === cmt.id ? 'ring-2 ring-cyan-300' : ''} ${depth > 0 ? 'ml-8 border-l-4 border-cyan-200' : ''}`}
          onMouseEnter={() => setFocusedComment(cmt.id)}
          onMouseLeave={() => setFocusedComment(null)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {(cmt.author || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800">{cmt.author || "User"}</span>
                  {isAdmin && cmt.userId === currentUser?.uid && (
                    <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">Admin</span>
                  )}
                  {cmt.parentId && cmt.replyToAuthor && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Membalas {cmt.replyToAuthor}</span>
                  )}
                </div>
                <span className="text-xs text-slate-500">{formatTimeAgo(cmt.createdAt)}</span>
              </div>
            </div>
            {canDelete && (
              <button
                onClick={() => handleDelete(cmt.id)}
                className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg"
                title="Hapus komentar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="mb-4">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{cmt.text}</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleLikeComment(cmt.id)}
                className={`flex items-center gap-1 text-sm transition-colors ${likes.userLiked ? 'text-red-500 font-semibold' : 'text-slate-500 hover:text-red-500'}`}
                disabled={isSubmitting}
              >
                <Heart className={`w-4 h-4 ${likes.userLiked ? 'fill-current' : ''}`} />
                <span>{likes.count}</span>
              </button>
              <button
                onClick={() => setReplyTo(replyTo?.id === cmt.id ? null : { id: cmt.id, author: cmt.author || "User" })}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-cyan-600 transition-colors"
              >
                <Reply className="w-4 h-4" />
                <span>Balas</span>
              </button>
              {cmt.replies && cmt.replies.length > 0 && (
                <span className="text-xs text-slate-400">{cmt.replies.length} balasan</span>
              )}
            </div>
          </div>
          {replyTo && replyTo.id === cmt.id && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <div className="space-y-3">
                <textarea
                  className="w-full p-3 rounded-lg border border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 resize-none text-sm"
                  rows="3"
                  placeholder={`Balas ${cmt.author || "User"}...`}
                  value={replyComment}
                  onChange={(e) => setReplyComment(e.target.value)}
                  maxLength={500}
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{replyComment.length}/500</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setReplyTo(null); setReplyComment(""); }}
                      className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                      disabled={isSubmitting}
                    >
                      Batal
                    </button>
                    <button
                      onClick={(e) => handleSubmit(e, cmt.id, cmt.author)}
                      disabled={isSubmitting || replyComment.trim() === ""}
                      className={`px-4 py-1 rounded-lg text-sm font-medium transition-all ${isSubmitting || replyComment.trim() === "" ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}
                    >
                      {isSubmitting ? "Mengirim..." : "Kirim"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {cmt.replies && cmt.replies.length > 0 && (
          <div className="space-y-4">
            {cmt.replies.sort((a, b) => {
              const timeA = a.createdAt?.toDate?.() || new Date(0);
              const timeB = b.createdAt?.toDate?.() || new Date(0);
              return timeA - timeB;
            }).map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const organizedComments = organizeComments(comments);
  const canComment = !!currentUser;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="w-6 h-6 text-cyan-600" />
        <h3 className="text-xl font-bold text-slate-800">Komentar ({comments.length})</h3>
      </div>
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 className="font-bold text-blue-800 mb-2">Rules Berkomentar</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>Harap komentar yang baik aja</p>
          <p>jangan spam, kalau spam bakalan kena sanksi</p>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>
      )}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="space-y-4">
          <textarea
            className="w-full p-4 rounded-lg border border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 text-slate-800 resize-none transition-all"
            rows="4"
            placeholder="Tulis komentar Anda..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!canComment || isSubmitting}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">{comment.length}/500</span>
            <button
              onClick={handleSubmit}
              disabled={!canComment || comment.trim() === "" || isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${!canComment || comment.trim() === "" || isSubmitting ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}
            >
              {isSubmitting ? "Mengirim..." : "Kirim Komentar"}
            </button>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
          </div>
        ) : organizedComments.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl">
            <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Belum ada komentar</p>
            <p className="text-slate-500 text-sm mt-1">Jadilah yang pertama untuk berkomentar!</p>
          </div>
        ) : (
          organizedComments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
};

export default CommentBox;