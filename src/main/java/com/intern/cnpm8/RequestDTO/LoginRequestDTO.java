package com.intern.cnpm8.RequestDTO;

import lombok.Data;

/**
 * DTO nhận dữ liệu đăng nhập từ Frontend.
 * Frontend gửi lên:
 * {
 *   "username": "nguyenvan",
 *   "password": "matkhau123"
 * }
 */
@Data
public class LoginRequestDTO {
    private String username;
    private String password;
}
