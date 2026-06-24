package com.intern.cnpm8.Security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * SecurityConfig — "Bộ luật bảo mật của toàn bộ ứng dụng"
 *
 * Class này định nghĩa 3 điều quan trọng:
 * 1. CORS: Cho phép Frontend (localhost:5173) gọi API của Backend
 * 2. Phân quyền endpoint: Ai được gọi API nào
 * 3. Session Policy: Dùng JWT (stateless) thay vì Session truyền thống
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthFilter jwtAuthFilter;

    /**
     * BCrypt PasswordEncoder — Thuật toán mã hoá mật khẩu.
     *
     * BCrypt tự động thêm "salt" (chuỗi ngẫu nhiên) vào mật khẩu trước khi hash,
     * nên cùng một mật khẩu sẽ cho ra các chuỗi hash khác nhau mỗi lần.
     * → An toàn hơn MD5 hay SHA1 rất nhiều.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * AuthenticationManager — "Trọng tài xác thực"
     * Được dùng trong AuthService để kiểm tra username/password khi login.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * DaoAuthenticationProvider — Kết nối AuthenticationManager với UserDetailsService
     * và PasswordEncoder của chúng ta.
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * CORS Configuration — Cho phép Frontend giao tiếp với Backend.
     *
     * Nếu không có cấu hình này, trình duyệt sẽ chặn mọi request từ
     * localhost:5173 đến localhost:8084 (do khác Origin).
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173")); // Frontend URL
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*")); // Cho phép mọi header (bao gồm Authorization)
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * SecurityFilterChain — Quy tắc bảo mật chính.
     *
     * Đây là trái tim của toàn bộ cấu hình Security.
     * Định nghĩa endpoint nào cần đăng nhập, endpoint nào công khai.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Tắt CSRF vì chúng ta dùng JWT (stateless), không dùng session/cookie
            .csrf(AbstractHttpConfigurer::disable)

            // Áp dụng cấu hình CORS đã định nghĩa ở trên
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Quy tắc phân quyền từng endpoint:
            .authorizeHttpRequests(auth -> auth

                // ✅ PUBLIC: Ai cũng đọc được (không cần đăng nhập)
                .requestMatchers(HttpMethod.GET, "/api/posts/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/posts").permitAll()
                .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll() // File ảnh công khai

                // ✅ PUBLIC: Đăng ký và Đăng nhập ai cũng dùng được
                .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()

                // ✅ PUBLIC: Cho phép Spring Boot xử lý và trả thông báo lỗi về Client
                // Nếu không có dòng này, mọi exception trong Controller/Service sẽ bị Spring Security
                // chặn ở endpoint /error → Client chỉ nhận 403 trống thay vì thông báo lỗi thật
                .requestMatchers("/error").permitAll()

                // ✅ PUBLIC: Tăng lượt xem bài viết (không cần đăng nhập, frontend tự giới hạn bằng localStorage)
                .requestMatchers(HttpMethod.POST, "/api/posts/*/view").permitAll()

                // 🔒 YÊU CẦU ĐĂNG NHẬP: Các thao tác ghi (tạo/sửa/xóa) cần có tài khoản
                .requestMatchers(HttpMethod.POST, "/api/posts").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/posts/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/posts/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/media/upload").authenticated()
                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers("/api/auth/profile").authenticated() // Cập nhật thông tin cá nhân
                .requestMatchers("/api/posts/mine").authenticated() // Chỉ user đăng nhập mới thấy bài của mình
                .requestMatchers("/api/posts/all").authenticated()  // Chỉ Admin/Moderator mới thấy tất cả bài

                // ✅ PUBLIC: Xem bình luận (không cần đăng nhập)
                // Dùng /*/ thay vì /**/ — postId là một segment số duy nhất (ví dụ: /api/posts/5/comments)
                .requestMatchers(HttpMethod.GET, "/api/posts/*/comments").permitAll()

                // 🔒 YÊU CẦU ĐĂNG NHẬP: Viết hoặc Xóa bình luận
                .requestMatchers(HttpMethod.POST, "/api/posts/*/comments").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/comments/*").authenticated()

                // 🔒 Tất cả request còn lại → cần đăng nhập
                .anyRequest().authenticated()
            )

            // Dùng Stateless Session (không lưu session trên server)
            // Mỗi request phải tự mang theo JWT
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Đăng ký authentication provider
            .authenticationProvider(authenticationProvider())

            // Thêm JwtAuthFilter VÀO TRƯỚC UsernamePasswordAuthenticationFilter
            // Nghĩa là: JWT filter chạy trước, xác thực token trước khi Spring Security xử lý
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
