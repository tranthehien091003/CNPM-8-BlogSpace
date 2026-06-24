package com.intern.cnpm8.Mapper;


import com.intern.cnpm8.Entity.Post;
import com.intern.cnpm8.Entity.User;
import com.intern.cnpm8.Repository.CommentRepository;
import com.intern.cnpm8.Repository.UserRepository;
import com.intern.cnpm8.RequestDTO.PostRequestDTO;
import com.intern.cnpm8.ResponseDTO.PostResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class PostMapper {

    // Dùng để tra tên tác giả cho bài viết cũ (chưa có authorName trong DB)
    private final UserRepository userRepository;
    // Đếm số bình luận mỗi bài viết (dùng để hiển thị + tính trending score)
    private final CommentRepository commentRepository;

    // 1. Chuyển từ RequestDTO sang Entity (Dùng cho Create/Update)
    public Post toEntity(PostRequestDTO dto) {
        if (dto == null) return null;

        Post post = new Post();
        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        post.setSummary(dto.getSummary());
        post.setThumbnail(dto.getThumbnail());
        post.setStatus(dto.getStatus());

        // Xử lý logic Slug: Nếu trống thì tự sinh từ Title
        if (dto.getSlug() == null || dto.getSlug().isBlank()) {
            post.setSlug(generateSlug(dto.getTitle()));
        } else {
            post.setSlug(dto.getSlug());
        }

        return post;
    }

    // 2. Chuyển từ Entity sang ResponseDTO (Dùng để trả kết quả về Client)
    public PostResponseDTO toResponseDTO(Post entity) {
        if (entity == null) return null;

        PostResponseDTO dto = new PostResponseDTO();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setSlug(entity.getSlug());
        dto.setContent(entity.getContent());
        dto.setSummary(entity.getSummary());
        dto.setThumbnail(entity.getThumbnail());
        dto.setStatus(entity.getStatus());
        dto.setCreated(entity.getCreatedDate());
        dto.setUpdatedAt(entity.getUpdateAt());
        dto.setViews(entity.getViews() != null ? entity.getViews() : 0L);
        // Đếm số bình luận từ bảng comments (dùng cho trending score và hiển thị)
        dto.setCommentCount(commentRepository.countByPostId(entity.getId()));
        // Đếm số người bình luận DUY NHẤT — chống spam trending (1 người spam nhiều vẫn = 1 điểm)
        dto.setUniqueCommenters(commentRepository.countDistinctAuthorsByPostId(entity.getId()));

        // Map thông tin tác giả → Frontend dùng để hiển thị tên người đăng
        dto.setAuthorId(entity.getAuthorId());

        // Nếu authorName đã có trong bài viết → dùng luôn
        // Nếu NULL (bài viết cũ trước khi có JWT) → tra bảng users theo authorId
        if (entity.getAuthorName() != null && !entity.getAuthorName().isBlank()) {
            dto.setAuthorName(entity.getAuthorName());
        } else if (entity.getAuthorId() != null) {
            userRepository.findById(entity.getAuthorId()).ifPresent(user -> {
                String name = user.getDisplayName() != null ? user.getDisplayName() : user.getUsername();
                dto.setAuthorName(name);
            });
        }

        // Luôn tra username (@login name) theo authorId — dùng cho Admin quản lý
        if (entity.getAuthorId() != null) {
            userRepository.findById(entity.getAuthorId()).ifPresent(user ->
                dto.setAuthorUsername(user.getUsername())
            );
        }

        return dto;
    }

    // Hàm bổ trợ tạo Slug chuẩn SEO
    private String generateSlug(String title) {
        if (title == null) return "";

        // Chuyển sang chữ thường
        String nfdNormalizedString = Normalizer.normalize(title.toLowerCase(), Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String slug = pattern.matcher(nfdNormalizedString).replaceAll("");

        // Thay chữ đ/Đ
        slug = slug.replaceAll("đ", "d");

        // Xóa ký tự đặc biệt và thay khoảng trắng bằng dấu gạch ngang
        slug = slug.replaceAll("[^a-z0-9\\s]", "");
        slug = slug.replaceAll("\\s+", "-");

        return slug.trim();
    }
}
