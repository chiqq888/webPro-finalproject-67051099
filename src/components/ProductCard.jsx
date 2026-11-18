import { Link } from 'react-router-dom'
import { CATEGORIES, CONDITIONS, formatPrice } from '../data/constants.js'
import Icon from './Icon.jsx'
import ProductImage from './ProductImage.jsx'
import StatusBadge from './StatusBadge.jsx'

export default function ProductCard({ product }) {
  return (
    <article className="card-surface min-w-0 shadow-[0_2px_7px_#24190908] transition-shadow hover:shadow-md">
      <Link to={`/users/products/${product.id}`} className="group flex h-full flex-col rounded-2xl" aria-label={product.title}>
        <div className="relative aspect-[5/4] w-full shrink-0 overflow-hidden rounded-t-[15px] bg-stone-100">
          <ProductImage src={product.imageUrl} alt={product.title} className="size-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" />
          <div className="absolute top-2.5 left-2.5">
            <StatusBadge status={product.status} />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-800">
            <Icon name={product.category} className="size-3.5 shrink-0" />
            {CATEGORIES[product.category]}
          </p>
          <h3 className="mt-1 line-clamp-2 text-base leading-snug font-bold break-words text-slate-900 group-hover:text-orange-800">{product.title}</h3>
          <p className="mt-1.5 text-xs text-slate-600">{CONDITIONS[product.condition]}</p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <p className="min-w-0 text-xl leading-tight font-bold break-words text-orange-800">{formatPrice(product.price)}</p>
            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-stone-200 text-slate-600 group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-800">
              <Icon name="chevron" className="size-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
