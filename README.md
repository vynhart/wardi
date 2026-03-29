# Wardi

Mobile web storefront for WhatsApp sellers. Sellers share a link to their store; buyers browse products, add to cart, and checkout. Then communicate to seller via WhatsApp.

## Tech Stack

- [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/)
- [Pinia](https://pinia.vuejs.org/) for state management
- [Vue Router](https://router.vuejs.org/) for client-side routing
- [Firebase](https://firebase.google.com/) — Firestore (database) + Authentication (Google sign-in)

## Project Structure

```
src/
  assets/         # Global CSS and theme variables
  components/     # Shared UI components
  firebase/       # Firebase initialization
  pages/          # One file per screen
  router/         # Vue Router config
  stores/         # Pinia stores (auth, cart)
```

## Local Setup

### Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

This project uses two separate Firebase projects — one for staging, one for production. For local development, you can reuse the staging project.

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project
2. In **Project Settings → Your apps**, register a Web app
3. Copy the `firebaseConfig` values shown after registration

### 3. Configure environment variables

Fill in `.env` with your Firebase project credentials (you can use the staging project values for local dev):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 4. Enable Firebase services

In the Firebase Console for your project:

- **Firestore**: Build → Firestore Database → Create database
- **Authentication**: Build → Authentication → Get started → enable **Google** sign-in provider

### 5. Run the dev server

```bash
npm run dev
```

Open `http://localhost:5173/:storeId` — replace `:storeId` with a Firestore document ID under the `stores` collection.

## Firestore Data Model

```
stores/{storeId}
  name        string
  ownerUid    string   # Firebase Auth UID of the seller

stores/{storeId}/products/{productId}
  name        string
  price       number
  category    string
  imageUrl    string
  stock       number
  createdAt   timestamp
  updatedAt   timestamp
```

## Deployment

### Environment files

| File | Used for |
|---|---|
| `.env` | Local development |
| `.env.staging` | Staging build |
| `.env.production` | Production build |

Fill in the Firebase credentials for each environment in the corresponding file.

### Deploy to staging

```bash
npm run build:staging && firebase deploy --only hosting -P staging
```

Live URL: `https://wardi-stg.web.app`

### Deploy to production

```bash
npm run build:production && firebase deploy --only hosting -P production
```

Live URL: `https://wardi-prd.web.app`
