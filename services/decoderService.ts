// Powered by OnSpace.AI
// CSS Acoustic Transceiver — Decoder / Correlation Service

import { CSS_CONFIG } from '@/constants/config';
import { generateChirpSamples, simulateCrossCorrelation } from './chirpService';

export interface DecodeResult {
  detected:      boolean;
  confidence:    number;   // 0–1
  snr_db:        number;
  payload:       string;
  symbolCount:   number;
  timestamp:     number;
  correlation:   number[]; // normalized cross-correlation values
  chirpSequence: Array<'up' | 'down'>;
}

export interface SpectrumBin {
  freq:  number;  // Hz
  power: number;  // dB normalized 0–1
}

/** Simulate a full receive + decode cycle */
export function simulateReceive(
  noiseFloor: number = 0.3,
  signalPresent: boolean = true,
): DecodeResult {
  if (!signalPresent) {
    return {
      detected:      false,
      confidence:    0,
      snr_db:        noiseFloor * CSS_CONFIG.NOISE_FLOOR_DB,
      payload:       '',
      symbolCount:   0,
      timestamp:     Date.now(),
      correlation:   Array.from({ length: 100 }, () => Math.random() * 0.2),
      chirpSequence: [],
    };
  }

  // Simulate preamble detection + payload decode
  const snr_db = 20 - noiseFloor * 35 + (Math.random() - 0.5) * 3;
  const detectable = snr_db > CSS_CONFIG.SNR_MIN_DB;
  const confidence = detectable
    ? Math.min(1, 0.6 + (snr_db - CSS_CONFIG.SNR_MIN_DB) / 30 + Math.random() * 0.1)
    : Math.random() * 0.3;

  const correlation = simulateCrossCorrelation('up', 'up', noiseFloor * 0.5);

  // Simulate chirp sequence
  const chirpSequence: Array<'up' | 'down'> = [];
  for (let i = 0; i < CSS_CONFIG.PREAMBLE_SYMBOLS; i++) chirpSequence.push('up');
  chirpSequence.push('down', 'up'); // SFD
  // Random payload chirps
  for (let i = 0; i < 16; i++) {
    chirpSequence.push(Math.random() > 0.5 ? 'up' : 'down');
  }

  return {
    detected:      detectable && confidence > CSS_CONFIG.CORRELATION_THRESHOLD,
    confidence,
    snr_db,
    payload:       detectable ? 'SOS:BCN-042' : '',
    symbolCount:   chirpSequence.length,
    timestamp:     Date.now(),
    correlation,
    chirpSequence,
  };
}

/** Build a simulated spectrum (frequency → power) for display */
export function buildSpectrum(
  active: boolean,
  chirpPhase: number,   // 0–1, where in chirp we are
  noiseFloor = 0.3,
): SpectrumBin[] {
  const bins: SpectrumBin[] = [];
  const resolution = 50;   // Hz per bin
  const fMin = 15000;
  const fMax = 22000;
  const count = (fMax - fMin) / resolution;

  const chirpFreq = active
    ? CSS_CONFIG.F_LOW + chirpPhase * CSS_CONFIG.BANDWIDTH
    : -1;

  for (let i = 0; i <= count; i++) {
    const freq = fMin + i * resolution;
    const noise = noiseFloor * (0.05 + 0.08 * Math.random());
    const inBand = freq >= CSS_CONFIG.F_LOW && freq <= CSS_CONFIG.F_HIGH;
    // Chirp tone peak
    const distToChirp = Math.abs(freq - chirpFreq);
    const tonePeak = active && distToChirp < 150
      ? 0.85 * Math.exp(-distToChirp / 80)
      : 0;
    // Background band energy during chirp
    const bandEnergy = active && inBand ? 0.12 + 0.08 * Math.random() : 0;
    bins.push({
      freq,
      power: Math.min(1, noise + bandEnergy + tonePeak),
    });
  }
  return bins;
}

/** Format SNR with colour category */
export function snrCategory(snr: number): { label: string; color: string } {
  if (snr > 15)  return { label: 'Excellent', color: '#00FF88' };
  if (snr > 5)   return { label: 'Good',      color: '#00FF88' };
  if (snr > -5)  return { label: 'Marginal',  color: '#FFB300' };
  if (snr > -15) return { label: 'Weak',      color: '#FF8C00' };
  return              { label: 'Below Threshold', color: '#FF4444' };
}

/** Format a decode result for the log */
export function formatLogEntry(r: DecodeResult): string {
  const ts = new Date(r.timestamp).toLocaleTimeString();
  if (!r.detected) return `[${ts}] ✗ No signal — SNR: ${r.snr_db.toFixed(1)} dB`;
  return `[${ts}] ✓ "${r.payload}" — SNR: ${r.snr_db.toFixed(1)} dB, Conf: ${(r.confidence * 100).toFixed(0)}%`;
}
