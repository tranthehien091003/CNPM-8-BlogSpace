import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiEye, FiArrowLeft, FiLink, FiImage, FiClock } from 'react-icons/fi';
import { postService } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import { generateSlug, formatDateTime } from '../../utils/helpers';
import ImageUploader from '../../components/ImageUploader/ImageUploader';
import toast from 'react-hot-toast';
import './PostForm.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8084/api';

export default function PostForm({ mode = 'create' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth(); // ✅ Lấy user thật từ JWT
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    summary: '',
    thumbnail: '',
    content: '',
    status: 'DRAFT',
    changeNote: '',
  });

  // Load bài viết hiện có nếu đang ở chế độ Edit
  useEffect(() => {
    if (mode === 'edit' && id) {
      setLoading(true);
      postService.getPostById(id).then((post) => {
        if (post) {
          setForm({
            title: post.title || '',
            slug: post.slug || '',
            summary: post.summary || '',
            thumbnail: post.thumbnail || '',
            content: post.content || '',
            status: post.status || 'DRAFT',
            changeNote: '',
          });
          setSlugManual(true);

          // Load lịch sử chỉnh sửa khi ở chế độ edit
          fetch(`${API_BASE}/posts/${id}/history`)
            .then(r => r.json())
            .then(setHistory)
            .catch(() => setHistory([]));
        } else {
          toast.error('Không tìm thấy bài viết!');
          navigate('/dashboard');
        }
        setLoading(false);
      });
    }
  }, [mode, id]);

  // Tự động sinh slug từ tiêu đề
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: slugManual ? prev.slug : generateSlug(val),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'slug') setSlugManual(true);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Tiêu đề không được để trống!');
      return;
    }
    setLoading(true);
    const toastId = toast.loading(mode === 'create' ? 'Đang lưu bài viết...' : 'Đang cập nhật...');
    try {
      const payload = {
        ...form,
        authorName: currentUser?.displayName || currentUser?.username,
        authorRole: currentUser?.role,
      };
      if (mode === 'create') {
        await postService.createPost(payload);
        toast.success('Đã đăng bài viết!', { id: toastId });
      } else {
        await postService.updatePost(id, payload);
        toast.success('Đã cập nhật bài viết!', { id: toastId });
      }
      navigate('/dashboard');
    } catch {
      toast.error('Có lỗi xảy ra!', { id: toastId });
    }
    setLoading(false);
  };

  // Khôi phục về phiên bản cũ
  const handleRollback = async (historyId) => {
    if (!window.confirm('Xác nhận khôi phục bài viết về phiên bản này? Phiên bản hiện tại sẽ được lưu vào lịch sử.')) return;
    setRollingBack(true);
    const toastId = toast.loading('Đang khôi phục...');
    try {
      const res = await fetch(`${API_BASE}/posts/${id}/rollback/${historyId}`, { method: 'POST' });
      const data = await res.json();
      setForm(prev => ({
        ...prev,
        title: data.title,
        content: data.content,
        summary: data.summary,
        thumbnail: data.thumbnail,
      }));
      // Reload lịch sử mới
      const histRes = await fetch(`${API_BASE}/posts/${id}/history`);
      setHistory(await histRes.json());
      toast.success('Đã khôi phục phiên bản cũ!', { id: toastId });
    } catch {
      toast.error('Khôi phục thất bại!', { id: toastId });
    }
    setRollingBack(false);
  };

  const renderPreviewContent = (content) => {
    if (!content) return '<p style="color:var(--text-muted)">Nội dung chưa có...</p>';
    return content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  };

  return (
    <div className="page-wrapper">
      <div className="container post-form-page">
        {/* Header */}
        <div className="pf-header animate-fadeInUp">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Quay lại
          </button>
          <div className="pf-header__right">
            {/* Nút xem lịch sử (chỉ hiện khi edit) */}
            {mode === 'edit' && history.length > 0 && (
              <button
                type="button"
                className={`btn btn-secondary ${showHistory ? 'btn-active' : ''}`}
                onClick={() => setShowHistory(!showHistory)}
              >
                <FiClock /> {showHistory ? 'Ẩn lịch sử' : `Lịch sử (${history.length})`}
              </button>
            )}
            <button
              type="button"
              className={`btn ${preview ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPreview(!preview)}
            >
              <FiEye /> {preview ? 'Tắt Preview' : 'Xem trước'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              <FiSave /> {loading ? 'Đang lưu...' : mode === 'create' ? 'Đăng Bài' : 'Cập Nhật'}
            </button>
          </div>
        </div>

        <h1 className="pf-title gradient-text animate-fadeInUp">
          {mode === 'create' ? '✦ Viết Bài Mới' : '✦ Chỉnh Sửa Bài Viết'}
        </h1>

        {/* Bảng lịch sử chỉnh sửa (chỉ hiện khi bấm nút) */}
        {showHistory && (
          <div className="pf-history glass-card animate-fadeInUp">
            <h3 className="pf-history__title"><FiClock /> Lịch sử chỉnh sửa</h3>
            <div className="pf-history__list">
              {history.map((h) => (
                <div key={h.id} className="pf-history__item">
                  <div className="pf-history__meta">
                    <span className="pf-history__time">{formatDateTime(h.editedAt)}</span>
                    {h.changeNote && (
                      <span className="pf-history__note">"{h.changeNote}"</span>
                    )}
                  </div>
                  <p className="pf-history__old-title">{h.title}</p>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleRollback(h.id)}
                    disabled={rollingBack}
                  >
                    Khôi phục phiên bản này
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`pf-layout ${preview ? 'pf-layout--split' : ''}`}>
          {/* Form */}
          <form className="pf-form glass-card animate-fadeInUp" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Tiêu đề bài viết *</label>
              <input
                type="text"
                name="title"
                className="form-input pf-title-input"
                placeholder="Nhập tiêu đề hấp dẫn..."
                value={form.title}
                onChange={handleTitleChange}
              />
            </div>

            <div className="pf-row">
              <div className="form-group">
                <label className="form-label">
                  <FiLink size={13} /> Slug (URL)
                </label>
                <input
                  type="text"
                  name="slug"
                  className="form-input"
                  placeholder="tu-dong-tao-tu-tieu-de"
                  value={form.slug}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group pf-status-group">
                <label className="form-label">Trạng thái</label>
                <select
                  name="status"
                  className="form-select"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="DRAFT">📝 Lưu Nháp</option>
                  <option value="PUBLISHED">🌐 Xuất Bản</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tóm tắt</label>
              <textarea
                name="summary"
                className="form-textarea"
                placeholder="Mô tả ngắn về bài viết (hiển thị ở trang chủ)..."
                value={form.summary}
                onChange={handleChange}
                rows={2}
              />
            </div>

            {/* 🆕 Thay thế ô nhập URL bằng ImageUploader */}
            <div className="form-group">
              <label className="form-label">
                <FiImage size={13} /> Ảnh bìa (Thumbnail)
              </label>
              <ImageUploader
                value={form.thumbnail}
                onChange={(url) => setForm((prev) => ({ ...prev, thumbnail: url }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Nội dung bài viết
                <span className="pf-markdown-hint">Hỗ trợ Markdown: # Tiêu đề, **in đậm**, *nghiêng*, `code`</span>
              </label>
              <textarea
                name="content"
                className="form-textarea pf-content-area"
                placeholder={`# Bắt đầu viết bài của bạn tại đây...\n\n## Giới thiệu\nViết nội dung hấp dẫn...\n\n## Nội dung chính\n...`}
                value={form.content}
                onChange={handleChange}
                rows={18}
              />
            </div>

            {/* 🆕 Ô ghi chú lý do chỉnh sửa (chỉ hiện khi edit) */}
            {mode === 'edit' && (
              <div className="form-group">
                <label className="form-label">
                  <FiClock size={13} /> Ghi chú chỉnh sửa
                  <span className="pf-markdown-hint">Tùy chọn — Mô tả ngắn bạn đã thay đổi gì</span>
                </label>
                <input
                  type="text"
                  name="changeNote"
                  className="form-input"
                  placeholder='Ví dụ: "Cập nhật phần kết luận" hoặc "Sửa lỗi chính tả"...'
                  value={form.changeNote}
                  onChange={handleChange}
                />
              </div>
            )}
          </form>

          {/* Preview */}
          {preview && (
            <div className="pf-preview glass-card animate-fadeIn">
              <div className="pf-preview__header">
                <FiEye /> Xem trước
              </div>
              <div className="pf-preview__body">
                {form.thumbnail && (
                  <img src={form.thumbnail} alt="thumbnail" className="pf-preview__thumb" />
                )}
                <div className="pf-preview__content">
                  <span className={`badge ${form.status === 'PUBLISHED' ? 'badge-published' : 'badge-draft'}`}>
                    {form.status === 'PUBLISHED' ? 'Xuất bản' : 'Bản nháp'}
                  </span>
                  <h1>{form.title || 'Tiêu đề bài viết...'}</h1>
                  {form.summary && <p className="pf-preview__summary">{form.summary}</p>}
                  <div
                    className="blog-content-preview"
                    dangerouslySetInnerHTML={{ __html: renderPreviewContent(form.content) }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
