import React, { useState, useEffect, useRef } from "react";
import { 
  FaCamera, 
  FaEdit, 
  FaSave, 
  FaTimes, 
  FaEye, 
  FaEyeSlash,
  FaArrowLeft 
} from "react-icons/fa";
import { 
  auth, 
  db 
} from "../firebaseconfig";
import { 
  onAuthStateChanged, 
  updateProfile,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut // ✅ Added signOut import
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc 
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { deleteDoc } from "firebase/firestore";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageURL, setProfileImageURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Show/hide password states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const timeoutRef = useRef(null); // ✅ Ref to store the timeout

  // ✅ Function to reset the logout timer
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
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
  };

  // ✅ Handle user activity to reset timer
  const handleUserActivity = () => {
    resetTimeout();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setDisplayName(user.displayName || "");
        setEmail(user.email || "");
        setProfileImageURL(user.photoURL || "");

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setDisplayName(userData.displayName || user.displayName || "");
            setProfileImageURL(userData.photoURL || user.photoURL || "");
          }
        } catch (error) {
          console.log("Error fetching user data:", error);
        }

        // ✅ Start the timeout when user is authenticated
        resetTimeout();

        // ✅ Add event listeners for user activity
        window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);
        window.addEventListener('click', handleUserActivity);
      } else {
        navigate('/');
      }
      setLoading(false);
    });

    // ✅ Cleanup on unmount
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

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB.");
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
      if (!data.success) throw new Error("Upload failed");

      const publicUrl = data.data.display_url;

      await updateProfile(user, { photoURL: publicUrl });

      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: displayName || user.displayName || "",
          email: user.email,
          photoURL: publicUrl,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setProfileImageURL(publicUrl);
      setSuccess("Profile image updated successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Error uploading image: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    try {
      await updateProfile(user, {
        displayName: displayName.trim()
      });

      if (email !== user.email) {
        if (!currentPassword) {
          setError("Current password is required to change email.");
          return;
        }

        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        await updateEmail(user, email);
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
        displayName: displayName.trim(),
        email: email,
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
    setDisplayName(user.displayName || "");
    setEmail(user.email || "");
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                {profileImageURL ? (
                  <img
                    src={profileImageURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-500 text-4xl">
                      {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                disabled={uploading}
              >
                {uploading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <FaCamera />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">Click camera icon to change photo</p>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile}>
            <div className="space-y-6">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border rounded-md ${
                    isEditing 
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  placeholder="Enter your display name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border rounded-md ${
                    isEditing 
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  placeholder="Enter your email"
                />
              </div>

              {/* Current Password */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter current password to make changes"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Required when changing email or password
                  </p>
                </div>
              )}

              {/* New Password */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password (leave blank to keep current)"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm New Password */}
              {isEditing && newPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              )}

              {/* Account Info Display */}
              {!isEditing && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Account Information</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">User ID:</span> {user?.uid}</p>
                    <p><span className="font-medium">Account Created:</span> {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</p>
                    <p><span className="font-medium">Last Sign In:</span> {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}</p>
                    <p><span className="font-medium">Email Verified:</span> {user?.emailVerified ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <FaTimes className="mr-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
                    >
                      <FaSave className="mr-2" />
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
                  >
                    <FaEdit className="mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Additional Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to sign out?')) {
                  signOut(auth);
                }
              }}
              className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Sign Out
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span>Uploading image...</span>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full"></div>
              <span>Deleting account...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;