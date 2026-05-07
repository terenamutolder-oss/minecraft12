export async function getBufferFromStream (stream) {
  return new Promise((resolve, reject) => {
    let buffer = Buffer.from([])
    stream.on('data', buf => {
      buffer = Buffer.concat([buffer, buf])
    })
    stream.on('end', () => resolve(buffer))
    stream.on('error', reject)
  })
}

export function openURL (url, newTab = true) {
  if (newTab) {
    window.open(url, '_blank', 'noopener,noreferrer')
  } else {
    window.open(url, '_self')
  }
}

/**
 * Phones, tablets, iPad (including iPadOS “desktop” Safari), Android, and other coarse-pointer primary devices.
 * iPadOS 13+ often omits “Mobile” in the UA and may report MacIntel + touch points.
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(pointer: coarse)').matches) return true
  const ua = navigator.userAgent
  if (/Mobile|Android|iPhone|iPod|IEMobile|Opera Mini/i.test(ua)) return true
  if (/iPad/i.test(ua)) return true
  const platform = navigator.platform ?? ''
  if (platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData
  if (uaData?.mobile === true) return true
  return false
}

export function chunkPos (pos: { x: number, z: number }) {
  const x = Math.floor(pos.x / 16)
  const z = Math.floor(pos.z / 16)
  return [x, z]
}

export function sectionPos (pos: { x: number, y: number, z: number }) {
  const x = Math.floor(pos.x / 16)
  const y = Math.floor(pos.y / 16)
  const z = Math.floor(pos.z / 16)
  return [x, y, z]
}
