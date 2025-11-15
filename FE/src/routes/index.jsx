// src/routes/index.jsx
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout';
import Ingredients from '@/pages/Ingredient/Ingredients';
import Recipes from '@/pages/Recipe/Recipes';
import RecipeSessionDetail from '@/pages/Recipe/RecipeSessionDetail';
import GroupBuying from '@/pages/GroupBuying/GroupBuying';
import GroupBuyingDetail from '@/pages/GroupBuying/GroupBuyingDetail';
import GroupBuyingChat from '@/pages/GroupBuying/GroupBuyingChat';
import CreateGroupBuying from '@/pages/GroupBuying/CreateGroupBuying';
import EditGroupBuying from '@/pages/GroupBuying/EditGroupBuying';
import MyPage from '@/pages/MyPage/MyPage';
import Login from '@/pages/Auth/Login';
import Signup from '@/pages/Auth/Signup';
import OAuth2Success from '@/pages/Auth/OAuth2Success';
import Onboarding from '@/pages/Auth/Onboarding';
import MainPage from '@/pages/MainPage/MainPage'; // ✅ 메인페이지 추가

const AppRoutes = () => {
  const location = useLocation();

  // 인증 페이지 여부 확인
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/oauth2/success' ||
    location.pathname === '/onboarding';

  // 페이지별 헤더 설정
  const getHeaderConfig = () => {
    if (location.pathname === '/group-buying/create') {
      return { title: '식재료 공동구매 만들기', showBack: true, hideNav: false };
    }
    if (location.pathname.startsWith('/group-buying/edit/')) {
      return { title: '공동구매 수정', showBack: true, hideNav: false };
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
    if (location.pathname.startsWith('/main')) {
      // ✅ 메인 페이지 헤더 (로고 클릭 시도 /main 으로 가니까 맞춰줌)
      return { title: '식재료를 부탁해', showBack: false, hideNav: false };
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
        <Route path="/oauth2/success" element={<OAuth2Success />} />
        <Route path="/onboarding" element={<Onboarding />} />
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
        {/* 기본 루트는 그대로 로그인으로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ✅ 메인 페이지 라우트 */}
        <Route path="/main" element={<MainPage />} />

        <Route path="/ingredients" element={<Ingredients />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/recipes/sessions/:id" element={<RecipeSessionDetail />} />
        <Route path="/group-buying" element={<GroupBuying />} />
        <Route path="/group-buying/detail/:id" element={<GroupBuyingDetail />} />
        <Route path="/group-buying/:id/chat" element={<GroupBuyingChat />} />
        <Route path="/group-buying/create" element={<CreateGroupBuying />} />
        <Route path="/group-buying/edit/:id" element={<EditGroupBuying />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </MainLayout>
  );
};

export default AppRoutes;
