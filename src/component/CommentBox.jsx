import React, { useEffect, useState } from "react";
import { db } from "../firebaseconfig";
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

const CommentBox = ({ newsId, currentUser }) => {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastCommentTime, setLastCommentTime] = useState(0);

  useEffect(() => {
    if (!newsId) return;

    const q = query(
      collection(db, "news", newsId, "comments"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [newsId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = comment.trim();

    if (!currentUser || typeof currentUser !== "object") {
      alert("Silakan login terlebih dahulu untuk mengirim komentar.");
      return;
    }

    if (trimmed.length < 3 || trimmed.length > 500) {
      alert("Komentar harus antara 3 hingga 500 karakter.");
      return;
    }

    const now = Date.now();
    if (now - lastCommentTime < 3000) {
      alert("Tunggu beberapa detik sebelum mengirim komentar lagi.");
      return;
    }

    try {
      await addDoc(collection(db, "news", newsId, "comments"), {
        text: trimmed.slice(0, 500),
        author: currentUser.displayName || currentUser.email || "User",
        createdAt: serverTimestamp(),
      });
      setComment("");
      setLastCommentTime(now);
    } catch (err) {
      console.error("Gagal mengirim komentar:", err);
    }
  };

  const handleDelete = async (commentId) => {
    if (!currentUser) {
      alert("Silakan login untuk menghapus komentar.");
      return;
    }
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const isAdmin = currentUser.isAdmin === true; // Pastikan true explicitly

    if (isAdmin || comment.author === (currentUser.displayName || currentUser.email)) {
      if (window.confirm("Yakin ingin menghapus komentar ini?")) {
        try {
          await deleteDoc(doc(db, "news", newsId, "comments", commentId));
          console.log("Komentar berhasil dihapus:", commentId);
        } catch (err) {
          console.error("Gagal menghapus komentar:", err);
        }
      }
    } else {
      alert("Anda tidak memiliki izin untuk menghapus komentar ini.");
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

  return (
    <div className="mt-10">
      <h3 className="text-xl font-bold mb-4 text-orange-400">Komentar</h3>

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          className="w-full p-3 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          rows="3"
          placeholder={
            currentUser ? "Tulis komentar..." : "Login untuk menulis komentar"
          }
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={!currentUser || typeof currentUser !== "object"}
        ></textarea>
        <button
          type="submit"
          disabled={
            !currentUser ||
            typeof currentUser !== "object" ||
            comment.trim() === ""
          }
          className={`mt-2 px-4 py-2 rounded text-white font-semibold transition-colors ${
            !currentUser || typeof currentUser !== "object"
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          {currentUser ? "Kirim" : "Harus Login"}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-400">Memuat komentar...</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-500">Belum ada komentar.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((cmt) => (
            <li key={cmt.id} className="bg-gray-800 p-4 rounded flex justify-between items-start">
              <div>
                <div className="flex items-center mb-1">
                  <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full mr-2">
                    {(cmt.author || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {cmt.author || "User"}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {formatTimeAgo(cmt.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-200 break-words whitespace-pre-wrap">
                  {cmt.text}
                </p>
              </div>
              {currentUser && (currentUser.isAdmin === true || cmt.author === (currentUser.displayName || currentUser.email)) && (
                <button
                  onClick={() => handleDelete(cmt.id)}
                  className="ml-4 text-red-400 hover:text-red-600"
                >
                  Hapus
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CommentBox;
