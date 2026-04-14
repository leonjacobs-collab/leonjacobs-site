'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────

const COLS = 80;
const ROWS = 40;
const CHAR_W = 9;
const CHAR_H = 18;
const CANVAS_W = COLS * CHAR_W;   // 720
const CANVAS_H = ROWS * CHAR_H;   // 720
const FONT = '15px ui-monospace, "SF Mono", Menlo, monospace';
const GAMMA = 1.6;
const MIN_ALPHA = 0.04;
const TOTAL_CELLS = COLS * ROWS;   // 3200
const SCRAMBLE_INTERVAL = 6;       // reshuffle grid every N frames

// ─── Fallback word pools (no API needed) ─────────────────────────────────────

const WORD_POOLS: Record<string, string[]> = {
  ocean: ['waves','tide','salt','deep','blue','coral','drift','foam','shore','kelp','current','abyss','surface','whale','anchor','storm','calm','horizon','reef','shell','sand','pearl','voyage','harbor','mist','swell','plunge','ripple','turquoise','navy','brine','splash','ebb','flow','marine','depth','coast','lagoon','seabird','breeze','undertow','luminous','trawl','cape','fjord','spray','surge','fishing','submarine','buoy'],
  fire: ['flame','ember','ash','smoke','heat','burn','spark','blaze','glow','char','kindle','warmth','inferno','flicker','torch','hearth','smolder','ignite','scorch','fuel','crimson','orange','dance','consume','crackle','rage','fierce','molten','lava','candle','furnace','forge','sear','bright','bonfire','wildfire','coals','pyre','radiant','volatile','combust','phoenix','engulf','stoke','roar','flash','plume','light','sulfur','tinder'],
  forest: ['tree','moss','fern','bark','root','canopy','leaf','shadow','pine','oak','fungus','trail','birch','grove','undergrowth','dew','cedar','branch','ring','soil','lichen','nest','thicket','meadow','clearing','log','stump','bloom','wild','ancient','tall','dense','quiet','green','dark','deep','path','creek','stone','earth','mushroom','acorn','maple','willow','vine','damp','mist','dawn','twilight','shelter'],
  music: ['rhythm','melody','chord','beat','tone','harmony','note','tempo','bass','treble','crescendo','silence','hum','vibrate','string','drum','voice','echo','resonance','pitch','lyric','tune','compose','acoustic','wave','pulse','synth','organ','brass','woodwind','percussion','staccato','legato','minor','major','octave','refrain','verse','bridge','chorus','loop','fade','amplify','distort','reverb','groove','riff','soul','jazz','blues'],
  space: ['star','void','orbit','nebula','galaxy','light','dark','cosmic','solar','lunar','gravity','infinite','dust','comet','meteor','planet','satellite','eclipse','horizon','expanse','vacuum','radiation','quantum','warp','drift','vast','silent','cold','ancient','distant','glow','cluster','pulse','signal','probe','launch','thrust','capsule','module','dock','mission','crater','ring','belt','cloud','plasma','energy','wave','time','mass'],
  love: ['heart','tender','warm','gentle','embrace','touch','care','devotion','passion','trust','bond','close','soft','kind','gaze','hold','cherish','adore','blush','sweet','longing','desire','comfort','safety','home','belong','together','whisper','promise','faith','deep','pure','true','steady','fierce','quiet','brave','open','vulnerable','joy','ache','yearn','bloom','grow','nurture','protect','listen','understand','accept','give'],
  city: ['steel','glass','concrete','neon','traffic','crowd','tower','bridge','subway','alley','corner','avenue','block','grid','skyline','window','door','stair','elevator','lobby','roof','street','curb','sidewalk','sign','light','horn','siren','vendor','cafe','park','bench','fountain','mural','brick','smoke','steam','grate','rail','bus','taxi','pedestrian','crossing','clock','rush','pulse','buzz','grit','hustle','dawn'],
  dream: ['sleep','float','drift','surreal','vivid','haze','shimmer','morph','dissolve','fragment','memory','blur','echo','layer','depth','soft','strange','familiar','distant','wander','fall','fly','spiral','tunnel','door','mirror','shadow','light','color','shift','melt','expand','shrink','loop','repeat','forget','remember','face','voice','silence','heavy','weightless','slow','fast','warm','cold','lost','found','threshold','wake'],
};

