import React, { useEffect, useState } from "react";
import { Reply, Heart, Trash2, MessageCircle } from "lucide-react";

// Mock data for demonstration - replace with your Firebase logic
const ADMIN_EMAILS = ["admin@example.com"];

const CommentBox = ({ newsId, currentUser, onCommentCountChange }) => {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastCommentTime, setLastCommentTime] = useState(0);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedComment, setFocusedComment] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [commentLikes, setCommentLikes] = useState({});
  const [replyComment, setReplyComment] = useState("");

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading comments with proper parentId structure
    const mockComments = [
      {
        id: "1",
        text: "This is the first comment",
        author: "John Doe",
        userId: "user1",
        userEmail: "john@example.com",
        createdAt: { toDate: () => new Date(Date.now() - 3600000) },
        parentId: null
      },
      {
        id: "2",
        text: "This is a reply to the first comment",
        author: "Jane Smith",
        userId: "user2",
        userEmail: "jane@example.com",
        createdAt: { toDate: () => new Date(Date.now() - 3000000) },
        parentId: "1",
        replyToAuthor: "John Doe"
      },
      {
        id: "3",
        text: "Another top-level comment",
        author: "Bob Wilson",
        userId: "user3",
        userEmail: "bob@example.com",
        createdAt: { toDate: () => new Date(Date.now() - 1800000) },
        parentId: null
      },
      {
        id: "4",
        text: "Reply to Bob's comment",
        author: "Alice Brown",
        userId: "user4",
        userEmail: "alice@example.com",
        createdAt: { toDate: () => new Date(Date.now() - 900000) },
        parentId: "3",
        replyToAuthor: "Bob Wilson"
      },
      {
        id: "5",
        text: "Nested reply",
        author: "Charlie Davis",
        userId: "user5",
        userEmail: "charlie@example.com",
        createdAt: { toDate: () => new Date(Date.now() - 600000) },
        parentId: "2",
        replyToAuthor: "Jane Smith"
      }
    ];

    setComments(mockComments);
    
    // Initialize likes
    const initialLikes = {};
    mockComments.forEach(comment => {
      initialLikes[comment.id] = {
        count: Math.floor(Math.random() * 10),
        userLiked: Math.random() > 0.7
      };
    });
    setCommentLikes(initialLikes);

    if (onCommentCountChange) {
      onCommentCountChange(mockComments.length);
    }
  }, [newsId, onCommentCountChange]);

  const handleSubmit = async (e, parentId = null, replyToAuthor = null) => {
    e.preventDefault();
    const textToSubmit = parentId ? replyComment.trim() : comment.trim();
    setIsSubmitting(true);

    // Mock current user for demo
    const mockCurrentUser = currentUser || {
      uid: "demo-user",
      email: "demo@example.com",
      displayName: "Demo User"
    };

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

    // Create new comment
    const newComment = {
      id: Date.now().toString(),
      text: textToSubmit,
      author: mockCurrentUser.displayName || mockCurrentUser.email || "User",
      userId: mockCurrentUser.uid,
      userEmail: mockCurrentUser.email,
      createdAt: { toDate: () => new Date() },
      parentId: parentId || null,
      ...(parentId && { replyToAuthor })
    };

    setComments(prev => [newComment, ...prev]);
    setCommentLikes(prev => ({
      ...prev,
      [newComment.id]: { count: 0, userLiked: false }
    }));

    if (parentId) {
      setReplyComment("");
      setReplyTo(null);
    } else {
      setComment("");
    }
    
    setLastCommentTime(now);
    setError(null);
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId) => {
    const mockCurrentUser = currentUser || { email: "demo@example.com", uid: "demo-user" };
    const comment = comments.find((c) => c.id === commentId);
    
    if (!comment) {
      setError("Komentar tidak ditemukan.");
      return;
    }

    const isAdmin = ADMIN_EMAILS.includes(mockCurrentUser.email);
    const isOwner = comment.userId === mockCurrentUser.uid;

    if (!isAdmin && !isOwner) {
      setError("Anda tidak memiliki izin untuk menghapus komentar ini.");
      return;
    }

    // Remove comment and its replies
    setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
    
    // Remove likes
    setCommentLikes(prev => {
      const newLikes = { ...prev };
      delete newLikes[commentId];
      return newLikes;
    });
  };

  const handleLikeComment = async (commentId) => {
    const likes = commentLikes[commentId] || { count: 0, userLiked: false };
    const newUserLiked = !likes.userLiked;
    const newCount = newUserLiked ? likes.count + 1 : likes.count - 1;

    setCommentLikes(prev => ({
      ...prev,
      [commentId]: {
        count: Math.max(0, newCount),
        userLiked: newUserLiked
      }
    }));
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

  // Improved render function with better organization
  const organizeComments = (comments) => {
    const commentMap = {};
    const rootComments = [];

    // First, create a map of all comments
    comments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    // Then, organize them into a tree structure
    comments.forEach(comment => {
      if (comment.parentId && commentMap[comment.parentId]) {
        commentMap[comment.parentId].replies.push(commentMap[comment.id]);
      } else if (!comment.parentId) {
        rootComments.push(commentMap[comment.id]);
      }
    });

    // Sort root comments by creation time (newest first)
    rootComments.sort((a, b) => {
      const timeA = a.createdAt?.toDate?.() || new Date(0);
      const timeB = b.createdAt?.toDate?.() || new Date(0);
      return timeB - timeA;
    });

    return rootComments;
  };

  const renderComment = (cmt, depth = 0) => {
    const mockCurrentUser = currentUser || { email: "demo@example.com", uid: "demo-user" };
    const isAdmin = ADMIN_EMAILS.includes(mockCurrentUser.email);
    const isOwner = cmt.userId === mockCurrentUser.uid;
    const canDelete = isAdmin || isOwner;
    const likes = commentLikes[cmt.id] || { count: 0, userLiked: false };

    return (
      <div key={cmt.id} className="space-y-4">
        <div
          className={`group relative bg-white rounded-xl p-6 shadow-sm border border-slate-200 
            transition-all duration-300 hover:shadow-md hover:border-cyan-300
            ${focusedComment === cmt.id ? 'ring-2 ring-cyan-300' : ''} 
            ${depth > 0 ? 'ml-8 border-l-4 border-cyan-200' : ''}`}
          onMouseEnter={() => setFocusedComment(cmt.id)}
          onMouseLeave={() => setFocusedComment(null)}
        >
          {/* Comment Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {(cmt.author || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800">{cmt.author || "User"}</span>
                  {isAdmin && cmt.userId === mockCurrentUser?.uid && (
                    <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                  {cmt.parentId && cmt.replyToAuthor && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Membalas {cmt.replyToAuthor}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {formatTimeAgo(cmt.createdAt)}
                </span>
              </div>
            </div>
            {canDelete && (
              <button
                onClick={() => handleDelete(cmt.id)}
                className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-red-500 hover:text-red-700 
                  hover:bg-red-50 p-2 rounded-lg"
                title="Hapus komentar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Comment Text */}
          <div className="mb-4">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
              {cmt.text}
            </p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleLikeComment(cmt.id)}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  likes.userLiked 
                    ? "text-red-500 font-semibold" 
                    : "text-slate-500 hover:text-red-500"
                }`}
                disabled={isSubmitting}
              >
                <Heart className={`w-4 h-4 ${likes.userLiked ? "fill-current" : ""}`} />
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
                <span className="text-xs text-slate-400">
                  {cmt.replies.length} balasan
                </span>
              )}
            </div>
          </div>

          {/* Reply Form */}
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
                  <span className="text-xs text-slate-500">
                    {replyComment.length}/500
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyComment("");
                      }}
                      className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                      disabled={isSubmitting}
                    >
                      Batal
                    </button>
                    <button
                      onClick={(e) => handleSubmit(e, cmt.id, cmt.author)}
                      disabled={isSubmitting || replyComment.trim() === ""}
                      className={`px-4 py-1 rounded-lg text-sm font-medium transition-all ${
                        isSubmitting || replyComment.trim() === ""
                          ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                          : "bg-cyan-600 text-white hover:bg-cyan-700"
                      }`}
                    >
                      {isSubmitting ? "Mengirim..." : "Kirim"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Render Replies */}
        {cmt.replies && cmt.replies.length > 0 && (
          <div className="space-y-4">
            {cmt.replies
              .sort((a, b) => {
                const timeA = a.createdAt?.toDate?.() || new Date(0);
                const timeB = b.createdAt?.toDate?.() || new Date(0);
                return timeA - timeB; // Oldest replies first
              })
              .map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const organizedComments = organizeComments(comments);
  const canComment = true; // For demo purposes

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MessageCircle className="w-6 h-6 text-cyan-600" />
        <h3 className="text-xl font-bold text-slate-800">
          Komentar ({comments.length})
        </h3>
      </div>

      {/* Debug Info */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 className="font-bold text-blue-800 mb-2">Improved Comment System Demo</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>NewsId: {newsId || 'demo-news-id'}</p>
          <p>Total Comments: {comments.length}</p>
          <p>Root Comments: {organizedComments.length}</p>
          <p>Status: Working with proper reply nesting</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Comment Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="space-y-4">
          <textarea
            className="w-full p-4 rounded-lg border border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 text-slate-800 resize-none transition-all"
            rows="4"
            placeholder="Tulis komentar Anda..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!canComment}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              {comment.length}/500
            </span>
            <button
              onClick={handleSubmit}
              disabled={!canComment || comment.trim() === "" || isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                !canComment || comment.trim() === "" || isSubmitting
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-cyan-600 text-white hover:bg-cyan-700"
              }`}
            >
              {isSubmitting ? "Mengirim..." : "Kirim Komentar"}
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
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