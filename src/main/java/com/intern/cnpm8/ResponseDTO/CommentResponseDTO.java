package com.intern.cnpm8.ResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * CommentResponseDTO — Dữ liệu Backend trả về cho Frontend sau khi tạo / lấy danh sách bình luận.
 *
 * canDelete: true nếu user hiện tại là tác giả bình luận hoặc có role ADMIN/MODERATOR.
 *            Frontend dùng để ẩn/hiện nút Xoá.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponseDTO {

    private Long id;
    private String content;
    private LocalDateTime createdAt;

    // Thông tin tác giả bình luận
    private Long authorId;
    private String authorName;
    private String authorAvatar;

    // ID bài viết mà comment này thuộc về
    private Long postId;

    // Cờ để Frontend biết có hiển thị nút Xoá không
    private boolean canDelete;
}
