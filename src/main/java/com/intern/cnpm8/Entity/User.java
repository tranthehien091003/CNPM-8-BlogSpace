package com.intern.cnpm8.Entity;

import com.intern.cnpm8.Constant.UserRole;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entity đại diện cho một tài khoản người dùng trong hệ thống.
 *
 * Các trường chính:
 * - username: Tên đăng nhập duy nhất
 * - email   : Email duy nhất
 * - password: Mật khẩu đã được mã hoá bằng BCrypt (không bao giờ lưu plaintext)
 * - role    : Vai trò của người dùng (MEMBER / MODERATOR / ADMIN)
 */
@Entity
@Table(name = "users")
@Data
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    /**
     * Mật khẩu được mã hoá bởi BCryptPasswordEncoder.
     * Kết quả trông như: "$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG"
     * Không bao giờ có thể giải mã ngược lại → rất an toàn.
     */
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.MEMBER; // Mặc định mọi tài khoản mới đều là MEMBER

    private String displayName; // Tên hiển thị (có thể khác username)
    private String avatarUrl;   // Link ảnh đại diện

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
