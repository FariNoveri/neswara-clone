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
  FaBookmark
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
  signOut
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc 
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { deleteDoc } from "firebase/firestore";

// Simple input sanitization function
const sanitizeInput = (input) => {
  if (!input) return input;
  return input
    .replace(/[<>{}]/g, '') // Remove <, >, {, }
    .replace(/script/gi, '') // Remove "script" (case-insensitive)
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setDisplayName(sanitizeInput(user.displayName || ""));
        setEmail(sanitizeInput(user.email || ""));
        setProfileImageURL(user.photoURL || "");

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setDisplayName(sanitizeInput(userData.displayName || user.displayName || ""));
            setProfileImageURL(userData.photoURL || user.photoURL || "");
          }
        } catch (error) {
          console.log("Error fetching user data:", error);
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
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

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
      await updateProfile(user, {
        displayName: sanitizedDisplayName
      });

      if (sanitizedEmail !== user.email) {
        if (!currentPassword) {
          setError("Current password is required to change email.");
          return;
        }

        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        await updateEmail(user, sanitizedEmail);
      }

      if (newPassword) {
        if (!currentPassword) {
          setError("Current password is required to change password.");
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
      }

      await setDoc(doc(db, "users", user.uid), {
        displayName: sanitizedDisplayName,
        email: sanitizedEmail,
        photoURL: profileImageURL,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setError("Current password is incorrect.");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-spin" style={{animationDuration: '20s'}}></div>
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
              </div>

              <div className="space-y-4">
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
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => navigate('/liked')}
                    className="group w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-10 duration-700"
                  >
                    <span className="font-medium">Go to Liked News</span>
                    <FaHeart className="text-lg group-hover:animate-bounce" />
                  </button>
                  <br />
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
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white">Account Information</h3>
                  <p className="text-white/60 mt-1">Update your personal details</p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <FaEdit />
                    <span>Edit Profile</span>
                  </button>
                ) : null}
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="group">
                  <label className="block text-white/80 text-sm font-medium mb-3 flex items-center">
                    <FaUser className="mr-2 text-purple-400" />
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(sanitizeInput(e.target.value))}
                    disabled={!isEditing}
                    className={`w-full px-6 py-4 bg-white/5 backdrop-blur-sm border rounded-2xl text-white placeholder-white/40 transition-all duration-300 ${
                      isEditing 
                        ? 'border-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 hover:border-white/30' 
                        : 'border-white/10 cursor-not-allowed opacity-60'
                    }`}
                    placeholder="Enter your display name"
                  />
                </div>

                <div className="group">
                  <label className="block text-white/80 text-sm font-medium mb-3 flex items-center">
                    <FaEnvelope className="mr-2 text-purple-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                    disabled={!isEditing}
                    className={`w-full px-6 py-4 bg-white/5 backdrop-blur-sm border rounded-2xl text-white placeholder-white/40 transition-all duration-300 ${
                      isEditing 
                        ? 'border-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 hover:border-white/30' 
                        : 'border-white/10 cursor-not-allowed opacity-60'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>

                {isEditing && (
                  <div className="space-y-6 border-t border-white/10 pt-6">
                    <h4 className="text-lg font-semibold text-white flex items-center">
                      <FaKey className="mr-2 text-purple-400" />
                      Security Settings
                    </h4>
                    
                    <div className="group">
                      <label className="block text-white/80 text-sm font-medium mb-3">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 pr-12"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-300"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      <p className="text-white/40 text-xs mt-2">Required to change email or password</p>
                    </div>

                    <div className="group">
                      <label className="block text-white/80 text-sm font-medium mb-3">
                        New Password (Optional)
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 pr-12"
                          placeholder="Enter new password (leave blank to keep current)"
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-300"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    {newPassword && (
                      <div className="group">
                        <label className="block text-white/80 text-sm font-medium mb-3">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 pr-12"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-300"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isEditing && (
                  <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-8 py-3 border border-white/20 text-white/80 rounded-full hover:bg-white/5 hover:text-white transition-all duration-300 flex items-center space-x-2"
                    >
                      <FaTimes />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                    >
                      <FaSave />
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </form>
            </div>

            <div className="bg-red-500/10 backdrop-blur-md rounded-3xl p-8 border border-red-500/20 hover:border-red-500/30 transition-all duration-500">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-red-300 flex items-center">
                  <FaExclamationTriangle className="mr-2" />
                  Danger Zone
                </h3>
                <p className="text-white/60 mt-1">Irreversible account actions</p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to sign out?')) {
                      signOut(auth);
                    }
                  }}
                  className="w-full text-left px-6 py-4 text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-2xl transition-all duration-300 border border-red-500/20 hover:border-red-500/30 flex items-center space-x-3"
                >
                  <FaSignOutAlt />
                  <div>
                    <div className="font-medium">Sign Out</div>
                    <div className="text-sm text-white/60">End your current session</div>
                  </div>
                </button>
                
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="w-full text-left px-6 py-4 text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-2xl transition-all duration-300 border border-red-500/20 hover:border-red-500/30 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaTrash />
                  <div>
                    <div className="font-medium">Delete Account</div>
                    <div className="text-sm text-white/60">Permanently remove your account and all data</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white font-medium">Uploading your image...</span>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white font-medium">Deleting your account...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;