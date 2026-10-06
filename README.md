# Pixel Pirate Adventure

A small 2D pixel-art pirate platformer with **9 playable crew members**, built with plain HTML, CSS and vanilla JavaScript (canvas). No backend, no build step.

## Play

Open `index.html` in any modern browser (or serve the folder with any static server).

**Loop:** choose a level → pick a character → fight → collect coins → beat the boss → unlock new crew → play again.

### Controls

| Key | Action |
|---|---|
| A / D (or ←/→) | Move |
| Space / W | Jump |
| J | Attack (hold to repeat) |
| Q | Skill 1 (Sniper: hold to charge) |
| E | Skill 2 |
| F | Skill 3 (Archaeologist: Mermaid Form) |
| R | Ultimate (needs a full energy bar) |
| Esc / P | Pause |

On touch devices on-screen buttons appear automatically.

## Crew & unlocks

| Character | Unlock |
|---|---|
| 🧑 Captain Lumo — Rubber Pirate Captain | start |
| ⚔️ Kaito Triblade — Three-Blade Swordsman | 300 coins |
| 🌩 Nimbus Mira — Weather Navigator | reach Level 2 |
| 🎯 Pip Longshot — Long-Range Sniper | 500 coins |
| 🔥 Remy Flambé — Kick Fighter / Cook | reach Level 3 |
| 💊 Doc Tansy — Pirate Doctor | defeat Boss 1 (Level 3) |
| 🌊 Iris Tidewell — Mystical Archaeologist | reach Level 4 |
| 🤖 Bolt Ironkeel — Cyborg Shipwright | 800 coins |
| 🎵 Maestro Vale — Musical Swordsman | defeat Boss 2 (Level 5) |

Coin characters are bought on the character-select screen.

## Levels

1. Sunny Shore — easy enemies
2. Palm Jungle — more enemies, flyers
3. Sunset Reef — stronger enemies + **Boss 1: Ironclaw Crab**
4. Moonlit Cove — new enemy types (gunners)
5. Storm Fortress — **Final boss: Admiral Murkfang**

## Saving your journey

- Each level has checkpoint flags (two along the route, plus one at the boss gate). Passing one saves your journey, banks the coins you've found and restores 20% HP.
- If you're shipwrecked, choose **Continue from checkpoint**. If you quit or close the tab, use **Continue** on the title screen.
- The **Journey** screen shows your progress and gives you a **save code**. Copy it, then paste it into **Load a save code** on another device or browser to carry on there.

## Save data

Progress (coins, scores, unlocked crew, highest level, bosses beaten, sound setting) is stored in `localStorage` under `pixelPirateAdventure_v1`. Use **Reset Save** on the title screen to start over.

## Files

- `index.html` — screens and HUD markup
- `style.css` — retro UI styling and responsive layout
- `script.js` — game engine, pixel-art drawing, characters, enemies, levels, saving

All art is drawn procedurally in code; no external images are used.
