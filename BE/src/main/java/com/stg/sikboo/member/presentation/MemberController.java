package com.stg.sikboo.member.presentation;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.stg.sikboo.member.dto.request.UpdateProfileRequest;
import com.stg.sikboo.member.dto.response.MemberProfileResponse;
import com.stg.sikboo.member.service.MemberService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MemberController {

	private final MemberService memberService;

	@GetMapping("/member")
	public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
		return Map.of(
				"memberId", jwt.getSubject(), 
				"roles", jwt.getClaimAsStringList("roles"));
	}

	/**
	 * 내 프로필 조회 (지병, 알레르기)
	 */
	@GetMapping("/members/me/profile")
	public MemberProfileResponse getMyProfile(@AuthenticationPrincipal Jwt jwt) {
		Long memberId = extractMemberId(jwt);
		return memberService.getProfile(memberId);
	}

	/**
	 * 내 프로필 수정 (지병, 알레르기)
	 */
	@PutMapping("/members/me/profile")
	public MemberProfileResponse updateMyProfile(
		@AuthenticationPrincipal Jwt jwt,
		@RequestBody UpdateProfileRequest request
	) {
		Long memberId = extractMemberId(jwt);
		return memberService.updateProfile(memberId, request);
	}
	
	/**
	 * 회원 탈퇴
	 */
	@DeleteMapping("/members/me")
	public void deleteMe(@AuthenticationPrincipal Jwt jwt) {
	    Long memberId = extractMemberId(jwt);
	    memberService.deleteMember(memberId);
	}


	private Long extractMemberId(Jwt jwt) {
		Object claim = jwt.getClaim("memberId");
		if (claim instanceof Integer)
			return ((Integer) claim).longValue();
		if (claim instanceof Long)
			return (Long) claim;
		if (claim instanceof String) {
			try {
				return Long.parseLong((String) claim);
			} catch (NumberFormatException e) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "memberId 파싱 실패");
			}
		}
		throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "memberId 클레임이 없습니다.");
	}
}