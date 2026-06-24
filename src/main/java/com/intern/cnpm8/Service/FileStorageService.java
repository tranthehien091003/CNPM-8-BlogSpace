package com.intern.cnpm8.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    // Đọc từ application.properties: đường dẫn thư mục lưu ảnh
    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    // Đọc từ application.properties: địa chỉ gốc của server để tạo URL
    @Value("${server.base-url:http://localhost:8084}")
    private String serverBaseUrl;

    /**
     * Lưu file ảnh vào thư mục uploads/ và trả về URL truy cập công khai.
     * Ví dụ: http://localhost:8084/uploads/abc123-uuid.jpg
     */
    public String storeFile(MultipartFile file) {
        // Lấy tên file gốc, đảm bảo không chứa ký tự nguy hiểm (path traversal attack)
        String originalName = StringUtils.cleanPath(file.getOriginalFilename());

        // Kiểm tra định dạng file hợp lệ
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Chỉ chấp nhận file ảnh (jpg, png, gif, webp)");
        }

        // Lấy phần mở rộng (.jpg, .png, ...)
        String extension = "";
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalName.substring(dotIndex);
        }

        // Tạo tên file mới bằng UUID để tránh trùng lặp
        String newFileName = UUID.randomUUID().toString() + extension;

        try {
            // Tạo thư mục uploads/ nếu chưa tồn tại
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            // Sao chép file vào thư mục đích
            Path targetLocation = uploadPath.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Trả về URL đầy đủ để Frontend sử dụng
            return serverBaseUrl + "/uploads/" + newFileName;

        } catch (IOException ex) {
            throw new RuntimeException("Không thể lưu file ảnh: " + newFileName, ex);
        }
    }
}
