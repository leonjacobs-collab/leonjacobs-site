"use client";

import { useMemo, useState, useCallback } from "react";
import styles from "./AsciiViewfinder.module.css";

// ─── Constants ──────────────────────────────────────────────

const SCENE_W = 100;
const SCENE_H = 22;
const VIEW_W = 60;
const VIEW_H = 20;

// Block-based brightness ramp: dark → bright
const RAMP = " ·░░▒▒▓▓██▓█";
const RAMP_MAX = RAMP.length - 1;

// Standard stops
const APERTURES = [1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
const SHUTTERS = [
  30, 15, 8, 4, 2, 1, 1 / 2, 1 / 4, 1 / 8, 1 / 15, 1 / 30, 1 / 60,
  1 / 125, 1 / 250, 1 / 500, 1 / 1000, 1 / 2000, 1 / 4000, 1 / 8000,
];
const ISOS = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600];

// ─── Scene modes ────────────────────────────────────────────

type SceneMode = "portrait" | "person" | "landscape";

const SCENE_CONFIG: Record<SceneMode, { label: string; code: string; focusDist: number; ev: number; defaultFocal: number }> = {
  portrait:  { label: "Portrait",  code: "FACE",  focusDist: 0.8,  ev: 10, defaultFocal: 85  },
  person:    { label: "Person",    code: "BODY",  focusDist: 3,    ev: 9,  defaultFocal: 50  },
  landscape: { label: "Landscape", code: "SCENE", focusDist: 100,  ev: 9,  defaultFocal: 24  },
};

// ─── Types ──────────────────────────────────────────────────

interface Cell {
  ch: string;
  depth: number;
  bright: number; // 0..RAMP_MAX
}

// ─── Deterministic random ───────────────────────────────────

function srand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ─── Helpers ────────────────────────────────────────────────

function set(
  s: Cell[][],
  y: number,
  x: number,
  ch: string,
  depth: number,
  bright: number
) {
  if (y >= 0 && y < SCENE_H && x >= 0 && x < SCENE_W) {
    s[y][x] = { ch, depth, bright };
  }
}

function fill(
  s: Cell[][],
  y: number,
  x1: number,
  x2: number,
  ch: string,
  depth: number,
  bright: number
) {
  for (let x = Math.max(0, x1); x <= Math.min(SCENE_W - 1, x2); x++) {
    s[y][x] = { ch, depth, bright };
  }
}

// ─── Scene generation ───────────────────────────────────────

function emptyScene(): Cell[][] {
  return Array.from({ length: SCENE_H }, () =>
    Array.from({ length: SCENE_W }, () => ({ ch: " ", depth: 10000, bright: 0 }))
  );
}

// ── LANDSCAPE — night cityscape ─────────────────────────────

