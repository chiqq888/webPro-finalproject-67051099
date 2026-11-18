import Icon from './Icon.jsx';

export default function PageState({ type = 'empty', message, onRetry }) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className="card-surface flex flex-col items-center gap-4 px-5 py-12 text-center text-slate-700"
    >
      {type === 'loading' ? (
        <span
          aria-hidden="true"
          className="size-7 animate-spin rounded-full border-2 border-orange-100 border-t-orange-700 motion-reduce:animate-none"
        />
      ) : (
        <span className="grid size-11 place-items-center rounded-xl bg-orange-50 text-orange-700">
          <Icon name={type === 'error' ? 'reset' : 'search'} />
        </span>
      )}
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          ลองใหม่
        </button>
      )}
    </div>
  );
}
