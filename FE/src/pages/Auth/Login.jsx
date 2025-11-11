// src/pages/Auth/Login.jsx
import { useState } from 'react';
import sikbooLogo from '@/assets/sikboo.png';

const Login = () => {
  const [redirecting, setRedirecting] = useState(false);

  // 절대 백엔드 주소 확정(프록시 사용 안 함)
  const API_BASE = (
    import.meta.env.VITE_API_BASE_URL || // 기존 변수 호환
    'http://localhost:8080'
  ) // 개발 기본값
    .replace(/\/$/, '');

  // 무조건 백엔드의 인가 엔드포인트로 리디렉트
  const kakaoAuthUrl = `${API_BASE}/api/oauth2/authorization/kakao`;

  const handleKakao = () => {
    setRedirecting(true);
    // SPA 라우팅이 아니라 실제 네비게이션으로 이동해야 함
    window.location.href = kakaoAuthUrl;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-white px-4">
      <div className="w-full max-w-md">
        {/* 로고 & 타이틀 */}
        <div className="mb-12 text-center">
          <img src={sikbooLogo} alt="식재료부 로고" className="mx-auto mb-6 h-64 w-64 object-contain" />
        </div>

        {/* 카카오 로그인 버튼 */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleKakao}
            disabled={redirecting}
            className="flex items-center justify-center gap-3 rounded-xl bg-[#FEE500] px-12 py-4 text-lg font-semibold text-[#191600] shadow-lg hover:brightness-95 disabled:opacity-70 transition-all"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#191600"
                d="M12 3C6.477 3 2 6.477 2 10.774c0 2.86 1.94 5.355 4.86 6.776-.17.63-.61 2.25-.7 2.6-.11.44.16.43.34.31.14-.09 2.2-1.49 3.09-2.1.77.11 1.56.17 2.41.17 5.523 0 10-3.477 10-7.85C22 6.477 17.523 3 12 3z"
              />
            </svg>
            {redirecting ? '카카오로 이동 중...' : '카카오로 로그인'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
