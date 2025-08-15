import express from 'express';
import cors from 'cors';
import axios from 'axios';
import chalk from 'chalk';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import compression from 'compression';
import validator from 'validator';

dotenv.config();

console.clear();
console.log(chalk.greenBright('[Backend] Menjalankan server...'));

const app = express();

// Initialize Firebase Admin SDK and Firestore
let serviceAccount;
try {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'serviceAccountKey.json';
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'neswaraclone',
    });
  } else {
    console.log(chalk.blue('[Backend] Using service account key file'));
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
  }
  console.log(chalk.green('[Backend] Firebase Admin SDK initialized successfully'));
} catch (error) {
  console.error(chalk.red('[Backend] Error initializing Firebase Admin:'), error.message);
  console.error(chalk.yellow('[Backend] Pastikan GOOGLE_APPLICATION_CREDENTIALS atau serviceAccountKey.json tersedia'));
  process.exit(1);
}

// Define Firestore instance
const db = admin.firestore();
console.log(chalk.green('[Backend] Firestore instance initialized'));

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.google.com', 'https://www.gstatic.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://www.google.com'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ['https://www.google.com'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(compression());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Terlalu banyak percobaan autentikasi, coba lagi nanti.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: {
    error: 'Terlalu banyak operasi admin, coba lagi nanti.',
    retryAfter: 300,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 500;
  },
});

app.use(generalLimiter);
app.use(speedLimiter);

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'https://neswaraclone.firebaseapp.com',
      'https://neswaraclone.web.app',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Tidak diizinkan oleh CORS policy'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request sanitization
const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return validator.escape(value.trim());
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else {
          obj[key] = sanitizeValue(obj[key]);
        }
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }
  next();
};

app.use(sanitizeInput);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  console.log(chalk.blue(`[${timestamp}] ${req.method} ${req.url} - IP: ${ip}`));
  next();
});

// Input validation functions
const validateUID = (uid) => uid && typeof uid === 'string' && uid.length > 0 && uid.length <= 128;
const validateIsAdmin = (isAdmin) => typeof isAdmin === 'boolean';
const validateString = (text, minSize, maxSize) => typeof text === 'string' && text.length >= minSize && text.length <= maxSize;
const validateEmail = (email) => validateString(email, 0, 254) && (email === 'anonymous' || validator.isEmail(email));
const validateTimestamp = (ts) => validator.isISO8601(ts);

// Admin verification middleware
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.body.idToken;

    if (!idToken) {
      console.log(chalk.yellow('[Security] No token provided'));
      return res.status(401).json({ error: 'Token tidak ditemukan', code: 'MISSING_TOKEN' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken, true);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists || !userDoc.data().isAdmin) {
      console.warn(chalk.yellow(`[Security] Non-admin access attempt from UID: ${decodedToken.uid}, IP: ${req.ip}`));
      return res.status(403).json({ error: 'Akses ditolak: Hanya admin yang diizinkan', code: 'ACCESS_DENIED' });
    }

    console.log(chalk.green(`[Admin] ${req.method} ${req.url} - Admin UID: ${decodedToken.uid}`));
    req.user = decodedToken;
    req.adminUser = userDoc.data();
    next();
  } catch (error) {
    console.error(chalk.red('[Security] Error verifying admin:'), error);
    let errorMessage = 'Token tidak valid';
    let errorCode = 'INVALID_TOKEN';
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Token telah kadaluarsa';
      errorCode = 'TOKEN_EXPIRED';
    } else if (error.code === 'auth/id-token-revoked') {
      errorMessage = 'Token telah dicabut';
      errorCode = 'TOKEN_REVOKED';
    }
    return res.status(401).json({ error: errorMessage, code: errorCode });
  }
};

