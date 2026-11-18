import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import ProductForm from '../components/ProductForm.jsx'
import { CURRENT_USER_ID } from '../data/constants.js'
import { createProduct } from '../services/api.js'

export default function SellProductPage() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(productData) {
    if (saving) return

    setSaving(true)
    setError('')
    const now = new Date().toISOString()

    try {
      await createProduct({
        ...productData,
        sellerId: CURRENT_USER_ID,
        status: 'available',
        isHidden: false,
        createdAt: now,
        updatedAt: now,
      })
      navigate('/users/my-listings', { state: { message: 'ลงประกาศสำเร็จ' } })
    } catch (requestError) {
      setError(`ลงประกาศไม่สำเร็จ ${requestError.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-4xl">
      <Link to="/users" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-700">
        <Icon name="arrow" className="size-4 rotate-180" />
        กลับตลาดสินค้า
      </Link>
      <h1 className="page-title mb-6">ลงขายสินค้า</h1>
      <ProductForm onSubmit={handleSubmit} saving={saving} error={error} submitLabel="ลงประกาศ" />
    </section>
  )
}
