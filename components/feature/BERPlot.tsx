// Powered by OnSpace.AI
// BER vs SNR Log-Scale Plot Component

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import {
  BERCurve, BER_SNR_RANGE, BER_LOG_MIN, BER_LOG_MAX,
  normalizeLogBer,
} from '@/services/berService';

// ─── Y-axis grid lines (log scale) ────────────────────────────────────────────
const Y_LABELS = [
  { log: 0,  label: '10⁰' },
  { log: -1, label: '10⁻¹' },
  { log: -2, label: '10⁻²' },
  { log: -3, label: '10⁻³' },
  { log: -4, label: '10⁻⁴' },
  { log: -6, label: '10⁻⁶' },
];

// ─── X-axis ticks ─────────────────────────────────────────────────────────────
const X_TICKS = [-20, -15, -10, -5, 0, 5, 10, 15, 20];

interface Props {
  curves:         BERCurve[];
  width:          number;
  height:         number;
  selectedSNR?:   number;  // vertical cursor position (dB)
  highlightCurve?: string; // curve id to emphasize
}

export const BERPlot = memo(({
  curves, width, height, selectedSNR, highlightCurve,
}: Props) => {
  const LEFT_PAD  = 48;
  const RIGHT_PAD = 12;
  const TOP_PAD   = 12;
  const BOT_PAD   = 28;

  const plotW = width  - LEFT_PAD - RIGHT_PAD;
  const plotH = height - TOP_PAD  - BOT_PAD;

  const { snrMin, snrMax } = { snrMin: BER_SNR_RANGE.min, snrMax: BER_SNR_RANGE.max };

  // ── Map helpers ──────────────────────────────────────────────────────────────
  const xPct = (snrDb: number): number =>
    (snrDb - snrMin) / (snrMax - snrMin);

  const yPct = (logBer: number): number =>
    (logBer - BER_LOG_MAX) / (BER_LOG_MIN - BER_LOG_MAX);

  // ── Pre-compute line segments ─────────────────────────────────────────────────
  type Seg = { x1: number; y1: number; x2: number; y2: number; angle: number; len: number };
  const lineSegments = useMemo(() => {
    const result: Record<string, Seg[]> = {};
    for (const curve of curves) {
      const segs: Seg[] = [];
      const pts = curve.points;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const x1 = LEFT_PAD + xPct(a.snrDb)  * plotW;
        const y1 = TOP_PAD  + yPct(a.logBer) * plotH;
        const x2 = LEFT_PAD + xPct(b.snrDb)  * plotW;
        const y2 = TOP_PAD  + yPct(b.logBer) * plotH;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        segs.push({ x1, y1, x2, y2, angle, len });
      }
      result[curve.id] = segs;
    }
    return result;
  }, [curves, plotW, plotH]);

  // ── Cursor X position ─────────────────────────────────────────────────────────
  const cursorX = selectedSNR != null
    ? LEFT_PAD + xPct(selectedSNR) * plotW
    : null;

  return (
    <View style={[styles.container, { width, height }]}>
      {/* ── Y-axis gridlines + labels ── */}
      {Y_LABELS.map(({ log, label }) => {
        const top = TOP_PAD + yPct(log) * plotH;
        return (
          <React.Fragment key={log}>
            {/* Grid line */}
            <View style={{
              position:        'absolute',
              left:            LEFT_PAD,
              top:             top - 0.5,
              width:           plotW,
              height:          1,
              backgroundColor: log === 0 ? Colors.surfaceBorder + 'CC' : Colors.surfaceBorder + '55',
            }} />
            {/* Label */}
            <Text style={[styles.axisLabel, {
              position: 'absolute',
              right:    width - LEFT_PAD + 4,
              top:      top - 8,
            }]}>{label}</Text>
          </React.Fragment>
        );
      })}

      {/* ── X-axis ticks + labels ── */}
      {X_TICKS.map(snr => {
        const left = LEFT_PAD + xPct(snr) * plotW;
        return (
          <React.Fragment key={snr}>
            <View style={{
              position:        'absolute',
              left:            left - 0.5,
              top:             TOP_PAD,
              width:           1,
              height:          plotH,
              backgroundColor: snr === 0 ? Colors.surfaceBorder + 'CC' : Colors.surfaceBorder + '33',
            }} />
            <Text style={[styles.axisLabel, {
              position:  'absolute',
              bottom:    2,
              left:      left - 14,
              width:     28,
              textAlign: 'center',
            }]}>{snr}</Text>
          </React.Fragment>
        );
      })}

      {/* ── Axis border ── */}
      <View style={{
        position:     'absolute',
        left:         LEFT_PAD,
        top:          TOP_PAD,
        width:        plotW,
        height:       plotH,
        borderWidth:  1,
        borderColor:  Colors.surfaceBorder,
        borderRadius: 2,
      }} />

      {/* ── Curve lines (rendered as many short segments) ── */}
      {curves.map(curve => {
        const isHighlighted = !highlightCurve || curve.id === highlightCurve;
        const segments = lineSegments[curve.id] ?? [];
        return segments.map((seg, i) => {
          const mx = (seg.x1 + seg.x2) / 2;
          const my = (seg.y1 + seg.y2) / 2;
          return (
            <View
              key={`${curve.id}-${i}`}
              style={{
                position:        'absolute',
                left:            mx - seg.len / 2,
                top:             my - 1.5,
                width:           seg.len,
                height:          3,
                backgroundColor: curve.color,
                opacity:         isHighlighted ? 0.95 : 0.25,
                transform:       [{ rotate: `${seg.angle}deg` }],
                borderRadius:    1.5,
              }}
            />
          );
        });
      })}

      {/* ── Selected SNR cursor ── */}
      {cursorX != null && (
        <View style={{
          position:        'absolute',
          left:            cursorX - 1,
          top:             TOP_PAD,
          width:           2,
          height:          plotH,
          backgroundColor: Colors.cyan + 'AA',
          borderRadius:    1,
        }} />
      )}

      {/* ── Axis titles ── */}
      <Text style={[styles.axisTitle, { position: 'absolute', bottom: 0, left: LEFT_PAD, right: 0, textAlign: 'center' }]}>
        SNR (dB)
      </Text>
      <Text style={[styles.axisTitleRotated, {
        position:  'absolute',
        left:      0,
        top:       TOP_PAD + plotH / 2 - 20,
        width:     40,
        textAlign: 'center',
      }]}>
        BER
      </Text>
    </View>
  );
});