// reCAPTCHA verification
const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
async function verifyRecaptcha(token, remoteip) {
  console.log('[Backend] Verifying reCAPTCHA...');
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: { secret: SECRET_KEY, response: token, remoteip },
        timeout: 10000,
      }
    );
    const data = response.data;
    if (data.success && data.score >= 0.5) {
      console.log(chalk.green(`[Backend] ✅ reCAPTCHA success (score: ${data.score})`));
      return { success: true, message: 'reCAPTCHA verified', score: data.score };
    } else {
      const reason = data['error-codes']?.join(', ') || 'Verification failed';
      console.log(chalk.red(`[Backend] ❌ reCAPTCHA failed → ${reason} (score: ${data.score})`));
      return { success: false, message: reason, score: data.score };
    }
  } catch (error) {
    console.log(chalk.red('[Backend] ❌ reCAPTCHA error →'), error.message);
    return { success: false, message: 'Server error during reCAPTCHA verification' };
  }
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// reCAPTCHA endpoint
app.post('/verify-recaptcha', authLimiter, async (req, res) => {
  const { token } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;

  if (!token || typeof token !== 'string') {
    console.log(chalk.yellow('[Backend] ⚠️ Invalid or missing token'));
    return res.status(400).json({ success: false, message: 'Token tidak valid atau tidak ditemukan', code: 'INVALID_TOKEN' });
  }

  const result = await verifyRecaptcha(token, clientIP);
  res.status(result.success ? 200 : 400).json(result);
});

// List users
app.post('/list-users', adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const { maxResults = 1000, pageToken } = req.body;
    const validMaxResults = Math.min(Math.max(parseInt(maxResults) || 1000, 1), 1000);

    const listUsersResult = await admin.auth().listUsers(validMaxResults, pageToken);
    const users = listUsersResult.users.map((userRecord) => ({
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
      providerData: userRecord.providerData.map((provider) => ({
        uid: provider.uid,
        email: provider.email,
        providerId: provider.providerId,
      })),
    }));

    res.json({
      users,
      count: users.length,
      pageToken: listUsersResult.pageToken,
      hasMore: !!listUsersResult.pageToken,
    });
  } catch (error) {
    console.error(chalk.red('[Admin] Error listing users:'), error);
    res.status(500).json({
      error: 'Gagal mengambil daftar pengguna',
      message: error.message,
      code: 'LIST_USERS_ERROR',
    });
  }
});

// Get user
app.post('/get-user', adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.body;

    if (!validateUID(uid)) {
      return res.status(400).json({ error: 'UID tidak valid', code: 'INVALID_UID' });
    }

    const userRecord = await admin.auth().getUser(uid);
    const userDoc = await db.collection('users').doc(uid).get();
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
      providerData: userRecord.providerData,
      firestoreData: userDoc.exists ? userDoc.data() : null,
    };

    res.json({ user });
  } catch (error) {
    console.error(chalk.red('[Admin] Error getting user:'), error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan', code: 'USER_NOT_FOUND' });
    }
    res.status(500).json({ error: 'Gagal mengambil data pengguna', message: error.message, code: 'GET_USER_ERROR' });
  }
});

// Delete user
app.post('/delete-user', adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.body;

    if (!validateUID(uid)) {
      return res.status(400).json({ error: 'UID tidak valid', code: 'INVALID_UID' });
    }

    if (uid === req.user.uid) {
      return res.status(400).json({ error: 'Tidak dapat menghapus akun admin sendiri', code: 'CANNOT_DELETE_SELF' });
    }

    console.log(chalk.yellow(`[Admin] User deletion attempt - Target UID: ${uid}, Admin UID: ${req.user.uid}`));
    await admin.auth().deleteUser(uid);

    try {
      await db.collection('users').doc(uid).delete();
      console.log(chalk.green(`[Admin] User deleted from Firestore - UID: ${uid}`));
    } catch (firestoreError) {
      console.warn(chalk.yellow('[Admin] Could not delete user from Firestore:'), firestoreError.message);
    }

    console.log(chalk.green(`[Admin] User deleted successfully - UID: ${uid}`));
    res.json({ success: true, message: 'Pengguna berhasil dihapus dari Firebase Authentication', uid });
  } catch (error) {
    console.error(chalk.red('[Admin] Error deleting user:'), error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan', code: 'USER_NOT_FOUND' });
    }
    res.status(500).json({ error: 'Gagal menghapus pengguna', message: error.message, code: 'DELETE_USER_ERROR' });
  }
});

