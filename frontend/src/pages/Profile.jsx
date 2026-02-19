import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FiUser,
  FiMail,
  FiClock,
  FiTrash2,
  FiSave,
  FiAlertTriangle,
  FiX,
  FiCamera,
  FiUpload,
} from "react-icons/fi";
import { useRef } from "react";
import toast from "react-hot-toast";
import "./Profile.css";

export default function Profile() {
  const {
    currentUser,
    userProfile,
    updateProfileData,
    updateUserPhoto,
    deleteUserAccount,
  } = useAuth();
  const fileInputRef = useRef(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || "",
    dob: userProfile?.dob || "",
    gender: userProfile?.gender || "",
    bloodGroup: userProfile?.bloodGroup || "",
    phone: userProfile?.phone || "",
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  // Sync state if userProfile loads or updates, but not while user is typing
  useEffect(() => {
    if (userProfile && !isUpdating) {
      setFormData((prev) => ({
        ...prev,
        displayName: currentUser?.displayName || prev.displayName || "",
        dob: userProfile.dob || prev.dob || "",
        gender: userProfile.gender || prev.gender || "",
        bloodGroup: userProfile.bloodGroup || prev.bloodGroup || "",
        phone: userProfile.phone || prev.phone || "",
      }));
    }
  }, [userProfile, currentUser, isUpdating]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!formData.displayName.trim())
      return toast.error("Display name cannot be empty");

    setIsUpdating(true);
    try {
      await updateProfileData({
        displayName: formData.displayName.trim(),
        dob: formData.dob,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        phone: formData.phone,
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteUserAccount();
      toast.success("Account deleted successfully");
      navigate("/");
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error("Failed to delete account. You may need to re-authenticate.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Image must be less than 2MB");
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("userId", currentUser.uid);

    setIsUploadingImage(true);
    const loadingToast = toast.loading("Uploading image...");

    try {
      console.log(
        "Fetching:",
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/upload-profile-image`,
      );
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/upload-profile-image`,
        {
          method: "POST",
          body: formData,
        },
      );

      console.log("Response Status:", response.status);
      const data = await response.json();
      console.log("Response Data:", data);

      if (data.success) {
        await updateUserPhoto(data.url);
        toast.success("Profile picture updated!", { id: loadingToast });
      } else {
        throw new Error(data.details || data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Detailed Image upload error:", error);
      toast.error(`Upload failed: ${error.message}`, { id: loadingToast });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const hasChanges = () => {
    const currentName = formData.displayName?.trim() || "";
    const storedName = currentUser?.displayName?.trim() || "";
    const currentDob = formData.dob || "";
    const storedDob = userProfile?.dob || "";
    const currentGender = formData.gender || "";
    const storedGender = userProfile?.gender || "";
    const currentBlood = formData.bloodGroup || "";
    const storedBlood = userProfile?.bloodGroup || "";
    const currentPhone = formData.phone || "";
    const storedPhone = userProfile?.phone || "";

    return (
      currentName !== storedName ||
      currentDob !== storedDob ||
      currentGender !== storedGender ||
      currentBlood !== storedBlood ||
      currentPhone !== storedPhone
    );
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-image-section">
            <div
              className="profile-image-container"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingImage ? (
                <div className="image-loader">
                  <div className="spinner-small"></div>
                </div>
              ) : (
                <>
                  <img
                    src={
                      userProfile?.photoURL ||
                      currentUser?.photoURL ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || "User")}&background=00f5a0&color=0a0a14`
                    }
                    alt="Profile"
                  />
                  <div className="image-overlay">
                    <FiCamera />
                    <span>Change Photo</span>
                  </div>
                </>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={{ display: "none" }}
            />
          </div>
          <div className="header-text">
            <h1>
              My <span className="accent-text">Profile</span>
            </h1>
            <p>Manage your account settings and personal information</p>
          </div>
        </div>

        <div className="profile-card">
          <h2>
            <FiUser /> Account Information
          </h2>
          <div className="profile-info-grid">
            <div className="info-item">
              <span className="info-label">Email Address</span>
              <div
                className="info-value"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <FiMail style={{ color: "rgba(255,255,255,0.4)" }} />{" "}
                {currentUser?.email}
              </div>
            </div>
            <div className="info-item">
              <span className="info-label">Member Since</span>
              <div
                className="info-value"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <FiClock style={{ color: "rgba(255,255,255,0.4)" }} />{" "}
                {formatDate(userProfile?.createdAt)}
              </div>
            </div>
            <div className="info-item">
              <span className="info-label">Analyses Performed</span>
              <div className="info-value">
                {userProfile?.analysisCount || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <h2>
            <FiSave /> Edit Health Profile
          </h2>
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="displayName">Display Name</label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  disabled={isUpdating}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  disabled={isUpdating}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dob">Date of Birth</label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                  disabled={isUpdating}
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={isUpdating}
                  className="profile-select"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bloodGroup">Blood Group</label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  disabled={isUpdating}
                  className="profile-select"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn-update"
              disabled={isUpdating || !hasChanges()}
            >
              {isUpdating ? <div className="spinner-small"></div> : <FiSave />}
              {isUpdating ? "Updating..." : "Save Changes"}
            </button>
          </form>
        </div>

        <div className="profile-card danger-zone">
          <h2>
            <FiAlertTriangle /> Danger Zone
          </h2>
          <p className="danger-text">
            Once you delete your account, there is no going back. This will
            permanently remove your profile and all associated data from
            PharmaGuard.
          </p>
          <button
            className="btn-delete"
            onClick={() => setShowDeleteModal(true)}
          >
            <FiTrash2 /> Delete Account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>
              <FiAlertTriangle /> Delete Account?
            </h2>
            <p>
              Are you sure you want to delete your account? This action is
              permanent and cannot be undone. All your genomic analysis history
              will be lost.
            </p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                No, Keep Account
              </button>
              <button
                className="btn-confirm-delete"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
