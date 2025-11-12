package com.stg.sikboo.member.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MemberProfileResponse {
    private Long id;
    private String name;
    private String provider;      // "KAKAO", "GOOGLE" 등
    private List<String> diseases;
    private List<String> allergies;
}