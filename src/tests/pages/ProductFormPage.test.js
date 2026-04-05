import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ProductFormPage from '../../pages/ProductFormPage.vue'
import { useAuthStore } from '../../stores/auth.js'
import { getDoc, getDocs } from 'firebase/firestore'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { storeId: 'store-1', productId: undefined } }),
  useRouter: () => ({ back: vi.fn(), replace: vi.fn() }),
}))

vi.mock('../../components/IconButton.vue', () => ({
  default: { template: '<button />' },
}))

vi.mock('../../composables/useImageCompression.js', () => ({
  compressImage: vi.fn((f) => Promise.resolve(f)),
}))

vi.mock('../../utils/storage.js', () => ({
  toCdnUrl: (url) => url,
}))

function makeWrapper(imageUrls = []) {
  setActivePinia(createPinia())

  // Simulate logged-in owner
  const authStore = useAuthStore()
  authStore.user = { uid: 'owner-uid' }

  getDoc.mockResolvedValue({
    exists: () => true,
    data: () => ({ ownerUid: 'owner-uid', name: 'Test Store' }),
  })
  getDocs.mockResolvedValue({ docs: [], forEach: () => {} })

  const wrapper = mount(ProductFormPage, {
    global: { stubs: { 'iconify-icon': { template: '<span />' } } },
  })

  // Directly seed imageUrls after mount to skip upload flow
  wrapper.vm.form.imageUrls = [...imageUrls]

  return wrapper
}

describe('ProductFormPage – image reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "Cover" chip on the first image and numbered chips on the rest', async () => {
    const wrapper = makeWrapper(['url-a', 'url-b', 'url-c'])
    await flushPromises()
    const chips = wrapper.findAll('.image-chip')
    expect(chips[0].text()).toBe('Cover')
    expect(chips[1].text()).toBe('2')
    expect(chips[2].text()).toBe('3')
  })

  it('swaps images when dragged past the threshold', async () => {
    const wrapper = makeWrapper(['url-a', 'url-b'])
    await flushPromises()

    const handles = wrapper.findAll('.reorder-handle')

    // Start dragging item at index 0 (url-a)
    await handles[0].trigger('pointerdown', { clientX: 0 })

    // Move pointer past the 60px threshold to the right
    const moveEvent = Object.assign(new Event('pointermove', { cancelable: true }), { clientX: 70 })
    window.dispatchEvent(moveEvent)

    expect(wrapper.vm.form.imageUrls).toEqual(['url-b', 'url-a'])
    expect(wrapper.vm.draggingIndex).toBe(1)
  })

  it('does not swap when drag is below the threshold', async () => {
    const wrapper = makeWrapper(['url-a', 'url-b'])
    await flushPromises()

    const handles = wrapper.findAll('.reorder-handle')
    await handles[0].trigger('pointerdown', { clientX: 0 })

    const moveEvent = Object.assign(new Event('pointermove', { cancelable: true }), { clientX: 30 })
    window.dispatchEvent(moveEvent)

    expect(wrapper.vm.form.imageUrls).toEqual(['url-a', 'url-b'])
  })

  it('clears draggingIndex on pointerup', async () => {
    const wrapper = makeWrapper(['url-a', 'url-b'])
    await flushPromises()

    const handles = wrapper.findAll('.reorder-handle')
    await handles[0].trigger('pointerdown', { clientX: 0 })
    expect(wrapper.vm.draggingIndex).toBe(0)

    window.dispatchEvent(new Event('pointerup'))
    expect(wrapper.vm.draggingIndex).toBeNull()
  })

  it('does not swap past the first image when dragging left', async () => {
    const wrapper = makeWrapper(['url-a', 'url-b'])
    await flushPromises()

    const handles = wrapper.findAll('.reorder-handle')
    await handles[0].trigger('pointerdown', { clientX: 100 })

    const moveEvent = Object.assign(new Event('pointermove', { cancelable: true }), { clientX: 20 })
    window.dispatchEvent(moveEvent)

    // Already at index 0, cannot go further left
    expect(wrapper.vm.form.imageUrls).toEqual(['url-a', 'url-b'])
  })

  it('removes an image by clicking the X button', async () => {
    const wrapper = makeWrapper(['url-a', 'url-b', 'url-c'])
    await flushPromises()

    await wrapper.findAll('.remove-image-btn')[1].trigger('click')
    expect(wrapper.vm.form.imageUrls).toEqual(['url-a', 'url-c'])
  })

  it('applies dragging class to the active image card', async () => {
    const wrapper = makeWrapper(['url-a', 'url-b'])
    await flushPromises()

    const handles = wrapper.findAll('.reorder-handle')
    await handles[1].trigger('pointerdown', { clientX: 0 })

    const cards = wrapper.findAll('.uploaded-image-card')
    expect(cards[1].classes()).toContain('dragging')
    expect(cards[0].classes()).not.toContain('dragging')
  })
})
