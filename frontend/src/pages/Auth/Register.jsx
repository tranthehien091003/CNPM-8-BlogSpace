import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiMail, FiUserPlus, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm]       = useState({ username: '', email: '', password: '', displayName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      setError('Vui lòng nhập đầy đủ các trường bắt buộc!');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(form);
      toast.success('Đăng ký thành công! Chào mừng bạn đến với BlogSpace 🎉');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <div className="auth-card glass-card animate-fadeInUp">
        <div className="auth-card__logo">✦ BlogSpace</div>
        <h1 className="auth-card__title">Tạo tài khoản</h1>
        <p className="auth-card__sub">Tham gia cộng đồng và bắt đầu hành trình sáng tạo nội dung!</p>

        {error && (
          <div className="auth-error">
            <FiAlertCircle size={16} /> {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập *</label>
            <div className="auth-input-wrap">
              <FiUser className="auth-input-icon" />
              <input
                id="reg-username"
                type="text"
                name="username"
                className="form-input auth-input"
                placeholder="Tên đăng nhập duy nhất..."
                value={form.username}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tên hiển thị</label>
            <div className="auth-input-wrap">
              <FiUser className="auth-input-icon" />
              <input
                id="reg-displayname"
                type="text"
                name="displayName"
                className="form-input auth-input"
                placeholder="Tên bạn muốn hiển thị trên blog..."
                value={form.displayName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <div className="auth-input-wrap">
              <FiMail className="auth-input-icon" />
              <input
                id="reg-email"
                type="email"
                name="email"
                className="form-input auth-input"
                placeholder="email@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu * (tối thiểu 6 ký tự)</label>
            <div className="auth-input-wrap">
              <FiLock className="auth-input-icon" />
              <input
                id="reg-password"
                type="password"
                name="password"
                className="form-input auth-input"
                placeholder="Ít nhất 6 ký tự..."
                value={form.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            id="reg-submit"
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? (
              <><span className="btn-spinner" /> Đang tạo tài khoản...</>
            ) : (
              <><FiUserPlus /> Đăng Ký Ngay</>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Đã có tài khoản?{' '}
          <Link to="/login" className="auth-switch__link">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}
