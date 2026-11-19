import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { login } from '../services/api.js';

export default function LoginPage({ user, onLogin }) {
  const { state } = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    const from = state?.from;
    const isLocal =
      typeof from === 'string' &&
      from.startsWith('/') &&
      !from.startsWith('//') &&
      !from.includes('\\') &&
      !/^\/login(?:[/?#]|$)/i.test(from);
    const defaultPage = user.role === 'admin' ? '/admin/dashboard' : '/users';
    return <Navigate to={isLocal ? from : defaultPage} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError('');
    try {
      const account = await login({ username: username.trim(), password });
      onLogin(account);
    } catch (requestError) {
      setPassword('');
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md py-5 sm:py-10">
      <Link
        to="/users"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-800"
      >
        <Icon name="arrow" className="size-4 rotate-180" /> กลับตลาดสินค้า
      </Link>
      <div className="card-surface p-6 sm:p-8">
        <div className="mb-4 grid size-12 place-items-center rounded-xl bg-orange-50 text-orange-800">
          <Icon name="bag" className="size-6" />
        </div>
        <h1 className="page-title">เข้าสู่ระบบ</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="login-username"
              className="mb-1.5 block text-sm font-semibold"
            >
              ชื่อบัญชี
            </label>
            <input
              className="field-control"
              id="login-username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={64}
              disabled={submitting}
              required
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-sm font-semibold"
            >
              รหัสผ่าน
            </label>
            <input
              className="field-control"
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              maxLength={128}
              disabled={submitting}
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={submitting}
          >
            {submitting ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </section>
  );
}
