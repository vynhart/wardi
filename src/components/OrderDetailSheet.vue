<template>
  <div class="overlay" @click="$emit('close')">
    <div class="bottom-sheet" @click.stop>
      <div class="sheet-handle"></div>

      <div class="sheet-buyer-row">
        <div class="customer-avatar customer-avatar--lg">{{ initials(order.buyerName) }}</div>
        <div>
          <div class="buyer-name">{{ order.buyerName }}</div>
          <a :href="`tel:${order.buyerPhone}`" class="buyer-phone-link">
            {{ order.buyerPhone }}
          </a>
        </div>
      </div>

      <div class="sheet-items">
        <div v-for="(entry, i) in order.items" :key="i" class="sheet-item">
          <span class="sheet-item-name">{{ entry.product.name }}</span>
          <span class="sheet-item-meta">×{{ entry.qty }} · {{ formatPrice(entry.product.price * entry.qty) }}</span>
        </div>
      </div>

      <div class="sheet-totals">
        <div class="sheet-total-row">
          <span>Subtotal</span><span>{{ formatPrice(order.subtotal) }}</span>
        </div>
        <div class="sheet-total-row">
          <span>Shipping</span><span>{{ formatPrice(order.shipping) }}</span>
        </div>
        <div class="sheet-total-row sheet-total-row--total">
          <span>Total</span><span>{{ formatPrice(order.total) }}</span>
        </div>
      </div>

      <div class="sheet-actions">
        <a
          :href="`https://wa.me/${order.buyerPhone.replace(/\D/g, '')}`"
          target="_blank"
          class="contact-btn"
        >
          <iconify-icon icon="lucide:message-circle" style="font-size: 18px" />
          Contact Buyer
        </a>
        <div v-if="nextStatuses(order.status).length" class="status-actions">
          <button
            v-for="s in nextStatuses(order.status)"
            :key="s.value"
            class="status-action-btn"
            :class="`status-action--${s.value}`"
            @click="updateStatus(s.value)"
          >{{ s.label }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/index.js'
import { formatPrice } from '../utils/format.js'

const props = defineProps({
  order: { type: Object, required: true },
  storeId: { type: String, required: true },
})

const emit = defineEmits(['close'])

function initials(name) {
  return (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function nextStatuses(status) {
  if (status === 'pending') return [{ value: 'confirmed', label: 'Confirm' }, { value: 'cancelled', label: 'Cancel' }]
  if (status === 'confirmed') return [{ value: 'completed', label: 'Mark Completed' }, { value: 'cancelled', label: 'Cancel' }]
  return []
}

async function updateStatus(status) {
  await updateDoc(doc(db, 'stores', props.storeId, 'orders', props.order.id), { status })
  props.order.status = status
  emit('close')
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 40;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bottom-sheet {
  width: 100%;
  max-width: 430px;
  background-color: var(--background);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 12px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background-color: var(--border);
  margin: 0 auto 4px;
}

.sheet-buyer-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.buyer-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
}

.buyer-phone-link {
  font-size: 14px;
  color: var(--primary);
  text-decoration: none;
  margin-top: 2px;
  display: block;
}

.customer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--muted);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--foreground);
  flex-shrink: 0;
}

.customer-avatar--lg {
  width: 44px;
  height: 44px;
  font-size: 15px;
}

.sheet-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sheet-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.sheet-item-name {
  color: var(--foreground);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet-item-meta {
  color: var(--muted-foreground);
  flex-shrink: 0;
}

.sheet-totals {
  background-color: var(--secondary);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sheet-total-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--muted-foreground);
}

.sheet-total-row--total {
  font-size: 15px;
  font-weight: 600;
  color: var(--foreground);
  padding-top: 10px;
  border-top: 1px solid var(--border);
  margin-top: 2px;
}

.sheet-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contact-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  border-radius: var(--radius-xl);
  background-color: #25D366;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
}

.status-actions {
  display: flex;
  gap: 10px;
}

.status-action-btn {
  flex: 1;
  height: 44px;
  border-radius: var(--radius-xl);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.status-action--confirmed,
.status-action--completed {
  background-color: var(--primary);
  color: var(--primary-foreground);
}

.status-action--cancelled {
  background-color: var(--muted);
  color: var(--muted-foreground);
}
</style>
