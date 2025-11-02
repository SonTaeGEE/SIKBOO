import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { ingredients, chatMessages as initialMessages } from '../../data/ingredients';

const GroupBuyingChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chatMessage, setChatMessage] = useState('');
  const item = ingredients.find((r) => r.id === parseInt(id));

  if (!item) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl p-4">
        <div className="py-20 text-center">
          <p className="text-gray-500">공동구매를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/group-buying')}
            className="mt-4 text-[#5f0080] hover:text-[#4a0066]"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col bg-gray-50">
      {/* Chat Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-24">
        {initialMessages.map((msg) => (
          <div key={msg.id} className="flex justify-start">
            <div
              className={`max-w-[75%] ${
                msg.isHost ? 'bg-[#5f0080] text-white' : 'border border-gray-200 bg-white'
              } rounded-lg p-3 shadow-sm`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${
                    msg.isHost ? 'text-purple-100' : 'text-gray-600'
                  }`}
                >
                  {msg.user}
                </span>
                <span className={`text-xs ${msg.isHost ? 'text-purple-200' : 'text-gray-400'}`}>
                  {msg.time}
                </span>
              </div>
              <div className={`text-sm ${msg.isHost ? 'text-white' : 'text-gray-800'}`}>
                {msg.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input - Fixed at bottom */}
      <div className="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white p-4">
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
          />
          <button className="rounded-lg bg-[#5f0080] px-5 py-3 text-white transition hover:bg-[#4a0066]">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupBuyingChat;
