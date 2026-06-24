package com.intern.cnpm8.Controller;

import com.intern.cnpm8.RequestDTO.CommentRequestDTO;
import com.intern.cnpm8.ResponseDTO.CommentResponseDTO;
import com.intern.cnpm8.Service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CommentController — Quản lý các API liên quan đến bình luận.
 *
 * Endpoints:
 * GET    /api/posts/{postId}/comments      → Lấy tất cả bình luận của 1 bài viết (public)
 * POST   /api/posts/{postId}/comments      → Thêm bình luận (bắt buộc đăng nhập)
 * DELETE /api/comments/{id}               → Xoá bình luận (chủ sở hữu hoặc ADMIN/MOD)
 */
@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // --------------------------------------------------
    // GET /api/posts/{postId}/comments
    // Lấy danh sách bình luận của bài viết (public)
    // --------------------------------------------------
    @GetMapping("/api/posts/{postId}/comments")
    public ResponseEntity<List<CommentResponseDTO>> getComments(@PathVariable Long postId) {
        List<CommentResponseDTO> comments = commentService.getCommentsByPost(postId);
        return ResponseEntity.ok(comments);
    }

    // --------------------------------------------------
    // POST /api/posts/{postId}/comments
    // Thêm bình luận mới (cần đăng nhập)
    // --------------------------------------------------
    @PostMapping("/api/posts/{postId}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequestDTO dto) {
        try {
            CommentResponseDTO created = commentService.addComment(postId, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            // In toàn bộ lỗi ra Console IntelliJ (không dùng Map.of vì nó không chấp nhận null)
            System.err.println("====== COMMENT ERROR ======");
            e.printStackTrace();
            System.err.println("============================");

            // Dùng HashMap thay Map.of để tránh NPE khi message là null
            java.util.Map<String, String> errorBody = new java.util.HashMap<>();
            errorBody.put("message", e.getMessage() != null ? e.getMessage() : e.getClass().getName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorBody);
        }
    }

    // --------------------------------------------------
    // DELETE /api/comments/{id}
    // Xoá bình luận theo ID (cần đăng nhập, kiểm tra quyền trong Service)
    // --------------------------------------------------
    @DeleteMapping("/api/comments/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ResponseEntity.noContent().build();
    }
}