function generateLandscape(): Cell[][] {
  const s = emptyScene();

  // Sky gradient
  for (let y = 0; y < 10; y++) {
    const skyBright = y < 4 ? 0 : Math.min(2, Math.floor((y - 4) * 0.5));
    for (let x = 0; x < SCENE_W; x++) {
      s[y][x] = { ch: skyBright > 0 ? "░" : " ", depth: 10000, bright: skyBright };
    }
  }

  // Stars
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(srand(i * 7 + 1) * SCENE_W);
    const y = Math.floor(srand(i * 13 + 2) * 8);
    if (y < SCENE_H && x < SCENE_W) {
      const big = srand(i * 3 + 5) > 0.7;
      s[y][x] = { ch: big ? "✦" : "·", depth: 10000, bright: big ? 10 : 8 };
    }
  }

  // Moon
  set(s, 1, 76, "▗", 10000, 9); set(s, 1, 77, "▄", 10000, 11); set(s, 1, 78, "▖", 10000, 9);
  set(s, 2, 76, "▝", 10000, 10); set(s, 2, 77, "█", 10000, 11); set(s, 2, 78, "▘", 10000, 10);
  set(s, 3, 76, "▝", 10000, 8); set(s, 3, 77, "▀", 10000, 10); set(s, 3, 78, "▘", 10000, 8);
  for (const [dy, dx] of [[-1,0],[0,-1],[0,1],[1,0],[-1,-1],[-1,1],[1,-1],[1,1]]) {
    const gy = 2 + dy, gx = 77 + dx;
    if (gy >= 0 && gy < SCENE_H && gx >= 0 && gx < SCENE_W && s[gy][gx].bright < 5)
      s[gy][gx] = { ch: "░", depth: 10000, bright: 5 };
  }

  // Mountains
  for (const m of [{ cx: 15, peak: 3, hw: 16 }, { cx: 48, peak: 2, hw: 20 }, { cx: 83, peak: 4, hw: 13 }]) {
    const base = 10;
    for (let y = m.peak; y < base; y++) {
      const yFrac = (y - m.peak) / (base - m.peak);
      const w = Math.floor(m.hw * yFrac) + 1;
      for (let dx = -w; dx <= w; dx++) {
        const x = m.cx + dx;
        if (x < 0 || x >= SCENE_W) continue;
        const edge = 1 - Math.abs(dx) / w;
        const br = Math.min(RAMP_MAX, Math.floor(2 + edge * 3 + (1 - yFrac) * 2));
        const ch = y === m.peak ? "▲" : yFrac < 0.3 ? "▓" : yFrac < 0.6 ? "▒" : "░";
        set(s, y, x, ch, 100, br);
      }
    }
    if (m.peak + 1 < base) {
      for (let dx = -2; dx <= 2; dx++) set(s, m.peak, m.cx + dx, dx === 0 ? "▲" : "▓", 100, 7);
    }
  }

  // Horizon glow
  for (let x = 0; x < SCENE_W; x++) {
    if (s[9][x].depth > 200) set(s, 9, x, "▒", 50, 3);
    if (s[10][x].depth > 200 || s[10][x].depth === 10000) set(s, 10, x, "▓", 50, 4);
  }

  // Buildings
  for (const b of [
    { x: 3, w: 8, h: 6 }, { x: 16, w: 5, h: 4 }, { x: 28, w: 11, h: 5 }, { x: 42, w: 6, h: 3 },
    { x: 55, w: 9, h: 6 }, { x: 67, w: 6, h: 5 }, { x: 78, w: 5, h: 4 }, { x: 89, w: 8, h: 3 },
  ]) {
    const top = 11 - b.h;
    for (let y = top; y <= 10; y++) {
      set(s, y, b.x, "▐", 30, 3);
      set(s, y, b.x + b.w - 1, "▌", 30, 3);
      for (let dx = 1; dx < b.w - 1; dx++) {
        const x = b.x + dx;
        if (x >= SCENE_W) continue;
        const isWinRow = y > top && (y - top) % 2 === 0;
        const isWinCol = dx % 3 === 1 || dx % 3 === 2;
        if (isWinRow && isWinCol) {
          const lit = srand(y * 200 + x * 17) > 0.35;
          set(s, y, x, lit ? "█" : "▓", 30, lit ? 10 : 6);
        } else {
          set(s, y, x, "▒", 30, 3);
        }
      }
      if (y === top) fill(s, y, b.x, b.x + b.w - 1, "▀", 30, 4);
    }
  }

  // Ground
  fill(s, 11, 0, SCENE_W - 1, "▀", 10, 3);

  // Lamp posts
  for (const lx of [24, 47, 73]) {
    set(s, 8, lx, "█", 10, 11); set(s, 8, lx - 1, "▐", 10, 9); set(s, 8, lx + 1, "▌", 10, 9);
    for (const [dy, dx] of [[0,-2],[0,2],[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]]) {
      const gy = 8 + dy, gx = lx + dx;
      if (gy >= 0 && gy < SCENE_H && gx >= 0 && gx < SCENE_W && s[gy][gx].bright < 6)
        set(s, gy, gx, "░", 10, 6);
    }
    for (let y = 9; y <= 15; y++) set(s, y, lx, "│", 10, 4);
    set(s, 15, lx - 1, "▐", 10, 3); set(s, 15, lx + 1, "▌", 10, 3);
  }

  // Trees
  for (const tx of [12, 36, 62, 88]) {
    const canopyRows: [number, number, string][] = [
      [-4, 2, "▓"], [-3, 3, "▓"], [-2, 4, "▒"], [-1, 5, "░"], [0, 5, "▒"],
    ];
    for (const [dy, hw, ch] of canopyRows) {
      const y = 12 + dy;
      for (let dx = -hw; dx <= hw; dx++) {
        const x = tx + dx;
        if (y >= 0 && y < SCENE_H && x >= 0 && x < SCENE_W) {
          const edge = Math.abs(dx) / hw;
          const br = Math.min(RAMP_MAX, Math.floor(3 + (1 - edge) * 3));
          const leafCh = srand(y * 500 + x + 42) > 0.5 ? ch : (ch === "▓" ? "█" : "▓");
          set(s, y, x, leafCh, 8, br);
        }
      }
    }
    for (let y = 13; y <= 15; y++) {
      set(s, y, tx, "█", 8, 3); set(s, y, tx - 1, "▐", 8, 2); set(s, y, tx + 1, "▌", 8, 2);
    }
  }

  // Mid-ground fill
  for (let y = 12; y <= 14; y++) {
    for (let x = 0; x < SCENE_W; x++) {
      if (s[y][x].bright <= 1) set(s, y, x, "░", 5, 2);
    }
  }

  // Path
  for (let y = 15; y <= 17; y++) {
    for (let x = 0; x < SCENE_W; x++) {
      if (s[y][x].depth > 4) {
        const paving = (x + y * 3) % 6;
        set(s, y, x, paving === 0 ? "▓" : paving < 3 ? "▒" : "░", 2, 3);
      }
    }
  }

  // Railing
  for (let x = 0; x < SCENE_W; x++) {
    if (x % 8 === 0) { set(s, 17, x, "█", 0.8, 4); set(s, 18, x, "█", 0.8, 4); }
    else set(s, 18, x, "─", 0.8, 3);
  }

  // Close foreground
  for (let y = 19; y < SCENE_H; y++) {
    const depth = Math.max(0.2, 0.6 - (y - 19) * 0.15);
    for (let x = 0; x < SCENE_W; x++) {
      const r = srand(y * SCENE_W + x + 777);
      set(s, y, x, r > 0.65 ? "▓" : r > 0.35 ? "▒" : "░", depth, 2 + Math.floor(r * 3));
    }
  }

  return s;
}

