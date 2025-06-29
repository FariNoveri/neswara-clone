import React, { useState, useEffect, useCallback } from "react";
import { db } from "../../firebaseconfig";
import { doc, getDoc, setDoc, addDoc, collection, deleteDoc, runTransaction } from "firebase/firestore";
import { useAuth } from "../auth/useAuth";
import { FaHeart } from "react-icons/fa";
import { ADMIN_EMAILS } from "../config/Constants";
import { debounce } from "lodash";

const LikeButton = ({ newsId }) => {
  const { currentUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!newsId || !currentUser) return;

    const checkLikeStatus = async () => {
      try {
        const likeDoc = doc(db, "news", newsId, "likes", currentUser.uid);
        const likeSnap = await getDoc(likeDoc);
        setLiked(likeSnap.exists());

        const newsDoc = doc(db, "news", newsId);
        const newsSnap = await getDoc(newsDoc);
        if (newsSnap.exists()) {
          setLikeCount(newsSnap.data().likeCount || 0);
        }
      } catch (err) {
        console.error("Error checking like status:", err);
        setError("Gagal memuat status like: " + err.message);
      }
    };

    checkLikeStatus();
  }, [newsId, currentUser]);

  const handleLike = useCallback(
    debounce(async () => {
      if (!currentUser) {
        setError("Silakan login untuk menyukai berita.");
        return;
      }

      if (isProcessing) return;

      setIsProcessing(true);
      try {
        const likeDocRef = doc(db, "news", newsId, "likes", currentUser.uid);
        const newsDocRef = doc(db, "news", newsId);

        await runTransaction(db, async (transaction) => {
          const newsDocSnap = await transaction.get(newsDocRef);
          if (!newsDocSnap.exists()) {
            throw new Error("Berita tidak ditemukan");
          }

          const currentLikeCount = newsDocSnap.data().likeCount || 0;
          const likeDocSnap = await transaction.get(likeDocRef);
          const actionType = liked ? "unlike" : "like";

          if (liked && likeDocSnap.exists()) {
            // Unlike: Decrement likeCount and delete likeDoc
            transaction.set(newsDocRef, { likeCount: currentLikeCount - 1 }, { merge: true });
            transaction.delete(likeDocRef);
            setLiked(false);
            setLikeCount(currentLikeCount - 1);
          } else if (!liked && !likeDocSnap.exists()) {
            // Like: Increment likeCount and create likeDoc
            transaction.set(likeDocRef, { userId: currentUser.uid, likedAt: new Date() });
            transaction.set(newsDocRef, { likeCount: currentLikeCount + 1 }, { merge: true });
            setLiked(true);
            setLikeCount(currentLikeCount + 1);
          } else {
            // Prevent redundant operations
            return;
          }

          // Log LIKE_NEWS action
          const isAdmin = ADMIN_EMAILS.includes(currentUser.email);
          await addDoc(collection(db, "logs"), {
            action: "LIKE_NEWS",
            userEmail: currentUser.email || "unknown@example.com",
            details: {
              newsId,
              actionType,
              isAdmin,
            },
            timestamp: new Date(),
          });
        });

        setError(null);
      } catch (err) {
        console.error("Error handling like:", err);
        setError("Gagal menyukai berita: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    }, 500), // Debounce for 500ms
    [currentUser, newsId, liked, isProcessing]
  );

  return (
    <div className="flex items-center space-x-2">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handleLike}
        disabled={!currentUser || isProcessing}
        className={`flex items-center space-x-1 p-2 rounded ${
          liked ? "text-red-500" : "text-gray-500"
        } ${isProcessing ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"} transition-colors`}
      >
        <FaHeart className={liked ? "fill-current" : "stroke-current"} />
        <span>{likeCount}</span>
      </button>
    </div>
  );
};

export default LikeButton;
