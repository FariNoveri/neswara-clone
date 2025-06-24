import React, { useEffect, useState } from "react";

const LikeButton = ({ newsId, currentUserId, onLike, liked }) => {
  const [error, setError] = useState(null);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (!newsId || !currentUserId) {
      console.warn("LikeButton: Invalid props", { newsId, currentUserId });
      setError("Silakan masuk untuk menyukai berita.");
    } else {
      setError(null);
    }
  }, [newsId, currentUserId]);

  const handleClick = async () => {
    if (isLiking || !newsId || !currentUserId) {
      if (!currentUserId) console.warn("User not authenticated for like action.");
      return;
    }

    setIsLiking(true);
    try {
      await onLike();
    } catch (err) {
      console.error("Error handling like:", err.message, err.code);
    } finally {
      setIsLiking(false);
    }
  };

  if (error) {
    return <p className="text-red-500 text-sm">{error}</p>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLiking}
      className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
        liked ? "text-red-600 bg-red-100" : "text-slate-600 bg-slate-100"
      } ${isLiking ? "opacity-50 cursor-not-allowed" : "hover:bg-red-200"}`}
    >
      ❤️
    </button>
  );
};

export default LikeButton;