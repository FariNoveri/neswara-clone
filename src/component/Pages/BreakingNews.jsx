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

  // Unified speed calculation based on text length
  const getUnifiedSpeed = (baseSpeed, textLength) => {
    const avgCharWidth = 7; // Approximate pixel width per character at 14px font
    const textWidth = textLength * avgCharWidth;
    const viewportWidth = window.innerWidth || 1200; // Fallback to 1200px
    const targetPxPerSecond = 100; // Consistent speed for all devices
    const calculatedSpeed = Math.max((textWidth + viewportWidth) / targetPxPerSecond, 5); // Minimum 5s
    return Math.max(baseSpeed, calculatedSpeed); // Respect Firestore speed if larger
  };

  useEffect(() => {
    const handleResize = () => {
      const newsText = breakingNews.length > 0 
        ? breakingNews.map(news => news.text || 'No text available').join(' | ')
        : '';
      const baseSpeed = breakingNews.length > 0 ? (breakingNews[0].speed || 15) : 15;
      setCurrentSpeed(getUnifiedSpeed(baseSpeed, newsText.length));
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, [breakingNews]);

  useEffect(() => {
    setIsLoading(true);
    const fetchBreakingNews = async () => {
      try {
        const collectionRef = collection(db, "breakingNews");
        const q = query(collectionRef, where("isActive", "==", true), orderBy("priority", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log("Breaking News Data:", newsData, "Timestamp:", new Date().toISOString());
          
          const newIsEmergency = newsData.some(news => news.isEmergency);
          const newsText = newsData.length > 0 
            ? newsData.map(news => news.text || 'No text available').join(' | ')
            : 'No breaking news available at this time';
          const baseSpeed = newsData.length > 0 ? (newsData[0].speed || 15) : 15;
          const newSpeed = getUnifiedSpeed(baseSpeed, newsText.length);
          
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
        }, (error) => {
          console.error("Firestore error:", error, "Timestamp:", new Date().toISOString());
          setIsLoading(false);
          setBreakingNews([]); // Ensure consistent state on error
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Fetch error:", error, "Timestamp:", new Date().toISOString());
        setIsLoading(false);
        setBreakingNews([]); // Ensure consistent state on error
      }
    };
    fetchBreakingNews();
  }, []);

  // Generate text with unique news items or fallback
  const newsText = breakingNews.length > 0 
    ? breakingNews.map(news => news.text || 'No text available').join(' | ')
    : 'No breaking news available at this time';

  // Ensure seamless loop with padding
  const displayText = newsText;

  if (isLoading) {
    return (
      <div className="bg-gray-500 text-white py-2 px-4 text-center text-sm">
        Loading breaking news...
      </div>
    );
  }

  // CSS styles as objects
  const styles = {
    keyframes: `
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
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }
    `,
    container: {
      background: `linear-gradient(135deg, ${isEmergency ? '#dc2626' : '#2563eb'}, ${isEmergency ? '#ef4444' : '#3b82f6'})`,
      padding: '10px 0',
      fontSize: '14px',
      fontWeight: 600,
      position: 'relative',
      zIndex: 50,
      color: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      transition: 'all 0.3s ease-in-out',
      animation: showTransition ? 'slideUp 0.3s ease-in-out' : 'slideDown 0.5s ease-in-out'
    },
    badge: {
      animation: isEmergency ? 'pulse 1s infinite' : 'none'
    },
    scrollingText: {
      animation: `marquee ${currentSpeed}s linear infinite`,
      display: 'inline-block',
      paddingLeft: '100%',
      whiteSpace: 'nowrap',
      willChange: 'transform',
      fontSize: '14px',
      fontWeight: '500',
      letterSpacing: '0.5px'
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles.keyframes }} />
      
      <div 
        key={newsKey}
        style={styles.container}
      >
        <div className="container mx-auto px-4 flex items-center">
          <span 
            className={`bg-white px-3 py-1 rounded-full text-xs font-bold mr-4 flex-shrink-0 ${
              isEmergency 
                ? 'text-red-600' 
                : 'text-blue-600'
            }`}
            style={styles.badge}
          >
            {isEmergency ? 'DARURAT' : 'BREAKING'}
          </span>
          
          <div className="overflow-hidden flex-1 relative">
            <div 
              ref={textRef}
              className="text-white"
              style={styles.scrollingText}
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