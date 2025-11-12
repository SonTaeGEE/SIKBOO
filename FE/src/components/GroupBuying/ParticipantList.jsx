const ParticipantList = ({ participants, hostId }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 font-bold text-gray-800">참여자 ({participants.length}명)</h3>
      <div className="space-y-3">
        {participants.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">아직 참여자가 없습니다.</div>
        ) : (
          participants.map((participant) => {
            const isHost = participant.memberId === hostId;
            return (
              <div
                key={participant.participantId}
                className={`flex items-center gap-3 rounded-lg p-3 ${
                  isHost ? 'bg-purple-50' : 'bg-gray-50'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-white ${
                    isHost ? 'bg-[#5f0080]' : 'bg-gray-400'
                  }`}
                >
                  {participant.memberName.substring(0, 1)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{participant.memberName}</div>
                  <div className={`text-xs ${isHost ? 'text-[#5f0080]' : 'text-gray-500'}`}>
                    {isHost ? '주최자' : '참여자'}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(participant.joinedAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ParticipantList;
