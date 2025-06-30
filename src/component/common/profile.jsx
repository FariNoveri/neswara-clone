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
  FaHeart,
  FaBookmark,
  FaGoogle,
  FaFacebook,
  FaInfoCircle,
  FaCog,
  FaShieldAlt,
  FaChartBar,
  FaUsers
} from "react-icons/fa";
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
  signOut
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  collection
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { deleteDoc } from "firebase/firestore";

// Simple input sanitization function
const sanitizeInput = (input) => {
  if (!input) return input;
  return input
    .replace(new RegExp('[<>}{]', 'g'), '') // Remove <, >, {, }
    .replace(new RegExp('script', 'gi'), '') // Remove "script" (case-insensitive)
    .replace(new RegExp('[\\x00-\\x1F\\x7F]', 'g'), '') // Remove control characters
    .trim();
};

// Validate file type and content
const validateImageFile = (file, callback) => {
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

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

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user'); // Default role
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
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
          alert("Session expired. You have been logged out.");
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

  // Helper function to determine login method
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
      case 'google':
        return <FaGoogle className="text-red-400" />;
      case 'facebook':
        return <FaFacebook className="text-blue-400" />;
      default:
        return <FaEnvelope className="text-purple-400" />;
    }
  };

  const getLoginMethodText = (method) => {
    switch (method) {
      case 'google':
        return 'Google Account';
      case 'facebook':
        return 'Facebook Account';
      case 'email':
        return 'Email & Password';
      default:
        return 'Unknown Method';
    }
  };

  // Function to check if user is admin
  const checkAdminStatus = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role || 'user';
        setUserRole(role);
        setIsAdmin(role === 'admin');
        return role === 'admin';
      }
      return false;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setDisplayName(sanitizeInput(user.displayName || ""));
        setEmail(sanitizeInput(user.email || ""));
        setProfileImageURL(user.photoURL || "");

        // Check if user logged in via social media
        const loginMethod = getLoginMethod(user);
        setIsSocialLogin(loginMethod === 'google' || loginMethod === 'facebook');

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setDisplayName(sanitizeInput(userData.displayName || user.displayName || ""));
            setProfileImageURL(userData.photoURL || user.photoURL || "");
            setPendingEmail(userData.pendingEmail || "");
            setEmailVerificationSent(!!userData.pendingEmail);
            
            // Check admin status
            const role = userData.role || 'user';
            setUserRole(role);
            setIsAdmin(role === 'admin');
          } else {
            // Check admin status if document doesn't exist
            await checkAdminStatus(user.uid);
          }
        } catch (error) {
          console.log("Error fetching user data:", error);
          // Fallback check for admin status
          await checkAdminStatus(user.uid);
        }

        resetTimeout();

        window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);
        window.addEventListener('click', handleUserActivity);
      } else {
        navigate('/');
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [navigate]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
          {
            method: "POST",
            body: formData,
          }
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
            role: userRole, // Preserve existing role
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // Log profile image update
        await addDoc(collection(db, "logs"), {
          action: "PROFILE_UPDATE",
          userEmail: user.email,
          details: {
            type: "photoURL",
            oldValue: profileImageURL || "No previous image",
            newValue: publicUrl,
            isAdmin: isAdmin
          },
          timestamp: new Date()
        });

        setProfileImageURL(publicUrl);
        setSuccess("Profile image updated successfully!");
        setLastUploadTime(now);
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
        await updateProfile(user, {
          displayName: sanitizedDisplayName
        });

        await addDoc(collection(db, "logs"), {
          action: "PROFILE_UPDATE",
          userEmail: user.email,
          details: {
            type: "displayName",
            oldValue: originalDisplayName,
            newValue: sanitizedDisplayName,
            isAdmin: isAdmin
          },
          timestamp: new Date()
        });
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

        await updateEmail(user, sanitizedEmail);
        await sendEmailVerification(user);

        await setDoc(doc(db, "users", user.uid), {
          displayName: sanitizedDisplayName,
          email: user.email,
          pendingEmail: sanitizedEmail,
          photoURL: profileImageURL,
          role: userRole, // Preserve existing role
          updatedAt: new Date().toISOString()
        }, { merge: true });

        await addDoc(collection(db, "logs"), {
          action: "PROFILE_UPDATE",
          userEmail: user.email,
          details: {
            type: "email",
            oldValue: originalEmail,
            newValue: sanitizedEmail,
            isAdmin: isAdmin
          },
          timestamp: new Date()
        });

        setEmailVerificationSent(true);
        setSuccess("A verification email has been sent to your new email address. Please verify it to complete the email change.");
      } else {
        await setDoc(doc(db, "users", user.uid), {
          displayName: sanitizedDisplayName,
          email: sanitizedEmail,
          photoURL: profileImageURL,
          role: userRole, // Preserve existing role
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

        await updatePassword(user, newPassword);

        await addDoc(collection(db, "logs"), {
          action: "PROFILE_UPDATE",
          userEmail: user.email,
          details: {
            type: "password",
            isAdmin: isAdmin
          },
          timestamp: new Date()
        });
      }

      setSuccess("Profile updated successfully!");
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
        details: {
          email: user.email,
          isAdmin: isAdmin
        },
        timestamp: new Date()
      });

      alert("Account successfully deleted.");
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("Failed to delete account: " + error.message);
    } finally {
      setDeleting(false);
    }
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

        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 px-6 py-4 rounded-2xl mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
              {error}
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

        {/* Admin Badge */}
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

        {/* Social Login Info Banner */}
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
                    disabled={uploading}
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
                
                <div className="pt-4 border-t border-white/10 space-y-3">
                  {/* Admin Dashboard Button - Only visible to admins */}
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
                  >
                    <FaEdit className="mr-2 group-hover:animate-bounce" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveProfile}
                      className="group flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
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
                {/* Display Name Field */}
                <div className="space-y-2">
                  <label className="block text-white/80 font-medium">
                    <FaUser className="inline mr-2 text-purple-400" />
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your display name"
                    required
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-white/80 font-medium">
                    <FaEnvelope className="inline mr-2 text-purple-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                {/* Password Section - Only show when editing */}
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

                    {/* Current Password */}
                    <div className="space-y-2">
                      <label className="block text-white/80 font-medium">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                        >
                          {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
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
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                        >
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
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
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Account Actions */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:border-white/30 transition-all duration-500">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <FaCog className="mr-3 text-purple-400" />
                Account Actions
              </h3>

              <div className="space-y-4">
                {/* Sign Out Button */}
                <button
                  onClick={() => {
                    signOut(auth)
                      .then(() => {
                        navigate('/');
                      })
                      .catch((error) => {
                        console.error("Error signing out:", error);
                        setError("Failed to sign out: " + error.message);
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

                {/* Delete Account Button */}
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

              {/* Warning for account deletion */}
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

            {/* Admin-only Quick Actions */}
            {isAdmin && (
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md rounded-3xl p-8 border border-amber-500/30 hover:border-amber-500/50 transition-all duration-500">
                <h3 className="text-2xl font-bold text-amber-200 mb-6 flex items-center">
                  <FaShieldAlt className="mr-3 text-amber-400" />
                  Administrator Quick Actions
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/admin')}
                    className="group flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center">
                      <FaChartBar className="mr-3 text-lg group-hover:animate-bounce" />
                      <span className="font-medium">Dashboard</span>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/admin/users')}
                    className="group flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center">
                      <FaUsers className="mr-3 text-lg group-hover:animate-bounce" />
                      <span className="font-medium">User Management</span>
                    </div>
                  </button>
                </div>

                <div className="mt-4 p-4 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl">
                  <div className="flex items-start space-x-3">
                    <FaInfoCircle className="text-amber-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-amber-200 mb-1">Administrator Privileges</div>
                      <div className="text-sm text-amber-200/80">
                        As an administrator, you have access to user management, system analytics, 
                        breaking news management, and activity monitoring features.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;