package com.intern.cnpm8.RequestDTO;


import com.intern.cnpm8.Constant.PostStatus;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PostRequestDTO {

    @NotBlank
    private String title;
    private String summary;
    private String thumbnail;
    private String content;
    private String slug;
    private PostStatus status;
    private Long categoryId;

    // Ghi chú lý do chỉnh sửa (chỉ dùng khi update, không bắt buộc)
    private String changeNote;
}
