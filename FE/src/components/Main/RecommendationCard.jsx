import { Sparkles } from 'lucide-react';

export function RecommendationCard({ message, emoji }) {
  return (
    <div className="mb-6 rounded-2xl bg-linear-to-r from-violet-50 to-purple-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          <Sparkles size={20} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-violet-900">오늘의 추천</p>
          <p className="mt-1 text-sm text-slate-700">
            {message} {emoji}
          </p>
        </div>
      </div>
    </div>
  );
}
