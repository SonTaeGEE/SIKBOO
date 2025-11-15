// src/pages/MainPage/MainPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChefHat,
  ShoppingCart,
  Refrigerator,
  Sparkles,
  Clock3,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

// =======================
// UI 컴포넌트 후보: HeroCarousel
// =======================
function HeroCarousel({ slides, interval = 6000 }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slides || slides.length <= 1) return;

    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, interval);

    return () => clearInterval(id);
  }, [slides, interval]);

  if (!slides || slides.length === 0) return null;
  const current = slides[index];

  return (
    <section className="mb-6 rounded-3xl bg-gradient-to-r from-[#7B61FF] to-[#C17DFF] p-5 text-white shadow-md md:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="mb-1 text-xs font-semibold tracking-[0.15em] text-violet-100 uppercase">
            {current.kicker}
          </p>
          <h2 className="mb-2 text-2xl leading-snug font-extrabold md:text-3xl">{current.title}</h2>
          <p className="mb-4 text-sm text-violet-100 md:text-base">{current.description}</p>
          <div className="flex flex-wrap items-center gap-2">
            {current.primaryAction && (
              <button
                type="button"
                onClick={() => current.primaryAction.onClick(navigate)}
                className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm hover:bg-violet-50"
              >
                {current.primaryAction.label}
                <ArrowRight size={14} className="ml-1" />
              </button>
            )}
            {current.secondaryAction && (
              <button
                type="button"
                onClick={() => current.secondaryAction.onClick(navigate)}
                className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-violet-100 backdrop-blur transition hover:bg-white/20"
              >
                {current.secondaryAction.label}
                <ArrowRight size={14} className="ml-1" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end md:w-48">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 md:h-28 md:w-28">
            {current.icon}
          </div>
        </div>
      </div>

      {/* 인디케이터 */}
      <div className="mt-4 flex justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-white' : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
}

// =======================
// UI 컴포넌트 후보: Section Wrapper
// =======================
function Section({ title, subtitle, rightContent, children }) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 md:text-lg">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 md:text-sm">{subtitle}</p>}
        </div>
        {rightContent && <div className="flex-shrink-0 text-xs text-slate-500">{rightContent}</div>}
      </div>
      {children}
    </section>
  );
}

// =======================
// UI 컴포넌트 후보: QuickActionCard
// =======================
function QuickActionCard({ icon: Icon, title, description, onClick, colorClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${colorClass}`}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
      </div>
    </button>
  );
}

// =======================
// UI 컴포넌트 후보: RecipePreviewCard
// =======================
function RecipePreviewCard({ name, tags, time, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[220px] flex-col rounded-2xl bg-white px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="mb-2 line-clamp-2 text-sm font-semibold text-slate-900">{name}</p>
      <div className="mb-2 flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span
            key={tag.label}
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
              tag.variant === 'have'
                ? 'bg-[#EEF2FF] text-[#4F46E5]'
                : tag.variant === 'need'
                  ? 'bg-[#FEF2F2] text-[#DC2626]'
                  : 'bg-slate-100 text-slate-600'
            }`}
          >
            {tag.label}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Clock3 size={12} />
          {time}
        </span>
        <span className="inline-flex items-center gap-0.5 text-violet-600">
          레시피 보기
          <ArrowRight size={12} />
        </span>
      </div>
    </button>
  );
}

