import { Link } from 'react-router-dom';
import { FiClock, FiEdit2, FiEye } from 'react-icons/fi';
import { timeAgo, truncate } from '../../utils/helpers';
import './PostCard.css';

export default function PostCard({ post, showActions = false, onEdit, onDelete }) {
  return (
    <article className="post-card glass-card animate-fadeInUp">
      {/* Thumbnail */}
      <div className="post-card__thumb">
        <Link to={`/post/${post.slug}`}>
          <img
            src={post.thumbnail || `https://picsum.photos/seed/${post.id}/800/450`}
            alt={post.title}
            loading="lazy"
          />
        </Link>
        <span className={`badge ${post.status === 'PUBLISHED' ? 'badge-published' : 'badge-draft'} post-card__badge`}>
          {post.status === 'PUBLISHED' ? '● Đã xuất bản' : '● Bản nháp'}
        </span>
      </div>

      {/* Content */}
      <div className="post-card__body">
        <div className="post-card__meta">
          <span className="post-card__author">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || 'User')}&background=6366f1&color=fff&size=24`}
              alt={post.authorName}
              className="post-card__author-avatar"
            />
            {post.authorName || 'Ẩn danh'}
          </span>
          <div className="post-card__meta-right">
            <span className="post-card__time">
              <FiClock size={12} />
              {timeAgo(post.created)}
            </span>
            <span className="post-card__views">
              <FiEye size={12} />
              {(post.views || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <Link to={`/post/${post.slug}`}>
          <h3 className="post-card__title">{post.title}</h3>
        </Link>

        <p className="post-card__summary">{truncate(post.summary, 110)}</p>

        {/* Footer */}
        {showActions ? (
          <div className="post-card__actions">
            <Link to={`/post/${post.slug}`} className="btn btn-secondary btn-sm">
              <FiEye size={13} /> Xem
            </Link>
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit?.(post)}>
              <FiEdit2 size={13} /> Sửa
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete?.(post.id)}>
              Xóa
            </button>
          </div>
        ) : (
          <Link to={`/post/${post.slug}`} className="post-card__read-more">
            Đọc tiếp <span>→</span>
          </Link>
        )}
      </div>
    </article>
  );
}