// ── PERSON — full body with environment ─────────────────────

function generatePerson(): Cell[][] {
  const s = emptyScene();
  const fd = SCENE_CONFIG.person.focusDist;

  // Warm outdoor background — soft sky
  for (let y = 0; y < 11; y++) {
    const br = y < 3 ? 1 : Math.min(4, Math.floor(1 + y * 0.4));
    for (let x = 0; x < SCENE_W; x++) {
      s[y][x] = { ch: br >= 3 ? "░" : " ", depth: 10000, bright: br };
    }
  }

  // Clouds
  for (const c of [{ cx: 18, y: 2, w: 12 }, { cx: 62, y: 3, w: 15 }, { cx: 85, y: 1, w: 8 }]) {
    for (let dx = -c.w; dx <= c.w; dx++) {
      const x = c.cx + dx;
      if (x < 0 || x >= SCENE_W) continue;
      const edge = 1 - Math.abs(dx) / c.w;
      if (edge > 0.3) set(s, c.y, x, edge > 0.6 ? "▓" : "▒", 10000, Math.floor(6 + edge * 3));
      if (edge > 0.5) set(s, c.y + 1, x, "░", 10000, Math.floor(5 + edge * 2));
    }
  }

  // Background trees (depth 20)
  for (const tx of [8, 22, 38, 55, 72, 90]) {
    for (let dy = -2; dy <= 0; dy++) {
      const hw = 3 - dy;
      for (let dx = -hw; dx <= hw; dx++) {
        const x = tx + dx, y = 8 + dy;
        if (x >= 0 && x < SCENE_W && y >= 0) {
          const br = Math.min(RAMP_MAX, 3 + Math.floor((1 - Math.abs(dx) / hw) * 3));
          set(s, y, x, srand(y * 300 + x) > 0.5 ? "▓" : "▒", 20, br);
        }
      }
    }
    set(s, 9, tx, "█", 20, 3); set(s, 10, tx, "█", 20, 3);
  }

  // Ground (depth 8..3)
  for (let y = 11; y < SCENE_H; y++) {
    const yf = (y - 11) / (SCENE_H - 11);
    const depth = Math.max(1, 8 - yf * 7);
    for (let x = 0; x < SCENE_W; x++) {
      const r = srand(y * SCENE_W + x + 333);
      const br = Math.floor(2 + r * 3);
      set(s, y, x, r > 0.5 ? "▒" : "░", depth, br);
    }
  }

  // Person — full body, centered (depth 3)
  const px = 50;

  // Hair
  for (let dx = -3; dx <= 3; dx++) {
    set(s, 5, px + dx, Math.abs(dx) <= 1 ? "█" : "▓", fd, 4);
  }

  // Head — face detail
  set(s, 6, px - 3, "▐", fd, 6);
  set(s, 6, px - 2, "█", fd, 8); set(s, 6, px - 1, "█", fd, 9);
  set(s, 6, px,     "█", fd, 9); set(s, 6, px + 1, "█", fd, 9);
  set(s, 6, px + 2, "█", fd, 8);
  set(s, 6, px + 3, "▌", fd, 6);

  // Eyes row
  set(s, 7, px - 3, "▐", fd, 6);
  set(s, 7, px - 2, "▓", fd, 8);
  set(s, 7, px - 1, "●", fd, 3); // left eye
  set(s, 7, px,     "█", fd, 9);
  set(s, 7, px + 1, "●", fd, 3); // right eye
  set(s, 7, px + 2, "▓", fd, 8);
  set(s, 7, px + 3, "▌", fd, 6);

  // Nose + mouth row
  set(s, 8, px - 3, "▐", fd, 6);
  set(s, 8, px - 2, "█", fd, 8);
  set(s, 8, px - 1, "▓", fd, 8);
  set(s, 8, px,     "▼", fd, 7); // nose
  set(s, 8, px + 1, "▓", fd, 8);
  set(s, 8, px + 2, "█", fd, 8);
  set(s, 8, px + 3, "▌", fd, 6);

  // Chin
  set(s, 9, px - 2, "▝", fd, 6);
  set(s, 9, px - 1, "▀", fd, 7);
  set(s, 9, px,     "▀", fd, 8);
  set(s, 9, px + 1, "▀", fd, 7);
  set(s, 9, px + 2, "▘", fd, 6);

  // Neck
  set(s, 10, px - 1, "▐", fd, 7); set(s, 10, px, "█", fd, 8); set(s, 10, px + 1, "▌", fd, 7);

  // Shoulders
  for (let dx = -5; dx <= 5; dx++) {
    const br = Math.abs(dx) <= 2 ? 7 : 6;
    const ch = Math.abs(dx) === 5 ? (dx < 0 ? "▐" : "▌") : "█";
    set(s, 11, px + dx, ch, fd, br);
  }

  // Torso
  for (let y = 12; y <= 14; y++) {
    set(s, y, px - 4, "▐", fd, 5);
    for (let dx = -3; dx <= 3; dx++) set(s, y, px + dx, "█", fd, 7);
    set(s, y, px + 4, "▌", fd, 5);
    // Arms
    set(s, y, px - 5, "▐", fd, 5); set(s, y, px - 6, "▓", fd, 4);
    set(s, y, px + 5, "▌", fd, 5); set(s, y, px + 6, "▓", fd, 4);
  }

  // Belt
  fill(s, 15, px - 4, px + 4, "▓", fd, 5);

  // Legs
  for (let y = 16; y <= 18; y++) {
    set(s, y, px - 3, "▐", fd, 5); set(s, y, px - 2, "█", fd, 6); set(s, y, px - 1, "▌", fd, 5);
    set(s, y, px + 1, "▐", fd, 5); set(s, y, px + 2, "█", fd, 6); set(s, y, px + 3, "▌", fd, 5);
  }

  // Shoes
  set(s, 19, px - 4, "▐", fd, 4); set(s, 19, px - 3, "▄", fd, 5);
  set(s, 19, px - 2, "▄", fd, 5); set(s, 19, px - 1, "▄", fd, 5);
  set(s, 19, px + 1, "▄", fd, 5); set(s, 19, px + 2, "▄", fd, 5);
  set(s, 19, px + 3, "▄", fd, 5); set(s, 19, px + 4, "▌", fd, 4);

  // Foreground grass (depth 0.5)
  for (let y = 20; y < SCENE_H; y++) {
    for (let x = 0; x < SCENE_W; x++) {
      const r = srand(y * SCENE_W + x + 555);
      set(s, y, x, r > 0.5 ? "▒" : "░", 0.5, 2 + Math.floor(r * 2));
    }
  }

  return s;
}

