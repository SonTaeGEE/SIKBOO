import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitOnboarding, skipOnboarding } from '@/api/authApi';
import sikbooLogo from '@/assets/sikboo.png';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: 프로필, 2: 재료
  const [loading, setLoading] = useState(false);

  // 프로필 데이터
  const [diseases, setDiseases] = useState('');
  const [allergies, setAllergies] = useState('');

  // 재료 데이터 (위치별)
  const [fridge, setFridge] = useState(''); // 냉장고
  const [freezer, setFreezer] = useState(''); // 냉동실
  const [room, setRoom] = useState(''); // 실온

  const handleSkip = async () => {
    if (!confirm('설문을 건너뛰시겠습니까?\n나중에 마이페이지에서 수정할 수 있습니다.')) return;

    setLoading(true);
    try {
      await skipOnboarding();
      navigate('/ingredients', { replace: true });
    } catch (error) {
      console.error('건너뛰기 실패:', error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        profile: {
          diseases: diseases
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          allergies: allergies
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
        ingredients: {
          냉장고: fridge
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          냉동실: freezer
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          실온: room
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        },
        skip: false,
      };

      await submitOnboarding(payload);
      navigate('/ingredients', { replace: true });
    } catch (error) {
      console.error('제출 실패:', error);
      alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <img
            src={sikbooLogo}
            alt="식재료부 로고"
            className="mx-auto mb-4 h-24 w-24 object-contain"
          />
          <h1 className="mb-2 text-3xl font-bold text-gray-800">사전 설문</h1>
          <p className="text-gray-600">더 나은 서비스 제공을 위해 간단한 정보를 입력해주세요</p>
        </div>

        {/* 진행 상태 바 */}
        <div className="mb-8 flex justify-center gap-2">
          <div
            className={`h-2 w-24 rounded-full transition-all ${
              step >= 1 ? 'bg-[#5f0080]' : 'bg-gray-200'
            }`}
          />
          <div
            className={`h-2 w-24 rounded-full transition-all ${
              step >= 2 ? 'bg-[#5f0080]' : 'bg-gray-200'
            }`}
          />
        </div>

        {/* Step 1: 건강 정보 (간격 축소) */}
        {step === 1 && (
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">건강 정보</h2>
            <p className="mb-4 text-sm text-gray-600">
              질병이나 알레르기 정보를 입력하시면 맞춤형 레시피를 추천해드립니다.
            </p>

            <div className="space-y-4">
              {/* 지병 입력 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  지병 <span className="text-gray-400">(쉼표로 구분)</span>
                </label>
                <input
                  type="text"
                  value={diseases}
                  onChange={(e) => setDiseases(e.target.value)}
                  placeholder="예: 당뇨, 고혈압, 갑상선"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-[#5f0080] focus:ring-2 focus:ring-[#5f0080]/20 focus:outline-none"
                />

                {/* 지병 태그 표시 */}
                {diseases && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {diseases.split(',').map((disease, index) => {
                      const trimmed = disease.trim();
                      if (!trimmed) return null;
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700"
                        >
                          {trimmed}
                          <button
                            type="button"
                            onClick={() => {
                              const items = diseases
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean);
                              items.splice(index, 1);
                              setDiseases(items.join(', '));
                            }}
                            className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-red-200 focus:outline-none"
                          >
                            <span className="text-xs">✕</span>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">없으면 비워두셔도 됩니다</p>
              </div>

              {/* 알레르기 입력 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  알레르기 <span className="text-gray-400">(쉼표로 구분)</span>
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="예: 땅콩, 우유, 계란, 갑각류"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-[#5f0080] focus:ring-2 focus:ring-[#5f0080]/20 focus:outline-none"
                />

                {/* 알레르기 태그 표시 */}
                {allergies && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {allergies.split(',').map((allergy, index) => {
                      const trimmed = allergy.trim();
                      if (!trimmed) return null;
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-700"
                        >
                          {trimmed}
                          <button
                            type="button"
                            onClick={() => {
                              const items = allergies
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean);
                              items.splice(index, 1);
                              setAllergies(items.join(', '));
                            }}
                            className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-orange-200 focus:outline-none"
                          >
                            <span className="text-xs">✕</span>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">없으면 비워두셔도 됩니다</p>
              </div>
            </div>

            {/* 버튼 */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSkip}
                disabled={loading}
                className="flex-1 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                건너뛰기
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex-1 rounded-lg bg-[#5f0080] py-3 font-semibold text-white transition-colors hover:bg-[#4a0066] disabled:cursor-not-allowed disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 보유 식재료 */}
        {step === 2 && (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <h2 className="mb-2 text-2xl font-bold text-gray-800">보유 식재료</h2>
            <p className="mb-6 text-sm text-gray-600">
              보관 장소별로 식재료를 입력해주세요. 한 줄에 하나씩 입력하며, 소비기한은
              선택사항입니다.
            </p>

            <div className="space-y-6">
              {/* 냉장고 */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-blue-600">
                    ❄️
                  </span>
                  냉장고
                </label>
                <textarea
                  value={fridge}
                  onChange={(e) => setFridge(e.target.value)}
                  placeholder={'우유\n계란\n김치/2024-12-31\n요거트(2024-11-20)'}
                  rows={5}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-[#5f0080] focus:ring-2 focus:ring-[#5f0080]/20 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  소비기한 입력: "우유/2024-12-31" 또는 "우유(2024-12-31)" 형식
                </p>
              </div>

              {/* 냉동실 */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-100 text-indigo-600">
                    🧊
                  </span>
                  냉동실
                </label>
                <textarea
                  value={freezer}
                  onChange={(e) => setFreezer(e.target.value)}
                  placeholder={'냉동만두\n아이스크림\n냉동피자'}
                  rows={5}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-[#5f0080] focus:ring-2 focus:ring-[#5f0080]/20 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  냉동 식품은 자동으로 90일 예상 기한이 설정됩니다
                </p>
              </div>

              {/* 실온 */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-amber-100 text-amber-600">
                    🌡️
                  </span>
                  실온
                </label>
                <textarea
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder={'라면\n통조림\n과자'}
                  rows={5}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-[#5f0080] focus:ring-2 focus:ring-[#5f0080]/20 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  실온 보관 식품은 자동으로 3일 예상 기한이 설정됩니다
                </p>
              </div>
            </div>

            {/* 버튼 */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                이전
              </button>
              <button
                onClick={handleSkip}
                disabled={loading}
                className="flex-1 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                건너뛰기
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-lg bg-[#5f0080] py-3 font-semibold text-white transition-colors hover:bg-[#4a0066] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                    제출 중...
                  </span>
                ) : (
                  '완료'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
