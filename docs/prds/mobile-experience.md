# PRD: Mobile Experience

**Status:** Draft (v2 -- Landscape-First Approach)
**Effort:** Medium-Large (4-6 days)
**Priority:** TBD

---

## Problem Statement

The comic book resume is unusable on phones. In portrait, the 2-page spread renders each page at ~175px wide (44% of the designed 400px). Content gets crushed, not reflowed. There are no swipe gestures -- users must tap narrow click zones. Dense pages (Experience, Origin Story, Skills) become illegible.

---

## Goals

1. Readable comic book experience on mobile phones
2. Natural swipe-to-flip gesture support on touch devices
3. Content legible without requiring zoom
4. Preserve the 2-page spread and comic book page-flip feel
5. Desktop experience unchanged (zero regressions)

## Non-Goals

- Single-page rendering mode (too complex, breaks book metaphor)
- Portrait-first phone layout (landscape preserves the spread)
- Native app or PWA wrapper

---

## Revised Strategy: Landscape-First + Orientation Prompt

Instead of rewriting the flipbook for single-page mode, **prompt mobile users to rotate to landscape** and optimize the 2-page spread for landscape phone dimensions. This preserves the existing architecture while making content readable.

### Why Landscape Works

In landscape, the viewport width is wide enough for a proper 2-page spread, and each page gets 200-227px wide -- roughly half the designed 400px but far better than the broken 175px in portrait (where the book actually overflows the viewport).

| Phone (Landscape) | Viewport | Per-Page (current) | Per-Page (optimized) |
|---|---|---|---|
| iPhone 14 Pro Max | 932x430 | 227x341 | ~250x375 |
| Pixel 7 | 915x412 | 215x323 | ~237x355 |
| iPhone 12/14 | 844x390 | 201x301 | ~222x333 |
| iPhone SE | 667x375 | 200x300 | ~210x315 |
| Galaxy S21 | 800x360 | 200x300 | ~210x315 |

**"Optimized" column** reflects reducing the reserved vertical space from 82px to ~30px on mobile landscape (keyboard hints are already hidden, so the 70px bottom reserve is unnecessary).

At ~210-250px per page, content is tight but readable with targeted density reduction. This is the same viewing experience as reading a physical pocket-sized comic book.

---

## Current State

### What Already Works
- Dynamic JS dimension calculation adapts to any viewport
- 5 CSS breakpoints (1200, 900, 600, 480, 360px)
- Font sizes use `rem` units that scale with HTML font-size
- CoverPage hero name uses `clamp()` for responsive sizing
- ContactSidebar repositions to bottom bar at <=600px
- Keyboard hints already hidden at <=600px

### What's Missing
- No orientation prompt for mobile users
- No swipe gesture support
- Reserved space wastes ~50px of precious vertical space on mobile
- Dense page content doesn't adapt for small dimensions
- No mobile navigation affordance (hints hidden, nothing replaces them)
- Minimum clamp (200x300) could be slightly more generous

---

## Implementation Plan

### Phase 1: Orientation Prompt + Dimension Optimization (6-8 hours)

#### 1a. Orientation Prompt Component

**New files:**
- `src/components/OrientationPrompt/OrientationPrompt.tsx`
- `src/components/OrientationPrompt/OrientationPrompt.module.css`
- `src/components/OrientationPrompt/index.ts`

**Modified files:**
- `src/components/index.ts` -- add export
- `src/App.tsx` -- render conditionally

