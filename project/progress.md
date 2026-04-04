# Wardi — Progress Tracker

_Last updated: 2026-04-04 (synced with Notion)_

## Status Legend
- [x] Done
- [-] In progress
- [ ] Not started

---

## Foundation

- [x] Project scaffold (Vite + Vue 3 + Firebase)
- [x] Firebase Firestore + Auth + Storage integration
- [x] Staging and production environments (`.env.staging`, `.env.production`)
- [x] Slug-based store URLs (`/:storeId`)
- [x] Store creation flow (`/create-store`)
- [x] CSS theming system (`src/assets/theme.css`)

---

## Buyer Experience

- [x] Store page — product listing with category filter
- [x] Product detail page
- [x] Search page — live filtering, recent searches in localStorage
- [x] Cart — local-first via Pinia + localStorage, qty controls
- [x] Checkout contact screen
- [x] WhatsApp deep link checkout (order summary message)
- [x] Order success screen
- [x] Order status screen — buyer tracks live order status
- [x] WhatsApp "Contact Seller" CTA on buyer's order page
- [x] Left-drawer navigation menu

---

## Seller Experience

- [x] Google sign-in (Firebase Auth)
- [x] Seller dashboard — product management
- [x] Product form — add and edit products
- [x] Firebase Storage — product image uploads (via CDN URL)
- [x] Orders page — view incoming orders (Banani design)
- [x] Order detail — view items, buyer contact, order status
- [x] Order lifecycle management — accept/reject, then complete/cancel
- [x] WhatsApp "Contact Buyer" CTA on seller's order detail page
- [x] Seller profile page

---

## Testing

- [x] Vitest unit test suite — 56 tests across 8 files (cart store, auth store, formatPrice, toCdnUrl, CheckoutContactPage, SearchPage, CartPage, QtyControl)
- [x] Firebase and localStorage fully mocked — tests run offline

---

## Design

- [x] Banani design system integration
- [x] Orders page redesigned to match Banani spec
- [ ] Full design pass across all screens

---

## Outstanding / Backlog

- [ ] Buyer OTP login — buyer authenticates with phone number + OTP before placing an order
- [ ] Buyer order list page — "My Orders" in the nav should link to an order list, not the cart
- [ ] Product stock management — decrement stock when seller accepts an order
- [ ] Multi-image support per product
- [x] Image compression before upload
- [ ] Firebase App Check — configure to protect backend from abuse
- [ ] Push notifications for new orders
- [ ] Seller analytics / dashboard metrics
- [x] Staging deployment
- [ ] PWA / installable app support
