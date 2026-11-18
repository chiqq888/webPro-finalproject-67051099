import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';

export default function NotFoundPage() {
  return (
    <section className="card-surface mx-auto mt-7 max-w-2xl px-4 py-16 text-center sm:px-10">
      <div className="mx-auto mb-5 grid size-12 place-items-center rounded-xl bg-orange-50 text-orange-700">
        <Icon name="search" />
      </div>
      <h1 className="page-title">ไม่พบหน้า</h1>
      <Link className="btn-primary mt-6" to="/users">
        กลับตลาดสินค้า
      </Link>
    </section>
  );
}
