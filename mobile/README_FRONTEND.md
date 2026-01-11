# Product Review App — Mobile (React Native) + Backend (Spring Boot)

> **Audience:** new interns joining the project  
> **Goal:** explain *why each file exists*, *what it does*, and *how data flows* through the system.

This repository contains:
- **`mobile/`**: React Native application (TypeScript) built with React Navigation, context-based state management, and a small API client layer.
- **`backend/`**: Spring Boot REST API (multi-module Maven project). The mobile app talks to it via HTTP (see `mobile/services/api.ts`).

---

## 1) High-level architecture

### 1.1 Runtime flow (mobile)
1. **App boot** starts in `mobile/App.tsx`
2. Global **providers** are mounted (Theme, Notifications, Wishlist, Toast)
3. React Navigation creates the **Stack Navigator**
4. Each Screen composes smaller UI components and calls:
   - Context actions (Wishlist/Notifications/Toast)
   - API functions in `services/api.ts` to fetch/post data
5. UI updates are triggered by React state changes (Context + component state)

### 1.2 Backend contract (overview)
Mobile communicates with the backend using REST endpoints under:
- `BASE_URL` in `mobile/services/api.ts`  
  Currently points to a **Heroku** deployment.

Backend responsibilities (expected from API usage in mobile):
- **Products** listing + filtering + pagination
- **Product details**
- **Reviews** listing + pagination
- **Create review**
- **Mark review as helpful**

> Note: In this chat you only shared mobile source files. For a fully accurate backend README (controllers/services/repositories/entities), share backend files later and we can generate a dedicated `README_BACKEND.md`.

---

## 2) Folder structure (mobile)

From your VS Code structure, the key folders are:

```
mobile/
  App.tsx
  components/
  constants/
  context/
  hooks/
  screens/
  services/
  types/
```

### 2.1 `App.tsx` — application root
**Why it exists:** single entry point that wires global providers + navigation.

**What it does:**
- Creates `createNativeStackNavigator<RootStackParamList>()`
- Wraps navigation with:
  - `SafeAreaProvider` (consistent safe-area handling)
  - `ThemeProvider` (dark/light)
  - `NotificationProvider` (local notification state)
  - `WishlistProvider` (wishlist + selection state)
  - `ToastProvider` (in-app toasts)
- Defines stack routes:
  - `ProductList`
  - `ProductDetails`
  - `Notifications`
  - `NotificationDetail`
  - `Wishlist`
  - `AIAssistant`

**Key connection points:**
- Screens use `useNavigation()` with `RootStackParamList` types to navigate safely.
- Screens/components use hooks like `useTheme()`, `useToast()`, `useWishlist()`, `useNotifications()` to access global state.

### 2.2 `types/index.ts` — shared TypeScript types
**Why it exists:** central contract for navigation params and shared models.

Defines:
- `RootStackParamList`: route names + their parameter types
- `Review` interface used across product details / AI assistant, etc.

> Keep this file authoritative. Any navigation rename must be updated here and in `App.tsx`.

---

## 3) Cross-cutting systems (Context layer)

### 3.1 Theme system
Files:
- `constants/theme.ts`
- `context/ThemeContext.tsx`
- `hooks/useColorScheme.ts` (system scheme helper)

**Goal:** ensure every screen/component can render in light/dark with consistent design tokens.

#### `constants/theme.ts`
**What it contains:** design tokens used everywhere:
- `Colors.light` / `Colors.dark`
- `Spacing`, `FontSize`, `BorderRadius`, (and likely shadows/lineHeight)

**How it’s used:**
- components import tokens (`Spacing`, `FontSize`, etc.)
- ThemeContext exposes `colors` to avoid hard-coded color usage in components

#### `context/ThemeContext.tsx`
**What it does:**
- Stores `colorScheme` in state (`'light' | 'dark'`)
- Persists it using `AsyncStorage` (`THEME_STORAGE_KEY`)
- Exposes:
  - `toggleTheme()`
  - `setTheme(scheme)`
  - `colors` (computed from `Colors[colorScheme]`)

**Why it matters:**
- Theme is a *global concern*. Doing it via Context avoids prop-drilling and keeps screens clean.
- Persisting the scheme means user preference survives app restarts.

