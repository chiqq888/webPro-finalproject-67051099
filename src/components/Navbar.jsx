import { Link, NavLink, useMatch } from 'react-router-dom';
import Icon from './Icon.jsx';

const userNavItems = [
  { path: '/users', label: 'ตลาดสินค้า' },
  { path: '/users/my-listings', label: 'ประกาศของฉัน' },
];

const adminNavItems = [
  { path: '/admin/dashboard', label: 'ภาพรวม' },
  { path: '/admin', label: 'จัดการตลาด' },
];

export default function Navbar({ user, signingOut, onLogout }) {
  const onAdminPage = Boolean(useMatch('/admin/*'));
  const isAdmin = user?.role === 'admin';
  let navItems = user ? userNavItems : userNavItems.slice(0, 1);
  if (isAdmin && onAdminPage) navItems = adminNavItems;
  const accountLinkClass =
    'rounded-lg border border-stone-200 px-2.5 py-2 text-sm font-semibold whitespace-nowrap text-slate-700 hover:border-orange-300 hover:text-orange-700 sm:px-3.5';

  return (
    <header className="border-b border-stone-200/80 bg-white">
      <div className="mx-auto flex max-w-[84rem] flex-wrap items-center justify-between gap-x-2 px-4 sm:gap-x-4 sm:px-7 lg:px-10">
        <Link
          to="/users"
          className="my-3 flex items-center gap-2 rounded-md sm:my-4 sm:gap-2.5"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-700 text-white sm:size-10">
            <Icon name="bag" className="size-[21px] sm:size-[23px]" />
          </span>
          <span className="text-base leading-tight font-bold tracking-tight whitespace-nowrap text-slate-900 sm:text-[21px]">
            Campus<span className="text-orange-700"> Market</span>
          </span>
        </Link>
        <nav
          aria-label="เมนูหลัก"
          className="order-3 flex w-full items-stretch gap-4 border-t border-stone-100 sm:order-none sm:w-auto sm:gap-5 sm:self-stretch sm:border-t-0 lg:gap-8"
        >
          {navItems.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              end
              className={({ isActive }) =>
                `flex min-h-10 items-center border-b-2 px-0.5 text-sm font-semibold whitespace-nowrap transition-colors hover:text-orange-700 ${isActive ? 'border-orange-700 text-orange-700' : 'border-transparent text-slate-600'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && (
            <Link
              to={onAdminPage ? '/users' : '/admin/dashboard'}
              className={accountLinkClass}
            >
              {onAdminPage ? 'ตลาด' : 'Admin'}
            </Link>
          )}
          {user ? (
            <button
              type="button"
              className={`${accountLinkClass} disabled:opacity-55`}
              onClick={onLogout}
              disabled={signingOut}
            >
              {signingOut ? 'กำลังออก…' : 'ออกจากระบบ'}
            </button>
          ) : (
            <Link to="/login" className={accountLinkClass}>
              เข้าสู่ระบบ
            </Link>
          )}
          {!onAdminPage && (
            <Link
              to="/users/sell"
              className="btn-primary min-h-9 gap-1.5 rounded-lg px-2.5 py-2 whitespace-nowrap sm:px-3.5"
            >
              <Icon name="add" className="size-4 shrink-0" /> ลงขาย
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
