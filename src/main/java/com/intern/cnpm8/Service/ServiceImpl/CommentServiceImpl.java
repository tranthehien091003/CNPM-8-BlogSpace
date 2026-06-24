package com.intern.cnpm8.Service.ServiceImpl;

import com.intern.cnpm8.Entity.Comment;
import com.intern.cnpm8.Entity.Post;
import com.intern.cnpm8.Entity.User;
import com.intern.cnpm8.Repository.CommentRepository;
import com.intern.cnpm8.Repository.PostRepository;
import com.intern.cnpm8.Repository.UserRepository;
import com.intern.cnpm8.RequestDTO.CommentRequestDTO;
import com.intern.cnpm8.ResponseDTO.CommentResponseDTO;
import com.intern.cnpm8.Service.CommentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    // =====================================================
    // HELPER: Lấy User hiện tại từ JWT (giống PostServiceImpl)
    // =====================================================
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }

    // =====================================================
    // HELPER: Chuyển Comment entity → ResponseDTO
    // canDelete = true nếu currentUser là tác giả hoặc ADMIN/MOD
    // =====================================================
    private CommentResponseDTO toDTO(Comment comment, User currentUser) {
        boolean canDelete = false;
        if (currentUser != null) {
            boolean isOwner = comment.getAuthorId() != null
                    && comment.getAuthorId().equals(currentUser.getId());
            boolean isAdminOrMod = currentUser.getRole().name().equals("ADMIN")
                    || currentUser.getRole().name().equals("MODERATOR");
            canDelete = isOwner || isAdminOrMod;
        }

        return CommentResponseDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .authorId(comment.getAuthorId())
                .authorName(comment.getAuthorName())
                .authorAvatar(comment.getAuthorAvatar())
                .postId(comment.getPostId())
                .canDelete(canDelete)
                .build();
    }

    // =====================================================
    // THÊM BÌNH LUẬN
    // =====================================================
    @Override
    public CommentResponseDTO addComment(Long postId, CommentRequestDTO dto) {
        // Kiểm tra bài viết có tồn tại không
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy bài viết với id: " + postId));

        // Lấy thông tin người dùng đang đăng nhập (bắt buộc)
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Bạn phải đăng nhập để bình luận!");
        }

        Comment comment = new Comment();
        comment.setContent(dto.getContent());
        comment.setPostId(postId);
        comment.setAuthorId(currentUser.getId());
        comment.setAuthorName(currentUser.getDisplayName() != null
                ? currentUser.getDisplayName()
                : currentUser.getUsername());
        comment.setAuthorAvatar(currentUser.getAvatarUrl());

        Comment saved = commentRepository.save(comment);
        log.info("User {} added comment {} to post {}", currentUser.getUsername(), saved.getId(), postId);
        return toDTO(saved, currentUser);
    }

    // =====================================================
    // LẤY DANH SÁCH BÌNH LUẬN (PUBLIC)
    // =====================================================
    @Override
    public List<CommentResponseDTO> getCommentsByPost(Long postId) {
        // Kiểm tra bài viết có tồn tại không
        if (!postRepository.existsById(postId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Không tìm thấy bài viết với id: " + postId);
        }

        User currentUser = getCurrentUser(); // null nếu chưa đăng nhập (guest)
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId)
                .stream()
                .map(comment -> toDTO(comment, currentUser))
                .collect(Collectors.toList());
    }

    // =====================================================
    // XOÁ BÌNH LUẬN
    // =====================================================
    @Override
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy bình luận với id: " + commentId));

        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn chưa đăng nhập!");
        }

        boolean isOwner = comment.getAuthorId() != null
                && comment.getAuthorId().equals(currentUser.getId());
        boolean isAdminOrMod = currentUser.getRole().name().equals("ADMIN")
                || currentUser.getRole().name().equals("MODERATOR");

        if (!isOwner && !isAdminOrMod) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn không có quyền xoá bình luận này!");
        }

        commentRepository.deleteById(commentId);
        log.info("Comment {} deleted by user {}", commentId, currentUser.getUsername());
    }
}
