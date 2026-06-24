import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

/**
 * AuthContext — "Bộ nhớ toàn cục về trạng thái đăng nhập"
 *
 * React Context giải quyết bài toán: "Làm sao Navbar biết user đã đăng nhập?
 * Làm sao PostForm biết hiện nút Viết bài hay không?"
 *
 * Thay vì truyền props user xuống từng component (rất phức tạp),
 * chúng ta tạo một "kho lưu trữ trung tâm" (Context).
 * Bất kỳ component nào trong app cũng có thể đọc dữ liệu từ kho này
 * bằng cách gọi hook useAuth().
 *
 * Dữ liệu được quản lý:
 * - currentUser: Thông tin user đang đăng nhập (null nếu chưa login)
 * - loading     : true trong lúc kiểm tra token khi tải trang
 * - login()     : Hàm đăng nhập
 * - logout()    : Hàm đăng xuất
 * - register()  : Hàm đăng ký
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true); // Đang kiểm tra session khi load

  // Khi app khởi động: kiểm tra xem localStorage có token còn hạn không
  useEffect(() => {
    const initAuth = async () => {
      // Đọc user đã lưu từ localStorage (để hiển thị ngay không cần chờ API)
      const storedUser = authService.getStoredUser();
      if (storedUser) {
        setCurrentUser(storedUser);
      }

      // Sau đó gọi /api/auth/me để xác nhận token còn hợp lệ không
      // (Phòng trường hợp token đã hết hạn trên server)
      try {
        const freshUser = await authService.fetchMe();
        if (freshUser) {
          setCurrentUser(freshUser);
        } else {
          setCurrentUser(null); // Token hết hạn → logout
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const userData = await authService.login(credentials);
    setCurrentUser(userData);
    return userData;
  };

  const register = async (data) => {
    const userData = await authService.register(data);
    setCurrentUser(userData);
    return userData;
  };

  const logout = () => {
    authService.clearSession();
    setCurrentUser(null);
  };

  // Cập nhật thông tin profile sau khi user chỉnh sửa thành công
  const updateProfile = (updatedUser) => {
    // Loại bỏ trường token khỏi server response (server trả token:null cho /profile)
    // để tránh ghi đè token hợp lệ trong currentUser
    const { token: _ignored, ...profileData } = updatedUser;
    const merged = { ...currentUser, ...profileData };
    setCurrentUser(merged);
    // Cập nhật localStorage với thông tin mới, giữ nguyên token cũ
    authService.saveSession(merged);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, register, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth() — Hook tiện lợi để dùng AuthContext ở bất kỳ component nào.
 *
 * Cách dùng trong bất kỳ component:
 * const { currentUser, login, logout } = useAuth();
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong AuthProvider');
  return ctx;
}
