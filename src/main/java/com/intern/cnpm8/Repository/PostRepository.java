package com.intern.cnpm8.Repository;

import com.intern.cnpm8.Constant.PostStatus;
import com.intern.cnpm8.Entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    // Tìm bài viết theo slug (dùng cho trang chi tiết - SEO friendly URL)
    Optional<Post> findBySlug(String slug);

    // Lấy danh sách bài viết theo trạng thái, kèm phân trang
    Page<Post> findByStatusOrderByCreatedDateDesc(PostStatus status, Pageable pageable);

    // Tìm kiếm bài viết theo từ khóa trong title hoặc summary
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(p.summary) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Post> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // -----------------------------------------------
    // Lấy tất cả bài viết của một user cụ thể theo authorId
    // Dùng để hiển thị "Bài viết của tôi" trong Dashboard
    // -----------------------------------------------
    List<Post> findByAuthorIdOrderByCreatedDateDesc(Long authorId);
}

