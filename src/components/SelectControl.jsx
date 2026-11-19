import Icon from './Icon.jsx';

export default function SelectControl({ children, className = '', ...props }) {
  return (
    <span className="relative block min-w-0">
      <select
        {...props}
        className={`field-control appearance-none pr-9 forced-colors:appearance-auto forced-colors:pr-3 ${className}`}
      >
        {children}
      </select>
      <Icon
        name="chevron"
        className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 rotate-90 text-slate-600 forced-colors:hidden"
      />
    </span>
  );
}
