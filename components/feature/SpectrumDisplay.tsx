// Powered by OnSpace.AI
// Real-time spectrum analyzer display

import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '@/constants/theme';
import { SpectrumBin } from '@/services/decoderService';
import { CSS_CONFIG } from '@/constants/config';

interface Props {
  bins:   SpectrumBin[];
  width:  number;
  height: number;
  label?: string;
}

export const SpectrumDisplay = memo(({ bins, width, height, label }: Props) => {
  if (!bins.length || width < 2 || height < 2) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noData}>Waiting for signal...</Text>
      </View>
    );
  }

  const padBottom = 20;
  const plotH     = height - padBottom;
  const barW      = Math.max(1, width / bins.length);
  const inBandL   = bins.findIndex(b => b.freq >= CSS_CONFIG.F_LOW);
  const inBandR   = bins.findIndex(b => b.freq >  CSS_CONFIG.F_HIGH);

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Band highlight */}
      {inBandL >= 0 && inBandR > inBandL && (
        <View style={{
          position:        'absolute',
          left:            inBandL * barW,
          top:             0,
          width:           (inBandR - inBandL) * barW,
          height:          plotH,
          backgroundColor: Colors.primaryMuted,
          borderTopWidth:  1,
          borderColor:     Colors.primary + '30',
        }} />
      )}
      {/* Bars */}
      {bins.map((bin, i) => {
        const bH     = Math.max(1, bin.power * plotH);
        const inBand = bin.freq >= CSS_CONFIG.F_LOW && bin.freq <= CSS_CONFIG.F_HIGH;
        const color  = inBand
          ? bin.power > 0.5 ? Colors.primary : Colors.primaryDim
          : Colors.textMuted;
        return (
          <View
            key={i}
            style={{
              position:        'absolute',
              left:            i * barW,
              bottom:          padBottom,
              width:           Math.max(1, barW - 0.5),
              height:          bH,
              backgroundColor: color,
              opacity:         0.85,
            }}
          />
        );
      })}
      {/* Axis labels */}
      <View style={styles.axisRow}>
        <Text style={styles.axisLabel}>15 kHz</Text>
        <Text style={[styles.axisLabel, { color: Colors.primary }]}>18–20 kHz</Text>
        <Text style={styles.axisLabel}>22 kHz</Text>
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
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
    left:           Spacing.sm,
    right:          Spacing.sm,
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontSize:  Typography.sizeXs,
    color:     Colors.textMuted,
    fontFamily: 'SpaceMono',
  },
  label: {
    position:   'absolute',
    top:        Spacing.xs,
    right:      Spacing.sm,
    fontSize:   Typography.sizeXs,
    color:      Colors.textSecondary,
  },
  noData: {
    flex:       1,
    textAlign:  'center',
    textAlignVertical: 'center',
    color:      Colors.textMuted,
    fontSize:   Typography.sizeSm,
    marginTop:  40,
  },
});
