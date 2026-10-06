// Powered by OnSpace.AI

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface Props {
  title:    string;
  sub?:     string;
  color?:   string;
  right?:   React.ReactNode;
}

export const SectionHeader = memo(({ title, sub, color = Colors.primary, right }: Props) => (
  <View style={styles.row}>
    <View style={[styles.accent, { backgroundColor: color }]} />
    <View style={styles.text}>
      <Text style={[styles.title, { color }]}>{title}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
    {right}
  </View>
));

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    marginBottom:  Spacing.md,
  },
  accent: {
    width:        3,
    height:       20,
    borderRadius: 2,
  },
  text: { flex: 1 },
  title: {
    fontSize:   Typography.sizeMd,
    fontWeight: Typography.weightBold,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.5,
  },
  sub: {
    fontSize: Typography.sizeXs,
    color:    Colors.textMuted,
    marginTop: 2,
  },
});
