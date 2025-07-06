import React, { useState, useEffect, useRef } from "react";
import { FaBell } from "react-icons/fa";
import { Link } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseconfig.js";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [newsArticles, setNewsArticles] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const notificationDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch news articles
  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const newsData = snapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().judul || doc.data().title || "Tanpa Judul",
          slug: doc.data().slug || `berita-${doc.id}`,
        }));
        setNewsArticles(newsData);
      } catch (error) {
        console.error("Error fetching news articles:", error);
        toast.error("Gagal memuat artikel berita.");
      }
    }, (error) => {
      console.error("Snapshot error for news:", error);
      toast.error("Gagal memuat artikel berita.");
    });
    return () => unsubscribe();
  }, []);

  // Fetch all notifications (read and unread)
  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(notificationsData);
        const hasUnread = notificationsData.some(notif => !notif.isRead);
        setHasNewNotifications(hasUnread);
      } catch (error) {
        console.error("Error fetching notifications:", {
          message: error.message || "Unknown error",
          code: error.code || "No code",
          stack: error.stack || "No stack trace",
        });
        toast.error("Gagal memuat notifikasi.");
      }
    }, (error) => {
      console.error("Snapshot error:", error);
      toast.error("Gagal memuat notifikasi.");
    });
    return () => unsubscribe();
  }, []);

  // Mark all notifications as read when dropdown is opened
  const handleNotificationClick = async () => {
    setIsNotificationOpen(!isNotificationOpen);
    if (!isNotificationOpen && hasNewNotifications) {
      try {
        const updatePromises = notifications
          .filter(notif => !notif.isRead)
          .map(notif =>
            updateDoc(doc(db, "notifications", notif.id), { isRead: true })
          );
        await Promise.all(updatePromises);
        setHasNewNotifications(false);
      } catch (error) {
        console.error("Error marking notifications as read:", error);
        toast.error("Gagal menandai notifikasi sebagai dibaca.");
      }
    }
  };

  // Mark single notification as read and navigate if linked
  const handleNotificationItemClick = async (notificationId) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification.isRead) {
        await updateDoc(doc(db, "notifications", notificationId), { isRead: true });
      }

      if (notification.newsSlug) {
        navigate(`/berita/${notification.newsSlug}`);
      } else {
        const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (element) {
          element.classList.add('bounce-animation');
          setTimeout(() => element.classList.remove('bounce-animation'), 500);
        }
      }
      setIsNotificationOpen(false);
    } catch (error) {
      console.error("Error handling notification click:", error);
      toast.error("Gagal memproses notifikasi.");
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={notificationDropdownRef}>
      <button
        onClick={handleNotificationClick}
        className="relative text-gray-600 text-lg cursor-pointer hover:text-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 p-1"
        aria-label="Notifikasi"
      >
        <FaBell />
        {hasNewNotifications && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full notification-indicator"></span>
        )}
      </button>

      {isNotificationOpen && (
        <div className="notification-dropdown absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-lg border border-gray-100 dropdown-menu z-50">
          <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifikasi</h3>
              <span className="text-sm text-blue-500 font-medium">
                {notifications.filter(n => !n.isRead).length} baru
              </span>
            </div>
          </div>

          <div className="notification-scroll" style={{ maxHeight: '400px', minHeight: '200px' }}>
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FaBell className="mx-auto text-3xl mb-2 opacity-50" />
                <p>Tidak ada notifikasi</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    data-notification-id={notification.id}
                    onClick={() => handleNotificationItemClick(notification.id)}
                    className={`notification-item p-4 border-b border-gray-50 cursor-pointer transition-all duration-200 ${
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {notification.image ? (
                        <>
                          <img
                            src={notification.image}
                            alt="Notification"
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm"
                            onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`text-sm font-medium truncate ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                              {notification.message}
                            </p>
                            {notification.newsSlug && (
                              <div className="flex items-center space-x-2 text-sm text-indigo-600 mt-1">
                                <Link className="w-4 h-4" />
                                <span className="truncate">
                                  {newsArticles.find(article => article.slug === notification.newsSlug)?.title || notification.newsSlug}
                                </span>
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.timestamp?.toDate().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " " +
                               notification.timestamp?.toDate().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm font-medium truncate ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                            {notification.message}
                          </p>
                          {notification.newsSlug && (
                            <div className="flex items-center space-x-2 text-sm text-indigo-600 mt-1">
                              <Link className="w-4 h-4" />
                              <span className="truncate">
                                {newsArticles.find(article => article.slug === notification.newsSlug)?.title || notification.newsSlug}
                              </span>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.timestamp?.toDate().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " " +
                             notification.timestamp?.toDate().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-100 bg-white sticky bottom-0 rounded-b-lg">
            <button
              onClick={() => setIsNotificationOpen(false)}
              className="w-full text-center text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
            >
              {hasNewNotifications ? 'Tutup' : 'Anda sudah melihat semuanya'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;