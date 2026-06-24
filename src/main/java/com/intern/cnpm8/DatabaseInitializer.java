package com.intern.cnpm8;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * DatabaseInitializer — Tự động dọn dẹp và đồng bộ bảng comments khi chạy.
 *
 * Nếu bảng comments cũ bị lệch cột hoặc thiếu trường do quá trình phát triển trước đó,
 * Class này sẽ tự động DROP bảng đó đi để Hibernate dập lại bảng mới 100% chuẩn xác!
 */
@Component
public class DatabaseInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("=========================================================");
        System.out.println(">>> [DATABASE INITIALIZER] Bắt đầu kiểm tra cấu trúc bảng...");
        System.out.println("=========================================================");

        try {
            // Kiểm tra các cột hiện tại của bảng comments
            List<Map<String, Object>> columns = jdbcTemplate.queryForList("SHOW COLUMNS FROM comments");
            System.out.println(">>> Cấu trúc bảng comments hiện tại trong MySQL:");
            boolean hasPostId = false;
            boolean hasAuthorAvatar = false;

            for (Map<String, Object> col : columns) {
                String field = (String) col.get("Field");
                String type = (String) col.get("Type");
                System.out.println("    - Cột: " + field + " (" + type + ")");
                if ("post_id".equalsIgnoreCase(field)) hasPostId = true;
                if ("author_avatar".equalsIgnoreCase(field)) hasAuthorAvatar = true;
            }

            // Nếu thiếu trường quan trọng hoặc cấu trúc không khớp, tiến hành DROP để tạo lại
            if (!hasPostId || !hasAuthorAvatar) {
                System.out.println(">>> PHÁT HIỆN BẢNG comments BỊ THIẾU CỘT HOẶC SAI LỆCH CẤU TRÚC!");
                jdbcTemplate.execute("DROP TABLE IF EXISTS comments");
                System.out.println(">>> ĐÃ DROP BẢNG comments LỖI THÀNH CÔNG! HIBERNATE SẼ TỰ TẠO LẠI BẢNG CHUẨN!");
            } else {
                System.out.println(">>> Bảng comments có đầy đủ cột cần thiết.");
            }

        } catch (Exception e) {
            // Nếu bảng comments chưa tồn tại
            System.out.println(">>> Bảng comments chưa tồn tại hoặc gặp lỗi: " + e.getMessage());
            System.out.println(">>> Hibernate sẽ tự động tạo bảng mới khi khởi chạy.");
        }
        System.out.println("=========================================================");
    }
}
