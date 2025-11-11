import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout';
import Ingredients from '@/pages/Ingredient/Ingredients';
import Recipes from '@/pages/Recipe/Recipes';
import RecipeSessionDetail from '@/pages/Recipe/RecipeSessionDetail';
import GroupBuying from '@/pages/GroupBuying/GroupBuying';
import GroupBuyingDetail from '@/pages/GroupBuying/GroupBuyingDetail';
import GroupBuyingChat from '@/pages/GroupBuying/GroupBuyingChat';
import CreateGroupBuying from '@/pages/GroupBuying/CreateGroupBuying';
import MyPage from '@/pages/MyPage/MyPage';
import Login from '@/pages/Auth/Login';
import Signup from '@/pages/Auth/Signup';
import OAuth2Success from '@/pages/Auth/OAuth2Success';

const AppRoutes = () => {
  const location = useLocation();

  // 인증 페이지 여부 확인
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/oauth2/success';

  // 페이지별 헤더 설정
  const getHeaderConfig = () => {
    if (location.pathname === '/group-buying/create') {
      return { title: '식재료 공동구매 만들기', showBack: true, hideNav: false };
    }
    if (location.pathname.startsWith('/group-buying/') && location.pathname.endsWith('/chat')) {
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
    if (location.pathname.startsWith('/recipes/sessions/')) {
      return { title: '레시피 상세', showBack: true, hideNav: false };
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

  // 인증 페이지는 레이아웃 없이 렌더링
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/oauth2/success" element={<OAuth2Success />} /> {/* ✅ 추가 */}
      </Routes>
    );
  }

  return (
    <MainLayout
      headerTitle={headerConfig.title}
      showBackButton={headerConfig.showBack}
      hideNavbar={headerConfig.hideNav}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/ingredients" element={<Ingredients />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/recipes/sessions/:id" element={<RecipeSessionDetail />} />
        <Route path="/group-buying" element={<GroupBuying />} />
        <Route path="/group-buying/detail/:id" element={<GroupBuyingDetail />} />
        <Route path="/group-buying/:id/chat" element={<GroupBuyingChat />} />
        <Route path="/group-buying/create" element={<CreateGroupBuying />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </MainLayout>
  );
};

export default AppRoutes;
