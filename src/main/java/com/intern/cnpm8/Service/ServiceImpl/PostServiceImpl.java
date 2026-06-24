package com.intern.cnpm8.Service.ServiceImpl;

import com.intern.cnpm8.Constant.PostStatus;
import com.intern.cnpm8.Entity.Post;
import com.intern.cnpm8.Entity.PostHistory;
import com.intern.cnpm8.Entity.User;
import com.intern.cnpm8.Mapper.PostMapper;
import com.intern.cnpm8.Repository.PostHistoryRepository;
import com.intern.cnpm8.Repository.PostRepository;
import com.intern.cnpm8.Repository.UserRepository;
import com.intern.cnpm8.RequestDTO.PostRequestDTO;
import com.intern.cnpm8.ResponseDTO.PostHistoryResponseDTO;
import com.intern.cnpm8.ResponseDTO.PostResponseDTO;
import com.intern.cnpm8.Service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final PostHistoryRepository postHistoryRepository;
    private final PostMapper postMapper;
    private final UserRepository userRepository;
    private final com.intern.cnpm8.Repository.CommentRepository commentRepository;

    /**
     * Helper: Lấy User entity của người đang đăng nhập từ JWT token.
     * SecurityContextHolder chứa thông tin authentication đã được JwtAuthFilter đặt vào.
     * Trả về null nếu chưa đăng nhập (guest).
     */
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }

    // =====================================================
    // TẠO BÀI VIẾT MỚI
    // =====================================================
    @Override
    public PostResponseDTO createPost(PostRequestDTO postDTO) {
        Post entityPost = postMapper.toEntity(postDTO);

        // Gắn authorId từ user đang đăng nhập (để kiểm tra quyền sở hữu sau này)
        User currentUser = getCurrentUser();
        if (currentUser != null) {
            entityPost.setAuthorId(currentUser.getId());
            // Nếu authorName chưa được gửi lên, dùng displayName của user
            if (entityPost.getAuthorName() == null || entityPost.getAuthorName().isBlank()) {
                entityPost.setAuthorName(currentUser.getDisplayName() != null
                        ? currentUser.getDisplayName() : currentUser.getUsername());
            }
        }

        Post savedPost = postRepository.save(entityPost);
        return postMapper.toResponseDTO(savedPost);
    }

    // =====================================================
    // LẤY DANH SÁCH BÀI VIẾT ĐÃ XUẤT BẢN (CÓ PHÂN TRANG)
    // =====================================================
    @Override
    public Page<PostResponseDTO> getPublishedPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage = postRepository.findByStatusOrderByCreatedDateDesc(PostStatus.PUBLISHED, pageable);
        return postPage.map(postMapper::toResponseDTO);
    }

    // =====================================================
    // XEM CHI TIẾT THEO SLUG
    // =====================================================
    @Override
    public PostResponseDTO getPostBySlug(String slug) {
        Post post = postRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy bài viết với slug: " + slug));
        return postMapper.toResponseDTO(post);
    }

    // =====================================================
    // TĂNG LƯỢT XEM (chỉ ghi thêm 1 vào DB, không trả data)
    // Frontend kiểm tra localStorage trước khi gọi endpoint này
    // nên mỗi bài viết chỉ được tăng đúng 1 lần trên mỗi thiết bị.
    // =====================================================
    @Override
    @Transactional
    public void incrementView(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy bài viết"));
        post.setViews((post.getViews() == null ? 0L : post.getViews()) + 1);
        postRepository.save(post);
    }

    // =====================================================
    // XEM CHI TIẾT THEO ID
    // =====================================================
    @Override
    public PostResponseDTO getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy bài viết với id: " + id));
        return postMapper.toResponseDTO(post);
    }

    // =====================================================
    // CẬP NHẬT BÀI VIẾT (tự động lưu snapshot, kiểm tra quyền sở hữu)
    // =====================================================
    @Override
    public PostResponseDTO updatePost(Long id, PostRequestDTO postDTO) {
        Post existingPost = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy bài viết với id: " + id));

        // --- KIỂM TRA QUYỀN SỞ HỮU ---
        // Chỉ tác giả của bài viết hoặc ADMIN/MODERATOR mới được sửa
        checkOwnership(existingPost);

        // --- CHỤP LẠI PHIÊN BẢN HIỆN TẠI TRƯỚC KHI THAY ĐỔI ---
        PostHistory snapshot = new PostHistory();
        snapshot.setPost(existingPost);
        snapshot.setTitle(existingPost.getTitle());
        snapshot.setContent(existingPost.getContent());
        snapshot.setSummary(existingPost.getSummary());
        snapshot.setThumbnail(existingPost.getThumbnail());
        snapshot.setChangeNote(postDTO.getChangeNote());
        postHistoryRepository.save(snapshot);
        // ----------------------------------------------------------

        // Cập nhật nội dung mới vào bài viết gốc
        existingPost.setTitle(postDTO.getTitle());
        existingPost.setSummary(postDTO.getSummary());
        existingPost.setThumbnail(postDTO.getThumbnail());
        existingPost.setContent(postDTO.getContent());
        existingPost.setStatus(postDTO.getStatus());

        if (postDTO.getSlug() != null && !postDTO.getSlug().isBlank()) {
            existingPost.setSlug(postDTO.getSlug());
        }

        Post updatedPost = postRepository.save(existingPost);
        return postMapper.toResponseDTO(updatedPost);
    }

    // =====================================================
    // XÓA BÀI VIẾT (kiểm tra quyền sở hữu)
    // =====================================================
    @Override
    @org.springframework.transaction.annotation.Transactional
    public void deletePost(Long id) {
        log.info("=== deletePost called for id: {} ===", id);
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy bài viết với id: " + id));

        log.info("Post found: {}, authorId: {}", post.getTitle(), post.getAuthorId());
        // --- KIỂM TRA QUYỀN SỞ HỮU ---
        checkOwnership(post);
        log.info("checkOwnership PASSED — proceeding to delete");

        // Xóa toàn bộ bình luận trước để tránh lỗi foreign key
        commentRepository.deleteByPostId(id);
        log.info("Deleted comments for post {}", id);

        // Xóa toàn bộ lịch sử chỉnh sửa trước để tránh lỗi foreign key constraint
        postHistoryRepository.deleteByPostId(id);
        log.info("Deleted history records for post {}", id);

        postRepository.deleteById(id);
        log.info("Post {} deleted successfully", id);
    }

    // =====================================================
    // TÌM KIẾM BÀI VIẾT THEO TỪ KHÓA
    // =====================================================
    @Override
    public Page<PostResponseDTO> searchPosts(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> results = postRepository.searchByKeyword(keyword, pageable);
        return results.map(postMapper::toResponseDTO);
    }

    // =====================================================
    // LẤY LỊCH SỬ CHỈNH SỬA CỦA BÀI VIẾT
    // =====================================================
    @Override
    public List<PostHistoryResponseDTO> getPostHistory(Long postId) {
        // Kiểm tra bài viết có tồn tại không
        if (!postRepository.existsById(postId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Không tìm thấy bài viết với id: " + postId);
        }

        List<PostHistory> historyList = postHistoryRepository.findByPostIdOrderByEditedAtDesc(postId);

        // Chuyển từng PostHistory entity -> DTO để trả về Frontend
        return historyList.stream().map(h -> {
            PostHistoryResponseDTO dto = new PostHistoryResponseDTO();
            dto.setId(h.getId());
            dto.setPostId(h.getPost().getId());
            dto.setTitle(h.getTitle());
            dto.setContent(h.getContent());
            dto.setSummary(h.getSummary());
            dto.setThumbnail(h.getThumbnail());
            dto.setChangeNote(h.getChangeNote());
            dto.setEditedAt(h.getEditedAt());
            return dto;
        }).collect(Collectors.toList());
    }

    // =====================================================
    // KHÔI PHỤC BÀI VIẾT VỀ PHIÊN BẢN CŨ (ROLLBACK)
    // =====================================================
    @Override
    public PostResponseDTO rollbackPost(Long postId, Long historyId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy bài viết với id: " + postId));

        checkOwnership(post); // Chỉ chủ sở hữu hoặc admin mới được rollback

        PostHistory history = postHistoryRepository.findById(historyId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy lịch sử với id: " + historyId));

        // Lưu snapshot của phiên bản hiện tại trước khi rollback
        PostHistory currentSnapshot = new PostHistory();
        currentSnapshot.setPost(post);
        currentSnapshot.setTitle(post.getTitle());
        currentSnapshot.setContent(post.getContent());
        currentSnapshot.setSummary(post.getSummary());
        currentSnapshot.setThumbnail(post.getThumbnail());
        currentSnapshot.setChangeNote("[Trước khi rollback về phiên bản #" + historyId + "]");
        postHistoryRepository.save(currentSnapshot);

        // Ghi đè nội dung từ phiên bản cũ
        post.setTitle(history.getTitle());
        post.setContent(history.getContent());
        post.setSummary(history.getSummary());
        post.setThumbnail(history.getThumbnail());

        Post rolledBack = postRepository.save(post);
        return postMapper.toResponseDTO(rolledBack);
    }

    // =====================================================
    // LẤY DANH SÁCH BÀI VIẾT CỦA USER ĐANG ĐĂNG NHẬP
    // =====================================================
    @Override
    public List<PostResponseDTO> getMyPosts() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn chưa đăng nhập!");
        }
        return postRepository.findByAuthorIdOrderByCreatedDateDesc(currentUser.getId())
                .stream()
                .map(postMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    // =====================================================
    // LẤY TẤT CẢ BÀI VIẾT TRÊN HỆ THỐNG (ADMIN/MODERATOR)
    // =====================================================
    @Override
    public List<PostResponseDTO> getAllPostsForAdmin() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn chưa đăng nhập!");
        }
        boolean isAdminOrMod = currentUser.getRole().name().equals("ADMIN")
                || currentUser.getRole().name().equals("MODERATOR");
        if (!isAdminOrMod) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Admin/Moderator mới có quyền xem tất cả bài viết!");
        }
        // Lấy tất cả, sắp xếp mới nhất trước
        return postRepository.findAll().stream()
                .sorted((a, b) -> {
                    if (a.getCreatedDate() == null) return 1;
                    if (b.getCreatedDate() == null) return -1;
                    return b.getCreatedDate().compareTo(a.getCreatedDate());
                })
                .map(postMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    // =====================================================
    // LẤY TOP TRENDING POSTS
    // Công thức điểm: views × 1  +  commentCount × 10
    // Comment được ưu tiên hơn view vì thể hiện tương tác thật.
    // =====================================================
    @Override
    public List<PostResponseDTO> getTrendingPosts(int limit) {
        return postRepository.findAll().stream()
                // Chỉ tính bài đã xuất bản (PUBLISHED)
                .filter(post -> PostStatus.PUBLISHED.equals(post.getStatus()))
                // Chuyển sang DTO (để có commentCount từ mapper)
                .map(postMapper::toResponseDTO)
                // Tính điểm trending rồi sắp xếp giảm dần
                // Công thức: views × 1  +  uniqueCommenters × 10
                // → 1 người spam 100 comment chỉ tính 1 điểm (không phải 1000)
                // → 10 người tranh luận thật sự tính 10 điểm ✅
                .sorted((a, b) -> {
                    long scoreA = (a.getViews() != null ? a.getViews() : 0L)
                                + (a.getUniqueCommenters() != null ? a.getUniqueCommenters() * 10 : 0L);
                    long scoreB = (b.getViews() != null ? b.getViews() : 0L)
                                + (b.getUniqueCommenters() != null ? b.getUniqueCommenters() * 10 : 0L);
                    return Long.compare(scoreB, scoreA);
                })
                .limit(limit)
                .collect(Collectors.toList());
    }

    // =====================================================
    // HELPER: Kiểm tra quyền sở hữu bài viết
    // Ném 403 nếu user hiện tại không phải tác giả và không phải ADMIN/MODERATOR
    // =====================================================
    private void checkOwnership(Post post) {
        User currentUser = getCurrentUser();
        log.info("checkOwnership: currentUser = {}", currentUser != null ? currentUser.getUsername() + " role=" + currentUser.getRole() : "NULL");
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn chưa đăng nhập!");
        }

        boolean isOwner = post.getAuthorId() != null && post.getAuthorId().equals(currentUser.getId());
        boolean isAdminOrMod = currentUser.getRole().name().equals("ADMIN")
                || currentUser.getRole().name().equals("MODERATOR");
        log.info("checkOwnership: isOwner={}, isAdminOrMod={}", isOwner, isAdminOrMod);

        if (!isOwner && !isAdminOrMod) {
            log.warn("checkOwnership: ACCESS DENIED for user {} on post authorId={}",
                    currentUser.getUsername(), post.getAuthorId());
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn không có quyền thực hiện thao tác này! Chỉ tác giả hoặc Admin mới được sửa/xóa bài viết.");
        }
        log.info("checkOwnership: ACCESS GRANTED");
    }
}
