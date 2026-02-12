# PRD: Dark Mode Support

**Status:** Draft
**Effort:** Large (5-6 days)
**Priority:** TBD

---

## Problem Statement

The site currently renders with a light newsprint aesthetic in all browser contexts. Users on dark-mode-preferring browsers or OS settings see a jarring experience -- a bright comic book page against the already-dark page background. Supporting `prefers-color-scheme: dark` would improve visual comfort and demonstrate modern front-end polish.

A partial dark mode hook already exists in `variables.css` (overrides only `--newsprint` and `--newsprint-dark`), but it is incomplete and causes broken visuals when triggered because no other colors adapt.

---

## Goals

1. Automatically respect `prefers-color-scheme: dark` with no manual toggle required
2. Preserve the Silver Age Marvel comic book aesthetic in dark mode
3. Maintain accessibility contrast ratios (WCAG AA minimum)
4. Zero visual regressions in light mode

## Non-Goals

- Manual light/dark toggle switch (can be added later)
- Per-page theme variants
- Complete redesign of the comic aesthetic

---

## Design Philosophy

Dark mode for a comic book is **not** a simple color inversion. The current design simulates *printed newsprint* -- dark mode should evoke a **midnight reading** or **noir comic** feel rather than just swapping black and white. Think dark paper stock with vivid ink colors that pop.

---

## Current State Audit

### Color Architecture

| Layer | Status | Notes |
|-------|--------|-------|
| CSS variables (`variables.css`) | Partial | 30+ tokens defined; only 2 have dark overrides |
| Halftone patterns (`halftone.css`) | Needs work | 4x `mix-blend-mode: multiply` (invisible on dark bg) |
| Component CSS modules (21 files) | Mixed | 12 files are variable-only (ready); 9 have hardcoded values |
| Inline styles in TSX | Clean | All use `var()` references |

### Hardcoded Color Inventory

**85 total `rgba()` instances** across CSS modules:

| File | Count | Critical Values |
|------|-------|-----------------|
| `CoverPage.module.css` | 30 | Black shadows |
| `ComicBookGSAP.module.css` | 12 | Black shadows |
| `Experience.module.css` | 12 | 4 color-dependent: red, green, orange, yellow rgba |
| `Page.module.css` | 6 | Black + brown (aged effect) |
| `ContactSidebar.module.css` | 5 | Neon green, white |
| `halftone.css` | 7 | Black + brown |
| `Panel.module.css` | 3 | Black shadows |
| Others | 10 | Mostly black shadows |

**11 standalone hex colors** (not in variable fallbacks):

| File | Values | Purpose |
|------|--------|---------|
| `ComicBookGSAP.module.css` (dead code dir) | `#1a1a2e`, `#16213e`, `#0f3460`, `#8B0000`, `#5C0000` | Scene bg + cover gradients |
| `ContactSidebar.module.css` | `#0A66C2`, `#1a1a2e`, `#00ff00` | Social badges |
| `Experience.module.css` | `#0a1628` | Mission briefing header |

**4 `mix-blend-mode: multiply` instances** (break on dark backgrounds):

| File | Element |
|------|---------|
| `halftone.css` | `.halftone::after`, `.newsprint-texture::before` |
| `Panel.module.css` | Halftone overlay |
| `Page.module.css` | Halftone overlay |

### Files Already Dark-Mode Ready (no changes needed)

12 CSS files use only CSS variables for colors:
- `ActionWord.module.css`, `SpeechBubble.module.css`, `Navigation.module.css`
- `BackCover.module.css`, `Education.module.css`, `InsideCover.module.css`
- `Skills.module.css`, `SpecialProjects.module.css`, `Testimonials.module.css`
- `pages.module.css`, `flipbook.css`, `typography.css`

---

## Implementation Plan

### Phase 1: Variable System (4-6 hours)

**File:** `src/styles/variables.css`

Expand the existing incomplete `@media (prefers-color-scheme: dark)` block to override all color-related variables:

```
Dark Mode Variable Mapping:
--newsprint:        #F5F0E1  ->  #2A2520  (dark warm paper)
--newsprint-dark:   #E8E0C8  ->  #1A1510  (darker paper)
--aged-paper:       #FDF8E8  ->  #332D28  (dark aged paper)
--text-primary:     #231F20  ->  #E8E0D0  (light text on dark)
--text-caption:     #4A4A4A  ->  #B0A898  (muted light caption)
--panel-border:     #231F20  ->  #C8C0B0  (visible borders on dark)
--shadow-color:     rgba(35,31,32,0.3)  ->  rgba(0,0,0,0.5)   (deeper shadows)
--shadow-dark:      rgba(35,31,32,0.6)  ->  rgba(0,0,0,0.7)   (deeper shadows)
--comic-black:      #231F20  ->  #E8E0D0  (inverted for borders/text)
--comic-white:      #FFFFFF  ->  #1A1510  (inverted for fills)
--comic-cream:      #FFFDD0  ->  #2A2820  (dark cream)
```

New dark-only variables:
```
--halftone-dot-color:  var(--comic-black)  ->  rgba(255,240,220,0.3)
--aged-tint:           rgba(139,69,19,0.1) ->  rgba(200,180,160,0.05)
--blend-mode-halftone: multiply            ->  screen
```

### Phase 2: Halftone & Blend Mode Fix (8-12 hours)

**File:** `src/styles/halftone.css`

The core issue: `mix-blend-mode: multiply` makes dark dots on light backgrounds work, but on dark backgrounds everything goes black. Dark mode needs `screen` or `lighten` blend modes with lighter dot colors.

