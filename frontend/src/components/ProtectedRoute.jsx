import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';

/**
 * ProtectedRoute — "Bảo vệ tuyến đường, chặn người chưa đăng nhập"
 *
 * Bọc bất kỳ trang nào cần đăng nhập mới vào được.
 * Nếu chưa đăng nhập → tự động chuyển hướng về /login.
 *
 * Cách dùng trong App.jsx:
 * <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 *
 * Props:
 * - children  : Component cần bảo vệ
 * - roles     : (tuỳ chọn) Mảng role được phép vào. Ví dụ: ['ADMIN', 'MODERATOR']
 *               Nếu không truyền roles → chỉ cần đăng nhập là được vào
 */
export default function ProtectedRoute({ children, roles }) {
  const { currentUser, loading } = useAuth();

  // Đang kiểm tra token → hiển thị loading để không flash nội dung
  if (loading) {
    return <div className="page-wrapper"><LoadingSpinner text="Đang xác thực..." /></div>;
  }

  // Chưa đăng nhập → chuyển về trang login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Nếu có yêu cầu về roles nhưng user không có đủ quyền → về trang chủ
  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  // Đã đăng nhập và đủ quyền → hiển thị trang
  return children;
}
