package com.intern.cnpm8.Entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_history")
@Data
@EntityListeners(AuditingEntityListener.class)
public class PostHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết với bài viết gốc (nhiều lịch sử -> 1 bài viết)
    // FetchType.LAZY: không tải Post kèm theo trừ khi gọi getPost()
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    // Nội dung bài viết TẠI THỜI ĐIỂM chỉnh sửa (snapshot)
    @Column(nullable = false)
    private String title;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    private String summary;
    private String thumbnail;

    // Ghi chú lý do chỉnh sửa (tuỳ chọn, người dùng có thể để trống)
    private String changeNote;

    // Ngày giờ chỉnh sửa - tự động điền nhờ @EntityListeners
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime editedAt;
}
