import { REPORT_REASONS, formatPrice } from "../data/constants.js";
import { AdminVisibilityBadge } from "./AdminProductList.jsx";
import StatusBadge from "./StatusBadge.jsx";

const reportDate = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

export default function AdminReportList({ reports, products, users, disabled, action, onReview }) {
  return (
    <ul className="grid gap-3 lg:grid-cols-2" aria-label="รายงานประกาศ">
      {reports.map((report) => {
        const product = products.find((item) => item.id === report.productId);
        const reporter = users.find((user) => user.id === report.reporterId);
        const title = product?.title || report.productTitle;
        const isSaving = action?.id === report.id;

        return (
          <li
            key={report.id}
            className="card-surface flex min-w-0 flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="min-w-0 text-lg leading-snug font-semibold break-words text-slate-900">{title}</h3>
              <StatusBadge status={report.status} />
            </div>
            {product ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-600">{formatPrice(product.price)}</span>
                <StatusBadge status={product.status} />
                <AdminVisibilityBadge isHidden={product.isHidden} />
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-600">ไม่พบประกาศแล้ว</p>
            )}
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="font-semibold text-slate-900">{REPORT_REASONS[report.reason]}</p>
              {report.details && <p className="mt-1 text-sm whitespace-pre-line break-words text-slate-700">{report.details}</p>}
            </div>
            <div className="text-sm break-words text-slate-600">
              <p><strong>ผู้รายงาน</strong> {reporter?.displayName || `ผู้ใช้ #${report.reporterId}`}</p>
              <p>แจ้งเมื่อ <time dateTime={report.createdAt}>{reportDate.format(new Date(report.createdAt))}</time></p>
              {report.reviewedAt && (
                <p>ตรวจเมื่อ <time dateTime={report.reviewedAt}>{reportDate.format(new Date(report.reviewedAt))}</time></p>
              )}
            </div>
            {report.status === "pending" && (
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className="btn-primary w-full sm:w-auto"
                  disabled={disabled}
                  onClick={() => onReview(report)}
                >
                  {isSaving && action.type === "review" ? "กำลังบันทึก…" : "ทำเครื่องหมายว่าตรวจแล้ว"}
                </button>
                {product && !product.isHidden && (
                  <button
                    type="button"
                    className="btn-secondary w-full sm:w-auto"
                    disabled={disabled}
                    onClick={() => onReview(report, product)}
                  >
                    {isSaving && action.type === "hide" ? "กำลังบันทึก…" : "ซ่อนประกาศและตรวจแล้ว"}
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
