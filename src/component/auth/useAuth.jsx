import { useEffect, useState, createContext, useContext } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { app, db } from '../../firebaseconfig.js';

const auth = getAuth(app);
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await user.getIdToken(true);
          let tokenResult = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              tokenResult = await user.getIdTokenResult(true);
              break;
            } catch (error) {
              console.error(`Attempt ${attempt} - Token refresh failed:`, error);
              if (attempt === 3) throw new Error(`Max retries reached for token refresh: ${error.message}`);
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          const tokenEmail = tokenResult?.claims?.email || 'anonymous';
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          const email = user.email && emailRegex.test(user.email) && user.email.length <= 254 ? user.email : 'anonymous';

          console.log('Auth state:', {
            uid: user.uid,
            userEmail: user.email,
            tokenEmail,
            emailMatch: email === tokenEmail,
            tokenIssuedAt: tokenResult?.issuedAtTime,
            tokenExpiration: tokenResult?.expirationTime,
          });

          if (email !== tokenEmail) {
            throw new Error(`Email mismatch: user.email (${user.email}) does not match token.email (${tokenEmail})`);
          }

          const updateData = {
            email,
            emailVerified: !!user.emailVerified,
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          };

          if (user.displayName && user.displayName.trim().length > 0 && user.displayName.trim().length <= 50) {
            updateData.displayName = user.displayName.trim();
          }

          if (user.photoURL && user.photoURL.trim().length > 0 && user.photoURL.trim().length <= 500) {
            updateData.photoURL = user.photoURL.trim();
          }

          console.log('Writing updateData to Firestore:', {
            ...updateData,
            updatedAt: 'serverTimestamp()',
            lastLogin: 'serverTimestamp()',
          });

if (userDoc.exists()) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await setDoc(userRef, updateData, { merge: true }); // Line 80
      console.log(`setDoc attempt ${attempt} succeeded`);
      break;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} - setDoc failed:`, error, {
        errorCode: error.code,
        errorMessage: error.message,
      });
      if (attempt === 3) {
        const updatedDoc = await getDoc(userRef);
        if (updatedDoc.exists() && updatedDoc.data().updatedAt.toMillis() >= new Date().getTime() - 60000) {
          console.log('Write succeeded despite client error, skipping throw');
          break;
        }
        throw lastError;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}else {
            let displayName = user.displayName?.trim();
            if (!displayName || displayName.length <= 0 || displayName.length > 50) {
              const emailUsername = user.email?.split('@')[0] || 'User';
              displayName = emailUsername.length > 0 && emailUsername.length <= 50 ? emailUsername : 'User';
            }

            const newUserData = {
              email,
              createdAt: serverTimestamp(),
              displayName,
              emailVerified: !!user.emailVerified,
              updatedAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              isAdmin: false,
              role: 'user',
            };

            if (user.photoURL && user.photoURL.trim().length > 0 && user.photoURL.trim().length <= 500) {
              newUserData.photoURL = user.photoURL.trim();
            }

            console.log('Writing newUserData to Firestore:', {
              ...newUserData,
              createdAt: 'serverTimestamp()',
              updatedAt: 'serverTimestamp()',
              lastLogin: 'serverTimestamp()',
            });

            let lastError = null;
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                await setDoc(userRef, newUserData);
                break;
              } catch (error) {
                lastError = error;
                console.error(`Attempt ${attempt} - setDoc failed:`, error);
                if (attempt === 3) throw lastError;
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }
          }

          const updatedUserDoc = await getDoc(userRef);
          const userData = updatedUserDoc.exists() ? updatedUserDoc.data() : {};
          setIsAdmin(updatedUserDoc.exists() && userData.isAdmin === true);

          console.log('User data synced:', {
            uid: user.uid,
            email: user.email,
            isAdmin: userData.isAdmin === true,
            firestoreData: userData,
          });

          setCurrentUser(user);
        } catch (error) {
          console.error('Error syncing user data:', error, {
            userId: user?.uid,
            email: user?.email,
            tokenEmail: tokenResult?.claims?.email || 'anonymous',
            data: userDoc?.exists() ? updateData : newUserData || 'not defined',
            errorCode: error.code,
            errorMessage: error.message,
          });
          if (error.code !== 'permission-denied' || !(await getDoc(userRef)).exists()) {
            toast.error('Failed to sync user data: ' + error.message, {
              position: 'top-center',
              autoClose: 3000,
            });
          }
          setIsAdmin(false);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    isAdmin,
    loading,
    auth,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};