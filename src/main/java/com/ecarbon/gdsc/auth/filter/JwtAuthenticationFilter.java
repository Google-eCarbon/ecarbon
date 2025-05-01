package com.ecarbon.gdsc.auth.filter;

import com.ecarbon.gdsc.auth.jwt.JwtTokenProvider;
import com.ecarbon.gdsc.auth.principal.CustomOAuth2User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collection;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        // 1️⃣ 요청에서 JWT 추출
        String token = resolveToken(request);

        // 2️⃣ JWT가 유효한 경우, 사용자 정보 설정
        if (token != null && jwtTokenProvider.validateToken(token)) {

            String username = jwtTokenProvider.getUsername(token); // JWT에서 사용자 이름(username) 추출
            if (username == null || username.isEmpty()) {
                throw new RuntimeException("User not found"); // 로그 추가해서 디버깅
            }

            Collection authorities = jwtTokenProvider.getAuthorities(token); // JWT에서 권한 정보 추출
            Map<String, Object> attributes = jwtTokenProvider.getAttributes(token); // JWT에서 속성 정보 추출

            // 3️⃣ CustomOAuth2User 객체 생성 (DB 조회 없이 JWT 정보만 사용)
            OAuth2User userDetails = new CustomOAuth2User(attributes, authorities, username);

            // 4️⃣ 인증 객체 생성 및 SecurityContext 설정
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userDetails, token, authorities);  // 사용자 인증 객체 생성
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));                                          // 인증 객체에 인증 세부 정보 추가
            SecurityContextHolder.getContext().setAuthentication(authentication);                                                           // 인증 객체 저장
        }
        log.info("✅ JwtAuthenticationFilter");

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {

        String bearerToken = request.getHeader("Authorization");

        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            log.info("Extracted JWT token: {}", token);
            return token;
        }
        return null;
    }
}
