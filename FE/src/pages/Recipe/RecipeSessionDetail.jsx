import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import SectionTitle from '@/components/Recipe/SectionTitle';
import Skeleton from '@/components/Recipe/Skeleton';
import Empty from '@/components/Recipe/Empty';
import ErrorBox from '@/components/Recipe/ErrorBox';
import RecipeCard from '@/components/Recipe/RecipeCard';
import recipeApi from '@/api/recipeApi';

const qKeys = {
  sessionDetail: (id) => ['recipes', 'session', id],
};

export default function RecipeSessionDetail() {
  const { id } = useParams();

  const detail = useQuery({
    queryKey: qKeys.sessionDetail(id),
    queryFn: () => recipeApi.getSessionDetail(id),
  });

  if (detail.isLoading) return <Skeleton />;
  if (detail.isError) return <ErrorBox error={detail.error} />;

  const { title, have = [], need = [], notice = '' } = detail.data || {};

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-full bg-[#F8F3FF] px-4 pt-3 pb-[88px] md:max-w-screen-md md:px-6 lg:max-w-4xl lg:px-8">
      {/* 상단: 방 제목만 표시 (편집/삭제 없음) */}
      <h1 className="mb-3 text-lg font-bold break-words">{title}</h1>

      {/* 건강/알레르기 안내문 */}
      {notice && (
        <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          {notice}
        </div>
      )}

      {/* 있는 식재료로 만든 레시피 */}
      <SectionTitle>있는 식재료로 만든 레시피</SectionTitle>
      {have.length === 0 ? (
        <Empty text="조건에 맞는 레시피가 없어요." />
      ) : (
        <div className="space-y-3">
          {have.map((r) => (
            <RecipeCard key={r.id} r={r} />
          ))}
        </div>
      )}

      {/* 식재료가 필요한 레시피 */}
      <SectionTitle>식재료가 필요한 레시피</SectionTitle>
      {need.length === 0 ? (
        <Empty text="추가 식재료가 필요한 레시피가 없어요." />
      ) : (
        <div className="mb-10 space-y-3">
          {need.map((r) => (
            <RecipeCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
