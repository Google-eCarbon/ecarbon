package com.ecarbon.gdsc.auth.handler;

import com.ecarbon.gdsc.auth.dto.OAuth2LoginResponse;
import com.ecarbon.gdsc.auth.entity.User;
import com.ecarbon.gdsc.auth.jwt.JwtTokenProvider;
import com.ecarbon.gdsc.auth.principal.CustomOAuth2User;
import com.ecarbon.gdsc.auth.repository.FirebaseUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.util.UriUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final JwtTokenProvider jwtProvider;
    private final FirebaseUserRepository userRepository;
    private static final String JWT_SESSION_KEY = "jwt_token";
    
    @Value("${app.frontend.url:http://localhost:3030}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        // 1️⃣ 인증된(로그인한) 사용자 정보 가져오기
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        String username = oAuth2User.getName();
        String email = oAuth2User.getEmail();

        // 2️⃣ 사용자 정보를 Firebase에 저장
        try {
            User user = User.builder()
                    .email(email)
                    .name(username)
                    .build();
            userRepository.save(user);
            log.info("사용자 정보를 Firebase에 저장했습니다: {}", email);
        } catch (Exception e) {
            log.error("Firebase에 사용자 정보 저장 중 오류 발생: {}", e.getMessage());
        }

        // 3️⃣ JWT 생성 (이메일 정보 포함)
        String token = jwtProvider.createToken(username, email, oAuth2User.getAuthorities());

        // 4️⃣ JWT를 세션에 저장
        HttpSession session = request.getSession(true); // 세션이 없으면 새로 생성
        session.setAttribute(JWT_SESSION_KEY, token);
        log.info("JWT 토큰을 세션에 저장했습니다. 세션 ID: {}", session.getId());

        // 4️⃣ 디버깅을 위한 로그 출력
        log.info("인증 토큰 생성 완료");
        log.info("사용자 정보: {}", UriUtils.encode(username, StandardCharsets.UTF_8));
        log.info("이메일 정보: {}", email);
        log.info("권한 정보: {}", oAuth2User.getAuthorities());

        // 5️⃣ 백엔드 인증 콜백 엔드포인트로 리디렉션
        String encodedUsername = UriUtils.encode(username, StandardCharsets.UTF_8);
        String encodedEmail = UriUtils.encode(email, StandardCharsets.UTF_8);
        
        String redirectUrl = UriComponentsBuilder.fromUriString(request.getContextPath())
                .path("/api/auth/callback")
                .queryParam("token", token)
                .queryParam("username", encodedUsername)
                .queryParam("email", encodedEmail)
                .build()
                .toUriString();
                
        log.info("백엔드 인증 콜백으로 리디렉션: {}", redirectUrl);
        response.sendRedirect(redirectUrl);

        // 7️⃣ 인증 관련 속성 제거
        clearAuthenticationAttributes(request);
    }
}
