package com.stg.sikboo.member.service;

import java.util.Arrays;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.stg.sikboo.member.domain.Member;
import com.stg.sikboo.member.domain.MemberRepository;
import com.stg.sikboo.member.dto.request.UpdateProfileRequest;
import com.stg.sikboo.member.dto.response.MemberProfileResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepo;

    /**
     * 프로필 조회
     */
    public MemberProfileResponse getProfile(Long memberId) {
        Member member = memberRepo.findById(memberId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."));

        return new MemberProfileResponse(
            member.getId(),
            member.getName(),
            member.getProvider(),
            Arrays.asList(member.getDiseases()),
            Arrays.asList(member.getAllergies())
        );
    }

    /**
     * 프로필 수정
     */
    @Transactional
    public MemberProfileResponse updateProfile(Long memberId, UpdateProfileRequest request) {
        Member member = memberRepo.findById(memberId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."));

        // 배열 변환
        String[] newDiseases = request.getDiseases() != null 
            ? request.getDiseases().toArray(new String[0]) 
            : member.getDiseases();
        
        String[] newAllergies = request.getAllergies() != null 
            ? request.getAllergies().toArray(new String[0]) 
            : member.getAllergies();

        member.updateProfile(newDiseases, newAllergies);
        memberRepo.save(member);

        return new MemberProfileResponse(
            member.getId(),
            member.getName(),
            member.getProvider(),
            Arrays.asList(member.getDiseases()),
            Arrays.asList(member.getAllergies())
        );
    }
    /**
     * 회원 탈퇴
     */
    @Transactional
    public void deleteMember(Long memberId) {
        memberRepo.deleteById(memberId);
    }

}