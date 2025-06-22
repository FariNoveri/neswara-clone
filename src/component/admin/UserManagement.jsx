import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseconfig';
import { collection, query, onSnapshot, where, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../Hooks/useAuth';

const UserManagement = ({ adminEmails }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterEmail, setFilterEmail] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [filterCustomDate, setFilterCustomDate] = useState('');
  const { currentUser } = useAuth();
  const [currentUserEmail, setCurrentUserEmail] = useState(currentUser?.email || '');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setCurrentUserEmail(currentUser?.email || '');
    if (currentUser?.uid) {
      const userRef = doc(db, 'users', currentUser.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setIsAdmin(userData.isAdmin === true);
          console.log('Real-time Admin status:', userData.isAdmin, 'for email:', currentUser.email, 'UID:', currentUser.uid);
        } else {
          console.log('User document not found for UID:', currentUser.uid);
          setIsAdmin(false);
        }
      }, (error) => {
        console.error('Error fetching admin status:', error);
        setIsAdmin(false);
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const [editUserId, setEditUserId] = useState(null);
  const [editForm, setEditForm] = useState({ email: '', displayName: '' });

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
      let usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      usersData = usersData.filter(user => 
        (!filterEmail || user.email?.toLowerCase().includes(filterEmail.toLowerCase())) &&
        (!filterName || user.displayName?.toLowerCase().includes(filterName.toLowerCase())) &&
        (filterRole === 'all' || 
         (filterRole === 'admin' && user.isAdmin === true) ||
         (filterRole === 'user' && user.isAdmin !== true))
      );
      usersData.sort((a, b) => a.email.localeCompare(b.email));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterEmail, filterName, filterRole, filterDate, filterCustomDate]);

  const handleFilterChange = (type, value) => {
    switch (type) {
      case 'email': setFilterEmail(value); break;
      case 'name': setFilterName(value); break;
      case 'role': setFilterRole(value); break;
      case 'date': setFilterDate(value); break;
      case 'customDate': setFilterCustomDate(value); break;
    }
  };

  const handleDelete = async (userId) => {
    if (!isAdmin) {
      alert('Hanya admin yang bisa menghapus pengguna.');
      return;
    }
    if (!window.confirm('Yakin ingin menghapus pengguna ini?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(user => user.id !== userId));
      alert('Pengguna berhasil dihapus.');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Gagal menghapus pengguna: ' + error.message);
    }
  };

  const handleEditClick = (user) => {
    if (!isAdmin && user.email !== currentUserEmail) {
      alert('Hanya admin atau pemilik akun yang bisa mengedit.');
      return;
    }
    console.log('Edit clicked for user:', user.email, 'Current User:', currentUserEmail, 'Is Admin:', isAdmin);
    setEditUserId(user.id);
    setEditForm({ email: user.email || '', displayName: user.displayName || '' });
  };

  const handleEditSave = async () => {
    if (!isAdmin && users.find(u => u.id === editUserId)?.email !== currentUserEmail) {
      alert('Hanya admin atau pemilik akun yang bisa mengedit.');
      return;
    }
    try {
      const userRef = doc(db, 'users', editUserId);
      await updateDoc(userRef, {
        email: editForm.email,
        displayName: editForm.displayName,
        updatedAt: new Date().toISOString().split('T')[0],
      });
      setUsers(users.map(user =>
        user.id === editUserId ? { ...user, ...editForm } : user
      ));
      setEditUserId(null);
      setEditForm({ email: '', displayName: '' });
      alert('Perubahan berhasil disimpan.');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Gagal menyimpan perubahan: ' + error.message);
    }
  };

  const handleEditRole = async (userId, isAdmin) => {
    console.log('handleEditRole triggered for userId:', userId, 'to isAdmin:', isAdmin);
    
    // Pastikan status admin diperbarui sebelum aksi
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const currentIsAdmin = userDoc.exists() ? userDoc.data().isAdmin : false;
    console.log('Verified Admin status before action:', currentIsAdmin, 'for UID:', currentUser.uid);
    
    if (!currentIsAdmin) {
      alert('Hanya admin yang bisa mengedit role.');
      return;
    }
    
    console.log('Proceeding with role change for userId:', userId, 'to isAdmin:', isAdmin);
    
    if (!window.confirm(`Yakin ingin mengubah role pengguna ini menjadi ${isAdmin ? 'Admin' : 'User'}?`)) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isAdmin: isAdmin,
        updatedAt: new Date().toISOString().split('T')[0],
      });
      setUsers(users.map(user =>
        user.id === userId ? { ...user, isAdmin } : user
      ));
      alert('Role berhasil diperbarui.');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Gagal memperbarui role: ' + error.message);
    }
  };

  const handleEditCancel = () => {
    setEditUserId(null);
    setEditForm({ email: '', displayName: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            placeholder="Filter by Email"
            value={filterEmail}
            onChange={(e) => handleFilterChange('email', e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Filter by Nama"
            value={filterName}
            onChange={(e) => handleFilterChange('name', e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <select
            value={filterRole}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select
            value={filterDate}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            className="px-3 py-2 border rounded-lg"
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
              className="px-3 py-2 border rounded-lg"
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tanggal Register</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Tidak ada pengguna ditemukan</td>
                </tr>
              ) : (
                users.map(user => (
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
                        onChange={(e) => {
                          console.log('Select changed for userId:', user.id, 'to value:', e.target.value);
                          handleEditRole(user.id, e.target.value === 'admin');
                        }}
                        className="px-2 py-1 border border-gray-300 rounded bg-gray-100 text-purple-800"
                        disabled={!isAdmin}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {editUserId === user.id ? (
                        <>
                          <button
                            onClick={handleEditSave}
                            className="text-green-500 hover:text-green-700 mr-2"
                            disabled={!isAdmin && user.email !== currentUserEmail}
                          >
                            Simpan
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="text-red-500 hover:text-red-700"
                          >
                            Batal
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditClick(user)}
                            className="text-blue-500 hover:text-blue-700 mr-2"
                            disabled={!isAdmin && user.email !== currentUserEmail}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-500 hover:text-red-700"
                            disabled={!isAdmin}
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;