import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { getMe } from '@/api/userApi';
import { getMyProfile, updateMyProfile } from '@/api/userApi'; // ⬅️ 추가
import { logout } from '@/api/authApi';

const MyPage = () => {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editDiseases, setEditDiseases] = useState('');
  const [editAllergies, setEditAllergies] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const userData = await getMe();
        setUser(userData);

        const profileData = await getMyProfile();
        setProfile(profileData);
        setEditDiseases(profileData.diseases.join(', '));
        setEditAllergies(profileData.allergies.join(', '));
      } catch (e) {
        console.error(e);
        nav('/login', { replace: true });
      }
    })();
  }, [nav]);

  const handleLogout = async () => {
    try {
      await logout();
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

  const handleSave = async () => {
    try {
      const updated = await updateMyProfile({
        diseases: editDiseases
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        allergies: editAllergies
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setProfile(updated);
      setEditing(false);
      alert('저장되었습니다.');
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
  };

  // ⬇️ 추가: 지병 태그 삭제
  const handleRemoveDisease = (index) => {
    const items = profile.diseases.filter((_, i) => i !== index);
    setProfile({ ...profile, diseases: items });
    setEditDiseases(items.join(', '));

    // 즉시 서버에 반영
    updateMyProfile({
      diseases: items,
      allergies: profile.allergies,
    }).catch((error) => {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    });
  };

  // ⬇️ 추가: 알레르기 태그 삭제
  const handleRemoveAllergy = (index) => {
    const items = profile.allergies.filter((_, i) => i !== index);
    setProfile({ ...profile, allergies: items });
    setEditAllergies(items.join(', '));

    // 즉시 서버에 반영
    updateMyProfile({
      diseases: profile.diseases,
      allergies: items,
    }).catch((error) => {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    });
  };

  const displayName = user?.name || user?.username || '사용자';
  const avatarChar = displayName.charAt(0);

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-4">
        {/* 프로필 카드 */}
        <div className="rounded-lg bg-white p-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#5f0080] text-2xl font-bold text-white">
            {avatarChar}
          </div>
          <h3 className="mb-1 text-lg font-bold text-[#333333]">{displayName}</h3>
          <p className="text-sm text-[#999999]">{user?.address || ''}</p>
        </div>

        {/* 건강 정보 카드 */}
        {profile && (
          <div className="mt-4 rounded-lg bg-white p-6">
            <h4 className="mb-4 text-lg font-bold text-[#333333]">건강 정보</h4>

            {/* 지병 */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                지병 <span className="text-xs text-gray-400">(쉼표로 구분)</span>
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editDiseases}
                  onChange={(e) => setEditDiseases(e.target.value)}
                  placeholder="예: 당뇨, 고혈압"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              ) : (
                <div className="flex flex-wrap gap-2 rounded-lg bg-gray-50 p-3">
                  {profile.diseases.length > 0 ? (
                    profile.diseases.map((d, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700"
                      >
                        {d}
                        <button
                          type="button"
                          onClick={() => handleRemoveDisease(i)}
                          className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-red-200 focus:outline-none"
                        >
                          <span className="text-xs">✕</span>
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">없음</span>
                  )}
                </div>
              )}
            </div>

            {/* 알레르기 */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                알레르기 <span className="text-xs text-gray-400">(쉼표로 구분)</span>
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editAllergies}
                  onChange={(e) => setEditAllergies(e.target.value)}
                  placeholder="예: 땅콩, 우유"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              ) : (
                <div className="flex flex-wrap gap-2 rounded-lg bg-gray-50 p-3">
                  {profile.allergies.length > 0 ? (
                    profile.allergies.map((a, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-700"
                      >
                        {a}
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(i)}
                          className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-orange-200 focus:outline-none"
                        >
                          <span className="text-xs">✕</span>
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">없음</span>
                  )}
                </div>
              )}
            </div>

            {/* 수정 버튼 */}
            {editing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-gray-700"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-lg bg-[#5f0080] py-2 text-white"
                >
                  저장
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full rounded-lg bg-[#5f0080] py-2 text-white"
              >
                수정하기
              </button>
            )}
          </div>
        )}

        {/* 로그아웃 버튼 */}
        <div className="mt-4 divide-y divide-[#f4f4f4] rounded-lg bg-white">
          <button
            onClick={handleLogout}
            className="w-full px-6 py-4 text-left text-[#e53e3e]"
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
