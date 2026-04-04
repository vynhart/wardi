import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { getDocs } from 'firebase/firestore'
import SearchPage from '../../pages/SearchPage.vue'

const STORE_ID = 'store-abc'
const RECENT_KEY = `wardi_recent_${STORE_ID}`

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { storeId: STORE_ID } }),
  useRouter: () => ({ back: vi.fn() }),
}))

vi.mock('../../components/IconButton.vue', () => ({
  default: { template: '<button />' },
}))

const PRODUCTS = [
  { id: 'p1', name: 'Apple Watch', price: 299 },
  { id: 'p2', name: 'Apple iPhone', price: 999 },
  { id: 'p3', name: 'Samsung Galaxy', price: 799 },
  { id: 'p4', name: 'Google Pixel', price: 699 },
  { id: 'p5', name: 'OnePlus Nord', price: 399 },
  { id: 'p6', name: 'Sony Walkman', price: 149 },
]

function makeDocs(products) {
  return {
    docs: products.map((p) => ({ id: p.id, data: () => ({ ...p }) })),
  }
}

async function mountPage(products = PRODUCTS) {
  setActivePinia(createPinia())
  getDocs.mockResolvedValueOnce(makeDocs(products))
  const wrapper = mount(SearchPage, {
    global: {
      stubs: { 'iconify-icon': { template: '<span />' } },
    },
  })
  await flushPromises()
  return wrapper
}

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('search filtering', () => {
    it('shows results matching the query (case-insensitive)', async () => {
      const wrapper = await mountPage()
      await wrapper.find('.search-input').setValue('apple')
      await wrapper.vm.$nextTick()
      const items = wrapper.findAll('.product-item')
      expect(items).toHaveLength(2)
      expect(wrapper.text()).toContain('Apple Watch')
      expect(wrapper.text()).toContain('Apple iPhone')
    })

    it('shows "No products match" for a query with no results', async () => {
      const wrapper = await mountPage()
      await wrapper.find('.search-input').setValue('zzzunknown')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })
  })

  describe('trending products', () => {
    it('shows first 5 products as trending when query is empty', async () => {
      const wrapper = await mountPage()
      const items = wrapper.findAll('.product-item')
      // 5 trending, no recent searches
      expect(items).toHaveLength(5)
    })

    it('clears query and goes back to trending view', async () => {
      const wrapper = await mountPage()
      await wrapper.find('.search-input').setValue('apple')
      await wrapper.vm.$nextTick()
      await wrapper.find('.clear-btn').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.search-input').element.value).toBe('')
    })
  })

  describe('recent searches', () => {
    it('saves query to localStorage when a product is clicked', async () => {
      const wrapper = await mountPage()
      await wrapper.find('.search-input').setValue('apple')
      await wrapper.vm.$nextTick()
      await wrapper.findAll('.product-item')[0].trigger('click')
      const saved = JSON.parse(localStorage.getItem(RECENT_KEY))
      expect(saved).toContain('apple')
    })

    it('deduplicates: clicking same query again moves it to front', async () => {
      localStorage.setItem(RECENT_KEY, JSON.stringify(['apple', 'samsung']))
      const wrapper = await mountPage()
      await wrapper.find('.search-input').setValue('samsung')
      await wrapper.vm.$nextTick()
      await wrapper.findAll('.product-item')[0].trigger('click')
      const saved = JSON.parse(localStorage.getItem(RECENT_KEY))
      expect(saved[0]).toBe('samsung')
      expect(saved.filter((t) => t === 'samsung')).toHaveLength(1)
    })

    it('limits recent searches to 8 entries', async () => {
      // 8 existing entries that don't include 'apple', so adding 'apple' would make 9 → trimmed to 8
      const existing = ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
      localStorage.setItem(RECENT_KEY, JSON.stringify(existing))
      const wrapper = await mountPage()
      await wrapper.find('.search-input').setValue('apple')
      await wrapper.vm.$nextTick()
      await wrapper.findAll('.product-item')[0].trigger('click')
      const saved = JSON.parse(localStorage.getItem(RECENT_KEY))
      expect(saved).toHaveLength(8)
      expect(saved[0]).toBe('apple')
    })

    it('does not save to recent when query is empty', async () => {
      const wrapper = await mountPage()
      // click a trending product without typing a query
      await wrapper.findAll('.product-item')[0].trigger('click')
      expect(localStorage.getItem(RECENT_KEY)).toBeNull()
    })
  })
})
