// src/pages/Auth/OAuth2Success.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMe } from '@/api/authApi'; // ⬅️ authApi에서 import
import axiosInstance from '@/api/axiosInstance';

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

        // ★ 3) 온보딩 상태 체크 (추가된 부분)
        setMsg('온보딩 상태 확인 중...');
        try {
          // 아무 API나 호출해서 428 체크 (가장 가벼운 API 선택)
          await axiosInstance.get('/api/ingredients?size=1&page=0');

          // 200 응답 → 온보딩 완료 → 재료 페이지로
          nav('/ingredients', { replace: true });
        } catch (error) {
          if (error.response?.status === 428) {
            // 428 Precondition Required → 온보딩 미완료 → 온보딩 페이지로
            setMsg('사전 설문을 진행해주세요.');
            setTimeout(() => nav('/onboarding', { replace: true }), 800);
          } else {
            // 기타 오류는 일단 재료 페이지로 (필터가 다시 체크함)
            console.warn('온보딩 체크 실패, 재료 페이지로 이동:', error);
            nav('/ingredients', { replace: true });
          }
        }
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
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#5f0080] border-r-transparent"></div>
          <p className="text-gray-700">{msg}</p>
        </div>
      </div>
    </div>
  );
};

export default OAuth2Success;
