// Powered by OnSpace.AI
// Multi-path Interference Simulation Service

import { CSS_CONFIG } from '@/constants/config';

export interface SignalPoint {
  index:  number;
  value:  number;   // -1 … +1
}

export interface CorrPoint {
  lag:   number;   // lag index
  value: number;   // normalized 0 … 1
}

export interface MultiPathResult {
  direct:      SignalPoint[];
  echoes:      SignalPoint[];
  combined:    SignalPoint[];
  corrNaive:   CorrPoint[];   // correlation of noisy signal w/o CSS processing
  corrCSS:     CorrPoint[];   // CSS matched-filter output (peak stays clean)
  peakLag:     number;
  peakRatio:   number;        // peak / second-peak — higher = better isolation
}

// ─────────────────────────────────────────────────────────────
// Low-resolution chirp generator (for DSP demo only, ~512 pts)
// ─────────────────────────────────────────────────────────────
const DEMO_SR   = 4410;   // 10× decimated sample rate
const DEMO_DUR  = 0.05;   // 50 ms
const DEMO_N    = Math.round(DEMO_SR * DEMO_DUR);  // 220 samples
const B         = CSS_CONFIG.BANDWIDTH;
const F_LOW     = CSS_CONFIG.F_LOW;
const F_HIGH    = CSS_CONFIG.F_HIGH;

function makeChirp(type: 'up' | 'down'): Float32Array {
  const arr   = new Float32Array(DEMO_N);
  const f0    = type === 'up' ? F_LOW : F_HIGH;
  const slope = (type === 'up' ? B : -B) / DEMO_DUR;
  let phase   = 0;
  for (let i = 0; i < DEMO_N; i++) {
    const f  = f0 + slope * (i / DEMO_SR);
    phase   += (2 * Math.PI * f) / DEMO_SR;
    arr[i]   = Math.sin(phase);
  }
  return arr;
}

/** Apply integer-sample delay and amplitude scale */
function delaySignal(src: Float32Array, delaySamples: number, gain: number): Float32Array {
  const out = new Float32Array(src.length);
  for (let i = delaySamples; i < src.length; i++) {
    out[i] = gain * src[i - delaySamples];
  }
  return out;
}

/** Element-wise addition of Float32Arrays */
function addSignals(...arrays: Float32Array[]): Float32Array {
  const len = arrays[0].length;
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    for (const arr of arrays) out[i] += arr[i];
  }
  return out;
}

/** Downsample Float32Array to 'pts' visualization points */
function downsample(arr: Float32Array, pts: number): SignalPoint[] {
  const step = arr.length / pts;
  return Array.from({ length: pts }, (_, i) => ({
    index: i,
    value: arr[Math.round(i * step)],
  }));
}

/** Cross-correlation of received signal vs reference chirp */
function crossCorrelate(
  received: Float32Array,
  reference: Float32Array,
  maxLag: number,
): CorrPoint[] {
  const N      = reference.length;
  const results: CorrPoint[] = [];

  // Compute normalization factor
  let refPower = 0;
  for (let i = 0; i < N; i++) refPower += reference[i] * reference[i];
  const refNorm = Math.sqrt(refPower);

  let recPower = 0;
  for (let i = 0; i < received.length; i++) recPower += received[i] * received[i];
  const recNorm = Math.sqrt(recPower);

  const denom = refNorm * recNorm || 1;

  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const j = i + lag;
      if (j >= 0 && j < received.length) {
        sum += received[j] * reference[i];
      }
    }
    results.push({ lag, value: Math.abs(sum) / denom });
  }

  // Normalize by peak so values sit in 0–1
  let peak = 1e-9;
  for (const r of results) { if (r.value > peak) peak = r.value; }
  return results.map(r => ({ ...r, value: r.value / peak }));
}

// ─────────────────────────────────────────────────────────────
// Naive correlator: just flat-window sum (no chirp dechirping)
// simulates what a non-CSS receiver would see
// ─────────────────────────────────────────────────────────────
function naiveCorrelate(
  received: Float32Array,
  maxLag: number,
): CorrPoint[] {
  // Reference = rectangular window (non-matched)
  const N = DEMO_N;
  const results: CorrPoint[] = [];

  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const j = i + lag;
      if (j >= 0 && j < received.length) {
        sum += received[j]; // no template — just energy integration
      }
    }
    results.push({ lag, value: Math.abs(sum) });
  }
  let peak2 = 1e-9;
  for (const r of results) { if (r.value > peak2) peak2 = r.value; }
  return results.map(r => ({ ...r, value: r.value / peak2 }));
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export interface MultiPathParams {
  delay1Ms:  number;   // 0–20 ms, echo 1 delay
  delay2Ms:  number;   // 0–20 ms, echo 2 delay
  alpha1:    number;   // 0–1, echo 1 amplitude
  alpha2:    number;   // 0–1, echo 2 amplitude
  chirpType: 'up' | 'down';
}

export function simulateMultiPath(params: MultiPathParams): MultiPathResult {
  const { delay1Ms, delay2Ms, alpha1, alpha2, chirpType } = params;

  const direct  = makeChirp(chirpType);
  const d1      = Math.round((delay1Ms / 1000) * DEMO_SR);
  const d2      = Math.round((delay2Ms / 1000) * DEMO_SR);
  const echo1   = delaySignal(direct, d1, alpha1);
  const echo2   = delaySignal(direct, d2, alpha2);
  const echoes  = addSignals(echo1, echo2);
  const combined = addSignals(direct, echo1, echo2);

  // CSS matched-filter: correlate combined with reference chirp
  const MAX_LAG = Math.floor(DEMO_N * 0.4);
  const corrCSS   = crossCorrelate(combined, direct, MAX_LAG);
  const corrNaive = naiveCorrelate(combined, MAX_LAG);

  // Peak / second-peak ratio (quality metric)
  const cssVals   = corrCSS.map(p => p.value).sort((a, b) => b - a);
  const peakRatio = cssVals[0] / (cssVals[3] || 0.01);

  // Peak lag index (index of max correlation value)
  let peakIdx = 0;
  for (let i = 1; i < corrCSS.length; i++) {
    if (corrCSS[i].value > corrCSS[peakIdx].value) peakIdx = i;
  }
  const peakLag = corrCSS[peakIdx].lag;

  // Downsample waveforms for display
  const VIS_PTS = 120;
  return {
    direct:    downsample(direct,   VIS_PTS),
    echoes:    downsample(echoes,   VIS_PTS),
    combined:  downsample(combined, VIS_PTS),
    corrNaive,
    corrCSS,
    peakLag,
    peakRatio: Math.min(peakRatio, 20),
  };
}

/** Convert delay ms to a human-readable distance (sound ≈ 343 m/s) */
export function delayToDistance(ms: number): string {
  const m = (ms / 1000) * 343;
  return m < 1 ? `${(m * 100).toFixed(0)} cm` : `${m.toFixed(1)} m`;
}
