package com.ecarbon.gdsc.auth.controller;

import com.ecarbon.gdsc.auth.dto.UserProfileResponse;
import com.ecarbon.gdsc.auth.entity.User;
import com.ecarbon.gdsc.auth.principal.CustomOAuth2User;
import com.ecarbon.gdsc.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            @AuthenticationPrincipal CustomOAuth2User customOAuth2User){

        if(customOAuth2User == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = customOAuth2User.getName();

        User user = userRepository.findByName(username);


    }

}
