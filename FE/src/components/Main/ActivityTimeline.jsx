import { Clock } from 'lucide-react';

export function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="rounded-2xl bg-white px-4 py-6 text-center text-xs text-slate-500 shadow-sm">
        아직 활동 내역이 없어요.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
              {activity.icon}
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm text-slate-700">{activity.message}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <Clock size={10} />
                {activity.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
