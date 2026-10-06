// Powered by OnSpace.AI
// SNR meter component

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '@/constants/theme';

interface Props {
  snr:   number;
  color: string;
  label: string;
  processingGain?: number;
}

export const SNRMeter = memo(({ snr, color, label, processingGain }: Props) => {
  // Map -20..+25 dB to 0..1
  const pct = Math.max(0, Math.min(1, (snr + 20) / 45));
  const bars = 20;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SNR</Text>
        <Text style={[styles.value, { color }]}>{snr.toFixed(1)} dB</Text>
        <Text style={[styles.badge, { borderColor: color, color }]}>{label}</Text>
      </View>
      <View style={styles.barRow}>
        {Array.from({ length: bars }, (_, i) => {
          const filled = i / bars < pct;
          return (
            <View
              key={i}
              style={[
                styles.bar,
                { backgroundColor: filled ? color : Colors.surfaceBorder, opacity: filled ? 0.9 : 0.4 },
              ]}
            />
          );
        })}
      </View>
      {processingGain !== undefined && (
        <Text style={styles.gpLabel}>
          Processing Gain: +{processingGain.toFixed(1)} dB  →  Effective: {(snr + processingGain).toFixed(1)} dB
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.sm,
    marginBottom:   Spacing.xs,
  },
  title: {
    fontSize:   Typography.sizeSm,
    color:      Colors.textSecondary,
    fontFamily: 'SpaceMono',
  },
  value: {
    fontSize:   Typography.sizeMd,
    fontWeight: Typography.weightBold,
    fontFamily: 'SpaceMono',
  },
  badge: {
    fontSize:     Typography.sizeXs,
    borderWidth:  1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical:   2,
    fontFamily:  'SpaceMono',
  },
  barRow: {
    flexDirection: 'row',
    gap:           2,
    height:        12,
  },
  bar: {
    flex:         1,
    borderRadius: 2,
  },
  gpLabel: {
    marginTop:  Spacing.xs,
    fontSize:   Typography.sizeXs,
    color:      Colors.textMuted,
    fontFamily: 'SpaceMono',
  },
});
