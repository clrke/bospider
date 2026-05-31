import { describe, it, expect } from 'vitest';
import L from '../src/logic.js';

const { CONST } = L;

// Deterministic PRNG so tests are reproducible.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('travelMsForRound', () => {
  it('round 1 = BASE/log2(2) + MIN = 3400ms', () => {
    expect(L.travelMsForRound(1)).toBeCloseTo(CONST.BASE_MS + CONST.MIN_MS, 6); // log2(2)=1
  });

  it('is strictly decreasing across rounds', () => {
    for (let r = 1; r < 200; r++) {
      expect(L.travelMsForRound(r + 1)).toBeLessThan(L.travelMsForRound(r));
    }
  });

  it('never drops below the MIN_MS floor', () => {
    for (let r = 1; r <= 100000; r *= 2) {
      expect(L.travelMsForRound(r)).toBeGreaterThanOrEqual(CONST.MIN_MS);
    }
  });
});

describe('rowsPerSecond', () => {
  it('inverts travel time over the row count', () => {
    expect(L.rowsPerSecond(2000)).toBeCloseTo(CONST.ROWS / 2, 6); // 8 rows / 2s
  });
});

describe('colX', () => {
  it('returns column centers', () => {
    expect(L.colX(0)).toBe(40);
    expect(L.colX(3)).toBe(280);
  });
});

describe('generateBars', () => {
  it('produces one bar per row with a valid gap', () => {
    const bars = L.generateBars(mulberry32(123));
    expect(bars).toHaveLength(CONST.ROWS);
    bars.forEach((b, i) => {
      expect(b.row).toBe(i);
      expect(b.gap).toBeGreaterThanOrEqual(0);
      expect(b.gap).toBeLessThanOrEqual(CONST.COLS - 2);
    });
  });

  it('is deterministic for a given seed', () => {
    const a = L.generateBars(mulberry32(42));
    const b = L.generateBars(mulberry32(42));
    expect(a).toEqual(b);
  });
});

describe('simulateSafeCol / buildPath safeCol agreement', () => {
  it('all-gap-0 bars cause the spider to weave and land back at column 0', () => {
    const bars = Array.from({ length: CONST.ROWS }, (_, row) => ({ row, gap: 0 }));
    // col0 -> bar bridges 0/1 -> 1 -> bridges 0/1 -> 0 ... even rows => back to 0
    expect(L.simulateSafeCol(0, bars)).toBe(0);
    expect(L.buildPath(0, bars).safeCol).toBe(0);
  });

  it('a spider clear of every bar lands in its spawn column', () => {
    const bars = Array.from({ length: CONST.ROWS }, (_, row) => ({ row, gap: 0 }));
    // col3 is never adjacent to gap 0 (which bridges 0/1) -> stays put
    expect(L.simulateSafeCol(3, bars)).toBe(3);
  });

  it('buildPath.safeCol matches simulateSafeCol for many random boards', () => {
    const rng = mulberry32(2026);
    for (let i = 0; i < 500; i++) {
      const bars = L.generateBars(rng);
      const spawn = Math.floor(rng() * CONST.COLS);
      expect(L.buildPath(spawn, bars).safeCol).toBe(L.simulateSafeCol(spawn, bars));
    }
  });

  it('always lands on a real column', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      const bars = L.generateBars(rng);
      const spawn = Math.floor(rng() * CONST.COLS);
      const safe = L.buildPath(spawn, bars).safeCol;
      expect(safe).toBeGreaterThanOrEqual(0);
      expect(safe).toBeLessThan(CONST.COLS);
    }
  });
});

describe('buildPath geometry', () => {
  const bars = L.generateBars(mulberry32(99));
  const built = L.buildPath(2, bars);

  it('starts at the spawn column top and ends on the floor at safeCol', () => {
    expect(built.path[0]).toEqual({ x: L.colX(2), y: 0 });
    const last = built.path[built.path.length - 1];
    expect(last.y).toBe(CONST.ARENA_H);
    expect(last.x).toBe(L.colX(built.safeCol));
  });

  it('arc-length is monotonic non-decreasing and ends at totalLen', () => {
    for (let i = 1; i < built.segLen.length; i++) {
      expect(built.segLen[i]).toBeGreaterThanOrEqual(built.segLen[i - 1]);
    }
    expect(built.segLen[built.segLen.length - 1]).toBeCloseTo(built.totalLen, 6);
    expect(built.totalLen).toBeGreaterThan(0);
  });

  it('path y-coordinates never decrease (spider only ever descends)', () => {
    for (let i = 1; i < built.path.length; i++) {
      expect(built.path[i].y).toBeGreaterThanOrEqual(built.path[i - 1].y);
    }
  });
});

describe('pointAtDistance', () => {
  const bars = L.generateBars(mulberry32(5));
  const { path, segLen, totalLen } = L.buildPath(1, bars);

  it('clamps at the endpoints', () => {
    expect(L.pointAtDistance(path, segLen, totalLen, -10)).toEqual(path[0]);
    expect(L.pointAtDistance(path, segLen, totalLen, 0)).toEqual(path[0]);
    expect(L.pointAtDistance(path, segLen, totalLen, totalLen + 10)).toEqual(path[path.length - 1]);
  });

  it('interpolates monotonically in y across the whole path', () => {
    let prevY = -Infinity;
    for (let f = 0; f <= 1; f += 0.05) {
      const p = L.pointAtDistance(path, segLen, totalLen, f * totalLen);
      expect(p.y).toBeGreaterThanOrEqual(prevY - 1e-6);
      prevY = p.y;
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(CONST.ARENA_H + 1e-6);
    }
  });
});

describe('scoreForResult', () => {
  it('first correct guess scores 100 and starts a streak', () => {
    expect(L.scoreForResult(true, 0)).toEqual({ streak: 1, gained: 100 });
  });

  it('streak multiplies the score (streak n => 100*n once n>1)', () => {
    expect(L.scoreForResult(true, 1)).toEqual({ streak: 2, gained: 200 });
    expect(L.scoreForResult(true, 2)).toEqual({ streak: 3, gained: 300 });
  });

  it('caps the streak at STREAK_MAX', () => {
    const r = L.scoreForResult(true, CONST.STREAK_MAX);
    expect(r.streak).toBe(CONST.STREAK_MAX);
    expect(r.gained).toBe(100 * CONST.STREAK_MAX);
  });

  it('a wrong guess resets the streak and scores nothing', () => {
    expect(L.scoreForResult(false, 4)).toEqual({ streak: 0, gained: 0 });
  });
});
