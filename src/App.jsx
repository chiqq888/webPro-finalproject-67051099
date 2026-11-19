import { useEffect, useState } from 'react';
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import PageState from './components/PageState.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import EditProductPage from './pages/EditProductPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MarketPage from './pages/MarketPage.jsx';
import MyListingsPage from './pages/MyListingsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProductDetailsPage from './pages/ProductDetailsPage.jsx';
import SellProductPage from './pages/SellProductPage.jsx';
import { getSession, logout, SESSION_EXPIRED } from './services/api.js';

function ProtectedRoute({ user, checking, error, onRetry, adminOnly }) {
  const { pathname, search, hash } = useLocation();

  if (checking) {
    return <PageState type="loading" message="กำลังตรวจสอบบัญชี…" />;
  }
  if (error) {
    return <PageState type="error" message={error} onRetry={onRetry} />;
  }
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: pathname + search + hash }}
      />
    );
  }
  if (adminOnly && user.role !== 'admin') {
    return (
      <div className="space-y-4">
        <PageState type="error" message="หน้านี้สำหรับผู้ดูแลตลาด" />
        <Link to="/users" className="btn-secondary">
          กลับตลาดสินค้า
        </Link>
      </div>
    );
  }
  return <Outlet />;
}

export default function App() {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      try {
        const account = await getSession(controller.signal);
        if (!controller.signal.aborted) setUser(account);
      } catch (error) {
        if (!controller.signal.aborted && error.status !== 401) {
          setSessionError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) setChecking(false);
      }
    }

    loadSession();
    return () => controller.abort();
  }, [sessionAttempt]);

  useEffect(() => {
    function clearSession() {
      setUser(null);
    }
    window.addEventListener(SESSION_EXPIRED, clearSession);
    return () => window.removeEventListener(SESSION_EXPIRED, clearSession);
  }, []);

  function handleSessionRetry() {
    setSessionError('');
    setChecking(true);
    setSessionAttempt((count) => count + 1);
  }

  function handleLogin(account) {
    setSessionError('');
    setUser(account);
  }

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    setLogoutError('');
    try {
      await logout();
      window.location.replace('/users');
    } catch (error) {
      setLogoutError(`ออกจากระบบไม่สำเร็จ ${error.message}`);
      setSigningOut(false);
    }
  }

  const routeAuth = {
    user,
    checking,
    error: sessionError,
    onRetry: handleSessionRetry,
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-20 focus:rounded-lg focus:bg-white focus:p-3"
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>
      <Navbar user={user} signingOut={signingOut} onLogout={handleLogout} />
      <main
        id="main"
        className="mx-auto w-full max-w-[84rem] flex-1 px-4 pt-5 pb-12 sm:px-7 sm:pt-7 lg:px-10 lg:pb-16"
      >
        {logoutError && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {logoutError}
          </p>
        )}
        <Routes key={`${pathname}:${user?.id ?? 'guest'}`}>
          <Route path="/" element={<Navigate to="/users" replace />} />
          <Route path="/users" element={<MarketPage />} />
          <Route
            path="/users/products/:id"
            element={<ProductDetailsPage user={user} />}
          />
          <Route
            path="/login"
            element={
              checking ? (
                <PageState type="loading" message="กำลังตรวจสอบบัญชี…" />
              ) : (
                <LoginPage user={user} onLogin={handleLogin} />
              )
            }
          />
          <Route element={<ProtectedRoute {...routeAuth} />}>
            <Route path="/users/sell" element={<SellProductPage />} />
            <Route
              path="/users/my-listings"
              element={<MyListingsPage user={user} />}
            />
            <Route
              path="/users/products/:id/edit"
              element={<EditProductPage user={user} />}
            />
          </Route>
          <Route element={<ProtectedRoute {...routeAuth} adminOnly />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-[84rem] flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-slate-600 sm:px-7 lg:px-10">
          <span className="font-bold text-slate-800">Campus Market</span>
          <span>ตลาดสินค้ามือสองในมหาวิทยาลัย</span>
        </div>
      </footer>
    </div>
  );
}
