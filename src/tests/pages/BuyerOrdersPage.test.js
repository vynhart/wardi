import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { getDoc } from 'firebase/firestore'
import { saveOrderId } from '../../utils/buyerOrders.js'
import BuyerOrdersPage from '../../pages/BuyerOrdersPage.vue'

const STORE_ID = 'store-abc'
const mockBack = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { storeId: STORE_ID } }),
  useRouter: () => ({ back: mockBack }),
}))

vi.mock('../../components/IconButton.vue', () => ({
  default: { template: '<button />' },
}))

function makeOrderSnap(order) {
  return { exists: () => true, id: order.id, data: () => order }
}

function mountPage() {
  return mount(BuyerOrdersPage, {
    global: { stubs: { 'iconify-icon': { template: '<span />' } } },
  })
}

describe('BuyerOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows empty state when no orders in localStorage', async () => {
    const wrapper = mountPage()
    await new Promise((r) => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.empty-title').exists()).toBe(true)
    expect(wrapper.find('.empty-title').text()).toContain('No orders yet')
  })

  it('does not call getDoc when no order IDs saved', async () => {
    mountPage()
    await new Promise((r) => setTimeout(r, 0))
    expect(getDoc).not.toHaveBeenCalled()
  })

  it('calls getDoc for each saved order ID', async () => {
    saveOrderId(STORE_ID, 'order-1')
    saveOrderId(STORE_ID, 'order-2')
    getDoc.mockResolvedValue({ exists: () => false })
    mountPage()
    await new Promise((r) => setTimeout(r, 0))
    expect(getDoc).toHaveBeenCalledTimes(2)
  })

  it('renders order cards for fetched orders', async () => {
    saveOrderId(STORE_ID, 'order-1')
    const order = {
      id: 'order-1',
      orderNumber: 10025,
      status: 'pending',
      total: 130,
      createdAt: null,
      items: [{ product: { id: 'p1', name: 'Ceramic Vase', price: 65, imageUrl: '' }, qty: 2 }],
    }
    getDoc.mockResolvedValueOnce(makeOrderSnap(order))

    const wrapper = mountPage()
    await new Promise((r) => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.order-id').text()).toBe('Order #10025')
    expect(wrapper.find('.order-total-value').exists()).toBe(true)
  })

  it('skips orders where the document does not exist', async () => {
    saveOrderId(STORE_ID, 'order-ghost')
    getDoc.mockResolvedValueOnce({ exists: () => false })

    const wrapper = mountPage()
    await new Promise((r) => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.empty-title').exists()).toBe(true)
  })

  it('shows correct status badge class for pending', async () => {
    saveOrderId(STORE_ID, 'order-1')
    const order = {
      id: 'order-1',
      orderNumber: 10001,
      status: 'pending',
      total: 50,
      createdAt: null,
      items: [{ product: { id: 'p1', name: 'Item', price: 50, imageUrl: '' }, qty: 1 }],
    }
    getDoc.mockResolvedValueOnce(makeOrderSnap(order))

    const wrapper = mountPage()
    await new Promise((r) => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.status-active').exists()).toBe(true)
  })

  it('shows correct status badge class for completed', async () => {
    saveOrderId(STORE_ID, 'order-1')
    const order = {
      id: 'order-1',
      orderNumber: 10001,
      status: 'completed',
      total: 50,
      createdAt: null,
      items: [{ product: { id: 'p1', name: 'Item', price: 50, imageUrl: '' }, qty: 1 }],
    }
    getDoc.mockResolvedValueOnce(makeOrderSnap(order))

    const wrapper = mountPage()
    await new Promise((r) => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.status-completed').exists()).toBe(true)
  })

  it('opens detail sheet when View Details is clicked', async () => {
    saveOrderId(STORE_ID, 'order-1')
    const order = {
      id: 'order-1',
      orderNumber: 10025,
      status: 'pending',
      total: 65,
      createdAt: null,
      items: [{ product: { id: 'p1', name: 'Ceramic Vase', price: 65, imageUrl: '' }, qty: 1 }],
    }
    getDoc.mockResolvedValueOnce(makeOrderSnap(order))

    const wrapper = mountPage()
    await new Promise((r) => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    await wrapper.find('.btn-outline').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.sheet-panel').exists()).toBe(true)
    expect(wrapper.find('.sheet-title').text()).toContain('10025')
  })

  it('closes detail sheet when X is clicked', async () => {
    saveOrderId(STORE_ID, 'order-1')
    const order = {
      id: 'order-1',
      orderNumber: 10025,
      status: 'pending',
      total: 65,
      createdAt: null,
      items: [{ product: { id: 'p1', name: 'Item', price: 65, imageUrl: '' }, qty: 1 }],
    }
    getDoc.mockResolvedValueOnce(makeOrderSnap(order))

    const wrapper = mountPage()
    await new Promise((r) => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    await wrapper.find('.btn-outline').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.sheet-panel').exists()).toBe(true)

    await wrapper.find('.sheet-close').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.sheet-panel').exists()).toBe(false)
  })
})
