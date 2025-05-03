package com.ecarbon.gdsc.auth.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtTokenProvider {
    private String secretKey = "";
    private final long tokenValidityInMilliseconds = 1000 * 60 * 5; // 5분

    private Key key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    // 1️⃣ JWT 생성 (이메일 정보 포함)
    public String createToken(String username, Collection<? extends GrantedAuthority> authorities) {
        return createToken(username, null, authorities);
    }
    
    // 1️⃣-2 JWT 생성 (이메일 정보 포함)
    public String createToken(String username, String email, Collection<? extends GrantedAuthority> authorities) {
        try {
            // 1. JWT 클레임 생성
            Claims claims = Jwts.claims().setSubject(username);
            
            // 이메일 정보가 있으면 추가
            if (email != null && !email.isEmpty()) {
                claims.put("email", email);
            }
            
            claims.put("roles", authorities.stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList()));

            // 2. 현재 시간과 만료 시간 설정
            Date now = new Date();
            Date validity = new Date(now.getTime() + tokenValidityInMilliseconds);

            // 3. JWT 토큰 생성 및 서명
            return Jwts.builder()
                    .setClaims(claims)
                    .setIssuedAt(now)
                    .setExpiration(validity)
                    .signWith(key, SignatureAlgorithm.HS256)
                    .compact();
        } catch (Exception e) {
            log.error("JWT 토큰 생성 중 오류 발생: {}", e.getMessage());
            throw new RuntimeException("JWT 토큰 생성 실패", e);
        }
    }

    // 2️⃣ JWT에서 사용자 이름(username) 추출
    public String getUsername(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key) // 서명 키 일치
                .build()
                .parseClaimsJws(token)
                .getBody();

        String username = claims.getSubject();
        try {
            log.info("Parsed username from JWT: {}", UriUtils.encode(username, StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.info("Parsed username from JWT (로깅 불가)");
        }
        return username; // 'sub' 클레임에서 사용자 이름 추출
    }
    
    // 2️⃣-2 JWT에서 이메일 추출
    public String getEmail(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        String email = (String) claims.get("email");
        log.info("Parsed email from JWT: {}", email);
        return email;
    }

    // 3️⃣ JWT에서 사용자 권한 추출
    public Collection<GrantedAuthority> getAuthorities(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key) // 서명 키 일치
                .build()
                .parseClaimsJws(token)
                .getBody();
        List<String> roles = (List<String>) claims.get("roles");
        return roles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    // 4️⃣ JWT에서 속성 정보 추출
    public Map<String, Object> getAttributes(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key) // 서명 키 일치
                .build()
                .parseClaimsJws(token)
                .getBody(); // 모든 클레임을 Map<String, Object> 형태로 추출
    }

    // 5️⃣ JWT 검증
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token); // 서명 키 일치
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.error("JWT 토큰 검증 실패: {}", e.getMessage());
            return false;
        }
    }
}