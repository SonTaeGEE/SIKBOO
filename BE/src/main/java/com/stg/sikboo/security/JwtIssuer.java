package com.stg.sikboo.security;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Component
public class JwtIssuer {

  @Value("${spring.security.oauth2.resourceserver.jwt.secret-key}")
  String secret;

  private byte[] key(){ return secret.getBytes(StandardCharsets.UTF_8); }

  public String access(Long uid, List<String> roles, Duration ttl) {
    try {
      var claims = new JWTClaimsSet.Builder()
          .subject(String.valueOf(uid))
          .claim("memberId", uid)
          .claim("roles", roles)
          .claim("typ","access")
          .issueTime(new Date())
          .expirationTime(Date.from(Instant.now().plus(ttl)))
          .build();
      var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
      jwt.sign(new MACSigner(key()));
      return jwt.serialize();
    } catch (JOSEException e) { throw new IllegalStateException(e); }
  }

  public String refresh(Long uid, Duration ttl) {
    try {
      var claims = new JWTClaimsSet.Builder()
          .subject(String.valueOf(uid))
          .claim("typ","refresh")
          .issueTime(new Date())
          .expirationTime(Date.from(Instant.now().plus(ttl)))
          .build();
      var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
      jwt.sign(new MACSigner(key()));
      return jwt.serialize();
    } catch (JOSEException e) { throw new IllegalStateException(e); }
  }
}
