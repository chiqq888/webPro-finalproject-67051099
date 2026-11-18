import { PRODUCT_STATUSES, REPORT_STATUSES } from '../data/constants.js';

const styles = {
  available: 'bg-emerald-50 text-emerald-800',
  reserved: 'bg-amber-50 text-amber-900',
  sold: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-50 text-amber-900',
  reviewed: 'bg-emerald-50 text-emerald-800',
};

export default function StatusBadge({ status }) {
  const label =
    PRODUCT_STATUSES[status] || REPORT_STATUSES[status] || 'ไม่ทราบสถานะ';

  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs leading-tight font-bold ${styles[status] || styles.sold}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
