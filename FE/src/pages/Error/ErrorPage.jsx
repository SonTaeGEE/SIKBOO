import { useNavigate } from 'react-router-dom';
import { RefreshCw, Home } from 'lucide-react';

const ErrorPage = ({ error, resetError }) => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    if (resetError) {
      resetError();
    }
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
            <span className="text-5xl">⚠️</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-800">문제가 발생했습니다</h1>
          <p className="mb-4 text-gray-600">
            일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
          {error && (
            <div className="mx-auto mb-4 max-w-sm rounded-lg bg-red-50 p-4 text-left">
              <p className="text-sm text-red-800">
                <span className="font-semibold">오류 메시지:</span>
                <br />
                {error.message || '알 수 없는 오류'}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#5f0080] py-3 text-white transition hover:bg-[#4a0066]"
          >
            <RefreshCw size={20} />
            새로고침
          </button>
          <button
            onClick={() => navigate('/group-buying')}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 py-3 text-gray-700 transition hover:border-[#5f0080] hover:bg-purple-50 hover:text-[#5f0080]"
          >
            <Home size={20} />
            홈으로 가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
