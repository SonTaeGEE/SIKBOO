// [NEW] 로그인/세션 관련 API 모음
import axiosInstance from '@/api/axiosInstance';

/**
 * 로그아웃 (서버에서 쿠키 삭제)
 */
export const logout = async () => {
  const { data } = await axiosInstance.post('/auth/logout');
  return data;
};

/**
 * 카카오 로그인 (인가 코드 전송)
 */
export const kakaoLogin = async (code) => {
  const response = await axiosInstance.post('/auth/kakao', { code }, { useAuth: false });
  return response.data;
};

/**
 * 내 프로필 조회 (쿠키 기반 인증)
 */
export const getMe = async () => {
  const res = await axiosInstance.get('/auth/me');
  return res.data; // { id, name, role, ... }
};
