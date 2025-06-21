import { useEffect, useState, createContext, useContext } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../../firebaseconfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseconfig"; // Pastikan db juga diexport

const auth = getAuth(app);

// Buat context
const AuthContext = createContext();

// Provider untuk membungkus App
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            updatedAt: new Date().toISOString().split('T')[0],
            createdAt: serverTimestamp(),
            isAdmin: user.email === 'cahayalunamaharani1@gmail.com' ? true : false, // Set admin default untuk email ini
          },
          { merge: true }
        );
        console.log("User data synced to Firestore:", user.uid);
      } catch (error) {
        console.error("Error syncing user data:", error);
      }
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

// Hook untuk dipanggil di mana pun
export const useAuth = () => {
  return useContext(AuthContext);
};
