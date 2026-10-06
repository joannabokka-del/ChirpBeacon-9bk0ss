// Powered by OnSpace.AI
// Custom slider component using PanResponder

import React, { useRef, memo } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface Props {
  label:         string;
  value:         number;      // 0–1 normalized
  onChange:      (v: number) => void;
  color?:        string;
  leftLabel?:    string;
  rightLabel?:   string;
  displayValue?: string;
}

export const SliderControl = memo(({
  label, value, onChange, color = Colors.primary,
  leftLabel, rightLabel, displayValue,
}: Props) => {
  const trackWidthRef = useRef(0);
  const clampedValue  = Math.max(0, Math.min(1, value));

  const panR = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderMove: (_e, gs) => {
        const tw = trackWidthRef.current;
        if (tw <= 0) return;
        const pct = Math.max(0, Math.min(1, gs.moveX / tw));
        onChange(pct);
      },
    }),
  ).current;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.valueText, { color }]}>
          {displayValue ?? `${(clampedValue * 100).toFixed(0)}%`}
        </Text>
      </View>
      <View
        style={styles.track}
        onLayout={e => { trackWidthRef.current = e.nativeEvent.layout.width; }}
        {...panR.panHandlers}
      >
        <View style={[styles.fill, { width: `${clampedValue * 100}%`, backgroundColor: color }]} />
        <View
          style={[
            styles.thumb,
            { left: `${clampedValue * 100}%`, backgroundColor: color, shadowColor: color },
          ]}
        />
      </View>
      {(leftLabel || rightLabel) ? (
        <View style={styles.axisRow}>
          <Text style={styles.axisLabel}>{leftLabel ?? ''}</Text>
          <Text style={styles.axisLabel}>{rightLabel ?? ''}</Text>
        </View>
      ) : null}
    </View>
  );
});

const THUMB = 18;

const styles = StyleSheet.create({
  wrapper:   { marginBottom: Spacing.md },
  row: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   Spacing.xs,
  },
  label:     { fontSize: Typography.sizeSm, color: Colors.textSecondary, fontFamily: 'SpaceMono' },
  valueText: { fontSize: Typography.sizeSm, fontWeight: Typography.weightBold, fontFamily: 'SpaceMono' },
  track: {
    height:           6,
    backgroundColor:  Colors.surfaceBorder,
    borderRadius:     Radius.full,
    marginHorizontal: THUMB / 2,
    justifyContent:   'center',
  },
  fill: {
    position:     'absolute',
    left:         0,
    height:       6,
    borderRadius: Radius.full,
  },
  thumb: {
    position:      'absolute',
    width:         THUMB,
    height:        THUMB,
    borderRadius:  THUMB / 2,
    top:           -(THUMB / 2 - 3),
    marginLeft:    -(THUMB / 2),
    shadowOpacity: 0.7,
    shadowRadius:  6,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     4,
  },
  axisRow:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  axisLabel: { fontSize: Typography.sizeXs, color: Colors.textMuted, fontFamily: 'SpaceMono' },
});
