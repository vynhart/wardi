import { describe, it, expect } from 'vitest'
import { formatPrice } from '../../utils/format.js'

describe('formatPrice', () => {
  it('formats a whole number', () => {
    expect(formatPrice(10)).toBe('$10.00')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('$0.00')
  })

  it('formats a large number with comma separator', () => {
    expect(formatPrice(1234.5)).toBe('$1,234.50')
  })

  it('formats null/undefined as $0.00', () => {
    expect(formatPrice(null)).toBe('$0.00')
    expect(formatPrice(undefined)).toBe('$0.00')
  })

  it('formats fractional cents correctly', () => {
    expect(formatPrice(9.99)).toBe('$9.99')
  })
})
