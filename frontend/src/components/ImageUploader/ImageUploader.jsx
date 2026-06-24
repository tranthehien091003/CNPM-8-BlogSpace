import { useState, useRef } from 'react';
import { FiUploadCloud, FiX, FiImage } from 'react-icons/fi';
import { authService } from '../../services/authService';
import './ImageUploader.css';

/**
 * Component upload ảnh với tính năng:
 * - Kéo thả file vào vùng upload (drag & drop)
 * - Click để mở hộp thoại chọn file
 * - Preview ảnh ngay lập tức
 * - Tự động upload lên Backend và trả về URL
 *
 * Props:
 *   value: URL ảnh hiện tại (nếu đang edit bài)
 *   onChange: hàm callback nhận URL ảnh sau khi upload xong
 */
export default function ImageUploader({ value, onChange }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Kiểm tra định dạng file
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)');
      return;
    }

    // Kiểm tra dung lượng (tối đa 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 10MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Đóng gói file vào FormData để gửi lên Backend
      const formData = new FormData();
      formData.append('file', file);

      // Lấy token đăng nhập gửi kèm để được phân quyền upload
      const headers = {};
      const token = authService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('http://localhost:8084/api/media/upload', {
        method: 'POST',
        headers: headers,
        body: formData,
        // Không set Content-Type để trình duyệt tự nhận dạng multipart/form-data kèm boundary
      });

      if (!res.ok) throw new Error('Upload thất bại');

      const data = await res.json();
      // data.url = "http://localhost:8084/uploads/abc-uuid.jpg"
      onChange(data.url);
    } catch (err) {
      setError('Upload thất bại! Hãy kiểm tra lại Backend đang chạy.');
    } finally {
      setUploading(false);
    }
  };

  // Xử lý kéo thả
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  // Xử lý click chọn file thông thường
  const handleChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  return (
    <div className="image-uploader">
      {/* Khu vực kéo thả hoặc click chọn ảnh */}
      <div
        className={`image-uploader__dropzone ${dragging ? 'is-dragging' : ''} ${value ? 'has-image' : ''}`}
        onClick={() => !value && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {/* Preview ảnh nếu đã upload */}
        {value ? (
          <div className="image-uploader__preview">
            <img src={value} alt="Preview ảnh bìa" />
            {/* Nút xóa ảnh */}
            <button
              type="button"
              className="image-uploader__remove"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              title="Xóa ảnh"
            >
              <FiX size={16} />
            </button>
            {/* Nút đổi ảnh khác */}
            <button
              type="button"
              className="image-uploader__change"
              onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}
            >
              <FiImage size={14} /> Đổi ảnh
            </button>
          </div>
        ) : (
          /* Trạng thái chờ upload */
          <div className="image-uploader__placeholder">
            {uploading ? (
              <>
                <div className="image-uploader__spinner" />
                <p>Đang upload ảnh...</p>
              </>
            ) : (
              <>
                <FiUploadCloud size={40} className="image-uploader__icon" />
                <p className="image-uploader__hint-main">
                  Kéo thả ảnh vào đây hoặc <span>click để chọn</span>
                </p>
                <p className="image-uploader__hint-sub">
                  Hỗ trợ: JPG, PNG, GIF, WebP · Tối đa 10MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hiển thị lỗi nếu có */}
      {error && <p className="image-uploader__error">{error}</p>}

      {/* Input file ẩn, được trigger bởi click vào dropzone */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </div>
  );
}
