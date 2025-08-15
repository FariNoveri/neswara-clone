import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebaseconfig.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Trash2, AlertCircle, Search, X, Filter, Calendar, MessageSquare, Eye, ArrowLeft } from "lucide-react";
import DOMPurify from "dompurify";

const CommentHistory = () => {
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [filteredComments, setFilteredComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    searchText: "",
    dateFrom: "",
    dateTo: "",
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, newsId: "", commentId: "" });
  const [originalCommentModal, setOriginalCommentModal] = useState({ isOpen: false, originalText: "", commentId: "" });
  const navigate = useNavigate();

  // Sanitize input to prevent XSS
  const sanitizeInput = (input) => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    }).trim();
  };

  // Fetch user's comments from all news articles
  useEffect(() => {
    let unsubscribe;

    const fetchComments = async () => {
      setLoading(true);
      if (!user) return;

      const newsQuery = query(collection(db, "news"));
      const unsubscribeArray = [];

      onSnapshot(newsQuery, async (newsSnapshot) => {
        let allComments = [];
        const promises = newsSnapshot.docs.map(async (newsDoc) => {
          const newsData = newsDoc.data();
          const commentsQuery = query(
            collection(db, "news", newsDoc.id, "comments"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
          return new Promise((resolve) => {
            const unsubscribeComments = onSnapshot(
              commentsQuery,
              async (commentsSnapshot) => {
                try {
                  const commentsData = await Promise.all(
                    commentsSnapshot.docs.map(async (commentDoc) => {
                      const commentData = { id: commentDoc.id, ...commentDoc.data(), newsId: newsDoc.id };
                      let displayName = commentData.author || user.displayName || "Unknown";
                      const userDoc = await getDoc(doc(db, "users", user.uid));
                      if (userDoc.exists()) {
                        displayName = userDoc.data().userName || displayName;
                      }
                      return {
                        ...commentData,
                        displayName,
                        newsSlug: newsData.slug || newsDoc.id,
                        isEdited: commentData.isEdited || false,
                        replyToAuthor: commentData.replyToAuthor || null,
                        originalText: commentData.originalText || null,
                      };
                    })
                  );
                  resolve(commentsData);
                } catch (error) {
                  console.error(`Error fetching comments for news ${newsDoc.id}:`, error);
                  setError(`Failed to load comments for news ${newsDoc.id}: ${error.message}`);
                  resolve([]);
                }
              },
              (error) => {
                console.error(`Snapshot error for news ${newsDoc.id}:`, error);
                setError(`Failed to set up listener for comments for news ${newsDoc.id}: ${error.message}`);
                resolve([]);
              }
            );
            unsubscribeArray.push(unsubscribeComments);
          });
        });

        try {
          const results = await Promise.all(promises);
          results.forEach((commentsData) => (allComments = [...allComments, ...commentsData]));
          setComments(allComments);
          setFilteredComments(allComments);
          setLoading(false);
        } catch (error) {
          console.error("Error in Promise.all:", error);
          setError("Failed to load comment history: " + error.message);
          setLoading(false);
        }
      }, (error) => {
        console.error("Error subscribing to news:", error);
        setError("Failed to set up listener for news: " + error.message);
        setLoading(false);
      });

      unsubscribe = () => {
        unsubscribeArray.forEach((unsub) => unsub());
      };
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchComments();
      } else {
        setError("No user logged in. Redirecting to login page.");
        setLoading(false);
        navigate("/login"); // Fixed: Corrected navigation path
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      unsubscribeAuth();
    };
  }, [navigate, user]);

  // Apply filters to comments
  useEffect(() => {
    let filtered = [...comments];

    if (filters.searchText) {
      filtered = filtered.filter((comment) =>
        (comment.text || "").toLowerCase().includes(filters.searchText.toLowerCase()) ||
        (comment.replyToAuthor || "").toLowerCase().includes(filters.searchText.toLowerCase()) ||
        (comment.originalText || "").toLowerCase().includes(filters.searchText.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((comment) => comment.createdAt && comment.createdAt.toDate() >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((comment) => comment.createdAt && comment.createdAt.toDate() <= toDate);
    }

    setFilteredComments(filtered);
  }, [filters, comments]);

  // Handle filter input changes
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      searchText: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  // Handle comment deletion
  const handleDelete = async (newsId, commentId) => {
    setDeleteModal({ isOpen: true, newsId, commentId });
  };

  const confirmDelete = async () => {
    const { newsId, commentId } = deleteModal;
    try {
      await deleteDoc(doc(db, "news", newsId, "comments", commentId));
      toast.success("Comment deleted successfully.", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Failed to delete comment:", error);
      setError("Failed to delete comment: " + error.message);
      toast.error("Failed to delete comment: " + error.message, {
        position: "top-center",
        autoClose: 5000,
      });
    } finally {
      setDeleteModal({ isOpen: false, newsId: "", commentId: "" });
    }
  };

  // Show original comment text
  const handleShowOriginalClick = (commentId, originalText) => {
    if (!originalText) {
      toast.warn("Original comment text not available.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    setOriginalCommentModal({ isOpen: true, originalText, commentId });
  };

  // Delete modal component
  const DeleteModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20 shadow-2xl transform animate-scaleIn">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Delete Comment</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors duration-200 hover:rotate-90 transform"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-white/80 mb-8 leading-relaxed">
            Are you sure you want to delete this comment? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200 font-medium hover:scale-105 border border-white/20"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium hover:scale-105 transform shadow-lg"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Original comment modal component
  const OriginalCommentModal = ({ isOpen, onClose, originalText }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20 shadow-2xl transform animate-scaleIn">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Original Comment</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors duration-200 hover:rotate-90 transform"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-white/80 bg-white/5 p-4 rounded-lg border border-white/10 mb-8 leading-relaxed">
            {sanitizeInput(originalText || "Original comment text not available.")}
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 font-medium hover:scale-105 transform shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-white/80">Loading comment history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-spin" style={{ animationDuration: "20s" }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 max-w-4xl py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/profile")}
            className="group flex items-center text-white/70 hover:text-white transition-all duration-300 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 hover:border-white/20"
          >
            <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Profile
          </button>
          <div className="text-right">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Comment History
            </h1>
            <p className="text-white/60 mt-1">View and manage your comments</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 px-6 py-4 rounded-2xl mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
              {error}
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:border-white/30 transition-all duration-500 animate-slideUp">
          <div className="flex items-center space-x-3 mb-6">
            <Filter className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Filter & Search</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 transition-colors duration-200 group-focus-within:text-purple-400" />
              <input
                type="text"
                value={filters.searchText}
                onChange={(e) => handleFilterChange("searchText", e.target.value)}
                placeholder="Search comments or replies..."
                className="pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 w-full"
              />
            </div>

            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 transition-colors duration-200 group-focus-within:text-purple-400" />
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 w-full"
              />
            </div>

            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 transition-colors duration-200 group-focus-within:text-purple-400" />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 w-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-4 mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center space-x-2 text-sm text-white/60">
              <MessageSquare className="w-4 h-4" />
              <span>Showing {filteredComments.length} of {comments.length} comments</span>
            </div>

            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:shadow-xl"
            >
              <X className="w-5 h-5" />
              <span>Clear All Filters</span>
            </button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 hover:border-white/30 transition-all duration-500 overflow-hidden mt-8 animate-slideUp">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Comment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    News
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-purple-400/20 rounded-full animate-spin"></div>
                          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredComments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-white/60">
                      {comments.length === 0 ? "No comments made yet." : "No comments match the filters."}
                    </td>
                  </tr>
                ) : (
                  filteredComments.map((comment, index) => (
                    <tr
                      key={comment.id}
                      className={`hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-10`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <td className="px-6 py-4 text-sm text-white/80">{sanitizeInput(comment.text)}</td>
                      <td className="px-6 py-4 text-sm text-white/60">
                        <div className="flex flex-col space-y-1">
                          <span className={`flex items-center ${comment.isEdited ? "text-purple-400" : "text-white/50"}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            {comment.isEdited ? "Edited" : "Not Edited"}
                            {comment.isEdited && (
                              <button
                                onClick={() => handleShowOriginalClick(comment.id, comment.originalText)}
                                className="ml-2 text-xs text-purple-300 hover:text-purple-400 hover:underline"
                                title="View original comment"
                              >
                                View Original
                              </button>
                            )}
                          </span>
                          <span>
                            {comment.parentId ? (
                              <span className="text-cyan-400">
                                Reply to {sanitizeInput(comment.replyToAuthor || "Unknown")}
                              </span>
                            ) : (
                              <span className="text-white/50">No Reply</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/60">
                        {comment.createdAt?.toDate().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }) || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          to={`/berita/${comment.newsSlug}`}
                          className="text-purple-300 hover:text-purple-400 hover:underline"
                        >
                          {comment.newsSlug}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleDelete(comment.newsId, comment.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200 group"
                          title="Delete comment"
                        >
                          <Trash2 className="w-5 h-5 text-white/60 group-hover:text-red-400 transition-colors" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DeleteModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, newsId: "", commentId: "" })}
          onConfirm={confirmDelete}
        />
        <OriginalCommentModal
          isOpen={originalCommentModal.isOpen}
          onClose={() => setOriginalCommentModal({ isOpen: false, originalText: "", commentId: "" })}
          originalText={originalCommentModal.originalText}
        />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slideRight {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-in {
          animation-fill-mode: forwards;
        }

        /* Table responsiveness */
        @media (max-width: 768px) {
          table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
          }

          th,
          td {
            min-width: 120px;
          }
        }
      `}</style>
    </div>
  );
};

export default CommentHistory;
