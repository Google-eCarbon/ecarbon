package com.ecarbon.gdsc.auth.filter;

import com.ecarbon.gdsc.auth.jwt.JwtTokenProvider;
import com.ecarbon.gdsc.auth.principal.CustomOAuth2User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.UriUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private static final String JWT_SESSION_KEY = "jwt_token";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        try {
            // 1️⃣ 요청에서 JWT 추출 (헤더 또는 세션에서)
            String token = resolveToken(request);

            // 2️⃣ JWT가 유효한 경우, 사용자 정보 설정
            if (token != null && jwtTokenProvider.validateToken(token)) {
                String username = jwtTokenProvider.getUsername(token); // JWT에서 사용자 이름(username) 추출
                if (username == null || username.isEmpty()) {
                    log.error("토큰에서 사용자 정보를 찾을 수 없습니다");
                    filterChain.doFilter(request, response);
                    return;
                }

                Collection authorities = jwtTokenProvider.getAuthorities(token); // JWT에서 권한 정보 추출
                Map<String, Object> attributes = jwtTokenProvider.getAttributes(token); // JWT에서 속성 정보 추출
                
                // 이메일 정보 추출 (attributes에서 email 키로 저장된 값 또는 기본값으로 username 사용)
                String email = (String) attributes.getOrDefault("email", username);

                // 3️⃣ CustomOAuth2User 객체 생성 (DB 조회 없이 JWT 정보만 사용)
                OAuth2User userDetails = new CustomOAuth2User(attributes, authorities, username, email);

                // 4️⃣ 인증 객체 생성 및 SecurityContext 설정
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, token, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                try {
                    String encodedUsername = UriUtils.encode(username, StandardCharsets.UTF_8);
                    log.debug("인증 정보 설정 완료: {}, 이메일: {}", encodedUsername, email);
                } catch (Exception e) {
                    log.debug("인증 정보 설정 완료 (로깅 불가)");
                }
            }
        } catch (Exception e) {
            log.error("인증 처리 중 오류 발생: {}", e.getMessage());
        }
        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String token = null;
        
        // 1. Authorization 헤더에서 토큰 확인
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            token = bearerToken.substring(7);
            log.debug("헤더에서 JWT 토큰 추출: {}", token);
            return token;
        }
        
        // 2. 세션에서 토큰 확인
        HttpSession session = request.getSession(false); // 세션이 없으면 null 반환
        if (session != null) {
            token = (String) session.getAttribute(JWT_SESSION_KEY);
            if (StringUtils.hasText(token)) {
                log.debug("세션에서 JWT 토큰 추출: {}", token);
                return token;
            }
        }
        
        return null;
    }
}
