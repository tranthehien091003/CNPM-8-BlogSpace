import { mockPosts } from '../data/mockPosts';
import { authService } from './authService';

const API_BASE = 'http://localhost:8084/api';
const USE_MOCK = false; // Đặt false khi backend sẵn sàng

// In-memory store
let posts = [...mockPosts];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const postService = {
  // GET all posts — dành cho ADMIN, lấy tất cả bài kể cả DRAFT
  getAllPosts: async () => {
    if (USE_MOCK) {
      await delay(400);
      return [...posts].sort((a, b) => new Date(b.created) - new Date(a.created));
    }
    const res = await fetch(`${API_BASE}/posts/all`, {
      headers: authService.getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  // GET top N trending posts — sắp xếp theo điểm: views + commentCount × 10
  getTrendingPosts: async (limit = 5) => {
    if (USE_MOCK) {
      await delay(200);
      return [...posts]
        .filter((p) => p.status === 'PUBLISHED')
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, limit);
    }
    const res = await fetch(`${API_BASE}/posts/trending?limit=${limit}`);
    if (!res.ok) return [];
    return res.json();
  },

  // GET published posts — hỗ trợ phân trang server-side
  getPublishedPosts: async (page = 0, size = 6) => {
    if (USE_MOCK) {
      await delay(300);
      return posts
        .filter((p) => p.status === 'PUBLISHED')
        .sort((a, b) => new Date(b.created) - new Date(a.created));
    }
    const res = await fetch(`${API_BASE}/posts?page=${page}&size=${size}`);
    const data = await res.json();
    // Trả về toàn bộ Page object (gồm content, totalPages, totalElements, number...)
    return data;
  },

  // GET post by slug
  getPostBySlug: async (slug) => {
    if (USE_MOCK) {
      await delay(300);
      return posts.find((p) => p.slug === slug) || null;
    }
    const res = await fetch(`${API_BASE}/posts/slug/${slug}`);
    if (res.status === 404) return null;
    return res.json();
  },

  // POST /api/posts/{id}/view — tăng lượt xem
  // Kiểm tra localStorage trước: nếu bài đã được tính lượt xem trên thiết bị này thì bỏ qua.
  // Dùng localStorage thay vì session vì JWT = stateless (server không nhớ session).
  incrementView: async (postId) => {
    if (!postId || USE_MOCK) return;

    const STORAGE_KEY = 'blogspace_viewed_posts';
    let viewedPosts = [];
    try {
      viewedPosts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { viewedPosts = []; }

    // Đã xem bài này rồi → không gọi API nữa
    if (viewedPosts.includes(postId)) return;

    try {
      await fetch(`${API_BASE}/posts/${postId}/view`, { method: 'POST' });
      // Đánh dấu đã xem, giới hạn danh sách lưu tối đa 200 bài gần nhất
      viewedPosts.push(postId);
      if (viewedPosts.length > 200) viewedPosts = viewedPosts.slice(-200);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(viewedPosts));
    } catch {
      // Lỗi mạng → bỏ qua, không crash ứng dụng
    }
  },

  // GET post by id
  getPostById: async (id) => {
    if (USE_MOCK) {
      await delay(200);
      return posts.find((p) => p.id === Number(id)) || null;
    }
    const res = await fetch(`${API_BASE}/posts/${id}`);
    if (res.status === 404) return null;
    return res.json();
  },

  // GET posts by current authenticated user (dùng JWT token)
  getMyPosts: async () => {
    if (USE_MOCK) {
      await delay(300);
      return [...posts].sort((a, b) => new Date(b.created) - new Date(a.created));
    }
    // Gọi endpoint /mine — Backend tự dùng JWT token để biết user nào đang hỏi
    const res = await fetch(`${API_BASE}/posts/mine`, {
      headers: authService.getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json(); // Trả về List (không phải Page) nên không cần .content
  },

  // CREATE post
  createPost: async (postData) => {
    if (USE_MOCK) {
      await delay(500);
      const newPost = {
        ...postData,
        id: Date.now(),
        created: new Date().toISOString(),
      };
      posts = [newPost, ...posts];
      return newPost;
    }
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: authService.getAuthHeaders(), // 🔒 Gửi kèm JWT token
      body: JSON.stringify({
        ...postData,
        status: postData.status || 'DRAFT'
      }),
    });
    return res.json();
  },

  // UPDATE post
  updatePost: async (id, postData) => {
    if (USE_MOCK) {
      await delay(400);
      posts = posts.map((p) =>
        p.id === Number(id) ? { ...p, ...postData } : p
      );
      return posts.find((p) => p.id === Number(id));
    }
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'PUT',
      headers: authService.getAuthHeaders(), // 🔒 Gửi kèm JWT token
      body: JSON.stringify(postData),
    });
    return res.json();
  },

  // DELETE post
  deletePost: async (id) => {
    if (USE_MOCK) {
      await delay(300);
      posts = posts.filter((p) => p.id !== Number(id));
      return { success: true };
    }
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'DELETE',
      headers: authService.getAuthHeaders(), // 🔒 Gửi kèm JWT token
    });
    if (!res.ok) {
      // Đọc thông báo lỗi từ Backend (403 Forbidden, 404 Not Found...)
      let message = 'Xóa thất bại!';
      try { const err = await res.json(); message = err.message || message; } catch {}
      throw new Error(message);
    }
    return { success: true };
  },
};
