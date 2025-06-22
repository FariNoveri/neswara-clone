import { useEffect, useState, createContext, useContext } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app, db } from "@/firebaseconfig.js";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const auth = getAuth(app);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            await setDoc(
              doc(db, "users", user.uid),
              {
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                updatedAt: new Date().toISOString().split('T')[0],
                createdAt: userData.createdAt || serverTimestamp(),
              },
              { merge: true }
            );
            console.log("User data synced (preserving isAdmin):", user.uid, userData);
          } else {
            await setDoc(
              doc(db, "users", user.uid),
              {
                email: user.email,
                displayName: user.email.split('@')[0],
                updatedAt: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp(),
                isAdmin: user.email === 'cahayalunamaharani1@gmail.com' || user.email === 'fari_noveriwinanto@teknokrat.ac.id',
              },
              { merge: true }
            );
            console.log("New user document created:", user.uid);
          }
        } catch (error) {
          console.error("Error syncing user data:", error);
        }
      } else {
        console.log("No user logged in");
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};