// ── PORTRAIT — close-up face ────────────────────────────────

function generatePortrait(): Cell[][] {
  const s = emptyScene();
  const fd = SCENE_CONFIG.portrait.focusDist;

  // Soft studio background — gradient (depth 5)
  for (let y = 0; y < SCENE_H; y++) {
    for (let x = 0; x < SCENE_W; x++) {
      const vignette = Math.sqrt(
        Math.pow((x - SCENE_W / 2) / (SCENE_W / 2), 2) +
        Math.pow((y - SCENE_H / 2) / (SCENE_H / 2), 2)
      );
      const br = Math.max(1, Math.min(4, Math.floor(4 - vignette * 2.5)));
      const ch = br >= 3 ? "░" : br >= 2 ? "·" : " ";
      s[y][x] = { ch, depth: 5, bright: br };
    }
  }

  // Bokeh highlights in background
  for (let i = 0; i < 20; i++) {
    const bx = Math.floor(srand(i * 11 + 3) * SCENE_W);
    const by = Math.floor(srand(i * 17 + 7) * SCENE_H);
    if (by < SCENE_H && bx < SCENE_W) {
      set(s, by, bx, "○", 5, Math.floor(7 + srand(i * 5) * 4));
    }
  }

  const cx = 50; // face center x
  const cy = 10; // face center y

  // Hair — top of head, flows wider
  for (let dy = -6; dy <= -4; dy++) {
    const hw = dy === -6 ? 6 : dy === -5 ? 8 : 9;
    for (let dx = -hw; dx <= hw; dx++) {
      const x = cx + dx, y = cy + dy;
      if (x >= 0 && x < SCENE_W && y >= 0 && y < SCENE_H) {
        const edge = Math.abs(dx) / hw;
        const br = Math.floor(3 + (1 - edge) * 3);
        set(s, y, x, edge > 0.7 ? "▒" : "▓", fd, br);
      }
    }
  }

  // Forehead
  for (let dx = -7; dx <= 7; dx++) {
    const x = cx + dx;
    const edge = Math.abs(dx) / 7;
    if (Math.abs(dx) === 7) { set(s, cy - 3, x, dx < 0 ? "▐" : "▌", fd, 6); }
    else set(s, cy - 3, x, "█", fd, Math.floor(8 + (1 - edge)));
  }

  // Face — rows cy-2 to cy+2 (main face block)
  for (let dy = -2; dy <= 2; dy++) {
    const y = cy + dy;
    const faceW = dy <= 0 ? 8 : dy === 1 ? 7 : 6;
    // Face fill
    for (let dx = -faceW; dx <= faceW; dx++) {
      const x = cx + dx;
      if (x < 0 || x >= SCENE_W) continue;
      const edge = Math.abs(dx) / faceW;
      if (Math.abs(dx) === faceW) {
        set(s, y, x, dx < 0 ? "▐" : "▌", fd, 6);
      } else {
        set(s, y, x, "█", fd, Math.floor(7 + (1 - edge) * 2));
      }
    }

    // Ears (dy -1 to 1)
    if (dy >= -1 && dy <= 1) {
      set(s, y, cx - faceW - 1, "▐", fd, 5);
      set(s, y, cx - faceW - 2, "▓", fd, 4);
      set(s, y, cx + faceW + 1, "▌", fd, 5);
      set(s, y, cx + faceW + 2, "▓", fd, 4);
    }
  }

  // Eyebrows (cy - 2)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      set(s, cy - 2, cx + side * (2 + i), "▀", fd, 5);
    }
  }

  // Eyes (cy - 1)
  // Left eye
  set(s, cy - 1, cx - 4, "▐", fd, 8);
  set(s, cy - 1, cx - 3, "●", fd, 3);
  set(s, cy - 1, cx - 2, "▌", fd, 8);
  // Right eye
  set(s, cy - 1, cx + 2, "▐", fd, 8);
  set(s, cy - 1, cx + 3, "●", fd, 3);
  set(s, cy - 1, cx + 4, "▌", fd, 8);

  // Nose (cy)
  set(s, cy, cx - 1, "▐", fd, 7);
  set(s, cy, cx,     "▼", fd, 6);
  set(s, cy, cx + 1, "▌", fd, 7);

  // Mouth (cy + 1)
  set(s, cy + 1, cx - 2, "▗", fd, 6);
  set(s, cy + 1, cx - 1, "▄", fd, 5);
  set(s, cy + 1, cx,     "▄", fd, 5);
  set(s, cy + 1, cx + 1, "▄", fd, 5);
  set(s, cy + 1, cx + 2, "▖", fd, 6);

  // Jaw / chin (cy + 3, cy + 4)
  for (let dx = -5; dx <= 5; dx++) {
    const edge = Math.abs(dx) / 5;
    if (edge > 0.8) set(s, cy + 3, cx + dx, dx < 0 ? "▝" : "▘", fd, 6);
    else set(s, cy + 3, cx + dx, "▀", fd, Math.floor(7 + (1 - edge)));
  }

  // Neck (cy + 4 to cy + 6)
  for (let dy = 4; dy <= 6; dy++) {
    const nw = dy === 4 ? 3 : 4;
    set(s, cy + dy, cx - nw, "▐", fd, 6);
    for (let dx = -nw + 1; dx < nw; dx++) set(s, cy + dy, cx + dx, "█", fd, 7);
    set(s, cy + dy, cx + nw, "▌", fd, 6);
  }

  // Shoulders (cy + 7)
  for (let dx = -12; dx <= 12; dx++) {
    const x = cx + dx;
    if (x < 0 || x >= SCENE_W) continue;
    const br = Math.abs(dx) <= 4 ? 7 : Math.abs(dx) <= 8 ? 6 : 5;
    const ch = Math.abs(dx) === 12 ? (dx < 0 ? "▐" : "▌") : "█";
    set(s, cy + 7, x, ch, fd, br);
  }

  // Shoulders continue / upper chest (cy + 8 to bottom)
  for (let dy = 8; dy <= 11; dy++) {
    const sw = 12 + (dy - 8);
    for (let dx = -sw; dx <= sw; dx++) {
      const x = cx + dx;
      if (x < 0 || x >= SCENE_W) continue;
      const edge = Math.abs(dx) / sw;
      const ch = Math.abs(dx) === sw ? (dx < 0 ? "▐" : "▌") : "█";
      set(s, cy + dy, x, ch, fd, Math.max(4, Math.floor(7 - edge * 3)));
    }
  }

  return s;
}

