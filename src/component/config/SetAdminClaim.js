// src/component/config/setadminclaim.js
import admin from 'firebase-admin';
import serviceAccount from '../../../serviceAccountKey.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setAdminClaim(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { isAdmin: true });
    console.log(`Admin claim set for ${email} (UID: ${user.uid})`);
  } catch (error) {
    console.error(`Error setting admin claim for ${email}:`, error);
  }
}

setAdminClaim('cahayalunamaharani1@gmail.com');
setAdminClaim('fari_noveriwinanto@teknokrat.ac.id');