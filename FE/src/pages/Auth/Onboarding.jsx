import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitOnboarding, skipOnboarding } from '@/api/authApi';
import { analyzeIngredientText, addIngredientsFromAi } from '@/api/ingredientApi';
import sikbooLogo from '@/assets/sikboo.png';
import toast from 'react-hot-toast';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: 프로필, 2: 재료
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('manual'); // 'manual' | 'ai'

  // 프로필 데이터
  const [diseases, setDiseases] = useState('');
  const [allergies, setAllergies] = useState('');

  // 수동 입력 - 재료 데이터 (위치별)
  const [fridge, setFridge] = useState(''); // 냉장고
  const [freezer, setFreezer] = useState(''); // 냉동실
  const [room, setRoom] = useState(''); // 실온

  // AI 입력 데이터
  const [aiText, setAiText] = useState('');
  const [aiResult, setAiResult] = useState(null);

  const handleSkip = async () => {
    if (!confirm('설문을 건너뛰시겠습니까?\n나중에 마이페이지에서 수정할 수 있습니다.')) return;

    setLoading(true);
    try {
      await skipOnboarding();
      navigate('/ingredients', { replace: true });
    } catch (error) {
      console.error('건너뛰기 실패:', error);
      toast.error('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setStep(2);
  };

  // AI 분석 요청
  const handleAiAnalyze = async () => {
    if (!aiText.trim()) {
      toast.error('내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await analyzeIngredientText(aiText);

      // ✅ AI 분석 결과 확인
      console.log('AI 분석 결과:', result);
      result.items?.forEach((item, idx) => {
        console.log(
          `항목 ${idx + 1} - name: "${item.name}", storage: "${item.storage}", expiryDays: ${item.expiryDays}`,
        );
      });

      setAiResult(result);
    } catch (error) {
      console.error('AI 분석 실패:', error);
      toast.error('분석에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // AI 결과 항목 삭제
  const handleRemoveAiItem = (index) => {
    const newItems = aiResult.items.filter((_, i) => i !== index);
    setAiResult({ ...aiResult, items: newItems });
  };

  // AI 결과 항목 수정
  const handleEditAiItem = (index, field, value) => {
    const newItems = [...aiResult.items];
    newItems[index][field] = value;
    setAiResult({ ...aiResult, items: newItems });
  };

  // ✅ 날짜 계산 헬퍼 함수
  const calculateDueDate = (expiryDays) => {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + expiryDays);
    return dueDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 공통 프로필
      const profile = {
        diseases: diseases
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        allergies: allergies
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (mode === 'ai') {
        // --- AI 모드 ---
        if (!aiResult || !aiResult.items || aiResult.items.length === 0) {
          toast.error('먼저 AI 분석을 진행해주세요.');
          return;
        }

        // ✅ expiryDays가 0 이상의 숫자인지 검증 (0도 유효)
        const items = aiResult.items.map((it) => {
          const expiry = Number(it.expiryDays);

          // 기본값 결정 (expiryDays가 없거나 유효하지 않을 때만)
          let finalExpiryDays;
          if (Number.isFinite(expiry) && expiry >= 0) {
            // ✅ 0 이상의 유효한 숫자면 그대로 사용
            finalExpiryDays = expiry;
          } else {
            // 기본값 적용
            finalExpiryDays = it.storage === '냉동실' ? 90 : it.storage === '실온' ? 3 : 7;
          }

          return {
            name: String(it.name ?? '').trim(),
            storage:
              it.storage === '냉장고' || it.storage === '냉동실' || it.storage === '실온'
                ? it.storage
                : '냉장고',
            expiryDays: finalExpiryDays,
          };
        });

        console.log('AI 모드 - 정제된 items:', items);

        // 1) AI 결과를 먼저 저장 (여기서 expiryDays가 그대로 반영되어 due 계산됨)
        await addIngredientsFromAi(items);

        // 2) 온보딩 완료만 표시 (ingredients는 비워서 재저장 방지)
        await submitOnboarding({
          profile,
          ingredients: null,
          skip: false,
        });
      } else {
        // --- 수동 모드: 기존대로 온보딩만 호출 (서버가 +7/+90/+3 추정) ---
        const ingredientsData = {
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
        };

        await submitOnboarding({
          profile,
          ingredients: ingredientsData,
          skip: false,
        });
      }

      navigate('/ingredients', { replace: true });
    } catch (error) {
      console.error('제출 실패:', error);
      if (error?.response?.status === 401) {
        toast.error('인증이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login', { replace: true });
        return;
      }
      toast.error('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
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

        {/* Step 1: 건강 정보 */}
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
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            {/* 헤더 - 제목과 토글 */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="mb-1 text-2xl font-bold text-gray-800">보유 식재료</h2>
                <p className="text-sm text-gray-600">
                  {mode === 'manual' ? '한 줄에 하나씩 입력해주세요' : '자유롭게 말씀해주세요'}
                </p>
              </div>

              {/* AI 모드 토글 */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${mode === 'manual' ? 'text-gray-700' : 'text-gray-400'}`}
                >
                  직접
                </span>
                <button
                  onClick={() => {
                    setMode(mode === 'manual' ? 'ai' : 'manual');
                    if (mode === 'ai') {
                      setAiResult(null);
                      setAiText('');
                    }
                  }}
                  className={`relative h-7 w-12 rounded-full transition-colors ${
                    mode === 'ai' ? 'bg-[#5f0080]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                      mode === 'ai' ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span
                  className={`text-xs font-medium ${mode === 'ai' ? 'text-[#5f0080]' : 'text-gray-400'}`}
                >
                  🤖 AI
                </span>
              </div>
            </div>

            {/* 수동 입력 모드 */}
            {mode === 'manual' && (
              <div className="space-y-4">
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
                    placeholder={'우유\n계란\n김치\n요거트'}
                    rows={5}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-[#5f0080] focus:ring-2 focus:ring-[#5f0080]/20 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">자동으로 7일 예상 기한이 설정됩니다</p>
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
                  <p className="mt-1 text-xs text-gray-500">자동으로 90일 예상 기한이 설정됩니다</p>
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
                  <p className="mt-1 text-xs text-gray-500">자동으로 3일 예상 기한이 설정됩니다</p>
                </div>
              </div>
            )}

            {/* AI 입력 모드 */}
            {mode === 'ai' && (
              <div className="space-y-4">
                {/* 자연어 입력 */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xl">💬</span>
                    <h3 className="text-sm font-semibold text-gray-800">자유롭게 말씀해주세요</h3>
                  </div>

                  <textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="예시:&#10;어제 엄마가 김치를 보내주셨고, 마트에서 우유를 사왔다.&#10;소비기한이 3일밖에 남지 않아서 할인하고 있었다.&#10;&#10;냉동실에 냉동만두 2봉지 넣었고, 실온에 라면 5개 쟁여뒀다."
                    rows={8}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#5f0080] focus:ring-2 focus:ring-[#5f0080]/20 focus:outline-none"
                  />

                  {/* 도움말 */}
                  <div className="mt-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-800">
                      <span>💡</span>
                      이렇게 말씀해주세요
                    </p>
                    <ul className="space-y-0.5 text-xs text-gray-600">
                      <li>• 어떤 재료를 구매하거나 받았는지</li>
                      <li>• 보관 장소 (냉장고/냉동실/실온)</li>
                      <li>• 소비기한이나 유통기한</li>
                    </ul>
                  </div>

                  {/* 분석 버튼 */}
                  <button
                    onClick={handleAiAnalyze}
                    disabled={loading || !aiText.trim()}
                    className="mt-3 w-full rounded-lg bg-gradient-to-r from-[#5f0080] to-purple-600 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                        AI 분석 중...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>🤖</span>
                        AI로 분석하기
                      </span>
                    )}
                  </button>
                </div>

                {/* AI 분석 결과 */}
                {aiResult && aiResult.items && aiResult.items.length > 0 && (
                  <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span>✨</span>
                      <h3 className="text-sm font-semibold text-gray-800">AI가 인식한 식재료</h3>
                      <span className="rounded-full bg-[#5f0080] px-2 py-0.5 text-xs font-semibold text-white">
                        {aiResult.items.length}개
                      </span>
                    </div>

                    <div className="space-y-2">
                      {aiResult.items.map((item, index) => {
                        // ✅ 각 아이템마다 실시간으로 날짜 계산
                        const expiryDays = Number(item.expiryDays);
                        const validExpiryDays =
                          Number.isFinite(expiryDays) && expiryDays >= 0
                            ? expiryDays
                            : item.storage === '냉동실'
                              ? 90
                              : item.storage === '실온'
                                ? 3
                                : 7;

                        const calculatedDate = calculateDueDate(validExpiryDays);

                        return (
                          <div
                            key={index}
                            className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3"
                          >
                            {/* 아이콘 */}
                            <div className="flex-shrink-0">
                              {item.storage === '냉장고' && (
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-lg">
                                  ❄️
                                </span>
                              )}
                              {item.storage === '냉동실' && (
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-lg">
                                  🧊
                                </span>
                              )}
                              {item.storage === '실온' && (
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-lg">
                                  🌡️
                                </span>
                              )}
                            </div>

                            {/* 내용 */}
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleEditAiItem(index, 'name', e.target.value)}
                                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm font-semibold focus:border-[#5f0080] focus:outline-none"
                                />
                                <button
                                  onClick={() => handleRemoveAiItem(index)}
                                  className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:bg-red-100 hover:text-red-600"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                {/* 보관 위치 */}
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">보관:</span>
                                  <select
                                    value={item.storage}
                                    onChange={(e) =>
                                      handleEditAiItem(index, 'storage', e.target.value)
                                    }
                                    className="rounded border border-gray-300 px-2 py-0.5 text-xs focus:border-[#5f0080] focus:outline-none"
                                  >
                                    <option value="냉장고">냉장고</option>
                                    <option value="냉동실">냉동실</option>
                                    <option value="실온">실온</option>
                                  </select>
                                </div>

                                {/* 소비기한 입력 */}
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">기한:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.expiryDays ?? validExpiryDays}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      handleEditAiItem(
                                        index,
                                        'expiryDays',
                                        Number.isNaN(val) ? 0 : val,
                                      );
                                    }}
                                    className="w-14 rounded border border-gray-300 px-1 py-0.5 text-center text-xs focus:border-[#5f0080] focus:outline-none"
                                  />
                                  <span className="text-gray-500">일 후</span>
                                </div>

                                {/* ✅ 계산된 날짜 표시 (실시간 반영) */}
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400">→</span>
                                  <span className="font-medium text-[#5f0080]">
                                    {calculatedDate}
                                  </span>
                                  {validExpiryDays === 0 && (
                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                                      오늘까지
                                    </span>
                                  )}
                                  {validExpiryDays === 1 && (
                                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
                                      내일까지
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 버튼 */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
