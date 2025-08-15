import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../firebaseconfig';
import { collection, query, onSnapshot, where, doc, updateDoc, deleteDoc, getDoc, setDoc, addDoc, Timestamp, setLogLevel } from 'firebase/firestore';
import { useAuth } from '../auth/useAuth';
import { Edit3, Trash2, RefreshCw, CheckCircle, X, History } from 'lucide-react';
import validator from 'validator';

// Enable Firestore debug logging for diagnostics (disable in production)
setLogLevel('debug');

// Utility function for retrying API calls
const withRetry = async (fn, maxAttempts = 3, delayMs = 1000) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Retry attempt ${attempt} failed:`, error);
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
};

// Popup component for displaying messages
const Popup = ({ isOpen, onClose, title, message, type = 'info', onConfirm, isAnimating }) => {
  if (!isOpen) return null;

  const handleClose = (e) => {
    e?.stopPropagation();
    onClose();
  };

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
    <div 
      className={`fixed inset-0 z-50 overflow-y-auto transition-all duration-300 ${
        isAnimating ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={handleClose} 
      role="dialog" 
      aria-labelledby="popup-title"
    >
      <div 
        className={`relative w-full max-w-sm mx-auto my-8 transform transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${getIconColor()}`}>
                {type === 'success' && <CheckCircle className="w-6 h-6" />}
                {type === 'error' && <X className="w-6 h-6" />}
                {type === 'warning' && <span>⚠</span>}
                {type === 'confirm' && <span>?</span>}
                {type === 'info' && <span>ℹ</span>}
              </div>
              <h3 id="popup-title" className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="flex justify-center space-x-4">
                {type === 'confirm' ? (
                  <>
                    <button
                      onClick={handleClose}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-medium hover:scale-105 transform"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => {
                        onConfirm();
                        handleClose();
                      }}
                      className={`px-6 py-3 text-white rounded-xl transition-all duration-200 font-medium hover:scale-105 transform shadow-lg ${getButtonColor()}`}
                    >
                      Konfirmasi
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleClose}
                    className={`px-6 py-3 text-white rounded-xl transition-all duration-200 font-medium hover:scale-105 transform shadow-lg ${getButtonColor()}`}
                  >
                    OK
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// EditHistoryPopup component
const EditHistoryPopup = ({ isOpen, onClose, userId, profileEdits, isAnimating }) => {
  if (!isOpen) return null;

  const handleClose = (e) => {
    e?.stopPropagation();
    console.log('Closing EditHistoryPopup, userId:', userId);
    onClose();
  };

  const handleModalClick = (e) => {
    e?.stopPropagation();
    console.log('Click inside EditHistoryPopup, preventing propagation');
  };

  const getEditDescription = (edit) => {
    switch (edit.type) {
      case 'displayName':
        return edit.beforeName && edit.newName
          ? `Nama diubah dari "${edit.beforeName}" ke "${edit.newName}"`
          : 'Nama diubah';
      case 'email':
        return edit.emailBefore && edit.emailAfter
          ? `Email diubah dari "${edit.emailBefore}" ke "${edit.emailAfter}"`
          : 'Email diubah';
      case 'password':
        return 'Password diubah';
      case 'photoURL':
        return 'Foto profil diubah';
      case 'role':
        return `Role diubah menjadi ${edit.isAdmin ? 'Admin' : 'User'}`;
      case 'auth_profile':
        return 'Profil autentikasi diubah';
      default:
        return edit.type.charAt(0).toUpperCase() + edit.type.slice(1);
    }
  };

  const userEdits = profileEdits[userId] || [];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isAnimating ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={handleClose}
      role="dialog"
      aria-labelledby="edit-history-title"
    >
      <div
        className={`relative w-full max-w-4xl bg-white rounded-2xl p-8 shadow-2xl border border-gray-100 transform transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={handleModalClick}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 id="edit-history-title" className="text-xl font-bold text-gray-900 flex items-center">
            <History className="w-6 h-6 mr-2 text-indigo-600" />
            Riwayat Edit Pengguna
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-all duration-200"
            aria-label="Tutup popup riwayat edit"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {userEdits.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 edit-history-table">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Edit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userEdits
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map((edit, idx) => {
                    let formattedDate = 'N/A';
                    if (edit.timestamp) {
                      if (typeof edit.timestamp.toDate === 'function') {
                        formattedDate = new Date(edit.timestamp.toDate()).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
                      } else if (typeof edit.timestamp === 'string') {
                        formattedDate = new Date(edit.timestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
                      } else if (edit.timestamp instanceof Date) {
                        formattedDate = edit.timestamp.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
                      }
                    }
                    return (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-4 py-3 text-sm text-gray-900">{edit.type.charAt(0).toUpperCase() + edit.type.slice(1)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formattedDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{getEditDescription(edit)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600 text-center py-4">Tidak ada riwayat edit untuk pengguna ini.</p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 font-medium hover:scale-105 transform shadow-lg"
            aria-label="Tutup popup"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// Main UserManagement component
const UserManagement = ({ adminEmails, logActivity }) => {
  const [users, setUsers] = useState([]);
  const [authUsers, setAuthUsers] = useState([]);
  const [combinedUsers, setCombinedUsers] = useState([]);
  const [profileEdits, setProfileEdits] = useState({});
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
  const [editForm, setEditForm] = useState({ email: '', displayName: '', isAdmin: false });
  const [editHistoryPopup, setEditHistoryPopup] = useState({
    isOpen: false,
    userId: null,
  });
  const [isAnimating, setIsAnimating] = useState(false);

  // Show popup
  const showPopup = useCallback((title, message, type = 'info', onConfirm = null) => {
    console.log('Opening Popup:', { title, type });
    setPopup({ isOpen: true, title, message, type, onConfirm });
    setIsAnimating(true);
  }, []);

  // Close popup
  const closePopup = useCallback(() => {
    console.log('Closing Popup');
    setIsAnimating(false);
    setTimeout(() => {
      setPopup(prev => ({ ...prev, isOpen: false }));
    }, 200);
  }, []);

  // Show edit history popup
  const showEditHistoryPopup = useCallback((userId) => {
    console.log('Opening EditHistoryPopup for userId:', userId);
    setEditHistoryPopup({ isOpen: true, userId });
    setIsAnimating(true);
  }, []);

  // Close edit history popup
  const closeEditHistoryPopup = useCallback(() => {
    console.log('Closing EditHistoryPopup');
    setIsAnimating(false);
    setTimeout(() => {
      setEditHistoryPopup({ isOpen: false, userId: null });
    }, 200);
  }, []);

  // Fetch auth users from Firebase Authentication
  const fetchAuthUsers = useCallback(async () => {
    if (!currentUser) {
      console.log('fetchAuthUsers: No current user, skipping');
      return;
    }
    try {
      const idToken = await currentUser.getIdToken(true);
      const response = await withRetry(async () => {
        const res = await fetch('http://localhost:3001/list-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ idToken }),
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      });
      setAuthUsers(response.users || []);
      console.log('fetchAuthUsers: Successfully fetched auth users, count:', response.users?.length || 0);
    } catch (error) {
      console.error('fetchAuthUsers: Error fetching auth users:', error);
      showPopup('Error', 'Gagal memuat pengguna dari Authentication: ' + error.message, 'error');
    }
  }, [currentUser, showPopup]);

  // Fetch profile edits from Firestore
  const fetchProfileEdits = useCallback(async () => {
    if (!currentUser) {
      console.log('fetchProfileEdits: No current user, skipping');
      setProfileEdits({});
      return () => {};
    }
    try {
      const editsQuery = isAdmin ? query(collection(db, 'profile_edits')) : query(collection(db, 'profile_edits'), where('userId', '==', currentUser.uid));
      const unsubscribe = onSnapshot(
        editsQuery,
        (snapshot) => {
          const editsData = {};
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (!editsData[data.userId]) {
              editsData[data.userId] = [];
            }
            editsData[data.userId].push({ ...data, id: doc.id });
          });
          setProfileEdits(editsData);
          console.log('fetchProfileEdits: Successfully fetched profile edits, users:', Object.keys(editsData).length);
        },
        (error) => {
          console.error('fetchProfileEdits: Error in profile edits snapshot listener:', error);
          showPopup('Error', 'Gagal memuat riwayat edit: ' + error.message, 'error');
          setProfileEdits({});
        }
      );
      return () => unsubscribe();
    } catch (error) {
      console.error('fetchProfileEdits: Error setting up profile edits listener:', error);
      showPopup('Error', 'Gagal mengatur listener riwayat edit: ' + error.message, 'error');
      setProfileEdits({});
      return () => {};
    }
  }, [currentUser, isAdmin, showPopup]);

  // Combine Firestore and Authentication users
  const combineUsers = useCallback(() => {
    const firestoreUserMap = new Map();
    const authUserMap = new Map();

    users.forEach(user => {
      if (user.id) {
        firestoreUserMap.set(user.id, user);
      } else {
        console.warn('combineUsers: Firestore user with missing ID:', user);
      }
    });

    authUsers.forEach(user => {
      if (user.uid) {
        authUserMap.set(user.uid, user);
      } else {
        console.warn('combineUsers: Auth user with missing UID:', user);
      }
    });

    const allUids = new Set([...firestoreUserMap.keys(), ...authUserMap.keys()]);

    const combined = Array.from(allUids).map(uid => {
      if (!uid) {
        console.warn('combineUsers: Invalid UID encountered:', uid);
        return null;
      }
      const firestoreUser = firestoreUserMap.get(uid);
      const authUser = authUserMap.get(uid);

      return {
        id: uid,
        email: firestoreUser?.email || authUser?.email || 'N/A',
        displayName: firestoreUser?.displayName || authUser?.displayName || 'N/A',
        isAdmin: firestoreUser?.isAdmin ?? authUser?.customClaims?.isAdmin ?? false,
        role: firestoreUser?.role ?? (firestoreUser?.isAdmin || authUser?.customClaims?.isAdmin ? 'admin' : 'user'),
        emailVerified: firestoreUser?.emailVerified ?? authUser?.emailVerified ?? false,
        createdAt: authUser?.metadata?.creationTime || firestoreUser?.createdAt || null,
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
    console.log('combineUsers: Combined users updated, count:', combined.length);
  }, [users, authUsers]);

  // Check current user's admin status
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('useEffect: No current user, skipping admin check');
      setIsAdmin(false);
      setIsInitialLoad(false);
      return;
    }

    setCurrentUserEmail(currentUser.email || '');
    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      try {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (isInitialLoad && adminEmails?.includes(currentUser.email)) {
            if (userData.isAdmin !== true) {
              await withRetry(async () => {
                await setDoc(userRef, {
                  email: currentUser.email || 'anonymous',
                  isAdmin: true,
                  role: 'admin',
                  createdAt: userData.createdAt || Timestamp.fromDate(new Date()),
                  updatedAt: Timestamp.fromDate(new Date()),
                  emailVerified: currentUser.emailVerified || false,
                }, { merge: true });
              });
              await withRetry(async () => {
                await addDoc(collection(db, 'profile_edits'), {
                  userId: currentUser.uid,
                  type: 'role',
                  isAdmin: true,
                  timestamp: Timestamp.fromDate(new Date()),
                  date: new Date().toISOString().split('T')[0],
                  editedBy: currentUser.uid,
                  ipAddress: '127.0.0.1',
                });
              });
              await logActivity('ROLE_UPDATED', {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                isAdmin: true,
                role: 'admin',
                updatedBy: currentUser.uid,
              });
              setIsAdmin(true);
              console.log('useEffect: Set admin status for current user in Firestore');
            } else {
              setIsAdmin(true);
            }
          } else {
            setIsAdmin(userData.isAdmin === true);
          }
        } else if (isInitialLoad && adminEmails?.includes(currentUser.email)) {
          await withRetry(async () => {
            await setDoc(userRef, {
              email: currentUser.email || 'anonymous',
              isAdmin: true,
              role: 'admin',
              createdAt: Timestamp.fromDate(new Date()),
              updatedAt: Timestamp.fromDate(new Date()),
              emailVerified: currentUser.emailVerified || false,
            });
          });
          await withRetry(async () => {
            await addDoc(collection(db, 'profile_edits'), {
              userId: currentUser.uid,
              type: 'role',
              isAdmin: true,
              timestamp: Timestamp.fromDate(new Date()),
              date: new Date().toISOString().split('T')[0],
              editedBy: currentUser.uid,
              ipAddress: '127.0.0.1',
            });
          });
          await logActivity('ROLE_UPDATED', {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            isAdmin: true,
            role: 'admin',
            updatedBy: currentUser.uid,
          });
          setIsAdmin(true);
          console.log('useEffect: Created admin document for current user');
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('useEffect: Error checking admin status:', error);
        setIsAdmin(false);
        showPopup('Error', `Gagal memuat status admin: ${error.message}`, 'error');
      } finally {
        setIsInitialLoad(false);
      }
    }, (error) => {
      console.error('useEffect: Error fetching admin status:', error);
      setIsAdmin(false);
      setIsInitialLoad(false);
      showPopup('Error', `Gagal memuat status admin: ${error.message}`, 'error');
    });

    return () => unsubscribe();
  }, [currentUser, adminEmails, logActivity, showPopup]);

  // Fetch Firestore users with filters
  useEffect(() => {
    setLoading(true);
    let q = query(collection(db, 'users'));

    if (filterDate === 'last7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)));
    } else if (filterDate === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)));
    } else if (filterDate === 'custom' && filterCustomDate) {
      const customDate = new Date(filterCustomDate);
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(customDate)));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error('useEffect: Error fetching users:', error);
      setLoading(false);
      showPopup('Error', 'Gagal memuat pengguna: ' + error.message, 'error');
    });

    return () => unsubscribe();
  }, [filterDate, filterCustomDate, showPopup]);

  // Fetch auth users and profile edits
  useEffect(() => {
    if (currentUser && isAdmin) {
      fetchAuthUsers();
    }
    if (currentUser) {
      fetchProfileEdits();
    }
  }, [currentUser, isAdmin, fetchAuthUsers, fetchProfileEdits]);

  // Combine users when data changes
  useEffect(() => {
    if (users.length > 0 || authUsers.length > 0) {
      combineUsers();
    }
  }, [users, authUsers, combineUsers]);

  // Filter users based on criteria
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

  // Handle filter changes
  const handleFilterChange = useCallback((type, value) => {
    switch (type) {
      case 'email': setFilterEmail(value); break;
      case 'name': setFilterName(value); break;
      case 'role': setFilterRole(value); break;
      case 'date': setFilterDate(value); break;
      case 'customDate': setFilterCustomDate(value); break;
      case 'emailVerified': setFilterEmailVerified(value); break;
      case 'source': setFilterSource(value); break;
    }
    console.log(`handleFilterChange: Updated filter ${type}=${value}`);
  }, []);

  // Handle role changes
  const handleEditRole = useCallback(async (userId, newIsAdmin) => {
    if (!currentUser) {
      console.log('handleEditRole: No current user, aborting');
      showPopup('Error', 'Silakan masuk untuk mengubah peran pengguna.', 'error');
      return;
    }

    if (!isAdmin) {
      console.log(`handleEditRole: Permission denied for user ${currentUser.uid}, isAdmin: ${isAdmin}`);
      showPopup('Akses Ditolak', 'Hanya admin yang dapat mengubah peran pengguna.', 'error');
      return;
    }

    const user = combinedUsers.find(u => u.id === userId);
    if (!user) {
      console.log(`handleEditRole: User not found, userId: ${userId}`);
      showPopup('Error', 'Pengguna tidak ditemukan.', 'error');
      return;
    }

    if (userId === currentUser.uid) {
      console.log(`handleEditRole: Attempt to change own role, userId: ${userId}`);
      showPopup('Error', 'Anda tidak dapat mengubah peran akun Anda sendiri.', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log(`handleEditRole: Starting role update for userId=${userId}, newIsAdmin=${newIsAdmin}`);
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      // Prepare Firestore update payload
      const updatePayload = {
        isAdmin: newIsAdmin,
        role: newIsAdmin ? 'admin' : 'user',
        updatedAt: Timestamp.fromDate(new Date()),
        createdAt: userDoc.exists() ? userDoc.data().createdAt || Timestamp.fromDate(new Date()) : Timestamp.fromDate(new Date()),
        email: user.email || '',
        displayName: user.displayName || '',
        emailVerified: user.emailVerified || false,
      };

      console.log('handleEditRole: Firestore updatePayload:', updatePayload);

      // Refresh token to avoid 400 Bad Request
      const idToken = await currentUser.getIdToken(true);

      // Update Firestore document
      await withRetry(async () => {
        if (userDoc.exists()) {
          await updateDoc(userRef, updatePayload);
          console.log(`handleEditRole: Updated Firestore document for userId=${userId}`);
        } else {
          await setDoc(userRef, updatePayload);
          console.log(`handleEditRole: Created Firestore document for userId=${userId}`);
        }
      });

      // Verify Firestore update
      const updatedDoc = await getDoc(userRef);
      if (!updatedDoc.exists() || updatedDoc.data().isAdmin !== newIsAdmin) {
        throw new Error('Firestore document update verification failed');
      }
      console.log('handleEditRole: Verified Firestore document:', updatedDoc.data());

      // Update Firebase Authentication custom claims
      try {
        const response = await fetch('http://localhost:3001/set-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ uid: userId, isAdmin: newIsAdmin }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        console.log(`handleEditRole: Updated custom claims for userId=${userId}, isAdmin=${newIsAdmin}`);
      } catch (authError) {
        console.error('handleEditRole: Error updating custom claims:', authError);
        // Rollback Firestore update if auth update fails
        await updateDoc(userRef, {
          isAdmin: user.isAdmin,
          role: user.isAdmin ? 'admin' : 'user',
          updatedAt: Timestamp.fromDate(new Date()),
        });
        throw new Error(`Failed to update auth custom claims: ${authError.message}`);
      }

      // Log profile edit
      await withRetry(async () => {
        await addDoc(collection(db, 'profile_edits'), {
          userId,
          type: 'role',
          isAdmin: newIsAdmin,
          timestamp: Timestamp.fromDate(new Date()),
          date: new Date().toISOString().split('T')[0],
          editedBy: currentUser.uid,
          ipAddress: '127.0.0.1',
          emailBefore: user.email || '',
          emailAfter: user.email || '',
          beforeName: user.displayName || '',
          newName: user.displayName || '',
        });
      });
      console.log(`handleEditRole: Logged role change to profile_edits for userId=${userId}`);

      // Log activity
      await logActivity('ROLE_UPDATED', {
        userId,
        userEmail: user.email,
        isAdmin: newIsAdmin,
        role: newIsAdmin ? 'admin' : 'user',
        updatedBy: currentUser.uid,
      });
      console.log(`handleEditRole: Logged activity for userId=${userId}`);

      // Update local state
      setCombinedUsers(prevUsers =>
        prevUsers.map(u => (u.id === userId ? { ...u, isAdmin: newIsAdmin, role: newIsAdmin ? 'admin' : 'user', customClaims: { ...u.customClaims, isAdmin: newIsAdmin } } : u))
      );

      showPopup('Berhasil', `Peran pengguna berhasil diubah menjadi ${newIsAdmin ? 'Admin' : 'User'}.`, 'success');
      console.log(`handleEditRole: Role update completed for userId=${userId}`);
    } catch (error) {
      console.error(`handleEditRole: Error updating role for userId=${userId}:`, {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      if (error.code === 'permission-denied') {
        showPopup('Akses Ditolak', 'Anda tidak memiliki izin untuk mengubah peran pengguna. Pastikan status admin Anda aktif.', 'error');
      } else if (error.message.includes('Bad Request')) {
        showPopup('Error', 'Kesalahan koneksi ke server. Silakan coba lagi nanti.', 'error');
      } else {
        showPopup('Error', `Gagal mengubah peran pengguna: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, currentUser, combinedUsers, showPopup, logActivity]);

  // Handle edit button click
  const handleEditClick = useCallback((user) => {
    if (!currentUser) {
      showPopup('Error', 'Silakan masuk untuk mengedit pengguna.', 'error');
      return;
    }
    if (!isAdmin && user.email !== currentUserEmail) {
      showPopup('Akses Ditolak', 'Hanya admin atau pemilik akun yang bisa mengedit.', 'error');
      return;
    }
    setEditUserId(user.id);
    setEditForm({ 
      email: user.email || '', 
      displayName: user.displayName || '', 
      isAdmin: user.isAdmin || false 
    });
    console.log(`handleEditClick: Editing user ${user.id}`);
  }, [isAdmin, currentUserEmail, showPopup, currentUser]);

  // Handle saving edited user data
