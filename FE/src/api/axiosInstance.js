import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080') + '/api';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // 쿠키 기반 인증
});

// --- Refresh 재시도 로직 ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config) => config, // 쿠키로 인증 → Authorization 헤더 자동 추가 안 함
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;
    const currentPath = window.location.pathname;

    // ★ 1. 온보딩 필요 (428 Precondition Required)
    if (status === 428) {
      if (currentPath !== '/onboarding') {
        console.warn('온보딩이 필요합니다. /onboarding으로 리다이렉트합니다.');
        window.location.href = '/onboarding';
      }
      return Promise.reject(new Error('온보딩이 필요합니다'));
    }

    // ★ 2. 인증 오류 (401 Unauthorized) - Refresh 재시도
    if (status === 401 && !originalRequest._retry) {
      // 이미 refresh 중이면 대기열에 추가
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(axiosInstance(originalRequest)),
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh 토큰으로 재발급 시도
        await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
        processQueue(null);
        return axiosInstance(originalRequest); // 원래 요청 재시도
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh 실패 → 로그인 페이지로 (단, 이미 로그인 페이지면 무한루프 방지)
        if (currentPath !== '/login' && currentPath !== '/oauth2/success') {
          console.warn('세션이 만료되었습니다. 로그인 페이지로 이동합니다.');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ★ 3. Refresh 재시도 실패 후 401 (최종 로그인 페이지 이동)
    if (status === 401) {
      if (currentPath !== '/login' && currentPath !== '/oauth2/success') {
        console.warn('인증이 필요합니다. 로그인 페이지로 이동합니다.');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
