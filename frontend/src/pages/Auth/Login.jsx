import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiLogIn, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(form);
      toast.success('Đăng nhập thành công! 🎉');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không đúng!');
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
        <h1 className="auth-card__title">Chào mừng trở lại</h1>
        <p className="auth-card__sub">Đăng nhập để viết bài và quản lý nội dung của bạn</p>

        {error && (
          <div className="auth-error">
            <FiAlertCircle size={16} /> {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <div className="auth-input-wrap">
              <FiUser className="auth-input-icon" />
              <input
                id="login-username"
                type="text"
                name="username"
                className="form-input auth-input"
                placeholder="Nhập tên đăng nhập..."
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div className="auth-input-wrap">
              <FiLock className="auth-input-icon" />
              <input
                id="login-password"
                type="password"
                name="password"
                className="form-input auth-input"
                placeholder="Nhập mật khẩu..."
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? (
              <><span className="btn-spinner" /> Đang đăng nhập...</>
            ) : (
              <><FiLogIn /> Đăng Nhập</>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="auth-switch__link">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
