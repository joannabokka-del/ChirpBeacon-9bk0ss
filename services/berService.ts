// Powered by OnSpace.AI
// BER vs SNR Simulation Service — CSS vs BPSK

// ─── Numerical Helpers ────────────────────────────────────────────────────────

/**
 * Complementary error function (erfc) — Abramowitz & Stegun approximation
 * Max error < 1.5e-7
 */
function erfc(x: number): number {
  if (x < 0) return 2 - erfc(-x);
  const t = 1 / (1 + 0.3275911 * x);
  const p = t * (0.254829592 +
    t * (-0.284496736 +
    t * (1.421413741 +
    t * (-1.453152027 +
    t *  1.061405429))));
  return p * Math.exp(-x * x);
}

/**
 * BPSK Bit Error Rate for a given linear Eb/N0
 * BER_BPSK = 0.5 * erfc(sqrt(Eb/N0))
 */
function bpskBER(ebno: number): number {
  if (ebno <= 0) return 0.5;
  return 0.5 * erfc(Math.sqrt(ebno));
}

/**
 * CSS BER with given spreading factor SF and linear Eb/N0.
 * The matched-filter processing gain = 2^SF, which multiplies the effective Eb/N0.
 * Approximation follows LoRa physical layer model.
 */
function cssBER(ebno: number, sf: number): number {
  const gain = Math.pow(2, sf);   // processing gain chips = 2^SF
  return bpskBER(ebno * gain);
}

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface BERPoint {
  snrDb:  number;
  ber:    number;
  logBer: number;  // log10(ber) for display — range: 0 (1e0) to -6 (1e-6)
}

export interface BERCurve {
  id:               string;
  label:            string;
  color:            string;
  sf:               number | null;  // null → raw BPSK
  processingGainDb: number;
  points:           BERPoint[];
}

// ─── Configuration ────────────────────────────────────────────────────────────

export const BER_SNR_RANGE = {
  min:   -20,   // dB
  max:    20,   // dB
  steps:  41,   // 1 dB steps
};

// Spreading factors modelled
export const CSS_SPREADING_FACTORS = [
  { sf: 7,  color: '#00D4FF', label: 'CSS SF=7',  gainDb: 21 },   // cyan
  { sf: 9,  color: '#00FF88', label: 'CSS SF=9',  gainDb: 27 },   // green
  { sf: 12, color: '#FFB300', label: 'CSS SF=12', gainDb: 36 },   // amber
] as const;

export const BPSK_COLOR = '#FF4444';  // red

// Log scale bounds for visualization
export const BER_LOG_MIN = -6;   // = 10^-6
export const BER_LOG_MAX =  0;   // = 10^0 = 1.0

// ─── Computation ─────────────────────────────────────────────────────────────

function makeSNRArray(): number[] {
  const arr: number[] = [];
  const step = (BER_SNR_RANGE.max - BER_SNR_RANGE.min) / (BER_SNR_RANGE.steps - 1);
  for (let i = 0; i < BER_SNR_RANGE.steps; i++) {
    arr.push(BER_SNR_RANGE.min + i * step);
  }
  return arr;
}

function snrDbToLinear(snrDb: number): number {
  return Math.pow(10, snrDb / 10);
}

function berToLogBer(ber: number): number {
  const clamped = Math.max(1e-7, Math.min(1, ber));
  return Math.log10(clamped);
}

/** Compute all BER curves */
export function computeBERCurves(): BERCurve[] {
  const snrArray = makeSNRArray();

  const curves: BERCurve[] = [];

  // ── Raw BPSK (no spreading) ──
  curves.push({
    id:               'bpsk',
    label:            'BPSK',
    color:            BPSK_COLOR,
    sf:               null,
    processingGainDb: 0,
    points:           snrArray.map(snrDb => {
      const ebno = snrDbToLinear(snrDb);
      const ber  = bpskBER(ebno);
      return { snrDb, ber, logBer: berToLogBer(ber) };
    }),
  });

  // ── CSS curves for each SF ──
  for (const { sf, color, label, gainDb } of CSS_SPREADING_FACTORS) {
    curves.push({
      id:               `css-sf${sf}`,
      label,
      color,
      sf,
      processingGainDb: gainDb,
      points:           snrArray.map(snrDb => {
        const ebno = snrDbToLinear(snrDb);
        const ber  = cssBER(ebno, sf);
        return { snrDb, ber, logBer: berToLogBer(ber) };
      }),
    });
  }

  return curves;
}

/**
 * For a given SNR (dB), return BER for each curve.
 * Used by the interactive SNR picker.
 */
export function getBERAtSNR(curves: BERCurve[], snrDb: number): Record<string, number> {
  const result: Record<string, number> = {};
  for (const curve of curves) {
    const closest = curve.points.reduce((best, pt) =>
      Math.abs(pt.snrDb - snrDb) < Math.abs(best.snrDb - snrDb) ? pt : best,
    );
    result[curve.id] = closest.ber;
  }
  return result;
}

/**
 * Find the SNR at which each curve crosses a BER threshold.
 * Used to compute the horizontal shift (gain) between curves.
 */
export function findSNRAtBER(curve: BERCurve, targetBer: number): number | null {
  for (let i = 1; i < curve.points.length; i++) {
    const prev = curve.points[i - 1];
    const curr = curve.points[i];
    if (curr.ber <= targetBer && prev.ber > targetBer) {
      // Linear interpolation
      const ratio = (targetBer - prev.ber) / (curr.ber - prev.ber);
      return prev.snrDb + ratio * (curr.snrDb - prev.snrDb);
    }
  }
  return null;
}

/** Normalize logBer to 0-1 for bar height (0 = BER 1.0, 1 = BER 1e-6) */
export function normalizeLogBer(logBer: number): number {
  return Math.max(0, Math.min(1, (logBer - BER_LOG_MAX) / (BER_LOG_MIN - BER_LOG_MAX)));
}
