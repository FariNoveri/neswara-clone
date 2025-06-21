import { doc, getDoc, setDoc, deleteDoc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../firebaseconfig";

const LikeButton = ({ newsId, currentUserId }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [error, setError] = useState(null);

  // Guard clause for invalid props
  if (!newsId || !currentUserId) {
    console.warn("LikeButton membutuhkan newsId dan currentUserId yang valid.");
    return null;
  }

  const likeRef = doc(db, "news", newsId, "likes", currentUserId);
  const newsDocRef = doc(db, "news", newsId);

  useEffect(() => {
    // Listen for likeCount changes
    const unsub = onSnapshot(
      newsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setLikeCount(docSnap.data().likeCount || 0);
        } else {
          setError("Berita tidak ditemukan.");
        }
      },
      (err) => {
        console.error("Error listening to likeCount:", err.message);
        setError("Gagal memuat jumlah suka.");
      }
    );

    // Check if user has liked
    const checkLike = async () => {
      try {
        const docSnap = await getDoc(likeRef);
        setLiked(docSnap.exists());
      } catch (err) {
        console.error("Error checking like status:", err.message);
        setError("Gagal memeriksa status suka.");
      }
    };

    checkLike();

    return () => unsub();
  }, [newsId, currentUserId]);

  const handleLike = async () => {
    if (!currentUserId || currentUserId === "anonim") {
      alert("Login terlebih dahulu untuk menyukai berita ini.");
      return;
    }

    setError(null);
    try {
      if (liked) {
        // Unlike
        await deleteDoc(likeRef);
        await updateDoc(newsDocRef, { likeCount: increment(-1) });
        setLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1)); // Prevent negative counts
      } else {
        // Like
        await setDoc(likeRef, { liked: true, userId: currentUserId });
        await updateDoc(newsDocRef, { likeCount: increment(1) });
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error handling like:", err.message);
      setError("Gagal menyukai berita. Silakan coba lagi.");
    }
  };

  if (error) {
    return <p className="text-red-500 text-sm">{error}</p>;
  }

  return (
    <button
      className={`mt-4 px-4 py-2 rounded font-semibold text-sm ${
        liked ? "bg-red-600 text-white" : "bg-gray-700 text-white"
      }`}
      onClick={handleLike}
    >
      {liked ? "Disukai" : "Suka"} ({likeCount})
    </button>
  );
};

export default LikeButton;