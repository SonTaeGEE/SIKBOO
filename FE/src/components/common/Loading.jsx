const Loading = ({ message = '로딩 중...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* 외부 원 */}
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-[#5f0080]`}
        />
        {/* 내부 원 (반대 방향 회전) */}
        <div
          className={`${sizeClasses[size]} animate-spin-reverse absolute top-0 left-0 rounded-full border-4 border-transparent border-b-purple-300`}
          style={{ animationDuration: '1s' }}
        />
      </div>
      <p className="text-sm font-medium text-gray-600">{message}</p>
    </div>
  );
};

export default Loading;
