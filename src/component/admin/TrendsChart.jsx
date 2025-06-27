import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { db } from '../../firebaseconfig';
import { collection, getDocs, query, where, collectionGroup } from 'firebase/firestore';

const TrendsChart = ({ isAuthorized, activeTab }) => {
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [trends, setTrends] = useState({
    news: {},
    comments: {},
    views: {},
    users: {}
  });

  // Fetch trends data
  useEffect(() => {
    if (!isAuthorized || activeTab !== 'dashboard') {
      setTrends({
        news: {},
        comments: {},
        views: {},
        users: {}
      });
      if (chartInstance) {
        chartInstance.destroy();
        setChartInstance(null);
      }
      return;
    }

    const fetchTrends = async () => {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      try {
        // Fetch news trends - also store for views calculation
        const newsQuery = query(collection(db, 'news'), where('createdAt', '>=', sevenDaysAgo));
        const newsSnapshot = await getDocs(newsQuery);
        const newsTrends = {};
        const viewsTrends = {};
        
        newsSnapshot.docs.forEach(doc => {
          const date = doc.data().createdAt.toDate().toLocaleDateString();
          const views = doc.data().views || 0;
          
          // Count news per date
          newsTrends[date] = (newsTrends[date] || 0) + 1;
          
          // Sum views per date (only from news created in last 7 days)
          viewsTrends[date] = (viewsTrends[date] || 0) + views;
        });

        // Fetch comments trends
        const commentsQuery = query(collectionGroup(db, 'comments'), where('createdAt', '>=', sevenDaysAgo));
        const commentsSnapshot = await getDocs(commentsQuery);
        const commentsTrends = {};
        commentsSnapshot.docs.forEach(doc => {
          const date = doc.data().createdAt.toDate().toLocaleDateString();
          commentsTrends[date] = (commentsTrends[date] || 0) + 1;
        });

        // Fetch users trends
        const usersSnapshot = await getDocs(query(collection(db, 'users'), where('createdAt', '>=', sevenDaysAgo)));
        const usersTrends = {};
        usersSnapshot.docs.forEach(doc => {
          const date = doc.data().createdAt.toDate().toLocaleDateString();
          usersTrends[date] = (usersTrends[date] || 0) + 1;
        });

        setTrends({
          news: newsTrends,
          comments: commentsTrends,
          views: viewsTrends, // Now properly filtered by date
          users: usersTrends
        });
      } catch (error) {
        console.error('Error fetching trends:', error);
        if (error.message.includes('index')) {
          console.log('Missing index for trends query. Create it here:', error.message.match(/https:\/\/.*$/)[0]);
        }
      }
    };

    fetchTrends();
  }, [isAuthorized, activeTab]);

  // Handle chart rendering
  useEffect(() => {
    if (!isAuthorized || activeTab !== 'dashboard' || !chartRef.current) return;

    const today = new Date();
    const labels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString();
    });
    
    const newsData = labels.map(date => trends.news[date] || 0);
    const commentsData = labels.map(date => trends.comments[date] || 0);
    const viewsData = labels.map(date => trends.views[date] || 0);
    const usersData = labels.map(date => trends.users[date] || 0);

    // Destroy existing chart instance if it exists
    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    const newChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'News',
            data: newsData,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Comments',
            data: commentsData,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Views',
            data: viewsData,
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Users',
            data: usersData,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Tanggal'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Jumlah'
            },
            beginAtZero: true
          }
        }
      }
    });
    setChartInstance(newChartInstance);

    // Cleanup on unmount or dependency change
    return () => {
      if (newChartInstance) {
        newChartInstance.destroy();
        setChartInstance(null);
      }
    };
  }, [isAuthorized, activeTab, trends]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Perkembangan 7 Hari Terakhir</h3>
      <div className="relative h-64">
        <canvas ref={chartRef} className="w-full h-full"></canvas>
      </div>
    </div>
  );
};

export default TrendsChart;