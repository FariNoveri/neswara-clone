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

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://www.google.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["https://www.google.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Terlalu banyak percobaan autentikasi, coba lagi nanti.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit admin operations
  message: {
    error: 'Terlalu banyak operasi admin, coba lagi nanti.',
    retryAfter: 300
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Speed limiter for suspicious activity
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes at full speed
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 500; // Incremental delay
  }
});

app.use(generalLimiter);
app.use(speedLimiter);

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite dev server
      'https://neswaraclone.firebaseapp.com',
      'https://neswaraclone.web.app',
      // Tambahkan domain production lain jika ada
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Tidak diizinkan oleh CORS policy'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing dengan size limit
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request sanitization middleware
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

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  console.log(chalk.blue(`[${timestamp}] ${req.method} ${req.url} - IP: ${ip}`));
  next();
});

// Inisialisasi Firebase Admin SDK
let serviceAccount;
try {
  // Cek apakah menggunakan GOOGLE_APPLICATION_CREDENTIALS atau file langsung
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'serviceAccountKey.json';
  
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Jika menggunakan environment variable, Firebase Admin akan otomatis detect
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'neswaraclone'
    });
  } else {
    console.log(chalk.blue('[Backend] Using service account key file'));
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || serviceAccount.project_id
    });
  }
} catch (error) {
  console.error(chalk.red('[Backend] Error initializing Firebase Admin:'), error.message);
  console.error(chalk.yellow('[Backend] Pastikan GOOGLE_APPLICATION_CREDENTIALS atau serviceAccountKey.json tersedia'));
  process.exit(1);
}

// Enhanced input validation functions
const validateUID = (uid) => {
  return uid && typeof uid === 'string' && uid.length > 0 && uid.length <= 128;
};

const validateEmail = (email) => {
  return email && validator.isEmail(email) && email.length <= 254;
};

const validateDisplayName = (displayName) => {
  return !displayName || (typeof displayName === 'string' && displayName.length <= 100);
};

// Enhanced middleware untuk verifikasi admin
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const idToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.body.idToken;

    if (!idToken) {
      return res.status(401).json({ 
        error: 'Token tidak ditemukan',
        code: 'MISSING_TOKEN' 
      });
    }

    // Verify token dengan checkRevoked
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);
    const uid = decodedToken.uid;

    // Rate limiting untuk admin operations
    if (req.adminAttempts && req.adminAttempts > 5) {
      return res.status(429).json({ 
        error: 'Terlalu banyak percobaan admin',
        code: 'TOO_MANY_ATTEMPTS' 
      });
    }

    // Cek apakah user adalah admin di Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists || !userDoc.data().isAdmin) {
      // Log suspicious activity
      console.warn(chalk.yellow(`[Security] Non-admin access attempt from UID: ${uid}, IP: ${req.ip}`));
      return res.status(403).json({ 
        error: 'Akses ditolak: Hanya admin yang diizinkan',
        code: 'ACCESS_DENIED' 
      });
    }

    // Log admin activity
    console.log(chalk.green(`[Admin] ${req.method} ${req.url} - Admin UID: ${uid}`));

    req.user = decodedToken;
    req.adminUser = userDoc.data();
    next();
  } catch (error) {
    console.error(chalk.red('[Security] Error verifying admin:'), error.code || error.message);
    
    let errorMessage = 'Token tidak valid';
    let errorCode = 'INVALID_TOKEN';
    
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Token telah kadaluarsa';
      errorCode = 'TOKEN_EXPIRED';
    } else if (error.code === 'auth/id-token-revoked') {
      errorMessage = 'Token telah dicabut';
      errorCode = 'TOKEN_REVOKED';
    }
    
    return res.status(401).json({ 
      error: errorMessage,
      code: errorCode 
    });
  }
};

// Enhanced reCAPTCHA verification
const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_SITE_KEY = process.env.VITE_RECAPTCHA_SITEKEY;

if (!SECRET_KEY) {
  console.error(chalk.red('[Backend] RECAPTCHA_SECRET_KEY tidak ditemukan di environment variables'));
  process.exit(1);
}

if (!RECAPTCHA_SITE_KEY) {
  console.warn(chalk.yellow('[Backend] VITE_RECAPTCHA_SITEKEY tidak ditemukan, beberapa validasi mungkin tidak optimal'));
}