// Update user in Firestore
app.post('/update-user-firestore', adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const { uid, data, adminUid } = req.body;

    // Validate input
    if (!validateUID(uid)) {
      console.log(chalk.yellow(`[Admin] Invalid UID provided: ${uid}`));
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing UID in request body',
        code: 'INVALID_UID',
      });
    }

    if (!data || typeof data !== 'object') {
      console.log(chalk.yellow('[Admin] Invalid data provided:', data));
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing data in request body',
        code: 'INVALID_DATA',
      });
    }

    if (!validateUID(adminUid) || adminUid !== req.user.uid) {
      console.log(chalk.yellow(`[Admin] Invalid or mismatched adminUid: ${adminUid}, Expected: ${req.user.uid}`));
      return res.status(403).json({
        success: false,
        error: 'Invalid admin UID or insufficient permissions',
        code: 'INVALID_ADMIN_UID',
      });
    }

    // Validate data fields
    const allowedFields = ['email', 'displayName', 'photoURL', 'isAdmin', 'role', 'updatedAt', 'emailVerified', 'lastLogin', 'pendingEmail', 'createdAt', 'disabled'];
    const providedFields = Object.keys(data);
    if (!providedFields.every(field => allowedFields.includes(field))) {
      console.log(chalk.yellow(`[Admin] Invalid fields provided: ${providedFields}`));
      return res.status(400).json({
        success: false,
        error: 'Invalid fields provided',
        code: 'INVALID_FIELDS',
      });
    }

    if (data.email && !validateEmail(data.email)) {
      console.log(chalk.yellow(`[Admin] Invalid email provided: ${data.email}`));
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }
    if (data.displayName && !validateString(data.displayName, 0, 50)) {
      console.log(chalk.yellow(`[Admin] Invalid displayName provided: ${data.displayName}`));
      return res.status(400).json({
        success: false,
        error: 'Invalid display name (max 50 characters)',
        code: 'INVALID_DISPLAY_NAME',
      });
    }
    if ('isAdmin' in data && !validateIsAdmin(data.isAdmin)) {
      console.log(chalk.yellow(`[Admin] Invalid isAdmin provided: ${data.isAdmin}`));
      return res.status(400).json({
        success: false,
        error: 'isAdmin must be a boolean',
        code: 'INVALID_IS_ADMIN',
      });
    }
    if (data.role && !validateString(data.role, 1, 20)) {
      console.log(chalk.yellow(`[Admin] Invalid role provided: ${data.role}`));
      return res.status(400).json({
        success: false,
        error: 'Invalid role (1-20 characters)',
        code: 'INVALID_ROLE',
      });
    }
    if (data.updatedAt && !validateTimestamp(data.updatedAt)) {
      console.log(chalk.yellow(`[Admin] Invalid updatedAt provided: ${data.updatedAt}`));
      return res.status(400).json({
        success: false,
        error: 'Invalid updatedAt timestamp',
        code: 'INVALID_TIMESTAMP',
      });
    }
    if (data.lastLogin && !validateTimestamp(data.lastLogin)) {
      console.log(chalk.yellow(`[Admin] Invalid lastLogin provided: ${data.lastLogin}`));
      return res.status(400).json({
        success: false,
        error: 'Invalid lastLogin timestamp',
        code: 'INVALID_TIMESTAMP',
      });
    }
    if (data.pendingEmail && !validateEmail(data.pendingEmail)) {
      console.log(chalk.yellow(`[Admin] Invalid pendingEmail provided: ${data.pendingEmail}`));
      return res.status(400).json({
        success: false,
        error: 'Invalid pending email format',
        code: 'INVALID_PENDING_EMAIL',
      });
    }
    if ('emailVerified' in data && typeof data.emailVerified !== 'boolean') {
      console.log(chalk.yellow(`[Admin] Invalid emailVerified provided: ${data.emailVerified}`));
      return res.status(400).json({
        success: false,
        error: 'emailVerified must be a boolean',
        code: 'INVALID_EMAIL_VERIFIED',
      });
    }
    if ('disabled' in data && typeof data.disabled !== 'boolean') {
      console.log(chalk.yellow(`[Admin] Invalid disabled provided: ${data.disabled}`));
      return res.status(400).json({
        success: false,
        error: 'disabled must be a boolean',
        code: 'INVALID_DISABLED',
      });
    }

    console.log(chalk.cyan(`[Admin] update-user-firestore request received - UID: ${uid}, adminUid: ${adminUid}`));

    // Update Firestore document
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    // Prepare update payload
    const updatePayload = {
      ...data,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    if (userDoc.exists && !data.createdAt) {
      updatePayload.createdAt = userDoc.data().createdAt || new Date().toISOString().split('T')[0];
    } else if (!data.createdAt) {
      updatePayload.createdAt = new Date().toISOString().split('T')[0];
    }

    // Check if isAdmin or role is being updated to log to profile_edits
    let profileEditRef = null;
    if ('isAdmin' in data || 'role' in data) {
      const editDoc = {
        userId: uid,
        type: 'role',
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        editedBy: adminUid,
        ipAddress: req.ip || req.connection.remoteAddress,
      };
      if ('isAdmin' in data) {
        editDoc.isAdmin = data.isAdmin;
      }
      if ('role' in data) {
        editDoc.role = data.role;
      }
      try {
        const editId = `${uid}_${Date.now()}`;
        profileEditRef = db.collection('profile_edits').doc(editId);
        await profileEditRef.set(editDoc);
        console.log(chalk.green(`[Admin] Profile edit logged successfully - UID: ${uid}, editId: ${editId}`));
      } catch (profileEditError) {
        console.error(chalk.red(`[Admin] Failed to log profile edit for UID: ${uid}:`), profileEditError);
        return res.status(500).json({
          success: false,
          error: 'Gagal mencatat log edit profil',
          message: profileEditError.message,
          code: profileEditError.code || 'PROFILE_EDIT_LOG_FAILED',
        });
      }
    }

    // Perform the update or set
    if (userDoc.exists) {
      await userRef.update(updatePayload);
    } else {
      await userRef.set(updatePayload);
    }

    console.log(chalk.green(`[Admin] Firestore document ${userDoc.exists ? 'updated' : 'created'} successfully for UID: ${uid}`));

    return res.status(200).json({
      success: true,
      message: 'Data pengguna di Firestore berhasil diperbarui',
      editId: profileEditRef ? profileEditRef.id : null,
    });
  } catch (error) {
    console.error(chalk.red('[Admin] Error in update-user-firestore:'), error);
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${error.message}`,
      code: error.code || 'INTERNAL_SERVER_ERROR',
    });
  }
});

// Log profile edit
app.post('/log-profile-edit', adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const { data, adminUid } = req.body;
    const token = req.headers.authorization?.split('Bearer ')[1];

    console.log(chalk.blue(`[Admin] log-profile-edit request received - userId: ${data?.userId}, adminUid: ${adminUid}`));

    // Validate input
    if (!token) {
      console.error(chalk.red('[Admin] No authentication token provided'));
      return res.status(401).json({ error: 'Tidak ada token autentikasi.', code: 'NO_TOKEN' });
    }
    if (!data || !data.userId || !data.editedBy || !data.type || !data.date || !data.timestamp || !data.ipAddress) {
      console.error(chalk.red('[Admin] Invalid data provided for profile edit:', data));
      return res.status(400).json({ error: 'Data tidak valid.', code: 'INVALID_REQUEST' });
    }
    if (!validateUID(data.userId) || !validateUID(data.editedBy)) {
      console.error(chalk.red('[Admin] Invalid userId or editedBy:', { userId: data.userId, editedBy: data.editedBy }));
      return res.status(400).json({ error: 'userId atau editedBy tidak valid.', code: 'INVALID_UID' });
    }
    if (data.editedBy !== adminUid) {
      console.error(chalk.red(`[Admin] Mismatched adminUid: ${adminUid}, editedBy: ${data.editedBy}`));
      return res.status(403).json({ error: 'Admin UID tidak sesuai dengan editedBy.', code: 'INVALID_ADMIN_UID' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || !userDoc.data().isAdmin) {
      console.error(chalk.red(`[Admin] Unauthorized attempt to log profile edit by UID: ${decodedToken.uid}`));
      return res.status(403).json({ error: 'Hanya admin yang dapat mencatat perubahan profil.', code: 'UNAUTHORIZED' });
    }

    // Validate payload fields
    if (!['displayName', 'email', 'password', 'photoURL', 'role', 'auth_profile'].includes(data.type)) {
      console.error(chalk.red('[Admin] Invalid type:', data.type));
      return res.status(400).json({ error: 'Tipe perubahan tidak valid.', code: 'INVALID_TYPE' });
    }
    if (!validateTimestamp(data.timestamp) || !validateTimestamp(data.date)) {
      console.error(chalk.red('[Admin] Invalid date or timestamp:', { date: data.date, timestamp: data.timestamp }));
      return res.status(400).json({ error: 'Format tanggal atau timestamp tidak valid.', code: 'INVALID_DATE' });
    }
    if (!validator.isIP(data.ipAddress) && data.ipAddress !== '127.0.0.1') {
      console.error(chalk.red('[Admin] Invalid ipAddress:', data.ipAddress));
      return res.status(400).json({ error: 'Alamat IP tidak valid.', code: 'INVALID_IP' });
    }
    if (data.emailBefore && !validateEmail(data.emailBefore)) {
      console.error(chalk.red('[Admin] Invalid emailBefore:', data.emailBefore));
      return res.status(400).json({ error: 'Email sebelumnya tidak valid.', code: 'INVALID_EMAIL' });
    }
    if (data.emailAfter && !validateEmail(data.emailAfter)) {
      console.error(chalk.red('[Admin] Invalid emailAfter:', data.emailAfter));
      return res.status(400).json({ error: 'Email baru tidak valid.', code: 'INVALID_EMAIL' });
    }
    if (data.beforeName && !validateString(data.beforeName, 0, 50)) {
      console.error(chalk.red('[Admin] Invalid beforeName:', data.beforeName));
      return res.status(400).json({ error: 'Nama sebelumnya tidak valid.', code: 'INVALID_NAME' });
    }
    if (data.newName && !validateString(data.newName, 0, 50)) {
      console.error(chalk.red('[Admin] Invalid newName:', data.newName));
      return res.status(400).json({ error: 'Nama baru tidak valid.', code: 'INVALID_NAME' });
    }
    if ('isAdmin' in data && !validateIsAdmin(data.isAdmin)) {
      console.error(chalk.red('[Admin] Invalid isAdmin:', data.isAdmin));
      return res.status(400).json({ error: 'isAdmin harus berupa boolean.', code: 'INVALID_IS_ADMIN' });
    }

    console.log(chalk.blue(`[Admin] Logging profile edit for userId: ${data.userId}`));
    const profileEditRef = await db.collection('profile_edits').add(data);
    console.log(chalk.green(`[Admin] Profile edit logged successfully - userId: ${data.userId}, editId: ${profileEditRef.id}`));
    return res.status(200).json({ message: 'Perubahan profil berhasil dicatat.', editId: profileEditRef.id });
  } catch (error) {
    console.error(chalk.red(`[Admin] Failed to log profile edit for userId: ${data?.userId || 'unknown'}:`), error);
    return res.status(500).json({
      error: 'Gagal mencatat perubahan profil.',
      message: error.message,
      code: error.code || 'PROFILE_EDIT_FAILED',
    });
  }
});

// User stats
app.post('/user-stats', adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const authUsers = await admin.auth().listUsers(1000);
    const firestoreUsers = await db.collection('users').get();

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    let recentSignIns = 0;
    let weeklySignIns = 0;
    let monthlySignIns = 0;

    authUsers.users.forEach((user) => {
      if (user.metadata.lastSignInTime) {
        const lastSignIn = new Date(user.metadata.lastSignInTime).getTime();
        const timeDiff = now - lastSignIn;
        if (timeDiff <= dayMs) recentSignIns++;
        if (timeDiff <= weekMs) weeklySignIns++;
        if (timeDiff <= monthMs) monthlySignIns++;
      }
    });

    const stats = {
      totalAuthUsers: authUsers.users.length,
      totalFirestoreUsers: firestoreUsers.size,
      verifiedUsers: authUsers.users.filter((u) => u.emailVerified).length,
      unverifiedUsers: authUsers.users.filter((u) => !u.emailVerified).length,
      disabledUsers: authUsers.users.filter((u) => u.disabled).length,
      enabledUsers: authUsers.users.filter((u) => !u.disabled).length,
      recentSignIns,
      weeklySignIns,
      monthlySignIns,
      hasMoreUsers: !!authUsers.pageToken,
    };

    res.json({ stats });
  } catch (error) {
    console.error(chalk.red('[Admin] Error getting user stats:'), error);
    res.status(500).json({ error: 'Gagal mengambil statistik pengguna', message: error.message, code: 'USER_STATS_ERROR' });
  }
});

// Bulk sync users
app.post('/bulk-sync-users', adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const { dryRun = false } = req.body;
    console.log(chalk.yellow(`[Admin] Bulk sync initiated by UID: ${req.user.uid}, Dry run: ${dryRun}`));

    const authUsers = await admin.auth().listUsers(1000);
    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];

    if (!dryRun) {
      const batchSize = 500;
      for (let i = 0; i < authUsers.users.length; i += batchSize) {
        const batch = db.batch();
        const usersBatch = authUsers.users.slice(i, i + batchSize);

        for (const userRecord of usersBatch) {
          try {
            const userRef = db.collection('users').doc(userRecord.uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
              batch.set(userRef, {
                email: userRecord.email || '',
                displayName: userRecord.displayName || '',
                isAdmin: false, // Default to false since custom claims are removed
                emailVerified: userRecord.emailVerified || false,
                disabled: userRecord.disabled || false,
                createdAt: userRecord.metadata.creationTime
                  ? new Date(userRecord.metadata.creationTime).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0],
                updatedAt: new Date().toISOString().split('T')[0],
              });
              syncedCount++;
            } else {
              skippedCount++;
            }
          } catch (error) {
            errorCount++;
            errors.push({ uid: userRecord.uid, error: error.message });
            console.error(chalk.red(`[Admin] Error processing user ${userRecord.uid}:`), error.message);
          }
        }

        try {
          await batch.commit();
        } catch (batchError) {
          console.error(chalk.red('[Admin] Batch commit error:'), batchError);
          errorCount += usersBatch.length - syncedCount - skippedCount;
        }
      }
    } else {
      for (const userRecord of authUsers.users) {
        try {
          const userRef = db.collection('users').doc(userRecord.uid);
          const userDoc = await userRef.get();
          if (!userDoc.exists) {
            syncedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          errorCount++;
          errors.push({ uid: userRecord.uid, error: error.message });
        }
      }
    }

    console.log(chalk.green(`[Admin] Bulk sync completed - Synced: ${syncedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`));
    res.json({
      success: true,
      message: dryRun
        ? `Dry run selesai. ${syncedCount} user akan ditambahkan, ${skippedCount} user akan dilewati.`
        : `Bulk sync selesai. ${syncedCount} user ditambahkan, ${skippedCount} user dilewati.`,
      syncedCount,
      skippedCount,
      errorCount,
      totalProcessed: authUsers.users.length,
      dryRun,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error(chalk.red('[Admin] Error bulk syncing users:'), error);
    res.status(500).json({ error: 'Gagal melakukan bulk sync', message: error.message, code: 'BULK_SYNC_ERROR' });
  }
});

// Update user authentication profile
app.post('/update-auth-profile', adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const { uid, email, displayName } = req.body;
    const adminUid = req.user.uid;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!validateUID(uid) || (!email && displayName === undefined)) {
      console.error(chalk.red('[Admin] Update auth profile failed - Missing required fields'), { uid, email, displayName });
      return res.status(400).json({ error: 'Missing required fields', code: 'INVALID_REQUEST' });
    }

    // Validate email if provided
    if (email && !validateEmail(email)) {
      console.error(chalk.red('[Admin] Invalid email provided:', email));
      return res.status(400).json({ error: 'Invalid email format', code: 'INVALID_EMAIL' });
    }
    if (displayName !== undefined && !validateString(displayName, 0, 50)) {
      console.error(chalk.red('[Admin] Invalid displayName provided:', displayName));
      return res.status(400).json({ error: 'Invalid display name (max 50 characters)', code: 'INVALID_DISPLAY_NAME' });
    }

    // Update Firebase Authentication user
    const updatePayload = {};
    if (email) updatePayload.email = email;
    if (displayName !== undefined) updatePayload.displayName = displayName;

    console.log(chalk.yellow(`[Admin] Updating auth profile - UID: ${uid}, Admin UID: ${adminUid}, Updates:`, Object.keys(updatePayload)));
    const userRecord = await admin.auth().updateUser(uid, updatePayload);
    console.log(chalk.green(`[Admin] Authentication profile updated successfully - UID: ${uid}, Admin UID: ${adminUid}`));

    // Log to profile_edits
    const editDoc = {
      userId: uid,
      type: 'auth_profile',
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      editedBy: adminUid,
      ipAddress,
    };
    if (email) {
      editDoc.emailBefore = (await admin.auth().getUser(uid)).email || '';
      editDoc.emailAfter = email;
    }
    if (displayName !== undefined) {
      editDoc.beforeName = (await admin.auth().getUser(uid)).displayName || '';
      editDoc.newName = displayName;
    }

    const editId = `${uid}_${Date.now()}`;
    const profileEditRef = db.collection('profile_edits').doc(editId);
    await profileEditRef.set(editDoc);
    console.log(chalk.green(`[Admin] Profile edit logged - UID: ${uid}, editId: ${editId}`));

    res.status(200).json({ success: true, message: 'Authentication profile updated successfully', editId });
  } catch (error) {
    console.error(chalk.red(`[Admin] Error updating auth profile - UID: ${uid || 'unknown'}:`), error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan', code: 'USER_NOT_FOUND' });
    } else if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email sudah digunakan oleh pengguna lain', code: 'EMAIL_ALREADY_EXISTS' });
    }
    res.status(500).json({
      error: 'Failed to update authentication profile',
      message: error.message,
      code: error.code || 'UPDATE_AUTH_PROFILE_ERROR',
    });
  }
});

// Add this endpoint to your server.js file (it appears to be missing)

// Set user role (custom claims) - Fixed version
app.post('/set-role', adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const { uid, isAdmin } = req.body;
    const adminUid = req.user.uid;

    console.log(chalk.cyan(`[Admin] set-role request received - UID: ${uid}, isAdmin: ${isAdmin}, adminUid: ${adminUid}`));

    // Validate input
    if (!validateUID(uid)) {
      console.error(chalk.red(`[Admin] Invalid UID provided: ${uid}`));
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing UID',
        code: 'INVALID_UID',
      });
    }
    if (typeof isAdmin !== 'boolean') {
      console.error(chalk.red(`[Admin] Invalid isAdmin provided: ${isAdmin}`));
      return res.status(400).json({
        success: false,
        error: 'isAdmin must be a boolean',
        code: 'INVALID_IS_ADMIN',
      });
    }

    // Prevent self-demotion
    if (uid === adminUid && !isAdmin) {
      console.warn(chalk.yellow(`[Admin] Admin attempting to demote themselves - UID: ${uid}`));
      return res.status(400).json({
        success: false,
        error: 'Cannot demote yourself from admin role',
        code: 'CANNOT_DEMOTE_SELF',
      });
    }

    console.log(chalk.yellow(`[Admin] Setting role for UID: ${uid}, isAdmin: ${isAdmin}, Admin UID: ${adminUid}`));

    // First update Firestore
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    const updateData = {
      isAdmin,
      role: isAdmin ? 'admin' : 'user',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    if (userDoc.exists) {
      await userRef.update(updateData);
    } else {
      // Create new user document if it doesn't exist
      await userRef.set({
        ...updateData,
        createdAt: new Date().toISOString().split('T')[0],
      });
    }

    // Then set custom claims
    await admin.auth().setCustomUserClaims(uid, { isAdmin });

    // Verify the update
    const userRecord = await admin.auth().getUser(uid);
    if (userRecord.customClaims?.isAdmin !== isAdmin) {
      console.error(chalk.red(`[Admin] Custom claims verification failed for UID: ${uid}`));
      return res.status(500).json({
        success: false,
        error: 'Failed to verify custom claims update',
        code: 'CUSTOM_CLAIMS_VERIFICATION_FAILED',
      });
    }

    console.log(chalk.green(`[Admin] Role updated successfully for UID: ${uid}, isAdmin: ${isAdmin}`));

    // Log to profile_edits
    const editDoc = {
      userId: uid,
      type: 'role',
      isAdmin,
      role: isAdmin ? 'admin' : 'user',
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      editedBy: adminUid,
      ipAddress: req.ip || req.connection.remoteAddress,
    };
    
    const editId = `${uid}_${Date.now()}`;
    const profileEditRef = db.collection('profile_edits').doc(editId);
    await profileEditRef.set(editDoc);
    console.log(chalk.green(`[Admin] Profile edit logged - UID: ${uid}, editId: ${editId}`));

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      editId,
      uid,
      isAdmin,
    });

  } catch (error) {
    console.error(chalk.red(`[Admin] Error setting role for UID: ${req.body?.uid || 'unknown'}:`), error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to set user role',
      message: error.message,
      code: error.code || 'SET_ROLE_ERROR',
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error(chalk.red('[Backend] Unhandled error:'), error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON format', code: 'INVALID_JSON' });
  }
  if (error.message === 'Tidak diizinkan oleh CORS policy') {
    return res.status(403).json({ error: 'CORS policy violation', code: 'CORS_ERROR' });
  }
  res.status(500).json({ error: 'Internal server error', message: error.message, code: 'INTERNAL_ERROR' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan', code: 'NOT_FOUND' });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(chalk.greenBright(`[Backend] Server aktif di http://localhost:${PORT}`));
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(chalk.yellow(`\n[Backend] ${signal} received. Shutting down gracefully...`));
  server.close((err) => {
    if (err) {
      console.error(chalk.red('[Backend] Error during server shutdown:'), err);
      process.exit(1);
    }
    console.log(chalk.green('[Backend] Server closed successfully'));
    process.exit(0);
  });
  setTimeout(() => {
    console.error(chalk.red('[Backend] Forced shutdown due to timeout'));
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  console.error(chalk.red('[Backend] Uncaught Exception:'), error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('[Backend] Unhandled Rejection at:'), promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});