import React, { useEffect, useState } from 'react';
import { listIngredients, deleteIngredient, createIngredient, updateIngredient } from '@/api/ingredientApi';
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

  // create modal
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({
    ingredientName: '',
    location: '냉장고',
    due: '',
    memo: '',
  });

  // detail modal (view / edit / delete)
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailForm, setDetailForm] = useState({
    ingredientName: '',
    location: '냉장고',
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
      if (selectedItem?.id === id) {
        setOpenDetail(false);
        setSelectedItem(null);
      }
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
      location: form.location,
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

  // 상세 모달 열기 (목록 항목 클릭)
  const openDetailModal = (item) => {
    setSelectedItem(item);
    setDetailForm({
      ingredientName: item.ingredientName || '',
      location: item.location || '냉장고',
      due: item.due ? item.due.split('T')[0] : '',
      memo: item.memo || '',
    });
    setOpenDetail(true);
  };

  const handleDetailChange = (k) => (e) => setDetailForm(f => ({ ...f, [k]: e.target.value }));

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!detailForm.ingredientName?.trim()) {
      alert('재료 이름을 입력하세요');
      return;
    }
    const payload = {
      ingredientName: detailForm.ingredientName.trim(),
      location: detailForm.location,
      due: detailForm.due || undefined,
      memo: detailForm.memo || undefined,
    };
    try {
      await updateIngredient(selectedItem.id, payload);
      setOpenDetail(false);
      setSelectedItem(null);
      fetchList();
    } catch (err) {
      console.error(err);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-full pb-24">
      <div className="mx-auto max-w-6xl px-4 py-4">
        

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex gap-2 flex-wrap">
            {LOCATION_TABS.map(t => (
              <button
                key={String(t.key)}
                onClick={() => setLocation(t.key)}
                className={`px-3 py-2 rounded ${location === t.key ? 'bg-[#5f0080] text-white' : 'bg-white text-[#333] border'}`}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-2 sm:mt-0 ml-auto flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 min-w-0">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="검색"
                className="w-full border rounded px-2 py-1 pr-8"
              />
              {q && (
                <button
                  onClick={async () => { 
                    setQ(''); 
                    // 빈 검색어로 즉시 재조회 (상태 업데이트 전 실행)
                    try {
                      const page = await listIngredients({ location, q: null, page: 0, size: 200 });
                      setItems(page.content || []);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                  aria-label="검색어 지우기"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button onClick={fetchList} className="px-3 py-1 bg-[#5f0080] text-white rounded flex-shrink-0" type="button">검색</button>
            <button
              onClick={handleAddClick}
              className="px-3 py-1 bg-green-600 text-white rounded ml-2 flex-shrink-0"
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
            <p className="text-center text-sm text-[#999]">
              {q ? `'${q}'에 해당하는 재료가 없습니다` : '보유한 식재료가 없습니다'}
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map(it => (
                <li
                  key={it.id}
                  className="flex items-center justify-between border-b pb-2 cursor-pointer"
                >
                  <div onClick={() => openDetailModal(it)} className="flex-1">
                    <div className="text-lg font-medium text-[#333] mb-1">{it.ingredientName}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#999]">{formatDateIsoToYMD(it.due)} 까지</span>
                      {it.memo && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(it.id, it.ingredientName); }}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                    aria-label="삭제"
                    type="button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        onClick={handleAddClick}
        className="fixed right-6 bottom-20 z-50 h-14 w-14 rounded-full bg-[#5f0080] text-white text-2xl shadow-lg flex items-center justify-center"
        aria-label="재료 추가"
        type="button"
      >
        +
      </button>

      {openAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitAdd} className="w-full max-w-md rounded-lg bg-white p-6">
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

      {openDetail && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleUpdate} className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-center text-lg font-bold">재료 상세</h3>

            <label className="block text-sm mb-1">재료 이름</label>
            <input required value={detailForm.ingredientName} onChange={handleDetailChange('ingredientName')}
              className="w-full border rounded px-2 py-1 mb-3" />

            <label className="block text-sm mb-1">보관 위치</label>
            <select value={detailForm.location} onChange={handleDetailChange('location')}
              className="w-full border rounded px-2 py-1 mb-3">
              <option value="냉장고">냉장실</option>
              <option value="냉동실">냉동실</option>
              <option value="실온">실온</option>
            </select>

            <label className="block text-sm mb-1">소비기한</label>
            <input type="date" value={detailForm.due} onChange={handleDetailChange('due')}
              className="w-full border rounded px-2 py-1 mb-3" />

            <label className="block text-sm mb-1">메모</label>
            <input value={detailForm.memo} onChange={handleDetailChange('memo')}
              className="w-full border rounded px-2 py-1 mb-4" />

            <div className="flex justify-between">
              <div>
                <button type="button" onClick={() => { handleDelete(selectedItem.id, selectedItem.ingredientName); }} className="px-3 py-1 bg-red-500 text-white rounded">삭제</button>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setOpenDetail(false); setSelectedItem(null); }} className="px-3 py-1 border rounded">취소</button>
                <button type="submit" className="px-3 py-1 bg-[#5f0080] text-white rounded">수정</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}