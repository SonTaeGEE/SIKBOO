const CATEGORY_LABELS = {
  FRUIT: '과일',
  VEGETABLE: '채소',
  MEAT: '육류',
  SEAFOOD: '해산물',
  DAIRY: '유제품',
  GRAIN: '곡물',
  SNACK: '간식',
  BEVERAGE: '음료',
  OTHER: '기타',
};

const STATUS_CONFIG = {
  RECRUITING: { label: '모집중', color: 'bg-emerald-50 text-emerald-700' },
  DEADLINE: { label: '마감', color: 'bg-slate-100 text-slate-600' },
  CLOSED: { label: '종료', color: 'bg-slate-100 text-slate-500' },
};

export function GroupBuyingHighlightCard({
  title,
  category,
  currentPeople,
  maxPeople,
  totalPrice,
  status,
  deadline,
  pickupLocation,
  onClick,
}) {
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.RECRUITING;
  const categoryLabel = CATEGORY_LABELS[category] || category;

  // 마감 임박 체크 (24시간 이내)
  const isDeadlineSoon =
    deadline && new Date(deadline) - new Date() < 24 * 60 * 60 * 1000 && status === 'RECRUITING';

  // 1인당 가격 계산
  const pricePerPerson = Math.floor(totalPrice / maxPeople);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col rounded-2xl bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* 상단: 제목과 상태 */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="line-clamp-1 flex-1 text-sm font-semibold text-slate-900">{title}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusConfig.color}`}
        >
          {isDeadlineSoon ? '마감임박' : statusConfig.label}
        </span>
      </div>

      {/* 중간: 카테고리, 인원, 가격 */}
      <div className="mb-2 flex items-center gap-2 text-[11px]">
        <span className="rounded bg-violet-50 px-1.5 py-0.5 font-medium text-violet-700">
          {categoryLabel}
        </span>
        <span className="text-slate-500">
          {currentPeople}/{maxPeople}명
        </span>
        <span className="text-slate-400">·</span>
        <span className="font-semibold text-emerald-600">
          {pricePerPerson.toLocaleString()}원/인
        </span>
      </div>

      {/* 하단: 픽업 위치 */}
      {pickupLocation && (
        <p className="line-clamp-1 text-[11px] text-slate-500">
          📍 {pickupLocation.split(' ').slice(0, 3).join(' ')}
        </p>
      )}
    </button>
  );
}
