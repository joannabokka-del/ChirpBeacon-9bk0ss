// Powered by OnSpace.AI
// CSS Acoustic Transceiver — Chirp Signal Service

import { CSS_CONFIG } from '@/constants/config';

export type ChirpType = 'up' | 'down';
export type ChirpSymbol = { bit: 0 | 1; chirp: ChirpType };

// ─── PCM Sample Generation ───────────────────────────────────────────────────

/**
 * Generate one chirp symbol as Float32 PCM samples.
 * Up-chirp (bit=1):   f(t) = F_LOW  + (B/T)·t  → sweeps 18→20 kHz
 * Down-chirp (bit=0): f(t) = F_HIGH − (B/T)·t  → sweeps 20→18 kHz
 */
export function generateChirpSamples(
  chirpType: ChirpType,
  sampleRate = CSS_CONFIG.SAMPLE_RATE,
  duration   = CSS_CONFIG.CHIRP_DURATION,
  amplitude  = 0.85,
): Float32Array {
  const N    = Math.floor(sampleRate * duration);
  const B    = CSS_CONFIG.BANDWIDTH;
  const f0   = chirpType === 'up' ? CSS_CONFIG.F_LOW  : CSS_CONFIG.F_HIGH;
  const slope = (chirpType === 'up' ? B : -B) / duration;
  const samples = new Float32Array(N);

  let phase = 0;
  for (let i = 0; i < N; i++) {
    const t = i / sampleRate;
    // instantaneous frequency
    const f = f0 + slope * t;
    // phase accumulation (trapezoidal integration)
    phase += (2 * Math.PI * f) / sampleRate;
    samples[i] = amplitude * Math.sin(phase);
  }
  return samples;
}

/**
 * Encode a UTF-8 string into an array of chirp symbols.
 * Each character → 8 bits → 8 chirp symbols.
 */
export function encodeTextToSymbols(text: string): ChirpSymbol[] {
  const symbols: ChirpSymbol[] = [];
  // Add preamble: 8 up-chirps
  for (let i = 0; i < CSS_CONFIG.PREAMBLE_SYMBOLS; i++) {
    symbols.push({ bit: 1, chirp: 'up' });
  }
  // SFD: down-chirp, up-chirp
  symbols.push({ bit: 0, chirp: 'down' });
  symbols.push({ bit: 1, chirp: 'up'  });
  // Payload
  for (const char of text) {
    const code = char.charCodeAt(0);
    for (let b = 7; b >= 0; b--) {
      const bit = (code >> b) & 1;
      symbols.push({ bit: bit as 0 | 1, chirp: bit === 1 ? 'up' : 'down' });
    }
  }
  return symbols;
}

/**
 * Build a WAV ArrayBuffer from an array of Float32 PCM samples.
 * Returns a base64-encoded data URI usable with expo-av.
 */
export function samplesToWavBase64(
  symbols: ChirpSymbol[],
  sampleRate = CSS_CONFIG.SAMPLE_RATE,
): string {
  const chirpLen  = Math.floor(sampleRate * CSS_CONFIG.CHIRP_DURATION);
  const totalLen  = chirpLen * symbols.length;
  const byteLen   = totalLen * 2; // 16-bit PCM
  const headerLen = 44;
  const buf       = new ArrayBuffer(headerLen + byteLen);
  const view      = new DataView(buf);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4,  36 + byteLen, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);          // PCM chunk size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, 1, true);           // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);           // block align
  view.setUint16(34, 16, true);          // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, byteLen, true);

  // PCM data
  let offset = headerLen;
  for (const sym of symbols) {
    const samples = generateChirpSamples(sym.chirp, sampleRate, CSS_CONFIG.CHIRP_DURATION);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }

  // Encode to base64 in chunks to avoid stack overflow on large buffers
  const bytes   = new Uint8Array(buf);
  const CHUNK   = 8192;
  let binary    = '';
  for (let i = 0; i < bytes.byteLength; i += CHUNK) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// ─── Waveform Visualization Data ─────────────────────────────────────────────

export interface WaveformPoint { t: number; f: number; amp: number }

/** Generate frequency-vs-time points for a chirp (for visualization) */
export function getChirpVisualizationData(
  chirpType: ChirpType,
  points = 80,
): WaveformPoint[] {
  const B = CSS_CONFIG.BANDWIDTH;
  const T = CSS_CONFIG.CHIRP_DURATION;
  const f0 = chirpType === 'up' ? CSS_CONFIG.F_LOW : CSS_CONFIG.F_HIGH;
  const slope = (chirpType === 'up' ? B : -B) / T;
  return Array.from({ length: points }, (_, i) => {
    const t = (i / (points - 1)) * T;
    return { t, f: f0 + slope * t, amp: 1.0 };
  });
}

/** Compute simulated cross-correlation output (for visualization) */
export function simulateCrossCorrelation(
  receivedChirp: ChirpType,
  referenceChirp: ChirpType,
  noise = 0.15,
): number[] {
  const N = 100;
  const peak = receivedChirp === referenceChirp;
  return Array.from({ length: N }, (_, i) => {
    const norm = i / N;
    const base = noise * (Math.random() - 0.5);
    if (!peak) return Math.abs(base) * 0.3;
    // Gaussian peak near center
    const center = 0.5;
    const sigma  = 0.05;
    const gauss  = Math.exp(-Math.pow(norm - center, 2) / (2 * sigma * sigma));
    return Math.min(1, gauss * 0.95 + base);
  });
}

// ─── SNR Simulation ───────────────────────────────────────────────────────────

export function simulateSNR(noiseLevel: number): number {
  // noiseLevel 0–1 maps to SNR range
  const maxSNR = 20;  // dB
  const minSNR = -15; // dB
  return maxSNR - noiseLevel * (maxSNR - minSNR) + (Math.random() - 0.5) * 2;
}

export function calculateProcessingGain(): number {
  return 10 * Math.log10(CSS_CONFIG.BANDWIDTH / CSS_CONFIG.BIT_RATE);
}
