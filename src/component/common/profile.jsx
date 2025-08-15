import React, { useState, useEffect, useRef } from "react";
import {
  FaCamera,
  FaEdit,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaKey,
  FaExclamationTriangle,
  FaSignOutAlt,
  FaTrash,
  FaGoogle,
  FaFacebook,
  FaInfoCircle,
  FaCog,
  FaShieldAlt,
  FaChartBar,
  FaHeart,
  FaBookmark,
  FaComment,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  auth,
  db
} from "../../firebaseconfig";
import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  signOut,
  getAuth
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  deleteDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Simple input sanitization function with length limits
const sanitizeInput = (input, maxLength) => {
  if (!input) return input;
  let sanitized = input
    .replace(new RegExp('[<>}{]', 'g'), '') // Remove dangerous characters
    .replace(new RegExp('script', 'gi'), '') // Prevent script injection
    .replace(new RegExp('[\\x00-\\x1F\\x7F]', 'g'), '') // Remove control characters
    .trim();
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
};

// Validate file type and content
const validateImageFile = (file, callback) => {
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024;

  const fileExtension = file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    callback(new Error(`Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`));
    return;
  }

  if (!allowedMimeTypes.includes(file.type)) {
    callback(new Error(`Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`));
    return;
  }

  if (file.size > maxSize) {
    callback(new Error('File size exceeds 5MB limit.'));
    return;
  }

  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(objectUrl);
    callback(null);
  };
  img.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    callback(new Error('File is not a valid image.'));
  };
  img.src = objectUrl;
};

// Generate name suggestions
const generateNameSuggestions = (baseName) => {
  const suggestions = [];
  suggestions.push(`${baseName}_${Math.floor(Math.random() * 100)}`);
  suggestions.push(`${baseName}${Math.floor(Math.random() * 1000)}`);
  suggestions.push(`${baseName}_user`);
  suggestions.push(`${baseName}${Math.random().toString(36).substring(2, 8)}`);
  suggestions.push(`${baseName}_x`);
  return suggestions.map(name => sanitizeInput(name, 50));
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editCountLoading, setEditCountLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [isSocialLogin, setIsSocialLogin] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageURL, setProfileImageURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lastUploadTime, setLastUploadTime] = useState(null);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [editCount, setEditCount] = useState(0);
  const [editLimitReached, setEditLimitReached] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      signOut(auth)
        .then(() => {
          navigate('/');
          toast.info("Session expired. You have been logged out.");
        })
        .catch((error) => {
          console.error("Error signing out:", error);
          setError("Failed to log out: " + error.message);
        });
    }, 5 * 60 * 1000);
  };

  const handleUserActivity = () => {
    resetTimeout();
  };

  const getLoginMethod = (user) => {
    if (!user?.providerData?.length) return null;
    const providers = user.providerData.map(provider => provider.providerId);
    if (providers.includes('google.com')) return 'google';
    if (providers.includes('facebook.com')) return 'facebook';
    if (providers.includes('password')) return 'email';
    return 'unknown';
  };

  const getLoginMethodIcon = (method) => {
    switch (method) {
      case 'google': return <FaGoogle className="text-red-400" />;
      case 'facebook': return <FaFacebook className="text-blue-400" />;
      default: return <FaEnvelope className="text-purple-400" />;
    }
  };

  const getLoginMethodText = (method) => {
    switch (method) {
      case 'google': return 'Google Account';
      case 'facebook': return 'Facebook Account';
      case 'email': return 'Email & Password';
      default: return 'Unknown Method';
    }
  };

  const checkAdminStatus = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const isAdminValue = userData.isAdmin === true;
        setUserRole(isAdminValue ? 'admin' : 'user');
        setIsAdmin(isAdminValue);
        return isAdminValue;
      } else {
        await setDoc(doc(db, "users", userId), {
          displayName: sanitizeInput(user?.displayName || "", 50),
          email: sanitizeInput(user?.email || "", 50),
          photoURL: user?.photoURL || "",
          isAdmin: false,
          updatedAt: new Date().toISOString(),
        });
        setUserRole('user');
        setIsAdmin(false);
        return false;
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setError("Failed to check admin status: " + error.message);
      return false;
    }
  };

  const checkEditLimit = async (userId) => {
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      const editsQuery = query(
        collection(db, "profile_edits"),
        where("userId", "==", userId),
        where("date", "==", today)
      );
      const editsSnapshot = await getDocs(editsQuery);
      const count = editsSnapshot.size;
      setEditCountLoading(true);
      setEditCount(count);
      setEditLimitReached(count >= 5);
      setEditCountLoading(false);
      if (count >= 5) {
        toast.error("Anda telah mencapai batas 5 kali pengeditan profil harian. Silakan coba lagi besok.", {
          position: "top-center",
          autoClose: 5000,
          toastId: "edit-limit-reached"
        });
      }
      return { canEdit: count < 5, currentDayEditCount: count };
    } catch (error) {
      console.error("Error checking edit limit:", error);
      setError("Failed to check edit limit: " + error.message);
      setEditCountLoading(false);
      return { canEdit: false, currentDayEditCount: 0 };
    }
  };

  const deletePreviousEdits = async (userId, type) => {
    try {
      const editsQuery = query(
        collection(db, "profile_edits"),
        where("userId", "==", userId),
        where("type", "==", type)
      );
      const editsSnapshot = await getDocs(editsQuery);
      const deletePromises = editsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      await checkEditLimit(userId);
    } catch (error) {
      console.error(`Error deleting previous ${type} edits:`, error);
      toast.error(`Gagal menghapus log edit ${type} sebelumnya: ${error.message}`, {
        position: "top-center",
        autoClose: 5000,
      });
    }
  };

