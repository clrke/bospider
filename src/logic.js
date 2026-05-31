// ─── Bospider pure game logic ──────────────────────────────────────────────────
// UMD: usable as a plain <script> (attaches window.BospiderLogic) so index.html
// stays openable with no build step, AND importable in Node/Vitest for unit tests.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; // CJS / Vitest
  else root.BospiderLogic = api;                                          // browser
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CONST = {
    COLS: 4,
    ROWS: 8,
    COL_W: 80,      // px
    ROW_H: 60,      // px (ARENA_H / ROWS)
    ARENA_H: 480,
    PAUSE_MS: 2000,
    BASE_MS: 3000,
    MIN_MS: 400,
    STREAK_MAX: 5,
    START_LIVES: 3,
  };

  // Center x (px) of a column.
  function colX(c) { return c * CONST.COL_W + CONST.COL_W / 2; }

  // Logarithmic difficulty curve: descent time shrinks each round, floored at MIN_MS.
  function travelMsForRound(r) {
    const t = CONST.BASE_MS / Math.log2(r + 1) + CONST.MIN_MS;
    return Math.max(CONST.MIN_MS, t);
  }

  function rowsPerSecond(travelMs) {
    return CONST.ROWS / (travelMs / 1000);
  }

  // One bar per row, sitting in one of the (COLS-1) gaps. gap g bridges col g and g+1.
  // rng is injectable for deterministic tests; defaults to Math.random.
  function generateBars(rng) {
    rng = rng || Math.random;
    const bars = [];
    for (let row = 0; row < CONST.ROWS; row++) {
      bars.push({ row, gap: Math.floor(rng() * (CONST.COLS - 1)) });
    }
    return bars;
  }

  // Simulate which column the spider ends in, given a spawn column and the bars.
  function simulateSafeCol(spawnCol, bars) {
    let col = spawnCol;
    for (let row = 0; row < bars.length; row++) {
      const gap = bars[row].gap;
      if (col === gap) col = gap + 1;
      else if (col === gap + 1) col = gap;
    }
    return col;
  }

  // Build the traced polyline the spider follows (verticals + lateral traces along
  // bars), plus cumulative arc-length for constant-speed animation, plus safeCol.
  function buildPath(spawnCol, bars) {
    const { ROW_H, ARENA_H } = CONST;
    let col = spawnCol;
    const path = [{ x: colX(col), y: 0 }];
    for (let row = 0; row < bars.length; row++) {
      const barY = row * ROW_H + ROW_H / 2;
      const gap = bars[row].gap;
      path.push({ x: colX(col), y: barY });          // descend to the bar's height
      if (col === gap) { col = gap + 1; path.push({ x: colX(col), y: barY }); }
      else if (col === gap + 1) { col = gap; path.push({ x: colX(col), y: barY }); }
    }
    path.push({ x: colX(col), y: ARENA_H });          // final descent to the floor

    const segLen = [0];
    let totalLen = 0;
    for (let i = 1; i < path.length; i++) {
      totalLen += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
      segLen.push(totalLen);
    }
    return { path, segLen, totalLen, safeCol: col };
  }

  // Position along the polyline at arc-length distance d.
  function pointAtDistance(path, segLen, totalLen, d) {
    if (d <= 0) return path[0];
    if (d >= totalLen) return path[path.length - 1];
    let i = 1;
    while (i < segLen.length && segLen[i] < d) i++;
    const t = (d - segLen[i - 1]) / (segLen[i] - segLen[i - 1] || 1);
    return {
      x: path[i - 1].x + (path[i].x - path[i - 1].x) * t,
      y: path[i - 1].y + (path[i].y - path[i - 1].y) * t,
    };
  }

  // Pure scoring transition. Returns the next streak and points gained.
  function scoreForResult(correct, prevStreak) {
    if (!correct) return { streak: 0, gained: 0 };
    const streak = Math.min(prevStreak + 1, CONST.STREAK_MAX);
    const bonus = streak > 1 ? streak : 1;
    return { streak, gained: 100 * bonus };
  }

  return {
    CONST, colX, travelMsForRound, rowsPerSecond,
    generateBars, simulateSafeCol, buildPath, pointAtDistance, scoreForResult,
  };
});
