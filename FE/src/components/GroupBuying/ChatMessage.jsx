import { timeFormatter } from '@/utils/timeFormatter';

const ChatMessage = ({ message, currentUserId, hostId }) => {
  const isMyMessage = currentUserId && message.memberId === currentUserId;
  const isHost = hostId === message.memberId;

  // 메시지 배경색 결정
  let bgColor = 'bg-white'; // 기본 참여자
  let textColor = 'text-gray-800';
  let borderColor = 'border border-gray-200';

  if (isMyMessage) {
    // 내 메시지 - 밝은 보라색
    bgColor = 'bg-[#E9D5FF]';
    textColor = 'text-gray-900';
    borderColor = '';
  } else if (isHost) {
    // 주최자 메시지
    bgColor = 'bg-[#5f0080]';
    textColor = 'text-white';
    borderColor = '';
  }

  return (
    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${bgColor} ${borderColor} rounded-lg p-3 shadow-sm`}>
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`text-xs font-medium ${
              isMyMessage ? 'text-purple-900' : isHost ? 'text-purple-100' : 'text-gray-600'
            }`}
          >
            {message.memberName}
            {isHost && ' (주최자)'}
          </span>
          <span
            className={`text-xs ${isMyMessage ? 'text-purple-700' : isHost ? 'text-purple-200' : 'text-gray-400'}`}
          >
            {timeFormatter(message.createdAt)}
          </span>
        </div>
        <div className={`text-sm ${textColor}`}>{message.message}</div>
      </div>
    </div>
  );
};

export default ChatMessage;
