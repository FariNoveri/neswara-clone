import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebaseconfig.js";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

const BreakingNews = () => {
  const [breakingNews, setBreakingNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmergency, setIsEmergency] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(15);
  const [newsKey, setNewsKey] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    const fetchBreakingNews = async () => {
      try {
        const collectionRef = collection(db, "breakingNews");
        const q = query(collectionRef, where("isActive", "==", true), orderBy("priority", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log("Breaking News Data:", newsData);
          
          const newIsEmergency = newsData.some(news => news.isEmergency);
          const newSpeed = newsData.length > 0 ? (newsData[0].speed || 15) : 15;
          
          const emergencyChanged = newIsEmergency !== isEmergency;
          const speedChanged = newSpeed !== currentSpeed;
          
          if ((emergencyChanged || speedChanged) && breakingNews.length > 0) {
            setShowTransition(true);
            setTimeout(() => {
              setIsEmergency(newIsEmergency);
              setCurrentSpeed(newSpeed);
              setNewsKey(prevKey => prevKey + 1); // Force re-render
              setShowTransition(false);
            }, 300);
          } else {
            setIsEmergency(newIsEmergency);
            setCurrentSpeed(newSpeed);
          }
          
          setBreakingNews(newsData);
          setIsLoading(false);

          // Restart animation when speed changes
          if (speedChanged && textRef.current) {
            textRef.current.style.animationPlayState = 'paused';
            textRef.current.offsetHeight; // Trigger reflow
            textRef.current.style.animationPlayState = 'running';
          }
        }, (error) => {
          console.error("Firestore error:", error);
          setIsLoading(false);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Fetch error:", error);
        setIsLoading(false);
      }
    };
    fetchBreakingNews();
  }, [isEmergency, currentSpeed, breakingNews.length]);

  // Generate text with unique news items only
  const newsText = breakingNews.length > 0 
    ? breakingNews.map(news => news.text || 'No text available').join(' - ')
    : '';

  // Ensure seamless loop with padding, no duplication
  const displayText = newsText;

  if (isLoading) {
    return (
      <div className="bg-gray-500 text-white py-2 px-4 text-center text-sm">
        Loading breaking news...
      </div>
    );
  }

  if (breakingNews.length === 0) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        @keyframes slideDown {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
        
        .breaking-news-text {
          animation: marquee ${currentSpeed}s linear infinite;
          display: inline-block;
          padding-left: 100%;
          white-space: nowrap;
          will-change: transform;
        }
        
        .breaking-news-container {
          transition: all 0.3s ease-in-out;
        }
        
        .slide-down-enter {
          animation: slideDown 0.5s ease-in-out;
        }
        
        .slide-up-exit {
          animation: slideUp 0.3s ease-in-out;
        }
        
        .emergency-pulse {
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
      
      <div 
        key={newsKey}
        className={`breaking-news-container ${
          showTransition ? 'slide-up-exit' : 'slide-down-enter'
        }`}
        style={{ 
          background: `linear-gradient(135deg, ${isEmergency ? '#dc2626' : '#2563eb'}, ${isEmergency ? '#ef4444' : '#3b82f6'})`, 
          padding: '10px 0', 
          fontSize: '14px', 
          fontWeight: 600, 
          position: 'relative', 
          zIndex: 50,
          color: 'white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
      >
        <div className="container mx-auto px-4 flex items-center">
          <span 
            className={`bg-white px-3 py-1 rounded-full text-xs font-bold mr-4 flex-shrink-0 ${
              isEmergency 
                ? 'text-red-600 emergency-pulse' 
                : 'text-blue-600'
            }`}
          >
            {isEmergency ? 'DARURAT' : 'BREAKING'}
          </span>
          
          <div className="overflow-hidden flex-1 relative">
            <div 
              ref={textRef}
              className="breaking-news-text text-white"
              style={{
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.5px',
                animationDuration: `${currentSpeed}s`
              }}
              title={`Scrolling speed: ${currentSpeed} seconds`}
            >
              {displayText}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BreakingNews;