/**
 * Converts a Firebase Storage download URL to a CDN-served GCS URL.
 *
 * https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media&token=...
 * →
 * https://storage.googleapis.com/{bucket}/{path}
 *
 * The bucket must have allUsers Storage Object Viewer access granted.
 * Already-converted URLs and non-Firebase URLs are returned unchanged.
 */
export function toCdnUrl(url) {
  if (!url) return url
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'firebasestorage.googleapis.com') return url
    // pathname: /v0/b/{bucket}/o/{encodedPath}
    const parts = parsed.pathname.split('/')
    const bucket = parts[3]
    const path = decodeURIComponent(parts.slice(5).join('/'))
    return `https://storage.googleapis.com/${bucket}/${path}`
  } catch {
    return url
  }
}
