package com.intern.cnpm8.ResponseDTO;

import com.intern.cnpm8.Constant.PostStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PostResponseDTO {

    private Long id;
    private String title;
    private String slug;
    private String content;
    private String summary;
    private String thumbnail;
    private PostStatus status;       // Trạng thái: DRAFT hoặc PUBLISHED
    private LocalDateTime created;   // Ngày tạo
    private LocalDateTime updatedAt; // Ngày cập nhật lần cuối
    private Long views;              // Số lượt xem bài viết
    private Long commentCount;       // Tổng số bình luận (dùng để hiển thị)
    private Long uniqueCommenters;   // Số người bình luận duy nhất (dùng tính điểm trending — chống spam)

    // Thông tin tác giả — trả về để Frontend hiển thị tên người đăng
    private Long authorId;
    private String authorName;     // Tên hiển thị (displayName)
    private String authorUsername; // Tên đăng nhập (@username) — dùng cho Admin quản lý
}
