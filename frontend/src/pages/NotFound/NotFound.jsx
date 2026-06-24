import { useNavigate } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="page-wrapper notfound">
      <div className="notfound__glow" />
      <div className="notfound__content animate-fadeInUp">
        <div className="notfound__code gradient-text">404</div>
        <h1 className="notfound__title">Trang không tìm thấy</h1>
        <p className="notfound__desc">
          Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="notfound__actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>
            <FiHome /> Về Trang Chủ
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}
