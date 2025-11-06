import { useNavigate, useLocation } from 'react-router-dom';
import { House, BookOpen, ShoppingCart, User, ChevronLeft } from 'lucide-react';

const MainLayout = ({ children, headerTitle, showBackButton = false, hideNavbar = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'ingredients', icon: House, label: '내재료', path: '/ingredients' },
    { id: 'recipes', icon: BookOpen, label: '레시피', path: '/recipes' },
    { id: 'group-buying', icon: ShoppingCart, label: '공동구매', path: '/group-buying' },
    { id: 'mypage', icon: User, label: '마이페이지', path: '/mypage' },
  ];

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen flex-col bg-[#F9F5FF]">
      {/* Top Header */}
      <header className="fixed top-0 right-0 left-0 z-40 border-b border-[#e0e0e0] bg-white">
        <div className="flex h-14 items-center justify-between px-4">
          {showBackButton ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-lg font-bold text-gray-800">{headerTitle}</h2>
            </div>
          ) : (
            <h1
              onClick={() => navigate('/')}
              className="cursor-pointer text-xl font-bold text-[#5f0080]"
            >
              {headerTitle || '식재료부'}
            </h1>
          )}
          {/* 추가 헤더 아이템 (알림, 설정 등) */}
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto pt-14 ${hideNavbar ? 'pb-0' : 'pb-16'}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideNavbar && (
        <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-[#e0e0e0] bg-white">
          <div className="flex h-16 items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="flex h-full flex-1 flex-col items-center justify-center transition-colors"
                >
                  <Icon
                    size={24}
                    className={active ? 'text-[#5f0080]' : 'text-[#999999]'}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span
                    className={`mt-1 text-xs ${
                      active ? 'font-semibold text-[#5f0080]' : 'text-[#999999]'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default MainLayout;