#### `hooks/useColorScheme.ts`
A tiny helper hook that usually reads the device setting and provides a default scheme.

**Pattern:**  
- device scheme = initial value  
- user scheme override is persisted in `ThemeContext`

---

### 3.2 Toast system (in-app feedback)
File:
- `context/ToastContext.tsx`

**Why it exists:** a consistent, cross-platform way to show feedback without third-party native toast dependencies.

**Typical use cases:**
- “Added to wishlist”
- “Review submitted”
- “Network error” / “Validation error”

**Expected API shape (from file intent):**
- `showToast({ title, message, type })`
- automatic dismiss via timers
- renders a toast overlay near root

**Connection points:**
- Screens call `useToast()` and invoke `showToast(...)` after actions or API calls.
- Keeps feedback logic separate from UI components.

---

### 3.3 Notifications system (local state)
File:
- `context/NotificationContext.tsx`

**Goal:** store in-app notifications (not OS push) and provide list/detail UX.

Defines:
- `NotificationType = 'review' | 'order' | 'system'`
- `Notification` model:
  - `id`, `title`, `body`
  - `timestamp: Date`
  - `isRead`
  - optional `data` (e.g., `productId`, `productName`)

Exposes actions:
- `addNotification(notification)`
- `markAsRead(id)`
- `markAllAsRead()`
- `clearNotification(id)`
- `clearAll()`

**Connection points:**
- `NotificationsScreen` consumes the list and renders unread state.
- `NotificationDetailScreen` shows details and likely calls `markAsRead`.
- Other screens may create notifications after review creation / important events.

---

### 3.4 Wishlist system (global + selection mode)
File:
- `context/WishlistContext.tsx`

**Goal:** allow adding/removing products to wishlist and support multi-select UI flows.

Expected responsibilities:
- hold `wishlistItems` (array of products or product IDs)
- handle `toggleWishlist(product)` or `add/remove`
- expose selection mode state for multi-select:
  - `isSelectionMode`
  - `selectedIds`
  - `toggleSelect(id)`
  - `clearSelection()`, `selectAll()` (if supported)

**Connection points:**
- `ProductCard` / `SelectableProductCard` uses wishlist actions
- `WishlistScreen` renders wishlist list/grid and drives selection UI

---

## 4) API Layer (HTTP client)

File:
- `services/api.ts`

**Why it exists:** isolate backend communication from UI code.

### 4.1 BASE_URL and environments
- Production points to a Heroku domain
- Local dev URL is commented (LAN IP)

**Intern rule:** never hardcode URLs inside screens/components. Only change URL here (or via env config if later added).

### 4.2 Types
- `Page<T>` generic: backend uses Spring-style pagination (`content`, `totalPages`, etc.)
- `ApiProduct`, `ApiReview`: typed response models

### 4.3 Functions (expected)
From the visible portions:
- `postReview(productId, body)` → `POST /api/products/{id}/reviews`
- `markReviewAsHelpful(reviewId)` → `PUT /api/products/reviews/{id}/helpful`
- plus (very likely) product list & review list fetchers with query params:
  - search
  - category
  - sort
  - pagination (`page`, `size`)

### 4.4 `request<T>()` wrapper
Most apps implement:
- `fetch(url, options)`
- if `!res.ok`, throw typed error
- parse JSON into `T`

**Why it matters:** centralized error parsing + consistent headers.

> ⚠️ If your local copy of `api.ts` contains truncated content, fix it in the repository. For onboarding, this file must be complete and readable.

---

## 5) Screens (feature orchestration layer)

Screens are *feature-level* containers:
- own UI state (loading, pagination, filters)
- call API functions
- use contexts for cross-cutting concerns
- compose `components/*` for consistent UI

### 5.1 `ProductListScreen.tsx`
**Role:** primary discovery screen.

Typical responsibilities:
- fetch paginated products (initial load + load more)
- handle:
  - search (`SearchBar`)
  - category filter (`CategoryFilter`)
  - sort (`SortFilter`)
  - layout toggle (list/grid)
  - multi-select mode (uses `SelectableProductCard`)
- navigate to:
  - `ProductDetails` with `{ productId, imageUrl?, name? }`
  - `Wishlist`
  - `Notifications`

