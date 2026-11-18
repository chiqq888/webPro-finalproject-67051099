import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, CONDITIONS } from '../data/constants.js';

const emptyProduct = {
  title: '',
  description: '',
  price: '',
  category: '',
  condition: '',
  imageUrl: '',
  pickupLocation: '',
};

const fieldClass = 'field-control mt-2 aria-invalid:border-red-600';
const labelClass = 'block text-sm font-semibold text-slate-800';

function isImageUrlValid(imageUrl) {
  if (imageUrl.startsWith('/')) {
    return (
      imageUrl.length > 1 &&
      !imageUrl.startsWith('//') &&
      !imageUrl.includes('\\')
    );
  }

  if (!/^https?:\/\//i.test(imageUrl)) return false;

  try {
    return Boolean(new URL(imageUrl).hostname);
  } catch {
    return false;
  }
}

function validateProduct(product, priceText) {
  const errors = {};

  if (product.title.length < 3 || product.title.length > 100) {
    errors.title = 'กรอกชื่อสินค้า 3–100 ตัวอักษร';
  }
  if (product.description.length < 10 || product.description.length > 2000) {
    errors.description = 'กรอกรายละเอียด 10–2,000 ตัวอักษร';
  }
  const isDecimal = /^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(priceText);
  if (!isDecimal || !Number.isFinite(product.price) || product.price <= 0) {
    errors.price = 'กรอกราคามากกว่า 0 และใช้ทศนิยมไม่เกิน 2 ตำแหน่ง';
  }
  if (!Object.hasOwn(CATEGORIES, product.category)) {
    errors.category = 'เลือกหมวดหมู่สินค้า';
  }
  if (!Object.hasOwn(CONDITIONS, product.condition)) {
    errors.condition = 'เลือกสภาพสินค้า';
  }
  if (!isImageUrlValid(product.imageUrl)) {
    errors.imageUrl = 'ใส่ URL แบบ http/https หรือ path รูปในโปรเจกต์ที่ขึ้นต้นด้วย /';
  }
  if (
    product.pickupLocation.length < 2 ||
    product.pickupLocation.length > 120
  ) {
    errors.pickupLocation = 'กรอกจุดนัดรับ 2–120 ตัวอักษร';
  }

  return errors;
}

function FieldError({ name, errors }) {
  if (!errors[name]) return null;
  return (
    <span
      id={`${name}-error`}
      className="mt-1.5 block text-sm font-normal text-red-700"
    >
      {errors[name]}
    </span>
  );
}

export default function ProductForm({
  initialProduct = emptyProduct,
  onSubmit,
  saving,
  error,
  submitLabel,
}) {
  const [product, setProduct] = useState(() => ({
    title: initialProduct.title,
    description: initialProduct.description,
    price: String(initialProduct.price),
    category: initialProduct.category,
    condition: initialProduct.condition,
    imageUrl: initialProduct.imageUrl,
    pickupLocation: initialProduct.pickupLocation,
  }));
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;
    setProduct((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: '' }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const priceText = product.price.trim();
    // ส่งเฉพาะช่องที่ผู้ขายแก้ได้ เพื่อคงเจ้าของและสถานะเดิมไว้
    const productData = {
      title: product.title.trim(),
      description: product.description.trim(),
      price: Number(priceText),
      category: product.category,
      condition: product.condition,
      imageUrl: product.imageUrl.trim(),
      pickupLocation: product.pickupLocation.trim(),
    };
    const nextErrors = validateProduct(productData, priceText);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit(productData);
  }

  return (
    <form
      className="card-surface p-5 sm:p-7"
      onSubmit={handleSubmit}
      noValidate
    >
      <fieldset
        disabled={saving}
        className="grid min-w-0 gap-5"
        aria-label="ข้อมูลประกาศ"
      >
        <div>
          <label className={labelClass} htmlFor="title">
            ชื่อสินค้า
          </label>
          <input
            className={fieldClass}
            id="title"
            name="title"
            value={product.title}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined}
            placeholder="เช่น คีย์บอร์ด Mechanical"
          />
          <FieldError name="title" errors={errors} />
        </div>

        <div>
          <label className={labelClass} htmlFor="description">
            รายละเอียด
          </label>
          <textarea
            className={`${fieldClass} resize-y`}
            id="description"
            name="description"
            value={product.description}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? 'description-error' : undefined
            }
            rows={4}
            placeholder="ระบุสภาพสินค้า ตำหนิ หรืออุปกรณ์ที่ให้มาด้วย"
          />
          <FieldError name="description" errors={errors} />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="min-w-0">
            <label className={labelClass} htmlFor="price">
              ราคา (บาท)
            </label>
            <input
              className={fieldClass}
              id="price"
              name="price"
              value={product.price}
              onChange={handleChange}
              required
              aria-invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? 'price-error' : undefined}
              inputMode="decimal"
              placeholder="เช่น 250.50"
            />
            <FieldError name="price" errors={errors} />
          </div>

          <div className="min-w-0">
            <label className={labelClass} htmlFor="category">
              หมวดหมู่
            </label>
            <select
              className={fieldClass}
              id="category"
              name="category"
              value={product.category}
              onChange={handleChange}
              required
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? 'category-error' : undefined}
            >
              <option value="">เลือกหมวดหมู่</option>
              {Object.entries(CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError name="category" errors={errors} />
          </div>

          <div className="min-w-0">
            <label className={labelClass} htmlFor="condition">
              สภาพสินค้า
            </label>
            <select
              className={fieldClass}
              id="condition"
              name="condition"
              value={product.condition}
              onChange={handleChange}
              required
              aria-invalid={Boolean(errors.condition)}
              aria-describedby={
                errors.condition ? 'condition-error' : undefined
              }
            >
              <option value="">เลือกสภาพสินค้า</option>
              {Object.entries(CONDITIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError name="condition" errors={errors} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="imageUrl">
            URL หรือ path รูปสินค้า
          </label>
          <input
            className={fieldClass}
            id="imageUrl"
            name="imageUrl"
            value={product.imageUrl}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.imageUrl)}
            aria-describedby={errors.imageUrl ? 'imageUrl-error' : undefined}
            placeholder="https://example.com/photo.jpg หรือ /images/photo.jpg"
          />
          <FieldError name="imageUrl" errors={errors} />
        </div>

        <div>
          <label className={labelClass} htmlFor="pickupLocation">
            จุดนัดรับ
          </label>
          <input
            className={fieldClass}
            id="pickupLocation"
            name="pickupLocation"
            value={product.pickupLocation}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.pickupLocation)}
            aria-describedby={
              errors.pickupLocation ? 'pickupLocation-error' : undefined
            }
            placeholder="เช่น หน้าหอสมุดกลาง"
          />
          <FieldError name="pickupLocation" errors={errors} />
        </div>
      </fieldset>

      {Object.values(errors).some(Boolean) && (
        <p className="mt-5 text-sm font-medium text-red-700" role="alert">
          ตรวจสอบช่องที่ระบุแล้วส่งอีกครั้ง
        </p>
      )}
      {error && (
        <p
          className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-stone-200 pt-5">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'กำลังบันทึก…' : submitLabel}
        </button>
        <Link className="btn-secondary" to="/users/my-listings">
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
