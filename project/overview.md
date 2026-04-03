# Wardi — Project Overview

## What is Wardi?

Wardi is a mobile web storefront for WhatsApp-based sellers. A seller creates a store, lists their products, and shares their store URL with customers. Buyers browse the store, add items to a cart, and place an order. Orders are persisted and both the seller and buyer can track their status in real time.

Checkout initiates via a WhatsApp deep link, but the order is also saved to the backend so sellers can manage it through a full order lifecycle.

## Who is it for?

- **Sellers** — small businesses or individuals already selling via WhatsApp who want a simple product catalog and checkout flow without managing a full e-commerce backend.
- **Buyers** — customers who receive a store link and want to browse and order without creating an account.

## Core Principles

- **Store isolation** — every page lives under `/:storeId`. No cross-store data is ever shown or leaked.
- **Local-first cart** — the cart is stored in `localStorage` (via Pinia), keyed by `storeId`, so no login is required to shop.
- **WhatsApp as the entry point** — checkout opens WhatsApp with a pre-filled order summary, but the order is also persisted in Firestore for full lifecycle management.
- **Order lifecycle** — sellers can accept or reject an order; accepted orders can then be marked as completed or cancelled. Buyers see the live status.
- **WhatsApp as the communication layer** — beyond checkout, both the buyer's order page and the seller's order detail page have a WhatsApp CTA to contact the other party with a pre-formatted message.

## Project Workflow

Design and development are tightly integrated through two primary tools:

- **Banani** — the main design tool. All screens and components are designed in Banani first.
- **Claude Code** — the main coding agent. It implements the designs directly from Banani.
- **Banani ↔ Claude Code integration** — Claude Code can read selected designs from Banani directly, allowing it to implement UI from the design spec without manual handoff.

### Rule: Design before code

Every screen must have an approved Banani design before implementation begins. The order is always:

1. Task is added in Notion
2. Claude checks if a Banani design exists for the screen
3. If no design exists — Claude creates one in Banani and asks for review and approval
4. Once approved — Claude implements the screen from the Banani design
5. Claude marks the task Done in Notion and updates `progress.md`

Non-visual work (backend logic, bug fixes with no UI change, Firestore rules) is exempt from the design step.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + Vue 3 (Composition API) |
| Routing | Vue Router |
| State | Pinia (cart persisted to localStorage) |
| Backend | Firebase — Firestore + Auth + Storage |
| Icons | Iconify (CDN) |
| Theming | CSS variables (`src/assets/theme.css`) |

## Firestore Data Model

```
stores/{storeId}
  name: string
  ownerUid: string        ← Firebase Auth UID of the seller

stores/{storeId}/products/{productId}
  name, price, category, stock, imageUrl
  createdAt, updatedAt   ← serverTimestamp

stores/{storeId}/orders/{orderId}
  items: [ { productId, name, price, qty } ]
  buyerContact: { name, phone }
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled"
  createdAt, updatedAt   ← serverTimestamp
```

## Environments

Two Firebase projects are configured — staging and production — via `.env.staging` and `.env.production`, with all variables prefixed `VITE_FIREBASE_*`.

## Screens

### Buyer
| Screen | Route | Description |
|---|---|---|
| Home | `/` | App entry point |
| Store | `/:storeId` | Product listing with category filter and cart sheet |
| Product Detail | `/:storeId/products/:productId` | Single product view |
| Search | `/:storeId/search` | Live product search |
| Cart | `/:storeId/cart` | Cart review with qty controls |
| Checkout Contact | `/:storeId/checkout/contact` | Buyer enters contact info before placing order |
| Order Success | `/:storeId/order-success` | Confirmation screen after order is placed |
| Order Status | `/:storeId/orders/:orderId` | Buyer tracks live status of their order; CTA to contact seller via WhatsApp |

### Seller
| Screen | Route | Description |
|---|---|---|
| Create Store | `/create-store` | Onboarding — creates a new store |
| Seller Dashboard | `/:storeId/dashboard` | Product management |
| Product Form | `/:storeId/products/new` / `/:storeId/products/:id/edit` | Add or edit a product |
| Seller Orders | `/:storeId/orders` | List of all incoming orders |
| Order Detail | `/:storeId/orders/:orderId` | View items, buyer contact, and status; accept/reject or complete/cancel; CTA to contact buyer via WhatsApp |
| Seller Profile | `/:storeId/profile` | Store settings and profile |
