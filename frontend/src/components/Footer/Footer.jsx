import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiHeart } from 'react-icons/fi';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="footer__logo">✦ BlogSpace</span>
          <p>Nền tảng blog cá nhân hiện đại,<br />nơi ý tưởng của bạn trở thành câu chuyện.</p>
        </div>
        <div className="footer__links">
          <Link to="/">Trang Chủ</Link>
          <Link to="/create-post">Viết Bài</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
        <div className="footer__socials">
          <a href="#" aria-label="GitHub"><FiGithub /></a>
          <a href="#" aria-label="Twitter"><FiTwitter /></a>
        </div>
      </div>
      <div className="footer__bottom">
        <p>© 2026 BlogSpace · Made with <FiHeart size={12} style={{ color: 'var(--danger)', display: 'inline' }} /> bằng React & Spring Boot</p>
      </div>
    </footer>
  );
}
