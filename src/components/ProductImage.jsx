import { useState } from 'react'

const fallbackImage = '/images/placeholder.svg'

function ImageWithFallback({ src, alt, className, loading = 'lazy' }) {
  const [failed, setFailed] = useState(false)
  const imageUrl = failed || !src ? fallbackImage : src

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      loading={loading}
      onError={imageUrl === fallbackImage ? undefined : () => setFailed(true)}
    />
  )
}

export default function ProductImage(props) {
  // เมื่อ URL เปลี่ยน จะลองโหลดรูปใหม่อีกครั้ง
  return <ImageWithFallback key={props.src} {...props} />
}
