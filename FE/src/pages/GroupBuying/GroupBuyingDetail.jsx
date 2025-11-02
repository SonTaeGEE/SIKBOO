import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Package, MessageCircle, Users, Clock } from 'lucide-react';
import { ingredients } from '../../data/ingredients';

const GroupBuyingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = ingredients.find((r) => r.id === parseInt(id));
  const [isJoined, setIsJoined] = useState(false); // 참여 상태 관리

  const handleJoin = () => {
    // 실제로는 서버 API 호출해야 함
    setIsJoined(true);
    alert('공동구매에 참여했습니다! 이제 채팅방에서 대화할 수 있습니다.');
  };

  if (!item) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl p-4">
        <div className="py-20 text-center">
          <p className="text-gray-500">공동구매를 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-500 hover:text-blue-600">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl p-4">
      <div className="space-y-4">
        {/* Product Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                {item.status === 'recruiting' ? (
                  <span className="rounded-lg bg-purple-100 px-3 py-1 text-sm font-medium text-[#5f0080]">
                    모집중
                  </span>
                ) : (
                  <span className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                    마감
                  </span>
                )}
              </div>
              <div className="mb-3 text-sm text-gray-500">주최자: {item.host}</div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={16} className="text-[#5f0080]" />
                <span>
                  {item.location} · {item.distance}km
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                <Users size={14} />
                참여 인원
              </div>
              <div className="text-lg font-bold text-gray-800">
                {item.currentPeople}/{item.maxPeople}명
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                <Clock size={14} />
                마감까지
              </div>
              <div className="text-lg font-bold text-orange-600">{item.deadline}</div>
            </div>
          </div>

          <div className="mb-4 rounded-lg bg-purple-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">총 금액</span>
              <span className="text-sm text-gray-500 line-through">
                ₩{item.price.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">1인당 금액</span>
              <span className="text-2xl font-bold text-[#5f0080]">
                ₩{item.pricePerPerson.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              {item.quantity && `총 수량: ${item.quantity}`}
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-200 pt-4">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="mt-0.5 text-gray-400" />
              <div>
                <div className="mb-1 text-sm font-medium text-gray-700">수령 장소</div>
                <div className="text-sm text-gray-600">{item.pickupPlace}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-bold text-gray-800">참여자 ({item.currentPeople}명)</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-purple-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5f0080] font-bold text-white">
                주
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{item.host}</div>
                <div className="text-xs text-[#5f0080]">주최자</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400 font-bold text-white">
                이
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">이OO</div>
                <div className="text-xs text-gray-500">참여자</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400 font-bold text-white">
                박
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">박OO</div>
                <div className="text-xs text-gray-500">참여자</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isJoined ? (
            // 참여 후: 채팅하기 버튼만 표시
            <button
              onClick={() => navigate(`/group-buying/detail/${id}/chat`)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5f0080] py-4 text-lg font-bold text-white transition hover:bg-[#4a0066]"
            >
              <MessageCircle size={20} />
              채팅하기
            </button>
          ) : (
            // 참여 전: 참여하기 버튼만 표시
            item.status === 'recruiting' && (
              <button
                onClick={handleJoin}
                className="flex-1 rounded-xl bg-[#5f0080] py-4 text-lg font-bold text-white transition hover:bg-[#4a0066]"
              >
                참여하기
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupBuyingDetail;
