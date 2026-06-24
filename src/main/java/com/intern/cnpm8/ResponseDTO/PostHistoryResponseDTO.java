package com.intern.cnpm8.ResponseDTO;

import lombok.Data;

import java.time.LocalDateTime;

// DTO trả về cho Frontend khi lấy danh sách lịch sử chỉnh sửa bài viết
@Data
public class PostHistoryResponseDTO {

    private Long id;
    private Long postId;
    private String title;
    private String summary;
    private String thumbnail;
    private String content;
    private String changeNote;      // Ghi chú lý do chỉnh sửa
    private LocalDateTime editedAt; // Thời điểm chỉnh sửa
}
