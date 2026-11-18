import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import PageState from '../components/PageState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { CATEGORIES, CURRENT_USER_ID, PRODUCT_STATUSES, formatPrice } from '../data/constants.js'
import { deleteProduct, getProducts, updateProduct } from '../services/api.js'

export default function MyListingsPage() {
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)
  const [workingProductId, setWorkingProductId] = useState(null)
  const [message, setMessage] = useState(location.state?.message ?? '')
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        const allProducts = await getProducts(controller.signal)
        if (controller.signal.aborted) return

        const myProducts = allProducts.filter((product) => product.sellerId === CURRENT_USER_ID)
        myProducts.sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
        setProducts(myProducts)
      } catch (requestError) {
        if (!controller.signal.aborted) setLoadError(requestError.message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadProducts()
    return () => controller.abort()
  }, [reloadCount])

  function handleRetry() {
    setLoadError('')
    setLoading(true)
    setReloadCount((count) => count + 1)
  }

  async function handleStatusChange(product, status) {
    if (product.sellerId !== CURRENT_USER_ID || workingProductId !== null) return
    if (!Object.hasOwn(PRODUCT_STATUSES, status) || product.status === status) return

    setWorkingProductId(product.id)
    setMessage('')
    setError('')

    try {
      // เปลี่ยนเฉพาะสถานะขาย ประกาศที่ถูกซ่อนจึงยังคงถูกซ่อน
      const updatedProduct = await updateProduct(product.id, { status, updatedAt: new Date().toISOString() })
      setProducts((current) => current.map((item) => item.id === product.id ? updatedProduct : item))
      setMessage('เปลี่ยนสถานะการขายสำเร็จ')
    } catch (requestError) {
      const message = requestError.status === 404 ? 'ไม่พบประกาศนี้' : requestError.message
      setError(`เปลี่ยนสถานะไม่สำเร็จ ${message}`)
    } finally {
      setWorkingProductId(null)
    }
  }

  async function handleDelete(product) {
    if (product.sellerId !== CURRENT_USER_ID || workingProductId !== null) return
    if (!window.confirm(`ยืนยันการลบประกาศ “${product.title}” หรือไม่?`)) return

    setWorkingProductId(product.id)
    setMessage('')
    setError('')

    try {
      await deleteProduct(product.id)
      setProducts((current) => current.filter((item) => item.id !== product.id))
      setMessage('ลบประกาศสำเร็จ')
    } catch (requestError) {
      const message = requestError.status === 404 ? 'ไม่พบประกาศนี้' : requestError.message
      setError(`ลบประกาศไม่สำเร็จ ${message}`)
    } finally {
      setWorkingProductId(null)
    }
  }

  return (
    <section aria-labelledby="my-listings-title">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 id="my-listings-title" className="page-title">ประกาศของฉัน</h1>
        <Link to="/users/sell" className="btn-primary">
          <Icon name="add" className="size-4" />
          ลงขายสินค้า
        </Link>
      </div>

      {message && <p className="mb-5 rounded-xl bg-orange-50 px-4 py-3 text-sm font-medium text-orange-900" role="status">{message}</p>}
      {error && <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
      {loading && <PageState type="loading" message="กำลังโหลดประกาศของฉัน…" />}
      {loadError && <PageState type="error" message={loadError} onRetry={handleRetry} />}
      {!loading && !loadError && products.length === 0 && <PageState type="empty" message="คุณยังไม่มีประกาศสินค้า" />}

      <div className="grid gap-4">
        {products.map((product) => (
          <article key={product.id} className="card-surface flex min-w-0 flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between" aria-busy={workingProductId === product.id}>
            <div className="flex min-w-0 items-start gap-4 sm:items-center">
              <ProductImage src={product.imageUrl} alt={product.title} className="size-20 shrink-0 rounded-xl bg-stone-100 object-cover sm:size-24" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-600">{CATEGORIES[product.category]}</p>
                <h2 className="mt-1 text-base font-bold wrap-anywhere text-slate-900 sm:text-lg">
                  {product.isHidden ? product.title : (
                    <Link className="hover:text-orange-700" to={`/users/products/${product.id}`}>{product.title}</Link>
                  )}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="mr-1 font-bold text-orange-700">{formatPrice(product.price)}</p>
                  <StatusBadge status={product.status} />
                  {product.isHidden && <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-700">ถูกผู้ดูแลซ่อน</span>}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-end gap-2 border-t border-stone-100 pt-3 lg:w-auto lg:shrink-0 lg:border-0 lg:pt-0">
              <label className="grid min-w-0 grow gap-1.5 text-xs font-semibold text-slate-600 lg:grow-0">
                สถานะการขาย
                <select
                  className="field-control w-full text-sm lg:w-36"
                  value={product.status}
                  onChange={(event) => handleStatusChange(product, event.target.value)}
                  disabled={workingProductId !== null}
                >
                  {Object.entries(PRODUCT_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <Link className="btn-secondary" to={`/users/products/${product.id}/edit`}>แก้ไข</Link>
              <button
                className="min-h-11 rounded-xl px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                type="button"
                disabled={workingProductId !== null}
                onClick={() => handleDelete(product)}
              >
                ลบ
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
