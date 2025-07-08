import React, { useEffect, useState, useCallback, useRef } from "react";
import { Reply, Heart, Trash2, MessageCircle, Flag, X, AlertTriangle, Edit2, Eye, EyeOff } from "lucide-react";
import { db, auth } from "../../firebaseconfig";
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
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  runTransaction
} from "firebase/firestore";
import { toast } from "react-toastify";
import { ADMIN_EMAILS } from "../config/Constants";
import DOMPurify from 'dompurify';
import { onAuthStateChanged } from "firebase/auth";

// Modal Component with smooth animations
const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      ></div>
      <div className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-lg transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Admin Info Modal
const AdminInfoModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Informasi Admin">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 18.879A3 3 0 018 16h8a3 3 0 012.879 2.879M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <div>
        <p className="text-slate-700 mb-2">Ini adalah admin yang bertugas untuk mengelola dan memoderasi komentar agar diskusi tetap hormat dan menarik.</p>
      </div>
      <button
        onClick={onClose}
        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors"
      >
        Mengerti
      </button>
    </div>
  </Modal>
);

// Spam Warning Modal
const SpamWarningModal = ({ isOpen, onClose, remainingTime }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Peringatan Spam">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
        <AlertTriangle className="w-8 h-8 text-yellow-600" />
      </div>
      <div>
        <p className="text-slate-700 mb-2">Anda mengirim komentar terlalu cepat!</p>
        <p className="text-sm text-slate-500">
          Tunggu {Math.ceil(remainingTime / 1000)} detik lagi sebelum mengirim komentar berikutnya.
        </p>
      </div>
      <button
        onClick={onClose}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors"
      >
        Mengerti
      </button>
    </div>
  </Modal>
);

// Delete Confirmation Modal
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, isDeleting, commentText }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Konfirmasi Hapus">
    <div className="space-y-4">
      <p className="text-slate-700">Apakah Anda yakin ingin menghapus komentar ini?</p>
      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">{commentText || 'Unknown Comment'}</p>
      <p className="text-sm text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          Batal
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {isDeleting ? "Menghapus..." : "Hapus"}
        </button>
      </div>
    </div>
  </Modal>
);

