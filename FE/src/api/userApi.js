import axiosInstance from '@/api/axiosInstance';

// Example API call function
export const fetchUsers = async () => {
  const response = await axiosInstance.get('/users');
  return response.data;
};

export const fetchUserById = async (id) => {
  const response = await axiosInstance.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await axiosInstance.post('/users', userData);
  return response.data;
};

export const updateUser = async ({ id, userData }) => {
  const response = await axiosInstance.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await axiosInstance.delete(`/users/${id}`);
  return response.data;
};

// [CHANGED] 추가: 소셜 로그인 후 내 프로필 조회 (쿠키 기반 인증)
export const getMe = async () => {
  // 백엔드에서 ACCESS HttpOnly 쿠키를 심었다면, axios.withCredentials=true로 전송됨
  const res = await axiosInstance.get('/auth/me');
  return res.data; // { id, email, name, role, ... } 형태 기대
};

// authApi에 이미 정의한 logout을 여기서도 재내보내기(호출부 호환성 유지)
export { logout } from './authApi';

// [OPTIONAL][CHANGED] 필요 시: 인가코드 -> 토큰 교환(백엔드에 구현돼 있으면 사용)
export const exchangeCode = async ({ provider, code, redirectUri }) => {
  const res = await axiosInstance.post(`/auth/oauth2/${provider}/callback`, {
    code,
    redirectUri,
  });
  return res.data; // { accessToken, ... }
};
