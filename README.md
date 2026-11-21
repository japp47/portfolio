# Jappreet Singh Chhabra: portfolio

Personal site for a backend engineer (SDE II, HashedIn by Deloitte) looking for backend and fintech roles.
One landing page for now; case-study pages come next.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/ on http://localhost:4173
```

## How it is built

- **Vite + TypeScript**, no framework, no UI kit. `index.html` is the page; `src/style.css`, `src/main.ts`, `src/field.ts`.
- **Look:** dark and monochrome. Near-black ground, off-white ink, greys. Geist for text, Geist Mono for
  labels, Instrument Serif italic for the soft words. Faint film grain over everything.
- **Hero (`src/field.ts`):** a three.js terrain of ~22k dots whose height is a sum of sine waves. On load every
  dot starts at a random height (binary noise) and eases onto the surface; the pointer pushes a bump into it.
  All in the vertex shader. Stops when off screen or the tab is hidden; drawn once, still, under reduced motion.
- **Motion (`src/main.ts`):** the name rises line by line, "01101000 01101001" decodes into "hi, I'm",
  the role types itself, live Bengaluru clock, custom cursor, magnetic links, project rows that fill on hover,
  sections that rise in once, and "say hi" that decodes through binary on hover.
- `archive/` keeps the two earlier drafts (drawing sheet, light stone) for reference.

## Page plan

1. **Hero** – name, typed role, one line about me, GitHub / LinkedIn / email.
2. **Work** – index of seven projects from GitHub (99ile, LLM Gateway, spreadsheet engine, own Git, SketchGround, airline microservices, Splitwise).
3. **Now** – the day job: Zora AI and MPI New Zealand.
4. **About** – math first, then code; stack, likes, awards, certs.
5. **Contact** – a huge "say hi" and the links.

## To do

- The npm link for the gateway.
- Case-study pages for Zora AI, 99ile and the gateway (decision records, diagrams, numbers).
- Deploy (Vercel or Cloudflare Pages).
