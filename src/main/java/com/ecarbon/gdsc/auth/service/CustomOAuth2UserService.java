package com.ecarbon.gdsc.auth.service;

import com.ecarbon.gdsc.auth.entity.User;
import com.ecarbon.gdsc.auth.principal.CustomOAuth2User;
import com.ecarbon.gdsc.auth.repository.FirebaseUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final FirebaseUserRepository firebaseUserRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        if (email == null) {
            throw new OAuth2AuthenticationException("User email not found in OAuth2 response");
        }

        String name = oAuth2User.getAttribute("name");
        log.info("OAuth2 로그인 정보 - 이름: {}, 이메일: {}", name, email);

        try {
            User user = firebaseUserRepository.findByEmail(email);
            if (user == null) {
                user = firebaseUserRepository.save(User.builder()
                        .email(email)
                        .name(name)
                        .build());
            }

            return new CustomOAuth2User(
                    oAuth2User.getAttributes(),
                    oAuth2User.getAuthorities(),
                    name,
                    email
            );
        } catch (ExecutionException | InterruptedException e) {
            log.error("Firebase 사용자 처리 중 오류 발생", e);
            OAuth2Error oauth2Error = new OAuth2Error("firebase_error", "Firebase user processing failed", null);
            throw new OAuth2AuthenticationException(oauth2Error, oauth2Error.toString(), e);
        }
    }
}