**Key connections:**
- Uses theme tokens for spacing/typography
- Uses wishlist context to show “hearted” state
- Triggers toast on certain actions

### 5.2 `ProductDetailsScreen.tsx`
**Role:** product detail + review ecosystem.

Typical responsibilities:
- fetch product detail and reviews (possibly paginated)
- render:
  - product hero / image
  - rating summary (`RatingBreakdown`)
  - reviews list (`ReviewCard`)
  - add review flow (`AddReviewModal`)
  - helpful votes (calls `markReviewAsHelpful`)
- might navigate to AI assistant:
  - `AIAssistant` with `{ productName, productId, reviews }`

**Key connections:**
- API: product detail, reviews, post review, helpful
- Toast: success/error
- Theme: colors for cards/backgrounds

### 5.3 `WishlistScreen.tsx`
**Role:** user’s saved items.

Typical responsibilities:
- render wishlist products (list/grid)
- support multi-select mode:
  - select/unselect items (`SelectableWishlistCard`)
  - bulk delete / clear all (if implemented)
- navigate to product details

**Key connections:**
- WishlistContext is the source of truth
- Theme tokens control spacing

### 5.4 Notifications flow
Files:
- `NotificationsScreen.tsx`
- `NotificationDetailScreen.tsx`

**Role:**
- list notifications and allow reading them
- mark read/unread states and clearing

**Key connections:**
- NotificationContext provides list and actions
- detail screen uses route params `{ notificationId }`

### 5.5 `AIAssistantScreen.tsx`
**Role:** AI-powered assistant for a product context.

Typical responsibilities:
- receives params:
  - productName, productId, reviews
- renders:
  - AI summary (`AISummaryCard`)
  - chat UI (`AIChatModal` or embedded)
- can use reviews as context for generating insights

**Note:** currently AI is likely client-side / mocked. Later you may connect it to backend AI endpoints.

---

## 6) Components (reusable building blocks)

### 6.1 Layout & primitives
- `ScreenWrapper.tsx`
  - standardizes safe padding, background color, and top-level layout patterns.
- `Button.tsx`
  - centralized button styles (primary/secondary/ghost) that respond to theme.

### 6.2 Discovery & filtering
- `SearchBar.tsx`
  - controlled input (`value`, `onChangeText`)
  - icon + themed container
- `CategoryFilter.tsx`
  - category chips / horizontal list
  - emits selected category to parent screen
- `SortFilter.tsx`
  - sort controls (dropdown/chips)
  - emits selected sort option

### 6.3 Product cards
- `ProductCard.tsx`
  - renders product image, name, price, rating
  - includes wishlist toggle (heart)
- `SelectableProductCard.tsx`
  - wraps ProductCard but adds selection checkbox/overlay
  - used by ProductList selection mode
- `SelectableWishlistCard.tsx`
  - selection variant for wishlist screen

### 6.4 Reviews & ratings
- `StarRating.tsx`
  - visual star rendering for numeric rating
- `ReviewCard.tsx`
  - renders review content, user, timestamp
  - helpful button triggers `markReviewAsHelpful`
- `RatingBreakdown.tsx`
  - shows histogram/percentages per star value
  - supports “click-to-filter” pattern (tap 5★ → filter list)

### 6.5 Add review workflow
- `AddReviewModal.tsx`
  - modal with controlled inputs (name/comment/rating)
  - validation rules and character counters
  - calls `postReview` and then notifies parent to refresh

### 6.6 AI UI components
- `AISummaryCard.tsx`
  - renders concise AI summary (pros/cons, verdict)
- `AIChatModal.tsx`
  - chat style modal, message list + input
  - uses theme tokens for a consistent look

---

## 7) Data & mock utilities

### `constants/data.ts`
**Why it exists:** local seed data (categories, mock products, sample reviews) used for:
- offline development
- UI prototyping
- fallback when backend is not available

**Intern rule:** treat mock data as *development-only*. Production should use API data.

---

## 8) How features connect (end-to-end examples)

### 8.1 “User posts a review”
1. `ProductDetailsScreen` opens `AddReviewModal`
2. modal validates input locally
3. calls `postReview(productId, body)` from `services/api.ts`
4. on success:
   - show toast (`ToastContext`)
   - optionally add a notification (`NotificationContext`)
   - refresh reviews list in `ProductDetailsScreen`

