package com.intern.cnpm8.Security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JwtUtil — "Xưởng sản xuất và kiểm định JWT Token"
 *
 * Class này chịu trách nhiệm:
 * 1. generateToken()  → Tạo JWT token mới sau khi đăng nhập thành công
 * 2. extractUsername() → Lấy username từ token đã có
 * 3. validateToken()  → Kiểm tra token có hợp lệ và còn hạn không
 */
@Component
public class JwtUtil {

    // Secret key đọc từ application.properties
    // Đây là "chìa khoá" để ký và giải mã token
    @Value("${jwt.secret}")
    private String secretKey;

    // Thời hạn token: 7 ngày (tính bằng milliseconds)
    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    /**
     * Lấy đối tượng Key từ chuỗi secretKey.
     * Thuật toán HMAC-SHA256 (HS256) được dùng để ký.
     */
    private Key getSigningKey() {
        byte[] keyBytes = secretKey.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Tạo JWT Token cho người dùng.
     *
     * Token sẽ chứa (trong phần Payload):
     * - sub  : username (Subject)
     * - role : vai trò của user
     * - iat  : thời điểm tạo (Issued At)
     * - exp  : thời điểm hết hạn (Expiration)
     */
    public String generateToken(UserDetails userDetails, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role); // Nhúng role vào payload để Frontend dùng luôn

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(userDetails.getUsername()) // username là "chủ thể" của token
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256) // Ký bằng secret key
                .compact();
    }

    /**
     * Lấy username từ token (đọc trường "sub" trong Payload).
     * Dùng trong JwtAuthFilter để biết request này thuộc về user nào.
     */
    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * Kiểm tra token có hợp lệ không:
     * 1. Username trong token trùng với userDetails không?
     * 2. Token còn hạn sử dụng không?
     */
    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    /**
     * Kiểm tra token đã hết hạn chưa.
     */
    private boolean isTokenExpired(String token) {
        Date expiration = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
        return expiration.before(new Date());
    }
}
