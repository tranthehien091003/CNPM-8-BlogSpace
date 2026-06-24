package com.intern.cnpm8.Controller;

import com.intern.cnpm8.Entity.User;
import com.intern.cnpm8.Repository.CommentRepository;
import com.intern.cnpm8.Repository.UserRepository;
import com.intern.cnpm8.RequestDTO.LoginRequestDTO;
import com.intern.cnpm8.RequestDTO.RegisterRequestDTO;
import com.intern.cnpm8.RequestDTO.UpdateProfileRequestDTO;
import com.intern.cnpm8.ResponseDTO.AuthResponseDTO;
import com.intern.cnpm8.Service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/**
 * AuthController — "Quầy đăng ký và đăng nhập"
 *
 * Các endpoint:
 * POST /api/auth/register → Đăng ký tài khoản mới
 * POST /api/auth/login    → Đăng nhập, nhận JWT token
 * GET  /api/auth/me       → Lấy thông tin user đang đăng nhập (cần có token)
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;

    /**
     * POST /api/auth/register
     * Body: { username, email, password, displayName }
     * Response: { token, id, username, displayName, email, role }
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO request) {
        try {
            AuthResponseDTO response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (ResponseStatusException e) {
            // Trả về JSON rõ ràng với field "message" để Frontend đọc được
            java.util.Map<String, String> error = new java.util.HashMap<>();
            error.put("message", e.getReason() != null ? e.getReason() : "Lỗi không xác định");
            return ResponseEntity.status(e.getStatusCode()).body(error);
        }
    }

    /**
     * POST /api/auth/login
     * Body: { username, password }
     * Response: { token, id, username, displayName, email, role }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        try {
            AuthResponseDTO response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            java.util.Map<String, String> error = new java.util.HashMap<>();
            error.put("message", e.getReason() != null ? e.getReason() : "Tên đăng nhập hoặc mật khẩu không đúng!");
            return ResponseEntity.status(e.getStatusCode()).body(error);
        }
    }

    /**
     * PUT /api/auth/profile
     * Body: { displayName, avatarUrl }
     *
     * Cập nhật thông tin cá nhân của người dùng đang đăng nhập.
     * Chỉ cập nhật các trường không null.
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequestDTO request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy user"));

        // Chỉ cập nhật nếu giá trị mới không null và không rỗng
        if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
            user.setDisplayName(request.getDisplayName().trim());
        }
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        userRepository.save(user);

        // Đồng bộ tên mới sang toàn bộ bình luận cũ của user
        if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
            commentRepository.updateAuthorNameByUserId(user.getId(), user.getDisplayName());
        }

        return ResponseEntity.ok(new AuthResponseDTO(
                null, // Không tạo token mới, dùng token cũ
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                user.getRole(),
                user.getAvatarUrl()
        ));
    }

    /**
     * GET /api/auth/me
     * Header: Authorization: Bearer <token>
     *
     * Trả về thông tin của người dùng đang đăng nhập.
     * Frontend dùng endpoint này để khôi phục trạng thái đăng nhập
     * khi tải lại trang (reload) — lấy token từ localStorage rồi gọi /me.
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponseDTO> getCurrentUser() {
        // Lấy thông tin Authentication từ SecurityContext (đã được JwtAuthFilter gán vào)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy user"));

        // Trả về thông tin user (không tạo token mới, token cũ vẫn còn hạn)
        return ResponseEntity.ok(new AuthResponseDTO(
                null, // Không trả token mới ở đây
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                user.getRole(),
                user.getAvatarUrl()
        ));
    }
}
