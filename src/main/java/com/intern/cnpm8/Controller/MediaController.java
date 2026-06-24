package com.intern.cnpm8.Controller;

import com.intern.cnpm8.Service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MediaController {

    private final FileStorageService fileStorageService;

    // --------------------------------------------------
    // POST /api/media/upload
    // Nhận file ảnh từ Frontend (dạng multipart/form-data)
    // Trả về URL truy cập công khai của ảnh vừa upload
    // --------------------------------------------------
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file) {

        String imageUrl = fileStorageService.storeFile(file);

        // Trả về JSON đơn giản: { "url": "http://localhost:8084/uploads/abc.jpg" }
        return ResponseEntity.ok(Map.of("url", imageUrl));
    }
}
