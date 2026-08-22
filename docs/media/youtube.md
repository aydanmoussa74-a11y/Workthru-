# Phase 8: YouTube + Media Integration Architecture

## 1. Overview and Purpose
Phase 8 introduces the **Workout Media System**, integrating supported YouTube video resources alongside the existing offline-first vector demonstrations (Real Person and 3D Biomechanical wireframes). 

The media system serves three distinct roles in the Workout PWA:
1. **Movement Form Tutorials & Demonstrations**: Allowing users to watch accredited, high-definition exercise technique breakdowns inside the Training Player and Exercise Library.
2. **Follow-Along Workouts & Mobility Routines**: Enabling users to follow targeted bodyweight and stretching sessions without leaving the PWA.
3. **Training Atmosphere**: Providing focused calisthenics rhythms and motivation.

In strict adherence to product principles:
- **Media Enhances Training**: YouTube media supports training; it is never the sole source of truth or a blocker for the core workout experience.
- **Local First**: The application remains 100% operational offline. The core workout engine, timers, vector demonstrations, and local persistence function without network connectivity or API keys.
- **Controlled & Safe Scope**: The application is not a generic YouTube browser. All discovery is filtered, sanitised, and strictly scoped to calisthenics, exercise form, and athletic movement.

---

## 2. API Configuration & Security

### 2.1 Environment Configuration (`VITE_YOUTUBE_API_KEY`)
- The YouTube Data API v3 integration reads the public client API key from `import.meta.env.VITE_YOUTUBE_API_KEY` (with a safe fallback to `process.env.VITE_YOUTUBE_API_KEY`).
- Declared in `.env.example`:
  ```env
  # VITE_YOUTUBE_API_KEY: Optional YouTube Data API v3 key for live media search.
  # If omitted or offline, the app seamlessly falls back to the curated calisthenics media catalog.
  VITE_YOUTUBE_API_KEY=
  ```

