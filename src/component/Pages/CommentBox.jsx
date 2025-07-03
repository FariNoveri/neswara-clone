import React, { useEffect, useState, useCallback, useRef } from "react";
import { Reply, Heart, Trash2, MessageCircle, Flag, X, AlertTriangle, Edit2 } from "lucide-react";
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
  setDoc,
  getDocs,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { toast } from "react-toastify";
import { ADMIN_EMAILS } from "../config/Constants";
import DOMPurify from 'dompurify';

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
const useCommentAvatar = (cmt, logSecurityEvent) => {
  const placeholderRef = useRef(null);

  const handleError = (e) => {
    e.target.style.display = 'none';
    if (placeholderRef.current) {
      placeholderRef.current.style.display = 'none';
    }
    e.target.nextSibling.style.display = 'flex';
    logSecurityEvent('COMMENT_PHOTOURL_ERROR', {
      commentId: cmt.id,
      photoURL: cmt.photoURL,
      error: 'Failed to load profile image'
    });
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
const Comment = ({ cmt, depth = 0, currentUser, commentLikes, reportedComments, isSubmitting, replyTo, setReplyTo, replyComment, setReplyComment, handleSubmit, handleLikeComment, handleReplyClick, handleDeleteClick, handleReportClick, handleEditClick, handleShowOriginalClick, logSecurityEvent, setFocusedComment, focusedComment, sanitizeInput, formatTimeAgo, commentRefs, comments, toggleTooltip, visibleTooltips, toggleAllTooltips, areAllTooltipsHidden }) => {
  const isAdmin = ADMIN_EMAILS.includes(currentUser?.email || "");
  const isOwner = cmt.userId === currentUser?.uid;
  const canDelete = isAdmin || isOwner;
  const canEdit = (isAdmin || isOwner) && cmt.createdAt && (Date.now() - cmt.createdAt.toDate().getTime()) < 300000; // 5 minutes
  const likes = commentLikes[cmt.id] || { count: 0, userLiked: currentUser ? !!currentUser.uid : false };
  const isReported = reportedComments[cmt.id] || false;
  const { renderAvatar } = useCommentAvatar(cmt, logSecurityEvent);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const commentRef = useRef(null);

  // Register this comment's ref
  useEffect(() => {
    commentRefs.current[cmt.id] = commentRef;
  }, [cmt.id, commentRefs]);

  // Calculate reply counts per user
  const replyCounts = cmt.replies?.reduce((acc, reply) => {
    const author = sanitizeInput(reply.author || "User");
    acc[author] = (acc[author] || 0) + 1;
    return acc;
  }, {}) || {};

  // Determine reply indicator with specific user check
  const replyIndicator = cmt.parentId ? (
    cmt.replyToAuthor === (currentUser?.displayName || currentUser?.email) 
      ? "membalas komentar Anda" 
      : `membalas komentar ${sanitizeInput(cmt.replyToAuthor || "user12345")}`
  ) : null;

  return (
    <div key={cmt.id} className={`space-y-4`} ref={commentRef}>
      <AdminInfoModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
      <div
        className={`group relative bg-white rounded-xl p-6 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md hover:border-cyan-300 ${focusedComment === cmt.id ? 'ring-2 ring-cyan-300' : ''} ${depth > 0 ? 'ml-8 border-l-4 border-cyan-200' : ''}`}
        onMouseEnter={() => setFocusedComment(cmt.id)}
        onMouseLeave={() => setFocusedComment(null)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {renderAvatar()}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-800">{sanitizeInput(cmt.author || "User")}</span>
                {replyIndicator && <span className="text-xs text-slate-500">({replyIndicator})</span>}
                {ADMIN_EMAILS.includes(cmt.userEmail) && (
                  <button
                    onClick={() => setIsAdminModalOpen(true)}
                    className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full hover:from-purple-600 hover:to-pink-600 transition-colors"
                    aria-label="Lihat informasi admin"
                  >
                    Admin
                  </button>
                )}
                {isOwner && (
                  <span className="text-xs bg-slate-400 text-white px-2 py-0.5 rounded-full">(You)</span>
                )}
              </div>
              <span className="text-xs text-slate-500">{formatTimeAgo(cmt.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUser && !isOwner && (
              <button
                onClick={() => handleReportClick(cmt.id)}
                className={`text-orange-500 hover:text-orange-700 hover:bg-orange-50 p-2 rounded-lg transition-colors ${isReported ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Laporkan komentar"
                disabled={isReported}
              >
                <Flag className={`w-4 h-4 ${isReported ? 'fill-current' : ''}`} />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => handleDeleteClick(cmt.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                title="Hapus komentar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => handleEditClick(cmt.id, cmt.text)}
                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                title="Edit komentar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="mb-4">
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
            {sanitizeInput(cmt.text)}
            {cmt.isEdited && (
              <button
                onClick={() => handleShowOriginalClick(cmt.id, cmt.originalText)}
                className="text-xs text-slate-500 italic ml-2 hover:text-slate-700"
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
              className={`flex items-center gap-1 text-sm transition-colors ${likes.userLiked ? 'text-red-500 font-semibold' : 'text-slate-500 hover:text-red-500'}`}
              disabled={isSubmitting}
            >
              <Heart className={`w-4 h-4 ${likes.userLiked ? 'fill-current' : ''}`} />
              <span>{likes.count}</span>
            </button>
            <button
              onClick={() => handleReplyClick(cmt.id, cmt.author)}
              className={`flex items-center gap-1 text-sm transition-colors ${currentUser ? 'text-slate-500 hover:text-cyan-600' : 'text-slate-400 cursor-not-allowed'}`}
              disabled={!currentUser}
            >
              <Reply className="w-4 h-4" />
              <span>Balas</span>
            </button>
            {cmt.replies?.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => toggleTooltip(cmt.id)}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-cyan-600"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{areAllTooltipsHidden ? "Show Total Balasan" : "Total Balasan"}</span>
                </button>
                {visibleTooltips[cmt.id] && !areAllTooltipsHidden && (
                  <div className="absolute right-0 bottom-full mb-2 p-3 bg-slate-800 text-white rounded-lg shadow-lg z-10 w-48 transition-all duration-200 animate-tooltipFadeIn">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold">Jumlah Balasan</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAllTooltips()}
                          className="text-xs bg-slate-600 hover:bg-slate-700 text-white px-2 py-0.5 rounded-full"
                          title="Sembunyikan Semua"
                        >
                          Hide
                        </button>
                        <button
                          onClick={() => toggleTooltip(cmt.id)}
                          className="text-xs bg-slate-600 hover:bg-slate-700 text-white px-2 py-0.5 rounded-full"
                          title="Tutup"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      {Object.entries(replyCounts).map(([author, count]) => (
                        <div key={author}>{author}: {count}x</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {replyTo && replyTo.id === cmt.id && (
          <div
            className="mt-4 p-4 bg-slate-50 rounded-lg transform transition-all duration-300 scale-95 opacity-0 animate-[scaleIn_0.3s_ease-out_forwards]"
          >
            <div className="space-y-3">
              <textarea
                className="w-full p-3 rounded-lg border border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 resize-none text-sm"
                rows="3"
                placeholder={currentUser ? `Balas ${sanitizeInput(cmt.author || "User")}...` : "Silakan masuk untuk membalas komentar"}
                value={replyComment}
                onChange={(e) => setReplyComment(e.target.value)}
                maxLength={500}
                disabled={!currentUser || isSubmitting}
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
                    disabled={!currentUser || isSubmitting || replyComment.trim() === ""}
                    className={`px-4 py-1 rounded-lg text-sm font-medium transition-all ${!currentUser || isSubmitting || replyComment.trim() === "" ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}
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
              logSecurityEvent={logSecurityEvent}
              setFocusedComment={setFocusedComment}
              focusedComment={focusedComment}
              sanitizeInput={sanitizeInput}
              formatTimeAgo={formatTimeAgo}
              commentRefs={commentRefs}
              comments={comments}
              toggleTooltip={toggleTooltip}
              visibleTooltips={visibleTooltips}
              toggleAllTooltips={toggleAllTooltips}
              areAllTooltipsHidden={areAllTooltipsHidden}
            />
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [reportedComments, setReportedComments] = useState({});
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
  const [visibleTooltips, setVisibleTooltips] = useState(() => {
    try {
      const saved = localStorage.getItem(`tooltipState_${newsId}`);
      return saved ? JSON.parse(saved) : {};
    } catch (err) {
      console.error("Error loading tooltip state from localStorage:", err);
      return {};
    }
  });
  const [areAllTooltipsHidden, setAreAllTooltipsHidden] = useState(() => {
    try {
      const saved = localStorage.getItem(`tooltipHiddenState_${newsId}`);
      return saved ? JSON.parse(saved) : false;
    } catch (err) {
      console.error("Error loading tooltip hidden state from localStorage:", err);
      return false;
    }
  });
  const commentRefs = useRef({});

  // Save tooltip states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`tooltipState_${newsId}`, JSON.stringify(visibleTooltips));
    } catch (err) {
      console.error("Error saving tooltip state to localStorage:", err);
    }
  }, [visibleTooltips, newsId]);

  useEffect(() => {
    try {
      localStorage.setItem(`tooltipHiddenState_${newsId}`, JSON.stringify(areAllTooltipsHidden));
    } catch (err) {
      console.error("Error saving tooltip hidden state to localStorage:", err);
    }
  }, [areAllTooltipsHidden, newsId]);

  // Input sanitization
  const sanitizeInput = (input) => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    }).trim();
  };

  // Security logging
  const logSecurityEvent = async (action, details) => {
    try {
      await addDoc(collection(db, 'security_logs'), {
        action,
        userEmail: currentUser?.email || 'anonymous',
        details,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        ipAddress: 'N/A'
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  // Function to count all comments including replies
  const countAllComments = (comments) => {
    let total = comments.length;
    comments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        total += countAllComments(comment.replies);
      }
    });
    return total;
  };

  // Toggle individual tooltip visibility
  const toggleTooltip = (commentId) => {
    setVisibleTooltips(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
    // Only set areAllTooltipsHidden to false if no other tooltips are visible
    if (areAllTooltipsHidden) {
      setAreAllTooltipsHidden(false);
    }
  };

  // Hide all tooltips
  const toggleAllTooltips = () => {
    setVisibleTooltips({});
    setAreAllTooltipsHidden(true);
  };

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
        createdAt: doc.data().createdAt,
        replies: doc.data().replies || [] // Default to empty array if replies is undefined
      }));
      
      // Build nested replies structure
      const commentMap = {};
      commentsData.forEach(comment => {
        commentMap[comment.id] = { ...comment, replies: comment.replies || [] };
      });
      commentsData.forEach(comment => {
        if (comment.parentId && commentMap[comment.parentId]) {
          commentMap[comment.parentId].replies.push(commentMap[comment.id]);
        }
      });

      const rootComments = commentsData.filter(comment => !comment.parentId);
      console.log("Root comments after structuring:", rootComments); // Debug root comments
      setComments(rootComments);
      if (onCommentCountChange) onCommentCountChange(countAllComments(rootComments));
      setLoading(false);

      if (currentUser) {
        const newReportedComments = {};
        Promise.all(
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
              logSecurityEvent('FETCH_REPORT_STATUS_ERROR', { commentId: comment.id, error: error.message });
            }
          })
        ).then(() => {
          setReportedComments(newReportedComments);
          console.log('Reported comments updated:', newReportedComments);
        }).catch((err) => {
          console.error("Error fetching report status:", err);
          logSecurityEvent('FETCH_REPORT_STATUS_BATCH_ERROR', { error: err.message });
        });
      }
    }, (err) => {
      console.error("Error fetching comments:", err);
      setError("Gagal memuat komentar.");
      toast.error("Gagal memuat komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'comments-error'
      });
      logSecurityEvent('FETCH_COMMENTS_ERROR', { error: err.message });
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
          logSecurityEvent('FETCH_LIKES_ERROR', { commentId: commentDoc.id, error: err.message });
        });
      });
      setCommentLikes(likesData);
    }, (err) => {
      console.error("Error setting up likes listener:", err);
      logSecurityEvent('SETUP_LIKES_LISTENER_ERROR', { error: err.message });
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

  const checkSpamLimit = () => {
    const now = Date.now();
    const timeDiff = now - lastCommentTime;
    const requiredDelay = 5000; // 5 seconds

    if (timeDiff < requiredDelay) {
      const remainingTime = requiredDelay - timeDiff;
      setSpamWarning({ isOpen: true, remainingTime });
      logSecurityEvent('SPAM_LIMIT_EXCEEDED', { remainingTime, newsId });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e, parentId = null, replyToAuthor = null) => {
    e.preventDefault();
    const textToSubmit = sanitizeInput(parentId ? replyComment : comment);
    
    if (!currentUser) {
      setError("Silakan masuk untuk mengirim komentar.");
      toast.error("Silakan masuk untuk mengirim komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'submit-no-user'
      });
      logSecurityEvent('UNAUTHENTICATED_SUBMIT_ATTEMPT', { newsId, parentId });
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
      logSecurityEvent('INVALID_COMMENT_LENGTH', { length: textToSubmit.length, newsId });
      return;
    }

    try {
      const commentsRef = collection(db, `news/${newsId}/comments`);
      await addDoc(commentsRef, {
        text: textToSubmit,
        author: sanitizeInput(currentUser.displayName || currentUser.email || "User"),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        photoURL: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        parentId: parentId || null,
        ...(parentId && { replyToAuthor: sanitizeInput(replyToAuthor) }),
        isEdited: false
      });

      if (parentId) {
        setReplyComment("");
        setReplyTo(null);
      } else {
        setComment("");
      }
      setLastCommentTime(Date.now());
      setError(null);
      logSecurityEvent('COMMENT_SUBMITTED', { newsId, parentId, textLength: textToSubmit.length });
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError("Gagal mengirim komentar.");
      toast.error("Gagal mengirim komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'submit-error'
      });
      logSecurityEvent('COMMENT_SUBMIT_ERROR', { newsId, parentId, error: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (commentId, commentText) => {
    if (!currentUser) {
      setError("Silakan masuk untuk mengedit komentar.");
      toast.error("Silakan masuk untuk mengedit komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'edit-no-user'
      });
      logSecurityEvent('UNAUTHENTICATED_EDIT_ATTEMPT', { commentId });
      return;
    }

    const comment = comments.find(c => c.id === commentId);
    if (!comment) {
      setError("Komentar tidak ditemukan.");
      toast.error("Komentar tidak ditemukan.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'edit-not-found'
      });
      logSecurityEvent('EDIT_NONEXISTENT_COMMENT', { commentId });
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
        DOT
      });
      logSecurityEvent('UNAUTHORIZED_EDIT_ATTEMPT', { commentId, userId: currentUser.uid, commentUserId: comment.userId });
      return;
    }

    if (!withinTimeLimit) {
      setError("Batas waktu 5 menit untuk mengedit komentar telah berlalu.");
      toast.error("Batas waktu 5 menit untuk mengedit komentar telah berlalu.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'edit-time-limit'
      });
      logSecurityEvent('EDIT_TIME_LIMIT_EXCEEDED', { commentId });
      return;
    }

    setEditModal({ isOpen: true, commentId, isSubmitting: false, commentText });
  };

  const handleEditSubmit = async (editedText) => {
    const { commentId } = editModal;
    if (!currentUser || !commentId) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) {
      setError("Komentar tidak ditemukan.");
      toast.error("Komentar tidak ditemukan.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'edit-not-found'
      });
      logSecurityEvent('EDIT_NONEXISTENT_COMMENT', { commentId });
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
      logSecurityEvent('INVALID_EDIT_LENGTH', { length: sanitizedText.length, commentId });
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
      logSecurityEvent('COMMENT_EDITED', { commentId, originalText: comment.text, newText: sanitizedText });
    } catch (err) {
      console.error("Error editing comment:", err);
      setError("Gagal mengedit komentar.");
      toast.error("Gagal mengedit komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'edit-error'
      });
      logSecurityEvent('EDIT_COMMENT_ERROR', { commentId, error: err.message });
      setEditModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleShowOriginalClick = (commentId, originalText) => {
    if (!originalText) {
      toast.warn("Komentar asli tidak tersedia.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'original-not-found'
      });
      return;
    }
    setOriginalCommentModal({ isOpen: true, originalText });
  };

  const handleDeleteClick = (commentId) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setDeleteModal({ isOpen: true, commentId, isDeleting: false, commentText: sanitizeInput(comment.text) });
    }
  };

  const handleDeleteConfirm = async () => {
    const { commentId } = deleteModal;
    if (!currentUser || !commentId) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) {
      setError("Komentar tidak ditemukan.");
      toast.error("Komentar tidak ditemukan.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'delete-not-found'
      });
      logSecurityEvent('DELETE_NONEXISTENT_COMMENT', { commentId });
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
      logSecurityEvent('UNAUTHORIZED_DELETE_ATTEMPT', { 
        commentId, 
        userId: currentUser.uid, 
        commentUserId: comment.userId 
      });
      return;
    }

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      await deleteDoc(doc(db, `news/${newsId}/comments`, commentId));
      // Remove nested replies
      const replies = comments.filter(c => c.parentId === commentId);
      for (const reply of replies) {
        await deleteDoc(doc(db, `news/${newsId}/comments`, reply.id));
      }
      setDeleteModal({ isOpen: false, commentId: null, isDeleting: false, commentText: '' });
      toast.success("Komentar berhasil dihapus.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'delete-success'
      });
      logSecurityEvent('COMMENT_DELETED', { 
        commentId, 
        isAdmin, 
        commentText: comment.text 
      });
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Gagal menghapus komentar.");
      toast.error("Gagal menghapus komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'delete-error'
      });
      logSecurityEvent('DELETE_COMMENT_ERROR', { commentId, error: err.message });
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleReportClick = (commentId) => {
    if (!currentUser) {
      setError("Silakan masuk untuk melaporkan komentar.");
      toast.error("Silakan masuk untuk melaporkan komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'report-no-user'
      });
      logSecurityEvent('UNAUTHENTICATED_REPORT_ATTEMPT', { commentId });
      return;
    }

    const comment = comments.find(c => c.id === commentId);
    if (!comment) {
      setError("Komentar tidak ditemukan.");
      toast.error("Komentar tidak ditemukan.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'report-not-found'
      });
      logSecurityEvent('REPORT_NONEXISTENT_COMMENT', { commentId });
      return;
    }

    if (reportedComments[commentId]) {
      toast.warn("Anda telah melaporkan komentar ini.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'report-duplicate'
      });
      logSecurityEvent('DUPLICATE_REPORT_ATTEMPT', { commentId });
      return;
    }

    setReportModal({ isOpen: true, commentId, isSubmitting: false, commentText: sanitizeInput(comment.text) });
  };

  const handleReportSubmit = async (reason) => {
    const { commentId } = reportModal;
    if (!currentUser || !commentId) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) {
      setError("Komentar tidak ditemukan.");
      toast.error("Komentar tidak ditemukan.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'report-not-found'
      });
      logSecurityEvent('REPORT_NONEXISTENT_COMMENT', { commentId });
      return;
    }

    const sanitizedReason = sanitizeInput(reason);

    setReportModal(prev => ({ ...prev, isSubmitting: true }));

    try {
      // Fetch news document to get title and slug
      const newsDoc = await getDoc(doc(db, 'news', newsId));
      const newsData = newsDoc.exists() ? newsDoc.data() : {};

      // Store report in top-level reports collection
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

      // Optionally, keep the comment-specific report for tracking
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
      logSecurityEvent('REPORT_SUBMITTED', { 
        commentId, 
        reason: sanitizedReason, 
        commentText: comment.text,
        newsId
      });
    } catch (err) {
      console.error("Error reporting comment:", err);
      setError("Gagal mengirim laporan.");
      toast.error("Gagal mengirim laporan.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'report-error'
      });
      logSecurityEvent('REPORT_SUBMIT_ERROR', { commentId, newsId, error: err.message });
      setReportModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!currentUser) {
      setError("Silakan masuk untuk menyukai komentar.");
      toast.error("Silakan masuk untuk menyukai komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'like-no-user'
      });
      logSecurityEvent('UNAUTHENTICATED_LIKE_ATTEMPT', { commentId });
      return;
    }

    const likes = commentLikes[commentId] || { count: 0, userLiked: false };
    const likeRef = doc(db, `news/${newsId}/comments/${commentId}/likes`, currentUser.uid);

    try {
      if (likes.userLiked) {
        await deleteDoc(likeRef);
        logSecurityEvent('LIKE_REMOVED', { commentId });
      } else {
        await setDoc(likeRef, { userId: currentUser.uid, timestamp: serverTimestamp() });
        logSecurityEvent('LIKE_ADDED', { commentId });
      }
    } catch (err) {
      console.error("Error liking comment:", err);
      setError("Gagal menyukai komentar.");
      toast.error("Gagal menyukai komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'like-error'
      });
      logSecurityEvent('LIKE_ERROR', { commentId, error: err.message });
    }
  };

  const handleReplyClick = (commentId, author) => {
    if (!currentUser) {
      setError("Silakan masuk untuk membalas komentar.");
      toast.error("Silakan masuk untuk membalas komentar.", {
        position: 'top-center',
        autoClose: 3000,
        toastId: 'reply-no-user'
      });
      logSecurityEvent('UNAUTHENTICATED_REPLY_ATTEMPT', { commentId });
      return;
    }
    setReplyTo(replyTo?.id === commentId ? null : { id: commentId, author: author || "User" });
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
      commentMap[comment.id] = { ...comment, replies: comment.replies || [] };
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

  const organizedComments = organizeComments(comments);
  const canComment = !!currentUser;

  return (
    <div className="space-y-6">
      <style>
        {`
          .toastify {
            z-index: 100001 !important;
            position: fixed !important;
            top: 10px !important;
            width: 320px !important;
            font-family: Arial, sans-serif !important;
          }
          .Toastify__toast--success {
            background: #06b6d4 !important;
            color: white !important;
          }
          .Toastify__toast--error {
            background: #ef4444 !important;
            color: white !important;
          }
          .Toastify__toast--warn {
            background: #f59e0b !important;
            color: white !important;
          }
          .Toastify__toast--info {
            background: #3b82f6 !important;
            color: white !important;
          }
          @keyframes scaleIn {
            from {
              transform: scale(0.95);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          @keyframes tooltipFadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes tooltipFadeOut {
            from {
              opacity: 1;
              transform: scale(1);
            }
            to {
              opacity: 0;
              transform: scale(0.95);
            }
          }
          .animate-tooltipFadeIn {
            animation: tooltipFadeIn 0.2s ease-out forwards;
          }
          .animate-tooltipFadeOut {
            animation: tooltipFadeOut 0.2s ease-out forwards;
          }
        `}
      </style>
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
      <div className="flex items-center gap-3">
        <MessageCircle className="w-6 h-6 text-cyan-600" />
        <h3 className="text-xl font-bold text-slate-800">Komentar ({countAllComments(comments)})</h3>
      </div>
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 className="font-bold text-blue-800 mb-2">Rules Berkomentar</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>Harap gunakan bahasa yang sopan</p>
          <p>Jangan spam, tunggu 5 detik antara komentar</p>
          <p>Gunakan fitur laporkan untuk konten yang tidak pantas</p>
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
            placeholder={canComment ? "Tulis komentar Anda..." : "Silakan masuk untuk mengirim komentar"}
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
          organizedComments.map(comment => (
            <Comment
              key={comment.id}
              cmt={{ ...comment, replies: comment.replies || [] }}
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
              logSecurityEvent={logSecurityEvent}
              setFocusedComment={setFocusedComment}
              focusedComment={focusedComment}
              sanitizeInput={sanitizeInput}
              formatTimeAgo={formatTimeAgo}
              commentRefs={commentRefs}
              comments={comments}
              toggleTooltip={toggleTooltip}
              visibleTooltips={visibleTooltips}
              toggleAllTooltips={toggleAllTooltips}
              areAllTooltipsHidden={areAllTooltipsHidden}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentBox;