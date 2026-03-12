'use client';

import { useEffect, useRef } from 'react';
import { ART_PIECES, LABELS, GRID_WIDTH, GRID_HEIGHT } from '../data/ascii-art';

const CHARS = '!@#$%^&*+-=~<>?/|[]{}:;ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const HOLD_MS = 4000;
const SCRAMBLE_OUT_MS = 1200;
const SCRAMBLE_IN_MS = 2000;
const TICK_MS = 50;

const N = GRID_WIDTH * GRID_HEIGHT;
const MAX_LABEL = Math.max(...LABELS.map((l) => l.length));

const rand = (n: number) => Math.floor(Math.random() * n);
const randChar = () => CHARS[rand(CHARS.length)];

function shuffle(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = 'intro' | 'hold' | 'out' | 'in';

export default function AsciiMatrix() {
  const preRef = useRef<HTMLPreElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const pre = preRef.current;
    const labelEl = labelRef.current;
    if (!pre || !labelEl) return;

    // Build span grid for art
    const spans: HTMLSpanElement[] = [];
    pre.innerHTML = '';
    for (let r = 0; r < GRID_HEIGHT; r++) {
      for (let c = 0; c < GRID_WIDTH; c++) {
        const s = document.createElement('span');
        s.textContent = randChar();
        s.className = 'cs';
        pre.appendChild(s);
        spans.push(s);
      }
      if (r < GRID_HEIGHT - 1) {
        pre.appendChild(document.createTextNode('\n'));
      }
    }

    // Build span elements for label
    const labelSpans: HTMLSpanElement[] = [];
    labelEl.innerHTML = '';
    for (let i = 0; i < MAX_LABEL; i++) {
      const s = document.createElement('span');
      s.textContent = randChar();
      labelEl.appendChild(s);
      labelSpans.push(s);
    }

    // Animation state
    let artIdx = 0;
    let phase: Phase = 'intro';
    let t0 = performance.now();
    let locked = new Set<number>();
    let order = shuffle(N);
    let labelLocked = new Set<number>();
    let labelOrder = shuffle(MAX_LABEL);

    function tick() {
      const now = performance.now();
      const dt = now - t0;

      // --- INTRO: scramble in first image from noise ---
      if (phase === 'intro') {
        const p = Math.min(dt / SCRAMBLE_IN_MS, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const target = Math.floor(ease * N);

        while (locked.size < target && locked.size < N) {
          const idx = order[locked.size];
          locked.add(idx);
          const r = Math.floor(idx / GRID_WIDTH);
          const c = idx % GRID_WIDTH;
          spans[idx].textContent = ART_PIECES[artIdx][r][c];
          if (spans[idx].className !== 'cl') spans[idx].className = 'cl';
        }

        const labelTarget = Math.floor(ease * MAX_LABEL);
        const label = LABELS[artIdx];
        while (labelLocked.size < labelTarget && labelLocked.size < MAX_LABEL) {
          const idx = labelOrder[labelLocked.size];
          labelLocked.add(idx);
          labelSpans[idx].textContent = idx < label.length ? label[idx] : ' ';
        }

        // Cycle unlocked cells
        for (let i = 0; i < N; i++) {
          if (!locked.has(i)) {
            spans[i].textContent = randChar();
          }
        }
        for (let i = 0; i < MAX_LABEL; i++) {
          if (!labelLocked.has(i)) {
            labelSpans[i].textContent = randChar();
          }
        }

        if (p >= 1) {
          phase = 'hold';
          t0 = now;
        }
        return;
      }

      // --- HOLD: display current art ---
      if (phase === 'hold') {
        if (dt >= HOLD_MS && ART_PIECES.length > 1) {
          phase = 'out';
          t0 = now;
          locked = new Set(Array.from({ length: N }, (_, i) => i));
          order = shuffle(N);
          labelLocked = new Set(Array.from({ length: MAX_LABEL }, (_, i) => i));
          labelOrder = shuffle(MAX_LABEL);
        }
        return;
      }

      // --- SCRAMBLE OUT: dissolve current art into noise ---
      if (phase === 'out') {
        const p = Math.min(dt / SCRAMBLE_OUT_MS, 1);
        const ease = p * p; // accelerating
        const targetUnlocked = Math.floor(ease * N);

        while (locked.size > N - targetUnlocked) {
          const idx = order[N - locked.size];
          if (idx !== undefined) locked.delete(idx);
        }

        const labelTargetUnlocked = Math.floor(ease * MAX_LABEL);
        while (labelLocked.size > MAX_LABEL - labelTargetUnlocked) {
          const idx = labelOrder[MAX_LABEL - labelLocked.size];
          if (idx !== undefined) labelLocked.delete(idx);
        }

        for (let i = 0; i < N; i++) {
          if (!locked.has(i)) {
            spans[i].textContent = randChar();
            if (spans[i].className !== 'cs') spans[i].className = 'cs';
          }
        }
        for (let i = 0; i < MAX_LABEL; i++) {
          if (!labelLocked.has(i)) {
            labelSpans[i].textContent = randChar();
          }
        }

        if (p >= 1) {
          phase = 'in';
          t0 = now;
          artIdx = (artIdx + 1) % ART_PIECES.length;
          locked = new Set<number>();
          order = shuffle(N);
          labelLocked = new Set<number>();
          labelOrder = shuffle(MAX_LABEL);
        }
        return;
      }

      // --- SCRAMBLE IN: resolve noise into next art ---
      if (phase === 'in') {
        const p = Math.min(dt / SCRAMBLE_IN_MS, 1);
        const ease = 1 - Math.pow(1 - p, 3); // decelerating
        const target = Math.floor(ease * N);

        while (locked.size < target && locked.size < N) {
          const idx = order[locked.size];
          locked.add(idx);
          const r = Math.floor(idx / GRID_WIDTH);
          const c = idx % GRID_WIDTH;
          spans[idx].textContent = ART_PIECES[artIdx][r][c];
          if (spans[idx].className !== 'cl') spans[idx].className = 'cl';
        }

        const labelTarget = Math.floor(ease * MAX_LABEL);
        const label = LABELS[artIdx];
        while (labelLocked.size < labelTarget && labelLocked.size < MAX_LABEL) {
          const idx = labelOrder[labelLocked.size];
          labelLocked.add(idx);
          labelSpans[idx].textContent = idx < label.length ? label[idx] : ' ';
        }

        for (let i = 0; i < N; i++) {
          if (!locked.has(i)) {
            spans[i].textContent = randChar();
          }
        }
        for (let i = 0; i < MAX_LABEL; i++) {
          if (!labelLocked.has(i)) {
            labelSpans[i].textContent = randChar();
          }
        }

        if (p >= 1) {
          phase = 'hold';
          t0 = now;
        }
      }
    }

    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="matrix-outer">
      <div className="matrix-header">leon jacobs</div>
      <div className="matrix-art">
        <pre ref={preRef} className="matrix-pre" />
      </div>
      <div className="matrix-footer">
        <span ref={labelRef} className="matrix-label" />
        <span className="cursor">_</span>
      </div>
    </div>
  );
}
