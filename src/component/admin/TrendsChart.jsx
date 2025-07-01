import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { collection, getDocs, query, where, collectionGroup } from 'firebase/firestore';
import { db } from '../../firebaseconfig';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

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
  // Initialize timeRange from localStorage or default to '7days'
  const [timeRange, setTimeRange] = useState(() => {
    return localStorage.getItem('trendsChartTimeRange') || '7days';
  });

  // Save timeRange to localStorage whenever it changes
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
      setIsLoading(false);
      return;
    }

    const fetchTrendsData = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
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
        const rangeStart = new Date(today);
        rangeStart.setDate(today.getDate() - (rangeDays - 1));
        rangeStart.setHours(0, 0, 0, 0);

        const data = [];
        const newsTrends = {};
        const commentsTrends = {};
        const viewsTrends = {};
        const usersTrends = {};
        const reportsTrends = {};

        // Generate date range
        for (let i = 0; i < rangeDays; i++) {
          const date = new Date(rangeStart);
          date.setDate(rangeStart.getDate() + i);
          const dateStr = date.toLocaleDateString('id-ID');
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
        const newsQuery = query(
          collection(db, 'news'),
          where('createdAt', '>=', rangeStart),
          where('createdAt', '<=', today)
        );
        const newsSnapshot = await getDocs(newsQuery);
        newsSnapshot.forEach(doc => {
          const createdAt = doc.data().createdAt?.toDate();
          if (createdAt) {
            const dateStr = createdAt.toLocaleDateString('id-ID');
            if (newsTrends[dateStr] !== undefined) {
              newsTrends[dateStr]++;
              data.find(d => d.fullDate === dateStr).news++;
              viewsTrends[dateStr] += doc.data().views || 0;
              data.find(d => d.fullDate === dateStr).views += doc.data().views || 0;
            }
          }
        });

        // Fetch comments
        const commentsQuery = query(
          collectionGroup(db, 'comments'),
          where('createdAt', '>=', rangeStart),
          where('createdAt', '<=', today)
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        commentsSnapshot.forEach(doc => {
          const createdAt = doc.data().createdAt?.toDate();
          if (createdAt) {
            const dateStr = createdAt.toLocaleDateString('id-ID');
            if (commentsTrends[dateStr] !== undefined) {
              commentsTrends[dateStr]++;
              data.find(d => d.fullDate === dateStr).comments++;
            }
          }
        });

        // Fetch users
        const usersQuery = query(
          collection(db, 'users'),
          where('createdAt', '>=', rangeStart),
          where('createdAt', '<=', today)
        );
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.forEach(doc => {
          const createdAt = doc.data().createdAt?.toDate();
          if (createdAt) {
            const dateStr = createdAt.toLocaleDateString('id-ID');
            if (usersTrends[dateStr] !== undefined) {
              usersTrends[dateStr]++;
              data.find(d => d.fullDate === dateStr).users++;
            }
          }
        });

        // Fetch reports
        const reportsQuery = query(
          collection(db, 'reports'),
          where('createdAt', '>=', rangeStart),
          where('createdAt', '<=', today)
        );
        const reportsSnapshot = await getDocs(reportsQuery);
        reportsSnapshot.forEach(doc => {
          const createdAt = doc.data().createdAt?.toDate();
          if (createdAt) {
            const dateStr = createdAt.toLocaleDateString('id-ID');
            if (reportsTrends[dateStr] !== undefined) {
              reportsTrends[dateStr]++;
              data.find(d => d.fullDate === dateStr).reports++;
            }
          }
        });

        setTrends({
          news: newsTrends,
          comments: commentsTrends,
          views: viewsTrends,
          users: usersTrends,
          reports: reportsTrends
        });
        setChartData(data);
        if (typeof logActivity === 'function') {
          await logActivity('FETCH_TRENDS_SUCCESS', { metrics: ['news', 'comments', 'views', 'users', 'reports'], timeRange });
        }
      } catch (error) {
        console.error('Error fetching trends data:', error);
        if (typeof logActivity === 'function') {
          await logActivity('FETCH_TRENDS_ERROR', { error: error.message, timeRange });
        } else {
          console.warn('logActivity is not a function, skipping error logging');
        }
        toast.error('Gagal memuat data tren.');
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendsData();
  }, [isAuthorized, activeTab, logActivity, timeRange]);

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
              <p className="text-gray-500 text-sm">Analisis tren konten dan engagement</p>
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
                const avg = Math.round(total / chartData.length);
                return (
                  <motion.div
                    key={metric.key}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
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
      </div>
    </div>
  );
};

export default TrendsChart;