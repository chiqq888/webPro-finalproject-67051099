import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import MyListingCard from '../components/MyListingCard.jsx';
import PageState from '../components/PageState.jsx';
import { CURRENT_USER_ID, PRODUCT_STATUSES } from '../data/constants.js';
import { deleteProduct, getProducts, updateProduct } from '../services/api.js';

export default function MyListingsPage() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [workingProductId, setWorkingProductId] = useState(null);
  const [message, setMessage] = useState(location.state?.message ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const allProducts = await getProducts(controller.signal);
        if (controller.signal.aborted) return;

        const myProducts = allProducts.filter(
          (product) => product.sellerId === CURRENT_USER_ID,
        );
        myProducts.sort(
          (first, second) =>
            new Date(second.createdAt) - new Date(first.createdAt),
        );
        setProducts(myProducts);
      } catch (requestError) {
        if (!controller.signal.aborted) setLoadError(requestError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProducts();
    return () => controller.abort();
  }, [reloadCount]);

  function handleRetry() {
    setLoadError('');
    setLoading(true);
    setReloadCount((count) => count + 1);
  }

  async function handleStatusChange(product, status) {
    if (product.sellerId !== CURRENT_USER_ID || workingProductId !== null)
      return;
    if (!Object.hasOwn(PRODUCT_STATUSES, status) || product.status === status)
      return;

    setWorkingProductId(product.id);
    setMessage('');
    setError('');

    try {
      // เปลี่ยนเฉพาะสถานะขาย ประกาศที่ถูกซ่อนจึงยังคงถูกซ่อน
      const updatedProduct = await updateProduct(product.id, {
        status,
        updatedAt: new Date().toISOString(),
      });
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? updatedProduct : item)),
      );
      setMessage('เปลี่ยนสถานะการขายสำเร็จ');
    } catch (requestError) {
      const message =
        requestError.status === 404 ? 'ไม่พบประกาศนี้' : requestError.message;
      setError(`เปลี่ยนสถานะไม่สำเร็จ ${message}`);
    } finally {
      setWorkingProductId(null);
    }
  }

  async function handleDelete(product) {
    if (product.sellerId !== CURRENT_USER_ID || workingProductId !== null)
      return;
    if (!window.confirm(`ยืนยันการลบประกาศ “${product.title}” หรือไม่?`)) return;

    setWorkingProductId(product.id);
    setMessage('');
    setError('');

    try {
      await deleteProduct(product.id);
      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );
      setMessage('ลบประกาศสำเร็จ');
    } catch (requestError) {
      const message =
        requestError.status === 404 ? 'ไม่พบประกาศนี้' : requestError.message;
      setError(`ลบประกาศไม่สำเร็จ ${message}`);
    } finally {
      setWorkingProductId(null);
    }
  }

  return (
    <section aria-labelledby="my-listings-title">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 id="my-listings-title" className="page-title">
          ประกาศของฉัน
        </h1>
        <Link to="/users/sell" className="btn-primary">
          <Icon name="add" className="size-4" />
          ลงขายสินค้า
        </Link>
      </div>

      {message && (
        <p
          className="mb-5 rounded-xl bg-orange-50 px-4 py-3 text-sm font-medium text-orange-900"
          role="status"
        >
          {message}
        </p>
      )}
      {error && (
        <p
          className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
      {loading && <PageState type="loading" message="กำลังโหลดประกาศของฉัน…" />}
      {loadError && (
        <PageState type="error" message={loadError} onRetry={handleRetry} />
      )}
      {!loading && !loadError && products.length === 0 && (
        <PageState type="empty" message="คุณยังไม่มีประกาศสินค้า" />
      )}

      <div className="grid gap-4">
        {products.map((product) => (
          <MyListingCard
            key={product.id}
            product={product}
            busy={workingProductId === product.id}
            disabled={workingProductId !== null}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </section>
  );
}
