import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AdminVisibilityBadge } from '../components/AdminProductList.jsx';
import Icon from '../components/Icon.jsx';
import PageState from '../components/PageState.jsx';
import ProductImage from '../components/ProductImage.jsx';
import ReportForm from '../components/ReportForm.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { CATEGORIES, CONDITIONS, formatPrice } from '../data/constants.js';
import { getProductVideoSource } from '../data/product-media.js';
import {
  createReport,
  getMyReports,
  getProduct,
  getUsers,
} from '../services/api.js';

const notFound = { type: 'empty', message: 'ไม่พบสินค้า' };
const hidden = { type: 'empty', message: 'ประกาศนี้ไม่พร้อมแสดง' };
const loading = { type: 'loading', message: 'กำลังโหลดรายละเอียดสินค้า…' };

function SellerContact({ seller, contact }) {
  const channels = [
    {
      icon: 'line',
      label: 'LINE ID',
      value: contact?.lineId,
      iconStyle: 'bg-green-100 text-green-800',
    },
    {
      icon: 'instagram',
      label: 'Instagram',
      value: contact?.instagram,
      iconStyle: 'bg-pink-100 text-pink-800',
    },
    {
      icon: 'phone',
      label: 'เบอร์โทร',
      value: contact?.phone,
      iconStyle: 'bg-orange-100 text-orange-800',
    },
  ];

  return (
    <section className="mt-5" aria-labelledby="seller-heading">
      <h2 id="seller-heading" className="text-lg font-bold">
        ติดต่อผู้ขาย
      </h2>
      {seller ? (
        <p className="mt-1 wrap-anywhere font-medium text-slate-700">
          {seller.displayName}
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-600">ไม่พบข้อมูลผู้ขาย</p>
      )}
      {contact && (
        <dl className="mt-3 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-stone-50">
          {channels.map(({ icon, label, value, iconStyle }) => (
            <div
              key={icon}
              className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2 px-2.5 py-2.5 sm:gap-3 sm:px-3"
            >
              <dt className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg ${iconStyle}`}
                >
                  <Icon name={icon} className="size-[18px]" />
                </span>
                {label}
              </dt>
              <dd className="wrap-anywhere font-semibold">
                {value ? (
                  icon === 'phone' ? (
                    <a
                      className="text-orange-800 underline underline-offset-4 hover:text-orange-950"
                      href={`tel:${value.replace(/[\s().-]/g, '')}`}
                    >
                      {value}
                    </a>
                  ) : (
                    value
                  )
                ) : (
                  <span className="text-sm font-normal text-slate-600">
                    ยังไม่ระบุ
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function ProductVideo({ source }) {
  const [failed, setFailed] = useState(false);

  let player;
  if (source.type === 'youtube') {
    player = (
      <>
        <iframe
          src={`https://www.youtube.com/embed/${source.id}?playsinline=1`}
          title="วิดีโอสินค้าบน YouTube"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="encrypted-media; picture-in-picture"
          allowFullScreen
          className="mt-3 block aspect-video min-h-[200px] w-full rounded-xl bg-black"
        />
        <a
          href={`https://www.youtube.com/watch?v=${source.id}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm font-semibold text-orange-800 underline underline-offset-4 hover:text-orange-950"
        >
          เปิดบน YouTube
        </a>
      </>
    );
  } else if (failed) {
    player = (
      <p className="mt-3 text-sm text-slate-600" role="status">
        เปิดวิดีโอสินค้าไม่ได้
      </p>
    );
  } else {
    player = (
      <video
        src={source.src}
        controls
        playsInline
        preload="metadata"
        aria-labelledby="product-video-heading"
        className="mt-3 aspect-video w-full rounded-xl bg-black object-contain"
        onError={() => setFailed(true)}
      >
        เบราว์เซอร์นี้ไม่รองรับการเล่นวิดีโอ
      </video>
    );
  }

  return (
    <section
      className="card-surface min-w-0 p-5 sm:p-7"
      aria-labelledby="product-video-heading"
    >
      <h2 id="product-video-heading" className="text-lg font-bold">
        วิดีโอสินค้า
      </h2>
      {player}
    </section>
  );
}

function ProductDetails({ productId, user, pathname }) {
  const [page, setPage] = useState(loading);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [showReportForm, setShowReportForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedReport, setSubmittedReport] = useState(false);
  const userId = user?.id;
  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'user';

  useEffect(() => {
    const controller = new AbortController();

    async function loadDetails() {
      let product;
      try {
        product = await getProduct(productId, controller.signal);
        if (controller.signal.aborted) return;
        if (product.isHidden === true && !isAdmin) {
          setPage(hidden);
          return;
        }

        const [users, reports] = await Promise.all([
          getUsers(controller.signal),
          isMember && product.sellerId !== userId
            ? getMyReports(controller.signal)
            : [],
        ]);
        if (controller.signal.aborted) return;

        setPage({
          type: 'ready',
          product,
          seller: users.find((user) => user.id === product.sellerId),
          alreadyReported: reports.some(
            (report) => report.productId === product.id,
          ),
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!product && error.status === 404) {
          setPage(notFound);
        } else {
          setPage({
            type: 'error',
            message: `โหลดรายละเอียดสินค้าไม่สำเร็จ ${error.message}`,
          });
        }
      }
    }

    loadDetails();
    return () => controller.abort();
  }, [productId, userId, isAdmin, isMember, loadAttempt]);

  function handleRetry() {
    setPage(loading);
    setLoadAttempt((attempt) => attempt + 1);
  }

  async function handleReportSubmit({ reason, details }) {
    if (
      !isMember ||
      submitting ||
      page.type !== 'ready' ||
      page.product.sellerId === userId ||
      page.alreadyReported
    )
      return;

    setSubmitting(true);
    setSubmitError('');
    try {
      await createReport({ productId, reason, details });

      setSubmittedReport(true);
      setPage({ ...page, alreadyReported: true });
      setShowReportForm(false);
    } catch (error) {
      if (error.status === 404) {
        setPage(notFound);
      } else if (error.status === 409) {
        // หากส่งจากอีกแท็บแล้ว เซิร์ฟเวอร์จะปฏิเสธรายงานซ้ำ
        setPage({ ...page, alreadyReported: true });
        setShowReportForm(false);
      } else {
        setSubmitError(`ส่งรายงานไม่สำเร็จ ${error.message} กรุณาลองส่งอีกครั้ง`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleReportCancel() {
    setSubmitError('');
    setShowReportForm(false);
  }

  if (page.type !== 'ready') {
    return (
      <PageState
        type={page.type}
        message={page.message}
        onRetry={page.type === 'error' ? handleRetry : undefined}
      />
    );
  }

  const { product, seller, alreadyReported } = page;
  const videoSource = getProductVideoSource(product.videoUrl);
  const isOwner = isMember && product.sellerId === userId;

  return (
    <article className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start lg:gap-7">
      <figure className="card-surface overflow-hidden bg-stone-100">
        <ProductImage
          src={product.imageUrl}
          alt={product.title}
          className="aspect-[4/3] w-full object-cover"
        />
      </figure>

      <section
        className="card-surface min-w-0 p-5 sm:p-7 lg:row-span-2"
        aria-label="ข้อมูลการซื้อขาย"
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-800">
            {CATEGORIES[product.category]}
          </span>
          <StatusBadge status={product.status} />
          {isAdmin && product.isHidden && <AdminVisibilityBadge isHidden />}
        </div>
        <h1 className="page-title wrap-anywhere">{product.title}</h1>
        <p className="mt-3 text-3xl font-bold tracking-tight text-orange-700">
          {formatPrice(product.price)}
        </p>

        <dl className="mt-6 grid gap-4 border-y border-stone-100 py-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-600">สภาพสินค้า</dt>
            <dd className="mt-1 font-medium">
              {CONDITIONS[product.condition]}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-600">จุดนัดรับ</dt>
            <dd className="mt-1 wrap-anywhere font-medium">
              {product.pickupLocation}
            </dd>
          </div>
        </dl>

        <SellerContact seller={seller} contact={product.contact} />

        {isOwner && (
          <Link
            to={`/users/products/${product.id}/edit`}
            className="btn-secondary mt-6"
          >
            แก้ไขประกาศของฉัน
          </Link>
        )}
      </section>

      <div className="min-w-0 space-y-5">
        {videoSource && (
          <ProductVideo key={product.videoUrl} source={videoSource} />
        )}

        <section
          className="card-surface p-5 sm:p-7"
          aria-labelledby="description-heading"
        >
          <h2 id="description-heading" className="text-lg font-bold">
            รายละเอียดสินค้า
          </h2>
          <p className="mt-3 wrap-anywhere whitespace-pre-wrap text-slate-700">
            {product.description}
          </p>
        </section>

        {!isAdmin && !isOwner && (
          <section
            className="card-surface p-5 sm:p-7"
            aria-label="รายงานประกาศ"
          >
            {alreadyReported && (
              <p className="text-sm font-medium text-slate-700" role="status">
                {submittedReport
                  ? 'ส่งรายงานแล้ว ผู้ดูแลจะตรวจสอบประกาศนี้'
                  : 'คุณเคยรายงานประกาศนี้แล้ว'}
              </p>
            )}
            {!user && (
              <Link
                to="/login"
                state={{ from: pathname }}
                className="btn-secondary"
              >
                เข้าสู่ระบบเพื่อรายงานประกาศ
              </Link>
            )}
            {isMember && !alreadyReported && !showReportForm && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowReportForm(true)}
              >
                รายงานประกาศ
              </button>
            )}
            {isMember && !alreadyReported && showReportForm && (
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

export default function ProductDetailsPage({ user }) {
  const { id } = useParams();
  const { pathname, state } = useLocation();
  const productId = Number(id);
  const isAdmin = user?.role === 'admin';
  const marketPath = isAdmin ? '/admin' : '/users';
  const fromReports = isAdmin && state?.fromReports === true;

  return (
    <>
      <Link
        to={fromReports ? '/admin?tab=reports' : marketPath}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-800"
      >
        <span aria-hidden="true">←</span>{' '}
        {fromReports ? 'กลับไปรายงาน' : 'กลับตลาดสินค้า'}
      </Link>
      {Number.isSafeInteger(productId) && productId > 0 ? (
        <ProductDetails
          key={id}
          productId={productId}
          user={user}
          pathname={pathname}
        />
      ) : (
        <PageState type={notFound.type} message={notFound.message} />
      )}
    </>
  );
}
