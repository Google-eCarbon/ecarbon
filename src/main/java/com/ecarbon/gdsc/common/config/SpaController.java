package com.ecarbon.gdsc.common.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping(value = {
        "/", 
        "/about", 
        "/ranking", 
        "/user", 
        "/measure", 
        "/auth/callback",
        "/auth/callback/**",
        "/carbon-analysis"
    })
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
