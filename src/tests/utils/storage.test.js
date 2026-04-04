import { describe, it, expect } from 'vitest'
import { toCdnUrl } from '../../utils/storage.js'

const BUCKET = 'my-app.appspot.com'

describe('toCdnUrl', () => {
  it('converts a Firebase Storage URL to CDN URL', () => {
    const firebaseUrl =
      `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/stores%2Fstore1%2Fproducts%2Fimage.jpg?alt=media&token=abc123`
    expect(toCdnUrl(firebaseUrl)).toBe(
      `https://storage.googleapis.com/${BUCKET}/stores/store1/products/image.jpg`
    )
  })

  it('passes through a non-Firebase URL unchanged', () => {
    const url = 'https://example.com/image.jpg'
    expect(toCdnUrl(url)).toBe(url)
  })

  it('passes through an already-converted CDN URL unchanged', () => {
    const cdnUrl = `https://storage.googleapis.com/${BUCKET}/stores/store1/products/image.jpg`
    expect(toCdnUrl(cdnUrl)).toBe(cdnUrl)
  })

  it('returns null/undefined as-is', () => {
    expect(toCdnUrl(null)).toBe(null)
    expect(toCdnUrl(undefined)).toBe(undefined)
  })

  it('handles encoded path with nested segments', () => {
    const url =
      `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/a%2Fb%2Fc.jpg?alt=media`
    expect(toCdnUrl(url)).toBe(`https://storage.googleapis.com/${BUCKET}/a/b/c.jpg`)
  })
})
