import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout';
import Ingredients from '@/pages/Ingredient/Ingredients';
import Recipes from '@/pages/Recipe/Recipes';
import GroupBuying from '@/pages/GroupBuying/GroupBuying';
import GroupBuyingDetail from '@/pages/GroupBuying/GroupBuyingDetail';
import GroupBuyingChat from '@/pages/GroupBuying/GroupBuyingChat';
import CreateGroupBuying from '@/pages/GroupBuying/CreateGroupBuying';
import MyPage from '@/pages/MyPage/MyPage';

const AppRoutes = () => {
  const location = useLocation();

  // 페이지별 헤더 설정
  const getHeaderConfig = () => {
    if (location.pathname === '/group-buying/create') {
      return { title: '식재료 공동구매 만들기', showBack: true, hideNav: false };
    }
    if (
      location.pathname.startsWith('/group-buying/detail/') &&
      location.pathname.endsWith('/chat')
    ) {
      return { title: '채팅', showBack: true, hideNav: true };
    }
    if (location.pathname.startsWith('/group-buying/detail/')) {
      return { title: '공동구매 상세', showBack: true, hideNav: false };
    }
    if (location.pathname.startsWith('/group-buying')) {
      return { title: '공동구매', showBack: false, hideNav: false };
    }
    if (location.pathname.startsWith('/ingredients')) {
      return { title: '내재료', showBack: false, hideNav: false };
    }
    if (location.pathname.startsWith('/recipes')) {
      return { title: '레시피', showBack: false, hideNav: false };
    }
    if (location.pathname.startsWith('/mypage')) {
      return { title: '마이페이지', showBack: false, hideNav: false };
    }
    return { title: '식재료부', showBack: false, hideNav: false };
  };

  const headerConfig = getHeaderConfig();

  return (
    <MainLayout
      headerTitle={headerConfig.title}
      showBackButton={headerConfig.showBack}
      hideNavbar={headerConfig.hideNav}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/group-buying" replace />} />
        <Route path="/ingredients" element={<Ingredients />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/group-buying" element={<GroupBuying />} />
        <Route path="/group-buying/detail/:id" element={<GroupBuyingDetail />} />
        <Route path="/group-buying/detail/:id/chat" element={<GroupBuyingChat />} />
        <Route path="/group-buying/create" element={<CreateGroupBuying />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </MainLayout>
  );
};

export default AppRoutes;
