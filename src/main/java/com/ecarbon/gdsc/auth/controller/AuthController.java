package com.ecarbon.gdsc.auth.controller;

import com.ecarbon.gdsc.auth.dto.OAuth2LoginResponse;
import com.ecarbon.gdsc.auth.principal.CustomOAuth2User;
import com.ecarbon.gdsc.auth.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.util.UriUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    
    @Value("${app.frontend.url:http://localhost:3030}")
    private String frontendUrl;
    
    private static final String JWT_SESSION_KEY = "jwt_token";

    /**
     * Google OAuth2 로그인 페이지로 리다이렉트
     */
    @GetMapping("/login/google")
    public void redirectToGoogleLogin(HttpServletResponse response) throws IOException {
        log.info("Google 로그인 페이지로 리다이렉트");
        response.sendRedirect("/oauth2/authorization/google");
    }

    /**
     * OAuth2 인증 콜백 처리
     * 백엔드에서 세션에 정보를 저장하고 프론트엔드 콜백 페이지로 리디렉션
     */
    @GetMapping("/callback")
    public void handleAuthCallback(
            @RequestParam("token") String token,
            @RequestParam("username") String username,
            @RequestParam("email") String email,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        
        try {
            log.info("인증 콜백 처리: 사용자={}, 이메일={}", username, email);
            
            // 세션에 인증 정보 저장
            HttpSession session = request.getSession(true);
            session.setAttribute(JWT_SESSION_KEY, token);
            session.setAttribute("username", username);
            session.setAttribute("email", email);
            
            log.info("세션에 인증 정보 저장 완료. 세션 ID: {}", session.getId());
            
            // 인코딩된 사용자 정보
            String encodedUsername = UriUtils.encode(username, StandardCharsets.UTF_8);
            String encodedEmail = UriUtils.encode(email, StandardCharsets.UTF_8);
            
            // 프론트엔드 콜백 페이지로 리디렉션 (토큰과 최소한의 정보만 전달)
            String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                    .path("/auth/callback")
                    .queryParam("success", "true")
                    .build()
                    .toUriString();
            
            log.info("프론트엔드 콜백 페이지로 리디렉션: {}", redirectUrl);
            response.sendRedirect(redirectUrl);
            
        } catch (Exception e) {
            log.error("인증 콜백 처리 중 오류 발생: {}", e.getMessage());
            
            // 오류 발생 시 프론트엔드 콜백 페이지로 오류 정보와 함께 리디렉션
            String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                    .path("/auth/callback")
                    .queryParam("success", "false")
                    .queryParam("error", UriUtils.encode("인증 처리 중 오류가 발생했습니다", StandardCharsets.UTF_8))
                    .build()
                    .toUriString();
            
            response.sendRedirect(redirectUrl);
        }
    }

    /**
     * 현재 로그인 상태 확인
     */
    @GetMapping("/status")
    public ResponseEntity<OAuth2LoginResponse> getLoginStatus(
            @AuthenticationPrincipal CustomOAuth2User customOAuth2User,
            HttpServletRequest request) {
        
        log.info("로그인 상태 확인 요청 받음");
        
        // 세션 정보 로깅
        HttpSession session = request.getSession(false);
        if (session != null) {
            log.info("세션 ID: {}", session.getId());
            log.info("세션 생성 시간: {}", session.getCreationTime());
            log.info("세션 마지막 접근 시간: {}", session.getLastAccessedTime());
            
            // 세션 속성 로깅
            Enumeration<String> attributeNames = session.getAttributeNames();
            while (attributeNames.hasMoreElements()) {
                String name = attributeNames.nextElement();
                log.info("세션 속성: {} = {}", name, session.getAttribute(name));
            }
        } else {
            log.warn("세션이 존재하지 않음");
        }
        
        // 인증 정보 확인
        String token = session != null ? (String) session.getAttribute(JWT_SESSION_KEY) : null;
        log.info("세션에서 가져온 토큰: {}", token != null ? "존재함" : "없음");
        log.info("CustomOAuth2User: {}", customOAuth2User != null ? "존재함" : "없음");
        
        if (customOAuth2User == null || token == null) {
            log.warn("인증되지 않은 사용자");
            return ResponseEntity.ok(OAuth2LoginResponse.builder()
                    .isAuthenticated(false)
                    .message("Not authenticated")
                    .build());
        }
        
        String username = customOAuth2User.getName();
        String email = customOAuth2User.getEmail();
        log.info("인증된 사용자: {}, 이메일: {}", username, email);
        
        return ResponseEntity.ok(OAuth2LoginResponse.builder()
                .isAuthenticated(true)
                .token(token)
                .username(username)
                .email(email)
                .message("Authenticated")
                .build());
    }

    /**
     * 로그아웃
     */
    @PostMapping("/logout")
    public ResponseEntity<OAuth2LoginResponse> logout(HttpServletRequest request, HttpServletResponse response) {
        try {
            HttpSession session = request.getSession(false);
            if (session != null) {
                log.info("로그아웃: 세션 ID {} 무효화", session.getId());
                session.invalidate();
            } else {
                log.warn("로그아웃: 세션이 이미 존재하지 않음");
            }
            
            return ResponseEntity.ok(OAuth2LoginResponse.builder()
                    .isAuthenticated(false)
                    .message("Logged out successfully")
                    .build());
        } catch (Exception e) {
            log.error("로그아웃 처리 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(OAuth2LoginResponse.builder()
                            .isAuthenticated(false)
                            .message("로그아웃 처리 중 오류가 발생했습니다")
                            .build());
        }
    }
}
