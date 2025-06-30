import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseconfig';
import { collection, query, onSnapshot, where, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../auth/useAuth';
import { Edit3, Trash2, RefreshCw, CheckCircle, X } from 'lucide-react';

const Popup = ({ isOpen, onClose, title, message, type = 'info', onConfirm }) => {
  if (!isOpen) return null;

  const getButtonColor = () => {
    switch (type) {
      case 'success': return 'bg-green-500 hover:bg-green-600';
      case 'error': return 'bg-red-500 hover:bg-red-600';
      case 'warning': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'confirm': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'confirm': return 'text-blue-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl transform animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${getIconColor()}`}>
            {type === 'success' && <CheckCircle className="w-6 h-6" />}
            {type === 'error' && <X className="w-6 h-6" />}
            {type === 'warning' && <span>⚠</span>}
            {type === 'confirm' && <span>?</span>}
            {type === 'info' && <span>ℹ</span>}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-center space-x-4">
            {type === 'confirm' ? (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-medium hover:scale-105 transform"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-6 py-3 text-white rounded-xl transition-all duration-200 font-medium hover:scale-105 transform shadow-lg ${getButtonColor()}`}
                >
                  Konfirmasi
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className={`px-6 py-3 text-white rounded-xl transition-all duration-200 font-medium hover:scale-105 transform shadow-lg ${getButtonColor()}`}
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagement = ({ logActivity, adminEmails }) => {
  const [users, setUsers] = useState([]);
  const [authUsers, setAuthUsers] = useState([]);
  const [combinedUsers, setCombinedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterEmail, setFilterEmail] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [filterCustomDate, setFilterCustomDate] = useState('');
  const [filterEmailVerified, setFilterEmailVerified] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const { currentUser } = useAuth();
  const [currentUserEmail, setCurrentUserEmail] = useState(currentUser?.email || '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [popup, setPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
  });
  const [editUserId, setEditUserId] = useState(null);
  const [editForm, setEditForm] = useState({ email: '', displayName: '' });

  const showPopup = (title, message, type = 'info', onConfirm = null) => {
    setPopup({ isOpen: true, title, message, type, onConfirm });
  };

  const closePopup = () => {
    setPopup(prev => ({ ...prev, isOpen: false }));
  };

  const fetchAuthUsers = async () => {
    if (!currentUser) return;
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch('http://localhost:3001/list-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      console.log('Auth Users:', data.users);
      setAuthUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching auth users:', error);
    }
  };

  const combineUsers = () => {
    const firestoreUserMap = new Map();
    const authUserMap = new Map();

    users.forEach(user => {
      if (user.id) {
        firestoreUserMap.set(user.id, user);
      } else {
        console.warn('Firestore user with missing ID:', user);
      }
    });

    authUsers.forEach(user => {
      if (user.uid) {
        authUserMap.set(user.uid, user);
      } else {
        console.warn('Auth user with missing UID:', user);
      }
    });

    const allUids = new Set([...firestoreUserMap.keys(), ...authUserMap.keys()]);
    console.log('Unique UIDs:', allUids.size, 'Firestore users:', firestoreUserMap.size, 'Auth users:', authUserMap.size);

    const combined = Array.from(allUids).map(uid => {
      if (!uid) {
        console.warn('Invalid UID encountered:', uid);
        return null;
      }
      const firestoreUser = firestoreUserMap.get(uid);
      const authUser = authUserMap.get(uid);

      return {
        id: uid,
        email: firestoreUser?.email || authUser?.email || 'N/A',
        displayName: firestoreUser?.displayName || authUser?.displayName || 'N/A',
        isAdmin: firestoreUser?.isAdmin || false,
        emailVerified: firestoreUser?.emailVerified !== undefined ? firestoreUser.emailVerified : authUser?.emailVerified,
        updatedAt: firestoreUser?.updatedAt || (authUser?.metadata?.creationTime ? new Date(authUser.metadata.creationTime).toISOString().split('T')[0] : null),
        createdAt: authUser?.metadata?.creationTime || null,
        lastSignInTime: authUser?.metadata?.lastSignInTime || null,
        source: {
          inFirestore: !!firestoreUser,
          inAuth: !!authUser,
        },
        disabled: authUser?.disabled || false,
        customClaims: authUser?.customClaims || {},
      };
    }).filter(user => user !== null);

    setCombinedUsers(combined);
  };

  useEffect(() => {
    setCurrentUserEmail(currentUser?.email || '');
    if (currentUser?.uid) {
      const userRef = doc(db, 'users', currentUser.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (isInitialLoad && adminEmails && adminEmails.includes(currentUser.email)) {
            if (userData.isAdmin !== true) {
              updateDoc(userRef, {
                isAdmin: true,
                updatedAt: new Date().toISOString().split('T')[0],
              })
                .then(() => {
                  console.log('Admin status corrected for:', currentUser.email);
                  setIsAdmin(true);
                })
                .catch(error => {
                  console.error('Error correcting admin status:', error);
                  setIsAdmin(userData.isAdmin === true);
                });
            } else {
              setIsAdmin(true);
            }
          } else {
            setIsAdmin(userData.isAdmin === true);
          }
          console.log('Real-time Admin status:', userData.isAdmin, 'for email:', currentUser.email, 'UID:', currentUser.uid);
          setIsInitialLoad(false);
        } else {
          console.log('User document not found for UID:', currentUser.uid);
          setIsAdmin(false);
          setIsInitialLoad(false);
        }
      }, (error) => {
        console.error('Error fetching admin status:', error);
        setIsAdmin(false);
        setIsInitialLoad(false);
      });
      return () => unsubscribe();
    }
  }, [currentUser, adminEmails]);

  useEffect(() => {
    setLoading(true);
    let q = query(collection(db, 'users'));

    if (filterDate === 'last7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      q = query(q, where('updatedAt', '>=', sevenDaysAgo.toISOString().split('T')[0]));
    } else if (filterDate === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      q = query(q, where('updatedAt', '>=', thirtyDaysAgo.toISOString().split('T')[0]));
    } else if (filterDate === 'custom' && filterCustomDate) {
      const customDate = new Date(filterCustomDate).toISOString().split('T')[0];
      q = query(q, where('updatedAt', '>=', customDate));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Firestore Users:', usersData);
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterDate, filterCustomDate]);

  useEffect(() => {
    if (currentUser && isAdmin) {
      fetchAuthUsers();
    }
  }, [currentUser, isAdmin]);

  useEffect(() => {
    if (users.length > 0 || authUsers.length > 0) {
      combineUsers();
    }
  }, [users, authUsers]);

  const filteredUsers = combinedUsers.filter(user => {
    const matchesEmail = !filterEmail || user.email?.toLowerCase().includes(filterEmail.toLowerCase());
    const matchesName = !filterName || user.displayName?.toLowerCase().includes(filterName.toLowerCase());
    const matchesRole = filterRole === 'all' || 
                       (filterRole === 'admin' && user.isAdmin === true) ||
                       (filterRole === 'user' && user.isAdmin !== true);
    const matchesEmailVerified = filterEmailVerified === 'all' ||
                               (filterEmailVerified === 'verified' && user.emailVerified === true) ||
                               (filterEmailVerified === 'unverified' && user.emailVerified !== true);
    const matchesSource = filterSource === 'all' ||
                         (filterSource === 'both' && user.source.inFirestore && user.source.inAuth) ||
                         (filterSource === 'firestore' && user.source.inFirestore) ||
                         (filterSource === 'auth' && user.source.inAuth) ||
                         (filterSource === 'missing' && (!user.source.inFirestore || !user.source.inAuth));

    return matchesEmail && matchesName && matchesRole && matchesEmailVerified && matchesSource;
  }).sort((a, b) => a.email.localeCompare(b.email));

  const handleFilterChange = (type, value) => {
    switch (type) {
      case 'email': setFilterEmail(value); break;
      case 'name': setFilterName(value); break;
      case 'role': setFilterRole(value); break;
      case 'date': setFilterDate(value); break;
      case 'customDate': setFilterCustomDate(value); break;
      case 'emailVerified': setFilterEmailVerified(value); break;
      case 'source': setFilterSource(value); break;
    }
  };

  const handleSyncToFirestore = async (user) => {
    if (!isAdmin) {
      showPopup('Akses Ditolak', 'Hanya admin yang bisa sinkronisasi pengguna.', 'error');
      return;
    }

    showPopup(
      'Konfirmasi Sinkronisasi',
      'Yakin ingin menambahkan pengguna ini ke Firestore?',
      'confirm',
      async () => {
        try {
          const userRef = doc(db, 'users', user.id);
          await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName || '',
            isAdmin: false,
            emailVerified: user.emailVerified || false,
            updatedAt: new Date().toISOString().split('T')[0],
            createdAt: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          });
          
          logActivity('USER_SYNC', { userId: user.id, email: user.email, action: 'sync_to_firestore' });
          showPopup('Berhasil', 'Pengguna berhasil ditambahkan ke Firestore.', 'success');
        } catch (error) {
          console.error('Error syncing user to Firestore:', error);
          showPopup('Error', 'Gagal menambahkan pengguna ke Firestore: ' + error.message, 'error');
        }
      }
    );
  };

  const handleDelete = async (userId) => {
    if (!isAdmin) {
      showPopup('Akses Ditolak', 'Hanya admin yang bisa menghapus pengguna.', 'error');
      return;
    }

    if (userId === currentUser.uid) {
      showPopup('Error', 'Anda tidak dapat menghapus akun Anda sendiri.', 'error');
      return;
    }

    const user = combinedUsers.find(u => u.id === userId);
    const deleteOptions = [];
    
    if (user.source.inFirestore) deleteOptions.push('Firestore');
    if (user.source.inAuth) deleteOptions.push('Authentication');

    showPopup(
      'Konfirmasi Hapus',
      `Yakin ingin menghapus pengguna ini dari ${deleteOptions.join(' dan ')}?`,
      'confirm',
      async () => {
        try {
          if (user.source.inFirestore) {
            const userRef = doc(db, 'users', userId);
            await deleteDoc(userRef);
            console.log('User deleted from Firestore:', userId);
          }

          if (user.source.inAuth) {
            const idToken = await currentUser.getIdToken();
            const response = await fetch('http://localhost:3001/delete-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ uid: userId, idToken }),
            });

            const responseData = await response.json();
            if (!response.ok) {
              throw new Error(responseData.message || 'Gagal menghapus pengguna dari Firebase Authentication.');
            }
            console.log('User deleted from Authentication:', responseData);
          }

          logActivity('USER_DELETE', { userId: user.id, email: user.email, source: deleteOptions.join(' dan ') });
          showPopup('Berhasil', `Pengguna berhasil dihapus dari ${deleteOptions.join(' dan ')}.`, 'success');
          await fetchAuthUsers();
        } catch (error) {
          console.error('Error deleting user:', error);
          showPopup('Error', `Gagal menghapus pengguna: ${error.message}`, 'error');
        }
      }
    );
  };

  const handleEditClick = (user) => {
    if (!isAdmin && user.email !== currentUserEmail) {
      showPopup('Akses Ditolak', 'Hanya admin atau pemilik akun yang bisa mengedit.', 'error');
      return;
    }
    setEditUserId(user.id);
    setEditForm({ email: user.email || '', displayName: user.displayName || '' });
  };

  const handleEditSave = async () => {
    const user = combinedUsers.find(u => u.id === editUserId);
    if (!isAdmin && user?.email !== currentUserEmail) {
      showPopup('Akses Ditolak', 'Hanya admin atau pemilik akun yang bisa mengedit.', 'error');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', editUserId);
      if (user.source.inFirestore) {
        await updateDoc(userRef, {
          email: editForm.email,
          displayName: editForm.displayName,
          updatedAt: new Date().toISOString().split('T')[0],
        });
      } else {
        await setDoc(userRef, {
          email: editForm.email,
          displayName: editForm.displayName,
          isAdmin: false,
          emailVerified: user.emailVerified || false,
          updatedAt: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString().split('T')[0],
        });
      }
      
      const updatedDoc = await getDoc(userRef);
      if (updatedDoc.exists()) {
        const updatedData = updatedDoc.data();
        setCombinedUsers(prevUsers =>
          prevUsers.map(u => u.id === editUserId ? { ...u, email: updatedData.email, displayName: updatedData.displayName } : u)
        );
      }
      
      logActivity('USER_EDIT', { userId: editUserId, email: editForm.email, displayName: editForm.displayName });
      setEditUserId(null);
      setEditForm({ email: '', displayName: '' });
      showPopup('Berhasil', 'Perubahan berhasil disimpan.', 'success');
    } catch (error) {
      console.error('Error updating user:', error);
      showPopup('Error', 'Gagal menyimpan perubahan: ' + error.message, 'error');
    }
  };

  const handleEditRole = async (userId, isAdminRole) => {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const currentIsAdmin = userDoc.exists() ? userDoc.data().isAdmin : false;
    
    if (!currentIsAdmin) {
      showPopup('Akses Ditolak', 'Hanya admin yang bisa mengedit role.', 'error');
      return;
    }
    
    showPopup(
      'Konfirmasi Ubah Role',
      `Yakin ingin mengubah role pengguna ini menjadi ${isAdminRole ? 'Admin' : 'User'}?`,
      'confirm',
      async () => {
        try {
          const user = combinedUsers.find(u => u.id === userId);
          const userRef = doc(db, 'users', userId);
          
          if (user.source.inFirestore) {
            await updateDoc(userRef, {
              isAdmin: isAdminRole,
              updatedAt: new Date().toISOString().split('T')[0],
            });
          } else {
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName || '',
              isAdmin: isAdminRole,
              emailVerified: user.emailVerified || false,
              updatedAt: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString().split('T')[0],
            });
          }
          
          logActivity('USER_ROLE_UPDATE', { userId: userId, email: user.email, newRole: isAdminRole ? 'admin' : 'user' });
          showPopup('Berhasil', 'Role berhasil diperbarui.', 'success');
        } catch (error) {
          console.error('Error updating role:', error);
          showPopup('Error', 'Gagal memperbarui role: ' + error.message, 'error');
        }
      }
    );
  };

  const handleEditCancel = () => {
    setEditUserId(null);
    setEditForm({ email: '', displayName: '' });
  };

  const getVerificationStatus = (user) => {
    if (user.emailVerified === true) {
      return { text: 'Verified', color: 'text-green-600 bg-green-100' };
    } else if (user.emailVerified === false) {
      return { text: 'Unverified', color: 'text-red-600 bg-red-100' };
    } else {
      return { text: 'Unknown', color: 'text-gray-600 bg-gray-100' };
    }
  };

  const getSourceStatus = (user) => {
    if (user.source.inFirestore && user.source.inAuth) {
      return { text: 'Both', color: 'text-green-600 bg-green-100' };
    } else if (user.source.inFirestore) {
      return { text: 'Firestore Only', color: 'text-blue-600 bg-blue-100' };
    } else if (user.source.inAuth) {
      return { text: 'Auth Only', color: 'text-orange-600 bg-orange-100' };
    } else {
      return { text: 'Unknown', color: 'text-gray-600 bg-gray-100' };
    }
  };

  const getRoleText = (user) => {
    return user.isAdmin ? 'Admin' : 'User';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center space-x-4 animate-slideRight">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Manajemen Pengguna</h1>
              <p className="text-indigo-100 text-lg">Kelola dan pantau semua pengguna</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8 animate-slideUp">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Filter by Email"
              value={filterEmail}
              onChange={(e) => handleFilterChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
            />
            <input
              type="text"
              placeholder="Filter by Nama"
              value={filterName}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
            />
            <select
              value={filterRole}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-gray-900"
            >
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <select
              value={filterEmailVerified}
              onChange={(e) => handleFilterChange('emailVerified', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-gray-900"
            >
              <option value="all">Semua Status</option>
              <option value="verified">Email Verified</option>
              <option value="unverified">Email Unverified</option>
            </select>
            <select
              value={filterSource}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-gray-900"
            >
              <option value="all">Semua Sumber</option>
              <option value="both">Tersinkronisasi</option>
              <option value="firestore">Firestore Saja</option>
              <option value="auth">Auth Saja</option>
              <option value="missing">Belum Sinkron</option>
            </select>
            <select
              value={filterDate}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-gray-900"
            >
              <option value="all">Semua Tanggal</option>
              <option value="last7days">7 Hari Terakhir</option>
              <option value="last30days">30 Hari Terakhir</option>
              <option value="custom">Tanggal Kustom</option>
            </select>
            {filterDate === 'custom' && (
              <input
                type="date"
                value={filterCustomDate}
                onChange={(e) => handleFilterChange('customDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-gray-900"
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8 animate-slideUp">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Status Sinkronisasi</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{combinedUsers.filter(u => u.source.inFirestore && u.source.inAuth).length}</div>
              <div className="text-gray-600">Tersinkronisasi</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{combinedUsers.filter(u => u.source.inFirestore && !u.source.inAuth).length}</div>
              <div className="text-gray-600">Firestore Saja</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{combinedUsers.filter(u => !u.source.inFirestore && u.source.inAuth).length}</div>
              <div className="text-gray-600">Auth Saja</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{combinedUsers.length}</div>
              <div className="text-gray-600">Total Users</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slideUp">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sumber Data</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin"></div>
                          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      Tidak ada pengguna ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => {
                    if (!user.id) {
                      console.warn('User with missing ID:', user);
                      return null;
                    }
                    const verificationStatus = getVerificationStatus(user);
                    const sourceStatus = getSourceStatus(user);
                    return (
                      <tr key={user.id} className={`hover:bg-gray-50 transition-all duration-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} transform hover:scale-[1.01] animate-fadeInUp`} style={{ animationDelay: `${index * 0.1}s` }}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {editUserId === user.id ? (
                            <input
                              type="text"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-100 text-gray-900"
                            />
                          ) : (
                            user.email || 'N/A'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {editUserId === user.id ? (
                            <input
                              type="text"
                              value={editForm.displayName}
                              onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-100 text-gray-900"
                            />
                          ) : (
                            user.displayName || 'N/A'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {editUserId === user.id ? (
                            <select
                              value={user.isAdmin ? 'admin' : 'user'}
                              onChange={(e) => handleEditRole(user.id, e.target.value === 'admin')}
                              className="w-full min-w-[120px] px-3 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              disabled={!isAdmin}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-900 rounded-lg">{getRoleText(user)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${verificationStatus.color}`}>
                            {verificationStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${sourceStatus.color}`}>
                            {sourceStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-3">
                            {editUserId === user.id ? (
                              <>
                                <button
                                  onClick={handleEditSave}
                                  className="p-2 hover:bg-green-50 rounded-lg transition-all duration-200 group"
                                  disabled={!isAdmin && user.email !== currentUserEmail}
                                >
                                  <CheckCircle className="w-5 h-5 text-green-600 group-hover:text-green-800" />
                                </button>
                                <button
                                  onClick={handleEditCancel}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                                >
                                  <X className="w-5 h-5 text-red-600 group-hover:text-red-800" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditClick(user)}
                                  className="p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200 group"
                                  disabled={!isAdmin && user.email !== currentUserEmail}
                                >
                                  <Edit3 className="w-5 h-5 text-indigo-600 group-hover:text-indigo-800" />
                                </button>
                                {!user.source.inFirestore && user.source.inAuth && isAdmin && (
                                  <button
                                    onClick={() => handleSyncToFirestore(user)}
                                    className="p-2 hover:bg-purple-50 rounded-lg transition-all duration-200 group"
                                  >
                                    <RefreshCw className="w-5 h-5 text-purple-600 group-hover:text-purple-800" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                                  disabled={!isAdmin}
                                >
                                  <Trash2 className="w-5 h-5 text-red-600 group-hover:text-red-800" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }).filter(row => row !== null)
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Popup
          isOpen={popup.isOpen}
          onClose={closePopup}
          title={popup.title}
          message={popup.message}
          type={popup.type}
          onConfirm={popup.onConfirm}
        />
      </div>
    </div>
  );
};

export default UserManagement;

<style jsx>{`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  @keyframes slideRight {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
  
  .animate-scaleIn {
    animation: scaleIn 0.3s ease-out;
  }
  
  .animate-slideRight {
    animation: slideRight 0.3s ease-out;
  }
  
  .animate-fadeInUp {
    animation: fadeIn 0.3s ease-out;
  }

  /* Penyesuaian untuk kolom Role */
  td:nth-child(3) {
    min-width: 150px; /* Increased minimum width to accommodate select dropdown */
    padding-right: 16px; /* Ensure enough padding */
  }

  td:nth-child(3) span {
    white-space: nowrap; /* Prevent text wrapping */
  }

  /* Penyesuaian untuk elemen select di mode edit */
  td:nth-child(3) select {
    width: 100%;
    min-width: 120px; /* Ensure dropdown has enough width */
    padding: 8px; /* Consistent padding */
    box-sizing: border-box; /* Ensure padding is included in width calculation */
    appearance: auto; /* Ensure default browser styling for dropdown arrow */
  }
`}</style>