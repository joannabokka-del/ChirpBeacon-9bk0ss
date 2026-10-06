// Powered by OnSpace.AI
// CSS Acoustic Transceiver — Design Tokens

export const Colors = {
  // Base surfaces
  background:    '#050A08',
  surface:       '#0A1410',
  surfaceAlt:    '#0F1F18',
  surfaceBorder: '#1A3028',
  card:          '#0D1C16',

  // Brand / Emphasis
  primary:       '#00FF88',   // Phosphor green
  primaryDim:    '#00C268',
  primaryGlow:   'rgba(0,255,136,0.18)',
  primaryMuted:  'rgba(0,255,136,0.08)',

  amber:         '#FFB300',   // Warning / down-chirp
  amberDim:      '#CC8E00',
  amberGlow:     'rgba(255,179,0,0.18)',

  red:           '#FF4444',   // Alert / danger
  redGlow:       'rgba(255,68,68,0.20)',

  cyan:          '#00D4FF',   // Info / theory
  cyanGlow:      'rgba(0,212,255,0.15)',

  // Text
  textPrimary:   '#E8F5EE',
  textSecondary: '#7BA98A',
  textMuted:     '#3D6650',
  textOnPrimary: '#050A08',

  // Semantic
  success:       '#00FF88',
  warning:       '#FFB300',
  danger:        '#FF4444',
  info:          '#00D4FF',

  // Overlay
  overlay:       'rgba(5,10,8,0.85)',
};

export const Typography = {
  fontMono:   'SpaceMono',

  sizeXs:     11,
  sizeSm:     13,
  sizeBase:   16,
  sizeMd:     18,
  sizeLg:     20,
  sizeXl:     24,
  sizeXxl:    30,
  sizeHero:   38,

  weightNormal:   '400' as const,
  weightMedium:   '500' as const,
  weightSemibold: '600' as const,
  weightBold:     '700' as const,
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  xxxl: 64,
};

export const Radius = {
  sm:   6,
  md:   10,
  lg:   16,
  xl:   24,
  full: 999,
};

export const Shadow = {
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  amberGlow: {
    shadowColor: Colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
};
