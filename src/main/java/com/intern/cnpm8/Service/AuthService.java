package com.intern.cnpm8.Service;

import com.intern.cnpm8.RequestDTO.LoginRequestDTO;
import com.intern.cnpm8.RequestDTO.RegisterRequestDTO;
import com.intern.cnpm8.ResponseDTO.AuthResponseDTO;

public interface AuthService {

    // Đăng ký tài khoản mới → trả về token ngay sau khi đăng ký thành công
    AuthResponseDTO register(RegisterRequestDTO request);

    // Đăng nhập → xác thực username/password → trả về JWT token
    AuthResponseDTO login(LoginRequestDTO request);
}
