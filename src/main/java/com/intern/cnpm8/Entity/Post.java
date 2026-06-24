package com.intern.cnpm8.Entity;

import com.intern.cnpm8.Constant.PostStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Data
@EntityListeners(AuditingEntityListener.class)
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(unique = true, nullable = false)
    private String slug;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    private String summary;
    private String thumbnail;

    @Enumerated(EnumType.STRING)
    private PostStatus status;

    // -----------------------------------------------
    // Thông tin tác giả
    // authorId: Khoá ngoại trỏ đến bảng users (nullable để tương thích bài viết cũ)
    // authorName: Tên hiển thị của tác giả (lưu luôn để tránh JOIN)
    // -----------------------------------------------
    @Column(name = "author_id")
    private Long authorId;   // ID của User đã tạo bài → dùng để kiểm tra quyền sở hữu

    private String authorName; // Tên tác giả hiển thị trên bài viết
    private String authorRole; // Vai trò tác giả lúc tạo bài

    @Column(nullable = false, columnDefinition = "BIGINT DEFAULT 0")
    private Long views = 0L; // Số lượt xem — tăng mỗi khi có người đọc bài viết này

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime updateAt;
}

