import { CATEGORIES, CONDITIONS, formatPrice } from "../data/constants.js";
import ProductImage from "./ProductImage.jsx";
import StatusBadge from "./StatusBadge.jsx";

export function AdminVisibilityBadge({ isHidden }) {
  const style = isHidden ? "bg-slate-100 text-slate-700" : "bg-orange-50 text-orange-800";
  return (
    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      {isHidden ? "ถูกซ่อน" : "แสดงในตลาด"}
    </span>
  );
}

export default function AdminProductList({ products, users, disabled, action, onVisibilityChange }) {
  return (
    <table className="block w-full text-left lg:table lg:table-fixed" role="table" aria-label="ประกาศทั้งหมด">
      <thead className="hidden bg-stone-50 text-sm text-slate-600 lg:table-header-group">
        <tr role="row">
          <th scope="col" className="w-[52%] rounded-tl-xl px-5 py-3 font-semibold">ประกาศ</th>
          <th scope="col" className="w-[24%] px-5 py-3 font-semibold">สถานะ</th>
          <th scope="col" className="rounded-tr-xl px-5 py-3 text-right font-semibold">จัดการประกาศ</th>
        </tr>
      </thead>
      <tbody role="rowgroup" className="grid gap-3 lg:table-row-group">
        {products.map((product) => {
          const seller = users.find((user) => user.id === product.sellerId);
          const isSaving = action?.type === "visibility" && action.id === product.id;
          const buttonText = product.isHidden ? "คืนประกาศ" : "ซ่อนประกาศ";

          return (
            <tr
              key={product.id}
              role="row"
              className="block rounded-xl border border-stone-200 bg-white p-4 lg:table-row lg:rounded-none lg:border-x-0 lg:border-t-0 lg:p-0"
            >
              <td role="cell" className="block pb-3 align-top lg:table-cell lg:px-5 lg:py-4">
                <div className="flex items-start gap-3">
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.title}
                    className="size-16 shrink-0 rounded-lg bg-stone-100 object-cover sm:size-18"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold break-words text-slate-900">{product.title}</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {CATEGORIES[product.category]} · {CONDITIONS[product.condition]}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatPrice(product.price)}</p>
                  </div>
                </div>
                <details className="mt-2 text-sm text-slate-600">
                  <summary className="w-fit cursor-pointer rounded-sm font-medium text-orange-800">
                    ดูรายละเอียดประกาศ
                  </summary>
                  <p className="mt-2 whitespace-pre-line break-words">{product.description}</p>
                  <p className="mt-2 break-words"><strong>ผู้ขาย</strong> {seller?.displayName || `ผู้ใช้ #${product.sellerId}`}</p>
                  <p className="break-words"><strong>จุดนัดรับ</strong> {product.pickupLocation}</p>
                </details>
              </td>
              <td role="cell" className="block pb-3 align-top lg:table-cell lg:px-5 lg:py-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={product.status} />
                  <AdminVisibilityBadge isHidden={product.isHidden} />
                </div>
              </td>
              <td role="cell" className="block align-top lg:table-cell lg:px-5 lg:py-4 lg:text-right">
                <button
                  type="button"
                  className="btn-secondary w-full sm:w-auto"
                  disabled={disabled}
                  onClick={() => onVisibilityChange(product)}
                  aria-label={`${buttonText} ${product.title}`}
                >
                  {isSaving ? "กำลังบันทึก…" : buttonText}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
