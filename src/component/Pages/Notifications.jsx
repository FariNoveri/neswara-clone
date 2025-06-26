import React, { useState, useEffect, useRef } from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseconfig.js";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const notificationDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications
  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notificationsData);
      const hasUnread = notificationsData.some(notif => !notif.isRead);
      setHasNewNotifications(hasUnread);
    }, (error) => {
      console.error("Error fetching notifications:", {
        message: error.message || "Unknown error",
        code: error.code || "No code",
        stack: error.stack || "No stack trace",
      });
    });
    return () => unsubscribe();
  }, []);

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    if (!isNotificationOpen && hasNewNotifications) {
      setTimeout(() => {
        setHasNewNotifications(false);
        setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      }, 1000);
    }
  };

  const handleNotificationItemClick = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    const notification = notifications.find(n => n.id === notificationId);
    if (notification.newsLink) {
      navigate(notification.newsLink);
    } else {
      const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
      if (element) {
        element.classList.add('bounce-animation');
        setTimeout(() => element.classList.remove('bounce-animation'), 500);
      }
    }
    setIsNotificationOpen(false);
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
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {!notification.image && (
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
                          <p className="text-xs text-gray-400">
                            {notification.timestamp?.toDate().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " " +
                             notification.timestamp?.toDate().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      )}
                      {notification.image && (
                        <>
                          <img
                            src={notification.image}
                            alt="Notification"
                            className="w-10 h-10 rounded-full flex-shrink-0"
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
                            <p className="text-xs text-gray-400">
                              {notification.timestamp?.toDate().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " " +
                               notification.timestamp?.toDate().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                            </p>
                          </div>
                        </>
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
              Lihat Semua Notifikasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;