const GENERIC_WORDS = ['light','shadow','texture','surface','depth','form','shape','line','curve','angle','edge','space','void','mass','weight','balance','tension','release','flow','drift','pulse','wave','ripple','echo','trace','mark','grain','tone','hue','shade','bright','dark','warm','cool','soft','hard','smooth','rough','thick','thin','dense','sparse','solid','fluid','static','motion','still','rapid','slow','steady','shift','turn','fold','layer','weave','blend','merge','split','scatter','gather','expand','contract','rise','fall','grow','fade','bloom','wither','emerge','dissolve','fragment','whole','piece','part','core','shell','inner','outer','near','far','above','below','through','between','within','beyond','around','across','along','against','toward','away','open','close','begin','end','cycle','loop','return','depart','arrive','rest','move','pause','continue','break','mend','build','erode','fill','empty','reveal','conceal','connect','divide','attract','repel','absorb','reflect','transmit','receive','create','destroy','preserve','transform','adapt','resist','yield','persist','endure','evolve','decay','renew','sustain','exhaust','restore','deplete','nourish','consume','generate','diminish','amplify','muffle','sharpen','blur','focus','scatter','converge','diverge','oscillate','vibrate','resonate','dampen','intensify','moderate','elevate','suppress','ignite','extinguish','kindle','quench','spark','smolder','flare','dim','glow','flash','shimmer','glint','gleam','radiate','absorb','opaque','translucent','transparent','mirror','lens','prism','filter','screen','veil','curtain','window','portal','threshold','boundary','margin','center','periphery','horizon','zenith','nadir','apex','base','foundation','summit','valley','ridge','plateau','slope','cliff','shore','bank','bed','channel','stream','pool','basin','reservoir','spring','source','mouth','delta','island','bridge','path','road','trail','maze','grid','web','net','knot','thread','fiber','strand','cord','chain','link','bond','joint','hinge','pivot','axis','orbit','spiral','helix','coil','ring','arc','bow','dome','vault','arch','column','beam','frame','scaffold','lattice','matrix'];

function generateFallbackWords(keyword: string): string[] {
  const key = keyword.toLowerCase().trim();
  const pool = WORD_POOLS[key];
  const source = pool || GENERIC_WORDS;
  const words: string[] = [];
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  while (words.length < 250) {
    for (const w of shuffled) {
      words.push(w);
      if (words.length >= 250) break;
    }
  }
  return words;
}

const BG = '#0a0a0a';
const FG = '#e8e0d0';
const ACCENT = '#5a5040';
const ACCENT_LIGHT = '#8a7a60';

// ─── Grid builder ────────────────────────────────────────────────────────────
// Returns a flat string of exactly COLS*ROWS characters (spaces for gaps).
// Each call shuffles the word order for a new arrangement.

