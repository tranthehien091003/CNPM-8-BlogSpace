import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlusCircle, FiFileText, FiCheckCircle, FiEdit2, FiTrash2,
  FiEye, FiAlertCircle, FiBarChart2, FiSearch, FiUsers, FiX
} from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { postService } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, truncate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import './Dashboard.css';

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [searchUsername, setSearchUsername] = useState(''); // Tìm kiếm theo username (chỉ Admin)
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // ✅ Lấy user thật từ JWT

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR';

  const fetchPosts = async () => {
    setLoading(true);
    // ADMIN/MODERATOR → thấy TẤT CẢ bài viết trên hệ thống
    // MEMBER           → chỉ thấy bài viết DO CHÍNH HỌ TẠO (lọc bằng JWT trên server)
    const data = isAdmin
      ? await postService.getAllPosts()
      : await postService.getMyPosts();
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => { if (currentUser) fetchPosts(); }, [currentUser]);

  const published = posts.filter((p) => p.status === 'PUBLISHED').length;
  const draft = posts.filter((p) => p.status === 'DRAFT').length;

  // Lọc bài viết theo username (Admin) — so sánh không phân biệt hoa thường
  const filteredPosts = isAdmin && searchUsername.trim()
    ? posts.filter((p) =>
        (p.authorUsername || '').toLowerCase().includes(searchUsername.trim().toLowerCase())
      )
    : posts;

  // Số user duy nhất có bài viết (chỉ hiện cho Admin)
  const uniqueAuthors = new Set(posts.map((p) => p.authorUsername).filter(Boolean)).size;

  const handleDelete = async (id) => {
    const toastId = toast.loading('Đang xóa bài viết...');
    try {
      await postService.deletePost(id);
      toast.success('Đã xóa bài viết!', { id: toastId });
      // Chỉ xóa khỏi UI khi Backend xác nhận xóa thành công
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      // Hiện lỗi thật từ Backend (403 không có quyền, 404 không tìm thấy...)
      toast.error(err.message || 'Xóa thất bại!', { id: toastId });
    }
    setDeleteId(null);
  };

  const handleEdit = (post) => {
    navigate(`/edit-post/${post.id}`);
  };

  return (
    <div className="page-wrapper">
      <div className="container dashboard">
        {/* Header */}
        <div className="dashboard__header animate-fadeInUp">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <img
                src={currentUser?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'User')}&background=6366f1&color=fff`}
                alt={currentUser?.displayName}
                className="dashboard__avatar"
              />
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2 }}>Xin chào,</p>
                <h1 className="dashboard__title">{currentUser?.displayName || currentUser?.username}</h1>
              </div>
            </div>
            <p className="dashboard__subtitle">
              {isAdmin
                ? 'Bạn đang xem tất cả bài viết trên hệ thống với quyền ' + currentUser?.role
                : 'Quản lý bài viết của bạn tại đây'}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/create-post')}>
            <FiPlusCircle /> Viết Bài Mới
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid animate-fadeInUp">
          <div className="stat-card glass-card">
            <div className="stat-card__icon stat-card__icon--blue">
              <FiFileText size={22} />
            </div>
            <div>
              <p className="stat-card__label">Tổng bài viết</p>
              <p className="stat-card__value">{posts.length}</p>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-card__icon stat-card__icon--cyan">
              <FiCheckCircle size={22} />
            </div>
            <div>
              <p className="stat-card__label">Đã xuất bản</p>
              <p className="stat-card__value">{published}</p>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-card__icon stat-card__icon--amber">
              <FiEdit2 size={22} />
            </div>
            <div>
              <p className="stat-card__label">Bản nháp</p>
              <p className="stat-card__value">{draft}</p>
            </div>
          </div>
          {/* Thẻ số tài khoản — chỉ hiện cho Admin */}
          {isAdmin && (
            <div className="stat-card glass-card">
              <div className="stat-card__icon" style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
                <FiUsers size={22} />
              </div>
              <div>
                <p className="stat-card__label">Tài khoản đăng bài</p>
                <p className="stat-card__value">{uniqueAuthors}</p>
              </div>
            </div>
          )}
        </div>

        {/* Posts Table */}
        <div className="glass-card dashboard__table-card animate-fadeInUp">
          <div className="dashboard__table-header">
            <h2 className="dashboard__table-title">
              <FiBarChart2 />
              {isAdmin
                ? `Quản lý Tất Cả Bài Viết${searchUsername ? ` — @${searchUsername} (${filteredPosts.length} bài)` : ''}`
                : 'Bài Viết Của Tôi'
              }
            </h2>

            {/* Thanh tìm kiếm username — chỉ hiện cho Admin */}
            {isAdmin && (
              <div className="dashboard__search">
                <FiSearch className="dashboard__search-icon" size={15} />
                <input
                  type="text"
                  className="dashboard__search-input"
                  placeholder="Tìm theo @username..."
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                />
                {searchUsername && (
                  <button
                    className="dashboard__search-clear"
                    onClick={() => setSearchUsername('')}
                    title="Xóa bộ lọc"
                  >
                    <FiX size={13} />
                  </button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <LoadingSpinner text="Đang tải danh sách..." />
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <h3>Chưa có bài viết nào</h3>
              <p>Hãy bắt đầu viết bài đầu tiên của bạn!</p>
              <button className="btn btn-primary" onClick={() => navigate('/create-post')}>
                <FiPlusCircle /> Viết Bài Ngay
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="posts-table">
                <thead>
                  <tr>
                    <th>Bài Viết</th>
                    {isAdmin && <th>Tác Giả</th>}
                    <th>Trạng Thái</th>
                    <th>Ngày Tạo</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="posts-table__row">
                      <td>
                        <div className="posts-table__post-info">
                          <img
                            src={post.thumbnail || `https://picsum.photos/seed/${post.id}/80/50`}
                            alt={post.title}
                            className="posts-table__thumb"
                          />
                          <div>
                            <p className="posts-table__post-title">{truncate(post.title, 50)}</p>
                            <p className="posts-table__post-slug">{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="posts-table__author-cell">
                            <span className="posts-table__author">{post.authorName}</span>
                            {post.authorUsername && (
                              <button
                                className="posts-table__author-username"
                                onClick={() => setSearchUsername(post.authorUsername)}
                                title={`Lọc theo @${post.authorUsername}`}
                              >
                                @{post.authorUsername}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                      <td>
                        <span className={`badge ${post.status === 'PUBLISHED' ? 'badge-published' : 'badge-draft'}`}>
                          {post.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}
                        </span>
                      </td>
                      <td>
                        <span className="posts-table__date">{formatDateTime(post.created)}</span>
                      </td>
                      <td>
                        <div className="posts-table__actions">
                          <button
                            className="action-btn action-btn--view"
                            title="Xem bài viết"
                            onClick={() => navigate(`/post/${post.slug}`)}
                          >
                            <FiEye size={15} />
                          </button>
                          <button
                            className="action-btn action-btn--edit"
                            title="Chỉnh sửa"
                            onClick={() => handleEdit(post)}
                          >
                            <FiEdit2 size={15} />
                          </button>
                          <button
                            className="action-btn action-btn--delete"
                            title="Xóa bài viết"
                            onClick={() => setDeleteId(post.id)}
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal__icon">
              <FiAlertCircle size={32} color="var(--danger)" />
            </div>
            <h3>Xác nhận xóa?</h3>
            <p>Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn.</p>
            <div className="modal__actions">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>
                Hủy
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>
                <FiTrash2 /> Xóa bài viết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
