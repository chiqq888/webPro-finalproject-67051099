import { Link } from 'react-router-dom';
import {
  CATEGORIES,
  PRODUCT_STATUSES,
  formatPrice,
} from '../data/constants.js';
import ProductImage from './ProductImage.jsx';
import SelectControl from './SelectControl.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function MyListingCard({
  product,
  busy,
  disabled,
  onStatusChange,
  onDelete,
}) {
  return (
    <article
      className="card-surface flex min-w-0 flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between"
      aria-busy={busy}
    >
      <div className="flex min-w-0 items-start gap-4 sm:items-center">
        <ProductImage
          src={product.imageUrl}
          alt={product.title}
          className="size-20 shrink-0 rounded-xl bg-stone-100 object-cover sm:size-24"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-600">
            {CATEGORIES[product.category]}
          </p>
          <h2 className="mt-1 text-base font-bold wrap-anywhere text-slate-900 sm:text-lg">
            {product.isHidden ? (
              product.title
            ) : (
              <Link
                className="hover:text-orange-700"
                to={`/users/products/${product.id}`}
              >
                {product.title}
              </Link>
            )}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="mr-1 font-bold text-orange-700">
              {formatPrice(product.price)}
            </p>
            <StatusBadge status={product.status} />
            {product.isHidden && (
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                ถูกผู้ดูแลซ่อน
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-end gap-2 border-t border-stone-100 pt-3 lg:w-auto lg:shrink-0 lg:border-0 lg:pt-0">
        <label className="grid min-w-0 grow gap-1.5 text-xs font-semibold text-slate-600 lg:w-36 lg:grow-0">
          สถานะการขาย
          <SelectControl
            value={product.status}
            onChange={(event) => onStatusChange(product, event.target.value)}
            disabled={disabled}
          >
            {Object.entries(PRODUCT_STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectControl>
        </label>
        <Link
          className="btn-secondary"
          to={`/users/products/${product.id}/edit`}
        >
          แก้ไข
        </Link>
        <button
          className="min-h-11 rounded-xl px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
          type="button"
          disabled={disabled}
          onClick={() => onDelete(product)}
        >
          ลบ
        </button>
      </div>
    </article>
  );
}
