import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PageState from '../components/PageState.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ProductFilters from '../components/ProductFilters.jsx';
import { getProducts } from '../services/api.js';

const initialFilters = {
  search: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  condition: '',
};

function getFilteredProducts(products, filters, minPrice, maxPrice) {
  const search = filters.search.trim().toLowerCase();

  return products
    .filter((product) => {
      if (product.isHidden) return false;
      if (filters.category && product.category !== filters.category)
        return false;
      if (filters.condition && product.condition !== filters.condition)
        return false;
      if (minPrice !== null && product.price < minPrice) return false;
      if (maxPrice !== null && product.price > maxPrice) return false;
      return (
        product.title.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search)
      );
    })
    .sort((first, second) => second.id - first.id);
}

export default function MarketPage() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const result = await getProducts(controller.signal);
        if (!controller.signal.aborted) setProducts(result);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProducts();
    return () => controller.abort();
  }, [reloadCount]);

  function handleRetry() {
    setLoading(true);
    setError('');
    setReloadCount(reloadCount + 1);
  }

  function handleFilterChange(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  // ช่องราคาที่เว้นว่างไม่กำหนดขอบเขต ส่วนเลข 0 เป็นค่าตัวกรอง
  const minPrice = filters.minPrice === '' ? null : Number(filters.minPrice);
  const maxPrice = filters.maxPrice === '' ? null : Number(filters.maxPrice);
  let priceError = '';
  if (minPrice < 0 || maxPrice < 0) {
    priceError = 'กรุณากรอกราคาตั้งแต่ 0 บาทขึ้นไป';
  } else if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    priceError = 'ราคาต่ำสุดต้องไม่เกินราคาสูงสุด';
  }
  const results = priceError
    ? []
    : getFilteredProducts(products, filters, minPrice, maxPrice);

  return (
    <>
      <section className="relative isolate overflow-hidden rounded-[24px] border border-orange-100/80 bg-[#fcead7]">
        <img
          src="/images/market-hero.jpg"
          alt=""
          className="absolute inset-0 -z-20 hidden size-full object-cover object-right sm:block"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#fcead7] via-[#fcead7]/95 via-34% to-transparent to-65%" />
        <div className="max-w-xl px-6 py-8 sm:px-9 sm:py-10 lg:px-12 lg:py-11">
          <h1 className="text-[2.15rem] leading-[1.15] font-bold tracking-tight text-[#241a14] sm:text-[2.8rem] lg:text-[3.45rem]">
            ตลาดมือสอง
            <br />
            <span className="text-orange-800">ในมหาวิทยาลัย</span>
          </h1>
          <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-[#59483c] sm:text-base">
            หาของที่ต้องการ ส่งต่อของที่ไม่ได้ใช้ แล้วนัดรับกันในมหาวิทยาลัย
          </p>
          <a href="#products" className="btn-primary mt-5">
            ดูสินค้า <Icon name="arrow" className="size-4" />
          </a>
        </div>
      </section>

      <section
        id="products"
        className="mt-7 grid scroll-mt-4 items-start gap-4 lg:mt-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-x-5 xl:grid-cols-[14rem_minmax(0,1fr)]"
        aria-labelledby="products-title"
      >
        <div className="grid min-w-0 items-end gap-3 sm:grid-cols-[1fr_minmax(16rem,1fr)] lg:col-start-2 lg:row-start-1">
          <div className="min-w-0">
            <h2
              id="products-title"
              className="text-2xl leading-tight font-bold tracking-tight sm:text-[1.8rem]"
            >
              สินค้าทั้งหมด
            </h2>
            {!loading && !error && !priceError && (
              <p aria-live="polite" className="mt-1 text-sm text-slate-600">
                พบ {results.length} รายการ
              </p>
            )}
          </div>
          <label className="relative block min-w-0">
            <span className="sr-only">ค้นหาสินค้า</span>
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-slate-500"
            />
            <input
              type="search"
              className="field-control pl-10"
              placeholder="ค้นหาชื่อสินค้าหรือรายละเอียด"
              value={filters.search}
              onChange={(event) =>
                handleFilterChange('search', event.target.value)
              }
            />
          </label>
        </div>
        <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <ProductFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={() => setFilters(initialFilters)}
            priceError={priceError}
          />
        </div>
        <div className="min-w-0 lg:col-start-2">
          {loading && <PageState type="loading" message="กำลังโหลดสินค้า…" />}
          {error && (
            <PageState type="error" message={error} onRetry={handleRetry} />
          )}
          {!loading && !error && priceError && (
            <PageState message="แก้ไขช่วงราคาเพื่อดูสินค้า" />
          )}
          {!loading && !error && !priceError && results.length === 0 && (
            <PageState message="ไม่พบสินค้าที่ตรงกับตัวกรอง" />
          )}
          {results.length > 0 && !loading && !error && (
            <div className="grid grid-cols-1 gap-3.5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
      {!loading && !error && products.length === 0 && (
        <Link className="btn-secondary mt-5" to="/users/sell">
          ลงประกาศขาย
        </Link>
      )}
    </>
  );
}
