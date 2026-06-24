package com.intern.cnpm8.Controller;

import com.intern.cnpm8.RequestDTO.PostRequestDTO;
import com.intern.cnpm8.ResponseDTO.PostHistoryResponseDTO;
import com.intern.cnpm8.ResponseDTO.PostResponseDTO;
import com.intern.cnpm8.Service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/posts")
@RequiredArgsConstructor
// Cho phép Frontend (localhost:5173) gọi API này (tránh lỗi CORS)
@CrossOrigin(origins = "http://localhost:5173")
public class PostController {

    private final PostService postService;

    // --------------------------------------------------
    // POST /api/posts
    // Tạo bài viết mới
    // Body: JSON theo cấu trúc PostRequestDTO
    // --------------------------------------------------
    @PostMapping
    public ResponseEntity<PostResponseDTO> createPost(@Valid @RequestBody PostRequestDTO postRequestDTO) {
        PostResponseDTO response = postService.createPost(postRequestDTO);
        // Trả về HTTP 201 Created + dữ liệu bài viết vừa tạo
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // --------------------------------------------------
    // GET /api/posts?page=0&size=6
    // Lấy danh sách bài viết PUBLISHED, có phân trang
    // Mặc định: trang 0, mỗi trang 6 bài
    // --------------------------------------------------
    @GetMapping
    public ResponseEntity<Page<PostResponseDTO>> getPublishedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {

        Page<PostResponseDTO> posts = postService.getPublishedPosts(page, size);
        return ResponseEntity.ok(posts);
    }

    // --------------------------------------------------
    // GET /api/posts/mine
    // Lấy tất cả bài viết của người dùng đang đăng nhập (cần JWT token)
    // Dùng cho trang Dashboard — chỉ hiển thị bài của chính họ
    // --------------------------------------------------
    @GetMapping("/mine")
    public ResponseEntity<List<PostResponseDTO>> getMyPosts() {
        return ResponseEntity.ok(postService.getMyPosts());
    }

    // --------------------------------------------------
    // GET /api/posts/all
    // Lấy TẤT CẢ bài viết trên hệ thống (kể cả DRAFT) — chỉ dành cho ADMIN/MODERATOR
    // Frontend dùng cho trang Bảng điều khiển của Admin
    // --------------------------------------------------
    @GetMapping("/all")
    public ResponseEntity<List<PostResponseDTO>> getAllPostsForAdmin() {
        return ResponseEntity.ok(postService.getAllPostsForAdmin());
    }

    // --------------------------------------------------
    // GET /api/posts/trending?limit=5
    // Lấy top N bài viết nổi bật (không cần đăng nhập)
    // Điểm = views × 1 + commentCount × 10
    // --------------------------------------------------
    @GetMapping("/trending")
    public ResponseEntity<List<PostResponseDTO>> getTrendingPosts(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(postService.getTrendingPosts(limit));
    }

    // --------------------------------------------------
    // GET /api/posts/slug/{slug}
    // Xem chi tiết bài viết theo slug (chỉ trả data, không tăng view)
    // --------------------------------------------------
    @GetMapping("/slug/{slug}")
    public ResponseEntity<PostResponseDTO> getPostBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(postService.getPostBySlug(slug));
    }

    // --------------------------------------------------
    // POST /api/posts/{id}/view
    // Tăng lượt xem bài viết — Frontend gọi 1 lần duy nhất (không cần auth)
    // Frontend tự quản lý bằng localStorage để tránh gọi lại
    // --------------------------------------------------
    @PostMapping("/{id}/view")
    public ResponseEntity<Void> incrementView(@PathVariable Long id) {
        postService.incrementView(id);
        return ResponseEntity.ok().build();
    }

    // --------------------------------------------------
    // GET /api/posts/{id}
    // Xem chi tiết bài viết theo ID (dùng cho trang sửa bài)
    // --------------------------------------------------
    @GetMapping("/{id}")
    public ResponseEntity<PostResponseDTO> getPostById(@PathVariable Long id) {
        PostResponseDTO post = postService.getPostById(id);
        return ResponseEntity.ok(post);
    }

    // --------------------------------------------------
    // PUT /api/posts/{id}
    // Cập nhật bài viết theo ID
    // Body: JSON theo cấu trúc PostRequestDTO
    // --------------------------------------------------
    @PutMapping("/{id}")
    public ResponseEntity<PostResponseDTO> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostRequestDTO postRequestDTO) {

        PostResponseDTO updated = postService.updatePost(id, postRequestDTO);
        return ResponseEntity.ok(updated);
    }

    // --------------------------------------------------
    // DELETE /api/posts/{id}
    // Xóa bài viết theo ID
    // --------------------------------------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        // Trả về HTTP 204 No Content (xóa thành công, không có body trả về)
        return ResponseEntity.noContent().build();
    }

    // --------------------------------------------------
    // GET /api/posts/search?q=react&page=0&size=6
    // Tìm kiếm bài viết theo từ khóa
    // --------------------------------------------------
    @GetMapping("/search")
    public ResponseEntity<Page<PostResponseDTO>> searchPosts(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {

        Page<PostResponseDTO> results = postService.searchPosts(q, page, size);
        return ResponseEntity.ok(results);
    }

    // --------------------------------------------------
    // GET /api/posts/{id}/history
    // Lấy danh sách lịch sử chỉnh sửa của bài viết
    // --------------------------------------------------
    @GetMapping("/{id}/history")
    public ResponseEntity<List<PostHistoryResponseDTO>> getPostHistory(@PathVariable Long id) {
        List<PostHistoryResponseDTO> history = postService.getPostHistory(id);
        return ResponseEntity.ok(history);
    }

    // --------------------------------------------------
    // POST /api/posts/{id}/rollback/{historyId}
    // Khôi phục bài viết về phiên bản lịch sử cụ thể
    // --------------------------------------------------
    @PostMapping("/{id}/rollback/{historyId}")
    public ResponseEntity<PostResponseDTO> rollbackPost(
            @PathVariable Long id,
            @PathVariable Long historyId) {
        PostResponseDTO result = postService.rollbackPost(id, historyId);
        return ResponseEntity.ok(result);
    }
}