Behavior:
- Detect portrait orientation on mobile via `window.matchMedia('(orientation: portrait) and (max-width: 600px)')`
- Show a full-screen overlay with comic-themed "ROTATE YOUR DEVICE!" message
- Animated phone icon rotating from portrait to landscape
- Auto-dismiss when user rotates (listen for `orientationchange` or resize)
- Include a "Continue in portrait anyway" dismiss button (don't force it)
- Store dismissal preference in `sessionStorage` (per-session, not permanent)

Comic styling:
- Dark semi-transparent backdrop
- Action burst starburst behind the message
- "Bangers" font, yellow text on dark background
- Animated rotation icon using GSAP or CSS keyframes

#### 1b. Dimension Calculation Optimization

**File:** `src/components/ComicBook/ComicBookGSAP.tsx`

In `calculateDimensions()`, detect mobile landscape and reduce reserved space:

```
Current:  availableHeight = vh - 82    (12px top + 70px bottom)
Mobile:   availableHeight = vh - 30    (8px top + 22px bottom)
```

Also remove the 0.98 multiplier on mobile (use full available height):

```
Current:  pageHeight = availableHeight * 0.98
Mobile:   pageHeight = availableHeight * 1.0
```

This gains ~55px of height on mobile, pushing pages from 200x300 to ~210x315 on iPhone SE and ~222x333 on iPhone 14.

### Phase 2: Swipe Gesture Support (6-8 hours)

**New file:** `src/hooks/useSwipeNavigation.ts`

Custom touch gesture detection (no external dependency):
- `touchstart` / `touchmove` / `touchend` event listeners
- Minimum swipe distance threshold (~50px)
- Horizontal only (ignore vertical to prevent scroll conflicts)
- Swipe left = next page, swipe right = previous page
- Debounce to prevent rapid-fire flips

**File:** `src/components/ComicBook/ComicBookGSAP.tsx`

- Accept optional `onSwipeLeft` / `onSwipeRight` props, or integrate hook directly
- Attach touch handlers to the `.scene` container
- Connect to existing `flipSheet('forward')` / `flipSheet('backward')`

**File:** `src/App.tsx`

- Wire up swipe navigation (same pattern as `usePageNavigation` keyboard hook)

### Phase 3: Mobile Navigation Affordance (3-4 hours)

Replace hidden keyboard hints with mobile-friendly indicators.

**Swipe hint (first visit):**
- Brief animated overlay: hand icon swiping left
- Auto-dismiss after 3 seconds or on first swipe/tap
- Show only once per session (`sessionStorage`)

**Page counter pill (persistent):**
- Extract the existing page indicator ("3 / 14") from the keyboard-hints bar
- Show it independently on mobile as a small fixed pill at bottom center
- Compact styling: `background: rgba(0,0,0,0.5)`, backdrop-blur, Bangers font

**Files:**
- `src/styles/global.css` -- add mobile page counter styles, separate from keyboard-hints
- `src/App.tsx` -- render page counter on mobile even when keyboard-hints hidden

### Phase 4: Content Density Adaptation (10-14 hours)

At ~210-250px per page width in landscape, most content needs slimming. Changes are CSS-only where possible.

#### All Pages -- Global Adjustments

**File:** `src/styles/global.css` or `src/pages/pages.module.css`

- Add landscape mobile breakpoint: `@media (max-height: 450px) and (orientation: landscape)`
- Reduce page padding from `var(--spacing-md)` (16px) to 6-8px
- Tighten line-height on body text (1.4 -> 1.2)

#### Experience Pages (High effort -- densest content)

**Files:** `src/pages/Experience.module.css`, possibly TSX files

- Mission briefing header: reduce padding, smaller title
- Objectives list: limit visible items to 4-5 with CSS (`li:nth-child(n+6) { display: none }`)
- Tactical power badges: reduce to 1 row, smaller gap
- Role timeline (Ezlinks multi-role): compact spacing between roles
- Font size floor: ensure no text below 10px rendered (already at 62.5% rem scale)

#### Origin Story Pages (Medium effort)

**Files:** `src/pages/OriginStory.module.css`

The 2x2 panel grid is the challenge. At ~210px page width, each panel is ~100px wide.

Options:
- **Option A (recommended):** Keep 2x2 grid but reduce panel padding to near-zero, shrink narrator caption text, tighten gap between panels. Content becomes small but retains comic book layout.
- **Option B:** Switch to 2x1 grid (2 tall panels stacked) on mobile landscape. Loses the grid aesthetic but gains width per panel.
- **Option C:** Allow contained vertical scroll within the page for overflow panels.

Recommendation: Option A first -- keep the grid, slim the padding. It's a pocket comic, not a full-size issue. If testing shows it's too small, fall back to Option B.

#### Skills Pages (Low-Medium effort)

**Files:** `src/pages/Skills.module.css`

- PowerMeter bars: ensure label text doesn't overlap the bar at 210px
- May need to stack label above bar instead of inline
- Category headers: verify readable at mobile font scale

#### Special Projects Page (Medium effort)

**Files:** `src/pages/SpecialProjects.module.css`

- Project panels: tighten padding
- Tech tag pills: allow natural wrap (already flex-wrap)
- Description text: 2-line max with ellipsis via `-webkit-line-clamp`

#### Cover & Back Cover (Low effort)

Already responsive via `clamp()`. May just need padding reduction.

#### Testimonials (Low effort)

Speech bubbles flex naturally. Verify font size minimum.

### Phase 5: Testing & Polish (6-8 hours)

- Test in Chrome DevTools device emulation: iPhone SE, iPhone 14, Pixel 7, Galaxy S21 (all landscape)
- Test orientation prompt appears/dismisses correctly
- Test swipe gestures: left/right, rapid swipes, edge cases
- Verify ContactSidebar doesn't overlap book in landscape
- Verify page counter pill doesn't obscure content
- Test the "continue in portrait" fallback path
- Performance: GSAP animations at 60fps on mid-range phones
- Verify desktop is pixel-identical (zero regressions)
- `npm run build` passes clean

---

## Technical Details

### Orientation Detection

```typescript
const isMobileLandscape = window.matchMedia(
  '(orientation: landscape) and (max-height: 450px)'
).matches;

const isMobilePortrait = window.matchMedia(
  '(orientation: portrait) and (max-width: 600px)'
).matches;
```

Use `max-height: 450px` for landscape detection rather than `max-width` since landscape flips the dimensions. 450px covers all phone heights in landscape (iPhone SE = 375px, iPhone 14 Pro Max = 430px).

### CSS Breakpoint Strategy

Add a new landscape-mobile breakpoint alongside existing ones:

```css
/* Existing */
@media (max-width: 600px) { ... }
@media (max-width: 480px) { ... }

/* New: landscape phones */
@media (max-height: 450px) and (orientation: landscape) {
  /* Tighter padding, smaller fonts, slimmed content */
}
```

This targets landscape phones specifically without affecting tablets or desktop.

### Swipe Implementation (Custom, No Dependencies)

```typescript
// useSwipeNavigation.ts (simplified)
const THRESHOLD = 50; // minimum px to count as swipe

function useSwipeNavigation(ref, { onSwipeLeft, onSwipeRight }) {
  // Track touchstart X position
  // On touchend, if deltaX > THRESHOLD, trigger callback
  // Ignore if deltaY > deltaX (vertical scroll)
}
```

~80-100 LOC. No external dependencies needed for this use case.

---

## Effort Summary

| Phase | Hours | Files Changed | New Files |
|-------|-------|---------------|-----------|
| 1. Orientation prompt + dimension optimization | 6-8h | 3 (`ComicBookGSAP.tsx`, `App.tsx`, `components/index.ts`) | 3 (OrientationPrompt component) |
| 2. Swipe gestures | 6-8h | 2 (`ComicBookGSAP.tsx`, `App.tsx`) | 1 (`useSwipeNavigation.ts`) |
| 3. Mobile nav affordance | 3-4h | 2 (`App.tsx`, `global.css`) | 0 |
| 4. Content density adaptation | 10-14h | 6-8 page/component CSS modules | 0 |
| 5. Testing & polish | 6-8h | Various | 0 |
| **Total** | **31-42h** | **~12 files** | **4 new files** |

---

## Phased Delivery Option

### Mobile v1 (Quick Win -- 2-3 days)
- Phase 1: Orientation prompt + dimension optimization
- Phase 2: Swipe gestures
- Phase 3: Navigation affordance
- **Result:** Users prompted to landscape, book fits, swipe works, navigation clear

### Mobile v2 (Content Polish -- 2-3 days)
- Phase 4: Content density adaptation
- Phase 5: Full testing
- **Result:** Dense pages slimmed for landscape, thoroughly tested

---

## Risks

1. **User compliance** -- Some users may ignore the rotation prompt and stay in portrait. The "continue anyway" button means portrait still looks bad. Acceptable trade-off vs. building single-page mode.
2. **Landscape lock** -- iOS Safari doesn't support `screen.orientation.lock()`. We can only prompt, not force.
3. **Content at half-scale** -- Even in optimized landscape, pages are ~50-60% of designed size. Dense Experience pages may need aggressive trimming. Some information loss is acceptable for mobile.
4. **ContactSidebar overlap** -- The bottom horizontal bar may overlap the book in landscape. Need to verify positioning or hide it during landscape reading.
5. **Orientation change mid-read** -- User rotates while reading; dimensions recalculate but current page state must be preserved. Already handled by resize listener.

---

## Success Criteria

1. Orientation prompt appears on portrait mobile, dismisses on rotation
2. In landscape, all pages readable without zooming on iPhone SE (667x375)
3. Swipe left/right navigates pages naturally
4. Page counter visible on mobile
5. No content overflow that hides critical resume information
6. Desktop experience pixel-identical (zero regressions)
7. `npm run build` passes clean

---

## Comparison: This Approach vs. Single-Page Mode

| | Landscape-First (this PRD) | Single-Page Mode (original) |
|---|---|---|
| **Effort** | 31-42h (4-6 days) | 52-74h (8-12 days) |
| **ComicBookGSAP changes** | Minimal (dimension calc tweak) | Major (new rendering mode) |
| **Risk** | Low (no architecture changes) | High (dual-mode state management) |
| **Book metaphor** | Preserved (2-page spread) | Weakened (no spread on mobile) |
| **Trade-off** | Users must rotate phone | Pages at full phone width |
| **Per-page width** | 210-250px | 330-350px |
| **Content readability** | Good with density adaptation | Very good |

The landscape approach delivers ~60% of the benefit at ~50% of the cost, with much lower risk since the flipbook architecture stays untouched.

---

## Comparison Note

See also: [Dark Mode PRD](./dark-mode.md) (34-48h, ~15 files) for effort comparison.
