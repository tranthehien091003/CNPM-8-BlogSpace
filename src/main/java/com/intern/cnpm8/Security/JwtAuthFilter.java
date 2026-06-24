package com.intern.cnpm8.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JwtAuthFilter — "Bảo vệ đứng ở cổng, kiểm tra CMND mỗi người vào"
 *
 * Đây là một HTTP Filter — chạy TRƯỚC KHI request đến bất kỳ Controller nào.
 * Mỗi request đến server sẽ phải đi qua "cổng kiểm tra" này.
 *
 * Logic xử lý:
 * 1. Đọc header "Authorization: Bearer <token>" từ request
 * 2. Lấy phần token (sau chữ "Bearer ")
 * 3. Giải mã token → lấy username
 * 4. Tải thông tin user từ DB
 * 5. Xác thực token hợp lệ
 * 6. Nếu hợp lệ: gán user vào SecurityContext (để @PreAuthorize dùng được)
 * 7. Tiếp tục cho request đi vào Controller
 *
 * Nếu không có token hoặc token lỗi → request vẫn đi tiếp nhưng không có auth
 * → SecurityConfig sẽ chặn lại nếu endpoint đó yêu cầu đăng nhập
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Bước 1: Đọc header Authorization
        final String authHeader = request.getHeader("Authorization");

        // Nếu không có header hoặc không bắt đầu bằng "Bearer " → bỏ qua, cho đi tiếp
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Bước 2: Tách lấy token (bỏ 7 ký tự "Bearer ")
        final String token = authHeader.substring(7);
        String username = null;

        try {
            // Bước 3: Giải mã token để lấy username
            username = jwtUtil.extractUsername(token);
        } catch (Exception e) {
            // Token bị lỗi cú pháp hoặc bị chỉnh sửa → bỏ qua
            filterChain.doFilter(request, response);
            return;
        }

        // Bước 4 & 5: Nếu có username và chưa có auth trong context
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            // Kiểm tra token hợp lệ (username khớp + chưa hết hạn)
            if (jwtUtil.validateToken(token, userDetails)) {
                // Bước 6: Tạo Authentication object và đặt vào SecurityContext
                // Sau bước này, Spring Security biết "request này của user nào với quyền gì"
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities() // ROLE_MEMBER, ROLE_ADMIN, ...
                        );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // Bước 7: Tiếp tục xử lý request
        filterChain.doFilter(request, response);
    }
}
