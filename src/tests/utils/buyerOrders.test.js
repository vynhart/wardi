import { describe, it, expect, beforeEach } from 'vitest'
import { saveOrderId, getOrderIds } from '../../utils/buyerOrders.js'

const STORE_A = 'store-aaa'
const STORE_B = 'store-bbb'

describe('buyerOrders', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty array when no orders saved', () => {
    expect(getOrderIds(STORE_A)).toEqual([])
  })

  it('saves an orderId and retrieves it', () => {
    saveOrderId(STORE_A, 'order-1')
    expect(getOrderIds(STORE_A)).toEqual(['order-1'])
  })

  it('accumulates multiple orderIds', () => {
    saveOrderId(STORE_A, 'order-1')
    saveOrderId(STORE_A, 'order-2')
    saveOrderId(STORE_A, 'order-3')
    expect(getOrderIds(STORE_A)).toEqual(['order-1', 'order-2', 'order-3'])
  })

  it('does not duplicate orderIds', () => {
    saveOrderId(STORE_A, 'order-1')
    saveOrderId(STORE_A, 'order-1')
    expect(getOrderIds(STORE_A)).toEqual(['order-1'])
  })

  it('keeps orders isolated per store', () => {
    saveOrderId(STORE_A, 'order-a1')
    saveOrderId(STORE_B, 'order-b1')
    expect(getOrderIds(STORE_A)).toEqual(['order-a1'])
    expect(getOrderIds(STORE_B)).toEqual(['order-b1'])
  })

  it('does not affect other stores when saving', () => {
    saveOrderId(STORE_A, 'order-a1')
    saveOrderId(STORE_A, 'order-a2')
    saveOrderId(STORE_B, 'order-b1')
    expect(getOrderIds(STORE_A)).toHaveLength(2)
    expect(getOrderIds(STORE_B)).toHaveLength(1)
  })
})
