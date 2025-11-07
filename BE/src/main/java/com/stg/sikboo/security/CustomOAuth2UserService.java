package com.stg.sikboo.security;

import com.stg.sikboo.member.domain.Member;
import com.stg.sikboo.member.domain.MemberRepository;
import lombok.RequiredArgsConstructor;
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

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

  private final MemberRepository memberRepository;

  @Override
  public OAuth2User loadUser(OAuth2UserRequest req) throws OAuth2AuthenticationException {
    var delegate = new DefaultOAuth2UserService();
    var oauth2User = delegate.loadUser(req);

    String provider = req.getClientRegistration().getRegistrationId(); // google/kakao/naver
    Map<String, Object> attributes = oauth2User.getAttributes();

    Profile p = Profile.from(provider, attributes);

    // 1) 기본: provider + providerId 로 조회
    Member m = memberRepository.findByProviderAndProviderId(p.provider, p.providerId)
        // 2) 같은 이메일로 기존 로컬/다른 소셜 계정이 있는 경우 연결 (email이 있을 때만)
        .orElseGet(() -> p.email != null ? memberRepository.findByEmail(p.email).orElse(null) : null);

    if (m == null) {
      m = new Member();
      m.setRole("USER");
      m.setProvider(p.provider.toUpperCase());
      m.setProviderId(p.providerId);
      if (p.email != null) m.setEmail(p.email);
      if (p.name  != null) m.setName(p.name);
      // 이미지 필드가 있으면: if (p.image != null) m.setProfileImage(p.image);
    } else {
      m.setProvider(p.provider.toUpperCase());
      m.setProviderId(p.providerId);
      if (p.email != null && (m.getEmail() == null || !p.email.equals(m.getEmail()))) {
        m.setEmail(p.email);
      }
      if (p.name != null) m.setName(p.name);
    }

    memberRepository.save(m);

    return new DefaultOAuth2User(
        List.of(new SimpleGrantedAuthority("ROLE_" + (m.getRole() != null ? m.getRole() : "USER"))),
        attributes,
        req.getClientRegistration().getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName()
    );
  }

  // ----- helpers -----
  static class Profile {
    String provider, providerId, email, name, image;

    @SuppressWarnings("unchecked")
    static Profile from(String provider, Map<String, Object> a) {
      Profile p = new Profile();
      p.provider = provider;

      switch (provider) {
        case "google" -> {
          p.providerId = str(a.get("sub"));
          p.email      = str(a.get("email"));
          p.name       = str(a.get("name"));
          p.image      = str(a.get("picture"));
        }
        case "kakao" -> {
          p.providerId = str(a.get("id"));
          Map<String, Object> account = map(a.get("kakao_account"));
          Map<String, Object> prof    = account != null ? map(account.get("profile")) : null;

          // 이메일은 scope 미요청/미동의 시 null일 수 있음
          p.email = account != null ? str(account.get("email")) : null;
          p.name  = prof != null ? str(prof.get("nickname")) : null;
          p.image = prof != null ? str(prof.get("profile_image_url")) : null;
        }
        case "naver" -> {
          Map<String, Object> r = map(a.get("response"));
          p.providerId = str(r.get("id"));
          p.email      = str(r.get("email"));
          p.name       = str(r.get("name"));
          p.image      = str(r.get("profile_image"));
        }
        default -> throw new OAuth2AuthenticationException(
            new OAuth2Error("unsupported_provider"), "Unsupported provider: " + provider);
      }

      if (p.name == null) p.name = p.provider + "_" + p.providerId; // 표시명 안전값
      return p;
    }

    static String str(Object o) { return o == null ? null : String.valueOf(o); }
    @SuppressWarnings("unchecked")
    static Map<String, Object> map(Object o) { return (o instanceof Map<?, ?> m) ? (Map<String, Object>) m : null; }
  }
}
