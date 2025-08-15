// D:\KULIAH\TUGAS AKHIR NESWARA\set-admin.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

const app = initializeApp({
  credential: cert(serviceAccount),
});
const auth = getAuth(app);

async function setAdminClaim(uid, isAdmin) {
  try {
    await auth.setCustomUserClaims(uid, { isAdmin });
    console.log(`Successfully ${isAdmin ? 'set' : 'removed'} isAdmin claim for uid=${uid}`);
    return { success: true };
  } catch (error) {
    console.error('Error setting custom claim:', error);
    return { success: false, error: error.message };
  }
}

const uid = process.argv[2];
const isAdminArg = process.argv[3] === 'true';
if (!uid) {
  console.error('Please provide a UID: node set-admin.js <uid> <true/false>');
  process.exit(1);
}
setAdminClaim(uid, isAdminArg).then((result) => {
  console.log(result);
});