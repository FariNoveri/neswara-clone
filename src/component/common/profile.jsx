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
  FaBookmark
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
  deleteDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Simple input sanitization function
const sanitizeInput = (input) => {
  if (!input) return input;
  return input
    .replace(new RegExp('[<>}{]', 'g'), '')
    .replace(new RegExp('script', 'gi'), '')
    .replace(new RegExp('[\\x00-\\x1F\\x7F]', 'g'), '')
    .trim();
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
  return suggestions.map(sanitizeInput);
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
          displayName: sanitizeInput(user?.displayName || ""),
          email: sanitizeInput(user?.email || ""),
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

  // Check edit count for the current day
  const checkEditLimit = async (userId) => {
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD in WIB
      const editsQuery = query(
        collection(db, "profile_edits"),
        where("userId", "==", userId),
        where("date", "==", today)
      );
      const editsSnapshot = await getDocs(editsQuery);
      const count = editsSnapshot.size;
      console.log("Check edit limit - Date:", today, "Count:", count); // Debug log
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

  // Delete previous displayName edits for the current day only
  const deletePreviousEdits = async (userId) => {
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD in WIB
      const editsQuery = query(
        collection(db, "profile_edits"),
        where("userId", "==", userId),
        where("date", "==", today),
        where("type", "==", "displayName")
      );
      const editsSnapshot = await getDocs(editsQuery);
      console.log("Documents to delete (displayName, today):", editsSnapshot.docs.map(doc => doc.data())); // Debug log
      const deletePromises = editsSnapshot.docs.map(doc => {
        console.log("Deleting document ID:", doc.id, "Data:", doc.data());
        return deleteDoc(doc.ref);
      });
      await Promise.all(deletePromises);
      console.log("Deleted displayName docs for", today, ":", deletePromises.length);
      await checkEditLimit(userId); // Re-check edit count after deletion
    } catch (error) {
      console.error("Error deleting previous displayName edits:", error);
      toast.error("Failed to delete previous displayName edits: " + error.message, {
        position: "top-center",
        autoClose: 5000,
      });
    }
  };

  // Log profile edit with beforeName and newName for displayName changes
  const logProfileEdit = async (userId, type, beforeName, newName) => {
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD in WIB
      const { canEdit } = await checkEditLimit(userId);
      if (!canEdit) {
        console.log("Edit limit reached, cannot log edit:", { type, beforeName, newName });
        return false;
      }

      const logData = {
        userId,
        type,
        date: today,
        timestamp: new Date().toISOString()
      };

      if (type === "displayName" && beforeName && newName) {
        await deletePreviousEdits(userId); // Only delete previous displayName edits for today
        logData.beforeName = sanitizeInput(beforeName);
        logData.newName = sanitizeInput(newName);
      }

      const docRef = await addDoc(collection(db, "profile_edits"), logData);
      console.log("Profile edit logged - Doc ID:", docRef.id, "Data:", logData); // Debug log
      await checkEditLimit(userId); // Update edit count after adding new edit
      return true;
    } catch (error) {
      console.error("Error logging profile edit:", error);
      setError("Failed to log profile edit: " + error.message);
      return false;
    }
  };

  // Check if display name is unique
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
      setError("Failed to check display name uniqueness: " + error.message);
      return false;
    }
  };

  useEffect(() => {
    setLoading(true);
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error("Auth state check timed out");
        setError("Failed to load profile: Authentication timeout. Please try logging in again.");
        setLoading(false);
        navigate('/');
      }
    }, 5000);

    const checkAuthState = async () => {
      try {
        const currentUser = getAuth().currentUser;
        if (currentUser) {
          console.log("Manual auth check: User found");
          setUser(currentUser);
          setDisplayName(sanitizeInput(currentUser.displayName || ""));
          setEmail(sanitizeInput(currentUser.email || ""));
          setProfileImageURL(currentUser.photoURL || "");
          setIsSocialLogin(getLoginMethod(currentUser) === 'google' || getLoginMethod(currentUser) === 'facebook');
          await checkEditLimit(currentUser.uid);
          await checkAdminStatus(currentUser.uid);
          setLoading(false);
          clearTimeout(timeoutId);
        } else {
          console.log("Manual auth check: No user found");
          setError("No user logged in. Redirecting to login page.");
          setLoading(false);
          navigate('/');
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error("Manual auth check failed:", error);
        setError("Failed to verify authentication: " + error.message);
        setLoading(false);
        navigate('/');
        clearTimeout(timeoutId);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        console.log("onAuthStateChanged triggered:", user ? "User logged in" : "No user");
        if (user) {
          setUser(user);
          setDisplayName(sanitizeInput(user.displayName || ""));
          setEmail(sanitizeInput(user.email || ""));
          setProfileImageURL(user.photoURL || "");

          const loginMethod = getLoginMethod(user);
          setIsSocialLogin(loginMethod === 'google' || loginMethod === 'facebook');

          await checkEditLimit(user.uid);

          const userRef = doc(db, "users", user.uid);
          const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
            try {
              if (docSnap.exists()) {
                const userData = docSnap.data();
                setDisplayName(sanitizeInput(userData.displayName || user.displayName || ""));
                setEmail(sanitizeInput(userData.email || user.email || ""));
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
              setError("Failed to load user data: " + error.message);
            }
          }, (error) => {
            console.error("Error setting up user snapshot:", error);
            setError("Failed to set up user listener: " + error.message);
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
              console.log("Real-time edit count - Date:", today, "Count:", count); // Debug log
              setEditCountLoading(true);
              setEditCount(count);
              setEditLimitReached(count >= 5);
              setEditCountLoading(false);
            } catch (error) {
              console.error("Error in profile_edits snapshot:", error);
              setError("Failed to monitor profile edits: " + error.message);
              setEditCountLoading(false);
            }
          }, (error) => {
            console.error("Error setting up profile_edits snapshot:", error);
            setError("Failed to set up profile edits listener: " + error.message);
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
          console.log("onAuthStateChanged: No user, redirecting");
          setError("No user logged in. Redirecting to login page.");
          setLoading(false);
          navigate('/');
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error("Error in auth state listener:", error);
        setError("Failed to authenticate: " + error.message);
        setLoading(false);
        navigate('/');
        clearTimeout(timeoutId);
      }
    }, (error) => {
      console.error("Error setting up auth listener:", error);
      setError("Failed to set up auth listener: " + error.message);
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
      setError("Please wait 30 seconds before uploading another image.");
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
            displayName: sanitizeInput(displayName || user.displayName || ""),
            email: sanitizeInput(user.email),
            photoURL: publicUrl,
            role: userRole,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        const logged = await logProfileEdit(user.uid, "photoURL");
        if (logged) {
          setProfileImageURL(publicUrl);
          setSuccess("Profile image updated successfully!");
          setLastUploadTime(now);
          toast.success("Profile image updated successfully!", {
            position: "top-center",
            autoClose: 5000,
          });
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        setError("Error uploading image: " + error.message);
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

    const sanitizedDisplayName = sanitizeInput(displayName);
    const sanitizedEmail = sanitizeInput(email);

    if (!sanitizedDisplayName.trim()) {
      setError("Display name is required.");
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
          setError(`Display name "${sanitizedDisplayName}" is already taken. Try one of these: ${suggestions.join(', ')}`);
          return;
        }
      }

      if (sanitizedDisplayName !== originalDisplayName) {
        const logged = await logProfileEdit(user.uid, "displayName", originalDisplayName, sanitizedDisplayName);
        if (!logged) return;
        await updateProfile(user, { displayName: sanitizedDisplayName });
      }

      if (sanitizedEmail !== originalEmail) {
        if (!currentPassword) {
          setError(isSocialLogin
            ? "Current password is required to change email. If you signed in with Google/Facebook, please use the password from that account or set up a new password first."
            : "Current password is required to change email.");
          return;
        }

        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        const logged = await logProfileEdit(user.uid, "email");
        if (!logged) return;
        await updateEmail(user, sanitizedEmail);
        await sendEmailVerification(user);

        await setDoc(doc(db, "users", user.uid), {
          displayName: sanitizedDisplayName,
          email: user.email,
          pendingEmail: sanitizedEmail,
          photoURL: profileImageURL,
          role: userRole,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        setEmailVerificationSent(true);
        setSuccess("A verification email has been sent to your new email address. Please verify it to complete the email change.");
        toast.success("A verification email has been sent to your new email address.", {
          position: "top-center",
          autoClose: 5000,
        });
      } else {
        await setDoc(doc(db, "users", user.uid), {
          displayName: sanitizedDisplayName,
          email: sanitizedEmail,
          photoURL: profileImageURL,
          role: userRole,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      if (newPassword) {
        if (!currentPassword) {
          setError(isSocialLogin
            ? "Current password is required to change password. If you signed in with Google/Facebook, please enter the password from that account."
            : "Current password is required to change password.");
          return;
        }

        if (newPassword !== confirmPassword) {
          setError("New passwords do not match.");
          return;
        }

        if (newPassword.length < 6) {
          setError("New password must be at least 6 characters long.");
          return;
        }

        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        const logged = await logProfileEdit(user.uid, "password");
        if (!logged) return;
        await updatePassword(user, newPassword);
      }

      setSuccess("Profile updated successfully!");
      toast.success("Profile updated successfully!", {
        position: "top-center",
        autoClose: 5000,
      });
      setIsEditing(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setError(isSocialLogin
          ? "Current password is incorrect. Please use the password from your Google/Facebook account or set up a new password first."
          : "Current password is incorrect.");
      } else if (error.code === 'auth/email-already-in-use') {
        setError("This email is already in use by another account.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Invalid email address.");
      } else {
        setError("Error updating profile: " + error.message);
      }
      toast.error(error.message, {
        position: "top-center",
        autoClose: 5000,
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDisplayName(sanitizeInput(user?.displayName || ""));
    setEmail(sanitizeInput(user?.email || ""));
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setEmailVerificationSent(false);
    setNameSuggestions([]);
    clearMessages();
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      setError("User is not logged in.");
      return;
    }

    const confirmed = window.confirm("This will delete your account and all associated data permanently. Are you sure?");
    if (!confirmed) return;

    setDeleting(true);
    clearMessages();

    try {
      await deleteDoc(doc(db, "users", user.uid));
      await user.delete();

      await addDoc(collection(db, "logs"), {
        action: "USER_DELETE",
        userEmail: user.email,
        details: { email: user.email, isAdmin },
        timestamp: new Date()
      });

      toast.success("Account successfully deleted.", {
        position: "top-center",
        autoClose: 5000,
      });
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("Failed to delete account: " + error.message);
      toast.error("Failed to delete account: " + error.message, {
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
          <div className="text-xl text-white/80">Loading your profile...</div>
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
            Back to Home
          </button>
          <div className="text-right">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-white/60 mt-1">Manage your account preferences</p>
          </div>
        </div>

        {editLimitReached && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 px-6 py-4 rounded-2xl mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-center">
              <FaExclamationTriangle className="mr-3 text-red-400" />
              You have reached the daily limit of 5 profile edits. Please try again tomorrow.
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
                  <p className="text-sm text-red-200/80">Suggested names:</p>
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
              Verification email sent to {pendingEmail}. Please verify to complete the email change.
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 text-amber-200 px-6 py-4 rounded-2xl mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-center space-x-3">
              <FaShieldAlt className="text-amber-400 text-xl" />
              <div>
                <div className="font-bold text-lg">Administrator Account</div>
                <div className="text-amber-200/80 text-sm">You have administrative privileges on this platform</div>
              </div>
            </div>
          </div>
        )}

        {isSocialLogin && (
          <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 text-blue-200 px-6 py-4 rounded-2xl mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-start space-x-3">
              <FaInfoCircle className="mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium mb-1">Social Login Account Detected</div>
                <div className="text-sm text-blue-200/80">
                  You signed in using your {getLoginMethodText(loginMethod)}. To change your email or password, 
                  you'll need to use the password associated with your {loginMethod === 'google' ? 'Google' : 'Facebook'} account. 
                  If you don't have a password set up, consider creating one through your social media account settings first.
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
                        alt="Profile"
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
                    className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 rounded-full hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:animate-bounce"
                    disabled={uploading || editLimitReached}
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
                <h2 className="text-2xl font-bold text-white mt-4 text-center">{displayName || "User"}</h2>
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
                  <span className="text-white/60">Login Method</span>
                  <div className="flex items-center space-x-2">
                    {getLoginMethodIcon(loginMethod)}
                    <span className="text-white font-medium">{getLoginMethodText(loginMethod)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Account Type</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isAdmin 
                      ? 'bg-amber-500/20 text-amber-300' 
                      : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {isAdmin ? 'Administrator' : 'Regular User'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Member since</span>
                  <span className="text-white font-medium">
                    {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Email verified</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user?.emailVerified ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {user?.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Last login</span>
                  <span className="text-white font-medium">
                    {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Profile Edits Today</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${editCount >= 5 ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {editCountLoading ? 'Loading...' : `${editCount}/5`}
                  </span>
                </div>
                
                <div className="pt-4 border-t border-white/10 space-y-3">
                  {isAdmin && (
                    <button
                      onClick={() => navigate('/admin')}
                      className="group w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-10 duration-700"
                    >
                      <span className="font-medium">Admin Dashboard</span>
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
                    <span className="font-medium">Go to Liked News</span>
                    <FaHeart className="text-lg group-hover:animate-bounce" />
                  </button>
                  
                  <button
                    onClick={() => navigate('/saved')}
                    className="group w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-100"
                  >
                    <span className="font-medium">Go to Saved News</span>
                    <FaBookmark className="text-lg group-hover:animate-bounce" />
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
                  Account Information
                </h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="group flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    disabled={editLimitReached}
                  >
                    <FaEdit className="mr-2 group-hover:animate-bounce" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveProfile}
                      className="group flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                      disabled={editLimitReached}
                    >
                      <FaSave className="mr-2 group-hover:animate-bounce" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="group flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <FaTimes className="mr-2 group-hover:animate-bounce" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-white/80 font-medium">
                    <FaUser className="inline mr-2 text-purple-400" />
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!isEditing || editLimitReached}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your display name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-white/80 font-medium">
                    <FaEnvelope className="inline mr-2 text-purple-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing || editLimitReached}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                {isEditing && (
                  <div className="space-y-4 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                    <h4 className="text-lg font-semibold text-white flex items-center">
                      <FaKey className="mr-2 text-purple-400" />
                      Password Settings
                    </h4>
                    <p className="text-white/60 text-sm">
                      {isSocialLogin
                        ? "Use your Google/Facebook account password to authenticate changes."
                        : "Leave password fields empty if you don't want to change your password."
                      }
                    </p>

                    <div className="space-y-2">
                      <label className="block text-white/80 font-medium">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                          placeholder="Enter current password"
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
                      <label className="block text-white/80 font-medium">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                          placeholder="Enter new password (min 6 characters)"
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
                      <label className="block text-white/80 font-medium">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                          placeholder="Confirm new password"
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
                Account Actions
              </h3>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    signOut(auth)
                      .then(() => navigate('/'))
                      .catch((error) => {
                        console.error("Error signing out:", error);
                        setError("Failed to sign out: " + error.message);
                        toast.error("Failed to sign out: " + error.message, {
                          position: "top-center",
                          autoClose: 5000,
                        });
                      });
                  }}
                  className="group w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center">
                    <FaSignOutAlt className="mr-3 text-lg group-hover:animate-bounce" />
                    <span className="font-medium">Sign Out</span>
                  </div>
                  <div className="text-sm opacity-75">Log out of your account</div>
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
                      {deleting ? "Deleting Account..." : "Delete Account"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaExclamationTriangle className="mr-2 text-yellow-400" />
                    <div className="text-sm opacity-75">Permanent action</div>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <FaExclamationTriangle className="text-red-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-red-200 mb-1">Warning</div>
                    <div className="text-sm text-red-200/80">
                      Deleting your account will permanently remove all your data, including liked and saved news, 
                      profile information, and activity history. This action cannot be undone.
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