async function verifyRecaptcha(token, remoteip) {
  console.log('[Backend] Verifying reCAPTCHA...');
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: SECRET_KEY,
          response: token,
          remoteip: remoteip
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    const data = response.data;

    if (data.success && data.score >= 0.5) { // Minimum score untuk reCAPTCHA v3
      console.log(chalk.green(`[Backend] ✅ reCAPTCHA success (score: ${data.score})`));
      return { success: true, message: 'reCAPTCHA verified', score: data.score };
    } else {
      const reason = data['error-codes']?.join(', ') || 'Verification failed';
      console.log(chalk.red(`[Backend] ❌ reCAPTCHA failed → ${reason} (score: ${data.score})`));
      return { success: false, message: reason, score: data.score };
    }
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.log(chalk.red('[Backend] ❌ reCAPTCHA error →'), errorMsg);
    return { success: false, message: 'Server error during reCAPTCHA verification' };
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Enhanced reCAPTCHA endpoint
app.post('/verify-recaptcha', authLimiter, async (req, res) => {
  const { token } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;

  if (!token || typeof token !== 'string') {
    console.log(chalk.yellow('[Backend] ⚠️  Invalid or missing token'));
    return res.status(400).json({ 
      success: false, 
      message: 'Token tidak valid atau tidak ditemukan',
      code: 'INVALID_TOKEN'
    });
  }

  const result = await verifyRecaptcha(token, clientIP);
  const statusCode = result.success ? 200 : 400;
  
  res.status(statusCode).json(result);
});

// Enhanced list users endpoint
app.post('/list-users', adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const { maxResults = 1000, pageToken } = req.body;

    // Validate maxResults
    const validMaxResults = Math.min(Math.max(parseInt(maxResults) || 1000, 1), 1000);

    const listUsersResult = await admin.auth().listUsers(validMaxResults, pageToken);

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
      providerData: userRecord.providerData.map(provider => ({
        uid: provider.uid,
        email: provider.email,
        providerId: provider.providerId
      })),
    }));

    res.json({
      users: users,
      count: users.length,
      pageToken: listUsersResult.pageToken,
      hasMore: !!listUsersResult.pageToken
    });
  } catch (error) {
    console.error(chalk.red('[Admin] Error listing users:'), error);
    res.status(500).json({
      error: 'Gagal mengambil daftar pengguna',
      message: error.message,
      code: 'LIST_USERS_ERROR'
    });
  }
});

// Enhanced get user endpoint
app.post('/get-user', adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.body;

    if (!validateUID(uid)) {
      return res.status(400).json({ 
        error: 'UID tidak valid',
        code: 'INVALID_UID' 
      });
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
    console.error(chalk.red('[Admin] Error getting user:'), error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'Pengguna tidak ditemukan',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      error: 'Gagal mengambil data pengguna',
      message: error.message,
      code: 'GET_USER_ERROR'
    });
  }
});

// Enhanced delete user endpoint
app.post('/delete-user', adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.body;

    if (!validateUID(uid)) {
      return res.status(400).json({ 
        error: 'UID tidak valid',
        code: 'INVALID_UID' 
      });
    }

    // Prevent admin from deleting themselves
    if (uid === req.user.uid) {
      return res.status(400).json({
        error: 'Tidak dapat menghapus akun admin sendiri',
        code: 'CANNOT_DELETE_SELF'
      });
    }

    // Check if user exists first
    const userRecord = await admin.auth().getUser(uid);
    
    // Log the deletion attempt
    console.log(chalk.yellow(`[Admin] User deletion attempt - Target UID: ${uid}, Admin UID: ${req.user.uid}`));

    // Delete from Authentication
    await admin.auth().deleteUser(uid);

    // Also try to delete from Firestore (optional)
    try {
      await admin.firestore().collection('users').doc(uid).delete();
    } catch (firestoreError) {
      console.warn(chalk.yellow('[Admin] Could not delete user from Firestore:'), firestoreError.message);
    }

    console.log(chalk.green(`[Admin] User deleted successfully - UID: ${uid}`));

    res.json({
      success: true,
      message: 'Pengguna berhasil dihapus dari Firebase Authentication',
      uid: uid
    });
  } catch (error) {
    console.error(chalk.red('[Admin] Error deleting user:'), error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'Pengguna tidak ditemukan',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      error: 'Gagal menghapus pengguna',
      message: error.message,
      code: 'DELETE_USER_ERROR'
    });
  }
});

