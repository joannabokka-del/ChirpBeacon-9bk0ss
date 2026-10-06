// Powered by OnSpace.AI
// Waveform plot for multi-path signal visualization

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { SignalPoint, CorrPoint } from '@/services/multipathService';

// ─── Time-domain waveform ─────────────────────────────────────────────────────
interface WaveformProps {
  data:    SignalPoint[];
  color:   string;
  label:   string;
  height:  number;
  width:   number;
}

export const WaveformPlot = memo(({ data, color, label, height, width }: WaveformProps) => {
  if (!data.length) return null;

  const mid  = height / 2;
  const amp  = (height - 8) / 2;
  const step = width / data.length;

  return (
    <View style={[styles.plotBox, { height, width }]}>
      {/* Center line */}
      <View style={[styles.centerLine, { top: mid }]} />
      {/* Signal bars */}
      {data.map((pt, i) => {
        const barH = Math.abs(pt.value) * amp;
        const top  = pt.value >= 0 ? mid - barH : mid;
        return (
          <View
            key={i}
            style={{
              position:        'absolute',
              left:            i * step,
              top,
              width:           Math.max(1, step - 0.5),
              height:          Math.max(1, barH),
              backgroundColor: color,
              opacity:         0.75 + 0.25 * Math.abs(pt.value),
              borderRadius:    1,
            }}
          />
        );
      })}
      {/* Label */}
      <View style={styles.labelBadge}>
        <View style={[styles.labelDot, { backgroundColor: color }]} />
        <Text style={[styles.plotLabel, { color }]}>{label}</Text>
      </View>
    </View>
  );
});

// ─── Correlation bar chart ────────────────────────────────────────────────────
interface CorrProps {
  data:         CorrPoint[];
  color:        string;
  label:        string;
  height:       number;
  width:        number;
  threshold?:   number;  // draw threshold line if provided
  showNaive?:   boolean;
}

export const CorrelationPlot = memo(({
  data, color, label, height, width, threshold,
}: CorrProps) => {
  if (!data.length) return null;

  const step    = width / data.length;
  const thLine  = threshold != null ? height - threshold * height : null;

  return (
    <View style={[styles.plotBox, { height, width }]}>
      {/* Threshold line */}
      {thLine != null && (
        <View style={[styles.threshLine, { top: thLine, borderColor: Colors.amber + '88' }]} />
      )}
      {/* Bars */}
      {data.map((pt, i) => {
        const barH = pt.value * (height - 4);
        return (
          <View
            key={i}
            style={{
              position:        'absolute',
              left:            i * step,
              bottom:          0,
              width:           Math.max(1, step - 0.5),
              height:          Math.max(1, barH),
              backgroundColor: pt.value > (threshold ?? 0.5) ? color : Colors.surfaceBorder,
              opacity:         0.6 + 0.4 * pt.value,
              borderRadius:    1,
            }}
          />
        );
      })}
      {/* Label */}
      <View style={styles.labelBadge}>
        <View style={[styles.labelDot, { backgroundColor: color }]} />
        <Text style={[styles.plotLabel, { color }]}>{label}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  plotBox: {
    position:        'relative',
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    overflow:        'hidden',
    marginBottom:    Spacing.sm,
  },
  centerLine: {
    position:        'absolute',
    left:            0,
    right:           0,
    height:          1,
    backgroundColor: Colors.surfaceBorder,
  },
  threshLine: {
    position:    'absolute',
    left:        0,
    right:       0,
    height:      1,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  labelBadge: {
    position:          'absolute',
    top:               4,
    right:             6,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   'rgba(5,10,8,0.7)',
    borderRadius:      Radius.sm,
    paddingHorizontal: 5,
    paddingVertical:   2,
  },
  labelDot:  { width: 6, height: 6, borderRadius: 3 },
  plotLabel: { fontSize: Typography.sizeXs, fontFamily: 'SpaceMono', fontWeight: '700' },
});
