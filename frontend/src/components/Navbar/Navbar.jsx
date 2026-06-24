import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiPenTool, FiLayout, FiHome, FiMenu, FiX, FiLogOut, FiUser, FiLogIn } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [dropdownOpen, setDropdown] = useState(false);
  const navigate  = useNavigate();
  const { currentUser, logout } = useAuth();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdown(false);
    toast.success('Đã đăng xuất!');
    navigate('/');
  };

  // Tạo URL avatar từ tên hiển thị
  const avatarUrl = currentUser?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'User')}&background=6366f1&color=fff`;

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">✦</span>
          <span className="gradient-text">BlogSpace</span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar__links">
          <NavLink to="/" end className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>
            <FiHome size={16} /> Trang Chủ
          </NavLink>
          {currentUser && (
            <NavLink to="/dashboard" className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>
              <FiLayout size={16} /> Bảng Điều Khiển
            </NavLink>
          )}
        </div>

        {/* Right side */}
        <div className="navbar__right">
          {currentUser ? (
            <>
              {/* Nút Viết Bài — chỉ hiện khi đã đăng nhập */}
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/create-post')}>
                <FiPenTool size={14} /> Viết Bài
              </button>

              {/* Avatar + Dropdown Menu */}
              <div className="navbar__user" ref={dropdownRef}>
                <button
                  className="navbar__avatar-btn"
                  onClick={() => setDropdown(!dropdownOpen)}
                  title={currentUser.displayName}
                >
                  <img src={avatarUrl} alt={currentUser.displayName} className="navbar__avatar" />
                  <span className={`navbar__role-dot role-dot--${currentUser.role?.toLowerCase()}`} />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="navbar__dropdown glass-card animate-fadeIn">
                    <div className="navbar__dropdown-header">
                      <p className="navbar__dropdown-name">{currentUser.displayName}</p>
                      <p className="navbar__dropdown-role">{currentUser.role}</p>
                    </div>
                    <div className="navbar__dropdown-divider" />
                    <button
                      className="navbar__dropdown-item"
                      onClick={() => { navigate('/dashboard'); setDropdown(false); }}
                    >
                      <FiLayout size={14} /> Bảng điều khiển
                    </button>
                    <button
                      className="navbar__dropdown-item"
                      onClick={() => { navigate('/profile'); setDropdown(false); }}
                    >
                      <FiUser size={14} /> Trang cá nhân
                    </button>
                    <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={handleLogout}>
                      <FiLogOut size={14} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Chưa đăng nhập → hiện nút Đăng nhập */
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>
                <FiLogIn size={14} /> Đăng Nhập
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>
                <FiUser size={14} /> Đăng Ký
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="navbar__hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar__mobile-menu">
          <NavLink to="/" end onClick={() => setMenuOpen(false)} className="mobile-link">
            <FiHome /> Trang Chủ
          </NavLink>
          {currentUser && (
            <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} className="mobile-link">
              <FiLayout /> Bảng Điều Khiển
            </NavLink>
          )}
          {currentUser ? (
            <>
              <button className="btn btn-primary w-full" onClick={() => { navigate('/create-post'); setMenuOpen(false); }}>
                <FiPenTool /> Viết Bài Mới
              </button>
              <button className="btn btn-secondary w-full" onClick={() => { navigate('/profile'); setMenuOpen(false); }}>
                <FiUser /> Trang cá nhân
              </button>
              <button className="btn btn-secondary w-full" onClick={() => { handleLogout(); setMenuOpen(false); }}>
                <FiLogOut /> Đăng Xuất
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary w-full" onClick={() => { navigate('/login'); setMenuOpen(false); }}>
                <FiLogIn /> Đăng Nhập
              </button>
              <button className="btn btn-primary w-full" onClick={() => { navigate('/register'); setMenuOpen(false); }}>
                <FiUser /> Đăng Ký
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
