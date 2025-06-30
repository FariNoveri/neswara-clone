import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseconfig';
import { collection, query, onSnapshot, where, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../auth/useAuth';

// Popup Component
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${getIconColor()}`}>
            {type === 'success' && '✓'}
            {type === 'error' && '✕'}
            {type === 'warning' && '⚠'}
            {type === 'confirm' && '?'}
            {type === 'info' && 'ℹ'}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          {type === 'confirm' ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${getButtonColor()}`}
              >
                Konfirmasi
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${getButtonColor()}`}
            >
              OK
            </button>
          )}
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

  const showPopup = (title, message, type = 'info', onConfirm = null) => {
    setPopup({ isOpen: true, title, message, type, onConfirm });
  };

  const closePopup = () => {
    setPopup(prev => ({ ...prev, isOpen: false }));
  };

  // Fetch users from Authentication
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
      console.log('Auth Users:', data.users); // Log for debugging
      setAuthUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching auth users:', error);
    }
  };

  // Combine Firestore and Auth users
  const combineUsers = () => {
    const firestoreUserMap = new Map();
    const authUserMap = new Map();

    // Map Firestore users by uid
    users.forEach(user => {
      if (user.id) {
        firestoreUserMap.set(user.id, user);
      } else {
        console.warn('Firestore user with missing ID:', user);
      }
    });

    // Map Auth users by uid
    authUsers.forEach(user => {
      if (user.uid) {
        authUserMap.set(user.uid, user);
      } else {
        console.warn('Auth user with missing UID:', user);
      }
    });

    // Get all unique UIDs
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

  const [editUserId, setEditUserId] = useState(null);
  const [editForm, setEditForm] = useState({ email: '', displayName: '' });

  // Fetch Firestore users
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
      console.log('Firestore Users:', usersData); // Log for debugging
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterDate, filterCustomDate]);

  // Fetch auth users when component mounts and when users change
  useEffect(() => {
    if (currentUser && isAdmin) {
      fetchAuthUsers();
    }
  }, [currentUser, isAdmin]);

  // Combine users when either source changes
  useEffect(() => {
    if (users.length > 0 || authUsers.length > 0) {
      combineUsers();
    }
  }, [users, authUsers]);

  // Filter combined users
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
    
    // Tambahkan pembaruan real-time setelah save
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

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Status Sinkronisasi</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{combinedUsers.filter(u => u.source.inFirestore && u.source.inAuth).length}</div>
            <div className="text-gray-600">Tersinkronisasi</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{combinedUsers.filter(u => u.source.inFirestore && !u.source.inAuth).length}</div>
            <div className="text-gray-600">Firestore Saja</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{combinedUsers.filter(u => !u.source.inFirestore && u.source.inAuth).length}</div>
            <div className="text-gray-600">Auth Saja</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{combinedUsers.length}</div>
            <div className="text-gray-600">Total Users</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          <input
            type="text"
            placeholder="Filter by Email"
            value={filterEmail}
            onChange={(e) => handleFilterChange('email', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            placeholder="Filter by Nama"
            value={filterName}
            onChange={(e) => handleFilterChange('name', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={filterRole}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select
            value={filterEmailVerified}
            onChange={(e) => handleFilterChange('emailVerified', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Semua Status</option>
            <option value="verified">Email Verified</option>
            <option value="unverified">Email Unverified</option>
          </select>
          <select
            value={filterSource}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
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
            className="px-3 py-2 border border-gray-300 rounded-lg"
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
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sumber Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Tidak ada pengguna ditemukan</td>
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
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-blue-800">
                        {editUserId === user.id ? (
                          <input
                            type="text"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded bg-gray-100 text-gray-900"
                          />
                        ) : (
                          user.email || 'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-800">
                        {editUserId === user.id ? (
                          <input
                            type="text"
                            value={editForm.displayName}
                            onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded bg-gray-100 text-gray-900"
                          />
                        ) : (
                          user.displayName || 'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-800">
                        <select
                          value={user.isAdmin ? 'admin' : 'user'}
                          onChange={(e) => handleEditRole(user.id, e.target.value === 'admin')}
                          className="px-2 py-1 border border-gray-300 rounded bg-gray-100 text-purple-800"
                          disabled={!isAdmin}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${verificationStatus.color}`}>
                          {verificationStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${sourceStatus.color}`}>
                          {sourceStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        <div className="flex flex-wrap gap-1">
                          {editUserId === user.id ? (
                            <>
                              <button
                                onClick={handleEditSave}
                                className="text-green-500 hover:text-green-700 px-2 py-1 text-xs"
                                disabled={!isAdmin && user.email !== currentUserEmail}
                              >
                                Simpan
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="text-red-500 hover:text-red-700 px-2 py-1 text-xs"
                              >
                                Batal
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditClick(user)}
                                className="text-blue-500 hover:text-blue-700 px-2 py-1 text-xs"
                                disabled={!isAdmin && user.email !== currentUserEmail}
                              >
                                Edit
                              </button>
                              {!user.source.inFirestore && user.source.inAuth && isAdmin && (
                                <button
                                  onClick={() => handleSyncToFirestore(user)}
                                  className="text-purple-500 hover:text-purple-700 px-2 py-1 text-xs"
                                >
                                  Sync
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="text-red-500 hover:text-red-700 px-2 py-1 text-xs"
                                disabled={!isAdmin}
                              >
                                Hapus
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
  );
};

export default UserManagement;