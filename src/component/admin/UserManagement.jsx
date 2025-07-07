import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebaseconfig';
import { collection, query, onSnapshot, where, doc, updateDoc, deleteDoc, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { useAuth } from '../auth/useAuth';
import { Edit3, Trash2, RefreshCw, CheckCircle, X, History } from 'lucide-react';

// Komponen Popup untuk menampilkan pesan (sukses, error, konfirmasi, dll.)
const Popup = ({ isOpen, onClose, title, message, type = 'info', onConfirm, isAnimating }) => {
  if (!isOpen) return null;

  const handleClose = (e) => {
    e.stopPropagation();
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
      className={`fixed inset-0 z-999999999999 overflow-y-auto transition-all duration-300 ${
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

// Komponen EditHistoryPopup yang menyerupai NewsModal
const EditHistoryPopup = ({ isOpen, onClose, userId, profileEdits, isAnimating }) => {
  if (!isOpen) return null;

  const handleClose = (e) => {
    e.stopPropagation();
    console.log('Closing EditHistoryPopup, userId:', userId);
    onClose();
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
    console.log('Click inside EditHistoryPopup, preventing propagation');
  };

  const getEditDescription = (edit) => {
    switch (edit.type) {
      case 'displayName':
        return edit.beforeName && edit.newName
          ? `Nama diubah dari "${edit.beforeName}" ke "${edit.newName}"`
          : 'Nama diubah';
      case 'email':
        return 'Email diubah';
      case 'password':
        return 'Password diubah';
      case 'photoURL':
        return 'Foto profil diubah';
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
                      <tr key={idx} className="hover:bg-gray-50 transition-all duration-200">
                        <td className="px-4 py-3 text-sm text-gray-900">{edit.type.charAt(0).toUpperCase() + edit.type.slice(1)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formattedDate}</td>
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

// Komponen utama UserManagement
const UserManagement = ({ adminEmails }) => {
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
  const [editForm, setEditForm] = useState({ email: '', displayName: '' });
  const [editHistoryPopup, setEditHistoryPopup] = useState({
    isOpen: false,
    userId: null,
  });
  const [isAnimating, setIsAnimating] = useState(false);

  // Fungsi untuk menampilkan popup
  const showPopup = useCallback((title, message, type = 'info', onConfirm = null) => {
    console.log('Opening Popup:', title);
    setPopup({ isOpen: true, title, message, type, onConfirm });
    setIsAnimating(true);
    // Fungsi setIsMobileMenuOpen dihapus karena menyebabkan error dan tidak berguna tanpa prop
  }, []);

  // Fungsi untuk menutup popup
  const closePopup = useCallback(() => {
    console.log('Closing Popup');
    setIsAnimating(false);
    setTimeout(() => {
      setPopup(prev => ({ ...prev, isOpen: false }));
    }, 200);
  }, []);

  // Fungsi untuk menampilkan popup riwayat edit
  const showEditHistoryPopup = useCallback((userId) => {
    console.log('Opening EditHistoryPopup for userId:', userId);
    setEditHistoryPopup({ isOpen: true, userId });
    setIsAnimating(true);
    // Fungsi setIsMobileMenuOpen dihapus karena menyebabkan error dan tidak berguna tanpa prop
  }, []);

  // Fungsi untuk menutup popup riwayat edit
  const closeEditHistoryPopup = useCallback(() => {
    console.log('Closing EditHistoryPopup');
    setIsAnimating(false);
    setTimeout(() => {
      setEditHistoryPopup({ isOpen: false, userId: null });
    }, 200);
  }, []);

  // Mencatat riwayat edit ke Firestore
  const logProfileEdit = useCallback(async (userId, type, beforeName = null, newName = null) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const logData = {
        userId,
        type,
        date: today,
        timestamp: new Date().toISOString(),
      };

      if (type === 'displayName' && beforeName && newName) {
        logData.beforeName = beforeName;
        logData.newName = newName;
      }

      await addDoc(collection(db, 'profile_edits'), logData);
      return true;
    } catch (error) {
      console.error('Error logging profile edit:', error);
      showPopup('Error', 'Gagal mencatat perubahan: ' + error.message, 'error');
      return false;
    }
  }, [showPopup]);

  // Mengambil daftar pengguna dari Firebase Authentication
  const fetchAuthUsers = useCallback(async () => {
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
      setAuthUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching auth users:', error);
      showPopup('Error', 'Gagal memuat pengguna dari Authentication: ' + error.message, 'error');
    }
  }, [currentUser, showPopup]);

  // Mengambil riwayat edit dari Firestore
  const fetchProfileEdits = useCallback(async () => {
    if (!isAdmin) {
      setProfileEdits({});
      return () => {};
    }
    try {
      const editsQuery = query(collection(db, 'profile_edits'));
      const unsubscribe = onSnapshot(
        editsQuery,
        (snapshot) => {
          const editsData = {};
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (!editsData[data.userId]) {
              editsData[data.userId] = {};
            }
            const currentEdit = editsData[data.userId][data.type];
            const hasNewerTimestamp =
              data.timestamp &&
              (!currentEdit?.timestamp ||
               new Date(data.timestamp) > new Date(currentEdit.timestamp));
            if (!currentEdit || hasNewerTimestamp) {
              editsData[data.userId][data.type] = { ...data, id: doc.id };
            }
          });
          const formattedEdits = {};
          Object.keys(editsData).forEach((userId) => {
            formattedEdits[userId] = Object.values(editsData[userId]);
          });
          setProfileEdits(formattedEdits);
        },
        (error) => {
          console.error('Error in profile edits snapshot listener:', error);
          if (error.code === 'permission-denied') {
            showPopup('Akses Ditolak', 'Anda tidak memiliki izin untuk mengakses riwayat edit.', 'error');
          } else {
            showPopup('Error', 'Gagal memuat riwayat edit: ' + error.message, 'error');
          }
          setProfileEdits({});
        }
      );
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up profile edits listener:', error);
      showPopup('Error', 'Gagal mengatur listener riwayat edit: ' + error.message, 'error');
      setProfileEdits({});
      return () => {};
    }
  }, [isAdmin, showPopup]);

  // Menggabungkan data pengguna dari Firestore dan Authentication
  const combineUsers = useCallback(() => {
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
  }, [users, authUsers]);

  // Memeriksa status admin pengguna saat ini
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
          setIsInitialLoad(false);
        } else {
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

  // Mengambil data pengguna dari Firestore dengan filter
  useEffect(() => {
    setLoading(true);
    let q = query(collection(db, 'users'));

    if (filterDate === 'last7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      q = query(q, where('createdAt', '>=', sevenDaysAgo.toISOString().split('T')[0]));
    } else if (filterDate === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      q = query(q, where('createdAt', '>=', thirtyDaysAgo.toISOString().split('T')[0]));
    } else if (filterDate === 'custom' && filterCustomDate) {
      const customDate = new Date(filterCustomDate).toISOString().split('T')[0];
      q = query(q, where('createdAt', '>=', customDate));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      setLoading(false);
      showPopup('Error', 'Gagal memuat pengguna: ' + error.message, 'error');
    });

    return () => unsubscribe();
  }, [filterDate, filterCustomDate, showPopup]);

  // Mengambil data pengguna Authentication dan riwayat edit
  useEffect(() => {
    if (currentUser && isAdmin) {
      fetchAuthUsers();
      fetchProfileEdits();
    }
  }, [currentUser, isAdmin, fetchAuthUsers, fetchProfileEdits]);

  // Menggabungkan data pengguna saat data berubah
  useEffect(() => {
    if (users.length > 0 || authUsers.length > 0) {
      combineUsers();
    }
  }, [users, authUsers, combineUsers]);

  // Memfilter pengguna berdasarkan kriteria
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

  // Menangani perubahan filter
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
  }, []);

  // Menangani sinkronisasi pengguna ke Firestore
  const handleSyncToFirestore = useCallback(async (user) => {
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

          showPopup('Berhasil', 'Pengguna berhasil ditambahkan ke Firestore.', 'success');
        } catch (error) {
          console.error('Error syncing user to Firestore:', error);
          showPopup('Error', 'Gagal menambahkan pengguna ke Firestore: ' + error.message, 'error');
        }
      }
    );
  }, [isAdmin, showPopup]);

  // Menangani penghapusan pengguna
  const handleDelete = useCallback(async (userId) => {
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
          }

          showPopup('Berhasil', `Pengguna berhasil dihapus dari ${deleteOptions.join(' dan ')}.`, 'success');
          await fetchAuthUsers();
        } catch (error) {
          console.error('Error deleting user:', error);
          showPopup('Error', `Gagal menghapus pengguna: ${error.message}`, 'error');
        }
      }
    );
  }, [isAdmin, currentUser, combinedUsers, showPopup, fetchAuthUsers]);

  // Menangani klik tombol edit
  const handleEditClick = useCallback((user) => {
    if (!isAdmin && user.email !== currentUserEmail) {
      showPopup('Akses Ditolak', 'Hanya admin atau pemilik akun yang bisa mengedit.', 'error');
      return;
    }
    setEditUserId(user.id);
    setEditForm({ email: user.email || '', displayName: user.displayName || '' });
  }, [isAdmin, currentUserEmail, showPopup]);

  // Menangani penyimpanan perubahan edit
  const handleEditSave = useCallback(async () => {
    const user = combinedUsers.find(u => u.id === editUserId);
    if (!isAdmin && user?.email !== currentUserEmail) {
      showPopup('Akses Ditolak', 'Hanya admin atau pemilik akun yang bisa mengedit.', 'error');
      return;
    }

    try {
      const userRef = doc(db, 'users', editUserId);
      const originalDisplayName = user.displayName || '';
      const newDisplayName = editForm.displayName || '';
      if (user.source.inFirestore) {
        await updateDoc(userRef, {
          email: editForm.email,
          displayName: newDisplayName,
          updatedAt: new Date().toISOString().split('T')[0],
        });
      } else {
        await setDoc(userRef, {
          email: editForm.email,
          displayName: newDisplayName,
          isAdmin: false,
          emailVerified: user.emailVerified || false,
          updatedAt: new Date().toISOString().split('T')[0],
          createdAt: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        });
      }

      if (originalDisplayName !== newDisplayName) {
        await logProfileEdit(user.id, 'displayName', originalDisplayName, newDisplayName);
      }

      const updatedDoc = await getDoc(userRef);
      if (updatedDoc.exists()) {
        const updatedData = updatedDoc.data();
        setCombinedUsers(prevUsers =>
          prevUsers.map(u => u.id === editUserId ? { ...u, email: updatedData.email, displayName: updatedData.displayName } : u)
        );
      }

      setEditUserId(null);
      setEditForm({ email: '', displayName: '' });
      showPopup('Berhasil', 'Perubahan berhasil disimpan.', 'success');
    } catch (error) {
      console.error('Error updating user:', error);
      showPopup('Error', 'Gagal menyimpan perubahan: ' + error.message, 'error');
    }
  }, [isAdmin, currentUserEmail, editUserId, editForm, combinedUsers, showPopup, logProfileEdit]);

  // Menangani perubahan role pengguna
  const handleEditRole = useCallback(async (userId, isAdminRole) => {
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
              createdAt: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            });
          }

          showPopup('Berhasil', 'Role berhasil diperbarui.', 'success');
        } catch (error) {
          console.error('Error updating role:', error);
          showPopup('Error', 'Gagal memperbarui role: ' + error.message, 'error');
        }
      }
    );
  }, [currentUser, combinedUsers, showPopup]);

  // Membatalkan edit
  const handleEditCancel = useCallback(() => {
    setEditUserId(null);
    setEditForm({ email: '', displayName: '' });
  }, []);

  // Mendapatkan status verifikasi email
  const getVerificationStatus = useCallback((user) => {
    if (user.emailVerified === true) {
      return { text: 'Verified', color: 'text-green-600 bg-green-100' };
    } else if (user.emailVerified === false) {
      return { text: 'Unverified', color: 'text-red-600 bg-red-100' };
    } else {
      return { text: 'Unknown', color: 'text-gray-600 bg-gray-100' };
    }
  }, []);

  // Mendapatkan status sumber data
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

  // Mendapatkan teks role
  const getRoleText = useCallback((user) => {
    return user.isAdmin ? 'Admin' : 'User';
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-gray-900 appearance-auto"
            >
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <select
              value={filterEmailVerified}
              onChange={(e) => handleFilterChange('emailVerified', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-gray-900 appearance-auto"
            >
              <option value="all">Semua Status</option>
              <option value="verified">Email Verified</option>
              <option value="unverified">Email Unverified</option>
            </select>
            <select
              value={filterSource}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-gray-900 appearance-auto"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-gray-900 appearance-auto"
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
              <div className="text-gray-600">Total Users</div>
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
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'N/A'}
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

  td:nth-child(3) span {
    white-space: nowrap;
  }

  td:nth-child(3) select {
    width: 100%;
    min-width: 120px;
    padding: 8px;
    box-sizing: border-box;
    appearance: auto;
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

  .popup{
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