// Enhanced update user endpoint
app.post('/update-user', adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const { uid, email, displayName, emailVerified, disabled } = req.body;

    if (!validateUID(uid)) {
      return res.status(400).json({ 
        error: 'UID tidak valid',
        code: 'INVALID_UID' 
      });
    }

    const updateData = {};
    
    if (email !== undefined) {
      if (!validateEmail(email)) {
        return res.status(400).json({ 
          error: 'Format email tidak valid',
          code: 'INVALID_EMAIL' 
        });
      }
      updateData.email = email;
    }
    
    if (displayName !== undefined) {
      if (!validateDisplayName(displayName)) {
        return res.status(400).json({ 
          error: 'Display name tidak valid',
          code: 'INVALID_DISPLAY_NAME' 
        });
      }
      updateData.displayName = displayName;
    }
    
    if (emailVerified !== undefined) {
      if (typeof emailVerified !== 'boolean') {
        return res.status(400).json({ 
          error: 'emailVerified harus berupa boolean',
          code: 'INVALID_EMAIL_VERIFIED' 
        });
      }
      updateData.emailVerified = emailVerified;
    }
    
    if (disabled !== undefined) {
      if (typeof disabled !== 'boolean') {
        return res.status(400).json({ 
          error: 'disabled harus berupa boolean',
          code: 'INVALID_DISABLED' 
        });
      }
      // Prevent admin from disabling themselves
      if (disabled && uid === req.user.uid) {
        return res.status(400).json({
          error: 'Tidak dapat menonaktifkan akun admin sendiri',
          code: 'CANNOT_DISABLE_SELF'
        });
      }
      updateData.disabled = disabled;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Tidak ada data yang akan diperbarui',
        code: 'NO_UPDATE_DATA'
      });
    }

    console.log(chalk.yellow(`[Admin] User update attempt - Target UID: ${uid}, Admin UID: ${req.user.uid}, Updates:`, Object.keys(updateData)));

    const userRecord = await admin.auth().updateUser(uid, updateData);

    console.log(chalk.green(`[Admin] User updated successfully - UID: ${uid}`));

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
    console.error(chalk.red('[Admin] Error updating user:'), error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'Pengguna tidak ditemukan',
        code: 'USER_NOT_FOUND'
      });
    } else if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({
        error: 'Email sudah digunakan oleh pengguna lain',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }
    
    res.status(500).json({
      error: 'Gagal memperbarui pengguna',
      message: error.message,
      code: 'UPDATE_USER_ERROR'
    });
  }
});

// Enhanced user stats endpoint
app.post('/user-stats', adminLimiter, verifyAdmin, async (req, res) => {
  try {
    // Get users from Authentication with pagination
    const authUsers = await admin.auth().listUsers(1000); // Max 1000 at once
    
    // Get users from Firestore
    const firestoreUsers = await admin.firestore().collection('users').get();

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    let recentSignIns = 0;
    let weeklySignIns = 0;
    let monthlySignIns = 0;

    authUsers.users.forEach(user => {
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
      verifiedUsers: authUsers.users.filter(u => u.emailVerified).length,
      unverifiedUsers: authUsers.users.filter(u => !u.emailVerified).length,
      disabledUsers: authUsers.users.filter(u => u.disabled).length,
      enabledUsers: authUsers.users.filter(u => !u.disabled).length,
      recentSignIns: recentSignIns,
      weeklySignIns: weeklySignIns,
      monthlySignIns: monthlySignIns,
      hasMoreUsers: !!authUsers.pageToken
    };

    res.json({ stats });
  } catch (error) {
    console.error(chalk.red('[Admin] Error getting user stats:'), error);
    res.status(500).json({
      error: 'Gagal mengambil statistik pengguna',
      message: error.message,
      code: 'USER_STATS_ERROR'
    });
  }
});

// Enhanced bulk sync users endpoint
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
      // Process in batches to avoid Firestore limits
      const batchSize = 500;
      
      for (let i = 0; i < authUsers.users.length; i += batchSize) {
        const batch = admin.firestore().batch();
        const usersBatch = authUsers.users.slice(i, i + batchSize);
        
        for (const userRecord of usersBatch) {
          try {
            const userRef = admin.firestore().collection('users').doc(userRecord.uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
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
      // Dry run - just count what would be synced
      for (const userRecord of authUsers.users) {
        try {
          const userRef = admin.firestore().collection('users').doc(userRecord.uid);
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
      errors: errors.slice(0, 10) // Limit error details to first 10
    });
  } catch (error) {
    console.error(chalk.red('[Admin] Error bulk syncing users:'), error);
    res.status(500).json({
      error: 'Gagal melakukan bulk sync',
      message: error.message,
      code: 'BULK_SYNC_ERROR'
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error(chalk.red('[Backend] Unhandled error:'), error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON format',
      code: 'INVALID_JSON'
    });
  }
  
  if (error.message === 'Tidak diizinkan oleh CORS policy') {
    return res.status(403).json({
      error: 'CORS policy violation',
      code: 'CORS_ERROR'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint tidak ditemukan',
    code: 'NOT_FOUND'
  });
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
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error(chalk.red('[Backend] Forced shutdown due to timeout'));
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('[Backend] Uncaught Exception:'), error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('[Backend] Unhandled Rejection at:'), promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});