const logProfileEdit = async (userId, type, beforeName, newName) => {
  try {
    // Validate inputs first
    if (!userId || typeof userId !== 'string' || userId.length === 0 || userId.length > 128) {
      throw new Error('Invalid userId');
    }
    
    if (!type || typeof type !== 'string' || !['displayName', 'email', 'password', 'photoURL', 'auth_profile'].includes(type)) {
      throw new Error('Invalid type. Must be one of: displayName, email, password, photoURL, auth_profile');
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format (exactly 10 chars)
    
    const { canEdit } = await checkEditLimit(userId);
    if (!canEdit) {
      toast.error("Batas pengeditan harian telah tercapai. Silakan coba lagi besok.", {
        position: "top-center",
        autoClose: 5000,
      });
      return false;
    }

    await deletePreviousEdits(userId, type);

    // Fetch IP or use valid fallback
    let ipAddress = "127.0.0.1"; // Valid fallback IP
    try {
      const response = await fetch('https://api.ipify.org?format=json', { 
        signal: AbortSignal.timeout(5000) 
      });
      if (!response.ok) throw new Error('IP fetch failed');
      const data = await response.json();
      // Validate IP format and length (0-45 characters as per security rules)
      if (data.ip && data.ip.match(/^(\d{1,3}\.){3}\d{1,3}$/) && data.ip.length <= 45) {
        ipAddress = data.ip;
      }
    } catch (error) {
      console.warn("IP fetch failed, using fallback:", error.message);
    }

    // Build the base log data with REQUIRED fields
    const logData = {
      userId: userId.trim(), // Required: string 1-128 chars
      type: type.trim(), // Required: string 1-50 chars, must be valid type
      timestamp: serverTimestamp(), // Required: Firestore timestamp (not ISO string!)
      editedBy: userId.trim(), // Required: string 1-128 chars, must match userId
      date: today, // Optional: string exactly 10 chars (YYYY-MM-DD)
      ipAddress: ipAddress.trim() // Optional: string 0-45 chars
    };

    // Add conditional fields based on type
    if (type === "displayName" && beforeName && newName) {
      // Validate display name lengths (0-50 chars as per security rules)
      if (beforeName.length <= 50 && newName.length <= 50) {
        logData.beforeName = beforeName.trim();
        logData.newName = newName.trim();
      }
    } else if (type === "email" && beforeName && newName) {
      // Validate email format and length (0-254 chars as per security rules)
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (beforeName.length <= 254 && newName.length <= 254 && 
          (beforeName === 'anonymous' || emailRegex.test(beforeName)) &&
          (newName === 'anonymous' || emailRegex.test(newName))) {
        logData.emailBefore = beforeName.trim();
        logData.emailAfter = newName.trim();
      }
    }

    console.log("logProfileEdit data being sent:", {
      ...logData,
      timestamp: 'serverTimestamp()' // Don't log the actual timestamp object
    });

    // Create the document
    await addDoc(collection(db, "profile_edits"), logData);
    await checkEditLimit(userId);
    
    console.log("Profile edit logged successfully");
    return true;
    
  } catch (error) {
    console.error("Error logging profile edit:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      userId: userId,
      type: type
    });
    
    let errorMessage = "Gagal mencatat perubahan profil";
    if (error.code === 'permission-denied') {
      errorMessage = "Tidak memiliki izin untuk mencatat perubahan profil";
    } else if (error.code === 'invalid-argument') {
      errorMessage = "Data yang dikirim tidak valid";
    }
    
    setError(errorMessage + ": " + error.message);
    toast.error(errorMessage + ": " + error.message, {
      position: "top-center",
      autoClose: 5000,
    });
    return false;
  }
};