// Edit Comment Modal
const EditCommentModal = ({ isOpen, onClose, onSubmit, isSubmitting, commentText }) => {
  const [editedText, setEditedText] = useState(commentText);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Komentar">
      <div className="space-y-4">
        <textarea
          className="w-full p-3 rounded-lg border border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 resize-none text-sm"
          rows="4"
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          maxLength={500}
          disabled={isSubmitting}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">{editedText.length}/500</span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={() => onSubmit(editedText)}
              disabled={isSubmitting || editedText.trim() === "" || editedText === commentText}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Original Comment Modal
const OriginalCommentModal = ({ isOpen, onClose, originalText }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Komentar Asli">
    <div className="space-y-4">
      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">{originalText || 'Komentar asli tidak tersedia.'}</p>
      <button
        onClick={onClose}
        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors"
      >
        Tutup
      </button>
    </div>
  </Modal>
);

// Report Modal
const ReportModal = ({ isOpen, onClose, onSubmit, isSubmitting, commentText }) => {
  const [reportReason, setReportReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const reasons = [
    "Spam atau konten berulang",
    "Bahasa kasar atau tidak pantas",
    "Informasi palsu atau menyesatkan",
    "Konten yang melanggar aturan",
    "Lainnya"
  ];

  const handleSubmit = () => {
    const reason = reportReason === "Lainnya" ? customReason : reportReason;
    if (reason.trim()) {
      onSubmit(reason);
      setReportReason("");
      setCustomReason("");
    } else {
      toast.error("Harap pilih atau masukkan alasan pelaporan.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'report-no-reason'
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Laporkan Komentar">
      <div className="space-y-4">
        <p className="text-slate-700">Mengapa Anda melaporkan komentar ini?</p>
        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">{commentText || 'Unknown Comment'}</p>
        <div className="space-y-2">
          {reasons.map((reason) => (
            <label key={reason} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="reportReason"
                value={reason}
                checked={reportReason === reason}
                onChange={(e) => setReportReason(e.target.value)}
                className="text-red-500 focus:ring-red-500"
              />
              <span className="text-sm text-slate-700">{reason}</span>
            </label>
          ))}
        </div>
        {reportReason === "Lainnya" && (
          <div>
            <textarea
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm"
              rows="3"
              placeholder="Jelaskan alasan Anda..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              maxLength={200}
            />
            <span className="text-xs text-slate-500">{customReason.length}/200</span>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !reportReason || (reportReason === "Lainnya" && !customReason.trim())}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Melaporkan..." : "Laporkan"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Custom hook for avatar rendering
const useCommentAvatar = (cmt) => {
  const placeholderRef = useRef(null);

  const handleError = (e) => {
    e.target.style.display = 'none';
    if (placeholderRef.current) {
      placeholderRef.current.style.display = 'none';
    }
    e.target.nextSibling.style.display = 'flex';
  };

  const handleLoad = (e) => {
    if (placeholderRef.current) {
      placeholderRef.current.style.display = 'none';
    }
    e.target.style.display = 'block';
  };

  const sanitizeInput = (input) => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    }).trim();
  };

  return {
    placeholderRef,
    renderAvatar: () => (
      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-300 group-hover:border-cyan-400 transition-all duration-300">
        {cmt.photoURL ? (
          <>
            <div ref={placeholderRef} className="absolute inset-0 bg-slate-200 animate-pulse" />
            <img 
              src={cmt.photoURL} 
              alt={sanitizeInput(cmt.author || "User")} 
              className="w-full h-full object-cover"
              loading="lazy"
              onError={handleError}
              onLoad={handleLoad}
            />
          </>
        ) : null}
        <span className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-bold text-sm ${cmt.photoURL ? 'hidden' : 'flex'}`}>
          {(sanitizeInput(cmt.author || "U")).charAt(0).toUpperCase()}
        </span>
      </div>
    )
  };
};

// Comment Component
// Comment Component
const Comment = ({ cmt, depth = 0, currentUser, commentLikes, reportedComments, isSubmitting, replyTo, setReplyTo, replyComment, setReplyComment, handleSubmit, handleLikeComment, handleReplyClick, handleDeleteClick, handleReportClick, handleEditClick, handleShowOriginalClick, handleToggleReplies, areRepliesHidden, setFocusedComment, focusedComment, sanitizeInput, formatTimeAgo, commentRefs, comments }) => {
  const isAdmin = ADMIN_EMAILS.includes(currentUser?.email || "");
  const isOwner = cmt.userId === currentUser?.uid;
  const canDelete = isAdmin || isOwner;
  const canEdit = (isAdmin || isOwner) && cmt.createdAt && (Date.now() - cmt.createdAt.toDate().getTime()) < 300000; // 5 minutes
  const likes = commentLikes[cmt.id] || { count: 0, userLiked: currentUser ? !!currentUser.uid : false };
  const isReported = reportedComments[cmt.id] || false;
  const { renderAvatar } = useCommentAvatar(cmt);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const commentRef = useRef(null);
  const hasReplies = cmt.replies && cmt.replies.length > 0;
  const repliesHidden = areRepliesHidden(cmt.id);

  useEffect(() => {
    commentRefs.current[cmt.id] = commentRef;
  }, [cmt.id, commentRefs]);

  const replyIndicator = cmt.parentId ? (
    cmt.replyToAuthor === (currentUser?.displayName || currentUser?.email) 
      ? "membalas komentar Anda" 
      : `membalas ${sanitizeInput(cmt.replyToAuthor || "user12345")}`
  ) : null;

  return (
    <div key={cmt.id} className="space-y-4">
      <AdminInfoModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
      <div
        className={`group relative rounded-2xl p-5 shadow-md border transition-all duration-300 ease-out hover:shadow-lg ${
          depth > 0 
            ? 'ml-10 bg-gray-50 border-gray-200 border-l-4 hover:border-gray-300'
            : 'bg-white border-gray-200 hover:border-cyan-200'
        } ${focusedComment === cmt.id ? 'ring-2 ring-cyan-400' : ''}`}
        ref={commentRef}
        onMouseEnter={() => setFocusedComment(cmt.id)}
        onMouseLeave={() => setFocusedComment(null)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {renderAvatar()}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 transition-colors group-hover:text-cyan-600">{sanitizeInput(cmt.author || "User")}</span>
                {replyIndicator && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    depth > 0 ? 'bg-cyan-100 text-cyan-800' : 'bg-gray-100 text-gray-600'
                  } transition-all duration-200 group-hover:bg-cyan-200`}>
                    {replyIndicator}
                  </span>
                )}
                {ADMIN_EMAILS.includes(cmt.userEmail) && (
                  <button
                    onClick={() => setIsAdminModalOpen(true)}
                    className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                    aria-label="Lihat informasi admin"
                  >
                    Admin
                  </button>
                )}
                {isOwner && (
                  <span className="text-xs bg-gray-400 text-white px-2 py-0.5 rounded-full animate-pulse-once">(You)</span>
                )}
              </div>
              <span className="text-xs text-gray-500 transition-colors group-hover:text-gray-600">{formatTimeAgo(cmt.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {hasReplies && currentUser && (
              <button
                onClick={() => handleToggleReplies(cmt.id)}
                className="text-gray-500 hover:text-gray-700 bg-gray-50 p-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
                title={repliesHidden ? "Tampilkan balasan" : "Sembunyikan balasan"}
              >
                {repliesHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            )}
            {currentUser && !isOwner && (
              <button
                onClick={() => handleReportClick(cmt.id)}
                className={`text-orange-500 hover:text-orange-700 bg-orange-50 p-2 rounded-lg transition-all duration-200 hover:bg-orange-100 ${isReported ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Laporkan komentar"
                disabled={isReported}
              >
                <Flag className={`w-4 h-4 ${isReported ? 'fill-current' : ''}`} />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => handleDeleteClick(cmt.id)}
                className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition-all duration-200 hover:bg-red-100"
                title="Hapus komentar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => handleEditClick(cmt.id, cmt.text)}
                className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg transition-all duration-200 hover:bg-blue-100"
                title="Edit komentar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="mb-4">
          <p className={`text-gray-800 leading-relaxed whitespace-pre-wrap break-words transition-colors duration-200 ${depth > 0 ? 'font-medium' : ''} group-hover:text-gray-900 !text-gray-800`}>
            {sanitizeInput(cmt.text)}
            {cmt.isEdited && (
              <button
                onClick={() => handleShowOriginalClick(cmt.id, cmt.originalText)}
                className="text-xs text-gray-500 italic ml-2 hover:text-gray-700 transition-colors duration-200"
                aria-label="Lihat komentar asli"
              >
                (edited)
              </button>
            )}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLikeComment(cmt.id)}
              className={`flex items-center gap-1 text-sm transition-all duration-200 ${likes.userLiked ? 'text-red-500 font-medium' : 'text-gray-500 hover:text-red-500'}`}
              disabled={isSubmitting}
            >
              <Heart className={`w-4 h-4 transition-transform ${likes.userLiked ? 'fill-current scale-110' : ''}`} />
              <span className="transition-colors">{likes.count}</span>
            </button>
            <button
              onClick={() => handleReplyClick(cmt.id, cmt.author)}
              className={`flex items-center gap-1 text-sm transition-all duration-200 ${currentUser ? 'text-gray-500 hover:text-cyan-600' : 'text-gray-400 cursor-not-allowed'}`}
              disabled={!currentUser}
            >
              <Reply className="w-4 h-4 transition-transform hover:scale-110" />
              <span className="transition-colors">Balas</span>
            </button>
          </div>
        </div>
        {replyTo && replyTo.id === cmt.id && (
          <div
            className="mt-6 p-4 rounded-xl border border-gray-300 bg-gray-100 shadow-md transition-all duration-300 ease-in-out"
          >
            <div className="space-y-4">
              <textarea
                className="w-full p-3 rounded-lg border border-gray-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 resize-none text-sm text-white !text-white"
                rows="3"
                placeholder={currentUser ? `Balas ${sanitizeInput(cmt.author || "User")}...` : "Silakan masuk untuk membalas komentar"}
                style={{ color: '#ffffff !important' }} // Hanya warna teks, tanpa background override
                value={replyComment}
                onChange={(e) => setReplyComment(e.target.value)}
                maxLength={500}
                disabled={!currentUser || isSubmitting}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-white">{replyComment.length}/500</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setReplyTo(null); setReplyComment(""); }}
                    className="px-3 py-1.5 text-sm text-white hover:text-gray-200 bg-gray-700/50 rounded-lg transition-all duration-200 hover:bg-gray-700"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    onClick={(e) => handleSubmit(e, cmt.id, cmt.author)}
                    disabled={!currentUser || isSubmitting || replyComment.trim() === ""}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      !currentUser || isSubmitting || replyComment.trim() === ""
                        ? 'bg-gray-700/50 text-white/50 cursor-not-allowed'
                        : 'bg-cyan-600 text-white hover:bg-cyan-700'
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
      {hasReplies && (
        <div className={`space-y-4 ${repliesHidden ? 'hidden' : 'transition-opacity duration-300 opacity-100'}`}>
          {cmt.replies.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.() || new Date(0);
            const timeB = b.createdAt?.toDate?.() || new Date(0);
            return timeA - timeB;
          }).map(reply => (
            <Comment
              key={reply.id}
              cmt={{ ...reply, replies: reply.replies || [] }}
              depth={depth + 1}
              currentUser={currentUser}
              commentLikes={commentLikes}
              reportedComments={reportedComments}
              isSubmitting={isSubmitting}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              replyComment={replyComment}
              setReplyComment={setReplyComment}
              handleSubmit={handleSubmit}
              handleLikeComment={handleLikeComment}
              handleReplyClick={handleReplyClick}
              handleDeleteClick={handleDeleteClick}
              handleReportClick={handleReportClick}
              handleEditClick={handleEditClick}
              handleShowOriginalClick={handleShowOriginalClick}
              handleToggleReplies={handleToggleReplies}
              areRepliesHidden={areRepliesHidden}
              setFocusedComment={setFocusedComment}
              focusedComment={focusedComment}
              sanitizeInput={sanitizeInput}
              formatTimeAgo={formatTimeAgo}
              commentRefs={commentRefs}
              comments={comments}
            />
          ))}
        </div>
      )}
    </div>
  );
};
const CommentBox = ({ newsId, currentUser: propCurrentUser, onCommentCountChange }) => {
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
  const [reportedComments, setReportedComments] = useState({});
  const [hiddenReplies, setHiddenReplies] = useState(() => {
    const saved = localStorage.getItem(`hiddenReplies_${newsId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [editModal, setEditModal] = useState({ isOpen: false, commentId: null, isSubmitting: false, commentText: '' });
  const [originalCommentModal, setOriginalCommentModal] = useState({ isOpen: false, originalText: '' });
  const [spamWarning, setSpamWarning] = useState({ isOpen: false, remainingTime: 0 });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, commentId: null, isDeleting: false, commentText: '' });
  const [reportModal, setReportModal] = useState({
    isOpen: false,
    commentId: null,
    isSubmitting: false,
    commentText: ''
  });
  const [currentUser, setCurrentUser] = useState(propCurrentUser);
  const commentRefs = useRef({});

  const sanitizeInput = useCallback((input) => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    }).trim();
  }, []);

  const countAllComments = useCallback((comments) => {
    let total = comments.length;
    comments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        total += countAllComments(comment.replies);
      }
    });
    return total;
  }, []);

  const updateNewsCommentCount = useCallback(async (newsId, increment) => {
    const newsRef = doc(db, 'news', newsId);
    try {
      await runTransaction(db, async (transaction) => {
        const newsDoc = await transaction.get(newsRef);
        if (!newsDoc.exists()) {
          throw new Error("News document does not exist");
        }
        const currentCount = newsDoc.data().comments || 0;
        transaction.update(newsRef, { comments: Math.max(0, currentCount + increment) });
      });
      console.log(`Updated comment count for news ${newsId} by ${increment}`);
    } catch (error) {
      console.error("Error updating news comment count:", error);
      toast.error("Gagal memperbarui jumlah komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'update-comment-count-error'
      });
    }
  }, []);

  const areRepliesHidden = useCallback((commentId) => {
    return !!hiddenReplies[commentId];
  }, [hiddenReplies]);

  const handleToggleReplies = useCallback((commentId) => {
    setHiddenReplies(prev => {
      const newHiddenReplies = { ...prev, [commentId]: !prev[commentId] };
      localStorage.setItem(`hiddenReplies_${newsId}`, JSON.stringify(newHiddenReplies));
      return newHiddenReplies;
    });
  }, [newsId]);

  const formatTimeAgo = useCallback((date) => {
    if (!date || !date.toDate) return "Baru saja";
    const now = new Date();
    const diff = now - date.toDate();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  }, []);

  useEffect(() => {
    let unsubscribeComments = () => {};
    let unsubscribeLikes = () => {};
    let unsubscribeAuth = () => {};

    const fetchCommentsData = async () => {
      if (!newsId) {
        console.warn("fetchComments: newsId is undefined or null");
        setLoading(false);
        return;
      }

      const commentsQuery = query(
        collection(db, `news/${newsId}/comments`),
        orderBy("createdAt", "desc")
      );
      unsubscribeComments = onSnapshot(commentsQuery, async (snapshot) => {
        const commentsData = [];
        const userIds = [...new Set(snapshot.docs.map(doc => doc.data().userId).filter(id => id))];

        let userMap = {};
        if (userIds.length > 0) {
          try {
            const chunks = [];
            for (let i = 0; i < userIds.length; i += 10) {
              chunks.push(userIds.slice(i, i + 10));
            }
            for (const chunk of chunks) {
              const usersQuery = query(collection(db, "users"), where("uid", "in", chunk));
              const querySnapshot = await getDocs(usersQuery);
              querySnapshot.forEach(doc => {
                const userData = doc.data();
                userMap[doc.id] = {
                  displayName: sanitizeInput(userData.displayName || userData.email || "User"),
                  photoURL: userData.photoURL || null
                };
              });
            }
          } catch (err) {
            console.error("Error fetching user data:", err);
            toast.error("Gagal memuat data pengguna.", {
              position: 'top-center',
              autoClose: 3000,
              toastId: 'fetch-user-error'
            });
          }
        }

        for (const doc of snapshot.docs) {
          const commentData = doc.data();
          const userData = userMap[commentData.userId] || (commentData.userId === currentUser?.uid ? {
            displayName: sanitizeInput(currentUser?.displayName || currentUser?.email || "User"),
            photoURL: currentUser?.photoURL || null
          } : null);
          const authorName = userData ? userData.displayName : (commentData.author || "User");
          const photoURL = userData ? userData.photoURL : (commentData.photoURL || null);

          commentsData.push({
            id: doc.id,
            ...commentData,
            author: sanitizeInput(authorName),
            photoURL: photoURL,
            createdAt: commentData.createdAt,
            replies: [] // Initialize replies as empty
          });
        }

        const commentMap = {};
        commentsData.forEach(comment => {
          commentMap[comment.id] = { ...comment, replies: [] };
        });

        commentsData.forEach(comment => {
          if (comment.parentId && commentMap[comment.parentId]) {
            commentMap[comment.parentId].replies.push(commentMap[comment.id]);
          }
        });

        const rootComments = commentsData.filter(comment => !comment.parentId);
        setComments(rootComments);
        const totalComments = countAllComments(rootComments);
        if (onCommentCountChange) onCommentCountChange(totalComments);
        setLoading(false);

        if (currentUser) {
          const newReportedComments = {};
          await Promise.all(
            commentsData.map(async (comment) => {
              const reportQuery = query(
                collection(db, `news/${newsId}/comments/${comment.id}/reports`),
                where('reportedBy', '==', currentUser.uid)
              );
              try {
                const reportSnapshot = await getDocs(reportQuery);
                newReportedComments[comment.id] = !reportSnapshot.empty;
              } catch (error) {
                console.error('Error fetching report status for comment:', comment.id, error);
              }
            })
          );
          setReportedComments(newReportedComments);
        }
      }, (err) => {
        console.error("Error fetching comments:", err);
        setError("Gagal memuat komentar.");
        toast.error("Gagal memuat komentar.", {
          position: 'top-center',
          autoClose: 3000,
          toastId: 'comments-error'
        });
      });

      const commentsQueryLikes = query(
        collection(db, `news/${newsId}/comments`),
        orderBy("createdAt", "desc")
      );
      unsubscribeLikes = onSnapshot(commentsQueryLikes, (snapshot) => {
        const likesData = {};
        snapshot.docs.forEach(commentDoc => {
          const likesQuery = query(
            collection(db, `news/${newsId}/comments/${commentDoc.id}/likes`)
          );
          onSnapshot(likesQuery, (likesSnapshot) => {
            const count = likesSnapshot.size;
            const userLiked = currentUser ? !!likesSnapshot.docs.find(doc => doc.data().userId === currentUser.uid) : false;
            likesData[commentDoc.id] = { count, userLiked };
            setCommentLikes(prev => ({ ...prev, ...likesData }));
          }, (err) => {
            console.error("Error fetching likes:", err);
          });
        });
      }, (err) => {
        console.error("Error setting up likes listener:", err);
      });
    };

    if (propCurrentUser !== undefined) {
      setCurrentUser(propCurrentUser);
    } else {
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });
    }

    fetchCommentsData();

    return () => {
      unsubscribeComments();
      unsubscribeLikes();
      unsubscribeAuth && unsubscribeAuth();
    };
  }, [newsId, propCurrentUser, onCommentCountChange, sanitizeInput, countAllComments]);

  const checkSpamLimit = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastCommentTime;
    const requiredDelay = 5000; // 5 seconds

    if (timeDiff < requiredDelay) {
      const remainingTime = requiredDelay - timeDiff;
      setSpamWarning({ isOpen: true, remainingTime });
      return false;
    }
    return true;
  }, [lastCommentTime]);

  const handleSubmit = useCallback(async (e, parentId = null, replyToAuthor = null) => {
    e.preventDefault();
    const textToSubmit = sanitizeInput(parentId ? replyComment : comment);
    
    if (!currentUser) {
      setError("Silakan masuk untuk mengirim komentar.");
      toast.error("Silakan masuk untuk mengirim komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'submit-no-user'
      });
      return;
    }

    if (!checkSpamLimit()) {
      return;
    }

    setIsSubmitting(true);

    if (textToSubmit.length < 3 || textToSubmit.length > 500) {
      setError("Komentar harus antara 3 hingga 500 karakter.");
      toast.error("Komentar harus antara 3 hingga 500 karakter.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'invalid-length'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const commentsRef = collection(db, `news/${newsId}/comments`);
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const authorName = sanitizeInput(currentUser.displayName || userData.displayName || currentUser.email || "User");
      const photoURL = userData.photoURL || currentUser.photoURL || null;

      await runTransaction(db, async (transaction) => {
        const newsRef = doc(db, 'news', newsId);
        const newsDoc = await transaction.get(newsRef);
        if (!newsDoc.exists()) {
          throw new Error("News document does not exist");
        }

        const newCommentRef = doc(commentsRef);
        await transaction.set(newCommentRef, {
          text: textToSubmit,
          author: authorName,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          photoURL: photoURL,
          createdAt: serverTimestamp(),
          parentId: parentId || null,
          ...(parentId && { replyToAuthor: sanitizeInput(replyToAuthor) }),
          isEdited: false
        });

        const currentCount = newsDoc.data().comments || 0;
        transaction.update(newsRef, { comments: currentCount + 1 });
      });

      if (parentId) {
        setReplyComment("");
        setReplyTo(null);
      } else {
        setComment("");
      }
      setLastCommentTime(Date.now());
      setError(null);
      toast.success("Komentar berhasil dikirim.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'submit-success'
      });
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError("Gagal mengirim komentar.");
      toast.error("Gagal mengirim komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'submit-error'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, newsId, comment, replyComment, checkSpamLimit, sanitizeInput]);

  const findCommentById = useCallback((comments, id) => {
    for (const comment of comments) {
      if (comment.id === id) return comment;
      if (comment.replies && comment.replies.length > 0) {
        const found = findCommentById(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const handleEditClick = useCallback((commentId, commentText) => {
    if (!currentUser) {
      setError("Silakan masuk untuk mengedit komentar.");
      toast.error("Silakan masuk untuk mengedit komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'edit-no-user'
      });
      return;
    }

    const comment = findCommentById(comments, commentId);
    if (!comment) {
      setError("Komentar tidak ditemukan.");
      toast.error("Komentar tidak ditemukan.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'edit-not-found'
      });
      return;
    }

    const isAdmin = ADMIN_EMAILS.includes(currentUser.email);
    const isOwner = comment.userId === currentUser.uid;
    const withinTimeLimit = comment.createdAt && (Date.now() - comment.createdAt.toDate().getTime()) < 300000;

    if (!isAdmin && !isOwner) {
      setError("Anda tidak memiliki izin untuk mengedit komentar ini.");
      toast.error("Anda tidak memiliki izin untuk mengedit komentar ini.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'edit-no-permission'
      });
      return;
    }

    if (!withinTimeLimit) {
      setError("Batas waktu 5 menit untuk mengedit komentar telah berlalu.");
      toast.error("Batas waktu 5 menit untuk mengedit komentar telah berlalu.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'edit-time-limit'
      });
      return;
    }

    setEditModal({ isOpen: true, commentId, isSubmitting: false, commentText });
  }, [currentUser, comments, sanitizeInput]);

  const handleEditSubmit = useCallback(async (editedText) => {
    const { commentId } = editModal;
    if (!currentUser || !commentId) return;

    const comment = findCommentById(comments, commentId);
    if (!comment) {
      setError("Komentar tidak ditemukan.");
      toast.error("Komentar tidak ditemukan.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'edit-not-found'
      });
      return;
    }

    const sanitizedText = sanitizeInput(editedText);
    if (sanitizedText.length < 3 || sanitizedText.length > 500) {
      setError("Komentar harus antara 3 hingga 500 karakter.");
      toast.error("Komentar harus antara 3 hingga 500 karakter.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'edit-invalid-length'
      });
      return;
    }

    setEditModal(prev => ({ ...prev, isSubmitting: true }));

    try {
      const commentRef = doc(db, `news/${newsId}/comments`, commentId);
      await updateDoc(commentRef, {
        text: sanitizedText,
        isEdited: true,
        originalText: comment.originalText || comment.text
      });
      setEditModal({ isOpen: false, commentId: null, isSubmitting: false, commentText: '' });
      toast.success("Komentar berhasil diedit.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'edit-success'
      });
    } catch (err) {
      console.error("Error editing comment:", err);
      setError("Gagal mengedit komentar.");
      toast.error("Gagal mengedit komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'edit-error'
      });
      setEditModal(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [currentUser, newsId, editModal, comments, sanitizeInput]);

  const handleShowOriginalClick = useCallback((commentId, originalText) => {
    if (!originalText) {
      toast.warn("Komentar asli tidak tersedia.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'original-not-found'
      });
      return;
    }
    setOriginalCommentModal({ isOpen: true, originalText });
  }, []);

  const handleDeleteClick = useCallback((commentId) => {
    const comment = findCommentById(comments, commentId);
    if (comment) {
      setDeleteModal({ isOpen: true, commentId, isDeleting: false, commentText: sanitizeInput(comment.text) });
    }
  }, [comments, sanitizeInput]);

  const handleDeleteConfirm = useCallback(async () => {
    const { commentId } = deleteModal;
    if (!currentUser || !commentId) return;

    const comment = findCommentById(comments, commentId);
    if (!comment) {
      setError("Komentar tidak ditemukan.");
      toast.error("Komentar tidak ditemukan.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'delete-not-found'
      });
      return;
    }

    const isAdmin = ADMIN_EMAILS.includes(currentUser.email);
    const isOwner = comment.userId === currentUser.uid;

    if (!isAdmin && !isOwner) {
      setError("Anda tidak memiliki izin untuk menghapus komentar ini.");
      toast.error("Anda tidak memiliki izin untuk menghapus komentar ini.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'delete-no-permission'
      });
      return;
    }

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      const countNestedComments = (comment) => {
        let count = 1; // Count the comment itself
        if (comment.replies && comment.replies.length > 0) {
          for (const reply of comment.replies) {
            count += countNestedComments(reply);
          }
        }
        return count;
      };

      const totalDeleted = countNestedComments(comment);

      await runTransaction(db, async (transaction) => {
        const newsRef = doc(db, 'news', newsId);
        const newsDoc = await transaction.get(newsRef);
        if (!newsDoc.exists()) {
          throw new Error("News document does not exist");
        }

        const deleteNestedComments = async (commentId) => {
          const comment = findCommentById(comments, commentId);
          if (comment && comment.replies && comment.replies.length > 0) {
            for (const reply of comment.replies) {
              await deleteNestedComments(reply.id);
              transaction.delete(doc(db, `news/${newsId}/comments`, reply.id));
            }
          }
        };

        await deleteNestedComments(commentId);
        transaction.delete(doc(db, `news/${newsId}/comments`, commentId));

        const currentCount = newsDoc.data().comments || 0;
        transaction.update(newsRef, { comments: Math.max(0, currentCount - totalDeleted) });
      });

      setDeleteModal({ isOpen: false, commentId: null, isDeleting: false, commentText: '' });
      toast.success("Komentar berhasil dihapus.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'delete-success'
      });
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Gagal menghapus komentar.");
      toast.error("Gagal menghapus komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'delete-error'
      });
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  }, [currentUser, newsId, deleteModal, comments, sanitizeInput]);

  const handleReportClick = useCallback((commentId) => {
    if (!currentUser) {
      setError("Silakan masuk untuk melaporkan komentar.");
      toast.error("Silakan masuk untuk melaporkan komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'report-no-user'
      });
      return;
    }

    const comment = findCommentById(comments, commentId);
    if (!comment) {
      setError("Komentar tidak ditemukan.");
      toast.error("Komentar tidak ditemukan.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'report-not-found'
      });
      return;
    }

    if (reportedComments[commentId]) {
      toast.warn("Anda telah melaporkan komentar ini.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'report-duplicate'
      });
      return;
    }

    setReportModal({ isOpen: true, commentId, isSubmitting: false, commentText: sanitizeInput(comment.text) });
  }, [currentUser, comments, reportedComments, sanitizeInput]);

  const handleReportSubmit = useCallback(async (reason) => {
    const { commentId } = reportModal;
    if (!currentUser || !commentId) return;

    const comment = findCommentById(comments, commentId);
    if (!comment) {
      setError("Komentar tidak ditemukan.");
      toast.error("Komentar tidak ditemukan.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'report-not-found'
      });
      return;
    }

    const sanitizedReason = sanitizeInput(reason);

    setReportModal(prev => ({ ...prev, isSubmitting: true }));

    try {
      const newsDoc = await getDoc(doc(db, 'news', newsId));
      const newsData = newsDoc.exists() ? newsDoc.data() : {};

      const reportsRef = collection(db, 'reports');
      await addDoc(reportsRef, {
        reportedBy: currentUser.uid,
        reporterEmail: currentUser.email,
        reason: sanitizedReason,
        commentText: sanitizeInput(comment.text),
        commentId: commentId,
        newsId: newsId,
        title: newsData.judul || newsData.title || 'Unknown Title',
        newsSlug: newsData.slug || '',
        status: 'pending',
        timestamp: serverTimestamp()
      });

      const commentReportsRef = collection(db, `news/${newsId}/comments/${commentId}/reports`);
      await addDoc(commentReportsRef, {
        reportedBy: currentUser.uid,
        reporterEmail: currentUser.email,
        reason: sanitizedReason,
        commentText: sanitizeInput(comment.text),
        timestamp: serverTimestamp()
      });
      
      setReportedComments(prev => ({ ...prev, [commentId]: true }));
      setReportModal({ isOpen: false, commentId: null, isSubmitting: false, commentText: '' });
      toast.success("Laporan berhasil dikirim. Terima kasih!", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'report-success'
      });
    } catch (err) {
      console.error("Error reporting comment:", err);
      setError("Gagal mengirim laporan.");
      toast.error("Gagal mengirim laporan.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'report-error'
      });
      setReportModal(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [currentUser, newsId, reportModal, comments, sanitizeInput]);

  const handleLikeComment = useCallback(async (commentId) => {
    if (!currentUser) {
      setError("Silakan masuk untuk menyukai komentar.");
      toast.error("Silakan masuk untuk menyukai komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'like-no-user'
      });
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
      toast.error("Gagal menyukai komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'like-error'
      });
    }
  }, [currentUser, newsId, commentLikes]);

  const handleReplyClick = useCallback((commentId, author) => {
    if (!currentUser) {
      setError("Silakan masuk untuk membalas komentar.");
      toast.error("Silakan masuk untuk membalas komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'reply-no-user'
      });
      return;
    }

    setReplyTo({ id: commentId, author });
    setReplyComment("");
    setTimeout(() => {
      const commentRef = commentRefs.current[commentId];
      if (commentRef.current) {
        commentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, [currentUser, commentRefs]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Memuat komentar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
        Komentar ({countAllComments(comments)})
      </h2>

      {/* Comment Input Form */}
      <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-4 rounded-lg border border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 resize-none text-sm"
            rows="4"
            placeholder={currentUser ? "Tulis komentar Anda..." : "Silakan masuk untuk mengirim komentar"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            disabled={!currentUser || isSubmitting}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-500">{comment.length}/500</span>
            <button
              type="submit"
              disabled={!currentUser || isSubmitting || comment.trim() === ""}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                !currentUser || isSubmitting || comment.trim() === ""
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-600 text-white hover:bg-cyan-700'
              }`}
            >
              {isSubmitting ? "Mengirim..." : "Kirim Komentar"}
            </button>
          </div>
        </form>
      </div>

      {/* Modals */}
      <SpamWarningModal
        isOpen={spamWarning.isOpen}
        onClose={() => setSpamWarning({ isOpen: false, remainingTime: 0 })}
        remainingTime={spamWarning.remainingTime}
      />
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, commentId: null, isDeleting: false, commentText: '' })}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteModal.isDeleting}
        commentText={deleteModal.commentText}
      />
      <EditCommentModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, commentId: null, isSubmitting: false, commentText: '' })}
        onSubmit={handleEditSubmit}
        isSubmitting={editModal.isSubmitting}
        commentText={editModal.commentText}
      />
      <OriginalCommentModal
        isOpen={originalCommentModal.isOpen}
        onClose={() => setOriginalCommentModal({ isOpen: false, originalText: '' })}
        originalText={originalCommentModal.originalText}
      />
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, commentId: null, isSubmitting: false, commentText: '' })}
        onSubmit={handleReportSubmit}
        isSubmitting={reportModal.isSubmitting}
        commentText={reportModal.commentText}
      />

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl shadow-sm border border-slate-200">
          <p className="text-gray-600">Belum ada komentar. Jadilah yang pertama!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(cmt => (
            <Comment
              key={cmt.id}
              cmt={{ ...cmt, replies: cmt.replies || [] }}
              depth={0}
              currentUser={currentUser}
              commentLikes={commentLikes}
              reportedComments={reportedComments}
              isSubmitting={isSubmitting}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              replyComment={replyComment}
              setReplyComment={setReplyComment}
              handleSubmit={handleSubmit}
              handleLikeComment={handleLikeComment}
              handleReplyClick={handleReplyClick}
              handleDeleteClick={handleDeleteClick}
              handleReportClick={handleReportClick}
              handleEditClick={handleEditClick}
              handleShowOriginalClick={handleShowOriginalClick}
              handleToggleReplies={handleToggleReplies}
              areRepliesHidden={areRepliesHidden}
              setFocusedComment={setFocusedComment}
              focusedComment={focusedComment}
              sanitizeInput={sanitizeInput}
              formatTimeAgo={formatTimeAgo}
              commentRefs={commentRefs}
              comments={comments}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentBox;
