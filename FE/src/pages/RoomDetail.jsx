import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Package, MessageCircle } from "lucide-react";
import { rooms } from "../data/rooms";

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const room = rooms.find((r) => r.id === parseInt(id));

  if (!room) {
    return (
      <div className="max-w-2xl mx-auto min-h-screen p-4">
        <div className="text-center py-20">
          <p className="text-gray-500">방을 찾을 수 없습니다.</p>
          <button onClick={() => navigate("/")} className="mt-4 text-blue-500 hover:text-blue-600">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/")} className="text-gray-600 hover:text-gray-800">
            ← 뒤로
          </button>
          <h2 className="text-lg font-bold text-gray-800">공동구매 상세</h2>
        </div>

        {/* Product Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex gap-4 mb-4">
            <div className="text-6xl">{room.image}</div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-800">{room.title}</h3>
                {room.status === "recruiting" ? (
                  <span className="bg-purple-100 text-[#5f0080] px-3 py-1 rounded-lg text-sm font-medium">
                    모집중
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-medium">
                    마감
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 mb-3">방장: {room.host}</div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={16} className="text-blue-500" />
                <span>
                  {room.location} · {room.distance}km
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">참여 인원</div>
              <div className="text-lg font-bold text-gray-800">
                {room.currentPeople}/{room.maxPeople}명
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">마감까지</div>
              <div className="text-lg font-bold text-orange-600">{room.deadline}</div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">총 금액</span>
              <span className="text-sm text-gray-500 line-through">
                ₩{room.price.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">1인당 금액</span>
              <span className="text-2xl font-bold text-blue-600">
                ₩{room.pricePerPerson.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex items-start gap-3">
              <Package size={20} className="text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">수령 일시</div>
                <div className="text-sm text-gray-600">{room.pickupDate}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">수령 장소</div>
                <div className="text-sm text-gray-600">{room.pickupPlace}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 mb-4">참여자 ({room.currentPeople}명)</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                방
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{room.host}</div>
                <div className="text-xs text-blue-600">방장</div>
              </div>
              <span className="text-xs text-gray-500">10:20 참여</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                이
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">이OO</div>
                <div className="text-xs text-gray-500">참여자</div>
              </div>
              <span className="text-xs text-gray-500">10:25 참여</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                박
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">박OO</div>
                <div className="text-xs text-gray-500">참여자</div>
              </div>
              <span className="text-xs text-gray-500">10:27 참여</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/rooms/${id}/chat`)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} />
            채팅하기
          </button>
          {room.status === "recruiting" && (
            <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-lg transition">
              참여하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
