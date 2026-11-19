import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminProductList from '../components/AdminProductList.jsx';
import AdminReportList from '../components/AdminReportList.jsx';
import PageState from '../components/PageState.jsx';
import { REPORT_STATUSES } from '../data/constants.js';
import {
  getAdminProducts,
  getReports,
  getUsers,
  updateProduct,
  updateReport,
} from '../services/api.js';

const tabs = [
  { id: 'products', label: 'ประกาศทั้งหมด' },
  { id: 'reports', label: 'รายงาน' },
];

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab =
    searchParams.get('tab') === 'reports' ? 'reports' : 'products';
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [reportStatus, setReportStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadCount, setLoadCount] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [action, setAction] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const [products, users, reports] = await Promise.all([
          getAdminProducts(controller.signal),
          getUsers(controller.signal),
          getReports(controller.signal),
        ]);
        if (!controller.signal.aborted) setData({ products, users, reports });
      } catch (error) {
        if (!controller.signal.aborted)
          setLoadError(`โหลดข้อมูลผู้ดูแลไม่ได้ ${error.message}`);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, [loadCount]);

  function handleReload() {
    setLoading(true);
    setLoadError('');
    setLoadCount((count) => count + 1);
  }

  function handleTabChange(tabId) {
    if (tabId === activeTab) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    if (tabId === 'reports') {
      nextSearchParams.set('tab', 'reports');
    } else {
      nextSearchParams.delete('tab');
    }
    setSearchParams(nextSearchParams);
  }

  async function saveVisibility(productId, isHidden) {
    const updated = await updateProduct(productId, {
      isHidden,
    });
    setData((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === productId ? updated : product,
      ),
    }));
  }

  async function handleVisibilityChange(product) {
    if (loading || action) return;

    const isHidden = !product.isHidden;
    setAction({ type: 'visibility', id: product.id });
    setNotice(null);
    try {
      await saveVisibility(product.id, isHidden);
      setNotice({
        message: isHidden ? 'ซ่อนประกาศแล้ว' : 'คืนประกาศให้แสดงในตลาดแล้ว',
      });
    } catch (error) {
      if (error.status === 404) {
        setNotice({ error: true, message: 'ไม่พบประกาศในระบบ' });
        handleReload();
      } else {
        setNotice({
          error: true,
          message: `เปลี่ยนการแสดงประกาศไม่ได้ ${error.message}`,
        });
      }
    } finally {
      setAction(null);
    }
  }

  async function handleReview(report, productToHide) {
    if (loading || action || report.status !== 'pending') return;

    setAction({ type: productToHide ? 'hide' : 'review', id: report.id });
    setNotice(null);
    let productWasHidden = false;

    try {
      // ยืนยันการซ่อนก่อนบันทึกผลตรวจ เพราะเป็นคนละคำขอ
      if (productToHide) {
        await saveVisibility(productToHide.id, true);
        productWasHidden = true;
      }
      const updated = await updateReport(report.id, {
        status: 'reviewed',
      });
      setData((current) => ({
        ...current,
        reports: current.reports.map((item) =>
          item.id === report.id ? updated : item,
        ),
      }));
      setNotice({
        message: productWasHidden
          ? 'ซ่อนประกาศและบันทึกผลตรวจรายงานแล้ว'
          : 'บันทึกผลตรวจรายงานแล้ว',
      });
    } catch (error) {
      if (productWasHidden) {
        setNotice({
          error: true,
          message:
            'ซ่อนประกาศแล้ว การบันทึกผลตรวจรายงานล้มเหลว หากรายงานยังรอตรวจสอบ กดทำเครื่องหมายว่าตรวจแล้วอีกครั้ง',
        });
        handleReload();
      } else if (error.status === 404) {
        const missing = productToHide ? 'ประกาศ' : 'รายงาน';
        setNotice({ error: true, message: `ไม่พบ${missing}ในระบบ` });
        handleReload();
      } else {
        const operation = productToHide
          ? 'ซ่อนประกาศไม่ได้'
          : 'บันทึกผลตรวจรายงานไม่ได้';
        setNotice({ error: true, message: `${operation} ${error.message}` });
      }
    } finally {
      setAction(null);
    }
  }

  const query = search.trim().toLowerCase();
  const products =
    data?.products
      .filter((product) => product.title.toLowerCase().includes(query))
      .sort((first, second) => second.id - first.id) || [];
  const reports =
    data?.reports
      .filter(
        (report) => reportStatus === 'all' || report.status === reportStatus,
      )
      .sort((first, second) => second.id - first.id) || [];
  const pendingCount =
    data?.reports.filter((report) => report.status === 'pending').length || 0;
  const actionsDisabled = loading || Boolean(action);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">จัดการตลาด</h1>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleReload}
          disabled={actionsDisabled}
        >
          {loading ? 'กำลังโหลด…' : 'โหลดใหม่'}
        </button>
      </div>

      <div
        className="mb-5 flex flex-wrap gap-x-5 border-b border-stone-200"
        aria-label="มุมมองผู้ดูแล"
        role="group"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const style = isActive
            ? 'border-orange-600 font-semibold text-orange-800'
            : 'border-transparent text-slate-600';
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 border-b-2 px-1 py-3 text-sm hover:text-orange-800 sm:text-base ${style}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
              {tab.id === 'reports' && pendingCount > 0 && (
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-800">
                  <span className="sr-only">รอตรวจสอบ </span>
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {notice && (
        <p
          role={notice.error ? 'alert' : 'status'}
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${notice.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-orange-200 bg-orange-50 text-orange-900'}`}
        >
          {notice.message}
        </p>
      )}
      {loadError && (
        <PageState
          type="error"
          message={loadError}
          onRetry={actionsDisabled ? undefined : handleReload}
        />
      )}
      {!data && loading && (
        <PageState type="loading" message="กำลังโหลดข้อมูลผู้ดูแล…" />
      )}

      {data && activeTab === 'products' && (
        <section aria-label="จัดการประกาศ" className="mt-4">
          <div className="mb-4 max-w-sm">
            <label
              htmlFor="admin-search"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              ค้นหาชื่อประกาศ
            </label>
            <input
              id="admin-search"
              type="search"
              className="field-control w-full"
              placeholder="พิมพ์ชื่อสินค้า"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {products.length > 0 ? (
            <AdminProductList
              products={products}
              users={data.users}
              action={action}
              disabled={actionsDisabled}
              onVisibilityChange={handleVisibilityChange}
            />
          ) : (
            <PageState type="empty" message="ไม่พบประกาศ" />
          )}
        </section>
      )}

      {data && activeTab === 'reports' && (
        <section aria-label="จัดการรายงาน" className="mt-4">
          <div className="mb-4 max-w-xs">
            <label
              htmlFor="admin-report-status"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              สถานะรายงาน
            </label>
            <select
              id="admin-report-status"
              className="field-control w-full"
              value={reportStatus}
              onChange={(event) => setReportStatus(event.target.value)}
            >
              <option value="all">ทั้งหมด</option>
              {Object.entries(REPORT_STATUSES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {reports.length > 0 ? (
            <AdminReportList
              reports={reports}
              products={data.products}
              users={data.users}
              action={action}
              disabled={actionsDisabled}
              onReview={handleReview}
            />
          ) : (
            <PageState type="empty" message="ไม่พบรายงานในสถานะที่เลือก" />
          )}
        </section>
      )}
    </>
  );
}
