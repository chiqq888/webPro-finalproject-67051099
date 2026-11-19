import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { register } from '../services/api.js';

function RegisterField({ label, name, error, ...inputProps }) {
  const id = `register-${name}`;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        name={name}
        className="field-control aria-invalid:border-red-600"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function validateRegistration(
  { displayName, username, password },
  confirmPassword,
) {
  const errors = {};

  if (displayName.length < 2 || displayName.length > 60) {
    errors.displayName = 'ชื่อที่แสดงต้องยาว 2–60 ตัวอักษร';
  }
  if (!/^[a-z0-9][a-z0-9._@+-]{2,49}$/i.test(username)) {
    errors.username =
      'ชื่อบัญชีต้องยาว 3–50 ตัวและเริ่มด้วยตัวอักษรอังกฤษหรือตัวเลข ใช้จุด ขีดล่าง @ + และ - ได้';
  }
  if (password.length < 8 || password.length > 128) {
    errors.password = 'รหัสผ่านต้องยาว 8–128 ตัวอักษร';
  }
  if (!confirmPassword || confirmPassword !== password) {
    errors.confirmPassword = 'กรุณากรอกรหัสผ่านยืนยันให้ตรงกัน';
  }
  return errors;
}

export default function RegisterPage({ onRegister }) {
  const { state } = useLocation();
  const [fields, setFields] = useState({
    displayName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const requestErrorRef = useRef(null);

  useEffect(() => {
    if (requestError) requestErrorRef.current?.focus();
  }, [requestError]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFields((previous) => ({ ...previous, [name]: value }));
    setErrors({});
    setRequestError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const data = {
      displayName: fields.displayName.trim(),
      username: fields.username.trim(),
      password: fields.password,
    };
    const nextErrors = validateRegistration(data, fields.confirmPassword);
    const firstError = Object.keys(nextErrors)[0];
    setErrors(nextErrors);
    setRequestError('');

    if (firstError) {
      event.currentTarget.elements.namedItem(firstError)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const profile = await register(data);
      onRegister(profile);
    } catch (error) {
      setRequestError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl py-5 sm:py-10">
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
        <h1 className="page-title">สมัครสมาชิก</h1>
        <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
          <fieldset disabled={submitting} className="grid min-w-0 gap-4">
            <RegisterField
              name="displayName"
              label="ชื่อที่แสดง"
              value={fields.displayName}
              onChange={handleChange}
              autoComplete="nickname"
              error={errors.displayName}
              required
            />
            <RegisterField
              name="username"
              label="ชื่อบัญชี"
              value={fields.username}
              onChange={handleChange}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              error={errors.username}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <RegisterField
                name="password"
                label="รหัสผ่าน"
                type="password"
                autoComplete="new-password"
                value={fields.password}
                onChange={handleChange}
                error={errors.password}
                required
              />
              <RegisterField
                name="confirmPassword"
                label="ยืนยันรหัสผ่าน"
                type="password"
                autoComplete="new-password"
                value={fields.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
              />
            </div>
          </fieldset>

          {requestError && (
            <p
              ref={requestErrorRef}
              tabIndex={-1}
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 focus:outline-2 focus:outline-offset-2 focus:outline-red-600"
            >
              {requestError}
            </p>
          )}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={submitting}
          >
            {submitting ? 'กำลังสมัครสมาชิก…' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="mt-5 border-t border-stone-200 pt-5 text-center text-sm text-slate-600">
          มีบัญชีแล้ว?{' '}
          <Link
            to="/login"
            state={state}
            className="rounded-sm font-bold text-orange-800 underline underline-offset-4 hover:text-orange-950"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </section>
  );
}
