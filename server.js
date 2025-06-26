import express from 'express';
import cors from 'cors';
import axios from 'axios';
import chalk from 'chalk';
import dotenv from 'dotenv';
import admin from 'firebase-admin'; // Tambahkan Firebase Admin
import { readFileSync } from 'fs'; // Untuk membaca file service account

dotenv.config();

console.clear();
console.log(chalk.greenBright('[Backend] Menjalankan server...'));

const app = express();
app.use(express.json());
app.use(cors());

// Inisialisasi Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync('serviceAccountKey.json')); // Ganti dengan path ke file service account kamu
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware untuk verifikasi admin
const verifyAdmin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    // Verifikasi token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Cek apakah user adalah admin di Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists || !userDoc.data().isAdmin) {
      return res.status(403).json({ error: 'Akses ditolak: Hanya admin yang diizinkan' });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying admin:', error);
    return res.status(401).json({ error: 'Token tidak valid' });
  }
};

// Fungsi reCAPTCHA (dari kode awal)
const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

async function verifyRecaptcha(token) {
  console.log('[Backend] Verifying reCAPTCHA...');
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: SECRET_KEY,
          response: token,
        },
      }
    );
    const data = response.data;

    if (data.success) {
      console.log(chalk.green('[Backend] ✅ reCAPTCHA success'));
      return { success: true, message: 'reCAPTCHA verified' };
    } else {
      const reason = data['error-codes']?.join(', ') || 'Verification failed';
      console.log(chalk.red(`[Backend] ❌ reCAPTCHA failed → ${reason}`));
      return { success: false, message: reason };
    }
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.log(chalk.red('[Backend] ❌ reCAPTCHA error →'), errorMsg);
    return { success: false, message: 'Server error during reCAPTCHA verification' };
  }
}

// Endpoint reCAPTCHA (dari kode awal)
app.post('/verify-recaptcha', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    console.log(chalk.yellow('[Backend] ⚠️  No token provided'));
    return res.status(400).json({ success: false, message: 'No token provided' });
  }

  const result = await verifyRecaptcha(token);
  res.status(result.success ? 200 : 400).json(result);
});

// Endpoint untuk mendapatkan semua users dari Authentication
app.post('/list-users', verifyAdmin, async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers();

    const users = listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
        lastRefreshTime: userRecord.metadata.lastRefreshTime,
      },
      customClaims: userRecord.customClaims || {},
      providerData: userRecord.providerData,
    }));

    res.json({
      users: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({
      error: 'Gagal mengambil daftar pengguna',
      message: error.message
    });
  }
});

// Endpoint untuk mendapatkan user tertentu dari Authentication
app.post('/get-user', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'UID diperlukan' });
    }

    const userRecord = await admin.auth().getUser(uid);

    const user = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
        lastRefreshTime: userRecord.metadata.lastRefreshTime,
      },
      customClaims: userRecord.customClaims || {},
      providerData: userRecord.providerData,
    };

    res.json({ user });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      error: 'Gagal mengambil data pengguna',
      message: error.message
    });
  }
});

// Endpoint untuk menghapus user
app.post('/delete-user', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'UID diperlukan' });
    }

    // Hapus dari Authentication
    await admin.auth().deleteUser(uid);

    res.json({
      success: true,
      message: 'Pengguna berhasil dihapus dari Firebase Authentication',
      uid: uid
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: 'Gagal menghapus pengguna',
      message: error.message
    });
  }
});

// Endpoint untuk update user di Authentication
app.post('/update-user', verifyAdmin, async (req, res) => {
  try {
    const { uid, email, displayName, emailVerified, disabled } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'UID diperlukan' });
    }

    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;
    if (disabled !== undefined) updateData.disabled = disabled;

    const userRecord = await admin.auth().updateUser(uid, updateData);

    res.json({
      success: true,
      message: 'Pengguna berhasil diperbarui',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      error: 'Gagal memperbarui pengguna',
      message: error.message
    });
  }
});

// Endpoint untuk mendapatkan statistik users
app.post('/user-stats', verifyAdmin, async (req, res) => {
  try {
    // Get users from Authentication
    const authUsers = await admin.auth().listUsers();

    // Get users from Firestore
    const firestoreUsers = await admin.firestore().collection('users').get();

    const stats = {
      totalAuthUsers: authUsers.users.length,
      totalFirestoreUsers: firestoreUsers.size,
      verifiedUsers: authUsers.users.filter(u => u.emailVerified).length,
      unverifiedUsers: authUsers.users.filter(u => !u.emailVerified).length,
      disabledUsers: authUsers.users.filter(u => u.disabled).length,
      enabledUsers: authUsers.users.filter(u => !u.disabled).length,
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      error: 'Gagal mengambil statistik pengguna',
      message: error.message
    });
  }
});

// Endpoint untuk bulk sync users
app.post('/bulk-sync-users', verifyAdmin, async (req, res) => {
  try {
    const authUsers = await admin.auth().listUsers();
    const batch = admin.firestore().batch();

    let syncedCount = 0;
    let skippedCount = 0;

    for (const userRecord of authUsers.users) {
      const userRef = admin.firestore().collection('users').doc(userRecord.uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        // User doesn't exist in Firestore, create it
        batch.set(userRef, {
          email: userRecord.email || '',
          displayName: userRecord.displayName || '',
          isAdmin: false,
          emailVerified: userRecord.emailVerified || false,
          disabled: userRecord.disabled || false,
          createdAt: userRecord.metadata.creationTime ?
            new Date(userRecord.metadata.creationTime).toISOString().split('T')[0] :
            new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        });
        syncedCount++;
      } else {
        skippedCount++;
      }
    }

    await batch.commit();

    res.json({
      success: true,
      message: `Bulk sync selesai. ${syncedCount} user ditambahkan, ${skippedCount} user dilewati.`,
      syncedCount,
      skippedCount,
      totalProcessed: authUsers.users.length
    });
  } catch (error) {
    console.error('Error bulk syncing users:', error);
    res.status(500).json({
      error: 'Gagal melakukan bulk sync',
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(chalk.greenBright(`[Backend] Server aktif di http://localhost:${PORT}`));
});

process.on('SIGINT', () => {
  console.clear();
  console.log(chalk.redBright('🛑 Backend dihentikan.\n'));
  process.exit();
});