# Jappreet Singh Chhabra: portfolio

Personal site for a backend engineer (SDE II, HashedIn by Deloitte). Live at
[jappreet.netlify.app](https://jappreet.netlify.app).

## Run it

```bash
npm install
npm run dev           # http://localhost:5173
npm run build         # typecheck, then a production build into dist/
npm run preview       # serve dist/ on http://localhost:4173
npm run check         # typecheck + formatting check (run before pushing)
npm run format        # format everything with Prettier
```

Netlify builds with `npm run build` and publishes `dist/` (see `netlify.toml`).

## Folder structure

```
index.html                  the page: all text and sections live here
public/                     copied as-is into the build
  og.jpg                    link-preview image
  Jappreet-Chhabra-Resume.pdf
src/
  main.ts                   entry: imports the styles and mounts each feature
  config/site.ts            email, social links, resume path, time zone (one source of truth)
  lib/                      small helpers shared by features
    media.ts                reduced motion, pointer type, phone sensors permission
    scramble.ts             the 0/1 "decode" text effect
  features/                 one folder per thing on the page
    field/                  the three.js dot terrain in the hero
      index.ts              scene, render loop, mouse
      shaders.ts            GLSL for the dots
      sensors.ts            phone tilt and shake
    hero/
      intro.ts              load sequence: name rises, greeting decodes, role types
      motion-hint.ts        "tilt or shake your phone" pill
    terminal/               the ~ shell
      index.ts              panel, input, history, keyboard
      commands.ts           every command and what it prints
      projects.ts           project data for ls / cat / open
      format.ts             HTML helpers for output lines
      dodge.ts              keeps the corner button off the link rows
    binary-art/index.ts     "jsc" drawn in 0s and 1s (About)
    ui/                     clock, custom cursor, magnetic links, scroll reveal
  styles/
    index.css               imports the files below in cascade order
    tokens.css              colours, fonts, easing, spacing
    base.css                reset, utilities (.mono, .links, .pill)
    effects.css             grain, cursor, reveal, shared keyframes
    header.css, hero.css, sections.css, work.css, now.css,
    about.css, contact.css, terminal.css
    motion.css              everything off for prefers-reduced-motion
archive/                    earlier drafts, kept for reference, not built
```

## Conventions

- **TypeScript, strict**, no framework. Each feature exports one `mount…()` function and owns its DOM
  lookups; `main.ts` only decides what runs.
- **Formatting:** Prettier (`.prettierrc.json`), 2 spaces, single quotes, 110 columns. `.editorconfig` for editors.
- **CSS:** one file per section, BEM-ish class names (`.hero__name`, `.row__live`), shared values as
  custom properties in `tokens.css`, phone rules at the bottom of each file under `(max-width: 860px)`.
- **Motion:** every effect checks `prefersReducedMotion()`; loops pause when off screen or the tab is hidden.
- **Content:** links and the resume path live in `src/config/site.ts`; page copy lives in `index.html`.

## Look

Dark and monochrome: near-black ground, off-white ink, greys. Geist for text, Geist Mono for labels,
Instrument Serif italic for the soft words, faint film grain over everything.

## To do

- The npm link for the gateway.
- Case-study pages for 99ile, the gateway and Zora AI.
