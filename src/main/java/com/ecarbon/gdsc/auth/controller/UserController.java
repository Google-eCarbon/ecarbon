package com.ecarbon.gdsc.auth.controller;

import com.ecarbon.gdsc.auth.dto.UserProfileResponse;
import com.ecarbon.gdsc.auth.entity.User;
import com.ecarbon.gdsc.auth.principal.CustomOAuth2User;
import com.ecarbon.gdsc.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            @AuthenticationPrincipal CustomOAuth2User customOAuth2User) {

        // 인증되지 않은 사용자인 경우 401 Unauthorized 반환
        if (customOAuth2User == null) {
            log.warn("인증되지 않은 사용자가 프로필 정보를 요청했습니다.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = customOAuth2User.getName();
        String email = customOAuth2User.getEmail();
        log.info("사용자 프로필 조회: {}, 이메일: {}", username, email);

        // 이메일로 사용자 정보 조회 (이메일이 고유 식별자로 더 적합함)
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isEmpty()) {
            log.warn("사용자 정보를 찾을 수 없습니다. 이메일: {}", email);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        
        User user = userOptional.get();
        
        // 사용자 프로필 응답 생성 - MongoDB ObjectId를 문자열로 유지
        UserProfileResponse response = UserProfileResponse.builder()
                .id(user.getId()) // Long.parseLong 제거하고 문자열 그대로 사용
                .username(user.getName())
                .email(user.getEmail())
                .build();
        
        return ResponseEntity.ok(response);
    }
}