// =======================
// UI 컴포넌트 후보: GroupBuyingHighlightCard
// =======================
function GroupBuyingHighlightCard({ title, desc, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col rounded-2xl bg-white px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {badge && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{desc}</p>
    </button>
  );
}

// =======================
// 메인 페이지
// =======================
export default function MainPage() {
  const navigate = useNavigate();

  // TODO: 나중에 실제 API 데이터로 교체
  const todayRecipes = [
    {
      id: 1,
      name: '양파 당근 볶음',
      time: '15분',
      tags: [
        { label: '있는 식재료', variant: 'have' },
        { label: '팬 하나로 끝', variant: 'neutral' },
      ],
    },
    {
      id: 2,
      name: '양파 닭가슴살 볶음',
      time: '20분',
      tags: [
        { label: '있는 식재료', variant: 'have' },
        { label: '고단백', variant: 'neutral' },
      ],
    },
  ];

  const needMoreRecipes = [
    {
      id: 3,
      name: '양파 당근 샐러드',
      time: '10분',
      tags: [
        { label: '양상추 1줌 필요', variant: 'need' },
        { label: '간단 샐러드', variant: 'neutral' },
      ],
    },
    {
      id: 4,
      name: '양파 크림 파스타',
      time: '25분',
      tags: [
        { label: '생크림 1컵 필요', variant: 'need' },
        { label: '밀가루 1컵 필요', variant: 'need' },
      ],
    },
  ];

  const expiringIngredients = ['양파 D-1', '당근 D-2', '우유 D-2'];

  const groupBuyingDeals = [
    {
      id: 1,
      title: '양파 3kg 박스 공동구매',
      desc: '양파를 자주 쓰는 이웃들과 함께 싸게 구매해보세요.',
      badge: '이번 주 인기',
    },
    {
      id: 2,
      title: '닭가슴살 1kg 세트',
      desc: '냉동 보관 가능한 고단백 닭가슴살을 공동구매로 저렴하게.',
      badge: '한정 수량',
    },
  ];

  const slides = [
    {
      kicker: '오늘 뭐 먹지 고민 끝',
      title: '냉장고 속 재료로 바로 만드는 레시피',
      description: '있는 재료만 골라 AI가 오늘 한 끼 레시피를 추천해줘요.',
      primaryAction: {
        label: '내 재료 선택하고 시작하기',
        onClick: (nav) => nav('/ingredients'),
      },
      secondaryAction: {
        label: '바로 레시피 보러가기',
        onClick: (nav) => nav('/recipes'),
      },
      icon: <ChefHat size={40} />,
    },
    {
      kicker: '장보기 귀찮은 날',
      title: '1~2개만 더 사면 되는 레시피',
      description: '추가 재료를 최소화해서 장보기도, 요리도 가볍게.',
      primaryAction: {
        label: '필요한 재료만 확인하기',
        onClick: (nav) => nav('/recipes?filter=need'),
      },
      secondaryAction: null,
      icon: <ShoppingBag size={40} />,
    },
    {
      kicker: '버리기 전에 맛있게',
      title: '유통기한 임박 재료로 해결하는 한 끼',
      description: '곧 버려야 할 재료를 먼저 쓰는 레시피를 추천해 드려요.',
      primaryAction: {
        label: '임박 재료 확인하기',
        onClick: (nav) => nav('/ingredients?filter=expiring'),
      },
      secondaryAction: null,
      icon: <Refrigerator size={40} />,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-4 pb-20 md:px-6">
      {/* =======================
          Hero 배너 (캐러셀)
         ======================= */}
      <HeroCarousel slides={slides} />

      {/* =======================
          빠른 액션 카드들
         ======================= */}
      <section className="mb-2 grid grid-cols-2 gap-3 md:grid-cols-4">
        <QuickActionCard
          icon={Refrigerator}
          title="내 식재료 관리"
          description="냉장고 속 재료를 한 번에 확인해요."
          onClick={() => navigate('/ingredients')}
          colorClass="bg-violet-500"
        />
        <QuickActionCard
          icon={ChefHat}
          title="AI 레시피 생성"
          description="재료만 고르면 레시피를 만들어줘요."
          onClick={() => navigate('/recipes')}
          colorClass="bg-purple-500"
        />
        <QuickActionCard
          icon={Sparkles}
          title="추천 레시피"
          description="오늘 바로 만들 수 있는 메뉴."
          onClick={() => navigate('/recipes?filter=today')}
          colorClass="bg-fuchsia-500"
        />
        <QuickActionCard
          icon={ShoppingCart}
          title="공동구매"
          description="많이 쓰는 재료를 같이 사요."
          onClick={() => navigate('/group-buying')}
          colorClass="bg-emerald-500"
        />
      </section>

      {/* =======================
          색상 레전드 (있는/필요한 재료 안내)
         ======================= */}
      <div className="mb-2 flex flex-wrap items-center gap-3 rounded-2xl bg-white px-3 py-2 text-[11px] text-slate-600 shadow-sm">
        <span className="font-semibold text-slate-800">색상 안내</span>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
          <span>파란색 뱃지: 있는 식재료</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
          <span>빨간색 뱃지: 추가로 필요한 식재료</span>
        </div>
      </div>

      {/* =======================
          오늘 바로 만들 수 있는 레시피
         ======================= */}
      <Section
        title="오늘 바로 만들 수 있는 레시피"
        subtitle="지금 있는 식재료만으로 만들 수 있는 메뉴예요."
        rightContent={
          <button
            type="button"
            onClick={() => navigate('/recipes?filter=have')}
            className="inline-flex items-center rounded-full bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
          >
            더 보기
          </button>
        }
      >
        {todayRecipes.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-6 text-center text-xs text-slate-500 shadow-sm">
            아직 추천 레시피가 없어요.{' '}
            <button
              type="button"
              onClick={() => navigate('/ingredients')}
              className="font-semibold text-violet-600 underline-offset-2 hover:underline"
            >
              내 재료를 먼저 등록해볼까요?
            </button>
          </div>
        ) : (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {todayRecipes.map((r) => (
              <RecipePreviewCard
                key={r.id}
                name={r.name}
                time={r.time}
                tags={r.tags}
                // 실제로는 세션/레시피 상세로 이동하도록 나중에 교체
                onClick={() => navigate('/recipes')}
              />
            ))}
          </div>
        )}
      </Section>

      {/* =======================
          1~2개만 더 사면 되는 레시피
         ======================= */}
      <Section
        title="1~2개만 더 사면 되는 레시피"
        subtitle="장보기 전에 필요한 재료를 먼저 확인해보세요."
      >
        {needMoreRecipes.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-6 text-center text-xs text-slate-500 shadow-sm">
            아직 추가 재료가 필요한 레시피가 없어요.
          </div>
        ) : (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {needMoreRecipes.map((r) => (
              <RecipePreviewCard
                key={r.id}
                name={r.name}
                time={r.time}
                tags={r.tags}
                onClick={() => navigate('/recipes?filter=need')}
              />
            ))}
          </div>
        )}
      </Section>

      {/* =======================
          유통기한 임박 재료
         ======================= */}
      <Section
        title="곧 버려야 할 재료"
        subtitle="유통기한이 얼마 안 남은 재료부터 먼저 사용해요."
        rightContent={
          <button
            type="button"
            onClick={() => navigate('/ingredients?filter=expiring')}
            className="inline-flex items-center rounded-full bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-100"
          >
            전체 보기
          </button>
        }
      >
        <div className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {expiringIngredients.map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 md:mt-0">
            임박 재료를 우선 사용하는 레시피를{' '}
            <span className="font-semibold text-violet-600">레시피 목록</span>에서 상단에 먼저
            보여드릴게요.
          </div>
        </div>
      </Section>

      {/* =======================
          공동구매 하이라이트
         ======================= */}
      <Section
        title="이번 주 공동구매"
        subtitle="많이 쓰는 재료는 이웃들과 함께 더 저렴하게."
        rightContent={
          <button
            type="button"
            onClick={() => navigate('/group-buying')}
            className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
          >
            전체 보기
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {groupBuyingDeals.map((deal) => (
            <GroupBuyingHighlightCard
              key={deal.id}
              title={deal.title}
              desc={deal.desc}
              badge={deal.badge}
              onClick={() => navigate('/group-buying')}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}