### 2.2 Security, Credentials & Browser-Side Key Constraints
- **Zero Secrets in Git**: No API keys, client secrets, or private tokens are committed to source files or repository histories.
- **Client-Side Restrictions**: Because `VITE_` variables are bundled into client-side code and visible in browser DevTools, API keys used here **MUST** have Google Cloud HTTP Referrer / Origin restrictions applied (e.g. restricting the key to the application's domain/Cloud Run origin) and API surface restrictions limited strictly to `YouTube Data API v3`.
- **Zero Dependency on API Key**: If `VITE_YOUTUBE_API_KEY` is undefined or invalid, the application does not crash, hang, or error out. It seamlessly switches to the internal curated calisthenics catalog (`CURATED_YOUTUBE_MEDIA`).

---

## 3. Search Architecture & Quota Management

### 3.1 Focused Workout Search (`buildFocusedWorkoutQuery`)
Unrestricted search is explicitly prevented:
- User input is stripped of HTML/script tags and quote injection artifacts.
- Queries are automatically reinforced with category-specific athletic qualifiers:
  - **EXERCISE**: Appends `calisthenics exercise form tutorial technique`.
  - **WORKOUT**: Appends `follow along workout routine bodyweight calisthenics`.
  - **MOBILITY**: Appends `daily mobility routine flexibility recovery bodyweight`.
  - **MOTIVATION**: Appends `calisthenics training discipline mindset consistency`.
  - **MUSIC**: Appends `calisthenics training music workout beats instrumental focus`.
- YouTube API parameters enforce `type=video`, `videoEmbeddable=true`, and `safeSearch=strict`.

### 3.2 Debouncing, Pagination & Duplicate Prevention
- **Debouncing**: Search inputs in `MediaSearchBar` are debounced at 350ms to prevent rapid, wasteful API calls during typing.
- **Pagination**: Supports official YouTube `nextPageToken` and `prevPageToken` tokens through `handleLoadMore` pagination.
- **Duplicate Prevention**: In-flight fetch operations are locked using component state (`isLoading`), and repeated queries are resolved immediately from the cache.

### 3.3 Bounded TTL/LRU Cache (`BoundedTtlCache`)
- Implemented as an in-memory, bounded least-recently-used (LRU) cache with time-to-live expiration (`BoundedTtlCache<T>`).
- Default configuration: Maximum 40 entries, 10-minute TTL.
- Prevents memory leaks on long mobile sessions while eliminating redundant network traffic.

### 3.4 Quota & Network Error Handling
- **HTTP 403 / Quota Exceeded**: Caught gracefully by `DefaultYouTubeService.search()`. Logs an informative warning and returns the appropriate curated offline catalog without breaking UI or throwing unhandled exceptions.
- **Network / Offline**: Monitors `navigator.onLine` and `window.addEventListener('online'/'offline')`. In offline state, network requests are bypassed and the curated catalog is served instantly alongside an "Offline Mode Active" status banner.

---

## 4. Player Architecture & Lifecycle

### 4.1 Official YouTube IFrame Player API (`YouTubePlayer`)
All playback is powered by the official YouTube IFrame Player API:
- Dynamically loads `https://www.youtube.com/iframe_api` script once upon first mount.
- Initialises `new window.YT.Player` on container target with controlled origin settings (`enablejsapi: 1`, `modestbranding: 1`, `rel: 0`).
- Provides clean component unmounting (`player.destroy()`) to prevent memory leaks and detached audio threads.

### 4.2 Autoplay & Browser Restrictions
- If the browser blocks programmatic autoplay (`NotAllowedError` / `autoPlay=false`), the player traps the state and displays an overlay prompting a clean manual tap-to-play gesture.

### 4.3 Error Handling & Embedding Restrictions
Official player errors are caught and surfaced with clear, non-technical guidance:
- Error 2 / 100: Video removed or invalid ID.
- Error 101 / 150: Video owner does not allow embedded playback on third-party sites.
- When embedding is disabled or unavailable, an honest fallback banner is rendered with a direct button to "Open on YouTube" (`https://www.youtube.com/watch?v={id}`).

---

## 5. Demonstration System Integration & TrainingEngine Isolation

### 5.1 Multi-Source Demonstration Carousel
`DemonstrationSourceType` supports `'REAL_PERSON' | 'THREE_D_TRAINER' | 'YOUTUBE_VIDEO' | 'FUTURE_AI_GENERATED' | 'FUTURE_EXTERNAL_VIDEO'`.
- In `DemonstrationPanel`, users can toggle between:
  - **Athlete**: Kinematic vector motion loop.
  - **3D Biomechanical**: Multi-angle wireframe with tension highlights.
  - **YouTube**: Official video form demonstration.

### 5.2 Absolute TrainingEngine Isolation
- YouTube playback has zero control or coupling with `TrainingEngine`.
- The workout timer uses timestamp-based interval calculations (`intendedEndTime - currentTime`). It does not pause, drift, or reset when the user toggles video playback or switches demonstration sources.
- Switching between demonstration modes preserves all workout state, rep counts, and active timers.

### 5.3 Offline Demonstration Degradation
- When offline, `resolveDemonstrations()` automatically filters out network-dependent media sources (`YOUTUBE_VIDEO`), ensuring only 100% offline-ready vector demonstrations (`REAL_PERSON`, `THREE_D_TRAINER`) are presented.

---

## 6. Strict Prohibitions & Compliance

To respect YouTube Terms of Service, platform policies, and user trust:
1. **No Video Downloading**: No YouTube video binary stream or file is ever downloaded, stored, or cached locally.
2. **No YouTube Scraping**: No HTML parsing, unofficial scraping endpoints, or reverse-engineered APIs are used.
3. **No Audio Extraction**: No audio streams are extracted or converted into background audio files.
4. **No Unrestricted Browsing**: The media hub is strictly confined to fitness, calisthenics, and movement preparation.

---

## 7. Production Deployment Considerations

1. **Origin Verification**: When deploying to Cloud Run or custom domains, add the production origin URL to the Google Cloud Console API credentials whitelist.
2. **Offline-First PWA Cache**: The PWA service worker caches all core application assets, vector graphics, and exercise JSON datasets. It intentionally does **not** cache external YouTube media streams.
3. **Graceful Fallback**: If an API key is not configured in production, the PWA functions seamlessly using the curated local catalog.
