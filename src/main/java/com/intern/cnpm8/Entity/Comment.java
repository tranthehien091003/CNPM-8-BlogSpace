package com.intern.cnpm8.Entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Comment — Bảng lưu bình luận của người dùng dưới mỗi bài viết.
 *
 * Quan hệ:
 * - Nhiều Comment → 1 Post (ManyToOne qua postId)
 * - Nhiều Comment → 1 User (ManyToOne qua authorId, nullable)
 *
 * Tương tự cách lưu authorId/authorName trong Post,
 * ta lưu sẵn thông tin tác giả để tránh JOIN mỗi lần query.
 */
@Entity
@Table(name = "comments")
@Data
@EntityListeners(AuditingEntityListener.class)
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nội dung bình luận
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // Khoá ngoại trỏ đến bài viết (không nullable — bình luận phải thuộc 1 bài viết)
    @Column(name = "post_id", nullable = false)
    private Long postId;

    // Khoá ngoại trỏ đến user (nullable để dự phòng, nhưng thực tế bắt buộc đăng nhập)
    @Column(name = "author_id")
    private Long authorId;

    // Lưu sẵn tên và avatar để không cần JOIN bảng users mỗi lần load comments
    @Column(name = "author_name")
    private String authorName;

    @Column(name = "author_avatar")
    private String authorAvatar;

    // Thời điểm bình luận — tự động điền nhờ @EntityListeners
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
