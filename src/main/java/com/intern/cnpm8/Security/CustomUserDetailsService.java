package com.intern.cnpm8.Security;

import com.intern.cnpm8.Entity.User;
import com.intern.cnpm8.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * CustomUserDetailsService — "Cầu nối giữa Spring Security và Database"
 *
 * Spring Security cần biết: "User này có tồn tại không? Mật khẩu là gì? Quyền là gì?"
 * Nhưng Spring Security không tự biết cách đọc database của chúng ta.
 * Class này chính là "phiên dịch viên" — nhận username từ Security,
 * tìm trong DB, rồi trả về đối tượng UserDetails mà Security hiểu được.
 *
 * Được dùng ở 2 chỗ:
 * 1. Khi login: AuthenticationManager gọi loadUserByUsername() để xác thực
 * 2. Khi mỗi request đến: JwtAuthFilter gọi để lấy thông tin user từ token
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Tìm user trong database
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Không tìm thấy tài khoản: " + username));

        // Chuyển đổi sang UserDetails mà Spring Security dùng được
        // ROLE_ là tiền tố bắt buộc của Spring Security
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(), // password đã được mã hoá BCrypt
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
