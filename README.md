# EGG ME 🥚

A cozy pixel-art chicken egg timer, in English and French.

Pick an egg → **START COOKING** → wait → get an alert when it's ready.

| Level | EN | FR | Time |
|---|---|---|---|
| 1 | SOFT | ŒUF COULANT | 5:00 |
| 2 | MEDIUM SOFT | ŒUF MOLLET | 6:00 |
| 3 | MEDIUM | ŒUF À POINT | 7:00 |
| 4 | MEDIUM HARD | ŒUF PRESQUE DUR | 8:00 |
| 5 | HARD | ŒUF DUR | 10:00 |

## Run it

Open `index.html` in a browser. No build step, backend or external requests.

## Files

- `index.html`: the three screens (home, timer, done)
- `style.css`: pixel-art styling, responsive layout, reduced-motion support. The Pixelify Sans font (SIL Open Font License) is embedded so it also loads from `file://`.
- `script.js`:
  - `translations`: all user-facing text (EN/FR)
  - `LEVELS`: cooking times and how cooked each yolk is drawn
  - `eggSVG()`: draws the pixel eggs on a grid in code (no image files)
  - the timer, which works from timestamps, so pausing, resuming and slow tabs stay accurate
  - `Alarm`: a Web Audio chime, scheduled ahead so it rings on time in a background tab and plays only once

Cooking times are approximate. They depend on the egg size, its starting temperature and the cooking conditions.
