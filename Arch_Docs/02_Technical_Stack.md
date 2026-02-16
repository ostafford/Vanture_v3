2. Technical Stack
Frontend:

React 18+ - Component-based UI
Bootstrap 5 (or 4) with React-Bootstrap - UI components and grid system
React Router v6 - Client-side routing
Recharts - Progress bars and charts
Axios - HTTP client for Up Bank API
date-fns - Date manipulation

State Management:

Zustand - Lightweight state management (simpler than Redux)

Storage:

sql.js - SQLite compiled to WebAssembly (runs in browser)
- **Phase 1:** sql.js runs on the main thread. Bundle size is large but acceptable for foundation.
- **Phase 5 (optional):** If performance demands it, consider loading sql.js in a Web Worker or lazy-loading to reduce initial block; document any change in implementation notes. **Phase 5 evaluation:** Pagination (Transactions) and index on `round_up_parent_id` were added; sql.js remains on the main thread. For the 13"-27" desktop target and typical transaction set sizes, this was evaluated as sufficient; Web Worker/lazy-load not required unless metrics show main-thread blocking with very large DBs.
IndexedDB - Stores SQLite database file. Persistence flow: on load, read SQLite binary from IndexedDB into sql.js; after writes, export DB to binary and write back to IndexedDB (e.g. after each transaction, debounced, or on beforeunload).
- **Quota:** No explicit quota handling in Phase 1. Browsers enforce their own limits; if we add large attachments or very long history later, consider checking `navigator.storage.estimate()` and surfacing a user-facing message on failure.
Passphrase-derived encryption - Key derived from user passphrase (e.g. PBKDF2); passphrase and raw key never stored. Crypto-JS (AES) for encrypting the API token; key is derived from user passphrase, not hardcoded.

**Theme and bootstrap:** To avoid a flash of wrong theme, the app must not render theme-dependent UI (e.g. root layout with theme class) until the DB is initialised and `app_settings.theme` has been read (or default applied). Show a minimal loading state until then; do not assume a theme before DB is ready.

Build & Deploy:

Vite - Fast build tool (alternative to Create React App)
GitHub Pages - Static hosting
Workbox - Service Worker for PWA features

Development:

ESLint + Prettier - Code quality
TypeScript - Recommended from Phase 1 for type safety (API, DB, and calculation types)