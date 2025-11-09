import React, { useEffect, useState } from 'react';
import { listIngredients, deleteIngredient, createIngredient } from '@/api/ingredientApi';
import { useNavigate } from 'react-router-dom';

const LOCATION_TABS = [
  { key: null, label: '전체' },
  { key: '냉장고', label: '냉장실' },
  { key: '냉동실', label: '냉동실' },
  { key: '실온', label: '실온' },
];

function formatDateIsoToYMD(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return iso;
  }
}

export default function Ingredients() {
  const nav = useNavigate();
  const [location, setLocation] = useState(null);
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal state + form (수량 제거)
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({
    ingredientName: '',
    location: '냉장고', // 기본을 한국어 enum 이름으로 설정
    due: '',
    memo: '',
  });

  const fetchList = async () => {
    setLoading(true);
    try {
      const page = await listIngredients({ location, q: q || null, page: 0, size: 200 });
      setItems(page.content || []);
    } catch (e) {
      console.error(e);
      nav('/login', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleDelete = async (id, name) => {
    if (!confirm(`${name} 을(를) 삭제하시겠습니까?`)) return;
    try {
      await deleteIngredient(id);
      setItems(prev => prev.filter(it => it.id !== id));
    } catch (e) {
      console.error(e);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddClick = () => setOpenAdd(true);

  const handleFormChange = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!form.ingredientName?.trim()) {
      alert('재료 이름을 입력하세요');
      return;
    }
    const payload = {
      ingredientName: form.ingredientName.trim(),
      location: form.location, // now sends "냉장고"/"냉동실"/"실온"
      due: form.due || undefined,
      memo: form.memo || undefined,
    };
    try {
      await createIngredient(payload);
      setOpenAdd(false);
      setForm({ ingredientName: '', location: '냉장고', due: '', memo: '' });
      fetchList();
    } catch (err) {
      console.error(err);
      alert('재료 추가 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <h2 className="mb-4 text-lg font-bold text-[#333333]">내 재료</h2>

        <div className="flex gap-2 mb-4">
          {LOCATION_TABS.map(t => (
            <button
              key={String(t.key)}
              onClick={() => setLocation(t.key)}
              className={`px-3 py-2 rounded ${location === t.key ? 'bg-[#5f0080] text-white' : 'bg-white text-[#333] border'}`}
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex gap-2 items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="검색"
              className="border rounded px-2 py-1"
            />
            <button onClick={fetchList} className="px-3 py-1 bg-[#5f0080] text-white rounded">검색</button>
            <button
              onClick={handleAddClick}
              className="px-3 py-1 bg-green-600 text-white rounded ml-2"
              type="button"
            >
              재료 추가
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4">
          {loading ? (
            <p>로딩 중...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-[#999]">보유한 식재료가 없습니다</p>
          ) : (
            <ul className="space-y-3">
              {items.map(it => (
                <li key={it.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="text-lg font-medium text-[#333]">{it.ingredientName}</div>
                    <div className="text-sm text-[#999]">{formatDateIsoToYMD(it.due)}</div>
                  </div>
                  <div>
                    <button
                      onClick={() => handleDelete(it.id, it.ingredientName)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                      type="button"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 우측 하단 플로팅 버튼 */}
      <button
        onClick={handleAddClick}
        className="fixed right-6 bottom-6 h-14 w-14 rounded-full bg-[#5f0080] text-white text-2xl shadow-lg flex items-center justify-center"
        aria-label="재료 추가"
        type="button"
      >
        +
      </button>

      {/* 모달: 재료 추가 (수량 입력 제거, location 값은 한국어 enum 이름) */}
      {openAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={submitAdd} className="w-[92%] max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-center text-lg font-bold">재료 추가</h3>

            <label className="block text-sm mb-1">재료 이름</label>
            <input required value={form.ingredientName} onChange={handleFormChange('ingredientName')}
              className="w-full border rounded px-2 py-1 mb-3" />

            <label className="block text-sm mb-1">보관 위치</label>
            <select value={form.location} onChange={handleFormChange('location')}
              className="w-full border rounded px-2 py-1 mb-3">
              <option value="냉장고">냉장실</option>
              <option value="냉동실">냉동실</option>
              <option value="실온">실온</option>
            </select>

            <label className="block text-sm mb-1">소비기한</label>
            <input type="date" value={form.due} onChange={handleFormChange('due')}
              className="w-full border rounded px-2 py-1 mb-3" />

            <label className="block text-sm mb-1">메모</label>
            <input value={form.memo} onChange={handleFormChange('memo')}
              className="w-full border rounded px-2 py-1 mb-4" />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpenAdd(false)} className="px-3 py-1 border rounded">취소</button>
              <button type="submit" className="px-3 py-1 bg-[#5f0080] text-white rounded">추가</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
