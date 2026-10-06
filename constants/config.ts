// Powered by OnSpace.AI
// CSS Acoustic Transceiver — Signal Configuration

export const CSS_CONFIG = {
  // Chirp frequency range (near-ultrasonic)
  F_LOW:         18000,   // Hz — lower bound of chirp band
  F_HIGH:        20000,   // Hz — upper bound of chirp band
  BANDWIDTH:     2000,    // Hz — B = F_HIGH - F_LOW

  // Symbol timing
  CHIRP_DURATION: 0.05,   // seconds per symbol (50ms)
  SAMPLE_RATE:    44100,  // Hz

  // Spread spectrum parameters
  SPREADING_FACTOR: 7,           // SF=7: 2^7=128 chips per symbol
  CHIPS_PER_SYMBOL: 128,         // = 2^SF
  SYMBOL_RATE: 20,               // symbols/sec (1/CHIRP_DURATION)
  BIT_RATE: 20,                  // bits/sec (1 bit/symbol in CSS)

  // Processing gain
  PROCESSING_GAIN_DB: 21,        // ≈ 10*log10(BW/BR) dB
  TIME_BANDWIDTH_PRODUCT: 100,   // BW × T = 2000 × 0.05

  // Receiver thresholds
  CORRELATION_THRESHOLD: 0.72,   // Detection threshold (0–1)
  NOISE_FLOOR_DB: -85,           // dBm noise floor
  SNR_MIN_DB: -10,               // Minimum detectable SNR

  // Preamble & framing
  PREAMBLE_SYMBOLS: 8,           // Sync preamble up-chirps
  SFD_SYMBOLS: 2,                // Start Frame Delimiter
  PAYLOAD_BITS: 64,              // Max payload bits

  // SOS message fields
  GPS_PRECISION: 5,              // decimal places
};

export const DEMO_MESSAGES = [
  { id: 'sos', label: 'SOS Distress', text: 'SOS' },
  { id: 'gps', label: 'GPS Coordinates', text: 'GPS:37.7749,-122.4194' },
  { id: 'id',  label: 'Beacon ID',     text: 'BCN:UNIT-042' },
  { id: 'cus', label: 'Custom Message', text: '' },
];

export const THEORY_CARDS = [
  {
    id: 'css',
    title: 'Chirp Spread Spectrum',
    icon: 'signal-cellular-alt',
    color: '#00FF88',
    summary: 'CSS encodes data into chirps — signals that sweep linearly in frequency over time, mimicking LoRa physical layer modulation.',
    detail: [
      'Binary 1 → Up-chirp:   18 kHz → 20 kHz in 50 ms',
      'Binary 0 → Down-chirp: 20 kHz → 18 kHz in 50 ms',
      'Bandwidth B = 2000 Hz, Symbol time T = 50 ms',
      'Time-Bandwidth Product = B × T = 100',
    ],
    formula: 'f(t) = f₀ + (B/T)·t',
  },
  {
    id: 'gain',
    title: 'Processing Gain',
    icon: 'trending-up',
    color: '#00D4FF',
    summary: 'CSS achieves noise immunity through spreading: the processing gain amplifies the signal SNR at the correlator output.',
    detail: [
      'Gp = 10·log₁₀(B / Rb) ≈ 21 dB',
      'Bandwidth B = 2000 Hz',
      'Bit rate Rb = 20 bps',
      'Can detect signal at SNR = −10 dB',
    ],
    formula: 'Gₚ = 10·log₁₀(B/Rᵦ) dB',
  },
  {
    id: 'corr',
    title: 'Matched Filter / Cross-Correlation',
    icon: 'compare-arrows',
    color: '#FFB300',
    summary: 'Receiver multiplies incoming audio with a reference chirp template. A peak in the cross-correlation indicates symbol detection.',
    detail: [
      'R(τ) = ∫ r(t)·s*(t−τ) dt',
      'Peak at τ=0 when chirp types match',
      'Orthogonality: up vs down-chirp cross-corr ≈ 0',
      'Detection threshold set at 0.72 normalized',
    ],
    formula: 'R(τ) = ∫r(t)·s*(t−τ)dt',
  },
  {
    id: 'multi',
    title: 'Multi-path Immunity',
    icon: 'device-hub',
    color: '#FF4444',
    summary: 'Frequency sweeping distributes energy across the band, making CSS robust to narrowband interference and multi-path fading.',
    detail: [
      'Energy spread over full 2 kHz bandwidth',
      'Narrowband jammer only affects fraction of chirp',
      'Multi-path echoes decorrelate at receiver',
      'Demonstrated in LoRa (Semtech SX127x)',
    ],
    formula: 'SNR_out = SNR_in + Gₚ',
  },
];
