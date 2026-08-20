import { ColorPreset } from '../types';

export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// Preset color stops from 0.0 to 1.0 with high dynamic range and vibrant luminescence
const COLOR_MAPS: Record<ColorPreset, { stop: number; r: number; g: number; b: number }[]> = {
  coinglass: [
    { stop: 0.0, r: 22, g: 18, b: 48 },     // Deep transparent dark violet
    { stop: 0.06, r: 65, g: 28, b: 115 },   // Royal indigo
    { stop: 0.18, r: 115, g: 35, b: 145 },  // Deep glowing purple
    { stop: 0.35, r: 180, g: 45, b: 135 },  // Radiant magenta
    { stop: 0.52, r: 235, g: 70, b: 65 },   // Warm coral-red
    { stop: 0.70, r: 250, g: 150, b: 35 },  // Vibrant amber-orange
    { stop: 0.86, r: 255, g: 230, b: 60 },  // High intensity yellow
    { stop: 1.0, r: 255, g: 255, b: 240 },  // White-hot peak liquidation pool
  ],
  cyberpunk: [
    { stop: 0.0, r: 12, g: 15, b: 32 },
    { stop: 0.12, r: 45, g: 20, b: 95 },
    { stop: 0.32, r: 120, g: 25, b: 160 },
    { stop: 0.52, r: 215, g: 35, b: 175 },
    { stop: 0.75, r: 0, g: 225, b: 220 },
    { stop: 1.0, r: 245, g: 255, b: 255 },
  ],
  magma: [
    { stop: 0.0, r: 14, g: 10, b: 30 },
    { stop: 0.15, r: 55, g: 18, b: 85 },
    { stop: 0.35, r: 130, g: 32, b: 110 },
    { stop: 0.55, r: 200, g: 60, b: 80 },
    { stop: 0.75, r: 248, g: 140, b: 45 },
    { stop: 1.0, r: 254, g: 254, b: 200 },
  ],
  inferno: [
    { stop: 0.0, r: 12, g: 10, b: 25 },
    { stop: 0.18, r: 75, g: 15, b: 90 },
    { stop: 0.40, r: 155, g: 40, b: 70 },
    { stop: 0.62, r: 225, g: 85, b: 25 },
    { stop: 0.82, r: 250, g: 180, b: 35 },
    { stop: 1.0, r: 254, g: 255, b: 180 },
  ],
  viridis: [
    { stop: 0.0, r: 22, g: 28, b: 45 },
    { stop: 0.20, r: 68, g: 1, b: 84 },
    { stop: 0.45, r: 49, g: 104, b: 142 },
    { stop: 0.70, r: 53, g: 183, b: 121 },
    { stop: 0.90, r: 200, g: 220, b: 50 },
    { stop: 1.0, r: 253, g: 245, b: 70 },
  ],
};

// Fast lookup table for 256 gradient steps
const LUT_CACHE = new Map<ColorPreset, Uint8ClampedArray>();

export function getColormapLUT(preset: ColorPreset): Uint8ClampedArray {
  if (LUT_CACHE.has(preset)) {
    return LUT_CACHE.get(preset)!;
  }

  const stops = COLOR_MAPS[preset] || COLOR_MAPS.coinglass;
  const lut = new Uint8ClampedArray(256 * 4); // RGBA

  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    
    // Find adjacent stops
    let lower = stops[0];
    let upper = stops[stops.length - 1];

    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s].stop && t <= stops[s + 1].stop) {
        lower = stops[s];
        upper = stops[s + 1];
        break;
      }
    }

    const range = upper.stop - lower.stop;
    const factor = range > 0 ? (t - lower.stop) / range : 0;

    const r = Math.round(lower.r + (upper.r - lower.r) * factor);
    const g = Math.round(lower.g + (upper.g - lower.g) * factor);
    const b = Math.round(lower.b + (upper.b - lower.b) * factor);
    
    // Smooth alpha curve: faint glow at low volume, solid luminescence as density rises
    let a = 0;
    if (t > 0.003) {
      a = Math.min(255, Math.round(65 + Math.pow(t, 0.55) * 190));
    }

    const offset = i * 4;
    lut[offset] = r;
    lut[offset + 1] = g;
    lut[offset + 2] = b;
    lut[offset + 3] = a;
  }

  LUT_CACHE.set(preset, lut);
  return lut;
}

export function getColorForIntensity(intensity: number, preset: ColorPreset = 'coinglass', alpha = 1): string {
  const clamped = Math.max(0, Math.min(1, intensity));
  const idx = Math.floor(clamped * 255);
  const lut = getColormapLUT(preset);
  const offset = idx * 4;
  const r = lut[offset];
  const g = lut[offset + 1];
  const b = lut[offset + 2];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
