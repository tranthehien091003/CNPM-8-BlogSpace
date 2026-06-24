package com.intern.cnpm8.Repository;

import com.intern.cnpm8.Entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // Lấy tất cả bình luận của 1 bài viết, sắp xếp mới nhất lên đầu
    List<Comment> findByPostIdOrderByCreatedAtDesc(Long postId);

    // Xoá toàn bộ bình luận của 1 bài viết (gọi trước khi xoá post)
    @Transactional
    void deleteByPostId(Long postId);

    // Đếm số bình luận của 1 bài viết (dùng cho hiển thị số lượng)
    long countByPostId(Long postId);

    /**
     * Đếm số người bình luận duy nhất trên 1 bài viết.
     * Dùng COUNT(DISTINCT authorId) thay vì COUNT(*) để chống spam:
     * - 1 người spam 100 comment → vẫn chỉ tính 1 điểm trong trending
     * - 10 người tranh luận sôi nổi → tính 10 điểm (phản ánh đúng thực tế)
     */
    @Query("SELECT COUNT(DISTINCT c.authorId) FROM Comment c WHERE c.postId = :postId")
    long countDistinctAuthorsByPostId(@Param("postId") Long postId);

    /**
     * Cập nhật tên tác giả trên toàn bộ bình luận cũ khi user đổi displayName.
     * Dùng JPQL UPDATE trực tiếp — hiệu quả hơn load từng comment rồi save lại.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Comment c SET c.authorName = :name WHERE c.authorId = :userId")
    void updateAuthorNameByUserId(@Param("userId") Long userId, @Param("name") String name);
}
