package com.ecarbon.gdsc.auth.controller;

import com.ecarbon.gdsc.auth.dto.LoginResponse;
import com.ecarbon.gdsc.auth.entity.User;
import com.ecarbon.gdsc.auth.principal.CustomOAuth2User;
import com.ecarbon.gdsc.auth.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    /**
     * Google OAuth2 로그인 페이지로 리다이렉트
     */
    @GetMapping("/login/google")
    public void redirectToGoogleLogin(HttpServletResponse response) throws IOException {
        response.sendRedirect("/oauth2/authorization/google");
    }

    /**
     * 현재 로그인 상태 확인
     */
    @GetMapping("/status")
    public ResponseEntity<LoginResponse> getLoginStatus(
            @AuthenticationPrincipal CustomOAuth2User customOAuth2User,
            HttpServletRequest request) {
        
        String token = (String) request.getSession().getAttribute("JWT_TOKEN");
        
        if (customOAuth2User == null || token == null) {
            return ResponseEntity.ok(LoginResponse.builder()
                    .isAuthenticated(false)
                    .message("Not authenticated")
                    .build());
        }
        
        String username = customOAuth2User.getAttribute("sub");
        String email = customOAuth2User.getAttribute("email");
        
        return ResponseEntity.ok(LoginResponse.builder()
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
    public ResponseEntity<LoginResponse> logout(HttpServletRequest request) {
        request.getSession().invalidate();
        
        return ResponseEntity.ok(LoginResponse.builder()
                .isAuthenticated(false)
                .message("Logged out successfully")
                .build());
    }
}
