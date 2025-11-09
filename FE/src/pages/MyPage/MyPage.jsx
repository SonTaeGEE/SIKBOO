import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { getMe } from '@/api/userApi';
import { logout } from '@/api/authApi';

const MyPage = () => {
  const nav = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMe();
        setUser(data);
      } catch (e) {
        console.error(e);        
        // 인증 없으면 로그인으로
        nav('/login', { replace: true });
      }
    })();
  }, [nav]);

  const handleLogout = async () => {
    try {
      await logout(); // 서버 쿠키 삭제
    } catch (err) {
      console.warn('logout error', err);
    } finally {
      try {
        localStorage.removeItem('token');
      } catch (removeErr) {
        console.warn('Failed to remove token from localStorage', removeErr);
      }
      nav('/login', { replace: true });
    }
  };

  const displayName = user?.name || user?.username || '사용자';
  const avatarChar = displayName.charAt(0);

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <h2 className="mb-4 text-lg font-bold text-[#333333]">마이페이지</h2>
        <div className="rounded-lg bg-white p-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#5f0080] text-2xl font-bold text-white">
            {avatarChar}
          </div>
          <h3 className="mb-1 text-lg font-bold text-[#333333]">{displayName}</h3>
          <p className="text-sm text-[#999999]">{user?.address || ''}</p>
        </div>

        <div className="mt-4 divide-y divide-[#f4f4f4] rounded-lg bg-white">
          <button className="w-full px-6 py-4 text-left text-[#333333] transition">
            참여 내역
          </button>
          <button className="w-full px-6 py-4 text-left text-[#333333] transition">
            내가 만든 공동구매
          </button>
          <button className="w-full px-6 py-4 text-left text-[#333333] transition">설정</button>
          <button
            onClick={handleLogout}
            className="w-full px-6 py-4 text-left text-[#e53e3e] transition"
            type="button"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
