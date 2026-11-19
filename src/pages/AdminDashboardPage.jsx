import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PageState from '../components/PageState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  PRODUCT_STATUSES,
  REPORT_REASONS,
  formatReportDate,
} from '../data/constants.js';
import { getProducts, getReports } from '../services/api.js';

const reportsPath = '/admin?tab=reports';

export default function AdminDashboardPage() {
  const [{ products, reports }, setData] = useState({
    products: [],
    reports: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadCount, setLoadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const [products, reports] = await Promise.all([
          getProducts(controller.signal),
          getReports(controller.signal),
        ]);
        if (!controller.signal.aborted) setData({ products, reports });
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, [loadCount]);

  function handleRetry() {
    setLoading(true);
    setLoadError('');
    setLoadCount((count) => count + 1);
  }

  const visibleProducts = products.filter(
    (product) => product.isHidden === false,
  );
  const hiddenProducts = products.filter(
    (product) => product.isHidden === true,
  );
  const pendingReports = reports.filter(
    (report) => report.status === 'pending',
  );
  const oldestReports = pendingReports
    .sort(
      (first, second) =>
        Date.parse(first.createdAt) - Date.parse(second.createdAt),
    )
    .slice(0, 5);
  const summary = [
    { label: 'ประกาศทั้งหมด', count: products.length, icon: 'grid' },
    { label: 'แสดงในตลาด', count: visibleProducts.length, icon: 'eye' },
    { label: 'ถูกซ่อน', count: hiddenProducts.length, icon: 'eyeOff' },
  ];

  return (
    <>
      <h1 className="page-title mb-5 sm:mb-6">ภาพรวมตลาด</h1>

      {loading && <PageState type="loading" message="กำลังโหลดภาพรวมตลาด…" />}
      {loadError && (
        <PageState type="error" message={loadError} onRetry={handleRetry} />
      )}

      {!loading && !loadError && (
        <>
          <section
            aria-label="สรุปประกาศและรายงาน"
            className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
          >
            {summary.map(({ label, count, icon }) => (
              <div key={label} className="card-surface min-w-0 p-3 sm:p-5">
                <span className="mb-3 grid size-9 place-items-center rounded-lg bg-orange-50 text-orange-800">
                  <Icon name={icon} />
                </span>
                <p className="text-sm font-semibold text-slate-700">{label}</p>
                <p className="mt-1 text-3xl leading-none font-bold tabular-nums sm:text-4xl">
                  {count}
                </p>
              </div>
            ))}

            <Link
              to={reportsPath}
              className="group min-w-0 rounded-2xl border border-orange-700 bg-orange-700 p-3 text-white transition-colors hover:border-orange-800 hover:bg-orange-800 sm:p-5"
            >
              <span className="mb-3 flex items-center justify-between gap-2">
                <span className="grid size-9 place-items-center rounded-lg bg-white/15">
                  <Icon name="flag" />
                </span>
                <Icon
                  name="arrow"
                  className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </span>
              <p className="text-sm font-semibold">รายงานรอตรวจ</p>
              <p className="mt-1 text-3xl leading-none font-bold tabular-nums sm:text-4xl">
                {pendingReports.length}
              </p>
            </Link>
          </section>

          <div className="mt-5 grid items-start gap-4 sm:mt-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <section
              aria-labelledby="pending-reports-title"
              className="card-surface min-w-0 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2
                  id="pending-reports-title"
                  className="text-xl leading-tight font-bold"
                >
                  คิวรายงานรอตรวจ
                </h2>
                <Link to={reportsPath} className="btn-secondary">
                  ไปตรวจรายงาน <Icon name="arrow" className="size-4" />
                </Link>
              </div>

              {oldestReports.length > 0 ? (
                <ul className="mt-3 divide-y divide-stone-100">
                  {oldestReports.map((report) => {
                    const product = products.find(
                      (product) => product.id === report.productId,
                    );

                    return (
                      <li
                        key={report.id}
                        className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3 last:pb-0"
                      >
                        <div className="min-w-0">
                          <h3 className="font-semibold wrap-break-word">
                            {product?.title || report.productTitle}
                          </h3>
                          <p className="mt-0.5 text-sm text-slate-600">
                            {REPORT_REASONS[report.reason]}
                          </p>
                        </div>
                        <time
                          dateTime={report.createdAt}
                          className="text-sm leading-6 text-slate-600"
                        >
                          {formatReportDate(report.createdAt)}
                        </time>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 rounded-xl bg-stone-50 px-4 py-5 text-center text-sm text-slate-600">
                  ไม่มีรายงานรอตรวจ
                </p>
              )}
            </section>

            <section
              aria-labelledby="sales-status-title"
              className="card-surface min-w-0 p-4 sm:p-5"
            >
              <h2
                id="sales-status-title"
                className="text-xl leading-tight font-bold"
              >
                สถานะการขาย
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                เฉพาะประกาศที่แสดงในตลาด
              </p>
              <dl className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
                {Object.keys(PRODUCT_STATUSES).map((status) => (
                  <div
                    key={status}
                    className="grid justify-items-center gap-2 rounded-xl bg-stone-50 px-0.5 py-3 sm:py-4"
                  >
                    <dt>
                      <StatusBadge status={status} />
                    </dt>
                    <dd className="text-2xl leading-none font-bold tabular-nums">
                      {
                        visibleProducts.filter(
                          (product) => product.status === status,
                        ).length
                      }
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </>
      )}
    </>
  );
}