// ─── Grouped bar chart for selected SNR ──────────────────────────────────────
interface BarChartProps {
  curves:     BERCurve[];
  snrDb:      number;
  width:      number;
  height:     number;
}

export const BERBarChart = memo(({ curves, snrDb, width, height }: BarChartProps) => {
  const BAR_GAP  = 8;
  const LEFT_PAD = 52;
  const RIGHT_PAD = 8;
  const TOP_PAD   = 8;
  const BOT_PAD   = 24;
  const plotW = width - LEFT_PAD - RIGHT_PAD;
  const plotH = height - TOP_PAD - BOT_PAD;

  const barW = (plotW - BAR_GAP * (curves.length + 1)) / curves.length;

  const yLabels = [
    { log: 0,  label: '10⁰' },
    { log: -2, label: '10⁻²' },
    { log: -4, label: '10⁻⁴' },
    { log: -6, label: '10⁻⁶' },
  ];

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Grid lines */}
      {yLabels.map(({ log, label }) => {
        const t = (log - BER_LOG_MAX) / (BER_LOG_MIN - BER_LOG_MAX);
        const top = TOP_PAD + t * plotH;
        return (
          <React.Fragment key={log}>
            <View style={{
              position:        'absolute',
              left:            LEFT_PAD,
              top:             top - 0.5,
              width:           plotW,
              height:          1,
              backgroundColor: Colors.surfaceBorder + '77',
            }} />
            <Text style={[styles.axisLabel, { position: 'absolute', right: width - LEFT_PAD + 4, top: top - 7 }]}>
              {label}
            </Text>
          </React.Fragment>
        );
      })}

      {/* Bars */}
      {curves.map((curve, ci) => {
        const pt = curve.points.reduce((best, p) =>
          Math.abs(p.snrDb - snrDb) < Math.abs(best.snrDb - snrDb) ? p : best
        );
        const norm = normalizeLogBer(pt.logBer);
        const barH = norm * plotH;
        const x = LEFT_PAD + BAR_GAP + ci * (barW + BAR_GAP);
        const y = TOP_PAD + plotH - barH;

        const berText = pt.ber < 1e-5
          ? `${(pt.ber * 1e6).toFixed(1)}×10⁻⁶`
          : pt.ber < 1e-3
          ? `${(pt.ber * 1e4).toFixed(1)}×10⁻⁴`
          : pt.ber < 0.01
          ? `${(pt.ber * 100).toFixed(2)}%`
          : `${(pt.ber * 100).toFixed(1)}%`;

        return (
          <React.Fragment key={curve.id}>
            {/* Bar glow */}
            <View style={{
              position:        'absolute',
              left:            x,
              top:             y,
              width:           barW,
              height:          barH,
              backgroundColor: curve.color + '25',
              borderRadius:    Radius.sm,
            }} />
            {/* Bar fill */}
            <View style={{
              position:        'absolute',
              left:            x + 2,
              top:             y,
              width:           barW - 4,
              height:          barH,
              backgroundColor: curve.color,
              opacity:         0.85,
              borderRadius:    Radius.sm,
            }} />
            {/* BER value label above bar */}
            <Text style={[styles.barValueLabel, {
              position:  'absolute',
              left:      x - 4,
              width:     barW + 8,
              top:       Math.max(TOP_PAD, y - 18),
              color:     curve.color,
              textAlign: 'center',
            }]}>{berText}</Text>
          </React.Fragment>
        );
      })}

      {/* X labels */}
      {curves.map((curve, ci) => {
        const x = LEFT_PAD + BAR_GAP + ci * (barW + BAR_GAP);
        return (
          <Text key={curve.id} style={[styles.axisLabel, {
            position:  'absolute',
            left:      x - 4,
            width:     barW + 8,
            bottom:    4,
            textAlign: 'center',
            color:     curve.color,
          }]}>{curve.sf != null ? `SF${curve.sf}` : 'BPSK'}</Text>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { position: 'relative', backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: 'hidden' },
  axisLabel: { fontSize: 9, color: Colors.textMuted, fontFamily: 'SpaceMono' },
  axisTitle: { fontSize: Typography.sizeXs, color: Colors.textMuted, fontFamily: 'SpaceMono' },
  axisTitleRotated: { fontSize: 9, color: Colors.textMuted, fontFamily: 'SpaceMono', transform: [{ rotate: '-90deg' }] },
  barValueLabel: { fontSize: 8, fontFamily: 'SpaceMono', fontWeight: '700' },
});
