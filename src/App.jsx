import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import AdminPage from './pages/AdminPage.jsx'
import EditProductPage from './pages/EditProductPage.jsx'
import MarketPage from './pages/MarketPage.jsx'
import MyListingsPage from './pages/MyListingsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProductDetailsPage from './pages/ProductDetailsPage.jsx'
import SellProductPage from './pages/SellProductPage.jsx'

export default function App() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-20 focus:rounded-lg focus:bg-white focus:p-3">ข้ามไปยังเนื้อหาหลัก</a>
      <Navbar />
      <main id="main" className="mx-auto w-full max-w-[84rem] flex-1 px-4 pt-5 pb-12 sm:px-7 sm:pt-7 lg:px-10 lg:pb-16">
        <Routes key={pathname}>
          <Route path="/" element={<Navigate to="/users" replace />} />
          <Route path="/users" element={<MarketPage />} />
          <Route path="/users/products/:id" element={<ProductDetailsPage />} />
          <Route path="/users/sell" element={<SellProductPage />} />
          <Route path="/users/my-listings" element={<MyListingsPage />} />
          <Route path="/users/products/:id/edit" element={<EditProductPage />} />
          <Route path="/admin" element={<AdminPage />} />
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
  )
}
