// Powered by OnSpace.AI
// Stat card component

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '@/constants/theme';

interface Props {
  label:   string;
  value:   string;
  unit?:   string;
  color?:  string;
  sub?:    string;
}

export const StatCard = memo(({ label, value, unit, color = Colors.primary, sub }: Props) => (
  <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueRow}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
    </View>
    {sub ? <Text style={styles.sub}>{sub}</Text> : null}
  </View>
));

const styles = StyleSheet.create({
  card: {
    flex:            1,
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
  },
  label: {
    fontSize:   Typography.sizeXs,
    color:      Colors.textMuted,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           4,
  },
  value: {
    fontSize:   Typography.sizeXl,
    fontWeight: Typography.weightBold,
    fontFamily: 'SpaceMono',
  },
  unit: {
    fontSize: Typography.sizeSm,
    color:    Colors.textSecondary,
    fontFamily: 'SpaceMono',
  },
  sub: {
    fontSize:  Typography.sizeXs,
    color:     Colors.textMuted,
    marginTop: 2,
  },
});
