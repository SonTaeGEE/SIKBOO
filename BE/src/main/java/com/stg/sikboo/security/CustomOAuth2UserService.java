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
    var delegate   = new DefaultOAuth2UserService();
    var oauth2User = delegate.loadUser(req);

    String provider = req.getClientRegistration().getRegistrationId(); // google/kakao/naver
    Map<String, Object> attributes = oauth2User.getAttributes();

    Profile p = Profile.from(provider, attributes);

    // (provider, providerId) 로만 식별
    Member m = memberRepository.findByProviderAndProviderId(p.provider, p.providerId)
        .orElseGet(() -> {
          Member created = new Member();
          created.setRole("USER");
          created.setProvider(p.provider.toUpperCase());
          created.setProviderId(p.providerId);
          // name 이 비어있으면 안전값
          created.setName(p.name != null ? p.name : p.provider + "_" + p.providerId);
          // 프로필 이미지 필드가 있으면 주입
          // if (p.image != null) created.setProfileImage(p.image);
          return created;
        });

    // 이름/이미지 갱신(선택)
    if (p.name != null && !p.name.equals(m.getName())) {
      m.setName(p.name);
    }
    // if (p.image != null) m.setProfileImage(p.image);

    memberRepository.save(m);

    return new DefaultOAuth2User(
        List.of(new SimpleGrantedAuthority("ROLE_" + (m.getRole() != null ? m.getRole() : "USER"))),
        attributes,
        req.getClientRegistration().getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName()
    );
  }

  // ----- helpers -----
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

          // 이메일을 더이상 사용하지 않음
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

      if (p.name == null) p.name = p.provider + "_" + p.providerId; // 표시명 안전값
      return p;
    }

    static String str(Object o) { return o == null ? null : String.valueOf(o); }
    @SuppressWarnings("unchecked")
    static Map<String, Object> map(Object o) { return (o instanceof Map<?, ?> m) ? (Map<String, Object>) m : null; }
  }
}
