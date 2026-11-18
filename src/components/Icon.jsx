const paths = {
  bag: 'M5 8h14l1.6 12H3.4L5 8ZM9 10V6a3 3 0 0 1 6 0v4',
  search: 'M18.5 18.5 22 22M20 11a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  add: 'M12 5v14M5 12h14',
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  filter: 'M4 7h16M4 17h16M8 5v4m8 6v4',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  books: 'M4 19V5a1 1 0 0 1 1-1h5l2 2 2-2h5a1 1 0 0 1 1 1v14h-6l-2 1-2-1H4Zm8-13v14',
  computers: 'M3 5h18v12H3zM8 21h8m-4-4v4',
  electronics: 'm13 2-8 12h6l-1 8 9-12h-7l1-8Z',
  household: 'm3 11 9-7 9 7m-16-1v10h14V10m-9 10v-6h4v6',
  other: 'M5 12h.01M12 12h.01M19 12h.01',
  reset: 'M3 11a9 9 0 1 1 2 6M3 5v6h6',
  chevron: 'm9 6 6 6-6 6',
  line: 'M21 11c0 4.4-4.4 7.4-9.7 9l.4-2.5C6.8 17.3 3 14.6 3 11c0-3.9 4-7 9-7s9 3.1 9 7ZM8 11h.01m4 0h.01m4 0h.01',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm9 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm1.5-5.5h.01',
  phone: 'm8 3 2.2 4.7a1.5 1.5 0 0 1-.3 1.6L8.6 10.6a13 13 0 0 0 4.8 4.8l1.3-1.3a1.5 1.5 0 0 1 1.6-.3L21 16v2a3 3 0 0 1-3 3A15 15 0 0 1 3 6a3 3 0 0 1 3-3h2Z',
}

export default function Icon({ name, className = 'size-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  )
}
