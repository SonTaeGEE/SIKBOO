import React, { useEffect, useState } from 'react';
import {
  listIngredients,
  deleteIngredient,
  createIngredient,
  updateIngredient,
} from '@/api/ingredientApi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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

// ✅ 소비기한 뱃지 컴포넌트
const Badge = ({ daysLeft }) => {
  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        D+{Math.abs(daysLeft)}
      </span>
    );
  }
  if (daysLeft === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
        오늘까지
      </span>
    );
  }
  if (daysLeft <= 3) {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
        D-{daysLeft}
      </span>
    );
  }
  return null;
};

export default function Ingredients() {
  const nav = useNavigate();
  const [location, setLocation] = useState(null);
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({
    ingredientName: '',
    location: '냉장고',
    due: '',
    memo: '',
  });

  const [openDetail, setOpenDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailForm, setDetailForm] = useState({
    ingredientName: '',
    location: '냉장고',
    due: '',
    memo: '',
  });

  const fetchList = async (page = 0) => {
    setLoading(true);
    setCurrentPage(page);

    try {
      const result = await listIngredients({
        location,
        q: q || null,
        page,
        size: pageSize,
      });

      setItems(result.content || []);
      setCurrentPage(result.number ?? page);
      setTotalPages(result.totalPages || 0);
      setTotalElements(result.totalElements || 0);
    } catch (e) {
      console.error(e);
      nav('/login', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleDelete = async (id, name) => {
    if (!confirm(`${name} 을(를) 삭제하시겠습니까?`)) return;
    try {
      await deleteIngredient(id);
      fetchList(currentPage);
      if (selectedItem?.id === id) {
        setOpenDetail(false);
        setSelectedItem(null);
      }
    } catch (e) {
      console.error(e);
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddClick = () => setOpenAdd(true);

  const handleFormChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!form.ingredientName?.trim()) {
      toast.error('재료 이름을 입력하세요');
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
      fetchList(0);
    } catch (err) {
      console.error(err);
      toast.error('재료 추가 중 오류가 발생했습니다.');
    }
  };

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

  const handleDetailChange = (k) => (e) => setDetailForm((f) => ({ ...f, [k]: e.target.value }));

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!detailForm.ingredientName?.trim()) {
      toast.error('재료 이름을 입력하세요');
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
      fetchList(currentPage);
    } catch (err) {
      console.error(err);
      toast.error('수정 중 오류가 발생했습니다.');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 0 || newPage >= totalPages) return;
    fetchList(newPage);
  };

  return (
    <div className="min-h-full pb-24">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-wrap gap-2">
            {LOCATION_TABS.map((t) => (
              <button
                key={String(t.key)}
                onClick={() => setLocation(t.key)}
                className={`rounded px-3 py-2 ${location === t.key ? 'bg-[#5f0080] text-white' : 'border bg-white text-[#333]'}`}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-2 ml-auto flex w-full items-center gap-2 sm:mt-0 sm:w-auto">
            <div className="relative min-w-0 flex-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchList(0);
                  }
                }}
                placeholder="검색"
                className="w-full rounded border px-2 py-1 pr-8"
              />
              {q && (
                <button
                  onClick={async () => {
                    setQ('');
                    try {
                      const result = await listIngredients({
                        location,
                        q: null,
                        page: 0,
                        size: pageSize,
                      });
                      setItems(result.content || []);
                      setCurrentPage(result.number || 0);
                      setTotalPages(result.totalPages || 0);
                      setTotalElements(result.totalElements || 0);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                  aria-label="검색어 지우기"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={() => fetchList(0)}
              className="flex-shrink-0 rounded bg-[#5f0080] px-3 py-1 text-white"
              type="button"
            >
              검색
            </button>
            <button
              onClick={handleAddClick}
              className="ml-2 flex-shrink-0 rounded bg-green-600 px-3 py-1 text-white"
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
            <>
              <ul className="space-y-3">
                {items.map((it) => (
                  <li
                    key={it.id}
                    className="flex cursor-pointer items-center justify-between border-b pb-2"
                  >
                    <div onClick={() => openDetailModal(it)} className="flex-1">
                      {/* ✅ 재료명과 뱃지를 같은 줄에 배치 */}
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-lg font-medium text-[#333]">{it.ingredientName}</span>
                        <Badge daysLeft={it.daysLeft} />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#999]">
                          {formatDateIsoToYMD(it.due)} 까지
                        </span>
                        {it.memo && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-[#999]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                            />
                          </svg>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(it.id, it.ingredientName);
                      }}
                      className="rounded p-2 text-gray-500 hover:bg-gray-100"
                      aria-label="삭제"
                      type="button"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="mt-6 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-30"
                      type="button"
                    >
                      ‹
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => {
                      if (
                        pageNum === 0 ||
                        pageNum === totalPages - 1 ||
                        Math.abs(pageNum - currentPage) <= 2
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`rounded px-3 py-1 ${
                              pageNum === currentPage
                                ? 'bg-[#5f0080] text-white'
                                : 'border bg-white text-[#333] hover:bg-gray-100'
                            }`}
                            type="button"
                          >
                            {pageNum + 1}
                          </button>
                        );
                      } else if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                        return (
                          <span key={pageNum} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages - 1}
                      className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-30"
                      type="button"
                    >
                      ›
                    </button>
                  </div>

                  <span className="text-sm text-gray-600">
                    {currentPage + 1} / {totalPages} 페이지 (전체 {totalElements}개)
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <button
        onClick={handleAddClick}
        className="fixed right-6 bottom-20 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#5f0080] text-2xl text-white shadow-lg"
        aria-label="재료 추가"
        type="button"
      >
        +
      </button>

      {openAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitAdd} className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-center text-lg font-bold">재료 추가</h3>

            <label className="mb-1 block text-sm">재료 이름</label>
            <input
              required
              value={form.ingredientName}
              onChange={handleFormChange('ingredientName')}
              className="mb-3 w-full rounded border px-2 py-1"
            />

            <label className="mb-1 block text-sm">보관 위치</label>
            <select
              value={form.location}
              onChange={handleFormChange('location')}
              className="mb-3 w-full rounded border px-2 py-1"
            >
              <option value="냉장고">냉장실</option>
              <option value="냉동실">냉동실</option>
              <option value="실온">실온</option>
            </select>

            <label className="mb-1 block text-sm">소비기한</label>
            <input
              type="date"
              value={form.due}
              onChange={handleFormChange('due')}
              className="mb-3 w-full rounded border px-2 py-1"
            />

            <label className="mb-1 block text-sm">메모</label>
            <input
              value={form.memo}
              onChange={handleFormChange('memo')}
              className="mb-4 w-full rounded border px-2 py-1"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenAdd(false)}
                className="rounded border px-3 py-1"
              >
                취소
              </button>
              <button type="submit" className="rounded bg-[#5f0080] px-3 py-1 text-white">
                추가
              </button>
            </div>
          </form>
        </div>
      )}

      {openDetail && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleUpdate} className="w-full max-w-md rounded-lg bg-white p-6">
            {/* ✅ 제목에 뱃지 추가 */}
            <div className="mb-4 flex items-center justify-center gap-2">
              <h3 className="text-lg font-bold">재료 상세</h3>
              <Badge daysLeft={selectedItem.daysLeft} />
            </div>

            <label className="mb-1 block text-sm">재료 이름</label>
            <input
              required
              value={detailForm.ingredientName}
              onChange={handleDetailChange('ingredientName')}
              className="mb-3 w-full rounded border px-2 py-1"
            />

            <label className="mb-1 block text-sm">보관 위치</label>
            <select
              value={detailForm.location}
              onChange={handleDetailChange('location')}
              className="mb-3 w-full rounded border px-2 py-1"
            >
              <option value="냉장고">냉장실</option>
              <option value="냉동실">냉동실</option>
              <option value="실온">실온</option>
            </select>

            <label className="mb-1 block text-sm">소비기한</label>
            <input
              type="date"
              value={detailForm.due}
              onChange={handleDetailChange('due')}
              className="mb-3 w-full rounded border px-2 py-1"
            />

            <label className="mb-1 block text-sm">메모</label>
            <input
              value={detailForm.memo}
              onChange={handleDetailChange('memo')}
              className="mb-4 w-full rounded border px-2 py-1"
            />

            <div className="flex justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    handleDelete(selectedItem.id, selectedItem.ingredientName);
                  }}
                  className="rounded bg-red-500 px-3 py-1 text-white"
                >
                  삭제
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpenDetail(false);
                    setSelectedItem(null);
                  }}
                  className="rounded border px-3 py-1"
                >
                  취소
                </button>
                <button type="submit" className="rounded bg-[#5f0080] px-3 py-1 text-white">
                  수정
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