// ─── Depth of field ─────────────────────────────────────────

function calcBlur(depth: number, focusDist: number, aperture: number): number {
  const dofHalf = aperture * aperture * 0.12;
  const near = Math.max(0.05, focusDist - dofHalf);
  const far = focusDist + dofHalf * 2.5;

  if (depth >= near && depth <= far) return 0;

  const dist = depth < near ? near - depth : depth - far;
  return Math.min(3, Math.ceil(dist / Math.max(0.1, dofHalf * 1.5)));
}

// ─── Rendering ──────────────────────────────────────────────

// Blur character lookup — maps (blur level, brightness) → display char
// Uses progressively softer block chars
function blurChar(blur: number, bright: number, origCh: string): string {
  if (blur === 0) {
    // Sharp: keep original, fill empty space with brightness
    return origCh === " " ? RAMP[bright] : origCh;
  }
  if (blur === 1) {
    // Slight: lose detail, map to block shade by brightness
    if (bright >= 9) return "○"; // bokeh highlight
    if (bright >= 7) return "▓";
    if (bright >= 5) return "▒";
    if (bright >= 3) return "░";
    return "·";
  }
  if (blur === 2) {
    // Medium: softer, more bokeh
    if (bright >= 8) return "○";
    if (bright >= 6) return "▒";
    if (bright >= 4) return "░";
    if (bright >= 2) return "·";
    return " ";
  }
  // Heavy: mostly dissolved, bright points become bokeh
  if (bright >= 9) return "◯";
  if (bright >= 7) return "○";
  if (bright >= 5) return "·";
  return " ";
}

