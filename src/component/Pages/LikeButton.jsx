import React, { useState, useEffect, useCallback } from "react";
import { db } from "../../firebaseconfig";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, increment } from "firebase/firestore";
import { useAuth } from "../auth/useAuth";
import { FaHeart } from "react-icons/fa";
import { debounce } from "lodash";
import { motion } from "framer-motion";

const LikeButton = ({ newsId, onLikeStatusChange }) => {
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
        setError("Gagal memuat status like");
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
      setError(null);

      try {
        const likeDocRef = doc(db, "news", newsId, "likes", currentUser.uid);
        const newsDocRef = doc(db, "news", newsId);

        if (liked) {
          await deleteDoc(likeDocRef);
          await updateDoc(newsDocRef, {
            likeCount: increment(-1),
          });
          setLiked(false);
          setLikeCount((prev) => {
            const newCount = Math.max(0, prev - 1);
            onLikeStatusChange?.(newCount, false);
            return newCount;
          });
        } else {
          await setDoc(likeDocRef, {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            likedAt: new Date(),
            newsId: newsId,
          });
          await updateDoc(newsDocRef, {
            likeCount: increment(1),
          });
          setLiked(true);
          setLikeCount((prev) => {
            const newCount = prev + 1;
            onLikeStatusChange?.(newCount, true);
            return newCount;
          });
        }

        try {
          await setDoc(doc(db, "logs", `like_${newsId}_${currentUser.uid}_${Date.now()}`), {
            action: "LIKE_NEWS",
            userEmail: currentUser.email || "unknown@example.com",
            details: {
              newsId,
              actionType: liked ? "unlike" : "like",
            },
            timestamp: new Date(),
          });
        } catch (logError) {
          console.warn("Could not log action:", logError);
        }
      } catch (err) {
        console.error("Error handling like:", err);
        setError("Gagal menyukai berita");
        setLiked((prev) => prev);
        setLikeCount((prev) => prev);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [currentUser, newsId, liked, isProcessing, onLikeStatusChange]
  );

  if (!currentUser) {
    return (
      <div className="flex items-center space-x-2">
        <button
          disabled
          className="flex items-center space-x-1 p-2 rounded text-gray-400 cursor-not-allowed"
        >
          <FaHeart />
          <span>{likeCount}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 text-sm rounded">
          {error}
        </div>
      )}
      <button
        onClick={handleLike}
        disabled={isProcessing}
        className={`flex items-center space-x-1 p-2 rounded transition-all duration-200 ${
          liked
            ? "text-red-500 bg-red-50 hover:bg-red-100"
            : "text-gray-500 hover:text-red-500 hover:bg-gray-100"
        } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <motion.div
          animate={{
            scale: liked ? [1, 1.2, 1] : 1,
            transition: { duration: 0.3 },
          }}
        >
          <FaHeart className={liked ? "text-red-500" : ""} />
        </motion.div>
        <motion.span
          key={likeCount}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.3 }}
        >
          {likeCount}
        </motion.span>
        {isProcessing && <span className="text-xs">...</span>}
      </button>
    </div>
  );
};

export default LikeButton;