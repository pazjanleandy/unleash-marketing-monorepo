import type { IconName } from './types'

type IconMarkProps = {
  name: IconName
}

function IconMark({ name }: IconMarkProps) {
  if (name === 'voucher') {
    return (
      <>
        <path d="M4 9.25V6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v2.75a1.75 1.75 0 0 0 0 3.5v2.75a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2.75a1.75 1.75 0 0 0 0-3.5Z" />
        <path d="M12 7.5v9" />
      </>
    )
  }

  if (name === 'discount') {
    return (
      <>
        <path d="M11.5 3.5 5 10l7.5 7.5L19 11V3.5h-7.5Z" />
        <circle cx="14.5" cy="7.7" r="0.8" fill="currentColor" stroke="none" />
      </>
    )
  }

  if (name === 'bundle') {
    return (
      <>
        <path d="M3.5 8.5 12 4l8.5 4.5L12 13 3.5 8.5Z" />
        <path d="M3.5 8.5v7L12 20l8.5-4.5v-7" />
        <path d="M12 13v7" />
      </>
    )
  }

  if (name === 'addon') {
    return (
      <>
        <path d="M7 9.5h10v8.75a1.75 1.75 0 0 1-1.75 1.75h-6.5A1.75 1.75 0 0 1 7 18.25V9.5Z" />
        <path d="M9.5 9.5V8a2.5 2.5 0 0 1 5 0v1.5" />
        <path d="M5 13h4m-2-2v4" />
      </>
    )
  }

  if (name === 'shipping') {
    return (
      <>
        <path d="M3.5 8.5h10.25v7.5H3.5z" />
        <path d="M13.75 11h3.6L20 13.65V16h-6.25v-5Z" />
        <circle cx="7" cy="17.5" r="1.5" />
        <circle cx="16.5" cy="17.5" r="1.5" />
      </>
    )
  }

  if (name === 'game') {
    return (
      <>
        <path d="M6.5 10.5h11a3 3 0 0 1 2.95 3.56l-.63 3.14a2.25 2.25 0 0 1-3.7 1.29l-1.56-1.33a4 4 0 0 0-5.12 0l-1.56 1.33a2.25 2.25 0 0 1-3.7-1.29l-.63-3.14A3 3 0 0 1 6.5 10.5Z" />
        <path d="M9 13.75h3m-1.5-1.5v3" />
        <circle cx="15.7" cy="13.6" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="17.7" cy="15.6" r="0.8" fill="currentColor" stroke="none" />
      </>
    )
  }

  if (name === 'follow') {
    return (
      <>
        <rect x="4" y="6.5" width="16" height="12" rx="2" />
        <path d="m4.5 9 7.5 5 7.5-5" />
        <path d="M18.5 5v4M16.5 7h4" />
      </>
    )
  }

  if (name === 'live') {
    return (
      <>
        <rect x="4" y="6.5" width="11.5" height="11" rx="2" />
        <path d="m9 10 4 2.25L9 14.5V10Z" fill="currentColor" stroke="none" />
        <path d="M15.5 10.25 20 8.5v7.5l-4.5-1.75v-4Z" />
      </>
    )
  }

  if (name === 'ads') {
    return (
      <>
        <path d="M5 10.5 16 7v10L5 13.5v-3Z" />
        <path d="M16 9.5h2a1.5 1.5 0 0 1 1.5 1.5v2A1.5 1.5 0 0 1 18 14.5h-2" />
        <path d="M7 14v3.25A1.75 1.75 0 0 0 8.75 19H10" />
      </>
    )
  }

  return (
    <>
      <path d="M12 4.5 14.25 9l5 .73-3.62 3.53.85 5-4.48-2.35-4.48 2.35.86-5L4.75 9.73l5-.73L12 4.5Z" />
    </>
  )
}

export default IconMark
