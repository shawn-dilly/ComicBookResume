# Comic Book Resume Project

An interactive comic book-style resume built with React, TypeScript, and Vite. Features a Silver Age Marvel aesthetic with page-flip interactions, halftone effects, and dynamic animations.

## Tech Stack

- **React 19** + **TypeScript 5.9** (strict mode)
- **Vite 7** for development and builds
- **CSS Modules** for component-scoped styling
- **GSAP 3.14** for animations
- **Custom GSAP page flip** (`ComicBookGSAP`) for the flipbook; react-pageflip no longer drives the book
- **Canvas 2D** for the web layers (no Three.js, no extra dependencies)

## Project Structure

```
src/
├── components/     # Reusable UI components (Panel, SpeechBubble, ActionWord, etc.)
│   ├── ComicBook/  # ComicBookGSAP: GSAP page flip, "hanger" wrapper physics moves
│   └── WebCatch/   # Webs that catch and hold the book (canvas layers, physics, config)
├── pages/          # Individual comic book pages
├── styles/         # Global CSS (variables, typography, halftone effects)
├── hooks/          # Custom React hooks (useHangPhysics runs the book's rope physics)
├── data/           # Resume content (resume.ts)
└── types/          # TypeScript type definitions
```

## Web Catch (lines and corner webs that hold the book)

The book falls in from above the screen and four lines shoot from the screen corners and catch it. Right after
a line attaches, a spider web grows from a hub out on the line, a little before the book, and fans toward the
book: part of it is outside the book and part overlaps the page corner. The lines then hold the book up. Pages
turning, dragging and (optionally) cutting all act on the same rope physics.

- `src/components/WebCatch/webConfig.ts` is the **single place for tunables** (physics, timings, per-corner web
  shapes in `WEB_SHAPES`, stroke widths, thresholds). Distances are in "units" = half a page width; stroke
  widths are in px.