// Noise character — random block-based noise
function noiseChar(bright: number, seed: number): string {
  const r = srand(seed + 9999);
  const nudge = r > 0.5 ? 2 : -2;
  const nb = Math.max(0, Math.min(RAMP_MAX, bright + nudge));
  // Use block chars for noise grain
  if (nb >= 8) return "▓";
  if (nb >= 5) return "▒";
  if (nb >= 3) return "░";
  return "·";
}

function renderFrame(
  scene: Cell[][],
  focalLength: number,
  aperture: number,
  shutterTime: number,
  iso: number,
  focusDist: number,
  evScene: number
): string[] {
  // 1. FOV crop
  const refFov = 2 * Math.atan(36 / (2 * 14));
  const curFov = 2 * Math.atan(36 / (2 * focalLength));
  const cropFrac = curFov / refFov;
  const cropW = Math.max(1, Math.floor(SCENE_W * cropFrac));
  const cropH = Math.max(1, Math.floor(SCENE_H * cropFrac));
  const cx = Math.floor((SCENE_W - cropW) / 2);
  const cy = Math.floor((SCENE_H - cropH) / 2);

  // 2. Exposure
  const ev100 = Math.log2((aperture * aperture) / shutterTime);
  const evEff = ev100 - Math.log2(iso / 100);
  const expShift = Math.round(evEff - evScene);

  // 3. Noise probability
  const noiseProb = Math.min(0.55, Math.log2(iso / 100) * 0.07);

  // 4. Render
  const lines: string[] = [];
  for (let vy = 0; vy < VIEW_H; vy++) {
    let line = "";
    for (let vx = 0; vx < VIEW_W; vx++) {
      const sy = Math.max(0, Math.min(SCENE_H - 1, cy + Math.floor((vy / VIEW_H) * cropH)));
      const sx = Math.max(0, Math.min(SCENE_W - 1, cx + Math.floor((vx / VIEW_W) * cropW)));
      const cell = scene[sy][sx];

      const blur = calcBlur(cell.depth, focusDist, aperture);

      let bright = Math.max(0, Math.min(RAMP_MAX, cell.bright - expShift));

      // ISO noise
      const noiseSeed = vy * VIEW_W + vx;
      if (noiseProb > 0 && srand(noiseSeed * 7 + iso + focalLength) < noiseProb) {
        line += noiseChar(bright, noiseSeed);
        continue;
      }

      line += blurChar(blur, bright, cell.ch);
    }
    lines.push(line);
  }

  return lines;
}

