import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="mb-2 text-9xl font-bold text-[#5f0080]">404</h1>
          <h2 className="mb-4 text-2xl font-bold text-gray-800">페이지를 찾을 수 없습니다</h2>
          <p className="text-gray-600">요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 py-3 text-gray-700 transition hover:border-[#5f0080] hover:bg-purple-50 hover:text-[#5f0080]"
          >
            <ArrowLeft size={20} />
            이전 페이지로
          </button>
          <button
            onClick={() => navigate('/group-buying')}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#5f0080] py-3 text-white transition hover:bg-[#4a0066]"
          >
            <Home size={20} />
            홈으로 가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
