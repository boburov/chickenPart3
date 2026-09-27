# Барака Ҳамкор Парранда: credit plan slides (ChickenPart3)

Eight 16:9 slides (React + Tailwind + GSAP) built from `data/Смета БХП.xlsx`, styled after
chicken-ov1.vercel.app: cover (with the joint-venture banner) → for each of Бройлер, Тухум and
Қайта ишлаш an overview slide and a table slide → Жами.

## Run

```bash
npm install
npm run dev -- --port 5175    # http://localhost:5175
```

`npm run build` makes a static copy in `dist/` (`npm run preview` serves it).

## Presenting

| Key | Action |
|---|---|
| → ↓ Space PageDown | next slide |
| ← ↑ PageUp | previous slide |
| 1–8, Home, End | jump to a slide |
| F | fullscreen |
| S | show the spreadsheet cell behind every number |
| ⌘P / Ctrl+P | PDF: one slide per page, final numbers, no animation |

Keys work on a Cyrillic keyboard layout too. `#3` opens slide 3; `?print` shows the PDF layout.

## Changing the numbers

Never edit numbers in the components. Change the spreadsheet, then:

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # first time only
npm run extract
```

`scripts/extract.py` reads the four sheets, re-checks all formulas (including links between
sheets) against the values Excel saved, and writes:

- `src/data/bhp.json`: every value with its sheet!cell, formula and notes
- `docs/verification.md`: the same values laid out like the sheet, plus the list of flags

Decisions baked into the extractor (see Flags in `docs/verification.md`):

- `броллер!C7` skips two rows, so the building total is the sum of all rows (62, not 47).
- `тухум1!F7` counts table eggs only; the parent flock's eggs (row 22) are shown separately.
- Only rows marked «мавжуд» count as existing broiler capacity ("ҳозир"). Асака 4-фабрика
  is treated as a re-equipment project; to count it as existing, add row 25 to
  `EXISTING_OVERRIDES` in `scripts/extract.py`.

## Photos and banner

The cover has four numbered photo spaces: put image URLs (or files placed in `public/photos/`)
in `src/data/photos.ts`; empty entries show a branded placeholder with the same caption.

The joint-venture banner text (“KEGEYLI BARAKA NASLLI PARRANDA” H.K and
“BEIJING HUA DU YOUKOU POULTRY CO., LTD”) is `JOINT_VENTURE` in `src/data/deck.ts`.

## Where things are

- `src/data/deck.ts`: turns the JSON into slide figures (rounding keeps parts adding up to totals)
- `src/slides/`: cover, overview and table slides (shared by the three directions), total
- `src/components/`: charts, tables, header and footer
- `src/lib/motion.ts`: GSAP entrance animations
- Brand colours and fonts: `src/index.css` (`@theme`)
