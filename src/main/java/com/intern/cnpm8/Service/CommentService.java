package com.intern.cnpm8.Service;

import com.intern.cnpm8.RequestDTO.CommentRequestDTO;
import com.intern.cnpm8.ResponseDTO.CommentResponseDTO;

import java.util.List;

/**
 * CommentService — Định nghĩa các nghiệp vụ liên quan đến bình luận.
 */
public interface CommentService {

    /**
     * Thêm bình luận mới vào bài viết.
     * Yêu cầu người dùng đã đăng nhập (lấy thông tin từ JWT).
     */
    CommentResponseDTO addComment(Long postId, CommentRequestDTO dto);

    /**
     * Lấy danh sách bình luận của một bài viết (public — không cần đăng nhập).
     * Mỗi DTO có thêm trường canDelete để Frontend biết có hiển thị nút Xoá không.
     */
    List<CommentResponseDTO> getCommentsByPost(Long postId);

    /**
     * Xoá bình luận theo ID.
     * Chỉ tác giả bình luận hoặc ADMIN/MODERATOR mới được xoá.
     */
    void deleteComment(Long commentId);
}