// ─── Format helpers ─────────────────────────────────────────

function fmtShutter(t: number): string {
  if (t >= 1) return `${t}s`;
  return `1/${Math.round(1 / t)}`;
}

function fmtFov(focalLength: number): string {
  const fov = (2 * Math.atan(36 / (2 * focalLength)) * 180) / Math.PI;
  return `${fov.toFixed(1)}°`;
}

// ─── Exposure meter ─────────────────────────────────────────

function calcEv(aperture: number, shutterTime: number, iso: number): number {
  return Math.log2((aperture * aperture) / shutterTime) - Math.log2(iso / 100);
}

function renderMeter(ev: number, evScene: number): string {
  const comp = ev - evScene;
  const clamped = Math.max(-3, Math.min(3, comp));
  const center = 6;
  const pos = center - Math.round(clamped * 2);
  const ticks = "- · · 0 · · +".split("");
  const p = Math.max(0, Math.min(ticks.length - 1, pos));
  ticks[p] = "▲";
  return ticks.join("");
}

// ─── Component ──────────────────────────────────────────────

interface AsciiViewfinderProps {
  focalRange?: [number, number];
  apertureRange?: [number, number];
}

export function AsciiViewfinder({
  focalRange = [14, 200],
  apertureRange = [1.4, 22],
}: AsciiViewfinderProps) {
  const [mode, setMode] = useState<SceneMode>("landscape");
  const config = SCENE_CONFIG[mode];

  const [focal, setFocal] = useState(config.defaultFocal);
  const [apIdx, setApIdx] = useState(1); // f/1.8
  const [shIdx, setShIdx] = useState(13); // 1/250
  const [isoIdx, setIsoIdx] = useState(2); // 400

  const aperture = APERTURES[apIdx];
  const shutter = SHUTTERS[shIdx];
  const iso = ISOS[isoIdx];

  const minApIdx = APERTURES.findIndex((a) => a >= apertureRange[0]);
  const maxApIdx = APERTURES.length - 1;

  const scenes = useMemo(() => ({
    portrait: generatePortrait(),
    person: generatePerson(),
    landscape: generateLandscape(),
  }), []);

  const scene = scenes[mode];

  const frame = useMemo(
    () => renderFrame(scene, focal, aperture, shutter, iso, config.focusDist, config.ev),
    [scene, focal, aperture, shutter, iso, config.focusDist, config.ev]
  );

  const ev = calcEv(aperture, shutter, iso);
  const meter = renderMeter(ev, config.ev);
  const comp = ev - config.ev;

  const handleFocal = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setFocal(Number(e.target.value)),
    []
  );

  const handleMode = useCallback((m: SceneMode) => {
    setMode(m);
    setFocal(SCENE_CONFIG[m].defaultFocal);
  }, []);

  return (
    <div className={styles.viewfinder}>
      {/* ── Scene mode selector ── */}
      <div className={styles.modeBar}>
        <span className={styles.modeLabel}>SCENE</span>
        <div className={styles.modeButtons}>
          {(["portrait", "person", "landscape"] as SceneMode[]).map((m) => (
            <button
              key={m}
              className={`${styles.modeBtn} ${mode === m ? styles.modeBtnActive : ""}`}
              onClick={() => handleMode(m)}
            >
              <span className={styles.modeBtnCode}>{SCENE_CONFIG[m].code}</span>
              <span className={styles.modeBtnLabel}>{SCENE_CONFIG[m].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── EVF frame ── */}
      <div className={styles.evf}>
        <div className={styles.evfTop}>
          <span className={styles.evfLabel}>◉ EVF</span>
          <span className={styles.evfFov}>FOV {fmtFov(focal)} — {config.code}</span>
        </div>

        <pre className={styles.frame} aria-label="ASCII camera viewfinder preview">
          {frame.map((line, i) => {
            const crossY = Math.floor(VIEW_H / 2);
            const crossX = Math.floor(VIEW_W / 2) - 1;
            if (i === crossY) {
              const chars = line.split("");
              chars[crossX]     = "╶";
              chars[crossX + 1] = "┼";
              chars[crossX + 2] = "╴";
              return <span key={i}>{chars.join("")}{"\n"}</span>;
            }
            if (i === crossY - 1 || i === crossY + 1) {
              const chars = line.split("");
              chars[crossX + 1] = i === crossY - 1 ? "╷" : "╵";
              return <span key={i}>{chars.join("")}{"\n"}</span>;
            }
            return <span key={i}>{line}{"\n"}</span>;
          })}
        </pre>

        <div className={styles.evfBottom}>
          <span className={styles.evfStat}>AFC ●</span>
          <span className={styles.evfStat}>{focal}mm</span>
          <span className={styles.evfStat}>f/{aperture}</span>
          <span className={styles.evfStat}>{fmtShutter(shutter)}</span>
          <span className={styles.evfStat}>ISO {iso}</span>
          <span
            className={styles.evfMeter}
            title={`EV ${ev.toFixed(1)} (${comp > 0 ? "+" : ""}${comp.toFixed(1)})`}
          >
            {meter}
          </span>
        </div>
      </div>

      {/* ── Sliders ── */}
      <div className={styles.controls}>
        <label className={styles.slider}>
          <span className={styles.sliderLabel}>FOCAL</span>
          <input
            type="range"
            min={focalRange[0]}
            max={focalRange[1]}
            value={focal}
            onChange={handleFocal}
            className={styles.range}
          />
          <span className={styles.sliderValue}>{focal}mm</span>
        </label>

        <label className={styles.slider}>
          <span className={styles.sliderLabel}>APERTURE</span>
          <input
            type="range"
            min={Math.max(0, minApIdx)}
            max={maxApIdx}
            value={apIdx}
            onChange={(e) => setApIdx(Number(e.target.value))}
            className={styles.range}
          />
          <span className={styles.sliderValue}>f/{aperture}</span>
        </label>

        <label className={styles.slider}>
          <span className={styles.sliderLabel}>SHUTTER</span>
          <input
            type="range"
            min={0}
            max={SHUTTERS.length - 1}
            value={shIdx}
            onChange={(e) => setShIdx(Number(e.target.value))}
            className={styles.range}
          />
          <span className={styles.sliderValue}>{fmtShutter(shutter)}</span>
        </label>

        <label className={styles.slider}>
          <span className={styles.sliderLabel}>ISO</span>
          <input
            type="range"
            min={0}
            max={ISOS.length - 1}
            value={isoIdx}
            onChange={(e) => setIsoIdx(Number(e.target.value))}
            className={styles.range}
          />
          <span className={styles.sliderValue}>{iso}</span>
        </label>
      </div>

      {/* ── Exposure readout ── */}
      <div className={styles.exposure}>
        <span className={styles.exposureLabel}>EXPOSURE</span>
        <span
          className={`${styles.exposureValue} ${
            Math.abs(comp) <= 0.5
              ? styles.exposureOk
              : Math.abs(comp) <= 1.5
                ? styles.exposureWarn
                : styles.exposureBad
          }`}
        >
          {comp > 0 ? "+" : ""}
          {comp.toFixed(1)} EV
          {Math.abs(comp) <= 0.5 ? " — CORRECT" : comp > 0 ? " — UNDER" : " — OVER"}
        </span>
      </div>
    </div>
  );
}
