package com.intern.cnpm8.ResponseDTO;

import com.intern.cnpm8.Constant.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO trả về cho Frontend sau khi đăng nhập / đăng ký thành công.
 *
 * Frontend nhận về:
 * {
 *   "token": "eyJhbGci...",     ← JWT token, lưu vào localStorage
 *   "id": 1,
 *   "username": "nguyenvan",
 *   "displayName": "Nguyễn Văn A",
 *   "email": "nguyenvan@gmail.com",
 *   "role": "MEMBER"
 * }
 */
@Data
@AllArgsConstructor
public class AuthResponseDTO {
    private String token;       // JWT token để gửi kèm mỗi request tiếp theo
    private Long id;
    private String username;
    private String displayName;
    private String email;
    private UserRole role;
    private String avatarUrl;
}
