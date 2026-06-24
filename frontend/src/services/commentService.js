/**
 * commentService.js — Giao tiếp với Comment API của Backend
 *
 * Endpoints:
 * GET    /api/posts/{postId}/comments  → Lấy danh sách bình luận (public)
 * POST   /api/posts/{postId}/comments  → Thêm bình luận (cần JWT)
 * DELETE /api/comments/{id}            → Xoá bình luận (cần JWT)
 */

import { authService } from './authService';

const API_BASE = 'http://localhost:8084';

export const commentService = {

  // ----------------------------------------------------------------
  // Lấy tất cả bình luận của một bài viết
  // Gửi kèm token nếu đã đăng nhập để Backend tính đúng canDelete
  // ----------------------------------------------------------------
  getComments: async (postId) => {
    const token = authService.getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, { headers });
    if (!res.ok) throw new Error('Không thể tải bình luận!');
    return res.json();
  },

  // ----------------------------------------------------------------
  // Thêm bình luận mới (bắt buộc đăng nhập)
  // ----------------------------------------------------------------
  addComment: async (postId, content) => {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: authService.getAuthHeaders(),
      body: JSON.stringify({ content }),
    });

    let data = null;
    try { data = await res.json(); } catch {}

    if (!res.ok) {
      throw new Error(data?.message || 'Gửi bình luận thất bại!');
    }
    return data;
  },

  // ----------------------------------------------------------------
  // Xoá bình luận theo ID
  // ----------------------------------------------------------------
  deleteComment: async (commentId) => {
    const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: authService.getAuthHeaders(),
    });

    if (!res.ok) {
      let data = null;
      try { data = await res.json(); } catch {}
      throw new Error(data?.message || 'Xoá bình luận thất bại!');
    }
  },
};
