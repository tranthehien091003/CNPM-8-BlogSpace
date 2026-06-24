package com.intern.cnpm8.Service;

import com.intern.cnpm8.RequestDTO.PostRequestDTO;
import com.intern.cnpm8.ResponseDTO.PostHistoryResponseDTO;
import com.intern.cnpm8.ResponseDTO.PostResponseDTO;
import org.springframework.data.domain.Page;

import java.util.List;

public interface PostService {

    // Tạo bài viết mới
    PostResponseDTO createPost(PostRequestDTO post);

    // Lấy danh sách bài viết đã PUBLISHED, có phân trang
    Page<PostResponseDTO> getPublishedPosts(int page, int size);

    // Lấy chi tiết bài viết theo slug
    PostResponseDTO getPostBySlug(String slug);

    // Tăng lượt xem bài viết (Frontend chỉ gọi 1 lần qua localStorage)
    void incrementView(Long postId);

    // Lấy chi tiết bài viết theo ID
    PostResponseDTO getPostById(Long id);

    // Cập nhật bài viết theo ID (tự động lưu lịch sử trước khi ghi đè)
    PostResponseDTO updatePost(Long id, PostRequestDTO post);

    // Xóa bài viết theo ID
    void deletePost(Long id);

    // Tìm kiếm bài viết theo từ khóa, có phân trang
    Page<PostResponseDTO> searchPosts(String keyword, int page, int size);

    // Lấy danh sách lịch sử chỉnh sửa của một bài viết
    List<PostHistoryResponseDTO> getPostHistory(Long postId);

    // Khôi phục bài viết về một phiên bản lịch sử cụ thể
    PostResponseDTO rollbackPost(Long postId, Long historyId);

    // Lấy tất cả bài viết của người dùng đang đăng nhập (dùng JWT để xác định)
    List<PostResponseDTO> getMyPosts();

    // Lấy TẤT CẢ bài viết trên hệ thống — dành cho ADMIN/MODERATOR
    List<PostResponseDTO> getAllPostsForAdmin();

    // Lấy top N bài viết trending — sắp xếp theo điểm: views + commentCount × 10
    List<PostResponseDTO> getTrendingPosts(int limit);
}

