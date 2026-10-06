// Powered by OnSpace.AI
// BER vs SNR Screen — CSS vs BPSK Performance

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Dimensions, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import {
  computeBERCurves, getBERAtSNR, findSNRAtBER,
  CSS_SPREADING_FACTORS, BPSK_COLOR,
  BER_SNR_RANGE,
} from '@/services/berService';
import { BERPlot, BERBarChart } from '@/components/feature/BERPlot';

const { width } = Dimensions.get('window');
const PLOT_W   = width - Spacing.md * 2;
const BAR_W    = width - Spacing.md * 2;

export default function BERScreen() {
  const curves = useMemo(() => computeBERCurves(), []);

  const [selectedSNR,    setSelectedSNR]    = useState(0);    // dB
  const [highlightCurve, setHighlightCurve] = useState<string | null>(null);
  const [activeView,     setActiveView]     = useState<'curves' | 'bars'>('curves');

  // ── Interactive SNR slider via PanResponder on the plot ────────────────────
  const trackRef = React.useRef(0);

  const snrPanR = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (_e, gs) => {
        const tw = trackRef.current;
        if (tw <= 0) return;
        const raw = (gs.x0 - 48) / tw;
        const pct = Math.max(0, Math.min(1, raw));
        const snr = BER_SNR_RANGE.min + pct * (BER_SNR_RANGE.max - BER_SNR_RANGE.min);
        setSelectedSNR(Math.round(snr));
      },
      onPanResponderMove: (_e, gs) => {
        const tw = trackRef.current;
        if (tw <= 0) return;
        const raw = gs.moveX / tw;
        const pct = Math.max(0, Math.min(1, raw));
        const snr = BER_SNR_RANGE.min + pct * (BER_SNR_RANGE.max - BER_SNR_RANGE.min);
        setSelectedSNR(Math.round(snr));
      },
    })
  ).current;

  const berAtSNR = useMemo(() => getBERAtSNR(curves, selectedSNR), [curves, selectedSNR]);

  // ── Gain vs BPSK at BER=1e-3 ──────────────────────────────────────────────
  const bpskCurve = curves.find(c => c.id === 'bpsk')!;

  // ── Format BER nicely ─────────────────────────────────────────────────────
  const fmtBer = (ber: number): string => {
    if (ber >= 0.5) return '0.500';
    if (ber <= 1e-6) return '<10⁻⁶';
    const exp = Math.floor(Math.log10(ber));
    const man = ber / Math.pow(10, exp);
    return `${man.toFixed(1)}×10^${exp}`;
  };

  const fmtBerShort = (ber: number): string => {
    if (ber <= 1e-6) return '< 10⁻⁶';
    if (ber <= 1e-4) return `~10⁻${Math.abs(Math.round(Math.log10(ber)))}`;
    if (ber <= 0.01) return `${(ber * 100).toFixed(2)}%`;
    return `${(ber * 100).toFixed(0)}%`;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>BER vs SNR</Text>
            <Text style={styles.subtitle}>CSS spreading gain vs uncoded BPSK</Text>
          </View>
          <View style={styles.headerBadge}>
            <MaterialIcons name="show-chart" size={14} color={Colors.cyan} />
            <Text style={styles.headerBadgeText}>Log Scale</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <LegendItem color={BPSK_COLOR}       label="BPSK"    sub="No spreading" />
          {CSS_SPREADING_FACTORS.map(sf => (
            <LegendItem
              key={sf.sf}
              color={sf.color}
              label={`SF=${sf.sf}`}
              sub={`+${sf.gainDb} dB`}
              onPress={() => setHighlightCurve(prev => prev === `css-sf${sf.sf}` ? null : `css-sf${sf.sf}`)}
              active={highlightCurve === `css-sf${sf.sf}`}
            />
          ))}
        </View>

        {/* View toggle */}
        <View style={styles.viewToggle}>
          <Pressable
            style={[styles.viewBtn, activeView === 'curves' && styles.viewBtnActive]}
            onPress={() => setActiveView('curves')}
          >
            <MaterialIcons name="show-chart" size={15} color={activeView === 'curves' ? Colors.textOnPrimary : Colors.textMuted} />
            <Text style={[styles.viewBtnLabel, activeView === 'curves' && styles.viewBtnLabelActive]}>
              BER Curves
            </Text>
          </Pressable>
          <Pressable
            style={[styles.viewBtn, activeView === 'bars' && styles.viewBtnActive]}
            onPress={() => setActiveView('bars')}
          >
            <MaterialIcons name="bar-chart" size={15} color={activeView === 'bars' ? Colors.textOnPrimary : Colors.textMuted} />
            <Text style={[styles.viewBtnLabel, activeView === 'bars' && styles.viewBtnLabelActive]}>
              At SNR = {selectedSNR} dB
            </Text>
          </Pressable>
        </View>

        {/* ── BER Curve Plot ── */}
        {activeView === 'curves' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              BER vs Eb/N₀ — tap/drag to inspect  (cursor: {selectedSNR} dB)
            </Text>
            <View
              {...snrPanR.panHandlers}
              onLayout={e => { trackRef.current = e.nativeEvent.layout.width; }}
            >
              <BERPlot
                curves={curves}
                width={PLOT_W}
                height={260}
                selectedSNR={selectedSNR}
                highlightCurve={highlightCurve ?? undefined}
              />
            </View>

            {/* SNR picker slider */}
            <View style={styles.sliderWrapper}>
              <Text style={styles.sliderLabel}>{BER_SNR_RANGE.min} dB</Text>
              <View
                style={styles.sliderTrack}
                onLayout={e => { trackRef.current = e.nativeEvent.layout.width; }}
                {...snrPanR.panHandlers}
              >
                <View style={[styles.sliderFill, {
                  width: `${((selectedSNR - BER_SNR_RANGE.min) / (BER_SNR_RANGE.max - BER_SNR_RANGE.min)) * 100}%`,
                }]} />
                <View style={[styles.sliderThumb, {
                  left: `${((selectedSNR - BER_SNR_RANGE.min) / (BER_SNR_RANGE.max - BER_SNR_RANGE.min)) * 100}%`,
                }]} />
              </View>
              <Text style={styles.sliderLabel}>{BER_SNR_RANGE.max} dB</Text>
            </View>
            <Text style={styles.sliderCenterLabel}>SNR = {selectedSNR} dB</Text>

            {/* BER readout table */}
            <View style={styles.berReadout}>
              {curves.map(curve => (
                <View key={curve.id} style={styles.berReadoutRow}>
                  <View style={[styles.berReadoutDot, { backgroundColor: curve.color }]} />
                  <Text style={[styles.berReadoutLabel, { color: curve.color }]}>{curve.label}</Text>
                  <Text style={[styles.berReadoutValue, { color: curve.color }]}>
                    BER = {fmtBer(berAtSNR[curve.id] ?? 0.5)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Bar chart at selected SNR ── */}
        {activeView === 'bars' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BER AT SNR = {selectedSNR} dB</Text>

            <BERBarChart
              curves={curves}
              snrDb={selectedSNR}
              width={BAR_W}
              height={200}
            />

            {/* SNR slider */}
            <View style={styles.sliderWrapper}>
              <Text style={styles.sliderLabel}>{BER_SNR_RANGE.min}</Text>
              <View
                style={styles.sliderTrack}
                onLayout={e => { trackRef.current = e.nativeEvent.layout.width; }}
                {...snrPanR.panHandlers}
              >
                <View style={[styles.sliderFill, {
                  width: `${((selectedSNR - BER_SNR_RANGE.min) / (BER_SNR_RANGE.max - BER_SNR_RANGE.min)) * 100}%`,
                }]} />
                <View style={[styles.sliderThumb, {
                  left: `${((selectedSNR - BER_SNR_RANGE.min) / (BER_SNR_RANGE.max - BER_SNR_RANGE.min)) * 100}%`,
                }]} />
              </View>
              <Text style={styles.sliderLabel}>{BER_SNR_RANGE.max}</Text>
            </View>
            <Text style={styles.sliderCenterLabel}>Drag to change SNR (dB)</Text>

            {/* Comparison cards */}
            <View style={styles.compRow}>
              {curves.map(curve => {
                const ber = berAtSNR[curve.id] ?? 0.5;
                const bpskBer = berAtSNR['bpsk'] ?? 0.5;
                const improvement = ber > 0 && bpskBer > 0 && curve.id !== 'bpsk'
                  ? Math.log10(bpskBer) - Math.log10(ber)
                  : 0;
                return (
                  <View key={curve.id} style={[styles.compCard, { borderColor: curve.color + '55' }]}>
                    <Text style={[styles.compTitle, { color: curve.color }]}>{curve.label}</Text>
                    <Text style={[styles.compBER, { color: curve.color }]}>{fmtBerShort(ber)}</Text>
                    {curve.id !== 'bpsk' && (
                      <Text style={styles.compGain}>
                        {improvement > 0.5 ? `${improvement.toFixed(1)} decade improvement` : 'similar to BPSK'}
                      </Text>
                    )}
                    {curve.id === 'bpsk' && <Text style={styles.compGain}>Baseline</Text>}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Processing Gain Comparison ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROCESSING GAIN BY SPREADING FACTOR</Text>
          <View style={styles.gainTable}>
            {/* Header */}
            <View style={[styles.gainRow, styles.gainHeader]}>
              <Text style={[styles.gainCell, { flex: 1.2, color: Colors.textMuted }]}>Mode</Text>
              <Text style={[styles.gainCell, { color: Colors.textMuted }]}>SF</Text>
              <Text style={[styles.gainCell, { color: Colors.textMuted }]}>Gain</Text>
              <Text style={[styles.gainCell, { flex: 1.5, color: Colors.textMuted }]}>SNR for 1% BER</Text>
            </View>
            {/* BPSK row */}
            {(() => {
              const snr = findSNRAtBER(bpskCurve, 0.01);
              return (
                <View style={[styles.gainRow, styles.gainRowAlt]}>
                  <Text style={[styles.gainCell, { flex: 1.2, color: BPSK_COLOR, fontWeight: '700' }]}>BPSK</Text>
                  <Text style={[styles.gainCell, { color: Colors.textMuted }]}>—</Text>
                  <Text style={[styles.gainCell, { color: BPSK_COLOR }]}>0 dB</Text>
                  <Text style={[styles.gainCell, { flex: 1.5, color: BPSK_COLOR }]}>
                    {snr != null ? `${snr.toFixed(1)} dB` : '>20 dB'}
                  </Text>
                </View>
              );
            })()}
            {/* CSS rows */}
            {CSS_SPREADING_FACTORS.map(({ sf, color, gainDb }, i) => {
              const curve = curves.find(c => c.id === `css-sf${sf}`)!;
              const snr1pct = findSNRAtBER(curve, 0.01);
              const bpskSNR = findSNRAtBER(bpskCurve, 0.01);
              const delta = snr1pct != null && bpskSNR != null ? bpskSNR - snr1pct : null;
              return (
                <View key={sf} style={[styles.gainRow, i % 2 === 0 && styles.gainRowAlt]}>
                  <Text style={[styles.gainCell, { flex: 1.2, color, fontWeight: '700' }]}>CSS</Text>
                  <Text style={[styles.gainCell, { color }]}>{sf}</Text>
                  <Text style={[styles.gainCell, { color }]}>+{gainDb} dB</Text>
                  <View style={[styles.gainCell, { flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                    <Text style={{ color, fontSize: Typography.sizeXs, fontFamily: 'SpaceMono' }}>
                      {snr1pct != null ? `${snr1pct.toFixed(1)} dB` : '<−20 dB'}
                    </Text>
                    {delta != null && delta > 0.5 && (
                      <Text style={{ color: Colors.primary, fontSize: 9, fontFamily: 'SpaceMono' }}>
                        (↓{delta.toFixed(1)})
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          <Text style={styles.gainNote}>
            ↓ denotes SNR reduction vs BPSK to reach same BER — higher = better noise immunity
          </Text>
        </View>

        {/* ── Theory Explainer ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHY CSS BEATS BPSK AT LOW SNR</Text>
          {[
            {
              icon:  'show-chart',
              color: Colors.primary,
              title: 'Spreading Gain',
              text:  'BER_CSS ≈ ½·erfc(√(2^SF · Eb/N₀)). Each extra SF bit multiplies Eb/N₀ by 2, shifting the curve left by ~3 dB.',
            },
            {
              icon:  'layers',
              color: Colors.cyan,
              title: 'Matched Filter Integration',
              text:  'The correlator integrates energy over 2^SF chips. Noise averages toward zero while signal accumulates coherently.',
            },
            {
              icon:  'scatter-plot',
              color: Colors.amber,
              title: 'Orthogonality',
              text:  'Up vs Down chirps are near-orthogonal: their cross-correlation ≈ 0. This eliminates inter-symbol interference cleanly.',
            },
            {
              icon:  'device-hub',
              color: Colors.red,
              title: 'Multi-path Robustness',
              text:  'Processing gain also suppresses echo energy from multi-path: each reflected chirp arrives de-phased and despreads to near-zero.',
            },
          ].map((item, i) => (
            <View key={i} style={styles.theoryRow}>
              <View style={[styles.theoryIcon, { backgroundColor: item.color + '20' }]}>
                <MaterialIcons name={item.icon as any} size={16} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.theoryTitle, { color: item.color }]}>{item.title}</Text>
                <Text style={styles.theoryText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Formula box */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>KEY FORMULA</Text>
          <View style={styles.formulaCard}>
            <Text style={styles.formulaLine}>BER_BPSK  = ½ · erfc(√(Eb/N₀))</Text>
            <View style={styles.formulaDivider} />
            <Text style={styles.formulaLine}>BER_CSS   = ½ · erfc(√(2^SF · Eb/N₀))</Text>
            <View style={styles.formulaDivider} />
            <Text style={[styles.formulaLine, { color: Colors.cyan }]}>
              Gain = 10·log₁₀(2^SF)  =  SF · 3.01 dB
            </Text>
          </View>
          <View style={styles.sfGainRow}>
            {CSS_SPREADING_FACTORS.map(({ sf, color, gainDb }) => (
              <View key={sf} style={[styles.sfGainChip, { borderColor: color + '55', backgroundColor: color + '10' }]}>
                <Text style={[styles.sfGainLabel, { color }]}>SF={sf}</Text>
                <Text style={[styles.sfGainValue, { color }]}>+{gainDb} dB</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Legend item ─────────────────────────────────────────────────────────────
function LegendItem({
  color, label, sub, onPress, active,
}: {
  color: string; label: string; sub: string;
  onPress?: () => void; active?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.legendItem,
        { borderColor: active ? color : Colors.surfaceBorder, backgroundColor: active ? color + '15' : Colors.card },
      ]}
      onPress={onPress}
    >
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <View>
        <Text style={[styles.legendLabel, { color }]}>{label}</Text>
        <Text style={styles.legendSub}>{sub}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxxl, paddingTop: Spacing.md },

  header: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    marginBottom:   Spacing.lg,
    gap:            Spacing.sm,
  },
  title:    { fontSize: Typography.sizeXl, fontWeight: Typography.weightBold, color: Colors.textPrimary, fontFamily: 'SpaceMono' },
  subtitle: { fontSize: Typography.sizeSm, color: Colors.textSecondary, marginTop: 2 },
  headerBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   Colors.cyanGlow,
    borderWidth:       1,
    borderColor:       Colors.cyan + '55',
    borderRadius:      Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   5,
  },
  headerBadgeText: { fontSize: Typography.sizeXs, color: Colors.cyan, fontFamily: 'SpaceMono', fontWeight: Typography.weightBold },

  legendRow: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            Spacing.xs,
    marginBottom:   Spacing.md,
  },
  legendItem: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    borderWidth:       1,
    borderRadius:      Radius.md,
    paddingHorizontal: 10,
    paddingVertical:   6,
  },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: Typography.sizeSm, fontFamily: 'SpaceMono', fontWeight: Typography.weightBold },
  legendSub:   { fontSize: 10, color: Colors.textMuted, fontFamily: 'SpaceMono' },

  viewToggle: {
    flexDirection:   'row',
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    padding:         3,
    gap:             3,
    marginBottom:    Spacing.lg,
  },
  viewBtn: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 9,
    borderRadius:    Radius.md,
    gap:             5,
  },
  viewBtnActive:      { backgroundColor: Colors.primary },
  viewBtnLabel:       { fontSize: Typography.sizeSm, color: Colors.textMuted, fontFamily: 'SpaceMono', fontWeight: Typography.weightSemibold },
  viewBtnLabelActive: { color: Colors.textOnPrimary },

  section:      { marginBottom: Spacing.xl },
  sectionLabel: {
    fontSize:      Typography.sizeXs,
    color:         Colors.textMuted,
    fontFamily:    'SpaceMono',
    letterSpacing: 1.2,
    marginBottom:  Spacing.sm,
    textTransform: 'uppercase',
  },

  sliderWrapper: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.sm,
    marginTop:       Spacing.sm,
    paddingHorizontal: 4,
  },
  sliderTrack: {
    flex:             1,
    height:           6,
    backgroundColor:  Colors.surfaceBorder,
    borderRadius:     Radius.full,
    justifyContent:   'center',
  },
  sliderFill: {
    position:     'absolute',
    left:         0,
    height:       6,
    backgroundColor: Colors.cyan,
    borderRadius:  Radius.full,
  },
  sliderThumb: {
    position:      'absolute',
    width:         18,
    height:        18,
    borderRadius:  9,
    backgroundColor: Colors.cyan,
    top:           -6,
    marginLeft:    -9,
    shadowColor:   Colors.cyan,
    shadowOpacity: 0.7,
    shadowRadius:  6,
    elevation:     4,
  },
  sliderLabel:      { fontSize: Typography.sizeXs, color: Colors.textMuted, fontFamily: 'SpaceMono', width: 30, textAlign: 'center' },
  sliderCenterLabel: { fontSize: Typography.sizeXs, color: Colors.cyan, fontFamily: 'SpaceMono', textAlign: 'center', marginTop: 6, marginBottom: Spacing.sm },

  berReadout: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    padding:         Spacing.sm,
    marginTop:       Spacing.sm,
    gap:             8,
  },
  berReadoutRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  berReadoutDot:   { width: 8, height: 8, borderRadius: 4 },
  berReadoutLabel: { fontSize: Typography.sizeSm, fontFamily: 'SpaceMono', fontWeight: Typography.weightBold, flex: 1 },
  berReadoutValue: { fontSize: Typography.sizeSm, fontFamily: 'SpaceMono' },

  compRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  compCard: {
    flex:            1,
    minWidth:        80,
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    borderWidth:     1.5,
    padding:         Spacing.sm,
    alignItems:      'center',
    gap:             3,
  },
  compTitle: { fontSize: 10, fontFamily: 'SpaceMono', fontWeight: Typography.weightBold },
  compBER:   { fontSize: Typography.sizeSm, fontFamily: 'SpaceMono', fontWeight: Typography.weightBold },
  compGain:  { fontSize: 9, color: Colors.textMuted, fontFamily: 'SpaceMono', textAlign: 'center' },

  gainTable: {
    borderRadius:  Radius.md,
    borderWidth:   1,
    borderColor:   Colors.surfaceBorder,
    overflow:      'hidden',
    marginBottom:  Spacing.xs,
  },
  gainRow:   { flexDirection: 'row', paddingHorizontal: Spacing.sm, paddingVertical: 10, alignItems: 'center' },
  gainHeader: { backgroundColor: Colors.surfaceAlt, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  gainRowAlt: { backgroundColor: Colors.surfaceAlt },
  gainCell:  { flex: 1, fontSize: Typography.sizeXs, fontFamily: 'SpaceMono', color: Colors.textSecondary },
  gainNote:  { fontSize: 10, color: Colors.textMuted, fontFamily: 'SpaceMono', marginTop: 4, lineHeight: 16 },

  theoryRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Spacing.sm,
    marginBottom:  Spacing.sm,
  },
  theoryIcon: {
    width:          34,
    height:         34,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      2,
  },
  theoryTitle: {
    fontSize:     Typography.sizeSm,
    fontWeight:   Typography.weightBold,
    fontFamily:   'SpaceMono',
    marginBottom: 3,
  },
  theoryText: {
    fontSize:   Typography.sizeSm,
    color:      Colors.textSecondary,
    lineHeight: 20,
    fontFamily: 'SpaceMono',
  },

  formulaCard: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    padding:         Spacing.md,
    gap:             Spacing.xs,
    marginBottom:    Spacing.sm,
    alignItems:      'center',
  },
  formulaLine:    { fontSize: Typography.sizeSm, color: Colors.primary, fontFamily: 'SpaceMono', textAlign: 'center' },
  formulaDivider: { width: '100%', height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: 2 },
  sfGainRow:      { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  sfGainChip: {
    borderWidth:       1.5,
    borderRadius:      Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.xs,
    alignItems:        'center',
    gap:               2,
  },
  sfGainLabel: { fontSize: Typography.sizeXs, fontFamily: 'SpaceMono', fontWeight: Typography.weightBold },
  sfGainValue: { fontSize: Typography.sizeMd, fontFamily: 'SpaceMono', fontWeight: Typography.weightBold },
});
