import { useEffect, useState } from 'react'

type ProductThumbnailSize = 'xs' | 'sm' | 'md'

type ProductThumbnailProps = {
  name: string
  image: string | null
  size?: ProductThumbnailSize
  className?: string
  title?: string
}

const sizeClasses: Record<ProductThumbnailSize, string> = {
  xs: 'h-7 w-7 rounded text-[10px]',
  sm: 'h-9 w-9 rounded-md text-xs',
  md: 'h-12 w-12 rounded-lg text-sm',
}

function ProductThumbnail({
  name,
  image,
  size = 'md',
  className = '',
  title,
}: ProductThumbnailProps) {
  const [hasImageError, setHasImageError] = useState(false)

  useEffect(() => {
    setHasImageError(false)
  }, [image])

  const label = name.trim().slice(0, 1).toUpperCase() || 'P'
  const showImage = Boolean(image) && !hasImageError
  const baseClassName = `inline-flex flex-none items-center justify-center overflow-hidden border border-[#D0DBF7] bg-gradient-to-br from-[#F2F4FF] via-[#E6EBFF] to-[#D0DBF7] font-bold text-[#3347A8] shadow-[0_8px_14px_-12px_rgba(51,69,143,0.45)] ${sizeClasses[size]} ${className}`.trim()

  return (
    <div className={baseClassName} title={title ?? name} aria-hidden={!showImage}>
      {showImage ? (
        <img
          src={image ?? ''}
          alt={name}
          loading="lazy"
          onError={() => setHasImageError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        label
      )}
    </div>
  )
}

export default ProductThumbnail
