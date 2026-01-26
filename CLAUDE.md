# Comic Book Resume Project

An interactive comic book-style resume built with React, TypeScript, and Vite. Features a Silver Age Marvel aesthetic with page-flip interactions, halftone effects, and dynamic animations.

## Tech Stack

- **React 19** + **TypeScript 5.9** (strict mode)
- **Vite 7** for development and builds
- **CSS Modules** for component-scoped styling
- **GSAP 3.14** for animations
- **react-pageflip** for the flipbook experience

## Project Structure

```
src/
├── components/     # Reusable UI components (Panel, SpeechBubble, ActionWord, etc.)
├── pages/          # Individual comic book pages
├── styles/         # Global CSS (variables, typography, halftone effects)
├── hooks/          # Custom React hooks
├── data/           # Resume content (resume.ts)
└── types/          # TypeScript type definitions
```

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