function buildFlatGrid(words: string[]): string {
  if (words.length === 0) return ' '.repeat(TOTAL_CELLS);

  // Shuffle word order each time
  const shuffled = [...words].sort(() => Math.random() - 0.5);

  const chars: string[] = [];
  let wi = 0;

  while (chars.length < TOTAL_CELLS) {
    const word = shuffled[wi % shuffled.length];
    // If this word would overflow the current row, pad to next row
    const col = chars.length % COLS;
    const remaining = COLS - col;

    if (word.length > remaining) {
      // Fill rest of row with spaces
      for (let i = 0; i < remaining && chars.length < TOTAL_CELLS; i++) {
        chars.push(' ');
      }
      continue; // retry same word on new row
    }

    // Add space separator (unless at start of row)
    if (col > 0 && remaining > word.length) {
      chars.push(' ');
    }

    for (const ch of word) {
      if (chars.length >= TOTAL_CELLS) break;
      chars.push(ch);
    }
    wi++;
  }

  return chars.join('').slice(0, TOTAL_CELLS);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AsciiMirror() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const flashRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store words in a ref so the render loop can access them without
  // causing re-renders or stale closure issues
  const wordsRef = useRef<string[]>([]);
  const gridRef = useRef<string>('');
  const frameCountRef = useRef(0);

  const [keyword, setKeyword] = useState('');
  const [hasWords, setHasWords] = useState(false);
  const [mirroring, setMirroring] = useState(false);
  const [error, setError] = useState('');
  const [staticImage, setStaticImage] = useState<HTMLImageElement | null>(null);

  // ─── Shared brightness sampling ─────────────────────────────────────────

  function sampleSource(
    source: HTMLVideoElement | HTMLImageElement,
    sampleCanvas: HTMLCanvasElement,
  ): Uint8ClampedArray {
    const sCtx = sampleCanvas.getContext('2d')!;
    const isVideo = source instanceof HTMLVideoElement;
    const sw = isVideo ? (source.videoWidth || 640) : source.width;
    const sh = isVideo ? (source.videoHeight || 480) : source.height;

    const targetAspect = COLS / ROWS; // 2:1
    const srcAspect = sw / sh;
    let cx = 0, cy = 0, cw = sw, ch = sh;
    if (srcAspect > targetAspect) {
      cw = sh * targetAspect;
      cx = (sw - cw) / 2;
    } else {
      ch = sw / targetAspect;
      cy = (sh - ch) / 2;
    }

    sampleCanvas.width = COLS;
    sampleCanvas.height = ROWS;

    // Horizontal flip
    sCtx.save();
    sCtx.translate(COLS, 0);
    sCtx.scale(-1, 1);
    sCtx.drawImage(source, cx, cy, cw, ch, 0, 0, COLS, ROWS);
    sCtx.restore();

    return sCtx.getImageData(0, 0, COLS, ROWS).data;
  }

  // ─── Render a single frame with brightness data ─────────────────────────

  function renderFrame(
    ctx: CanvasRenderingContext2D,
    grid: string,
    pixels: Uint8ClampedArray,
  ) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.font = FONT;
    ctx.textBaseline = 'top';
    ctx.fillStyle = FG;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const ch = grid[idx];
        if (ch === ' ') continue;

        const pi = idx * 4;
        const brightness =
          (pixels[pi] * 0.299 + pixels[pi + 1] * 0.587 + pixels[pi + 2] * 0.114) / 255;
        const alpha = Math.pow(brightness, GAMMA);
        if (alpha < MIN_ALPHA) continue;

        ctx.globalAlpha = alpha;
        ctx.fillText(ch, c * CHAR_W, r * CHAR_H);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ─── Static render (preview before camera) ─────────────────────────────

  const renderStaticPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grid = buildFlatGrid(wordsRef.current);
    gridRef.current = grid;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.font = FONT;
    ctx.textBaseline = 'top';

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = grid[r * COLS + c];
        if (ch === ' ') continue;
        ctx.fillStyle = FG;
        ctx.globalAlpha = 0.3;
        ctx.fillText(ch, c * CHAR_W, r * CHAR_H);
      }
    }
    ctx.globalAlpha = 1;
  }, []);

  // ─── Mirror render loop ─────────────────────────────────────────────────

  const renderMirrorFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const sampleCanvas = sampleCanvasRef.current;
    if (!canvas || !video || !sampleCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reshuffle the grid every SCRAMBLE_INTERVAL frames
    frameCountRef.current++;
    if (frameCountRef.current % SCRAMBLE_INTERVAL === 0) {
      gridRef.current = buildFlatGrid(wordsRef.current);
    }

    const pixels = sampleSource(video, sampleCanvas);
    renderFrame(ctx, gridRef.current, pixels);

    animRef.current = requestAnimationFrame(renderMirrorFrame);
  }, []);

  // ─── Static image render ────────────────────────────────────────────────

  const renderFromImage = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    const sampleCanvas = sampleCanvasRef.current;
    if (!canvas || !sampleCanvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    gridRef.current = buildFlatGrid(wordsRef.current);
    const pixels = sampleSource(img, sampleCanvas);
    renderFrame(ctx, gridRef.current, pixels);
  }, []);

  useEffect(() => {
    if (staticImage && hasWords) {
      renderFromImage(staticImage);
    }
  }, [staticImage, hasWords, renderFromImage]);

  // Render static preview when words arrive (and not mirroring)
  useEffect(() => {
    if (hasWords && !mirroring && !staticImage) {
      renderStaticPreview();
    }
  }, [hasWords, mirroring, staticImage, renderStaticPreview]);

  // ─── Generate words ─────────────────────────────────────────────────────

  const generate = () => {
    if (!keyword.trim()) return;
    setError('');
    setStaticImage(null);
    setMirroring(false);
    cancelAnimationFrame(animRef.current);

    const newWords = generateFallbackWords(keyword);
    wordsRef.current = newWords;
    gridRef.current = buildFlatGrid(newWords);
    frameCountRef.current = 0;
    setHasWords(true);
  };

  // ─── Start mirror ──────────────────────────────────────────────────────

  const startMirror = async () => {
    if (!hasWords) return;
    setStaticImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        frameCountRef.current = 0;
        setMirroring(true);
        animRef.current = requestAnimationFrame(renderMirrorFrame);
      }
    } catch {
      setError('Camera access denied or unavailable');
    }
  };

  const stopMirror = () => {
    cancelAnimationFrame(animRef.current);
    setMirroring(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (hasWords) renderStaticPreview();
  };

  // ─── Shutter ───────────────────────────────────────────────────────────

  const takePhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Flash
    if (flashRef.current) {
      const flash = flashRef.current;
      flash.style.opacity = '1';
      flash.style.transition = 'none';
      requestAnimationFrame(() => {
        flash.style.transition = 'opacity 400ms ease-out';
        flash.style.opacity = '0';
      });
    }

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `ascii-mirror-${keyword.trim().toLowerCase().replace(/\s+/g, '-') || 'capture'}.png`;
    a.click();
  };

  // ─── Upload photo ──────────────────────────────────────────────────────

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopMirror();
    const img = new Image();
    img.onload = () => setStaticImage(img);
    img.src = URL.createObjectURL(file);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
    };
  }, []);

  // ─── Styles ────────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    background: BG,
    color: FG,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    padding: '24px',
    gap: '20px',
    position: 'relative',
    overflow: 'hidden',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '13px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: ACCENT_LIGHT,
    margin: 0,
  };

  const inputRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  };

  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: `1px solid ${ACCENT}`,
    color: FG,
    padding: '8px 12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    borderRadius: '2px',
    outline: 'none',
    width: '240px',
  };

  const btnStyle: React.CSSProperties = {
    background: 'transparent',
    border: `1px solid ${ACCENT}`,
    color: FG,
    padding: '8px 16px',
    fontSize: '12px',
    fontFamily: 'inherit',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    borderRadius: '2px',
    transition: 'border-color 200ms',
  };

  const btnActiveStyle: React.CSSProperties = {
    ...btnStyle,
    borderColor: FG,
  };

  const btnDisabledStyle: React.CSSProperties = {
    ...btnStyle,
    opacity: 0.3,
    cursor: 'default',
  };

  const canvasWrapStyle: React.CSSProperties = {
    position: 'relative',
    lineHeight: 0,
  };

  const flashStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'white',
    opacity: 0,
    pointerEvents: 'none',
    zIndex: 10,
  };

  const controlRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  const errorStyle: React.CSSProperties = {
    color: '#cc6644',
    fontSize: '12px',
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>ASCII Mirror</h1>

      <div style={inputRowStyle}>
        <input
          type="text"
          placeholder="Enter a keyword..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generate()}
          style={inputStyle}
        />
        <button onClick={generate} style={btnStyle}>
          Generate
        </button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={canvasWrapStyle}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            border: `1px solid ${ACCENT}`,
            borderRadius: '2px',
          }}
        />
        <div ref={flashRef} style={flashStyle} />
      </div>

      <div style={controlRowStyle}>
        {!mirroring ? (
          <button
            onClick={startMirror}
            style={hasWords ? btnActiveStyle : btnDisabledStyle}
            disabled={!hasWords}
          >
            Start Mirror
          </button>
        ) : (
          <button onClick={stopMirror} style={btnActiveStyle}>
            Stop Mirror
          </button>
        )}

        <button
          onClick={takePhoto}
          style={hasWords ? btnStyle : btnDisabledStyle}
          disabled={!hasWords}
        >
          Shutter
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={hasWords ? btnStyle : btnDisabledStyle}
          disabled={!hasWords}
        >
          Upload Photo
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
      </div>

      {hasWords && (
        <div style={{ fontSize: '11px', color: ACCENT, textAlign: 'center' }}>
          {wordsRef.current.length} words loaded
        </div>
      )}

      {/* Hidden elements */}
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas ref={sampleCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}