### 8.2 “User toggles wishlist from ProductList”
1. user taps heart on `ProductCard`
2. `ProductCard` calls `WishlistContext.toggleWishlist(product)`
3. wishlist state updates globally
4. `WishlistScreen` reflects changes automatically

### 8.3 “User marks review as helpful”
1. user taps helpful in `ReviewCard`
2. `ReviewCard` calls `markReviewAsHelpful(reviewId)`
3. parent screen updates review list (optimistic UI or refetch)
4. toast feedback (optional)

---

## 9) Development guidelines for interns

### 9.1 Keep layering strict
- **Screens** orchestrate (fetch, state, navigation)
- **Components** are reusable and mostly presentational
- **Context** owns cross-cutting state (theme, toast, wishlist, notifications)
- **Services** own network calls

### 9.2 Don’t hardcode styling
Use design tokens from `constants/theme.ts`:
- `Spacing`, `FontSize`, `BorderRadius`, `Colors`

### 9.3 Navigation safety
Any new screen must:
1. be added to `RootStackParamList`
2. be registered in `App.tsx`

---

## 10) Running the project (mobile)

> Commands may vary depending on your repo root. Typical flow:

```bash
cd mobile
npm install
npm start
```

Then:
- press `a` for Android emulator
- scan QR for Expo Go (if configured)
- or build via EAS (if configured in `eas.json`)

---

## 11) Backend (Spring Boot) — onboarding stub

The backend is a Maven multi-module project (as seen in VS Code Java Projects / Maven view):
- `product-review`
- `product-review-parent`

Typical structure you should expect:
- controllers: `/api/products/**`
- services: business logic (rating, validation)
- repositories: JPA access
- entities: `Product`, `Review`, etc.
- pagination: Spring `Page<T>`

**Next step:** share these backend files and we will generate a full `README_BACKEND.md`:
- `backend/pom.xml` (and parent)
- `application.properties` / `application.yml`
- controller/service/repository/entity packages
- deployment config (Heroku)

---

## Appendix A — File index (mobile)

**App root**
- `App.tsx` — Providers + Navigation

**Types**
- `types/index.ts` — navigation params + shared models

**Constants**
- `constants/theme.ts` — design tokens (colors/spacing/typography)
- `constants/data.ts` — mock/seed data

**Hooks**
- `hooks/useColorScheme.ts` — system color scheme helper

**Context**
- `context/ThemeContext.tsx` — theme state + persistence
- `context/ToastContext.tsx` — in-app toast system
- `context/WishlistContext.tsx` — wishlist + selection mode
- `context/NotificationContext.tsx` — in-app notifications

**Services**
- `services/api.ts` — backend API client

**Screens**
- `screens/ProductListScreen.tsx`
- `screens/ProductDetailsScreen.tsx`
- `screens/WishlistScreen.tsx`
- `screens/NotificationsScreen.tsx`
- `screens/NotificationDetailScreen.tsx`
- `screens/AIAssistantScreen.tsx`

**Components**
- `components/ScreenWrapper.tsx`
- `components/Button.tsx`
- `components/SearchBar.tsx`
- `components/CategoryFilter.tsx`
- `components/SortFilter.tsx`
- `components/ProductCard.tsx`
- `components/SelectableProductCard.tsx`
- `components/SelectableWishlistCard.tsx`
- `components/StarRating.tsx`
- `components/ReviewCard.tsx`
- `components/RatingBreakdown.tsx`
- `components/AddReviewModal.tsx`
- `components/AISummaryCard.tsx`
- `components/AIChatModal.tsx`

---

## 🚀 Planned Improvements & Roadmap

### 1. Security Enhancements
- **Secure Storage:** Use `expo-secure-store` for storing sensitive tokens (JWT).
- **Authentication Flow:** Implement Login/Register screens and AuthContext.

### 2. Validation
- **Form Validation:** Use libraries like `yup` or `zod` for robust form validation (e.g., in AddReviewModal).

### 3. Testing
- **Unit Testing:** Add Jest tests for utility functions and hooks.
- **Component Testing:** Use React Native Testing Library for component interactions.
- **E2E Testing:** Implement Detox or Maestro for end-to-end user flow testing.
