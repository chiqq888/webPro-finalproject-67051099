import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageState from "../components/PageState.jsx";
import ProductImage from "../components/ProductImage.jsx";
import ReportForm from "../components/ReportForm.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { CATEGORIES, CONDITIONS, CURRENT_USER_ID, formatPrice } from "../data/constants.js";
import { createReport, getProduct, getReports, getUsers } from "../services/api.js";

const notFound = { type: "empty", message: "ไม่พบสินค้า" };
const hidden = { type: "empty", message: "ประกาศนี้ไม่พร้อมแสดง" };
const loading = { type: "loading", message: "กำลังโหลดรายละเอียดสินค้า…" };

function hasReported(reports, productId) {
  return reports.some((report) => (
    report.productId === productId && report.reporterId === CURRENT_USER_ID
  ));
}

function ProductDetails({ productId }) {
  const [page, setPage] = useState(loading);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [showReportForm, setShowReportForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedReport, setSubmittedReport] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDetails() {
      let product;
      try {
        product = await getProduct(productId, controller.signal);
        if (controller.signal.aborted) return;
        if (product.isHidden === true) {
          setPage(hidden);
          return;
        }

        const [users, reports] = await Promise.all([
          getUsers(controller.signal),
          product.sellerId === CURRENT_USER_ID ? [] : getReports(controller.signal),
        ]);
        if (controller.signal.aborted) return;

        setPage({
          type: "ready",
          product,
          seller: users.find((user) => user.id === product.sellerId),
          alreadyReported: hasReported(reports, product.id),
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!product && error.status === 404) {
          setPage(notFound);
        } else {
          setPage({ type: "error", message: `โหลดรายละเอียดสินค้าไม่สำเร็จ ${error.message}` });
        }
      }
    }

    loadDetails();
    return () => controller.abort();
  }, [productId, loadAttempt]);

  function handleRetry() {
    setPage(loading);
    setLoadAttempt((attempt) => attempt + 1);
  }

  async function handleReportSubmit({ reason, details }) {
    if (submitting || page.product.sellerId === CURRENT_USER_ID || page.alreadyReported) return;

    setSubmitting(true);
    setSubmitError("");
    let product;

    try {
      product = await getProduct(productId);
      if (product.isHidden === true) {
        setPage(hidden);
        return;
      }
      if (product.sellerId === CURRENT_USER_ID) {
        setPage({ ...page, product });
        setShowReportForm(false);
        return;
      }

      // ตรวจรายงานล่าสุดอีกครั้ง เผื่อผู้ใช้เปิดประกาศเดียวกันไว้หลายแท็บ
      const reports = await getReports();
      if (hasReported(reports, product.id)) {
        setPage({ ...page, alreadyReported: true });
        setShowReportForm(false);
        return;
      }

      await createReport({
        productId: product.id,
        productTitle: product.title,
        reporterId: CURRENT_USER_ID,
        reason,
        details,
        status: "pending",
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      });

      setSubmittedReport(true);
      setPage({ ...page, alreadyReported: true });
      setShowReportForm(false);
    } catch (error) {
      if (!product && error.status === 404) {
        setPage(notFound);
      } else {
        setSubmitError(`ส่งรายงานไม่สำเร็จ ${error.message} กรุณาลองส่งอีกครั้ง`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleReportCancel() {
    setSubmitError("");
    setShowReportForm(false);
  }

  if (page.type !== "ready") {
    return (
      <PageState
        type={page.type}
        message={page.message}
        onRetry={page.type === "error" ? handleRetry : undefined}
      />
    );
  }

  const { product, seller, alreadyReported } = page;
  const isOwner = product.sellerId === CURRENT_USER_ID;

  return (
    <article className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start lg:gap-7">
      <figure className="card-surface overflow-hidden bg-stone-100">
        <ProductImage
          src={product.imageUrl}
          alt={product.title}
          className="aspect-[4/3] w-full object-cover"
        />
      </figure>

      <section className="card-surface min-w-0 p-5 sm:p-7 lg:row-span-2" aria-label="ข้อมูลการซื้อขาย">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-800">
            {CATEGORIES[product.category]}
          </span>
          <StatusBadge status={product.status} />
        </div>
        <h1 className="page-title wrap-anywhere">{product.title}</h1>
        <p className="mt-3 text-3xl font-bold tracking-tight text-orange-700">{formatPrice(product.price)}</p>

        <dl className="mt-6 grid gap-4 border-y border-stone-100 py-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-600">สภาพสินค้า</dt>
            <dd className="mt-1 font-medium">{CONDITIONS[product.condition]}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-600">จุดนัดรับ</dt>
            <dd className="mt-1 wrap-anywhere font-medium">{product.pickupLocation}</dd>
          </div>
        </dl>

        <section className="mt-5" aria-labelledby="seller-heading">
          <h2 id="seller-heading" className="text-lg font-bold">ติดต่อผู้ขาย</h2>
          {seller ? (
            <>
              <p className="mt-2 wrap-anywhere font-medium">{seller.displayName}</p>
              {seller.lineId && (
                <p className="mt-2 wrap-anywhere text-sm text-slate-600">LINE ID {seller.lineId}</p>
              )}
              {seller.phone && (
                <a className="mt-2 inline-block wrap-anywhere text-sm font-medium text-orange-800 underline underline-offset-4" href={`tel:${seller.phone}`}>
                  โทร {seller.phone}
                </a>
              )}
              {!seller.lineId && !seller.phone && (
                <p className="mt-2 text-sm text-slate-600">ไม่มีช่องทางติดต่อในโปรไฟล์ผู้ขาย</p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-600">ไม่พบข้อมูลผู้ขาย</p>
          )}
        </section>

        {isOwner && (
          <Link to={`/users/products/${product.id}/edit`} className="btn-secondary mt-6">
            แก้ไขประกาศของฉัน
          </Link>
        )}
      </section>

      <div className="min-w-0 space-y-5">
        <section className="card-surface p-5 sm:p-7" aria-labelledby="description-heading">
          <h2 id="description-heading" className="text-lg font-bold">รายละเอียดสินค้า</h2>
          <p className="mt-3 wrap-anywhere whitespace-pre-wrap text-slate-700">{product.description}</p>
        </section>

        {!isOwner && (
          <section className="card-surface p-5 sm:p-7" aria-label="รายงานประกาศ">
            {alreadyReported && (
              <p className="text-sm font-medium text-slate-700" role="status">
                {submittedReport ? "ส่งรายงานแล้ว ผู้ดูแลจะตรวจสอบประกาศนี้" : "คุณเคยรายงานประกาศนี้แล้ว"}
              </p>
            )}
            {!alreadyReported && !showReportForm && (
              <button type="button" className="btn-secondary" onClick={() => setShowReportForm(true)}>
                รายงานประกาศ
              </button>
            )}
            {!alreadyReported && showReportForm && (
              <>
                <h2 className="text-lg font-bold">รายงานประกาศ</h2>
                <ReportForm
                  onSubmit={handleReportSubmit}
                  onCancel={handleReportCancel}
                  submitting={submitting}
                  error={submitError}
                />
              </>
            )}
          </section>
        )}
      </div>
    </article>
  );
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const productId = Number(id);

  return (
    <>
      <Link to="/users" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-800">
        <span aria-hidden="true">←</span> กลับตลาดสินค้า
      </Link>
      {Number.isSafeInteger(productId) && productId > 0 ? (
        <ProductDetails key={id} productId={productId} />
      ) : (
        <PageState type={notFound.type} message={notFound.message} />
      )}
    </>
  );
}
