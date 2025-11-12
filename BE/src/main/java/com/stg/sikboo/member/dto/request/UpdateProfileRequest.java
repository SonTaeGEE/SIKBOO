package com.stg.sikboo.member.dto.request;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private List<String> diseases;   // 지병
    private List<String> allergies;  // 알레르기
}