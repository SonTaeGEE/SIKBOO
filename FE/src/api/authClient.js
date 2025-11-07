// [NEW] 소셜로그인/세션 확인 전용 axios 인스턴스
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

const authClient = axios.create({
  baseURL: API_BASE,                 // /api 또는 배포 절대경로
  withCredentials: true,             // [NEW] 쿠키(ACCESS/REFRESH) 전송
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// 필요 시 공통 에러 처리(선택)
authClient.interceptors.response.use(
  (res) => res,
  (err) => {
    // 세션 만료시 로그인으로
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default authClient;
