/* ── ASCII Art conversion core ──────────────────────────────
   Pure functions — no DOM, no React. Used by both the
   production AsciiArt component and the editor modal.       */

export const CHAR_RAMPS: Record<string, string> = {
  classic: " .:-=+*#%@",
  blocks: " ░▒▓█",
  departure: " ·•═╬█",
  minimal: " .:░█",
  dense: " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
};

export const RAMP_LABELS: Record<string, string> = {
  departure: "Departure ·•═╬█",
  classic: "Classic .:-=+*#%@",
  blocks: "Blocks ░▒▓█",
  minimal: "Minimal .:░█",
  dense: "Dense (full)",
};

export const SCRAMBLE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·•═╬░▒▓█@#$%&*+=-~";

export const FILL_CHAR = "█";

export type AnimationMode = "scroll" | "cascade" | "center" | "row" | "random";

export interface SizeStep {
  px: number;
  label: string;
  note: string;
}

export const SIZE_STEPS: SizeStep[] = [
  { px: 4,  label: "4px",  note: "micro" },
  { px: 5,  label: "5px",  note: "tiny" },
  { px: 6,  label: "6px",  note: "dense" },
  { px: 7,  label: "7px",  note: "compact" },
  { px: 8,  label: "8px",  note: "small" },
  { px: 9,  label: "9px",  note: "reading" },
  { px: 11, label: "11px", note: "base grid" },
  { px: 13, label: "13px", note: "large" },
  { px: 16, label: "16px", note: "display" },
  { px: 22, label: "22px", note: "2× grid" },
  { px: 33, label: "33px", note: "3× grid" },
  { px: 44, label: "44px", note: "4× grid" },
];

export const DEFAULT_SIZE_INDEX = 6; // 11px

export interface AsciiArtProps {
  src: string;
  alt?: string;
  cols?: number;
  ramp?: string;
  mode?: AnimationMode;
  speed?: number;
  invert?: boolean;
  fontSize?: number;
}

export const DEFAULTS = {
  cols: 100,
  ramp: "departure",
  mode: "cascade" as AnimationMode,
  speed: 1,
  invert: true,
  fontSize: 11,
} as const;

/**
 * Convert raw RGBA pixel data to an array of ASCII text lines.
 *
 * @param imageData  Flat Uint8ClampedArray from canvas getImageData().data
 * @param width      Source image width in pixels
 * @param height     Source image height in pixels
 * @param cols       Number of ASCII columns
 * @param ramp       Key into CHAR_RAMPS
 * @param invert     Flip brightness before mapping
 */
export function imageToAscii(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  cols: number,
  ramp: string,
  invert: boolean
): string[] {
  const chars = CHAR_RAMPS[ramp] || CHAR_RAMPS.departure;
  const cellW = width / cols;
  const cellH = cellW * 2; // monospace chars are ~2:1 tall
  const rows = Math.floor(height / cellH);
  const lines: string[] = [];

  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const startX = Math.floor(x * cellW);
      const startY = Math.floor(y * cellH);
      const endX = Math.min(Math.floor((x + 1) * cellW), width);
      const endY = Math.min(Math.floor((y + 1) * cellH), height);

      let totalBrightness = 0;
      let count = 0;

      for (let py = startY; py < endY; py++) {
        for (let px = startX; px < endX; px++) {
          const i = (py * width + px) * 4;
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3] / 255;
          totalBrightness += (0.299 * r + 0.587 * g + 0.114 * b) * a;
          count++;
        }
      }

      let avg = count > 0 ? totalBrightness / count : 0;
      if (invert) avg = 255 - avg;
      const charIndex = Math.floor((avg / 255) * (chars.length - 1));
      line += chars[charIndex];
    }
    lines.push(line);
  }
  return lines;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
