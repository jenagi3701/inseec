# Pixel Pirate Adventure

A 2D pixel-art pirate adventure with **9 playable crew members**, **7 maps that each change how you play**, and a **Bomb Island** bonus mini-game. Plain HTML, CSS and vanilla JavaScript (canvas). No backend, no build step.

## Play

Open `index.html` in any modern browser (or serve the folder with any static server).

**Loop:** voyage map → map preview → choose a pirate → fight → use skills → adapt to the environment → beat the boss → unlock new crew.

### Controls

| Key | Action |
|---|---|
| A / D (or ←/→) | Move |
| Space / W / ↑ | Jump |
| S / ↓ | Drop through a platform (move down in Bomb Island) |
| J | Attack (hold to repeat) — places a bomb in Bomb Island |
| Q / E / F | Skill 1 / 2 / 3 (Sniper: hold Q to charge) |
| R | Ultimate (needs a full energy bar) |
| Esc / P | Pause |

**Touch:** a large virtual joystick (bottom-left; drag in 8 directions, push up to jump) and round icon buttons (bottom-right) for Attack, Jump, Skill 1-3 and Ultimate. Buttons darken with a clockwise cooldown sweep and a seconds counter. Toggle on-screen controls (Auto / On / Off) from the title screen — they also work with a mouse.

## Maps and strategy

| # | Map | Rules that change your play |
|---|---|---|
| 1 | 🌴 Jungle Isle | Balanced; shallow streams slow you down |
| 2 | 🌊 Open Sea | Deep water between ships and floating barrels. Swimmers swim; cursed-fruit users (Captain, Doctor, Archaeologist outside Mermaid Form) sink and are hauled back by a lifebuoy for an HP and energy penalty. Cannon ships fire from the water. **Boss 1** |
| 3 | ☁️ Sky Island | Bottomless gaps (a cloud catches you for an HP penalty), moving platforms, wind zones, lightning clouds |
| 4 | 🏜 Sunscar Desert | Sandstorms shrink visibility and projectile range, quicksand, hidden ambush raiders. **Mini boss** |
| 5 | ❄️ Frostfang Peaks | Slippery ice, falling icicles, chilling frost yetis |
| 6 | 🌋 Cinder Volcano | Lava pits, falling burning rocks, fire zones left by ember imps. **Mini boss** |
| 7 | ☠️ Stormcrown Isle | Everything at once. **Final boss** |

Each character has a 1-5 ★ rating per map. Ratings change attack, damage taken and speed (★★★★★ = +25% attack, −18% damage taken; ★★ = −12% attack, +15% damage taken), and some traits are real mechanics:

- Navigator rides the wind and absorbs lightning (energy instead of damage).
- Sniper's goggles see through sandstorms with full range.
- Cook and Doctor never slip on ice; Cook and Shipwright resist burns.
- Shipwright repairs himself on ship decks; Archaeologist's Mermaid Form lets her swim.

The map preview screen lists advantages, hazards, difficulty and recommended pirates; the character select shows stars, stat bars, strong/weak maps and the exact modifiers for the chosen map.

## Crew

Every pirate has an attack, three skills and an ultimate.

| Character | Highlights | Unlock |
|---|---|---|
| 🧑 Captain Lumo | Elastic Punch, Power Mode, **King's Pressure** (aura that makes weak foes faint), ultimate **Freedom Form** (white-haired cartoon transformation: +60% damage, faster, huge knockback, giant bouncing punches) | start |
| ⚔️ Kaito Triblade | Three-Blade Slash, Spinning Sword, Iron Guard (parry + counter) | 300 coins |
| 🌩 Nimbus Mira | Lightning, Wind Storm, Thunder Cloud, Weather Chaos | reach Level 2 |
| 🎯 Pip Longshot | Charged Power Shot, Trick Shot, Smoke Bomb, Mega Shot | 500 coins |
| 🔥 Remy Flambé | Fire Kick, Air Combo, Sky Walk (extra air jumps), Flame Leg Storm | reach Level 3 |
| 🦌 Doc Bramble (blue-nosed reindeer) | Heal, Team Buff, Medical Burst (healing field), **Emergency Mode** (big healing field, defense, regeneration) | defeat Boss 1 |
| 🌊 Iris Tidewell | Multiple Arms, Water Wave, Mermaid Form, Ocean Grab | reach Level 4 |
| 🤖 Bolt Ironkeel | Mini Cannon, Rocket Arm, Steel Barrier (blocks shots), Mecha Cannon | 800 coins |
| 🎵 Maestro Vale | Sound Blast, Music Buff, Lullaby (sleep), Musical Blade | defeat Boss 2 |

## Enemies

Pirate Grunt, Sword Pirate (lunge), Spear Pirate (long reach), Shield Pirate (blocks frontal hits — use explosives, lightning, sound or attack from behind), Gunner, Bomb Thrower, Heavy Brute, Gloomgull, Reef Leaper (leaps out of the sea), Cannon Ship, Desert Raider (buried ambusher), Sky Warrior (diving lancer), Frost Yeti (chilling snowballs), Ember Imp (leaves fire), plus the Dune and Magma Warlord mini bosses, Ironclaw Crab and Admiral Murkfang. Enemies have elemental weaknesses (shown as **WEAK!**) and resistances, and can be knocked into water, gaps or lava.

## Bonus mode: Bomb Island

Unlocks after clearing Sky Island. A top-down grid: drop bombs (2.5 s fuse, cross-shaped blast that stops at walls and chains), break crates, dodge monsters, collect coins and power-ups (bigger blast, extra bomb, speed, shield, invincibility). Defeat every monster to open the hidden exit and move on to the next stage.

## Saving your journey

- Checkpoint flags in every level save your journey, bank your coins and restore 20% HP.
- **Continue** from a checkpoint after a wipe, or from the title screen after quitting.
- The **Journey** screen shows your progress and a **save code** you can paste on another device.
- Everything (coins, scores, crew, levels, bosses, Bomb Island best, settings) is stored in `localStorage` under `pixelPirateAdventure_v1`.

## Code layout

```
index.html, style.css
js/game/        core constants & save, audio + music, input, drawing helpers, combat, update loop, renderer, main loop
js/characters/  pixel looks, roster (stats, skills, traits)
js/skills/      shared skill effects (lightning, tornado, healing zones, forms)
js/enemies/     enemy types & AI, sprites
js/maps/        map definitions & star ratings, terrain builder, hazards, backgrounds, levels
js/ui/          HUD, screens, touch controls, pixel icons, map previews
js/bonus/       Bomb Island
```

Scripts are plain classic `<script>` files loaded in order (no modules), so the game also runs from `file://`. All art, icons and music are original and generated in code.
