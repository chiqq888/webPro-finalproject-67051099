import { CATEGORIES, CONDITIONS } from '../data/constants.js';
import Icon from './Icon.jsx';

export default function ProductFilters({
  filters,
  onChange,
  onReset,
  priceError,
}) {
  const categories = [['', 'ทุกหมวดหมู่'], ...Object.entries(CATEGORIES)];

  return (
    <aside
      className="card-surface self-start p-4 lg:p-[18px]"
      aria-labelledby="filters-title"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="filters-title" className="flex items-center gap-2 font-bold">
          <Icon name="filter" className="size-[18px] text-orange-700" /> ตัวกรอง
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="rounded text-xs font-bold text-orange-700 hover:underline"
        >
          ล้างตัวกรอง
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5">
        <fieldset className="min-w-0 sm:col-span-2 lg:col-span-1">
          <legend className="mb-2 text-xs font-bold text-slate-600">
            หมวดหมู่
          </legend>
          <div className="flex flex-wrap gap-1.5 lg:flex-col">
            {categories.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filters.category === value}
                onClick={() => onChange('category', value)}
                className={`flex min-h-9 items-center gap-2 rounded-lg border border-transparent px-2.5 py-1.5 text-left text-sm leading-tight transition-colors hover:bg-orange-50 hover:text-orange-800 aria-pressed:border-orange-100 aria-pressed:bg-orange-50 aria-pressed:font-bold aria-pressed:text-orange-800 ${filters.category === value ? '' : 'text-slate-600'}`}
              >
                <Icon name={value || 'grid'} className="size-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="min-w-0">
          <legend className="mb-2 text-xs font-bold text-slate-600">
            ช่วงราคา (บาท)
          </legend>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="any"
              aria-label="ราคาต่ำสุด"
              placeholder="ต่ำสุด"
              value={filters.minPrice}
              onChange={(event) => onChange('minPrice', event.target.value)}
              aria-invalid={Boolean(priceError)}
              aria-describedby={priceError ? 'price-error' : undefined}
              className="field-control min-h-9 rounded-lg px-2 py-1.5"
            />
            <span aria-hidden="true" className="text-stone-400">
              –
            </span>
            <input
              type="number"
              min="0"
              step="any"
              aria-label="ราคาสูงสุด"
              placeholder="สูงสุด"
              value={filters.maxPrice}
              onChange={(event) => onChange('maxPrice', event.target.value)}
              aria-invalid={Boolean(priceError)}
              aria-describedby={priceError ? 'price-error' : undefined}
              className="field-control min-h-9 rounded-lg px-2 py-1.5"
            />
          </div>
          {priceError && (
            <p
              id="price-error"
              role="alert"
              className="mt-2 text-xs font-semibold text-red-700"
            >
              {priceError}
            </p>
          )}
        </fieldset>
        <div className="min-w-0">
          <label
            htmlFor="market-condition"
            className="mb-2 block text-xs font-bold text-slate-600"
          >
            สภาพสินค้า
          </label>
          <div className="relative">
            <select
              id="market-condition"
              className="field-control min-h-9 appearance-none rounded-lg py-1.5 pr-9 pl-2 forced-colors:pr-2 forced-colors:appearance-auto"
              value={filters.condition}
              onChange={(event) => onChange('condition', event.target.value)}
            >
              <option value="">ทุกสภาพ</option>
              {Object.entries(CONDITIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Icon
              name="chevron"
              className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 rotate-90 text-slate-600 forced-colors:hidden"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