const handleEditSave = useCallback(async () => {
  console.log('handleEditSave: editForm values:', editForm);
  console.log('handleEditSave: Original user data:', combinedUsers.find((u) => u.id === editUserId));
  try {
    const newEmail = editForm.email?.trim() || '';
    const newDisplayName = editForm.displayName?.trim() || '';
    const newIsAdmin = editForm.isAdmin;

    const user = combinedUsers.find((u) => u.id === editUserId);
    if (!user) {
      showPopup('Pengguna Tidak Ditemukan', 'Pengguna tidak ditemukan.', 'error');
      return;
    }

    if (!isAdmin || !currentUser) {
      showPopup('Akses Ditolak', 'Tidak diizinkan: Hanya admin yang bisa mengedit.', 'error');
      return;
    }

    const userRef = doc(db, 'users', editUserId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      showPopup('Dokumen Tidak Ditemukan', 'Dokumen pengguna tidak ditemukan di Firestore.', 'error');
      return;
    }

    console.log('handleEditSave: User document exists:', userDoc.data());

    const updatePayload = {};
    if (newEmail && newEmail !== userDoc.data().email) updatePayload.email = newEmail;
    if (newDisplayName !== userDoc.data().displayName) updatePayload.displayName = newDisplayName;
    if (newIsAdmin !== userDoc.data().isAdmin) {
      updatePayload.isAdmin = newIsAdmin;
      updatePayload.role = newIsAdmin ? 'admin' : 'user';
    }
    updatePayload.updatedAt = Timestamp.now();

    console.log('handleEditSave: updatePayload:', updatePayload);

    if (Object.keys(updatePayload).length === 1 && updatePayload.updatedAt) {
      showPopup('Tidak Ada Perubahan', 'Tidak ada perubahan yang perlu disimpan.', 'info');
      setEditUserId(null);
      return;
    }

    // Update Firestore
    await setDoc(userRef, updatePayload, { merge: true });

    // Verify Firestore update
    const updatedDoc = await getDoc(userRef);
    console.log('handleEditSave: Verified Firestore document:', updatedDoc.data());

    if (newIsAdmin !== userDoc.data().isAdmin && updatedDoc.data().isAdmin !== newIsAdmin) {
      console.error('handleEditSave: Firestore role verification failed');
      await setDoc(userRef, { isAdmin: userDoc.data().isAdmin, role: userDoc.data().role }, { merge: true });
      showPopup('Gagal Verifikasi Peran', 'Gagal memverifikasi perubahan peran di Firestore.', 'error');
      return;
    }

    // Update Authentication custom claims if role changed
    let authUpdated = false;
    if (newIsAdmin !== userDoc.data().isAdmin) {
      try {
        const idToken = await currentUser.getIdToken(true);
        const response = await fetch('http://localhost:3001/set-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ uid: editUserId, isAdmin: newIsAdmin }),
        });

        const responseBody = await response.json();
        console.log('handleEditSave: set-role response:', response.status, responseBody);

        if (!response.ok) {
          console.error('handleEditSave: Error updating custom claims:', responseBody);
          await setDoc(userRef, { isAdmin: userDoc.data().isAdmin, role: userDoc.data().role }, { merge: true });
          showPopup('Gagal Memperbarui Peran', `Gagal memperbarui peran pengguna: ${responseBody.error || 'Unknown error'}`, 'error');
          return;
        }
        authUpdated = true;
      } catch (error) {
        console.error('handleEditSave: Error updating custom claims:', error);
        await setDoc(userRef, { isAdmin: userDoc.data().isAdmin, role: userDoc.data().role }, { merge: true });
        showPopup('Gagal Memperbarui Peran', `Gagal memperbarui peran pengguna: ${error.message}`, 'error');
        return;
      }
    }

    // Update auth profile if email or displayName changed
    if ((newEmail && newEmail !== userDoc.data().email) || newDisplayName !== userDoc.data().displayName) {
      try {
        const idToken = await currentUser.getIdToken(true);
        const updateAuthPayload = {};
        if (newEmail && newEmail !== userDoc.data().email) updateAuthPayload.email = newEmail;
        if (newDisplayName !== userDoc.data().displayName) updateAuthPayload.displayName = newDisplayName;

        const response = await fetch('http://localhost:3001/update-auth-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ uid: editUserId, ...updateAuthPayload }),
        });

        const responseBody = await response.json();
        console.log('handleEditSave: update-auth-profile response:', response.status, responseBody);

        if (!response.ok) {
          console.error('handleEditSave: Error updating auth profile:', responseBody);
          await setDoc(userRef, { email: userDoc.data().email, displayName: userDoc.data().displayName }, { merge: true });
          showPopup('Gagal Memperbarui Profil', `Gagal memperbarui profil autentikasi: ${responseBody.error || 'Unknown error'}`, 'error');
          return;
        }
      } catch (error) {
        console.error('handleEditSave: Error updating auth profile:', error);
        await setDoc(userRef, { email: userDoc.data().email, displayName: userDoc.data().displayName }, { merge: true });
        showPopup('Gagal Memperbarui Profil', `Gagal memperbarui profil autentikasi: ${error.message}`, 'error');
        return;
      }
    }

    // Log activity
    await logActivity({
      action: authUpdated ? 'update_user_role' : 'update_user_profile',
      userEmail: currentUser.email,
      details: JSON.stringify({
        userId: editUserId,
        email: newEmail,
        displayName: newDisplayName,
        role: newIsAdmin ? 'admin' : 'user',
      }),
      timestamp: Timestamp.now(),
    });

    // Update local state
    setCombinedUsers((prevUsers) => {
      const updatedUsers = prevUsers.map((u) =>
        u.id === editUserId
          ? {
              ...u,
              email: newEmail,
              displayName: newDisplayName,
              isAdmin: newIsAdmin,
              role: newIsAdmin ? 'admin' : 'user',
              customClaims: { ...u.customClaims, isAdmin: newIsAdmin },
            }
          : u
      );
      console.log('handleEditSave: Updated combinedUsers:', updatedUsers.find((u) => u.id === editUserId));
      return updatedUsers;
    });

    setEditUserId(null);
    showPopup('Berhasil', 'Berhasil memperbarui pengguna.', 'success');
    console.log('handleEditSave: Update completed for userId:', editUserId);
  } catch (error) {
    console.error('handleEditSave: Error:', error);
    showPopup('Gagal Memperbarui', `Gagal memperbarui pengguna: ${error.message}`, 'error');
  }
}, [isAdmin, currentUser, editUserId, editForm, combinedUsers, showPopup, logActivity]);

  // Handle sync to Firestore
  const handleSyncToFirestore = useCallback(async (user) => {
    if (!isAdmin) {
      showPopup('Akses Ditolak', 'Hanya admin yang dapat mensinkronkan data.', 'error');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await withRetry(async () => {
          await setDoc(userRef, {
            email: user.email || '',
            displayName: user.displayName || '',
            isAdmin: user.customClaims?.isAdmin || false,
            role: user.customClaims?.isAdmin ? 'admin' : 'user',
            emailVerified: user.emailVerified || false,
            createdAt: user.createdAt ? Timestamp.fromDate(new Date(user.createdAt)) : Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          });
        });
        console.log(`handleSyncToFirestore: Synced user ${user.id} to Firestore`);
        await logActivity('USER_SYNCED', {
          userId: user.id,
          userEmail: user.email,
          updatedBy: currentUser.uid,
        });
        showPopup('Berhasil', 'Pengguna berhasil disinkronkan ke Firestore.', 'success');
      } else {
        console.log(`handleSyncToFirestore: User ${user.id} already exists in Firestore`);
        showPopup('Info', 'Pengguna sudah ada di Firestore.', 'info');
      }
    } catch (error) {
      console.error('handleSyncToFirestore: Error syncing user:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      showPopup('Error', `Gagal mensinkronkan pengguna: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, currentUser, showPopup, logActivity]);

  // Handle delete user
  const handleDelete = useCallback((userId) => {
    showPopup(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus pengguna ini?',
      'confirm',
      async () => {
        setLoading(true);
        try {
          const userRef = doc(db, 'users', userId);
          await deleteDoc(userRef);
          setCombinedUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
          await logActivity('USER_DELETED', {
            userId,
            updatedBy: currentUser.uid,
          });
          showPopup('Berhasil', 'Pengguna berhasil dihapus.', 'success');
        } catch (error) {
          console.error('handleDelete: Error deleting user:', error);
          showPopup('Error', `Gagal menghapus pengguna: ${error.message}`, 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  }, [currentUser, showPopup, logActivity]);

  // Cancel edit
  const handleEditCancel = useCallback(() => {
    setEditUserId(null);
    setEditForm({ email: '', displayName: '', isAdmin: false });
    console.log('handleEditCancel: Edit cancelled');
  }, []);

  // Get email verification status
  const getVerificationStatus = useCallback((user) => {
    if (user.emailVerified === true) {
      return { text: 'Verified', color: 'text-green-600 bg-green-100' };
    } else if (user.emailVerified === false) {
      return { text: 'Unverified', color: 'text-red-600 bg-red-100' };
    } else {
      return { text: 'Unknown', color: 'text-gray-600 bg-gray-100' };
    }
  }, []);

  // Get data source status
  const getSourceStatus = useCallback((user) => {
    if (user.source.inFirestore && user.source.inAuth) {
      return { text: 'Both', color: 'text-green-600 bg-green-100' };
    } else if (user.source.inFirestore) {
      return { text: 'Firestore Only', color: 'text-blue-600 bg-blue-100' };
    } else if (user.source.inAuth) {
      return { text: 'Auth Only', color: 'text-orange-600 bg-orange-100' };
    } else {
      return { text: 'Unknown', color: 'text-gray-600 bg-gray-100' };
    }
  }, []);

  // Get role text
  const getRoleText = useCallback((user) => {
    return user.role || (user.isAdmin ? 'Admin' : 'User');
  }, []);

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
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8 animate-slideUp">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Filter Pengguna</h3>
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

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8 animate-slideUp">
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
              <div className="text-gray-600">Total Pengguna</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slideUp">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sumber Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Registrasi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Riwayat Edit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="w-10 h-10 border-4 border-indigo-200 rounded-full animate-spin"></div>
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
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
                    const hasEdits = profileEdits[user.id]?.length > 0;
                    return (
                      <tr key={user.id} className={`hover:bg-gray-50 transition-all duration-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} transform hover:scale-[1.01] animate-fadeInUp`} style={{ animationDelay: `${index * 0.1}s` }}>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
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
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
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
                              value={editForm.isAdmin ? 'admin' : 'user'}
                              onChange={(e) => setEditForm({ ...editForm, isAdmin: e.target.value === 'admin' })}
                              className="w-full min-w-[120px] px-3 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              disabled={!isAdmin}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <button
                              onClick={() => handleEditRole(user.id, !user.isAdmin)}
                              className={`inline-block px-3 py-1 rounded-lg transition-all duration-200 ${
                                user.isAdmin ? 'bg-purple-100 text-purple-900 hover:bg-purple-200' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                              } ${!isAdmin || user.id === currentUser?.uid ? 'cursor-not-allowed opacity-50' : ''}`}
                              disabled={!isAdmin || user.id === currentUser?.uid}
                            >
                              {getRoleText(user)}
                            </button>
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
                          {user.createdAt ? (typeof user.createdAt.toDate === 'function' ? user.createdAt.toDate() : new Date(user.createdAt)).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm riwayat-edit-cell">
                          {hasEdits ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                showEditHistoryPopup(user.id);
                              }}
                              className="p-2 hover:bg-purple-50 rounded-lg transition-all duration-200 group"
                              disabled={!isAdmin}
                              title="Lihat riwayat edit"
                              aria-label="Lihat riwayat edit pengguna"
                            >
                              <History className="w-5 h-5 text-purple-600 group-hover:text-purple-800" />
                            </button>
                          ) : (
                            <span className="text-gray-500 text-sm">Tidak ada riwayat</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            {editUserId === user.id ? (
                              <>
                                <button
                                  onClick={handleEditSave}
                                  className="p-2 hover:bg-green-50 rounded-lg transition-all duration-200 group"
                                  disabled={!isAdmin && user.email !== currentUserEmail}
                                  aria-label="Simpan perubahan"
                                >
                                  <CheckCircle className="w-5 h-5 text-green-600 group-hover:text-green-800" />
                                </button>
                                <button
                                  onClick={handleEditCancel}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                                  aria-label="Batal edit"
                                >
                                  <X className="w-5 h-5 text-red-600 group-hover:text-red-800" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(user);
                                  }}
                                  className="p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200 group"
                                  disabled={!isAdmin && user.email !== currentUserEmail}
                                  aria-label="Edit pengguna"
                                >
                                  <Edit3 className="w-5 h-5 text-indigo-600 group-hover:text-indigo-800" />
                                </button>
                                {!user.source.inFirestore && user.source.inAuth && isAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSyncToFirestore(user);
                                    }}
                                    className="p-2 hover:bg-purple-50 rounded-lg transition-all duration-200 group"
                                    aria-label="Sinkronisasi ke Firestore"
                                  >
                                    <RefreshCw className="w-5 h-5 text-purple-600 group-hover:text-purple-800" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(user.id);
                                  }}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                                  disabled={!isAdmin}
                                  aria-label="Hapus pengguna"
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
          isAnimating={isAnimating}
        />
        <EditHistoryPopup
          isOpen={editHistoryPopup.isOpen}
          onClose={closeEditHistoryPopup}
          userId={editHistoryPopup.userId}
          profileEdits={profileEdits}
          isAnimating={isAnimating}
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

  @keyframes fadeInUp {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
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
    animation: fadeInUp 0.3s ease-out;
  }

  /* Table responsiveness */
  @media (max-width: 768px) {
    table {
      display: block;
      overflow-x: auto;
      white-space: nowrap;
    }

    th, td {
      min-width: 120px;
    }

    .grid-cols-1.sm\:grid-cols-2.lg\:grid-cols-3.xl\:grid-cols-4 {
      grid-template-columns: 1fr !important;
    }
  }

  /* Column adjustments */
  td:nth-child(1), td:nth-child(2) {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  td:nth-child(3) {
    min-width: 150px;
    padding-right: 16px;
  }

  td:nth-child(3) span, td:nth-child(3) button {
    white-space: nowrap;
  }

  td:nth-child(3) select {
    width: 100%;
    min-width: 120px;
    padding: 8px;
    box-sizing: border-box;
  }

  /* Riwayat Edit column */
  td:nth-child(7).riwayat-edit-cell {
    white-space: nowrap;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Action column */
  td:nth-child(8) {
    white-space: nowrap;
  }

  /* Edit history table in popup */
  .edit-history-table th,
  .edit-history-table td {
    padding: 12px 16px;
    text-align: left;
  }

  .edit-history-table th {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
  }

  .edit-history-table td {
    font-size: 14px;
    color: #1f2937;
  }

  .edit-history-table tr:hover {
    background-color: #f9fafb;
  }

  .popup {
    z-index: 9999999;
  }

  /* Sticky header for edit history table */
  .edit-history-table thead {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: #f9fafb;
  }

  /* Loading spinner */
  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`}</style>
