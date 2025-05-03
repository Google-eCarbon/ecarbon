package com.ecarbon.gdsc.auth.handler;

import com.ecarbon.gdsc.auth.jwt.JwtTokenProvider;
import com.ecarbon.gdsc.auth.principal.CustomOAuth2User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final JwtTokenProvider jwtProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        // 1️⃣ 인증된(로그인한) 사용자 정보 가져오기
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        String username = oAuth2User.getName();
        String email = oAuth2User.getEmail();

        // 2️⃣ JWT 생성 (이메일 정보 포함)
        String token = jwtProvider.createToken(username, email, oAuth2User.getAuthorities());

        // 토큰 정보 콘솔에 출력 (디버깅 용도)
        log.info("인증 토큰 생성: " + token);
        log.info("사용자 정보: " + oAuth2User.getName());
        log.info("권한 정보: " + oAuth2User.getAuthorities());

        // JWT를 세션에 저장
        request.getSession().setAttribute("JWT_TOKEN", token);

        // 프론트엔드 리디렉션 컨트롤러로 리디렉트
        response.sendRedirect("/api/oauth2/redirect");

        clearAuthenticationAttributes(request);
    }
}
