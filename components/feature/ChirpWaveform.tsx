// Powered by OnSpace.AI
// Chirp frequency-vs-time waveform visualization

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius } from '@/constants/theme';
import { WaveformPoint } from '@/services/chirpService';
import { CSS_CONFIG } from '@/constants/config';

interface Props {
  data:      WaveformPoint[];
  chirpType: 'up' | 'down';
  width:     number;
  height:    number;
}

export const ChirpWaveform = memo(({ data, chirpType, width, height }: Props) => {
  if (!data.length || width < 2 || height < 2) return null;

  const color  = chirpType === 'up' ? Colors.primary : Colors.amber;
  const fRange = CSS_CONFIG.BANDWIDTH;
  const fMin   = CSS_CONFIG.F_LOW;
  const padH   = 8;
  const padV   = 8;
  const plotW  = width  - padH * 2;
  const plotH  = height - padV * 2;

  const points = data.map((p, i) => {
    const x = padH + (i / (data.length - 1)) * plotW;
    const y = padV + (1 - (p.f - fMin) / fRange) * plotH;
    return { x, y };
  });

  // Build SVG-style path segments as View bars
  const bars = points.map((pt, i) => {
    if (i === 0) return null;
    const prev = points[i - 1];
    const dx   = pt.x - prev.x + 1;
    const yTop  = Math.min(pt.y, prev.y);
    const yBot  = Math.max(pt.y, prev.y);
    const barH  = Math.max(2, yBot - yTop);
    return (
      <View
        key={i}
        style={{
          position: 'absolute',
          left:     prev.x,
          top:      yTop,
          width:    dx,
          height:   barH,
          backgroundColor: color,
          opacity:  0.9,
          borderRadius: 1,
        }}
      />
    );
  });

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <View
          key={pct}
          style={{
            position:        'absolute',
            left:            padH,
            top:             padV + pct * plotH,
            width:           plotW,
            height:          1,
            backgroundColor: Colors.surfaceBorder,
            opacity:         0.6,
          }}
        />
      ))}
      {/* Glow track */}
      <View style={[styles.glowTrack, { backgroundColor: color + '18', left: padH, top: padV, width: plotW, height: plotH }]} />
      {/* Chirp line */}
      {bars}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    overflow:        'hidden',
    position:        'relative',
  },
  glowTrack: {
    position:     'absolute',
    borderRadius: Radius.sm,
  },
});