Changes:
- Add CSS custom property `--blend-mode-halftone` (default: `multiply`, dark: `screen`)
- Replace all 4 hardcoded `mix-blend-mode: multiply` with `var(--blend-mode-halftone)`
- Change halftone dot color from `var(--comic-black)` to `var(--halftone-dot-color)` in base `.halftone::after`
- Update `.newsprint-texture::before` SVG to use lighter noise in dark mode
- Adjust aged effect brown `rgba(139,69,19,...)` to use `var(--aged-tint)`

**Files also affected:** `Panel.module.css`, `Page.module.css` (their `mix-blend-mode: multiply` references)

### Phase 3: Shadow System Refactoring (6-8 hours)

Replace ~40 hardcoded `rgba(0,0,0,...)` shadow values across 8 files with CSS variable references.

Strategy: Most black shadows work fine in dark mode (dark shadow on dark bg just adds subtle depth). The ones that need changing are:
- **White/light overlays** in `CoverPage.module.css` (~5 instances) -- need inversion
- **Brown aged effects** in `Page.module.css`, `CCAStamp.module.css`, `halftone.css` (~6 instances) -- need `var(--aged-tint)`
- **Color-specific glows** in `Experience.module.css` (4 rgba instances with red/green/orange/yellow) -- need opacity adjustment for dark backgrounds

Files by priority:
1. `CoverPage.module.css` (30 rgba -- mostly shadows, ~5 need dark variant)
2. `Experience.module.css` (12 rgba -- 4 color-dependent need attention)
3. `Page.module.css` (6 rgba -- brown aged effects)
4. `ComicBookGSAP.module.css` (12 rgba -- black shadows, mostly fine)
5. `Panel.module.css` (3 rgba)
6. `CCAStamp.module.css` (1 rgba)
7. `common.module.css` (1 rgba)
8. `global.css` (1 rgba)

### Phase 4: Hardcoded Hex Refactoring (4-6 hours)

Replace 11 standalone hex values with CSS variables:

1. **`Experience.module.css`** -- `#0a1628` mission briefing bg -> already dark, needs lighter variant for dark mode contrast
2. **`ContactSidebar.module.css`** -- `#0A66C2` (LinkedIn), `#1a1a2e` (terminal bg), `#00ff00` (terminal green) -> These are intentionally themed, may only need border/contrast adjustments
3. **`ComicBookGSAP.module.css`** (dead code dir) -- `#1a1a2e`, `#16213e`, `#0f3460` (scene bg), `#8B0000`, `#5C0000` (cover gradients) -> Note: this is in the dead code directory per MEMORY.md, may not need changes

### Phase 5: Component-Level Dark Adjustments (6-8 hours)

Per-component tweaks after variables are in place:

- **CoverPage**: Red gradient on newsprint -- dark mode needs adjusted gradient stops
- **Page component**: Aged paper border effects, page number color
- **SpeechBubble**: Light bubble fill -> may need slight bg adjustment for contrast
- **ActionWord**: Bright colors on light bg -> verify pop on dark bg
- **ComicBookGSAP**: Book spine shadow, page edge gradients
- **ContactSidebar**: Terminal badge already dark -- verify it doesn't disappear

### Phase 6: Testing & Refinement (6-8 hours)

- Toggle `prefers-color-scheme` in browser DevTools across all pages
- Verify WCAG AA contrast on every text element
- Test halftone visibility at all densities
- Cross-browser: Chrome, Firefox, Safari
- Test page flip animations (GSAP) -- ensure no flash of wrong theme
- Verify print styles still work
- Test responsive breakpoints (600px, 900px) in dark mode

---

## Technical Approach

### CSS-Only (No JS Theme State)

All dark mode logic lives in CSS via `@media (prefers-color-scheme: dark)` overriding `:root` variables. This approach:
- Requires zero React state or context
- No flash of wrong theme on load
- No bundle size impact
- Automatically follows OS/browser preference

### Variable Override Pattern

```css
/* variables.css */
:root {
  --newsprint: #F5F0E1;
  /* ... all light defaults ... */
}

@media (prefers-color-scheme: dark) {
  :root {
    --newsprint: #2A2520;
    /* ... all dark overrides ... */
  }
}
```

Components using `var(--newsprint)` automatically adapt. No component code changes needed for variable-based styling.

---

## Effort Summary

| Phase | Hours | Files Changed |
|-------|-------|---------------|
| 1. Variable system | 4-6h | 1 (`variables.css`) |
| 2. Halftone/blend modes | 8-12h | 4 (`halftone.css`, `Panel.module.css`, `Page.module.css`, `variables.css`) |
| 3. Shadow refactoring | 6-8h | 8 CSS modules |
| 4. Hardcoded hex fixes | 4-6h | 3 CSS modules |
| 5. Component adjustments | 6-8h | ~6 CSS modules |
| 6. Testing & refinement | 6-8h | All |
| **Total** | **34-48h** | **~15 files** |

---

## Risks

1. **Aesthetic preservation** -- The comic book look is built on *printed paper*; dark mode fundamentally changes this metaphor. Requires design judgment, not just mechanical swaps.
2. **Halftone complexity** -- Inverting blend modes may produce unexpected artifacts at different dot densities.
3. **Scope creep** -- "Just one more tweak" on color balance across 10+ pages can expand testing significantly.
4. **Dead code confusion** -- `ComicBookGSAP/` (dead code dir) has hardcoded colors; must not waste time on unused files.

---

## Success Criteria

1. `prefers-color-scheme: dark` triggers full dark theme with no broken visuals
2. All text meets WCAG AA contrast (4.5:1 normal text, 3:1 large text)
3. Halftone dots visible on dark backgrounds
4. Comic book aesthetic preserved -- still feels like Silver Age Marvel
5. Light mode is pixel-identical to current (zero regressions)
6. `npm run build` passes with no new warnings
