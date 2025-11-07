// [NEW] 로그인/세션 관련 API 모음
import axiosInstance from '@/api/axiosInstance';

// 서버 로그아웃 (쿠키 삭제)
export const logout = async () => {
  const { data } = await axiosInstance.post('/auth/logout');
  return data;
};

export const kakaoLogin = async (code) => {
  const response = await axiosInstance.post('/auth/kakao', { code }, { useAuth: false });
  return response.data;
};
