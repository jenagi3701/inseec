# 🚌 BUS SEAT CHALLENGE

> 👀 Look. 🧠 Think. ⚡ React. 🚌 Catch the right seat.

A pixel-art reflex & observation arcade game. The bus stops, passengers board, a free spot lights up — **who should get it?** Tap the right passenger before the timer runs out. You get faster, sharper and better at reading a scene as you go.

It's plain HTML + CSS + vanilla JavaScript. There's no build step, no backend and no external API. Every sprite and sound is generated in code.

---

## 1. Launch the game locally

The game is static files. Any static web server will do:

```bash
cd bus-seat-challenge
python3 -m http.server 8000
# then open http://localhost:8000
```

or `npx serve .`. You can also double-click `index.html`, since the game uses no modules or fetches and works from `file://`.

The pixel fonts load from Google Fonts. Offline, the game falls back to a monospace font and still works.

Optional URL flag: `?speed=2` makes the game clock run twice as fast. It's useful for testing.

## File structure

```
bus-seat-challenge/
├── index.html                    screens: menu, route map, how-to, scores, settings, game, modal
├── style.css                     pixel UI, responsive layout, high-contrast & reduced-motion modes
├── config.js                     ★ MAIN GAME CONFIGURATION (levels, passengers, scoring, daily)
├── i18n.js                       French translation (UI phrases, passengers, levels)
├── script.js                     game engine: generator, state machine, scoring, rendering, UI
├── assets/
│   ├── characters/characters.js  procedural pixel-art passengers (auto-outlined, cached)
│   ├── bus/bus.js                bus layouts (wide/tall), seats, ♿ space, door, scenery, bus sprite
│   ├── sounds/sfx.js             8-bit WebAudio sound effects + chiptune loop (no audio files)
│   └── ui/icon.svg               favicon
└── README.md
```

## 2. How the game logic works

**Flow:** `START → ROUTE MAP → STOP intro → rounds → STOP CLEARED → next stop … → MASTER OF THE BUS` (or `GAME OVER`).

Each round runs through a small state machine (`update()` in `script.js`):

| Phase     | What happens |
|-----------|--------------|
| `arrive`  | Bus slows down, scene fades in. |
| `board`   | Doors open and passengers walk in to their spots. |
| `look`    | *Memory/flash rounds only:* "LOOK! 3…2…1", then passengers turn into identical `?` silhouettes. |
| `decide`  | Timer runs. The free spot is marked with a dashed outline, ★/♿ and a bouncing arrow. Player clicks/taps/keys a passenger (or a spot, in *place* rounds). |
| `resolve` | ✓/✗ marks, explanation, the right passenger walks to the spot. Next free spot, or end of round. |
| `outro`   | "PERFECT BUS SENSE!" if no mistakes, then the bus drives to the next stop. |

**Who is "correct"?** Every passenger type has a `need` value (0–3) in `config.js`. The answer depends on the **free spot**:

- **Seat:** the correct answers are *all* visible passengers with the highest need for a seat. Ties are common, so several answers can be right (pregnant vs. elderly, for example). A wheelchair user is never the answer for a seat, because they need the ♿ space.
- **♿ wheelchair space:** only the wheelchair user.
- **Place rounds ("WHERE SHOULD THEY GO?"):** wheelchair user → ♿ space. Passenger with high need → priority seat (orange, striped, cane icon). Passenger with no special need → a normal seat, which keeps the priority seats free.

After every decision a short explanation is shown (for example, *"That is an umbrella, not a cane!"*). The game teaches *observe → understand context → prioritise → act* instead of a single rule to memorise. The need levels are a game rule for these scenarios, not a ranking of people.

**Observation mechanics** come from the **scenario generator** (`generateRound()`):

- **Decoys:** a folded umbrella looks like a cane, a cat carrier like a baby, one small bag like heavy shopping.
- **Hidden clues + twins:** a passenger with a small clue (pink "baby on board" badge, sunflower lanyard, leg brace) is cloned into a **look-alike twin** with the same clothes, hair and skin. The twin has no clue, or a similar decoy: a yellow smiley pin, a plain blue work lanyard, or no brace.
- **Distractions:** dancing/jumping passengers, music notes, glowing phones, flickering ads, a pigeon.
- **Movement:** passengers shuffle around and board late through the door. People with a leg brace or cast walk slowly with a limp, which is a clue in itself.

## 3. How the difficulty system works

Difficulty grows by adding a **new kind of thinking** at each stop, not only by shrinking the timer:

| Stop | Name | Skill | What's new |
|---|---|---|---|
| 01 | First Ride | Recognition | 3 passengers, 1 obvious need, 12 s |
| 02 | Busy Morning | Observation | more clue types, ties (several right answers) |
| 03 | Rush Hour | Prioritisation | different need levels, ♿ space, *place* rounds |
| 04 | Speed Lane | Speed | 5 s timer, QUICK CLICK sparkle rounds |
| 05 | Distraction City | Focus | decoys + animated distractions |
| 06 | Memory Express | Memory | LOOK!→hide (memory) and 1.4 s FLASH rounds |
| 07 | Priority Plaza | Multiple priorities | 2 seats for 3–4 people in need, hidden clues & twins |
| 08 | Moving Market | Tracking | passengers move and board late, leg-brace clue |
| 09 | Chaos Station | Multitasking | everything mixed, 8 passengers, 5.5 s |
| 10 | Master of the Bus | Everything | 9–10 passengers, 2–3 spots, 5 s, all mechanics |

