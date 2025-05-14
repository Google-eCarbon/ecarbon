package com.ecarbon.gdsc.auth.controller;

import com.ecarbon.gdsc.auth.dto.UserPageResponse;
import com.ecarbon.gdsc.auth.dto.UserProfileResponse;
import com.ecarbon.gdsc.auth.entity.User;
import com.ecarbon.gdsc.auth.principal.CustomOAuth2User;
import com.ecarbon.gdsc.auth.repository.FirebaseUserRepository;
import com.ecarbon.gdsc.auth.service.UserPageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.ExecutionException;

@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final FirebaseUserRepository firebaseUserRepository;
    private final UserPageService userPageService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            @AuthenticationPrincipal CustomOAuth2User customOAuth2User) {

        // 인증되지 않은 사용자인 경우 302 Found 상태 코드와 함께 홈 페이지로 리디렉션
        if (customOAuth2User == null) {
            log.warn("인증되지 않은 사용자가 프로필 정보를 요청했습니다.");
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", "/")
                    .build();
        }

        String username = customOAuth2User.getName();
        String email = customOAuth2User.getEmail();
        log.info("사용자 프로필 조회: {}, 이메일: {}", username, email);

        try {
            // 이메일로 사용자 정보 조회
            User user = firebaseUserRepository.findByEmail(email);

            if (user == null) {
                // 사용자가 없으면 새로 생성
                user = new User();
                user.setEmail(email);
                user.setName(username);
                user = firebaseUserRepository.save(user);
            }

            // 사용자 프로필 응답 생성
            UserProfileResponse response = UserProfileResponse.builder()
                    .id(user.getId())
                    .username(user.getName())
                    .email(user.getEmail())
                    .build();

            return ResponseEntity.ok(response);
        } catch (ExecutionException | InterruptedException e) {
            log.error("Firebase 데이터 조회 중 오류 발생: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/page")
    public ResponseEntity<UserPageResponse> getUserPage(
            @AuthenticationPrincipal CustomOAuth2User customOAuth2User) {

        if (customOAuth2User == null) {
            log.warn("인증되지 않은 사용자가 프로필 정보를 요청했습니다.");
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", "/")
                    .build();
        }

        String email = customOAuth2User.getEmail();
        log.info("사용자 페이지 데이터 요청: {}", email);

        try {
            UserPageResponse response = userPageService.getUserPage(email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("사용자 페이지 데이터 조회 중 오류 발생: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}