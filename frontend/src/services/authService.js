/**
 * authService.js — "Trung tâm giao tiếp với Auth API"
 *
 * Chứa các hàm gọi API đăng ký/đăng nhập và quản lý token trong localStorage.
 *
 * localStorage là nơi trình duyệt lưu dữ liệu vĩnh viễn (không mất khi tải lại trang).
 * Chúng ta lưu token ở đây để mỗi lần tải lại trang, user không cần đăng nhập lại.
 */

const API_BASE = 'http://localhost:8084/api/auth';
const TOKEN_KEY = 'blogspace_token';
const USER_KEY = 'blogspace_user';

export const authService = {

  // ----------------------------------------------------------------
  // Đăng ký tài khoản mới
  // ----------------------------------------------------------------
  register: async ({ username, email, password, displayName }) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, displayName }),
      });
    } catch (e) {
      throw new Error('Không thể kết nối đến server backend! Vui lòng kiểm tra xem IntelliJ/Spring Boot đang chạy ở cổng 8084 chưa.');
    }

    let data = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    }

    if (!res.ok) {
      // Thử cả data.message (custom) lẫn data.detail (chuẩn Spring Boot 3.x RFC 7807)
      throw new Error(data?.message || data?.detail || `Đăng ký thất bại (Mã lỗi: ${res.status}).`);
    }

    // Lưu token và thông tin user vào localStorage
    authService.saveSession(data);
    return data;
  },

  // ----------------------------------------------------------------
  // Đăng nhập
  // ----------------------------------------------------------------
  login: async ({ username, password }) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch (e) {
      throw new Error('Không thể kết nối đến server backend! Vui lòng kiểm tra xem IntelliJ/Spring Boot đang chạy ở cổng 8084 chưa.');
    }

    let data = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    }

    if (!res.ok) {
      throw new Error(data?.message || data?.detail || `Đăng nhập thất bại (Mã lỗi: ${res.status}). Vui lòng kiểm tra lại tài khoản/mật khẩu.`);
    }

    authService.saveSession(data);
    return data;
  },

  // ----------------------------------------------------------------
  // Lấy thông tin user hiện tại từ server (dùng khi reload trang)
  // ----------------------------------------------------------------
  fetchMe: async () => {
    const token = authService.getToken();
    if (!token) return null;

    const res = await fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      // Token hết hạn hoặc không hợp lệ → xoá session
      authService.clearSession();
      return null;
    }

    const userData = await res.json();
    // Giữ lại token gốc từ localStorage (endpoint /me trả về token: null)
    // để các request tiếp theo vẫn có thể đính kèm token vào header
    userData.token = token;
    return userData;
  },

  // ----------------------------------------------------------------
  // Lưu session (token + thông tin user) vào localStorage
  // ----------------------------------------------------------------
  saveSession: (data) => {
    // Chỉ lưu token mới nếu có (tránh ghi đè bằng null khi /me hoặc /profile không trả token)
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    localStorage.setItem(USER_KEY, JSON.stringify({
      id: data.id,
      username: data.username,
      displayName: data.displayName,
      email: data.email,
      role: data.role,
      avatarUrl: data.avatarUrl,
    }));
  },

  // ----------------------------------------------------------------
  // Xoá session (đăng xuất)
  // ----------------------------------------------------------------
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // ----------------------------------------------------------------
  // Lấy token từ localStorage
  // ----------------------------------------------------------------
  getToken: () => localStorage.getItem(TOKEN_KEY),

  // ----------------------------------------------------------------
  // Lấy thông tin user đã lưu từ localStorage
  // ----------------------------------------------------------------
  getStoredUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  // ----------------------------------------------------------------
  // Helper: Tạo header Authorization cho các request cần xác thực
  // Dùng trong postService và các service khác
  // ----------------------------------------------------------------
  getAuthHeaders: () => {
    const token = authService.getToken();
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  },
};
