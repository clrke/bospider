# Bospider

A fast-paced reflex game inspired by the **Bospider** boss fight from *Mega Man X*.

▶ **Play now:** **[clrke.github.io/bospider](https://clrke.github.io/bospider/)** — or open `index.html` locally in any modern browser (desktop or mobile).

## Concept

A spider descends through a grid of bars. Read the board, trace the path, pick the
column where the spider will land — and survive, round after round, faster and faster.

## Gameplay

- The board has **4 columns** and **8 rows**.
- At the start of each round, a spider **spawns at the top of a random column**.
- Each row has a **horizontal bar** in one of the **3 gaps** between the 4 columns (n−1 spaces).
- After a **2-second pause**, the spider begins descending.
- When the spider hits a horizontal bar, it **traces along the bar** and shifts to the
  adjacent column — you can watch it weave its way down.
- The round ends when the spider **reaches the bottom**. If you picked its landing
  column, you score; if not, you lose a life.
- You start with **3 lives**. Lose them all and it's **Game Over**.

## Difficulty Curve

- Round 1: ~**3 seconds** of descent + a **2-second** pause.
- Descent time **decreases logarithmically** each round, ramping up the pressure.
- A correct streak (up to ×5) multiplies your score.

## Controls

| Input | Action |
|-------|--------|
| **← / →** | Select a column (desktop) |
| **Space / Enter** | Start, resolve the round instantly, or retry (desktop) |
| **Swipe ← / →** | Move one column (mobile) |
| **Swipe ↓** | Resolve the round instantly — skips the pause *and* the descent (mobile) |
| **Tap** | Start / retry on the menu screens (mobile) |

## Features

- Lives, streak multiplier, and **Game Over / restart** flow.
- **High score** persisted locally (`localStorage`).
- Animated spider that **traces along bars** as it descends.
- WebAudio sound effects (toggle with the 🔊 button).
- Touch controls and accessible status messaging.

## Goal

Identify the safe column before the spider lands. Either **watch it descend** or, once
you're confident, press **Space** / **swipe down** to resolve the round instantly.

## Tech

- Single-page web game (`index.html`). **No framework, no build step, no runtime dependencies** — just open the file.
- The pure game logic (difficulty curve, bar/path generation, safe-column simulation,
  scoring) lives in `src/logic.js` as a UMD module. It loads as a plain `<script>` in
  the browser **and** imports cleanly into Node — so it's unit-testable without a build.

## Testing

```bash
npm install      # one-time: installs Vitest (dev only)
npm test         # run the unit suite
npm run test:watch
npm run coverage
```

- **Unit tests** (`tests/logic.test.js`, [Vitest](https://vitest.dev)) cover the pure
  logic: difficulty curve monotonicity/floor, deterministic seeded board generation,
  spider-path geometry, arc-length parametrization, and scoring/streak transitions —
  including a property test cross-checking `buildPath` against an independent simulation
  over hundreds of random boards.
- **End-to-end** behavior (input, animation, lives, overlays) is verified with headless
  Playwright against the real `index.html` over `file://`.

> **Why no framework?** The game is ~12 KB and its tricky parts are pure functions, so a
> component framework (React/Vue/Svelte) would add a build step and runtime weight without
> improving testability. Isolating the logic into a plain module gives high coverage with
> zero framework overhead.

## License

[MIT](LICENSE)
