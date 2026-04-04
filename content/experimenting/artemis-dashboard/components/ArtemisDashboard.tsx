'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'nominal' | 'warning' | 'danger';

interface KpEntry {
  time_tag: string;
  kp_index: number;
}

interface MagEntry {
  time_tag: string;
  bt: number;
  bz_gsm: number;
  proton_density?: number;
  speed?: number;
}

interface FlareEntry {
  beginTime: string;
  classType: string;
  sourceLocation?: string;
}

interface CmeEntry {
  startTime: string;
  cmeAnalyses?: Array<{ speed: number }>;
}

interface PolledResult<T> {
  data: T;
  live: boolean;
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const P = {
  bg:        '#0a0a0a',
  panel:     '#0f0f0f',
  border:    '#1e1e1e',
  borderHi:  '#2a2a2a',
  enamel:    '#eeeeee',
  carbon:    '#222222',
  amber:     '#ffa133',
  green:     '#00e676',
  red:       '#ff1744',
  cyan:      '#00e5ff',
  yellow:    '#ffd600',
  muted:     '#555555',
  faint:     '#333333',
  dim:       '#2a2a2a',
  headerBg:  '#050505',
};

const FONT = "'Departure Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace";

// ─── Utils ────────────────────────────────────────────────────────────────────

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function wave(t: number, period: number, amplitude: number, offset: number): number {
  return offset + Math.sin((t / period) * 2 * Math.PI) * amplitude;
}

function padN(n: number, width = 2): string {
  return String(Math.floor(Math.abs(n))).padStart(width, '0');
}

function formatMET(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${padN(h, 3)}:${padN(m)}:${padN(s)}`;
}

function toStatus(val: number, warn: number, danger: number): Status {
  if (val >= danger) return 'danger';
  if (val >= warn)   return 'warning';
  return 'nominal';
}

function statusColor(s: Status): string {
  if (s === 'danger')  return P.red;
  if (s === 'warning') return P.yellow;
  return P.green;
}

// ─── usePolled ────────────────────────────────────────────────────────────────

function usePolled<T>(
  fetchFn: () => Promise<T>,
  intervalMs: number,
  fallback: T | (() => T),
): PolledResult<T> {
  const getFallback = useCallback(
    () => (typeof fallback === 'function' ? (fallback as () => T)() : fallback),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [state, setState] = useState<PolledResult<T>>(() => ({
    data: getFallback(),
    live: false,
  }));

  useEffect(() => {
    let cancelled = false;
    async function attempt() {
      try {
        const result = await fetchFn();
        if (!cancelled) setState({ data: result, live: true });
      } catch {
        if (!cancelled) setState({ data: getFallback(), live: false });
      }
    }
    attempt();
    const id = setInterval(attempt, intervalMs);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return state;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AsciiBar({
  value, max, width = 18,
  warnAt = 0.7, dangerAt = 0.9,
  color,
}: {
  value: number; max: number; width?: number;
  warnAt?: number; dangerAt?: number; color?: string;
}) {
  const ratio  = clamp(value / max, 0, 1);
  const filled = Math.round(ratio * width);
  const c = color ?? (ratio >= dangerAt ? P.red : ratio >= warnAt ? P.yellow : P.green);
  return (
    <span>
      <span style={{ color: P.faint }}>[</span>
      <span style={{ color: c }}>{'█'.repeat(filled)}{'░'.repeat(width - filled)}</span>
      <span style={{ color: P.faint }}>]</span>
    </span>
  );
}

function AsciiSpark({ data, width = 22 }: { data: number[]; width?: number }) {
  const CHARS = '▁▂▃▄▅▆▇█';
  if (!data.length) return <span style={{ color: P.faint }}>{'─'.repeat(width)}</span>;

  const resampled = Array.from({ length: width }, (_, i) => {
    const idx = Math.floor((i / width) * data.length);
    return data[Math.min(idx, data.length - 1)];
  });

  const min = Math.min(...resampled);
  const max = Math.max(...resampled);
  const range = max - min || 1;

  return (
    <span>
      {resampled.map((v, i) => {
        const ci    = Math.round(((v - min) / range) * (CHARS.length - 1));
        const age   = (width - 1 - i) / width;
        const color = age < 0.15 ? P.cyan : age < 0.45 ? P.muted : P.faint;
        return <span key={i} style={{ color }}>{CHARS[ci]}</span>;
      })}
    </span>
  );
}

function Readout({
  label, value, unit = '', color,
}: {
  label: string; value: string | number; unit?: string; color?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', lineHeight: 1.3 }}>
      <span style={{ color: P.muted }}>{label}</span>
      <span style={{ color: color ?? P.enamel }}>
        {value}{unit && <span style={{ color: P.muted }}> {unit}</span>}
      </span>
    </div>
  );
}

function StatusDot({ status }: { status: Status }) {
  const c = statusColor(status);
  return (
    <span style={{
      display:      'inline-block',
      width:        6,
      height:       6,
      borderRadius: '50%',
      background:   c,
      boxShadow:    `0 0 5px ${c}`,
      flexShrink:   0,
    }} />
  );
}

function Cell({
  code, title, status = 'nominal', style: outerStyle, children,
}: {
  code: string; title: string; status?: Status;
  style?: React.CSSProperties; children: React.ReactNode;
}) {
  return (
    <div style={{
      background:     P.panel,
      border:         `1px solid ${P.border}`,
      display:        'flex',
      flexDirection:  'column',
      padding:        '5px 8px',
      overflow:       'hidden',
      minHeight:      0,
      fontFamily:     FONT,
      ...outerStyle,
    }}>
      {/* Badge row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, flexShrink: 0 }}>
        <span style={{
          background:    P.amber,
          color:         P.carbon,
          fontWeight:    700,
          fontSize:      '0.58em',
          padding:       '1px 3px',
          letterSpacing: '0.12em',
        }}>{code}</span>
        <span style={{
          color:         P.enamel,
          fontSize:      '0.65em',
          letterSpacing: '0.07em',
          flex:          1,
          opacity:       0.7,
        }}>{title.toUpperCase()}</span>
        <StatusDot status={status} />
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', fontSize: '0.7em' }}>
        {children}
      </div>
    </div>
  );
}

function EventLog({ events }: { events: string[] }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (events.length <= 4) return;
    const id = setInterval(() => setOffset(o => (o + 1) % events.length), 3500);
    return () => clearInterval(id);
  }, [events.length]);

  if (!events.length) {
    return <div style={{ color: P.muted, fontSize: '0.9em' }}>NO EVENTS</div>;
  }

  const visible = Array.from({ length: Math.min(4, events.length) }, (_, i) =>
    events[(offset + i) % events.length],
  );

  return (
    <div style={{ fontSize: '0.9em' }}>
      {visible.map((e, i) => (
        <div key={i} style={{
          color:          i === 0 ? P.enamel : P.muted,
          marginBottom:   2,
          whiteSpace:     'nowrap',
          overflow:       'hidden',
          textOverflow:   'ellipsis',
          lineHeight:     1.35,
        }}>{e}</div>
      ))}
    </div>
  );
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchKp(): Promise<KpEntry[]> {
  const r = await fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json');
  if (!r.ok) throw new Error('kp');
  return r.json() as Promise<KpEntry[]>;
}

async function fetchMag(): Promise<MagEntry[]> {
  const r = await fetch('https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json');
  if (!r.ok) throw new Error('mag');
  return r.json() as Promise<MagEntry[]>;
}

async function fetchFlares(): Promise<FlareEntry[]> {
  const end   = new Date();
  const start = new Date(end.getTime() - 7 * 86_400_000);
  const fmt   = (d: Date) => d.toISOString().slice(0, 10);
  const r = await fetch(
    `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR?startDate=${fmt(start)}&endDate=${fmt(end)}`,
  );
  if (!r.ok) throw new Error('flares');
  return r.json() as Promise<FlareEntry[]>;
}

async function fetchCme(): Promise<CmeEntry[]> {
  const end   = new Date();
  const start = new Date(end.getTime() - 7 * 86_400_000);
  const fmt   = (d: Date) => d.toISOString().slice(0, 10);
  const r = await fetch(
    `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/CME?startDate=${fmt(start)}&endDate=${fmt(end)}`,
  );
  if (!r.ok) throw new Error('cme');
  return r.json() as Promise<CmeEntry[]>;
}

// ─── Simulation fallbacks ─────────────────────────────────────────────────────

function simKp(): KpEntry[] {
  return Array.from({ length: 60 }, (_, i) => ({
    time_tag:  new Date(Date.now() - (60 - i) * 60_000).toISOString(),
    kp_index:  parseFloat((2 + Math.sin(i * 0.28) * 1.4 + Math.random() * 0.25).toFixed(2)),
  }));
}

function simMag(): MagEntry[] {
  return Array.from({ length: 60 }, (_, i) => ({
    time_tag:        new Date(Date.now() - (60 - i) * 60_000).toISOString(),
    bt:              parseFloat((4.2 + Math.sin(i * 0.18) * 2.1).toFixed(2)),
    bz_gsm:          parseFloat((-0.8 + Math.sin(i * 0.31 + 1) * 3.2).toFixed(2)),
    proton_density:  parseFloat((5.4 + Math.sin(i * 0.14) * 2.3).toFixed(2)),
    speed:           parseFloat((415 + Math.sin(i * 0.09) * 35).toFixed(1)),
  }));
}

function simFlares(): FlareEntry[] {
  return [
    { beginTime: '2026-04-03T14:22:00Z', classType: 'C2.4', sourceLocation: 'N12W34' },
    { beginTime: '2026-04-03T08:15:00Z', classType: 'M1.1', sourceLocation: 'S05E22' },
    { beginTime: '2026-04-02T22:44:00Z', classType: 'C7.8', sourceLocation: 'N08W15' },
    { beginTime: '2026-04-01T17:30:00Z', classType: 'B9.2', sourceLocation: 'S03E45' },
    { beginTime: '2026-03-31T06:10:00Z', classType: 'C1.3', sourceLocation: 'N15W60' },
  ];
}

function simCme(): CmeEntry[] {
  return [
    { startTime: '2026-04-03T15:00:00Z', cmeAnalyses: [{ speed: 412 }] },
    { startTime: '2026-04-02T08:24:00Z', cmeAnalyses: [{ speed: 287 }] },
    { startTime: '2026-03-30T22:00:00Z', cmeAnalyses: [{ speed: 635 }] },
    { startTime: '2026-03-28T04:10:00Z', cmeAnalyses: [{ speed: 510 }] },
  ];
}

// ─── Orion capsule ASCII art ──────────────────────────────────────────────────

const ORION_ART = [
  '             .',
  '            /^\\',
  '           / | \\',
  '          /  |  \\',
  '         / .===. \\',
  '        /  |   |  \\',
  '       /   | ◯ |   \\',
  '      / ───┤   ├─── \\',
  '     /     |   |     \\',
  '    /  ◈   \'===\'  ◈   \\',
  '   / ──────┐   ┌────── \\',
  '  /────────┤ O ├────────\\',
  '  ──────── ┤   ├ ────────',
  '           │▓▓▓│',
  '         ──┤▓▓▓├──',
  '        ╱  │▓▓▓│  ╲',
  '       ╱╱  └───┘  ╲╲',
  '      ╱╱╱    │    ╲╲╲',
  '     ╱╱╱╱    │    ╲╲╲╲',
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function ArtemisDashboard() {
  // ── Clocks & animation ──────────────────────────────────────────────────
  const [now,      setNow]      = useState(() => Date.now());
  const [scanLine, setScanLine] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setScanLine(s => (s + 1) % ORION_ART.length);
    }, 150);
    return () => clearInterval(id);
  }, []);

  // Met in seconds from page load; offset by 3 days to place at trans-lunar coast
  const met = (now - startRef.current) / 1000;
  const t   = 3 * 86_400 + met;

  // ── Live data ────────────────────────────────────────────────────────────
  const kpRes     = usePolled(fetchKp,     60_000,  simKp);
  const magRes    = usePolled(fetchMag,    60_000,  simMag);
  const flareRes  = usePolled(fetchFlares, 900_000, simFlares);
  const cmeRes    = usePolled(fetchCme,    900_000, simCme);

  const anyLive = kpRes.live || magRes.live || flareRes.live || cmeRes.live;

  // ── Simulated telemetry (all slow sinusoidal drift) ──────────────────────
  const earthDist   = clamp(wave(t, 86_400 * 5, 12_000, 118_500) + t * 0.5, 50_000, 380_000);
  const moonDist    = clamp(384_400 - earthDist + wave(t, 3_600, 300, 0), 4_000, 380_000);
  const transProg   = clamp(earthDist / 384_400, 0, 1);

  const velocity    = wave(t, 86_400 * 4, 0.09, 1.18);
  const rangeRate   = wave(t, 3_600 * 8,  0.02, 0.82);

  const roll        = wave(t, 120,  4.2,  0.3);
  const pitch       = wave(t, 180,  2.8,  11.5);
  const yaw         = wave(t, 150,  3.6, -0.8);

  const solarPct    = wave(t, 90,   3.5,  91.0);
  const busVoltage  = wave(t, 200,  0.3,  27.6);
  const loadKw      = wave(t, 300,  0.2,  3.4);

  const protonFlux  = Math.abs(wave(t, 3_600, 0.3, 0.7));
  const doseRate    = Math.abs(wave(t, 7_200, 0.4, 1.2));
  const cumDose     = 2.8 * 24 + (met / 3_600) * 1.2;

  const cabinTemp   = wave(t, 600,   0.6, 21.8);
  const o2Pct       = wave(t, 1_200, 0.08, 20.85);
  const co2Pct      = Math.abs(wave(t, 900, 0.04, 0.38));
  const pressure    = wave(t, 3_600, 0.3, 101.3);

  const signalDbm   = wave(t, 120,   1.5, -88.2);
  const bitRate     = wave(t, 600,   0.5,  10.2);
  const lightDelay  = (earthDist * 1_000) / 299_792_458;

  const dvBudget    = 900;
  const dvUsed      = Math.abs(wave(t, 86_400 * 4, 5, 285));
  const dvRemaining = dvBudget - dvUsed;

  const heatshield  = wave(t, 3_600, 2,   26.5);
  const radiator    = wave(t, 3_600, 3,  -47.0);
  const solarArr    = wave(t, 300,   5,   52.0);
  const engine      = wave(t, 7_200, 1,   16.5);

  // ── Kp processing ────────────────────────────────────────────────────────
  const kpHistory = kpRes.data.map(d => d.kp_index).slice(-60);
  const currentKp = kpRes.data.length ? kpRes.data[kpRes.data.length - 1].kp_index : 2.3;
  const kpStatus  = toStatus(currentKp, 5, 7);
  const kpLabel   = currentKp >= 7 ? 'SEVERE' : currentKp >= 5 ? 'ACTIVE' : currentKp >= 4 ? 'UNSETTLED' : 'QUIET';

  // ── Solar wind processing ────────────────────────────────────────────────
  const lastMag    = magRes.data.length
    ? magRes.data[magRes.data.length - 1]
    : { bt: 4.2, bz_gsm: -0.8, speed: 415 };
  const bzHistory  = magRes.data.map(d => d.bz_gsm).slice(-60);
  const bzStatus   = lastMag.bz_gsm < -10 ? 'danger' as Status : lastMag.bz_gsm < -5 ? 'warning' as Status : 'nominal' as Status;
  const swSpeed    = (lastMag as MagEntry).speed ?? 415;

  // ── Flare event log ──────────────────────────────────────────────────────
  const flareColor = (c: string) => {
    const cls = c[0];
    if (cls === 'X') return P.red;
    if (cls === 'M') return P.yellow;
    if (cls === 'C') return P.cyan;
    return P.muted;
  };

  const flareEvents = [...flareRes.data]
    .slice(-10).reverse()
    .map(f => {
      const d = f.beginTime.slice(5, 16).replace('T', ' ');
      return `${d} ${f.classType}${f.sourceLocation ? ' ' + f.sourceLocation : ''}`;
    });

  const cmeEvents = [...cmeRes.data]
    .slice(-8).reverse()
    .map(c => {
      const d     = c.startTime.slice(5, 16).replace('T', ' ');
      const speed = c.cmeAnalyses?.[0]?.speed;
      return `${d}${speed != null ? ` ${speed}km/s` : ''}`;
    });

  // ── Header clocks ────────────────────────────────────────────────────────
  const d      = new Date(now);
  const utcStr = `${padN(d.getUTCHours())}:${padN(d.getUTCMinutes())}:${padN(d.getUTCSeconds())} UTC`;
  const metStr = formatMET(t);

  // ── Layout helpers ───────────────────────────────────────────────────────
  const grid = (col: string, row: string): React.CSSProperties => ({
    gridColumn: col,
    gridRow:    row,
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position:   'fixed',
      inset:      0,
      background: P.bg,
      color:      P.enamel,
      fontFamily: FONT,
      fontSize:   11,
      display:    'flex',
      flexDirection: 'column',
      overflow:   'hidden',
      zIndex:     0,
    }}>

      {/* ── Header ── */}
      <div style={{
        background:   P.headerBg,
        borderBottom: `2px solid ${P.amber}`,
        padding:      '6px 14px',
        paddingTop:   54, // clear fixed site nav
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
        flexShrink:   0,
      }}>
        {/* Left: mission identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            background:    P.amber,
            color:         P.carbon,
            fontWeight:    700,
            fontSize:      '0.8em',
            padding:       '2px 6px',
            letterSpacing: '0.15em',
          }}>ART</span>
          <div>
            <div style={{ color: P.enamel, fontSize: '0.85em', letterSpacing: '0.15em', fontWeight: 700 }}>
              ARTEMIS II
            </div>
            <div style={{ color: P.muted, fontSize: '0.62em', letterSpacing: '0.1em' }}>
              MISSION INSTRUMENT PANEL
            </div>
          </div>
        </div>

        {/* Right: clocks + live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: '0.75em' }}>
          <div>
            <span style={{ color: P.muted }}>UTC </span>
            <span style={{ color: P.cyan }}>{utcStr}</span>
          </div>
          <div>
            <span style={{ color: P.muted }}>MET </span>
            <span style={{ color: P.amber }}>{metStr}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              display:      'inline-block',
              width:        7,
              height:       7,
              borderRadius: '50%',
              background:   anyLive ? P.green : P.yellow,
              boxShadow:    `0 0 6px ${anyLive ? P.green : P.yellow}`,
            }} />
            <span style={{ color: anyLive ? P.green : P.yellow, letterSpacing: '0.1em' }}>
              {anyLive ? 'LIVE' : 'SIM'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Instrument grid ── */}
      <div style={{
        flex:                1,
        display:             'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows:    '2fr 2fr 2fr 1.5fr 1.5fr',
        gap:                 2,
        padding:             2,
        overflow:            'hidden',
      }}>

        {/* RNG — Range */}
        <Cell code="RNG" title="Range" style={grid('1', '1')}>
          <Readout label="EARTH" value={Math.round(earthDist).toLocaleString()} unit="km" color={P.cyan} />
          <Readout label="MOON"  value={Math.round(moonDist).toLocaleString()}  unit="km" color={P.muted} />
          <div style={{ marginTop: 4 }}>
            <div style={{ color: P.muted, fontSize: '0.85em', marginBottom: 2 }}>TLI PROGRESS</div>
            <AsciiBar value={transProg} max={1} width={16} warnAt={2} dangerAt={2} color={P.amber} />
            <span style={{ color: P.amber, marginLeft: 4 }}>{(transProg * 100).toFixed(1)}%</span>
          </div>
        </Cell>

        {/* ATT — Attitude display (spans cols 2–3, rows 1–3) */}
        <div style={{
          ...grid('2 / 4', '1 / 4'),
          background:    P.panel,
          border:        `1px solid ${P.borderHi}`,
          display:       'flex',
          flexDirection: 'column',
          padding:       '6px 10px',
          overflow:      'hidden',
        }}>
          {/* ATT header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, flexShrink: 0 }}>
            <span style={{ background: P.amber, color: P.carbon, fontWeight: 700, fontSize: '0.58em', padding: '1px 3px', letterSpacing: '0.12em' }}>ATT</span>
            <span style={{ color: P.enamel, fontSize: '0.65em', letterSpacing: '0.07em', opacity: 0.7 }}>ATTITUDE · ORION MPCV</span>
          </div>

          {/* RPY readouts */}
          <div style={{ display: 'flex', gap: 20, flexShrink: 0, marginBottom: 6, fontSize: '0.78em' }}>
            {[
              { label: 'ROLL',  val: roll  },
              { label: 'PITCH', val: pitch },
              { label: 'YAW',   val: yaw   },
            ].map(({ label, val }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ color: P.muted, fontSize: '0.85em', letterSpacing: '0.1em' }}>{label}</div>
                <div style={{ color: P.cyan, fontSize: '1.1em' }}>
                  {val >= 0 ? '+' : ''}{val.toFixed(2)}°
                </div>
              </div>
            ))}
          </div>

          {/* Horizon reference */}
          <div style={{ color: P.cyan, fontSize: '0.72em', flexShrink: 0, marginBottom: 2, letterSpacing: '0.05em' }}>
            {'─'.repeat(40)} REF {'─'.repeat(40)}
          </div>

          {/* Capsule art */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <pre style={{
              margin:     0,
              padding:    0,
              lineHeight: 1.3,
              fontSize:   '0.78em',
              fontFamily: FONT,
              userSelect: 'none',
            }}>
              {ORION_ART.map((line, i) => (
                <div key={i} style={{
                  color:      i === scanLine ? P.amber : i < 4 ? P.muted : P.enamel,
                  textShadow: i === scanLine ? `0 0 8px ${P.amber}` : 'none',
                  opacity:    i === scanLine ? 1 : i < 4 ? 0.5 : 0.85,
                  transition: 'all 0.1s',
                }}>{line}</div>
              ))}
            </pre>
          </div>

          {/* Phase footer */}
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', fontSize: '0.68em', marginTop: 4 }}>
            <span style={{ color: P.muted }}>PHASE</span>
            <span style={{ color: P.amber }}>TRANS-LUNAR COAST</span>
            <span style={{ color: P.muted }}>MIS DAY {Math.floor(t / 86_400)}</span>
          </div>
        </div>

        {/* VEL — Velocity */}
        <Cell code="VEL" title="Velocity" style={grid('4', '1')}>
          <div style={{ fontSize: '1.6em', color: P.amber, textAlign: 'center', marginBottom: 2 }}>
            {(velocity * 3_600).toFixed(0)}
          </div>
          <div style={{ textAlign: 'center', color: P.muted, fontSize: '0.8em', marginBottom: 6 }}>km/h</div>
          <Readout label="SPEED"      value={velocity.toFixed(3)}  unit="km/s" color={P.cyan} />
          <Readout label="RANGE RATE" value={`+${rangeRate.toFixed(3)}`} unit="km/s" />
          <div style={{ marginTop: 4 }}>
            <AsciiBar value={velocity} max={3} width={16} warnAt={2} dangerAt={2} color={P.amber} />
          </div>
        </Cell>

        {/* KP — Geomagnetic index */}
        <Cell code="KP" title="Kp Index" status={kpStatus} style={grid('1', '2')}>
          <div style={{ fontSize: '1.8em', color: statusColor(kpStatus), textAlign: 'center', marginBottom: 1 }}>
            {currentKp.toFixed(1)}
          </div>
          <div style={{ textAlign: 'center', color: statusColor(kpStatus), fontSize: '0.72em', letterSpacing: '0.1em', marginBottom: 5 }}>
            {kpLabel}
          </div>
          <AsciiBar value={currentKp} max={9} width={16} warnAt={0.56} dangerAt={0.78} />
          <div style={{ marginTop: 5 }}>
            <AsciiSpark data={kpHistory} width={18} />
          </div>
        </Cell>

        {/* SWD — Solar wind */}
        <Cell code="SWD" title="Solar Wind" status={bzStatus} style={grid('4', '2')}>
          <Readout label="Bt"    value={lastMag.bt.toFixed(1)}      unit="nT" />
          <Readout
            label="Bz"
            value={lastMag.bz_gsm >= 0 ? `+${lastMag.bz_gsm.toFixed(1)}` : lastMag.bz_gsm.toFixed(1)}
            unit="nT"
            color={lastMag.bz_gsm < -5 ? P.red : lastMag.bz_gsm < 0 ? P.yellow : P.green}
          />
          <Readout label="SPEED" value={swSpeed.toFixed(0)} unit="km/s" />
          <div style={{ marginTop: 4 }}>
            <AsciiSpark data={bzHistory} width={18} />
          </div>
          {lastMag.bz_gsm < -5 && (
            <div style={{ color: P.red, fontSize: '0.8em', marginTop: 3, letterSpacing: '0.05em' }}>
              ▲ GEOEFFECTIVE
            </div>
          )}
        </Cell>

        {/* PWR — Power */}
        <Cell code="PWR" title="Power" style={grid('1', '3')}>
          <Readout label="SOLAR" value={solarPct.toFixed(1)} unit="%" color={P.green} />
          <Readout label="BUS V" value={busVoltage.toFixed(2)} unit="V" />
          <Readout label="LOAD"  value={loadKw.toFixed(2)}    unit="kW" />
          <div style={{ marginTop: 4 }}>
            <AsciiBar value={solarPct} max={100} warnAt={0.6} dangerAt={0.3} width={16} color={P.green} />
          </div>
        </Cell>

        {/* RAD — Radiation */}
        <Cell code="RAD" title="Radiation" status={toStatus(protonFlux, 1, 10)} style={grid('4', '3')}>
          <Readout label="PROTON FLUX" value={protonFlux.toFixed(2)} unit="pfu"
            color={protonFlux > 10 ? P.red : protonFlux > 1 ? P.yellow : P.green} />
          <Readout label="DOSE RATE"  value={doseRate.toFixed(2)}   unit="mGy/d" />
          <Readout label="CUM. DOSE"  value={cumDose.toFixed(1)}    unit="mGy" />
          <div style={{ marginTop: 4 }}>
            <AsciiBar value={protonFlux} max={10} warnAt={0.1} dangerAt={0.5} width={16} />
          </div>
        </Cell>

        {/* FLR — Solar flares */}
        <Cell code="FLR" title="Solar Flares" status={flareRes.live ? 'nominal' : 'warning'}
          style={grid('1', '4')}>
          {flareEvents.length === 0
            ? <div style={{ color: P.muted, fontSize: '0.9em' }}>NO EVENTS</div>
            : <div style={{ fontSize: '0.88em' }}>
                {flareEvents.slice(0, 4).map((e, i) => {
                  const cls = e.match(/[A-Z]\d/)?.[0] ?? '';
                  return (
                    <div key={i} style={{
                      color:        i === 0 ? P.enamel : P.muted,
                      marginBottom: 2, lineHeight: 1.3,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      <span style={{ color: flareColor(cls) }}>{cls}</span>
                      {e.replace(cls, '')}
                    </div>
                  );
                })}
              </div>
          }
        </Cell>

        {/* CME — CME activity */}
        <Cell code="CME" title="CME Activity" style={grid('2', '4')}>
          <EventLog events={cmeEvents} />
        </Cell>

        {/* ENV — Crew environment */}
        <Cell code="ENV" title="Crew Env" style={grid('3', '4')}>
          <Readout label="TEMP"  value={cabinTemp.toFixed(1)} unit="°C" />
          <Readout label="O₂"    value={o2Pct.toFixed(2)}     unit="%"  color={P.green} />
          <Readout label="CO₂"   value={co2Pct.toFixed(3)}    unit="%"
            color={co2Pct > 0.5 ? P.yellow : P.green} />
          <Readout label="PRES"  value={pressure.toFixed(1)}  unit="kPa" />
        </Cell>

        {/* COM — Communications */}
        <Cell code="COM" title="Comms" style={grid('4', '4')}>
          <Readout label="TDRS"   value="LOCK"                 color={P.green} />
          <Readout label="SIGNAL" value={signalDbm.toFixed(1)} unit="dBm" />
          <Readout label="RATE"   value={bitRate.toFixed(1)}   unit="Mbps" />
          <Readout label="DELAY"  value={lightDelay.toFixed(2)} unit="s" />
        </Cell>

        {/* DV — Delta-V */}
        <Cell code="DV" title="Delta-V" style={grid('1', '5')}>
          <Readout label="BUDGET"    value={dvBudget.toFixed(0)} unit="m/s" />
          <Readout label="USED"      value={dvUsed.toFixed(1)}   unit="m/s" color={P.muted} />
          <Readout label="REMAINING" value={dvRemaining.toFixed(1)} unit="m/s" color={P.green} />
          <div style={{ marginTop: 3 }}>
            <AsciiBar value={dvRemaining} max={dvBudget} warnAt={0.3} dangerAt={0.15} width={16} color={P.cyan} />
          </div>
        </Cell>

        {/* THM — Thermal */}
        <Cell code="THM" title="Thermal" style={grid('2', '5')}>
          <Readout label="HEATSHIELD" value={heatshield.toFixed(1)} unit="°C" />
          <Readout label="RADIATOR"   value={radiator.toFixed(1)}   unit="°C" color={P.cyan} />
          <Readout label="SOLAR ARR"  value={solarArr.toFixed(1)}   unit="°C"
            color={solarArr > 80 ? P.red : solarArr > 60 ? P.yellow : P.enamel} />
          <Readout label="ENGINE"     value={engine.toFixed(1)}     unit="°C" />
        </Cell>

        {/* CRW — Crew */}
        <Cell code="CRW" title="Crew" style={grid('3', '5')}>
          {[
            { name: 'WISEMAN', role: 'CDR' },
            { name: 'GLOVER',  role: 'PLT' },
            { name: 'HANSEN',  role: 'MS1' },
            { name: 'JEREMY',  role: 'MS2' },
          ].map(({ name, role }) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: '0.9em' }}>
              <span style={{ color: P.muted }}>{role}</span>
              <span style={{ color: P.enamel }}>{name}</span>
              <span style={{
                display: 'inline-block', width: 6, height: 6,
                borderRadius: '50%', background: P.green,
                boxShadow: `0 0 4px ${P.green}`, alignSelf: 'center',
              }} />
            </div>
          ))}
        </Cell>

        {/* ORB — Orbital parameters */}
        <Cell code="ORB" title="Trajectory" style={grid('4', '5')}>
          <Readout label="DIST"   value={Math.round(earthDist).toLocaleString()} unit="km" />
          <Readout label="V"      value={velocity.toFixed(3)}                    unit="km/s" />
          <Readout label="INC"    value={wave(t, 86_400, 0.2, 28.5).toFixed(2)} unit="°" />
          <Readout label="PHASE"  value="TLC" color={P.amber} />
        </Cell>

      </div>
    </div>
  );
}

// Suppress stale Cell prop (style is passed via grid helper but not declared in Cell props)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Cell as any).displayName = 'Cell';
