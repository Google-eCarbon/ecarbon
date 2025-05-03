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
        
        HttpSession session = request.getSession(false);
        String token = session != null ? (String) session.getAttribute(JWT_SESSION_KEY) : null;
        
        if (customOAuth2User == null || token == null) {
            return ResponseEntity.ok(OAuth2LoginResponse.builder()
                    .isAuthenticated(false)
                    .message("Not authenticated")
                    .build());
        }
        
        String username = customOAuth2User.getName();
        String email = customOAuth2User.getEmail();
        
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
    public ResponseEntity<OAuth2LoginResponse> logout(HttpServletRequest request) {
        request.getSession().invalidate();
        
        return ResponseEntity.ok(OAuth2LoginResponse.builder()
                .isAuthenticated(false)
                .message("Logged out successfully")
                .build());
    }
}
