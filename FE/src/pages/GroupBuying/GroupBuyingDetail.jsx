import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, MessageCircle, Users, Clock } from 'lucide-react';
import { getTimeRemaining } from '@/lib/dateUtils';
import {
  useGroupBuying,
  useParticipantsByGroupBuying,
  useCheckParticipation,
  useJoinGroupBuying,
  useLeaveGroupBuying,
} from '@/hooks/useGroupBuying';
import { useCurrentUser } from '@/hooks/useUser';

const GroupBuyingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 사용자 정보
  const { data: currentUser } = useCurrentUser();

  // 공동구매 상세 정보
  const { data: groupBuying, isLoading: isLoadingGroupBuying } = useGroupBuying(id);

  // 참여자 목록
  const { data: participants = [], isLoading: isLoadingParticipants } =
    useParticipantsByGroupBuying(id);

  // 참여 여부 확인
  const { data: isParticipating = false } = useCheckParticipation(id, currentUser?.id);

  // 참여/나가기 Mutation
  const joinMutation = useJoinGroupBuying();
  const leaveMutation = useLeaveGroupBuying();

  const handleJoin = () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    joinMutation.mutate(
      { id, memberId: currentUser.id },
      {
        onSuccess: () => {
          alert('공동구매에 참여했습니다!');
        },
        onError: (error) => {
          alert(error.response?.data?.message || '참여에 실패했습니다.');
        },
      },
    );
  };

  const handleLeave = () => {
    if (!currentUser) return;

    if (confirm('공동구매에서 나가시겠습니까?')) {
      leaveMutation.mutate(
        { id, memberId: currentUser.id },
        {
          onSuccess: () => {
            alert('공동구매에서 나갔습니다.');
          },
          onError: (error) => {
            alert(error.response?.data?.message || '나가기에 실패했습니다.');
          },
        },
      );
    }
  };

  if (isLoadingGroupBuying || isLoadingParticipants) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl p-4">
        <div className="py-20 text-center">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!groupBuying) {
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

  const isHost = currentUser && groupBuying.memberId === currentUser.id;
  const pricePerPerson = Math.floor(groupBuying.totalPrice / groupBuying.maxPeople);

  return (
    <div className="mx-auto min-h-screen max-w-2xl p-4">
      <div className="space-y-4">
        {/* 기본 정보 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="text-xl font-bold text-gray-800">{groupBuying.title}</h3>
              {groupBuying.status === '모집중' ? (
                <span className="rounded-lg bg-purple-100 px-3 py-1 text-sm font-medium text-[#5f0080]">
                  모집중
                </span>
              ) : (
                <span className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                  마감
                </span>
              )}
            </div>
            <div className="mb-3 text-sm text-gray-500">주최자: {groupBuying.memberName}</div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-[#5f0080]" />
              <span>{groupBuying.pickupLocation}</span>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                <Users size={14} />
                참여 인원
              </div>
              <div className="text-lg font-bold text-gray-800">
                {groupBuying.currentPeople}/{groupBuying.maxPeople}명
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                <Clock size={14} />
                마감까지
              </div>
              <div className="text-lg font-bold text-orange-600">
                {getTimeRemaining(groupBuying.deadline)}
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-lg bg-purple-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">총 금액</span>
              <span className="text-sm text-gray-500 line-through">
                ₩{groupBuying.totalPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">1인당 예상 금액</span>
              <span className="text-2xl font-bold text-[#5f0080]">
                ₩{pricePerPerson.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 수령 장소 상세 정보 */}
        {groupBuying.info && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-3 font-bold text-gray-800">상세 정보</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{groupBuying.info}</span>
            </div>
          </div>
        )}

        {/* 참여자 목록 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-bold text-gray-800">참여자 ({participants.length}명)</h3>
          <div className="space-y-3">
            {participants.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">아직 참여자가 없습니다.</div>
            ) : (
              participants.map((participant) => (
                <div
                  key={participant.participantId}
                  className={`flex items-center gap-3 rounded-lg p-3 ${
                    participant.memberId === groupBuying.memberId ? 'bg-purple-50' : 'bg-gray-50'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-white ${
                      participant.memberId === groupBuying.memberId ? 'bg-[#5f0080]' : 'bg-gray-400'
                    }`}
                  >
                    {participant.memberName.substring(0, 1)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{participant.memberName}</div>
                    <div
                      className={`text-xs ${
                        participant.memberId === groupBuying.memberId
                          ? 'text-[#5f0080]'
                          : 'text-gray-500'
                      }`}
                    >
                      {participant.memberId === groupBuying.memberId ? '주최자' : '참여자'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(participant.joinedAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          {isParticipating ? (
            <>
              <button
                onClick={() => navigate(`/group-buying/${id}/chat`)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5f0080] py-4 text-lg font-bold text-white transition hover:bg-[#4a0066]"
              >
                <MessageCircle size={20} />
                채팅하기
              </button>
              {!isHost && (
                <button
                  onClick={handleLeave}
                  disabled={leaveMutation.isPending}
                  className="rounded-xl border-2 border-gray-300 px-6 py-4 text-lg font-bold text-gray-600 transition hover:border-red-500 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {leaveMutation.isPending ? '나가는 중...' : '나가기'}
                </button>
              )}
            </>
          ) : (
            groupBuying.status === '모집중' && (
              <button
                onClick={handleJoin}
                disabled={joinMutation.isPending}
                className="flex-1 rounded-xl bg-[#5f0080] py-4 text-lg font-bold text-white transition hover:bg-[#4a0066] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {joinMutation.isPending ? '참여 중...' : '참여하기'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupBuyingDetail;
