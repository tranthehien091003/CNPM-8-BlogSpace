package com.intern.cnpm8.Service.ServiceImpl;

import com.intern.cnpm8.Entity.User;
import com.intern.cnpm8.Repository.UserRepository;
import com.intern.cnpm8.RequestDTO.LoginRequestDTO;
import com.intern.cnpm8.RequestDTO.RegisterRequestDTO;
import com.intern.cnpm8.ResponseDTO.AuthResponseDTO;
import com.intern.cnpm8.Security.CustomUserDetailsService;
import com.intern.cnpm8.Security.JwtUtil;
import com.intern.cnpm8.Service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;

    /**
     * Đăng ký tài khoản mới.
     *
     * Quy trình:
     * 1. Kiểm tra username/email đã tồn tại chưa → nếu rồi thì báo lỗi
     * 2. Mã hoá mật khẩu bằng BCrypt
     * 3. Lưu user mới vào database
     * 4. Tạo JWT token và trả về ngay (không cần đăng nhập lại)
     */
    @Override
    public AuthResponseDTO register(RegisterRequestDTO request) {
        // Bước 1: Kiểm tra trùng lặp
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Tên đăng nhập '" + request.getUsername() + "' đã được sử dụng!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Email '" + request.getEmail() + "' đã được đăng ký!");
        }

        // Bước 2 & 3: Tạo và lưu user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        // Mã hoá password: "matkhau123" → "$2a$10$dXJ3..."
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setDisplayName(request.getDisplayName() != null
                ? request.getDisplayName()
                : request.getUsername()); // Nếu không có displayName thì dùng username

        User savedUser = userRepository.save(user);

        // Bước 4: Tạo token và trả về
        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getUsername());
        String token = jwtUtil.generateToken(userDetails, savedUser.getRole().name());

        return buildAuthResponse(token, savedUser);
    }

    /**
     * Đăng nhập.
     *
     * Quy trình:
     * 1. Dùng AuthenticationManager để xác thực username + password
     *    → AuthenticationManager tự gọi UserDetailsService để tải user từ DB
     *    → Rồi dùng PasswordEncoder để so sánh password
     *    → Nếu sai → ném BadCredentialsException
     * 2. Nếu đúng → tạo JWT token và trả về
     */
    @Override
    public AuthResponseDTO login(LoginRequestDTO request) {
        try {
            // Bước 1: Xác thực — Spring Security kiểm tra tất cả cho chúng ta
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Tên đăng nhập hoặc mật khẩu không đúng!");
        }

        // Bước 2: Lấy thông tin user để tạo token
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy user"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtUtil.generateToken(userDetails, user.getRole().name());

        return buildAuthResponse(token, user);
    }

    /**
     * Helper: Tạo AuthResponseDTO từ token và User entity.
     */
    private AuthResponseDTO buildAuthResponse(String token, User user) {
        return new AuthResponseDTO(
                token,
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                user.getRole(),
                user.getAvatarUrl()
        );
    }
}
