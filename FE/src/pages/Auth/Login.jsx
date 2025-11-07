// src/pages/Auth/Login.jsx
import { useState } from 'react';

const Login = () => {
  const [redirecting, setRedirecting] = useState(false);

  // 절대 백엔드 주소 확정(프록시 사용 안 함)
  const API_BASE = (
    import.meta.env.VITE_API_BASE ||          // 새 변수
    import.meta.env.VITE_API_BASE_URL ||      // 기존 변수 호환
    'http://localhost:8080'                   // 개발 기본값
  ).replace(/\/$/, '');

  // ❗버그 수정: 백틱 누락으로 문자열 템플릿이 깨져 있었음
  // 무조건 백엔드의 인가 엔드포인트로 리디렉트
  const kakaoAuthUrl = `${API_BASE}/oauth2/authorization/kakao`;

  const handleKakao = () => {
    setRedirecting(true);
    // SPA 라우팅이 아니라 실제 네비게이션으로 이동해야 함
    window.location.href = kakaoAuthUrl;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-white px-4">
      <div className="w-full max-w-md">
        {/* 로고 & 타이틀 */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-[#5f0080]">식재료부</h1>
          <p className="text-gray-600">함께하는 똑똑한 식재료 관리</p>
        </div>

        {/* 카드 */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">로그인</h2>

          <button
            type="button"
            onClick={handleKakao}
            disabled={redirecting}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#FEE500] py-3 font-semibold text-[#191600] shadow hover:brightness-95 disabled:opacity-70"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#191600"
                d="M12 3C6.477 3 2 6.477 2 10.774c0 2.86 1.94 5.355 4.86 6.776-.17.63-.61 2.25-.7 2.6-.11.44.16.43.34.31.14-.09 2.2-1.49 3.09-2.1.77.11 1.56.17 2.41.17 5.523 0 10-3.477 10-7.85C22 6.477 17.523 3 12 3z"
              />
            </svg>
            {redirecting ? '카카오로 이동 중...' : '카카오로 계속하기'}
          </button>

          {/* 디버그(임시): 실제로 어디로 가는지 눈으로 확인 */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>API_BASE = {API_BASE}</p>
            <p>AUTH URL = {kakaoAuthUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
