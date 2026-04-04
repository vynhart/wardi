import { vi, beforeEach } from 'vitest'

// ── Firebase Firestore mock ──────────────────────────────────────────────────
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn((...args) => ({ path: args.slice(1).join('/') })),
  doc: vi.fn((...args) => ({ path: args.slice(1).join('/') })),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  getDocs: vi.fn(() =>
    Promise.resolve({ docs: [], forEach: () => {} })
  ),
  onSnapshot: vi.fn(() => vi.fn()), // returns unsubscribe fn
  updateDoc: vi.fn(() => Promise.resolve()),
  setDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  query: vi.fn((...args) => args[0]),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
}))

// ── Firebase Auth mock ───────────────────────────────────────────────────────
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(function () { this.providerId = 'google.com' }),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: { uid: 'uid-123', displayName: 'Test User' } })),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Default: not signed in
    callback(null)
    return vi.fn() // unsubscribe
  }),
}))

// ── Firebase Storage mock ────────────────────────────────────────────────────
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  uploadBytes: vi.fn(() => Promise.resolve({})),
  getDownloadURL: vi.fn(() => Promise.resolve('https://mock.storage/image.jpg')),
}))

// ── Firebase app init mock ───────────────────────────────────────────────────
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}))

// ── src/firebase/index.js stub ───────────────────────────────────────────────
vi.mock('../firebase/index.js', () => ({
  db: {},
  auth: {},
  storage: {},
}))

// ── Reset mocks before each test ─────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})
