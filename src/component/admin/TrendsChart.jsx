import React, { useState, useEffect, useRef, useCallback } from 'react';
import Chart from 'chart.js/auto';
import { collection, query, collectionGroup, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebaseconfig';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

// Custom date formatting function (from ReportManagement.jsx)
const formatDate = (date) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
};

const TrendsChart = ({ isAuthorized = true, activeTab = 'dashboard', logActivity }) => {
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [trends, setTrends] = useState({
    news: {},
    comments: {},
    views: {},
    users: {},
    reports: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState(() => {
    return localStorage.getItem('trendsChartTimeRange') || '7days';
  });
  const [showDecimal, setShowDecimal] = useState(false);

  // ✅ Move parseCreatedAt INSIDE the component
  const parseCreatedAt = useCallback((createdAt, docId, collectionName) => {
    try {
      if (!createdAt) {
        console.warn(`Missing createdAt in ${collectionName} doc: ${docId}`);
        toast.warn(`Missing createdAt in ${collectionName} doc: ${docId}`, { autoClose: 5000 });
        return null;
      }
      let date;
      if (createdAt.toDate && typeof createdAt.toDate === 'function') {
        // Proper Firestore Timestamp
        date = createdAt.toDate(); 
      } else if (typeof createdAt === 'string') {
        date = new Date(createdAt);
        if (isNaN(date)) {
          console.warn(`Invalid createdAt string in ${collectionName} doc: ${docId}, value: ${createdAt}`);
          toast.warn(`Invalid createdAt in ${collectionName} doc: ${docId}`, { autoClose: 5000 });
          return null;
        }
      } else if (typeof createdAt === 'number') {
        date = new Date(createdAt);
      } else if (typeof createdAt === 'object' && createdAt !== null) {
        // Handle serialized Firestore timestamp
        if (createdAt.type && createdAt.type.includes('firestore') && createdAt.seconds) {
          // Serialized Firestore timestamp: { type: "firestore/timestamp/1.0", seconds: ..., nanoseconds: ... }
          const milliseconds = createdAt.seconds * 1000 + Math.floor(createdAt.nanoseconds / 1000000);
          date = new Date(milliseconds);
        } else if (createdAt.seconds !== undefined) {
          // Simple timestamp object: { seconds: ..., nanoseconds: ... }
          const milliseconds = createdAt.seconds * 1000 + Math.floor((createdAt.nanoseconds || 0) / 1000000);
          date = new Date(milliseconds);
        } else if (createdAt._seconds !== undefined) {
          // Alternative format: { _seconds: ..., _nanoseconds: ... }
          const milliseconds = createdAt._seconds * 1000 + Math.floor((createdAt._nanoseconds || 0) / 1000000);
          date = new Date(milliseconds);
        } else {
          console.warn(`Unexpected object format in createdAt for ${collectionName} doc: ${docId}, value: ${JSON.stringify(createdAt)}`);
          toast.warn(`Unexpected createdAt format in ${collectionName} doc: ${docId}`, { autoClose: 5000 });
          return null;
        }
      } else {
        console.warn(`Unsupported createdAt type in ${collectionName} doc: ${docId}, type: ${typeof createdAt}, value: ${createdAt}`);
        toast.warn(`Unsupported createdAt type in ${collectionName} doc: ${docId}`, { autoClose: 5000 });
        return null;
      }
      
      // Validate the resulting date
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date created for ${collectionName} doc: ${docId}, original value: ${JSON.stringify(createdAt)}`);
        toast.warn(`Invalid date created for ${collectionName} doc: ${docId}`, { autoClose: 5000 });
        return null;
      }
      
      // Convert UTC to WIB (UTC+7)
      const wibOffset = 7 * 60; // 7 hours in minutes
      const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
      const wibDate = new Date(utcDate.getTime() + wibOffset * 60 * 1000);
      return wibDate;
    } catch (error) {
      console.error(`Error parsing createdAt in ${collectionName} doc: ${docId}`, error);
      toast.error(`Error parsing createdAt in ${collectionName} doc: ${docId}`, { autoClose: 5000 });
      return null;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('trendsChartTimeRange', timeRange);
  }, [timeRange]);

  useEffect(() => {
    if (!isAuthorized || activeTab !== 'dashboard') {
      setTrends({
        news: {},
        comments: {},
        views: {},
        users: {},
        reports: {}
      });
      setChartData([]);
      setIsLoading(false);
      return;
    }

    const auth = getAuth();
    const fetchTrendsData = async () => {
      if (!auth.currentUser) {
        console.error('fetchTrendsData: No authenticated user');
        toast.error('Tidak dapat memuat data tren: Pengguna tidak terautentikasi.');
        setIsLoading(false);
        if (typeof logActivity === 'function') {
          await logActivity('TRENDS_ACCESS_DENIED', { error: 'No authenticated user' });
        }
        return;
      }

      try {
        // Log authentication state for debugging
        const tokenResult = await auth.currentUser.getIdTokenResult(true);
        console.log('Auth state:', {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          tokenClaims: tokenResult.claims
        });

        setIsLoading(true);

        const today = new Date();
        const wibOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
        const todayWib = new Date(today.getTime() + wibOffset);
        todayWib.setHours(23, 59, 59, 999);

        let rangeDays;
        switch (timeRange) {
          case '30days':
            rangeDays = 30;
            break;
          case '365days':
            rangeDays = 365;
            break;
          default:
            rangeDays = 7;
        }
        const rangeStart = new Date(todayWib);
        rangeStart.setDate(todayWib.getDate() - (rangeDays - 1));
        rangeStart.setHours(0, 0, 0, 0);

        const data = [];
        const newsTrends = {};
        const commentsTrends = {};
        const viewsTrends = {};
        const usersTrends = {};
        const reportsTrends = {};

        for (let i = 0; i < rangeDays; i++) {
          const date = new Date(rangeStart);
          date.setDate(rangeStart.getDate() + i);
          const dateStr = formatDate(date).split(',')[0];
          const shortDate = rangeDays <= 30
            ? date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
            : date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
          newsTrends[dateStr] = 0;
          commentsTrends[dateStr] = 0;
          viewsTrends[dateStr] = 0;
          usersTrends[dateStr] = 0;
          reportsTrends[dateStr] = 0;
          data.push({
            date: shortDate,
            fullDate: dateStr,
            news: 0,
            comments: 0,
            views: 0,
            users: 0,
            reports: 0
          });
        }

        // Fetch news
        const newsQuery = query(collection(db, 'news'));
        const unsubscribeNews = onSnapshot(newsQuery, (snapshot) => {
          try {
            Object.keys(newsTrends).forEach(dateStr => {
              newsTrends[dateStr] = 0;
              viewsTrends[dateStr] = 0;
              data.find(d => d.fullDate === dateStr).news = 0;
              data.find(d => d.fullDate === dateStr).views = 0;
            });

            let newsCount = 0;
            snapshot.forEach(doc => {
              try {
                const createdAt = parseCreatedAt(doc.data().createdAt, doc.id, 'news');
                if (!createdAt) return; // Skip invalid documents
                const dateStr = formatDate(createdAt).split(',')[0];
                if (createdAt >= rangeStart && createdAt <= todayWib && newsTrends[dateStr] !== undefined) {
                  newsTrends[dateStr]++;
                  data.find(d => d.fullDate === dateStr).news++;
                  viewsTrends[dateStr] += doc.data().views || 0;
                  data.find(d => d.fullDate === dateStr).views += doc.data().views || 0;
                  newsCount++;
                }
              } catch (error) {
                console.error(`Error processing news doc: ${doc.id}`, error);
              }
            });

            setTrends(prev => ({ ...prev, news: { ...newsTrends }, views: { ...viewsTrends } }));
            setChartData([...data]);
            if (typeof logActivity === 'function') {
              logActivity('TRENDS_NEWS_FETCHED', { totalNews: newsCount });
            }
          } catch (error) {
            console.error('Error fetching news trends:', error);
            if (typeof logActivity === 'function') {
              logActivity('TRENDS_NEWS_ERROR', { error: error.message });
            }
            toast.error('Gagal memuat tren berita.');
          }
        }, (error) => {
          console.error('Error in news snapshot:', error);
          if (typeof logActivity === 'function') {
            logActivity('TRENDS_NEWS_SNAPSHOT_ERROR', { error: error.message });
          }
          toast.error('Gagal memuat pembaruan tren berita.');
        });

        // Fetch comments with retry logic
        const maxRetries = 3;
        let retryCount = 0;
        const fetchComments = () => {
          const commentsQuery = query(collectionGroup(db, 'comments'));
          const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
            try {
              Object.keys(commentsTrends).forEach(dateStr => {
                commentsTrends[dateStr] = 0;
                data.find(d => d.fullDate === dateStr).comments = 0;
              });

              let commentsCount = 0;
              snapshot.forEach(doc => {
                try {
                  const createdAt = parseCreatedAt(doc.data().createdAt, doc.id, 'comments');
                  if (!createdAt) return; // Skip invalid documents
                  const dateStr = formatDate(createdAt).split(',')[0];
                  if (createdAt >= rangeStart && createdAt <= todayWib && commentsTrends[dateStr] !== undefined) {
                    commentsTrends[dateStr]++;
                    data.find(d => d.fullDate === dateStr).comments++;
                    commentsCount++;
                  }
                } catch (error) {
                  console.error(`Error processing comment doc: ${doc.id}`, error);
                }
              });

              setTrends(prev => ({ ...prev, comments: { ...commentsTrends } }));
              setChartData([...data]);
              if (typeof logActivity === 'function') {
                logActivity('TRENDS_COMMENTS_FETCHED', { totalComments: commentsCount });
              }
            } catch (error) {
              console.error('Error fetching comments trends:', error);
              if (typeof logActivity === 'function') {
                logActivity('TRENDS_COMMENTS_ERROR', { error: error.message });
              }
              toast.error('Gagal memuat tren komentar.');
            }
          }, (error) => {
            console.error('Error in comments snapshot:', error);
            if (typeof logActivity === 'function') {
              logActivity('TRENDS_COMMENTS_SNAPSHOT_ERROR', {
                error: error.message,
                code: error.code,
                retryCount
              });
            }
            if (error.code === 'permission-denied' && retryCount < maxRetries) {
              retryCount++;
              console.warn(`Retrying comments query (attempt ${retryCount}/${maxRetries})`);
              setTimeout(fetchComments, 1000 * retryCount);
            } else if (error.message.includes('index')) {
              console.log('Missing index for comments collection group. Create it in Firebase Console.');
              toast.error('Komentar membutuhkan indeks. Periksa Firebase Console.');
            } else if (error.code === 'permission-denied') {
              console.warn('Permission denied for comments collection group');
              toast.error('Akses ke komentar ditolak. Pastikan aturan Firestore sudah benar.');
            } else {
              toast.error('Gagal memuat pembaruan tren komentar.');
            }
          });
          return unsubscribeComments;
        };

        const unsubscribeComments = fetchComments();

        // Fetch users
        const usersQuery = query(collection(db, 'users'));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
          try {
            Object.keys(usersTrends).forEach(dateStr => {
              usersTrends[dateStr] = 0;
              data.find(d => d.fullDate === dateStr).users = 0;
            });

            let usersCount = 0;
            snapshot.forEach(doc => {
              try {
                const createdAt = parseCreatedAt(doc.data().createdAt, doc.id, 'users');
                if (!createdAt) return; // Skip invalid documents
                const dateStr = formatDate(createdAt).split(',')[0];
                if (createdAt >= rangeStart && createdAt <= todayWib && usersTrends[dateStr] !== undefined) {
                  usersTrends[dateStr]++;
                  data.find(d => d.fullDate === dateStr).users++;
                  usersCount++;
                }
              } catch (error) {
                console.error(`Error processing user doc: ${doc.id}`, error);
              }
            });

            setTrends(prev => ({ ...prev, users: { ...usersTrends } }));
            setChartData([...data]);
            if (typeof logActivity === 'function') {
              logActivity('TRENDS_USERS_FETCHED', { totalUsers: usersCount });
            }
          } catch (error) {
            console.error('Error fetching users trends:', error);
            if (typeof logActivity === 'function') {
              logActivity('TRENDS_USERS_ERROR', { error: error.message });
            }
            toast.error('Gagal memuat tren pengguna.');
          }
        }, (error) => {
          console.error('Error in users snapshot:', error);
          if (typeof logActivity === 'function') {
            logActivity('TRENDS_USERS_SNAPSHOT_ERROR', { error: error.message });
          }
          toast.error('Gagal memuat pembaruan tren pengguna.');
        });

        // Fetch reports
        const reportsQuery = query(collection(db, 'reports'));
        const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
          try {
            Object.keys(reportsTrends).forEach(dateStr => {
              reportsTrends[dateStr] = 0;
              data.find(d => d.fullDate === dateStr).reports = 0;
            });

            let reportCount = 0;
            snapshot.forEach(doc => {
              try {
                const createdAt = parseCreatedAt(doc.data().timestamp, doc.id, 'reports');
                if (!createdAt) return; // Skip invalid documents
                const dateStr = formatDate(createdAt).split(',')[0];
                if (createdAt >= rangeStart && createdAt <= todayWib && reportsTrends[dateStr] !== undefined) {
                  reportsTrends[dateStr]++;
                  data.find(d => d.fullDate === dateStr).reports++;
                  reportCount++;
                }
              } catch (error) {
                console.error(`Error processing report doc: ${doc.id}`, error);
              }
            });

            setTrends(prev => ({ ...prev, reports: { ...reportsTrends } }));
            setChartData([...data]);
            if (typeof logActivity === 'function') {
              logActivity('TRENDS_REPORTS_FETCHED', { totalReports: reportCount });
            }
          } catch (error) {
            console.error('Error fetching reports trends:', error);
            if (typeof logActivity === 'function') {
              logActivity('TRENDS_REPORTS_ERROR', { error: error.message });
            }
            if (error.code === 'permission-denied') {
              console.warn('Permission denied for reports collection');
              toast.error('Akses ke laporan ditolak. Pastikan Anda memiliki izin admin.');
            } else {
              toast.error('Gagal memuat tren laporan.');
            }
          }
        }, (error) => {
          console.error('Error in reports snapshot:', error);
          if (typeof logActivity === 'function') {
            logActivity('TRENDS_REPORTS_SNAPSHOT_ERROR', { error: error.message });
          }
          if (error.code === 'permission-denied') {
            toast.error('Akses ke pembaruan laporan ditolak. Pastikan Anda memiliki izin admin.');
          } else {
            toast.error('Gagal memuat pembaruan tren laporan.');
          }
        });

        setIsLoading(false);

        return () => {
          unsubscribeNews();
          unsubscribeComments();
          unsubscribeUsers();
          unsubscribeReports();
        };
      } catch (error) {
        console.error('Error setting up trends data:', error);
        if (typeof logActivity === 'function') {
          logActivity('TRENDS_SETUP_ERROR', { error: error.message });
        }
        toast.error('Gagal mengatur data tren.');
        setIsLoading(false);
      }
    };

    fetchTrendsData();
  }, [isAuthorized, activeTab, logActivity, timeRange, parseCreatedAt]);

  const metrics = [
    { key: 'all', label: 'Semua Metrik', color: '#6366f1' },
    { key: 'news', label: 'Berita', color: '#10b981' },
    { key: 'comments', label: 'Komentar', color: '#3b82f6' },
    { key: 'views', label: 'Tayangan', color: '#f59e0b' },
    { key: 'users', label: 'Pengguna', color: '#ef4444' },
    { key: 'reports', label: 'Laporan', color: '#f97316' }
  ];

  useEffect(() => {
    if (!isAuthorized || activeTab !== 'dashboard' || !chartRef.current || isLoading || chartData.length === 0) {
      return;
    }

    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    const labels = chartData.map(item => item.date);

    let datasets = [];

    if (selectedMetric === 'all') {
      datasets = [
        {
          label: 'Berita',
          data: chartData.map(item => item.news),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        },
        {
          label: 'Komentar',
          data: chartData.map(item => item.comments),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        },
        {
          label: 'Tayangan',
          data: chartData.map(item => item.views),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        },
        {
          label: 'Pengguna',
          data: chartData.map(item => item.users),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        },
        {
          label: 'Laporan',
          data: chartData.map(item => item.reports),
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#f97316',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }
      ];
    } else {
      const selectedMetricData = metrics.find(m => m.key === selectedMetric);
      datasets = [
        {
          label: selectedMetricData.label,
          data: chartData.map(item => item[selectedMetric]),
          borderColor: selectedMetricData.color,
          backgroundColor: selectedMetricData.color + '20',
          fill: true,
          tension: 0.4,
          borderWidth: 4,
          pointRadius: 8,
          pointHoverRadius: 12,
          pointBackgroundColor: selectedMetricData.color,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 3
        }
      ];
    }

    const newChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1500,
          easing: 'easeInOutQuart'
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                weight: '600'
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#374151',
            bodyColor: '#6b7280',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            cornerRadius: 12,
            padding: 12,
            displayColors: true,
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Tanggal',
              font: {
                size: 12,
                weight: '600'
              },
              color: '#6b7280'
            },
            grid: {
              color: 'rgba(229, 231, 235, 0.5)',
              drawBorder: false
            },
            ticks: {
              color: '#6b7280',
              font: {
                size: 11
              },
              maxTicksLimit: timeRange === '365days' ? 12 : undefined
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Jumlah',
              font: {
                size: 12,
                weight: '600'
              },
              color: '#6b7280'
            },
            beginAtZero: true,
            grid: {
              color: 'rgba(229, 231, 235, 0.5)',
              drawBorder: false
            },
            ticks: {
              color: '#6b7280',
              font: {
                size: 11
              }
            }
          }
        }
      }
    });

    setChartInstance(newChartInstance);

    return () => {
      if (newChartInstance) {
        newChartInstance.destroy();
      }
    };
  }, [isAuthorized, activeTab, chartData, selectedMetric, timeRange]);

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/3"></div>
      <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl"></div>
    </div>
  );

  if (!isAuthorized || activeTab !== 'dashboard') {
    return null;
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-pulse"></div>
      
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-500">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Perkembangan {timeRange === '7days' ? '7 Hari' : timeRange === '30days' ? '30 Hari' : '1 Tahun'} Terakhir
              </h3>
              <p className="text-gray-500 text-sm">
                Analisis tren konten dan engagement
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <motion.div
              className="flex gap-2 bg-gray-100 p-1 rounded-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {['7days', '30days', '365days'].map((range) => (
                <motion.button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                    timeRange === range
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {range === '7days' ? '7 Hari' : range === '30days' ? '30 Hari' : '1 Tahun'}
                </motion.button>
              ))}
            </motion.div>
            <div className="flex gap-2 flex-wrap">
              {metrics.map((metric) => (
                <motion.button
                  key={metric.key}
                  onClick={() => setSelectedMetric(metric.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                    selectedMetric === metric.key
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={selectedMetric === metric.key ? { boxShadow: `0 4px 15px ${metric.color}40` } : {}}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {metric.label}
                </motion.button>
              ))}
            </div>
            <motion.button
              onClick={() => setShowDecimal(!showDecimal)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                showDecimal
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {showDecimal ? 'Tampilkan Bulat' : 'Tampilkan Desimal'}
            </motion.button>
          </div>
        </div>

        <div className="relative">
          <AnimatePresence>
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <LoadingSkeleton />
              </motion.div>
            ) : chartData.length === 0 ? (
              <motion.div
                key="no-data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-80 w-full bg-gradient-to-br from-gray-50/50 to-white rounded-xl p-4 flex items-center justify-center"
              >
                <p className="text-gray-500 text-sm">Tidak ada data tersedia untuk ditampilkan.</p>
              </motion.div>
            ) : (
              <motion.div
                key="chart"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="h-80 w-full bg-gradient-to-br from-gray-50/50 to-white rounded-xl p-4"
              >
                <canvas ref={chartRef} className="w-full h-full"></canvas>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {!isLoading && chartData.length > 0 && (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, staggerChildren: 0.1 }}
            >
              {metrics.slice(1).map((metric) => {
                const total = chartData.reduce((sum, day) => sum + day[metric.key], 0);
                const avg = showDecimal ? (total / chartData.length).toFixed(2) : Math.round(total / chartData.length);
                return (
                  <motion.div
                    key={metric.key}
                    className={`bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${metric.key === 'reports' && total > 0 ? 'animate-pulse' : ''}`}
                    onClick={() => setSelectedMetric(metric.key)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full animate-pulse"
                        style={{ backgroundColor: metric.color }}
                      />
                      <span className="text-sm font-medium text-gray-600">{metric.label}</span>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-gray-800">{total.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">total</div>
                      <div className="text-lg font-semibold text-gray-700">{avg.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">rata-rata per hari</div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {!isLoading && chartData.length > 0 && (
          <motion.div
            className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Penjelasan Perhitungan Rata-Rata</h4>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Cara Menghitung Rata-Rata:</strong> Rata-rata dihitung dengan menjumlahkan total nilai untuk setiap metrik (misalnya, jumlah berita, komentar, tayangan, pengguna, atau laporan) selama periode waktu yang dipilih (7 hari, 30 hari, atau 1 tahun), lalu dibagi dengan jumlah hari dalam periode tersebut. Misalnya, jika total berita dalam 7 hari adalah 28, maka rata-rata per hari adalah 28 ÷ 7 = 4.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Mengapa Dibulatkan:</strong> Secara default, rata-rata dibulatkan ke bilangan bulat (misalnya, 4.29 menjadi 4) untuk memudahkan pembacaan dan karena metrik seperti berita atau komentar biasanya berupa jumlah bulat. Pembulatan membuat angka lebih sederhana dan relevan untuk konteks data yang mewakili item diskrit (tidak ada "0.29 berita").
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Menampilkan Desimal:</strong> Jika Anda memerlukan presisi lebih, klik tombol "Tampilkan Desimal" di atas untuk menampilkan rata-rata dengan dua angka desimal (misalnya, 4.29). Ini berguna untuk analisis mendalam, terutama untuk metrik seperti tayangan yang mungkin memiliki nilai rata-rata yang lebih bervariasi.
            </p>
            <p className="text-sm text-gray-500 italic">
              Catatan: Gunakan mode desimal dengan hati-hati, karena angka desimal mungkin kurang intuitif untuk beberapa metrik. Pastikan untuk memilih format yang paling sesuai dengan kebutuhan analisis Anda.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TrendsChart;