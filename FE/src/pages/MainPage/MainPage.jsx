// src/pages/MainPage/MainPage.jsx
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ChefHat, ShoppingBag, ShoppingCart, Refrigerator, Sparkles } from 'lucide-react';

import {
  HeroCarousel,
  Section,
  QuickActionCard,
  RecommendationCard,
  GroupBuyingHighlightCard,
} from '@/components/Main';
import {
  IngredientsSkeleton,
  GroupBuyingSkeleton,
  RecommendationSkeleton,
} from '@/components/Main/Skeleton';
import { useInfiniteMyParticipatingGroupBuyings } from '@/hooks/useGroupBuying';
import { useCurrentUser } from '@/hooks/useUser';
import { useIngredients } from '@/hooks/useIngredient';
import { useDailyRecommendation } from '@/hooks/useDailyRecommendation';
import { HERO_SLIDES, QUICK_ACTIONS } from '@/constants/mainPage';

// =======================
// 메인 페이지
// =======================
export default function MainPage() {
  const navigate = useNavigate();
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();

  // 로그인 체크
  useEffect(() => {
    if (!isLoadingUser && !currentUser) {
      toast.error('로그인이 필요합니다.');
      navigate('/login', { replace: true });
    }
  }, [currentUser, isLoadingUser, navigate]);

  // 유통기한 기준으로 정렬된 내 식재료 조회 (3일 이내 임박)
  const { data: ingredientsData, isLoading: isLoadingIngredients } = useIngredients(
    {
      memberId: currentUser?.id,
      isMine: true,
      sortBy: 'expirationDate',
    },
    { enabled: !!currentUser?.id },
  );

  // 내가 참여 중인 공동구매 조회
  const { data: myGroupBuyingData, isLoading: isLoadingMyGroupBuying } =
    useInfiniteMyParticipatingGroupBuyings(
      {
        memberId: currentUser?.id,
        pageSize: 2,
      },
      { enabled: !!currentUser?.id },
    );

  // 최근 참여한 공동구매 (최대 2개)
  const recentGroupBuyings =
    myGroupBuyingData?.pages[0]?.content?.slice(0, 2).map((item) => ({
      id: item.groupBuyingId,
      title: item.title,
      category: item.category,
      currentPeople: item.currentPeople,
      maxPeople: item.maxPeople,
      totalPrice: item.totalPrice,
      status: item.status,
      deadline: item.deadline,
      pickupLocation: item.pickupLocation,
    })) || [];

  // AI 일일 추천 메시지 조회
  const { data: aiRecommendation, isLoading: isLoadingRecommendation } = useDailyRecommendation();

  // 유통기한 임박 식재료 (3일 이내)
  const expiringIngredients =
    ingredientsData?.content
      ?.filter((item) => {
        if (!item.due) return false;
        const daysLeft = Math.ceil((new Date(item.due) - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft >= 0 && daysLeft <= 3;
      })
      .slice(0, 5) || [];

  // 아이콘 매핑
  const iconMap = {
    ChefHat: <ChefHat size={40} />,
    ShoppingBag: <ShoppingBag size={40} />,
    Refrigerator: <Refrigerator size={40} />,
    ShoppingCart: <ShoppingCart size={20} />,
    Sparkles: <Sparkles size={20} />,
  };

  // Hero 슬라이드 데이터 (경로를 onClick 함수로 변환 + 아이콘 매핑)
  const slides = HERO_SLIDES.map((slide) => ({
    ...slide,
    icon: iconMap[slide.iconName],
    primaryAction: slide.primaryAction
      ? {
          ...slide.primaryAction,
          onClick: (nav) => nav(slide.primaryAction.path),
        }
      : null,
    secondaryAction: slide.secondaryAction
      ? {
          ...slide.secondaryAction,
          onClick: (nav) => nav(slide.secondaryAction.path),
        }
      : null,
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-4 pb-20 md:px-6">
      {/* =======================
          Hero 배너 (캐러셀)
         ======================= */}
      <HeroCarousel slides={slides} />

      {/* =======================
          빠른 액션 카드들
         ======================= */}
      <section className="mb-2 grid grid-cols-1 gap-3 md:grid-cols-3">
        {QUICK_ACTIONS.map((action) => (
          <QuickActionCard
            key={action.path}
            icon={iconMap[action.iconName]}
            title={action.title}
            description={action.description}
            onClick={() => navigate(action.path)}
            colorClass={action.colorClass}
          />
        ))}
      </section>

      {/* =======================
          오늘의 추천 메시지
         ======================= */}
      {isLoadingRecommendation ? (
        <RecommendationSkeleton />
      ) : (
        <RecommendationCard
          message={aiRecommendation?.message || '오늘은 어떤 요리를 만들어 볼까요?'}
          emoji={!aiRecommendation?.message && '✨'}
        />
      )}

      {/* =======================
          유통기한 임박 재료
         ======================= */}
      <Section
        title="곧 버려야 할 재료"
        subtitle="유통기한이 얼마 안 남은 재료부터 먼저 사용해요."
        rightContent={
          !isLoadingIngredients &&
          expiringIngredients.length > 0 && (
            <button
              type="button"
              onClick={() => navigate('/recipes')}
              className="inline-flex items-center rounded-full bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-100"
            >
              사용하러가기
            </button>
          )
        }
      >
        {isLoadingIngredients ? (
          <IngredientsSkeleton />
        ) : expiringIngredients.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-6 text-center text-xs text-slate-500 shadow-sm">
            유통기한이 임박한 재료가 없어요!{' '}
            <button
              type="button"
              onClick={() => navigate('/ingredients')}
              className="font-semibold text-violet-600 underline-offset-2 hover:underline"
            >
              식재료를 등록해볼까요?
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {expiringIngredients.map((item) => {
                const daysLeft = Math.ceil(
                  (new Date(item.due) - new Date()) / (1000 * 60 * 60 * 24),
                );
                return (
                  <span
                    key={item.id}
                    className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                  >
                    {item.ingredientName} D-{daysLeft}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </Section>

      {/* =======================
          참여 중인 공동구매
         ======================= */}
      <Section
        title="참여 중인 공동구매"
        subtitle="내가 참여한 공동구매를 확인해보세요."
        rightContent={
          !isLoadingMyGroupBuying &&
          recentGroupBuyings.length > 0 && (
            <button
              type="button"
              onClick={() => navigate('/group-buying')}
              className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
            >
              전체 보기
            </button>
          )
        }
      >
        {isLoadingMyGroupBuying ? (
          <GroupBuyingSkeleton />
        ) : recentGroupBuyings.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-6 text-center text-xs text-slate-500 shadow-sm">
            참여 중인 공동구매가 없어요.{' '}
            <button
              type="button"
              onClick={() => navigate('/group-buying')}
              className="font-semibold text-emerald-600 underline-offset-2 hover:underline"
            >
              공동구매를 둘러볼까요?
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {recentGroupBuyings.map((deal) => (
              <GroupBuyingHighlightCard
                key={deal.id}
                title={deal.title}
                category={deal.category}
                currentPeople={deal.currentPeople}
                maxPeople={deal.maxPeople}
                totalPrice={deal.totalPrice}
                status={deal.status}
                deadline={deal.deadline}
                pickupLocation={deal.pickupLocation}
                onClick={() => navigate(`/group-buying/detail/${deal.id}`)}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