- `physics.ts` is the pure simulation (`HangSim`, world space y-up, origin at the book's rest centre).
- `drawWebs.ts` draws the lines and webs; `webGeometry.ts` has the seeded corner web generator.
- `WebCatch.tsx` owns two fixed canvases: back (z-index 0: the lines and the whole webs, under the book) and front
  (below `--z-navigation`: the same webs clipped to the visible book face). Line and back-web colours come from
  `--web-strand-color` and `--web-halo-color`; the on-page strands use constant colours (`STROKE.front`).
- Corner webs: the hub sits `hubOut` before the book corner, on the line. Spokes radiate from it and end on the
  page (the two outer spokes land on the book edges, plus a few seeded interior ones); scalloped rings between
  adjacent spokes sit at fractions of the spoke length (`WRAP.ringFrom` to 1, so some fall outside the book, some on
  the page). Growth: spokes out of the hub, then rings weave outward. The back copy stays put during a page turn;
  only the on-page copy collapses and regrows on landing. A cut line takes its web with it. Each corner has its
  own size, hub distance and ring count (`WEB_SHAPES[i]`).
- Colours: the back and front canvases draw with the same `--web-strand-color` (near-white strand) and
  `--web-halo-color` (darker blue-grey outline) and the same widths, so a web is one colour across the book edge.
- Page-turn choreography (`RELEASE` in webConfig): when a flip starts, the two corners on the side the page leaves
  let go (forward = right pair, backward = left pair, including opening and closing the cover): the web folds into
  its hub and the line end snaps off the book and recoils toward its screen anchor (`RELEASE.recoil` of the line
  stays hanging). The ropes keep carrying the book (only the drawing lets go) so it just sags a hair toward that
  side. When the page lands the pair re-attaches, top corner first, bottom corner `bottomDelay` later: the line
  shoots back, hits (small twang) and the web regrows with the quick `WRAP.quick` timings. Each main line has a
  state (`attached | releasing | detached | shooting`), so chained or reversed flips resolve cleanly: a corner on
  the new "from" side lets go again, the others finish attaching. Cut lines stay cut. Reduced motion skips all of
  this. Phones do it with lines only. The on-page overlap of the corners on the other side still lets go for the
  whole turn and regrows after landing. `data-web-lines` counts attached main lines (dips to 2 in a turn).
- `src/hooks/useHangPhysics.ts` steps the sim on `gsap.ticker` and writes `transform` on the hanger element
  (between `.scene` and `.book` in `ComicBookGSAP`). It idles when the book and the corner webs are at rest, pauses
  when the tab is hidden, and handles drag (pointer events; swallows the click after a pull).
- Intro states: `falling` -> `catching` -> `held`. The book can only be opened once `held`; a click or key
  pressed earlier is remembered and applied then. The drop plays once per session (`sessionStorage` key
  `resume-web-catch-played`); later loads, and `prefers-reduced-motion`, start `held`. The 3D tumble is zeroed
  when `held` starts: leftover 3D rotation makes browser hit testing flip between the click zone and the artwork.
- Reduced motion: no drop, no dip/twang, no dragging. Phones (max-width 600px): lines only (no webs), no
  drag. If a canvas cannot be created there are no lines or webs and the book starts `held`.
- `?webs=cut` (read once at load, default off) lets visitors cut lines (hover to highlight) and click empty
  space to shoot a new line (a line only, no web). With every line cut the book falls away and the drop replays.
- Test hooks on `.app-container`: `data-web-state="falling|catching|held"` and `data-web-lines` (how many of
  the four main lines hold the book; updated only when it changes).

## Skills Hologram (Powers & Abilities)

When a page flip lands on the Powers & Abilities spread (`currentPage === 6`, either direction, every time) the
book lies flat and a holographic skyline with one tower per skill (categories x skills from `resumeData.skills`, 20 today) rises out of it. Not on phones (max-width 600px) and not
under `prefers-reduced-motion`: there the spread behaves as before. Test hook: `data-holo="off|entering|on|exiting"`
on `.app-container`.

- `src/components/SkillsHologram/holoConfig.ts` is the **single place for tunables** (tilt, lie-down fit, timings,
  tower size and layout, colours, idle motion, sound level). `SkillsHologram.tsx` / `.module.css` draw it,
  `holoSynth.ts` builds the sounds.
- Orchestration is `src/hooks/useHologramMode.ts` (phase machine, queued turn, resize/held bail-out) and
  `src/hooks/useHoloSound.ts` (own AudioContext, created on the first click/key like `useSoundEffects`).
- Enter: the book keeps hanging in its four lines (they follow the corners down, see below); it eases into a "pose" (rotateX ~58deg, lowered and scaled so the whole
  spread stays on screen, bottom ~45% of the viewport), then flash + scan line + light panel, a wave of towers rises
  with a flicker, labels fade in (~2 s from landing). Exit (page turn, Escape, close control): power down 0.25 s,
  the book stands up 0.45 s, then the queued turn runs (the usual from-side release and re-shoot) or, for Escape,
  nothing else happens (the lines never let go). A turn asked for while entering/leaving is queued (latest direction wins).
- The pose lives in `HangSim` (`pose`, `setPose`, `computePose`): `useHangPhysics` composes it into the hanger
  transform and does not snap to `''` while it is active. Do not write the hanger transform from anywhere else.
- Webs while posed: `HangSim.cornerPx(lx, ly)` is the single book-local to screen mapping (plain world to screen when
  upright; while posed it applies `translate rotate translateY rotateX scale` and the scene perspective with the
  hanger centre as origin). `drawWebs.ts` works in screen px, so lines end on, and corner webs are built from, the
  projected corners; the front-canvas clip is the projected book quad. The on-page overlap folds away while posed
  (the front canvas is above the hologram); the outside part of each web and the lines stay. If the `.scene`
  perspective or the pose transform chain in `useHangPhysics.writeTransform` changes, change `cornerPx` too.
- Towers and categories: tower sides carry the skill's own colour, re-lit to fixed OKLCH lightness levels
  (`HOLO.tone`, applied in the `.tower` rules; a plain `color-mix` fallback covers browsers without relative
  colour syntax). Each category is a row: a standing, billboarded nameplate button (`data-holo-nameplate`, aria-label
  "Leadership category, 4 skills", before its row's towers in tab order) next to the spine, towers running outward
  from it, and a faint pointer-transparent floor zone around the tower bases. Nameplates sit at the spine on both
  pages because perspective squeezes far rows toward the middle: anywhere else a nearer row's tall towers cover them.
  Hovering or focusing a nameplate highlights its row and reads out the category; hovering a tower brightens its
  own zone and plate a little; everything else dims to 40%. Reveal is category by category (`HOLO.timing`).
- Skills data: the printed pages split categories with `src/pages/Skills/layout.ts` (first two left, the rest
  right) and the hologram uses the same split; nothing assumes 4 categories or 4 skills.
- The hologram is a sibling of `.book` inside the hanger (`renderOverlay` on `ComicBookGSAP`), because `.book` has
  `contain: paint`. Towers are CSS 3D boxes standing along +Z from the page plane (height = level / 10 of the max).
  Never put `opacity` / `filter` on an element with 3D children (it flattens them): towers fade via `--flick`.
- Hit testing while tilted: the book gets `pointer-events: none` (`flat` prop) and a transparent hit plane
  (left half = previous page, right half = next page) sits 1px above the page, under the towers. Tower buttons win
  over it; Tab moves through the towers (`aria-label` "Name, 9 out of 10, Category"); Space on a tower or the
  controls is not a page turn. The readout and close control are 2D and portalled into `.app-container`.
- Dragging is off while lying flat; `?webs=cut` still works (cut lines stay cut).

## Design System

All design tokens are in `src/styles/variables.css`:
- Colors: `--comic-red`, `--comic-blue`, `--comic-yellow`, etc.
- Spacing: `--spacing-xs` through `--spacing-xl`
- Typography: 4 font families (Bangers, Comic Neue, Permanent Marker, Courier Prime)
- Z-index layers: Organized from `--z-page` (1) to `--z-overlay` (200)

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Type check and build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Custom Agents

### frontend-designer (KAPOW!)

A wildly creative front-end design specialist agent for visual design work, CSS artistry, and comic book aesthetics. This agent thinks in color palettes, animations, and visual storytelling.

**When to use this agent:**
- Creating new component variants and visual styles
- Designing animations and transitions with GSAP
- Modifying the color palette or typography
- Adding visual effects (halftone, shadows, gradients)
- Responsive design adjustments
- Any creative visual work

**How to invoke:**
When you need creative front-end design work, use the Task tool with the `general-purpose` subagent type and include this in your prompt:

```
Follow the agent instructions in .claude/agents/frontend-designer.md

[Your design task here]
```

**Example invocation:**
```
Task tool:
  subagent_type: "general-purpose"
  prompt: "Follow the agent instructions in .claude/agents/frontend-designer.md

  Create a new panel variant called 'spotlight' that's perfect for testimonials.
  It should feel special and draw attention to the quote."
```

**What this agent knows:**
- Silver Age Marvel comic book aesthetic (1960s-70s)
- CSS Modules patterns and conventions in this project
- GSAP animation techniques (timelines, easing, keyframes)
- Complete design system (colors, typography, spacing, z-index)
- All component variants and their intended purposes
- Halftone effects, comic text shadows, action bursts

**Agent definition:** `.claude/agents/frontend-designer.md`
