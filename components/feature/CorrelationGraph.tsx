// Powered by OnSpace.AI
// Cross-correlation output graph

import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '@/constants/theme';
import { CSS_CONFIG } from '@/constants/config';

interface Props {
  data:      number[];
  width:     number;
  height:    number;
  threshold?: number;
}

export const CorrelationGraph = memo(({ data, width, height, threshold = CSS_CONFIG.CORRELATION_THRESHOLD }: Props) => {
  if (!data.length || width < 2 || height < 2) return null;

  const padBottom = 20;
  const padH      = 8;
  const plotH     = height - padBottom - 8;
  const plotW     = width  - padH * 2;
  const barW      = plotW / data.length;
  const threshY   = 8 + (1 - threshold) * plotH;

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Threshold line */}
      <View style={{
        position:        'absolute',
        left:            padH,
        top:             threshY,
        width:           plotW,
        height:          1,
        backgroundColor: Colors.amber + 'BB',
      }} />
      <Text style={{
        position:  'absolute',
        top:       threshY - 14,
        left:      padH + 4,
        fontSize:  Typography.sizeXs,
        color:     Colors.amber,
        fontFamily: 'SpaceMono',
      }}>threshold {threshold}</Text>

      {/* Correlation bars */}
      {data.map((v, i) => {
        const bH    = Math.max(1, v * plotH);
        const above = v >= threshold;
        return (
          <View
            key={i}
            style={{
              position:        'absolute',
              left:            padH + i * barW,
              bottom:          padBottom,
              width:           Math.max(1, barW - 0.5),
              height:          bH,
              backgroundColor: above ? Colors.primary : Colors.cyan + '66',
              borderRadius:    1,
            }}
          />
        );
      })}

      {/* X axis labels */}
      <View style={[styles.axisRow, { left: padH, right: padH }]}>
        <Text style={styles.axisLabel}>-T/2</Text>
        <Text style={styles.axisLabel}>τ = 0</Text>
        <Text style={styles.axisLabel}>+T/2</Text>
      </View>
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
  axisRow: {
    position:       'absolute',
    bottom:         2,
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontSize:   Typography.sizeXs,
    color:      Colors.textMuted,
    fontFamily: 'SpaceMono',
  },
});