Round 2 of every stop always uses that stop's signature mechanic, so it always shows up. Hearts carry over between stops, and clearing a stop restores one.

**Daily challenge:** uses a seed made from today's date, so everyone gets the same buses that day. It has 10 passengers, 4 free spots, 8 s and 3 situations. Today's best score is saved.

## 4. How to add a new passenger type

1. In `config.js → passengers`, add an entry:
   ```js
   stroller: { name: 'Parent with stroller', need: 2, look: { stroller: true },
               why: 'Needs space and stability for the stroller.' },
   ```
   Optional flags: `slow` (limps when walking), `hidden` + `twin: {…}` (small clue with a look-alike), `decoy`, `wheelchair`.
2. Draw the clue in `assets/characters/characters.js → drawPerson()`. Every `look` flag is available as `f.<flag>`:
   ```js
   if (f.stroller) { g.rect(15, 20, 6, 6, '#3a3f4e'); /* … */ }
   ```
   Use the 22×32 pixel grid. Outlines are added automatically.
3. Add the id to the `needyPool`, `fillerPool`, `decoyPool` or `hiddenPool` of the levels where it should appear. You can also add it to `clueBook` so it shows on the How-to-play screen, or to a level's `learn` list so it's introduced on that stop's intro card.

## 5. How to add a new level

Add an object to `config.js → levels`. All fields are documented at the top of the `levels` array:

```js
{ id: 11, stop: 'NIGHT BUS', skill: 'LOW LIGHT', icon: '🌙', sky: 'night',
  rounds: 6, passengers: [7, 8], targets: [2, 2], needy: [3, 4], time: 5,
  modes: { standard: 2, memory: 1, quick: 1 },
  needyPool: [...], fillerPool: [...], decoyPool: [...], decoyChance: 0.3,
  hiddenPool: ['badge'], hiddenChance: 0.5, mixNeeds: true, distraction: 2,
  moving: { every: [1, 1.8], late: 1, speed: 1.2 }, quickWindow: 1.0, lookTime: 2,
  tip: 'Short intro text shown before the stop.', learn: [] }
```

The route map, unlocking, scores and stars update automatically. Round modes are `standard`, `place`, `quick`, `memory`, `flash` and `distraction`. Sky themes are `morning`, `day`, `sunset` and `night`.

## 6. How to modify scoring

Everything lives in `config.js → scoring`:

- `correct` / `wrong`: base points (+100 / −100). The score never drops below 0.
- `speedBonus`: reaction-time thresholds (<1 s +100, <2 s +75, <3 s +50, <5 s +25).
- `combos`: multipliers (3 → ×1.5, 5 → ×2, 10 → ×3). The combo resets on any mistake.
- `perfectReaction` / `slowReaction`: thresholds for the "LIGHTNING FAST!" and "GOOD OBSERVATION!" messages.
- `levelClearBonus`, `heartBonus`: end-of-stop bonuses.
- `lives`, `healOnLevelClear` (top of the config).

The points formula is in `applyResult()` in `script.js`: `(correct + speedBonus) × comboMultiplier`, rounded to 5.

## 7. Where is the main configuration?

**`config.js`** (`window.BSC_CONFIG`). Lives, scoring, every passenger type, all 10 levels and the daily challenge are defined there. The engine only reads it.

Other useful places:

- `assets/bus/bus.js`: bus layouts (seat/slot coordinates for the landscape and portrait views), themes and props
- `assets/characters/characters.js`: colour palettes and sprite drawing
- `assets/sounds/sfx.js`: sound effects and the music loop
- `script.js → defaults()`: the localStorage save format (`busSeatChallenge.save.v1`)

---

## Controls & accessibility

- **Mouse / touch:** click or tap a passenger (or a spot). Hit areas are generous, and a tap near a passenger counts.
- **Keyboard:** `← → ↑ ↓` / `Tab` move the focus, `Enter` / `Space` pick, `1`–`9` pick by number (labels appear), `P` / `Esc` pause, `M` (or the 🔊 button in the HUD) mutes / unmutes.
- **Language:** 🌐 English / Français (menu button or Settings; defaults to the browser language).
- **Settings** (menu or pause): 🔊 Sound, 🎵 Music, ◐ High contrast (stronger colours, background passengers dimmed), 🐢 Reduced motion (no shake, no scrolling scenery or particles, instant boarding). Reduced motion follows the OS preference on first launch.
- Important information never relies on colour alone. Priority seats have stripes and a pictogram, the ♿ space has an icon, hearts are ♥ / ♡, results show ✓ / ✗ marks plus text, and the low-time warning blinks and shows a striped bar.
- Responsive: landscape uses a side-view bus (front to the right), portrait phones get a vertical bus (front at the top). The layout switches live when the device rotates.

## Saved data (localStorage)

Unlocked stops, best score and stars per stop, best run score, best combo, best reaction time, today's daily best, lifetime accuracy, and settings. **SCORE → RESET PROGRESS** clears it all except settings.

## Testing hook

`window.__BSC` exposes `answer()`, `wrong()`, `candidates()`, `onPick()` and `generate(level, seed)`. The automated play-tests used these to play the whole campaign, the game-over path and the daily challenge, and to stress-test the scenario generator (15,000 rounds, all solvable).
