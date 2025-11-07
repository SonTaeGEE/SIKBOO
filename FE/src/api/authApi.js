// [NEW] 로그인/세션 관련 API 모음
import authClient from '@/api/authClient';
import apiClient from './axios';

// 내 정보 조회 (쿠키 기반)
export const getMe = async () => {
  const { data } = await authClient.get('/auth/me');
  return data;
};

// 서버 로그아웃 (쿠키 삭제)
export const logout = async () => {
  const { data } = await authClient.post('/auth/logout');
  return data;
};

// 카카오 로그인 URL 만들기 (개발=프록시, 배포=절대경로)
export const getKakaoAuthUrl = () => {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const path = '/oauth2/authorization/kakao';
  return base ? `${base}${path}` : path; // base 없으면 프록시(/oauth2/...) 사용
};

export const kakaoLogin = async (code) =>{
  const response = await apiClient.post('/auth/kakao',{code});
  return response.data;
}