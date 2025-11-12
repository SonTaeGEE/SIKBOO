import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle, ArrowLeft } from 'lucide-react';

const EmptyState = ({
  icon = null,
  title = '데이터를 찾을 수 없습니다',
  message = '요청하신 정보를 찾을 수 없습니다.',
  showHomeButton = true,
  showBackButton = false,
  homeButtonText = '홈으로 돌아가기',
  backButtonText = '이전으로',
  onBack,
}) => {
  const navigate = useNavigate();
  const IconComponent = icon || AlertCircle;

  const handleHome = () => {
    navigate('/');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-12">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-50">
        <IconComponent size={40} className="text-[#5f0080]" />
      </div>

      <h3 className="mb-2 text-xl font-bold text-gray-800">{title}</h3>
      <p className="mb-8 text-center text-sm text-gray-500">{message}</p>

      <div className="flex gap-3">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-lg border-2 border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition hover:border-[#5f0080] hover:text-[#5f0080]"
          >
            <ArrowLeft size={18} />
            {backButtonText}
          </button>
        )}
        {showHomeButton && (
          <button
            onClick={handleHome}
            className="flex items-center gap-2 rounded-lg bg-[#5f0080] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#4a0066]"
          >
            <Home size={18} />
            {homeButtonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
