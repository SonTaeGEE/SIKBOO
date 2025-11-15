package com.stg.sikboo.security;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    @GetMapping("/")
    public String redirectToFront() {
        return "redirect:https://sikboo.vercel.app";
    }
}
