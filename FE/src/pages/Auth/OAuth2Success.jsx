// src/pages/Auth/OAuth2Success.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getMe } from '@/api/userApi';

const OAuth2Success = () => {
  const nav = useNavigate();
  const loc = useLocation();
  const [msg, setMsg] = useState('로그인 처리 중...');

  useEffect(() => {
    (async () => {
      try {
        // 0) 카카오에서 에러가 온 경우 처리
        const sp = new URLSearchParams(loc.search);
        const err = sp.get('error') || sp.get('error_description');
        if (err) {
          console.error('OAuth error:', err);
          setMsg('로그인에 실패했어요. 잠시 후 로그인 페이지로 이동합니다.');
          setTimeout(() => nav('/login', { replace: true }), 1200);
          return;
        }

        // 1) 서버가 쿼리/해시로 토큰을 넘겨준 경우 저장 (개발 페일백)
        const hash = new URLSearchParams(loc.hash.replace(/^#/, ''));
        const tokenFromQuery = sp.get('token') || hash.get('token') || sp.get('access_token');
        if (tokenFromQuery) {
          try {
            localStorage.setItem('token', tokenFromQuery);
          } catch (e) {
            console.warn('Failed to save token to localStorage', e);
          }
          // URL에서 토큰 제거
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        }

        // 2) 세션/쿠키 기반 확인: 반드시 authClient( withCredentials:true )
        await getMe();

        // 3) 성공 → 메인으로
        nav('/ingredients', { replace: true });
      } catch (e) {
        console.error(e);
        // 4) 401 등 실패 → 로그인으로
        setMsg('세션 확인에 실패했어요. 잠시 후 로그인 페이지로 이동합니다.');
        setTimeout(() => nav('/login', { replace: true }), 1200);
      }
    })();
  }, [loc.search, loc.hash, nav]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-white">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <p className="text-gray-700">{msg}</p>
      </div>
    </div>
  );
};

export default OAuth2Success;
