import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/index.js'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/HomePage.vue'),
    async beforeEnter() {
      const authStore = useAuthStore()
      await authStore.ready
      if (!authStore.user) return true
      const snap = await getDocs(
        query(collection(db, 'stores'), where('ownerUid', '==', authStore.user.uid))
      )
      if (!snap.empty) {
        return { name: 'store', params: { storeId: snap.docs[0].id } }
      }
      return true
    },
  },
  {
    path: '/:storeId',
    name: 'store',
    component: () => import('../pages/StorePage.vue'),
  },
  {
    path: '/:storeId/search',
    name: 'search',
    component: () => import('../pages/SearchPage.vue'),
  },
  {
    path: '/:storeId/cart',
    name: 'cart',
    component: () => import('../pages/CartPage.vue'),
  },
  {
    path: '/:storeId/product/add',
    name: 'product-add',
    component: () => import('../pages/ProductFormPage.vue'),
    meta: { requiresSeller: true },
  },
  {
    path: '/:storeId/product/:productId/edit',
    name: 'product-edit',
    component: () => import('../pages/ProductFormPage.vue'),
    meta: { requiresSeller: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
