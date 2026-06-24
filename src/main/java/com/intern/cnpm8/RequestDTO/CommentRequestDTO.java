package com.intern.cnpm8.RequestDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * CommentRequestDTO — Dữ liệu Frontend gửi lên khi tạo bình luận mới.
 *
 * Frontend chỉ cần gửi nội dung bình luận.
 * postId lấy từ URL path, authorId lấy từ JWT token.
 */
@Data
public class CommentRequestDTO {

    @NotBlank(message = "Nội dung bình luận không được để trống!")
    @Size(max = 2000, message = "Bình luận không được vượt quá 2000 ký tự!")
    private String content;
}
