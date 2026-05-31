# Bospider

A fast-paced reflex game inspired by the **Bospider** boss fight from *Mega Man X*.

▶ **Play:** open `index.html` in any modern browser (desktop or mobile).

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
| **← / →** | Select a column |
| **Space / Enter** | Start, skip the wait, or retry |
| **Tap a column** | (Mobile) select it; tap it again to resolve immediately |

## Features

- Lives, streak multiplier, and **Game Over / restart** flow.
- **High score** persisted locally (`localStorage`).
- Animated spider that **traces along bars** as it descends.
- WebAudio sound effects (toggle with the 🔊 button).
- Touch controls and accessible status messaging.

## Goal

Identify the safe column before the spider lands. Either **wait it out** or press
**Space** to skip the timer once you're confident.

## Tech

- Single-page web game (`index.html`). No build step, no dependencies.

## License

[MIT](LICENSE)
