package com.ecarbon.gdsc.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Controller
@RequiredArgsConstructor
@RequestMapping("/api/oauth2/redirect")
public class RedirectController {

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * 로그인 성공 후 프론트엔드로 리디렉션
     * 토큰 정보를 URL 파라미터로 전달
     */
    @GetMapping
    public void redirectToFrontend(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // 세션에서 JWT 토큰 가져오기
        String token = (String) request.getSession().getAttribute("JWT_TOKEN");
        
        // 프론트엔드 URL로 리디렉션 (carbon-analysis 페이지)
        String redirectUrl = frontendUrl + "/carbon-analysis";
        
        if (token != null && !token.isEmpty()) {
            // 토큰 정보를 URL 인코딩하여 전달
            String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
            redirectUrl += "?token=" + encodedToken;
            
            // 추가 정보 로깅 (서버 콘솔에 출력)
            log.info("인증 토큰 정보 (리디렉션): " + token);
        }
        
        response.sendRedirect(redirectUrl);
    }
}
