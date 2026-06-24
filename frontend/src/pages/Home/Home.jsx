import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiSearch, FiPenTool, FiZap, FiStar, FiChevronLeft, FiChevronRight,
         FiTrendingUp, FiEye, FiMessageSquare } from 'react-icons/fi';
import PostCard from '../../components/PostCard/PostCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { postService } from '../../services/postService';
import './Home.css';

const PAGE_SIZE = 6;

export default function Home() {
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [trending, setTrending]     = useState([]);
  const navigate = useNavigate();

  // Load trang khi currentPage thay đổi
  useEffect(() => {
    setLoading(true);
    postService.getPublishedPosts(currentPage, PAGE_SIZE).then((data) => {
      setPosts(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [currentPage]);

  // Load trending (chỉ 1 lần khi mount)
  useEffect(() => {
    postService.getTrendingPosts(5).then(setTrending).catch(() => {});
  }, []);

  // Tìm kiếm client-side trên trang hiện tại
  const filtered = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.summary || '').toLowerCase().includes(search.toLowerCase())
  );

  const handlePageChange = (newPage) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setCurrentPage(newPage);
    setSearch(''); // Reset search khi chuyển trang
    document.getElementById('posts-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section className="hero">
        <div className="hero__glow hero__glow--1" />
        <div className="hero__glow hero__glow--2" />
        <div className="container hero__content">
          <div className="hero__badge animate-fadeInUp">
            <FiZap size={14} /> Nền tảng blog cá nhân hiện đại
          </div>
          <h1 className="hero__title animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            Chia sẻ kiến thức,<br />
            <span className="gradient-text">Truyền cảm hứng</span>
          </h1>
          <p className="hero__desc animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            Nơi mọi người đọc, viết và kết nối qua những bài viết chất lượng.
            Hãy bắt đầu hành trình sáng tạo nội dung của bạn ngay hôm nay.
          </p>
          <div className="hero__cta animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/create-post')}>
              <FiPenTool /> Viết Bài Ngay
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => document.getElementById('posts-section').scrollIntoView({ behavior: 'smooth' })}>
              <FiStar /> Khám phá bài viết
            </button>
          </div>

          {/* Stats */}
          <div className="hero__stats animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <div className="hero__stat">
              <span className="hero__stat-num">{totalElements}+</span>
              <span className="hero__stat-label">Bài viết</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <span className="hero__stat-num">100%</span>
              <span className="hero__stat-label">Miễn phí</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <span className="hero__stat-num">∞</span>
              <span className="hero__stat-label">Cảm hứng</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending Section ───────────────────────── */}
      {trending.length > 0 && (
        <section className="trending-section">
          <div className="container">
            <div className="trending__header">
              <h2 className="trending__title">
                <FiTrendingUp className="trending__icon" />
                Bài Viết Nổi Bật
              </h2>
              <span className="trending__subtitle">Xếp hạng theo lượt xem và bình luận</span>
            </div>

            <div className="trending__list">
              {trending.map((post, index) => (
                <Link
                  key={post.id}
                  to={`/post/${post.slug}`}
                  className="trending__item glass-card"
                >
                  <span className={`trending__rank ${index === 0 ? 'trending__rank--gold' : index === 1 ? 'trending__rank--silver' : index === 2 ? 'trending__rank--bronze' : ''}`}>
                    {index === 0 ? '🔥' : `#${index + 1}`}
                  </span>

                  <img
                    src={post.thumbnail || `https://picsum.photos/seed/${post.id}/120/80`}
                    alt={post.title}
                    className="trending__thumb"
                  />

                  <div className="trending__info">
                    <p className="trending__post-title">{post.title}</p>
                    <p className="trending__author">{post.authorName || 'Ẩn danh'}</p>
                    <div className="trending__stats">
                      <span><FiEye size={11} /> {(post.views || 0).toLocaleString()}</span>
                      <span><FiMessageSquare size={11} /> {post.commentCount || 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Posts Section */}
      <section id="posts-section" className="posts-section">
        <div className="container">
          {/* Section Header */}
          <div className="posts-section__header">
            <div>
              <h2 className="posts-section__title">Bài Viết Mới Nhất</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
                {search
                  ? `${filtered.length} kết quả cho "${search}"`
                  : `Trang ${currentPage + 1} / ${totalPages || 1} · ${totalElements} bài viết`
                }
              </p>
            </div>

            {/* Search */}
            <div className="search-bar">
              <FiSearch className="search-bar__icon" />
              <input
                type="text"
                className="search-bar__input"
                placeholder="Tìm kiếm trong trang này..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-bar__clear" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <LoadingSpinner text="Đang tải bài viết..." />
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <h3>{search ? 'Không tìm thấy bài viết' : 'Chưa có bài viết nào'}</h3>
              <p>{search ? 'Thử tìm kiếm với từ khóa khác!' : 'Hãy là người đầu tiên viết bài!'}</p>
              {!search && (
                <button className="btn btn-primary" onClick={() => navigate('/create-post')}>
                  <FiPenTool /> Viết Bài Đầu Tiên
                </button>
              )}
            </div>
          ) : (
            <div className="posts-grid">
              {filtered.map((post, i) => (
                <div key={post.id} style={{ '--i': i }}>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && !search && totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination__btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                title="Trang trước"
              >
                <FiChevronLeft size={18} />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => {
                // Chỉ hiện trang gần hiện tại để tránh quá nhiều nút
                const isNearCurrent = Math.abs(pageNum - currentPage) <= 2;
                const isFirst = pageNum === 0;
                const isLast = pageNum === totalPages - 1;
                if (!isNearCurrent && !isFirst && !isLast) {
                  // Hiện dấu "..." cho các trang bị ẩn
                  if (pageNum === 1 && currentPage > 3) return <span key={pageNum} className="pagination__ellipsis">…</span>;
                  if (pageNum === totalPages - 2 && currentPage < totalPages - 4) return <span key={pageNum} className="pagination__ellipsis">…</span>;
                  return null;
                }
                return (
                  <button
                    key={pageNum}
                    className={`pagination__btn ${pageNum === currentPage ? 'pagination__btn--active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}

              <button
                className="pagination__btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                title="Trang sau"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
