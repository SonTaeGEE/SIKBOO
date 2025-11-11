package com.stg.sikboo.security;

import com.stg.sikboo.member.domain.Member;
import com.stg.sikboo.member.domain.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

  private final MemberRepository memberRepository;

  @Override
  public OAuth2User loadUser(OAuth2UserRequest req) throws OAuth2AuthenticationException {
    var delegate   = new DefaultOAuth2UserService();
    var oauth2User = delegate.loadUser(req);

    String provider = req.getClientRegistration().getRegistrationId(); // google/kakao/naver
    String providerNorm = provider.toUpperCase(); // 일관성 유지
    Map<String, Object> attributes = oauth2User.getAttributes();

    Profile p = Profile.from(provider, attributes);

    // 안전한 조회: 중복 가능성을 방어하고 동시성 시도에서도 오류가 나지 않도록 구현
    Optional<Member> existing = memberRepository.findFirstByProviderAndProviderId(providerNorm, p.providerId);
    Member m;
    if (existing.isPresent()) {
      m = existing.get();
    } else {
      Member created = new Member();
      created.setRole("USER");
      created.setProvider(providerNorm);
      created.setProviderId(p.providerId);
      created.setName(p.name != null ? p.name : p.provider + "_" + p.providerId);

      try {
        m = memberRepository.save(created); // 동시 생성 시 DB 제약에 의해 실패 가능
      } catch (DataIntegrityViolationException ex) {
        // 동시성으로 인한 중복 생성 실패 시 기존 레코드 재조회
        m = memberRepository.findFirstByProviderAndProviderId(providerNorm, p.providerId)
            .orElseThrow(() -> new OAuth2AuthenticationException(new OAuth2Error("member_error"),
                "Failed to create or retrieve member"));
      }
    }

    // 선택적 업데이트: 이름/이미지 변경 시 저장
    boolean changed = false;
    if (p.name != null && !p.name.equals(m.getName())) {
      m.setName(p.name);
      changed = true;
    }
    // if (p.image != null && !p.image.equals(m.getProfileImage())) { m.setProfileImage(p.image); changed = true; }

    if (changed) memberRepository.save(m);

    return new DefaultOAuth2User(
        List.of(new SimpleGrantedAuthority("ROLE_" + (m.getRole() != null ? m.getRole() : "USER"))),
        attributes,
        req.getClientRegistration().getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName()
    );
  }

  // ----- helpers ----- (unchanged)
  static class Profile {
    String provider, providerId, name, image;
    @SuppressWarnings("unchecked")
    static Profile from(String provider, Map<String, Object> a) {
      Profile p = new Profile();
      p.provider = provider;
      switch (provider) {
        case "google" -> {
          p.providerId = str(a.get("sub"));
          p.name       = str(a.get("name"));
          p.image      = str(a.get("picture"));
        }
        case "kakao" -> {
          p.providerId = str(a.get("id"));
          Map<String, Object> account = map(a.get("kakao_account"));
          Map<String, Object> prof    = account != null ? map(account.get("profile")) : null;
          p.name  = prof != null ? str(prof.get("nickname")) : null;
          p.image = prof != null ? str(prof.get("profile_image_url")) : null;
        }
        case "naver" -> {
          Map<String, Object> r = map(a.get("response"));
          p.providerId = str(r.get("id"));
          p.name       = str(r.get("name"));
          p.image      = str(r.get("profile_image"));
        }
        default -> throw new OAuth2AuthenticationException(
            new OAuth2Error("unsupported_provider"), "Unsupported provider: " + provider);
      }
      if (p.name == null) p.name = p.provider + "_" + p.providerId;
      return p;
    }
    static String str(Object o) { return o == null ? null : String.valueOf(o); }
    @SuppressWarnings("unchecked")
    static Map<String, Object> map(Object o) { return (o instanceof Map<?, ?> m) ? (Map<String, Object>) m : null; }
  }
}