// Helper function to sanitize input (if you don't have it)
const sanitizeInput = (input, maxLength) => {
  if (!input || typeof input !== 'string') return '';
  return input.trim().substring(0, maxLength);
};

  const checkDisplayNameUnique = async (name) => {
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("displayName", "==", name)
      );
      const querySnapshot = await getDocs(usersQuery);
      return querySnapshot.empty;
    } catch (error) {
      console.error("Error checking display name uniqueness:", error);
      setError("Gagal memeriksa keunikan nama tampilan: " + error.message);
      return false;
    }
  };

  useEffect(() => {
    setLoading(true);
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error("Auth state check timed out");
        setError("Gagal memuat profil: Waktu autentikasi habis. Silakan login kembali.");
        setLoading(false);
        navigate('/');
      }
    }, 5000);

    const checkAuthState = async () => {
      try {
        const currentUser = getAuth().currentUser;
        if (currentUser) {
          setUser(currentUser);
          setDisplayName(sanitizeInput(currentUser.displayName || "", 50));
          setEmail(sanitizeInput(currentUser.email || "", 50));
          setProfileImageURL(currentUser.photoURL || "");
          setIsSocialLogin(getLoginMethod(currentUser) === 'google' || getLoginMethod(currentUser) === 'facebook');
          await checkEditLimit(currentUser.uid);
          await checkAdminStatus(currentUser.uid);
          setLoading(false);
          clearTimeout(timeoutId);
        } else {
          setError("Tidak ada pengguna yang login. Mengarahkan ke halaman login.");
          setLoading(false);
          navigate('/');
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error("Manual auth check failed:", error);
        setError("Gagal memverifikasi autentikasi: " + error.message);
        setLoading(false);
        navigate('/');
        clearTimeout(timeoutId);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUser(user);
          setDisplayName(sanitizeInput(user.displayName || "", 50));
          setEmail(sanitizeInput(user.email || "", 50));
          setProfileImageURL(user.photoURL || "");

          const loginMethod = getLoginMethod(user);
          setIsSocialLogin(loginMethod === 'google' || loginMethod === 'facebook');

          await checkEditLimit(user.uid);

          const userRef = doc(db, "users", user.uid);
          const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
            try {
              if (docSnap.exists()) {
                const userData = docSnap.data();
                setDisplayName(sanitizeInput(userData.displayName || user.displayName || "", 50));
                setEmail(sanitizeInput(userData.email || user.email || "", 50));
                setProfileImageURL(userData.photoURL || user.photoURL || "");
                setPendingEmail(userData.pendingEmail || "");
                setEmailVerificationSent(!!userData.pendingEmail);
                const isAdminValue = userData.isAdmin === true;
                setUserRole(isAdminValue ? 'admin' : 'user');
                setIsAdmin(isAdminValue);
              } else {
                checkAdminStatus(user.uid);
              }
            } catch (error) {
              console.error("Error in user snapshot listener:", error);
              setError("Gagal memuat data pengguna: " + error.message);
            }
          }, (error) => {
            console.error("Error setting up user snapshot:", error);
            setError("Gagal mengatur listener data pengguna: " + error.message);
            checkAdminStatus(user.uid);
          });

          const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
          const editsQuery = query(
            collection(db, "profile_edits"),
            where("userId", "==", user.uid),
            where("date", "==", today)
          );
          const unsubscribeEdits = onSnapshot(editsQuery, (snapshot) => {
            try {
              const count = snapshot.size;
              setEditCountLoading(true);
              setEditCount(count);
              setEditLimitReached(count >= 5);
              setEditCountLoading(false);
            } catch (error) {
              console.error("Error in profile_edits snapshot:", error);
              setError("Gagal memantau perubahan profil: " + error.message);
              setEditCountLoading(false);
            }
          }, (error) => {
            console.error("Error setting up profile_edits snapshot:", error);
            setError("Gagal mengatur listener perubahan profil: " + error.message);
            setEditCountLoading(false);
          });

          resetTimeout();

          window.addEventListener('mousemove', handleUserActivity);
          window.addEventListener('keydown', handleUserActivity);
          window.addEventListener('click', handleUserActivity);

          setLoading(false);
          clearTimeout(timeoutId);

          return () => {
            if (unsubscribeUser) unsubscribeUser();
            if (unsubscribeEdits) unsubscribeEdits();
            unsubscribe();
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
            window.removeEventListener('click', handleUserActivity);
          };
        } else {
          setError("Tidak ada pengguna yang login. Mengarahkan ke halaman login.");
          setLoading(false);
          navigate('/');
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error("Error in auth state listener:", error);
        setError("Gagal autentikasi: " + error.message);
        setLoading(false);
        navigate('/');
        clearTimeout(timeoutId);
      }
    }, (error) => {
      console.error("Error setting up auth listener:", error);
      setError("Gagal mengatur listener autentikasi: " + error.message);
      setLoading(false);
      navigate('/');
      clearTimeout(timeoutId);
      checkAuthState();
    });

    setTimeout(checkAuthState, 3000);

    return () => {
      clearTimeout(timeoutId);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [navigate]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
    setNameSuggestions([]);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { canEdit } = await checkEditLimit(user.uid);
    if (!canEdit) {
      return;
    }

    const now = Date.now();
    if (lastUploadTime && now - lastUploadTime < 30 * 1000) {
      setError("Harap tunggu 30 detik sebelum mengunggah gambar lain.");
      return;
    }

    validateImageFile(file, async (error) => {
      if (error) {
        setError(error.message);
        return;
      }

      setUploading(true);
      clearMessages();

      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
          { method: "POST", body: formData }
        );

        const data = await response.json();
        if (!data.success) throw new Error("Upload failed: " + (data.error?.message || "Unknown error"));

        const publicUrl = data.data.display_url;

        await updateProfile(user, { photoURL: publicUrl });

        await setDoc(
          doc(db, "users", user.uid),
          {
            displayName: sanitizeInput(displayName || user.displayName || "", 50),
            email: sanitizeInput(user.email, 50),
            photoURL: publicUrl,
            role: userRole,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        const logged = await logProfileEdit(user.uid, "photoURL");
        if (logged) {
          setProfileImageURL(publicUrl);
          setSuccess("Gambar profil berhasil diperbarui!");
          setLastUploadTime(now);
          toast.success("Gambar profil berhasil diperbarui!", {
            position: "top-center",
            autoClose: 5000,
          });
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        setError("Gagal mengunggah gambar: " + error.message);
      } finally {
        setUploading(false);
      }
    });
  };

const handleSaveProfile = async (e) => {
  e.preventDefault();
  clearMessages();

  const { canEdit } = await checkEditLimit(user.uid);
  if (!canEdit) {
    return;
  }

  const sanitizedDisplayName = sanitizeInput(displayName, 50);
  const sanitizedEmail = sanitizeInput(email, 50);
  const sanitizedNewPassword = sanitizeInput(newPassword, 20);
  const sanitizedConfirmPassword = sanitizeInput(confirmPassword, 20);

  if (sanitizedDisplayName.length > 50) {
    setError("Nama tampilan tidak boleh melebihi 50 karakter.");
    return;
  }
  if (sanitizedEmail.length > 50) {
    setError("Email tidak boleh melebihi 50 karakter.");
    return;
  }
  if (sanitizedNewPassword && sanitizedNewPassword.length > 20) {
    setError("Kata sandi baru tidak boleh melebihi 20 karakter.");
    return;
  }
  if (sanitizedConfirmPassword && sanitizedConfirmPassword.length > 20) {
    setError("Konfirmasi kata sandi tidak boleh melebihi 20 karakter.");
    return;
  }
  if (!sanitizedDisplayName.trim()) {
    setError("Nama tampilan wajib diisi.");
    return;
  }

  try {
    const originalDisplayName = user.displayName || "";
    const originalEmail = user.email;

    if (sanitizedDisplayName !== originalDisplayName) {
      const isUnique = await checkDisplayNameUnique(sanitizedDisplayName);
      if (!isUnique) {
        const suggestions = generateNameSuggestions(sanitizedDisplayName);
        setNameSuggestions(suggestions);
        setError(`Nama tampilan "${sanitizedDisplayName}" sudah digunakan. Coba salah satu dari: ${suggestions.join(', ')}`);
        return;
      }
      const logged = await logProfileEdit(user.uid, "displayName", originalDisplayName, sanitizedDisplayName);
      if (!logged) return;
      await updateProfile(user, { displayName: sanitizedDisplayName });
      // Log auth profile update
      await logProfileEdit(user.uid, "auth_profile", originalDisplayName, sanitizedDisplayName);
    }

    if (sanitizedEmail !== originalEmail) {
      if (!currentPassword) {
        setError(isSocialLogin
          ? "Kata sandi saat ini diperlukan untuk mengubah email. Jika Anda login dengan Google/Facebook, gunakan kata sandi dari akun tersebut atau atur kata sandi baru terlebih dahulu."
          : "Kata sandi saat ini diperlukan untuk mengubah email.");
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      const logged = await logProfileEdit(user.uid, "email", originalEmail, sanitizedEmail);
      if (!logged) return;
      await updateEmail(user, sanitizedEmail);
      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        displayName: sanitizedDisplayName,
        email: user.email,
        pendingEmail: sanitizedEmail,
        photoURL: profileImageURL,
        role: userRole,
        updatedAt: serverTimestamp(), // Use serverTimestamp
      }, { merge: true });

      setEmailVerificationSent(true);
      setSuccess("Email verifikasi telah dikirim ke alamat email baru Anda. Silakan verifikasi untuk menyelesaikan perubahan email.");
      toast.success("Email verifikasi telah dikirim ke alamat email baru Anda.", {
        position: "top-center",
        autoClose: 5000,
      });
    } else {
      await setDoc(doc(db, "users", user.uid), {
        displayName: sanitizedDisplayName,
        email: sanitizedEmail,
        photoURL: profileImageURL,
        role: userRole,
        updatedAt: serverTimestamp(), // Use serverTimestamp
      }, { merge: true });
    }

    if (sanitizedNewPassword) {
      if (!currentPassword) {
        setError(isSocialLogin
          ? "Kata sandi saat ini diperlukan untuk mengubah kata sandi. Jika Anda login dengan Google/Facebook, masukkan kata sandi dari akun tersebut."
          : "Kata sandi saat ini diperlukan untuk mengubah kata sandi.");
        return;
      }

      if (sanitizedNewPassword !== sanitizedConfirmPassword) {
        setError("Kata sandi baru tidak cocok.");
        return;
      }

      if (sanitizedNewPassword.length < 6) {
        setError("Kata sandi baru harus minimal 6 karakter.");
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      const logged = await logProfileEdit(user.uid, "password");
      if (!logged) return;
      await updatePassword(user, sanitizedNewPassword);
    }

    setSuccess("Profil berhasil diperbarui!");
    toast.success("Profil berhasil diperbarui!", {
      position: "top-center",
      autoClose: 5000,
    });
    setIsEditing(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  } catch (error) {
    console.error("Error saving profile:", error, {
      code: error.code,
      message: error.message,
      displayName: sanitizedDisplayName,
      email: sanitizedEmail,
    });
    if (error.code === 'auth/wrong-password') {
      setError(isSocialLogin
        ? "Kata sandi saat ini salah. Silakan gunakan kata sandi dari akun Google/Facebook Anda atau atur kata sandi baru terlebih dahulu."
        : "Kata sandi saat ini salah.");
    } else if (error.code === 'auth/email-already-in-use') {
      setError("Email ini sudah digunakan oleh akun lain.");
    } else if (error.code === 'auth/invalid-email') {
      setError("Alamat email tidak valid.");
    } else {
      setError("Gagal memperbarui profil: " + error.message);
    }
    toast.error(error.message, {
      position: "top-center",
      autoClose: 5000,
    });
  }
};

const handleCancelEdit = async () => {
  setIsEditing(false);
  setDisplayName(sanitizeInput(user?.displayName || "", 50));
  setEmail(sanitizeInput(user?.email || "", 50));
  setCurrentPassword("");
  setNewPassword("");
  setConfirmPassword("");
  setEmailVerificationSent(false);
  setNameSuggestions([]);
  clearMessages();
  // Ensure no Firestore write on cancel
  console.log("Cancel edit triggered, no Firestore write performed");
};

  const handleDeleteAccount = async () => {
    if (!user) {
      setError("Pengguna tidak login.");
      return;
    }

    const confirmed = window.confirm("Ini akan menghapus akun Anda dan semua data terkait secara permanen, termasuk komentar Anda. Apakah Anda yakin?");
    if (!confirmed) return;

    setDeleting(true);
    clearMessages();

    try {
      const commentsQuery = query(
        collection(db, "comments"),
        where("userId", "==", user.uid)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const deleteCommentPromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteCommentPromises);

      await deleteDoc(doc(db, "users", user.uid));
      await user.delete();

      await addDoc(collection(db, "logs"), {
        action: "USER_DELETE",
        userEmail: user.email,
        details: { email: user.email, isAdmin },
        timestamp: new Date()
      });

      toast.success("Akun berhasil dihapus.", {
        position: "top-center",
        autoClose: 5000,
      });
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("Gagal menghapus akun: " + error.message);
      toast.error("Gagal menghapus akun: " + error.message, {
        position: "top-center",
        autoClose: 5000,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setDisplayName(suggestion);
    setNameSuggestions([]);
    setError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-white/80">Memuat profil Anda...</div>
        </div>
      </div>
    );
  }

  const loginMethod = getLoginMethod(user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 max-w-4xl py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center text-white/70 hover:text-white transition-all duration-300 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 hover:border-white/20"
          >
            <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Kembali ke Beranda
          </button>
          <div className="text-right">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Pengaturan Profil
            </h1>
            <p className="text-white/60 mt-1">Kelola preferensi akun Anda</p>
          </div>
        </div>

        {editLimitReached && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 px-6 py-4 rounded-2xl mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-center">
              <FaExclamationTriangle className="mr-3 text-red-400" />
              Anda telah mencapai batas 5 kali pengeditan profil harian. Silakan coba lagi besok.
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 px-6 py-4 rounded-2xl mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
              {error}
              {nameSuggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-red-200/80">Nama yang disarankan:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {nameSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="px-3 py-1 bg-purple-500/20 text-purple-200 rounded-full hover:bg-purple-500/30 transition-all duration-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-200 px-6 py-4 rounded-2xl mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              {success}
            </div>
          </div>
        )}
        {emailVerificationSent && (
          <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 text-yellow-200 px-6 py-4 rounded-2xl mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
              Email verifikasi dikirim ke {pendingEmail}. Silakan verifikasi untuk menyelesaikan perubahan email.
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 text-amber-200 px-6 py-4 rounded-2xl mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-center space-x-3">
              <FaShieldAlt className="text-amber-400 text-xl" />
              <div>
                <div className="font-bold text-lg">Akun Administrator</div>
                <div className="text-amber-200/80 text-sm">Anda memiliki hak istimewa administratif di platform ini</div>
              </div>
            </div>
          </div>
        )}

        {isSocialLogin && (
          <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 text-blue-200 px-6 py-4 rounded-2xl mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-start space-x-3">
              <FaInfoCircle className="mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium mb-1">Akun Login Sosial Terdeteksi</div>
                <div className="text-sm text-blue-200/80">
                  Anda login menggunakan {getLoginMethodText(loginMethod)}. Untuk mengubah email atau kata sandi, 
                  Anda perlu menggunakan kata sandi yang terkait dengan akun {loginMethod === 'google' ? 'Google' : 'Facebook'} Anda. 
                  Jika Anda belum memiliki kata sandi, pertimbangkan untuk membuatnya melalui pengaturan akun media sosial Anda terlebih dahulu.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:border-white/30 transition-all duration-500">
              <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 group-hover:border-white/40 transition-all duration-300 shadow-2xl">
                    {profileImageURL ? (
                      <img
                        src={profileImageURL}
                        alt="Profil"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-4xl font-bold">
                          {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || editLimitReached}
                    className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 rounded-full hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:animate-bounce disabled:opacity-50"
                  >
                    {uploading ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <FaCamera className="text-sm" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <h2 className="text-2xl font-bold text-white mt-4 text-center">{displayName || "Pengguna"}</h2>
                <p className="text-white/60 text-sm mt-1">{email}</p>
                {isAdmin && (
                  <div className="flex items-center space-x-2 mt-2 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30">
                    <FaShieldAlt className="text-amber-400 text-sm" />
                    <span className="text-amber-200 text-sm font-medium">Administrator</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Metode Login</span>
                  <div className="flex items-center space-x-2">
                    {getLoginMethodIcon(loginMethod)}
                    <span className="text-white font-medium">{getLoginMethodText(loginMethod)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Tipe Akun</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isAdmin 
                      ? 'bg-amber-500/20 text-amber-300' 
                      : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {isAdmin ? 'Administrator' : 'Pengguna Biasa'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Anggota sejak</span>
                  <span className="text-white font-medium">
                    {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Email diverifikasi</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user?.emailVerified ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {user?.emailVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Login terakhir</span>
                  <span className="text-white font-medium">
                    {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'N/A'}
                  </span>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  {isAdmin && (
                    <button
                      onClick={() => navigate('/admin')}
                      className="group w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-10 duration-700"
                    >
                      <span className="font-medium">Dashboard Admin</span>
                      <div className="flex items-center space-x-2">
                        <FaShieldAlt className="text-lg group-hover:animate-bounce" />
                        <FaChartBar className="text-lg group-hover:animate-pulse" />
                      </div>
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate('/liked')}
                    className="group w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-10 duration-700"
                  >
                    <span className="font-medium">Ke Berita yang Disukai</span>
                    <FaHeart className="text-lg group-hover:animate-bounce" />
                  </button>
                  
                  <button
                    onClick={() => navigate('/saved')}
                    className="group w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-100"
                  >
                    <span className="font-medium">Ke Berita yang Disimpan</span>
                    <FaBookmark className="text-lg group-hover:animate-bounce" />
                  </button>

                  <button
                    onClick={() => navigate('../comment-history')}
                    className="group w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200"
                  >
                    <span className="font-medium">Riwayat Komentar</span>
                    <FaComment className="text-lg group-hover:animate-bounce" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:border-white/30 transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <FaUser className="mr-3 text-purple-400" />
                  Informasi Akun
                </h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="group flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    disabled={editLimitReached}
                  >
                    <FaEdit className="mr-2 group-hover:animate-bounce" />
                    Edit Profil
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveProfile}
                      className="group flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                      disabled={editLimitReached}
                    >
                      <FaSave className="mr-2 group-hover:animate-bounce" />
                      Simpan Perubahan
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="group flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <FaTimes className="mr-2 group-hover:animate-bounce" />
                      Batal
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-white/80 font-medium">
                    <FaUser className="inline mr-2 text-purple-400" />
                    Nama Tampilan (Maks. 50 karakter)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={50}
                    disabled={!isEditing || editLimitReached}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Masukkan nama tampilan Anda"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-white/80 font-medium">
                    <FaEnvelope className="inline mr-2 text-purple-400" />
                    Alamat Email (Maks. 50 karakter)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={50}
                    disabled={!isEditing || editLimitReached}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Masukkan alamat email Anda"
                    required
                  />
                </div>

                {isEditing && (
                  <div className="space-y-4 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                    <h4 className="text-lg font-semibold text-white flex items-center">
                      <FaKey className="mr-2 text-purple-400" />
                      Pengaturan Kata Sandi
                    </h4>
                    <p className="text-white/60 text-sm">
                      {isSocialLogin
                        ? "Gunakan kata sandi akun Google/Facebook Anda untuk mengautentikasi perubahan."
                        : "Biarkan kolom kata sandi kosong jika Anda tidak ingin mengubah kata sandi."
                      }
                    </p>

                    <div className="space-y-2">
                      <label className="block text-white/80 font-medium">Kata Sandi Saat Ini</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                          placeholder="Masukkan kata sandi saat ini"
                          disabled={editLimitReached}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                          disabled={editLimitReached}
                        >
                          {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-white/80 font-medium">Kata Sandi Baru (Maks. 20 karakter)</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          maxLength={20}
                          className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                          placeholder="Masukkan kata sandi baru (min 6 karakter)"
                          minLength="6"
                          disabled={editLimitReached}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                          disabled={editLimitReached}
                        >
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-white/80 font-medium">Konfirmasi Kata Sandi Baru (Maks. 20 karakter)</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          maxLength={20}
                          className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                          placeholder="Konfirmasi kata sandi baru"
                          minLength="6"
                          disabled={editLimitReached}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                          disabled={editLimitReached}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:border-white/30 transition-all duration-500">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <FaCog className="mr-3 text-purple-400" />
                Aksi Akun
              </h3>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    signOut(auth)
                      .then(() => navigate('/'))
                      .catch((error) => {
                        console.error("Error signing out:", error);
                        setError("Gagal keluar: " + error.message);
                        toast.error("Gagal keluar: " + error.message, {
                          position: "top-center",
                          autoClose: 5000,
                        });
                      });
                  }}
                  className="group w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center">
                    <FaSignOutAlt className="mr-3 text-lg group-hover:animate-bounce" />
                    <span className="font-medium">Keluar</span>
                  </div>
                  <div className="text-sm opacity-75">Keluar dari akun Anda</div>
                </button>

                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="group w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center">
                    {deleting ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                    ) : (
                      <FaTrash className="mr-3 text-lg group-hover:animate-bounce" />
                    )}
                    <span className="font-medium">
                      {deleting ? "Menghapus Akun..." : "Hapus Akun"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaExclamationTriangle className="mr-2 text-yellow-400" />
                    <div className="text-sm opacity-75">Aksi permanen</div>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <FaExclamationTriangle className="text-red-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-red-200 mb-1">Peringatan</div>
                    <div className="text-sm text-red-200/80">
                      Menghapus akun Anda akan menghapus semua data Anda secara permanen, termasuk berita yang disukai dan disimpan, 
                      informasi profil, dan riwayat aktivitas. Tindakan ini tidak dapat dibatalkan.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
