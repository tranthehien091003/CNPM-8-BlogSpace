package com.intern.cnpm8.RequestDTO;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * UpdateProfileRequestDTO — Dữ liệu Frontend gửi lên khi cập nhật thông tin cá nhân.
 *
 * Cho phép người dùng chỉnh sửa:
 * - displayName: tên hiển thị công khai (nullable — nếu null thì giữ nguyên)
 * - avatarUrl  : link ảnh đại diện sau khi upload (nullable — nếu null thì giữ nguyên)
 */
@Data
public class UpdateProfileRequestDTO {

    @Size(max = 100, message = "Tên hiển thị không được vượt quá 100 ký tự!")
    private String displayName;

    private String avatarUrl; // URL ảnh sau khi upload thành công qua /api/media/upload
}
