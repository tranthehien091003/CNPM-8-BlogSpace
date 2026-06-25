import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiCalendar, FiUser, FiX, FiCheck, FiMessageSquare, FiSend, FiTrash2, FiEye } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import { postService } from '../../services/postService';
import { commentService } from '../../services/commentService';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, timeAgo } from '../../utils/helpers';
import './BlogDetail.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8084/api';

// Simple markdown renderer (basic)
function renderContent(content) {
  if (!content) return '';
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
}

// =====================================================
// Component: Một bình luận đơn lẻ
// =====================================================
function CommentItem({ comment, onDelete, currentUser }) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Phân biệt: Admin xóa bình luận của người khác vs chủ sở hữu tự xóa
  const isOwner = currentUser && comment.authorId === currentUser.id;
  const isAdminAction = comment.canDelete && !isOwner; // Admin/Mod xóa bình luận người khác

  const handleDeleteClick = () => setShowConfirm(true);

  const handleConfirm = async () => {
    setShowConfirm(false);
    setDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="comment-item animate-fadeIn">
        <img
          src={comment.authorAvatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName || 'U')}&background=6366f1&color=fff&size=40`}
          alt={comment.authorName}
          className="comment-avatar"
        />
        <div className="comment-body">
          <div className="comment-header">
            <span className="comment-author">{comment.authorName || 'Ẩn danh'}</span>
            <span className="comment-time">{timeAgo(comment.createdAt)}</span>
            {comment.canDelete && (
              <button
                className={`comment-delete-btn ${isAdminAction ? 'comment-delete-btn--admin' : ''}`}
                onClick={handleDeleteClick}
                disabled={deleting}
                title={isAdminAction ? 'Xóa bình luận (Quản trị viên)' : 'Xóa bình luận của bạn'}
              >
                <FiTrash2 size={13} />
              </button>
            )}
          </div>
          <p className="comment-content">{comment.content}</p>
        </div>
      </div>

      {/* Custom confirm dialog - nội dung khác nhau cho admin vs chủ sở hữu */}
      <ConfirmDialog
        isOpen={showConfirm}
        title={isAdminAction ? '⚠️ Xóa bình luận vi phạm' : 'Xóa bình luận'}
        message={
          isAdminAction
            ? `Bạn đang xóa bình luận của "${comment.authorName}" với tư cách Quản trị viên. Hành động này không thể hoàn tác.`
            : 'Bạn có chắc muốn xóa bình luận này không? Hành động này không thể hoàn tác.'
        }
        confirmText={isAdminAction ? 'Xóa (Quản trị)' : 'Xóa bình luận'}
        cancelText="Hủy"
        danger={true}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}

// =====================================================
// Component chính: BlogDetail
// =====================================================
export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [post, setPost] = useState(null);
  const [activeVersion, setActiveVersion] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Comment states
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    setLoading(true);
    postService.getPostBySlug(slug).then((data) => {
      setPost(data);
      setActiveVersion(null);
      setLoading(false);

      if (data && data.id) {
        // Tăng lượt xem — postService.incrementView tự kiểm tra localStorage,
        // đảm bảo chỉ gọi API đúng 1 lần/bài/thiết bị dù có F5 bao nhiêu lần.
        postService.incrementView(data.id);

        fetch(`${API_BASE}/posts/${data.id}/history`)
          .then((r) => r.json())
          .then((hist) => setHistory(hist))
          .catch(() => setHistory([]));

        commentService.getComments(data.id)
          .then(setComments)
          .catch(() => setComments([]));
      }
    });
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    setCommentError('');
    try {
      const newComment = await commentService.addComment(post.id, commentText.trim());
      setComments([newComment, ...comments]);
      setCommentText('');
    } catch (err) {
      setCommentError(err.message || 'Gửi bình luận thất bại!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      alert(err.message || 'Xoá bình luận thất bại!');
    }
  };

  if (loading) return <div className="page-wrapper"><LoadingSpinner text="Đang tải bài viết..." /></div>;

  if (!post) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ paddingTop: 100, textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔍</div>
          <h2>Không tìm thấy bài viết</h2>
          <p style={{ marginTop: 8, marginBottom: 24 }}>Bài viết này không tồn tại hoặc đã bị xóa.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            <FiArrowLeft /> Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  const displayTitle = activeVersion ? activeVersion.title : post.title;
  const displaySummary = activeVersion ? activeVersion.summary : post.summary;
  const displayThumbnail = activeVersion ? activeVersion.thumbnail : post.thumbnail;
  const displayContent = activeVersion ? activeVersion.content : post.content;

  return (
    <div className="page-wrapper">
      <div className="reading-progress" style={{ width: `${scrollProgress}%` }} />

      <div className="container blog-detail">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Quay lại
        </button>

        {activeVersion && (
          <div className="version-alert glass-card animate-fadeIn">
            <div>
              <p className="version-alert__title">💡 Bạn đang xem phiên bản lịch sử</p>
              <p className="version-alert__desc">
                Phiên bản này được lưu lúc <strong>{formatDateTime(activeVersion.editedAt)}</strong>
                {activeVersion.changeNote && ` với ghi chú: "${activeVersion.changeNote}"`}.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setActiveVersion(null)}>
              Xem bản mới nhất
            </button>
          </div>
        )}

        <article className="blog-article animate-fadeInUp">
          <header className="blog-article__header">
            <span className={`badge ${post.status === 'PUBLISHED' ? 'badge-published' : 'badge-draft'}`}>
              {post.status === 'PUBLISHED' ? '● Đã xuất bản' : '● Bản nháp'}
            </span>
            <h1 className="blog-article__title">{displayTitle}</h1>

            {displaySummary && (
              <p className="blog-article__summary">{displaySummary}</p>
            )}

            <div className="blog-article__meta">
              <div className="blog-meta-item">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || 'User')}&background=6366f1&color=fff`}
                  alt={post.authorName}
                  className="blog-meta-avatar"
                />
                <span>{post.authorName || 'Ẩn danh'}</span>
              </div>
              <div className="blog-meta-item">
                <FiCalendar size={14} />
                <span>{formatDateTime(post.created)}</span>
              </div>
              <div className="blog-meta-item">
                <FiClock size={14} />
                <span>{timeAgo(post.created)}</span>
              </div>
              <div className="blog-meta-item">
                <FiMessageSquare size={14} />
                <span>{comments.length} bình luận</span>
              </div>
              <div className="blog-meta-item">
                <FiEye size={14} />
                <span>{(post.views || 0).toLocaleString()} lượt xem</span>
              </div>

              {history.length > 0 && (
                <div
                  className="blog-meta-item blog-meta-history"
                  onClick={() => setShowHistoryModal(true)}
                  title="Xem lịch sử chỉnh sửa bài viết này"
                >
                  <FiClock size={14} />
                  <span className="history-trigger">Đã chỉnh sửa ({history.length} lần)</span>
                </div>
              )}
            </div>
          </header>

          {displayThumbnail && (
            <div className="blog-article__thumbnail">
              <img src={displayThumbnail} alt={displayTitle} />
            </div>
          )}

          <div
            className="blog-article__content"
            dangerouslySetInnerHTML={{ __html: renderContent(displayContent) }}
          />

          <footer className="blog-article__footer">
            <div className="divider" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
              Cảm ơn bạn đã đọc bài viết này! 🎉
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => navigate('/')}>
                <FiArrowLeft /> Xem thêm bài viết
              </button>
            </div>
          </footer>
        </article>

        {/* ================================================= */}
        {/* COMMENT SECTION                                    */}
        {/* ================================================= */}
        <section className="comment-section animate-fadeInUp">
          <h2 className="comment-section__title">
            <FiMessageSquare />
            Bình luận ({comments.length})
          </h2>

          {/* Form gửi bình luận — chỉ hiện khi đã đăng nhập */}
          {currentUser ? (
            <form className="comment-form glass-card" onSubmit={handleSubmitComment}>
              <div className="comment-form__user">
                <img
                  src={currentUser.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.username)}&background=6366f1&color=fff&size=40`}
                  alt={currentUser.displayName}
                  className="comment-avatar"
                />
                <span className="comment-form__name">{currentUser.displayName || currentUser.username}</span>
              </div>
              <textarea
                className="comment-textarea"
                placeholder="Viết bình luận của bạn..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                maxLength={2000}
                disabled={submitting}
              />
              {commentError && <p className="comment-error">{commentError}</p>}
              <div className="comment-form__actions">
                <span className="comment-char-count">{commentText.length}/2000</span>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitting || !commentText.trim()}
                >
                  <FiSend size={14} />
                  {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
                </button>
              </div>
            </form>
          ) : (
            <div className="comment-login-prompt glass-card">
              <FiUser size={24} />
              <p>Bạn cần <Link to="/login" className="comment-login-link">đăng nhập</Link> để bình luận.</p>
            </div>
          )}

          {/* Danh sách bình luận */}
          <div className="comment-list">
            {comments.length === 0 ? (
              <div className="comment-empty">
                <FiMessageSquare size={32} />
                <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onDelete={handleDeleteComment}
                  currentUser={currentUser}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Modal Lịch sử chỉnh sửa */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal history-modal glass-card animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal__header">
              <h3><FiClock /> Lịch sử chỉnh sửa bài viết</h3>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}><FiX size={18} /></button>
            </div>
            <div className="history-modal__body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Chọn một phiên bản dưới đây để xem lại nội dung cũ:
              </p>
              <div className="history-timeline">
                <div
                  className={`history-timeline__item ${!activeVersion ? 'is-active' : ''}`}
                  onClick={() => { setActiveVersion(null); setShowHistoryModal(false); }}
                >
                  <div className="timeline-dot"><FiCheck size={10} /></div>
                  <div className="timeline-content">
                    <p className="timeline-time">Hiện tại (Bản mới nhất)</p>
                    <p className="timeline-title">{post.title}</p>
                  </div>
                </div>
                {history.map((h, idx) => (
                  <div
                    key={h.id}
                    className={`history-timeline__item ${activeVersion?.id === h.id ? 'is-active' : ''}`}
                    onClick={() => { setActiveVersion(h); setShowHistoryModal(false); }}
                  >
                    <div className="timeline-dot">{history.length - idx}</div>
                    <div className="timeline-content">
                      <p className="timeline-time">{formatDateTime(h.editedAt)}</p>
                      {h.changeNote && <p className="timeline-note">"{h.changeNote}"</p>}
                      <p className="timeline-title">{h.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
