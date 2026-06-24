package com.intern.cnpm8.Repository;

import com.intern.cnpm8.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Tìm user theo username (dùng khi đăng nhập)
    Optional<User> findByUsername(String username);

    // Tìm user theo email (dùng khi kiểm tra email đã tồn tại chưa)
    Optional<User> findByEmail(String email);

    // Kiểm tra username đã tồn tại chưa (dùng khi đăng ký)
    boolean existsByUsername(String username);

    // Kiểm tra email đã tồn tại chưa (dùng khi đăng ký)
    boolean existsByEmail(String email);
}
