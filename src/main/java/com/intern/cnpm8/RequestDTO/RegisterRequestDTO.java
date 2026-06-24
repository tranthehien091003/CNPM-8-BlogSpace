package com.intern.cnpm8.RequestDTO;

import lombok.Data;

/**
 * DTO nhận dữ liệu đăng ký từ Frontend.
 * Frontend gửi lên:
 * {
 *   "username": "nguyenvan",
 *   "email": "nguyenvan@gmail.com",
 *   "password": "matkhau123",
 *   "displayName": "Nguyễn Văn A"
 * }
 */
@Data
public class RegisterRequestDTO {
    private String username;
    private String email;
    private String password;
    private String displayName;
}
