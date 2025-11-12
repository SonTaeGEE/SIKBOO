import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Clock, ShoppingBag } from 'lucide-react';

import { getTimeRemaining } from '@/lib/dateUtils';

const GroupBuyingCard = ({ item, showDistance = false }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/group-buying/detail/${item.groupBuyingId}`)}
      className="cursor-pointer overflow-hidden rounded-lg border border-[#e0e0e0] bg-white transition hover:shadow-lg"
    >
      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <h4 className="line-clamp-1 flex-1 text-lg font-medium text-[#333333]">{item.title}</h4>
          {item.status === '모집중' ? (
            <div className="ml-2 rounded-full bg-[#5f0080] px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white">
              모집중
            </div>
          ) : (
            <div className="ml-2 rounded-full bg-[#999999] px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white">
              마감
            </div>
          )}
        </div>

        <div className="mb-2 flex items-center gap-2 text-xs text-[#999999]">
          <MapPin size={11} />
          <span>{item.pickupLocation}</span>
          {showDistance && (
            <>
              <span>·</span>
              <span>
                {item.distance !== null ? `${item.distance.toFixed(1)}km` : '거리 계산중'}
              </span>
            </>
          )}
        </div>

        <div className="mb-2 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-[#666666]">
            <Users size={13} className="text-[#5f0080]" />
            <span>
              {item.currentPeople}/{item.maxPeople}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[#666666]">
            <Clock size={13} className="text-[#ff6b6b]" />
            {getTimeRemaining(item.deadline) === '마감' ? (
              <span>마감까지</span>
            ) : (
              <span>마감까지 {getTimeRemaining(item.deadline)}</span>
            )}
          </div>
        </div>

        <div className="border-t border-[#f4f4f4] pt-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">1인당 예상 가격</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {(item.totalPrice / item.maxPeople).toLocaleString()}원
                </span>
                <span className="text-sm text-gray-400 line-through">
                  {item.totalPrice.toLocaleString()}원
                </span>
              </div>
            </div>
            <ShoppingBag size={18} className="text-[#5f0080]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupBuyingCard;
