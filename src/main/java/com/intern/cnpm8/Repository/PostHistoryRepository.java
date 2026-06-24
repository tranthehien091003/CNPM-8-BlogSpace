package com.intern.cnpm8.Repository;

import com.intern.cnpm8.Entity.PostHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostHistoryRepository extends JpaRepository<PostHistory, Long> {

    // Lấy toàn bộ lịch sử của một bài viết, sắp xếp từ mới nhất → cũ nhất
    List<PostHistory> findByPostIdOrderByEditedAtDesc(Long postId);

    // Xóa toàn bộ lịch sử của một bài viết (dùng trước khi xóa bài viết để khỏi bị lỗi foreign key)
    // @Transactional bắt buộc phải có cho derived delete query của Spring Data JPA
    @org.springframework.transaction.annotation.Transactional
    void deleteByPostId(Long postId);
}
