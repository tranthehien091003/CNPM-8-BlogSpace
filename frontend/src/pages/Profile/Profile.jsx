import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiEdit2, FiCheck, FiX, FiUser, FiMail, FiShield, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import './Profile.css';

const API_BASE = 'http://localhost:8084';

export default function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingName, setSavingName] = useState(false);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  // ── Đổi tên hiển thị ────────────────────────────
  const handleSaveName = async () => {
    if (!displayName.trim()) {
      toast.error('Tên hiển thị không được để trống!');
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cập nhật thất bại!');
      updateProfile(data);
      toast.success('Đã cập nhật tên hiển thị!');
      setEditingName(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelName = () => {
    setDisplayName(currentUser.displayName || '');
    setEditingName(false);
  };

  // ── Upload ảnh đại diện ──────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được lớn hơn 5MB!');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Bước 1: Upload ảnh lên server, lấy URL
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${API_BASE}/api/media/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authService.getToken()}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error('Upload ảnh thất bại!');

      // Bước 2: Cập nhật avatarUrl vào profile
      const profileRes = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ avatarUrl: uploadData.url }),
      });
      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error('Cập nhật ảnh đại diện thất bại!');

      updateProfile(profileData);
      toast.success('Đã cập nhật ảnh đại diện!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const avatarUrl = currentUser.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.username)}&background=6366f1&color=fff&size=120`;

  const roleLabel = {
    ADMIN: { text: 'Quản trị viên', color: '#f97316' },
    MODERATOR: { text: 'Kiểm duyệt viên', color: '#8b5cf6' },
    USER: { text: 'Thành viên', color: '#10b981' },
  }[currentUser.role] || { text: currentUser.role, color: '#6b7280' };

  return (
    <div className="profile-page page-wrapper">
      <div className="container">
        <button className="btn btn-secondary profile-back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Quay lại
        </button>

        <div className="profile-card glass-card animate-fadeInUp">

          {/* ── Avatar Section ── */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              <img
                src={avatarUrl}
                alt={currentUser.displayName}
                className="profile-avatar"
              />
              <label
                className={`profile-avatar-upload ${uploadingAvatar ? 'profile-avatar-upload--loading' : ''}`}
                title="Thay đổi ảnh đại diện"
              >
                {uploadingAvatar
                  ? <span className="avatar-spinner" />
                  : <FiCamera size={16} />
                }
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Role badge */}
            <span className="profile-role-badge" style={{ '--role-color': roleLabel.color }}>
              <FiShield size={12} />
              {roleLabel.text}
            </span>
          </div>

          {/* ── Info Section ── */}
          <div className="profile-info">

            {/* Display Name */}
            <div className="profile-field">
              <label className="profile-field__label">
                <FiUser size={14} /> Tên hiển thị
              </label>
              {editingName ? (
                <div className="profile-field__edit">
                  <input
                    type="text"
                    className="profile-field__input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={100}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') handleCancelName();
                    }}
                    placeholder="Nhập tên hiển thị..."
                  />
                  <div className="profile-field__actions">
                    <button
                      className="btn btn-primary profile-field__save"
                      onClick={handleSaveName}
                      disabled={savingName}
                    >
                      {savingName ? '...' : <><FiCheck size={14} /> Lưu</>}
                    </button>
                    <button
                      className="btn btn-secondary profile-field__cancel"
                      onClick={handleCancelName}
                      disabled={savingName}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="profile-field__value">
                  <span>{currentUser.displayName || currentUser.username}</span>
                  <button
                    className="profile-field__edit-btn"
                    onClick={() => { setEditingName(true); setDisplayName(currentUser.displayName || ''); }}
                    title="Chỉnh sửa tên"
                  >
                    <FiEdit2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Username (readonly) */}
            <div className="profile-field">
              <label className="profile-field__label">
                <FiUser size={14} /> Tên đăng nhập
              </label>
              <div className="profile-field__value profile-field__value--readonly">
                <span>@{currentUser.username}</span>
                <span className="profile-field__badge">Không thể thay đổi</span>
              </div>
            </div>

            {/* Email (readonly) */}
            <div className="profile-field">
              <label className="profile-field__label">
                <FiMail size={14} /> Email
              </label>
              <div className="profile-field__value profile-field__value--readonly">
                <span>{currentUser.email}</span>
              </div>
            </div>
          </div>

          {/* Avatar upload hint */}
          <p className="profile-avatar-hint">
            Click vào ảnh đại diện để thay đổi · Tối đa 5MB · JPG, PNG, WebP
          </p>
        </div>
      </div>
    </div>
  );
}
