import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PageState from '../components/PageState.jsx';
import ProductForm from '../components/ProductForm.jsx';
import { getMyProduct, updateProduct } from '../services/api.js';

const forbiddenMessage = 'แก้ไขประกาศนี้ไม่ได้ เพราะเป็นประกาศของผู้ขายคนอื่น';

function EditProductContent({ id, userId }) {
  const [load, setLoad] = useState({ status: 'loading' });
  const [reloadCount, setReloadCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    async function loadProduct() {
      try {
        const product = await getMyProduct(id, controller.signal);
        if (!controller.signal.aborted) setLoad({ status: 'ready', product });
      } catch (requestError) {
        if (controller.signal.aborted) return;

        if (requestError.status === 404) {
          setLoad({ status: 'missing' });
        } else if (requestError.status === 403) {
          setLoad({ status: 'forbidden' });
        } else {
          setLoad({ status: 'error', message: requestError.message });
        }
      }
    }

    loadProduct();
    return () => controller.abort();
  }, [id, reloadCount]);

  function handleRetry() {
    setLoad({ status: 'loading' });
    setReloadCount((count) => count + 1);
  }

  async function handleSubmit(productData) {
    if (saving || load.product?.sellerId !== userId) return;

    setSaving(true);
    setError('');

    try {
      await updateProduct(id, productData);
      navigate('/users/my-listings', {
        state: { message: 'บันทึกการแก้ไขสำเร็จ' },
      });
    } catch (requestError) {
      let message = requestError.message;
      if (requestError.status === 404) message = 'ไม่พบประกาศที่ต้องการแก้ไข';
      if (requestError.status === 403) message = forbiddenMessage;
      setError(`บันทึกการแก้ไขไม่สำเร็จ ${message}`);
    } finally {
      setSaving(false);
    }
  }

  let content;
  if (load.status === 'loading') {
    content = <PageState type="loading" message="กำลังโหลดประกาศ…" />;
  } else if (load.status === 'missing') {
    content = <PageState type="empty" message="ไม่พบประกาศที่ต้องการแก้ไข" />;
  } else if (load.status === 'error') {
    content = (
      <PageState type="error" message={load.message} onRetry={handleRetry} />
    );
  } else if (load.status === 'forbidden' || load.product.sellerId !== userId) {
    content = <PageState type="empty" message={forbiddenMessage} />;
  } else {
    content = (
      <>
        {load.product.isHidden && (
          <p className="mb-4 rounded-xl bg-orange-50 px-4 py-3 text-sm font-medium text-orange-900">
            ประกาศนี้ถูกผู้ดูแลซ่อน
          </p>
        )}
        <ProductForm
          initialProduct={load.product}
          onSubmit={handleSubmit}
          saving={saving}
          error={error}
          submitLabel="บันทึกการแก้ไข"
        />
      </>
    );
  }

  return (
    <section className="mx-auto max-w-4xl">
      <Link
        to="/users/my-listings"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-700"
      >
        <Icon name="arrow" className="size-4 rotate-180" />
        กลับประกาศของฉัน
      </Link>
      <h1 className="page-title mb-6">แก้ไขประกาศ</h1>
      {content}
    </section>
  );
}

export default function EditProductPage({ user }) {
  const { id } = useParams();
  return (
    <EditProductContent
      id={Number(id)}
      userId={user.id}
      key={`${user.id}:${id}`}
    />
  );
}
