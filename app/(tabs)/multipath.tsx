// Powered by OnSpace.AI
// Multi-path Interference Demo Screen

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Dimensions, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import {
  simulateMultiPath, delayToDistance, MultiPathParams,
} from '@/services/multipathService';
import { WaveformPlot, CorrelationPlot } from '@/components/feature/MultiPathPlot';
import { SliderControl } from '@/components/ui/SliderControl';

const { width } = Dimensions.get('window');
const PLOT_W = width - Spacing.md * 2;

const MAX_DELAY_MS = 20;   // ms
const MAX_ALPHA    = 1.0;

export default function MultiPathScreen() {
  // Slider state (0-1 normalized, mapped to physical range)
  const [delay1Norm,  setDelay1Norm]  = useState(0.25);   // ~5 ms
  const [delay2Norm,  setDelay2Norm]  = useState(0.55);   // ~11 ms
  const [alpha1Norm,  setAlpha1Norm]  = useState(0.60);   // 60%
  const [alpha2Norm,  setAlpha2Norm]  = useState(0.35);   // 35%
  const [chirpType,   setChirpType]   = useState<'up' | 'down'>('up');
  const [activeView,  setActiveView]  = useState<'signals' | 'correlation'>('signals');

  // Physical values
  const delay1Ms = delay1Norm * MAX_DELAY_MS;
  const delay2Ms = delay2Norm * MAX_DELAY_MS;
  const alpha1   = alpha1Norm * MAX_ALPHA;
  const alpha2   = alpha2Norm * MAX_ALPHA;

  const params: MultiPathParams = useMemo(() => ({
    delay1Ms, delay2Ms, alpha1, alpha2, chirpType,
  }), [delay1Ms, delay2Ms, alpha1, alpha2, chirpType]);

  const result = useMemo(() => simulateMultiPath(params), [params]);

  const peakQuality = result.peakRatio >= 8
    ? { label: 'EXCELLENT', color: Colors.primary }
    : result.peakRatio >= 4
    ? { label: 'GOOD', color: Colors.cyan }
    : result.peakRatio >= 2
    ? { label: 'FAIR', color: Colors.amber }
    : { label: 'POOR', color: Colors.red };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Multi-path Demo</Text>
            <Text style={styles.subtitle}>CSS noise immunity under reflections</Text>
          </View>
          <View style={[styles.qualityBadge, { borderColor: peakQuality.color, backgroundColor: peakQuality.color + '20' }]}>
            <Text style={[styles.qualityLabel, { color: peakQuality.color }]}>{peakQuality.label}</Text>
          </View>
        </View>

        {/* Chirp type toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REFERENCE CHIRP</Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleBtn, chirpType === 'up' && { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary }]}
              onPress={() => setChirpType('up')}
            >
              <MaterialIcons name="trending-up" size={16} color={chirpType === 'up' ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.toggleLabel, chirpType === 'up' && { color: Colors.primary }]}>UP-CHIRP (1)</Text>
              <Text style={[styles.toggleSub, chirpType === 'up' && { color: Colors.primary }]}>18→20 kHz</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, chirpType === 'down' && { backgroundColor: Colors.amberGlow, borderColor: Colors.amber }]}
              onPress={() => setChirpType('down')}
            >
              <MaterialIcons name="trending-down" size={16} color={chirpType === 'down' ? Colors.amber : Colors.textMuted} />
              <Text style={[styles.toggleLabel, chirpType === 'down' && { color: Colors.amber }]}>DOWN-CHIRP (0)</Text>
              <Text style={[styles.toggleSub, chirpType === 'down' && { color: Colors.amber }]}>20→18 kHz</Text>
            </Pressable>
          </View>
        </View>

        {/* Sliders */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ECHO PATH CONTROLS</Text>
          <View style={styles.card}>
            {/* Echo 1 */}
            <View style={styles.echoGroup}>
              <View style={styles.echoTitleRow}>
                <View style={[styles.echoDot, { backgroundColor: Colors.amber }]} />
                <Text style={[styles.echoTitle, { color: Colors.amber }]}>Echo Path 1</Text>
                <Text style={styles.echoDistance}>{delayToDistance(delay1Ms)} away</Text>
              </View>
              <SliderControl
                label="Delay τ₁"
                value={delay1Norm}
                onChange={setDelay1Norm}
                color={Colors.amber}
                leftLabel="0 ms"
                rightLabel="20 ms"
                displayValue={`${delay1Ms.toFixed(1)} ms`}
              />
              <SliderControl
                label="Amplitude α₁"
                value={alpha1Norm}
                onChange={setAlpha1Norm}
                color={Colors.amber}
                leftLabel="0%"
                rightLabel="100%"
                displayValue={`${(alpha1 * 100).toFixed(0)}%`}
              />
            </View>

            <View style={styles.echoDivider} />

            {/* Echo 2 */}
            <View style={styles.echoGroup}>
              <View style={styles.echoTitleRow}>
                <View style={[styles.echoDot, { backgroundColor: Colors.cyan }]} />
                <Text style={[styles.echoTitle, { color: Colors.cyan }]}>Echo Path 2</Text>
                <Text style={styles.echoDistance}>{delayToDistance(delay2Ms)} away</Text>
              </View>
              <SliderControl
                label="Delay τ₂"
                value={delay2Norm}
                onChange={setDelay2Norm}
                color={Colors.cyan}
                leftLabel="0 ms"
                rightLabel="20 ms"
                displayValue={`${delay2Ms.toFixed(1)} ms`}
              />
              <SliderControl
                label="Amplitude α₂"
                value={alpha2Norm}
                onChange={setAlpha2Norm}
                color={Colors.cyan}
                leftLabel="0%"
                rightLabel="100%"
                displayValue={`${(alpha2 * 100).toFixed(0)}%`}
              />
            </View>
          </View>
        </View>

        {/* View mode toggle */}
        <View style={styles.section}>
          <View style={styles.viewToggle}>
            <Pressable
              style={[styles.viewBtn, activeView === 'signals' && styles.viewBtnActive]}
              onPress={() => setActiveView('signals')}
            >
              <Text style={[styles.viewBtnLabel, activeView === 'signals' && styles.viewBtnLabelActive]}>
                Time-Domain
              </Text>
            </Pressable>
            <Pressable
              style={[styles.viewBtn, activeView === 'correlation' && styles.viewBtnActive]}
              onPress={() => setActiveView('correlation')}
            >
              <Text style={[styles.viewBtnLabel, activeView === 'correlation' && styles.viewBtnLabelActive]}>
                Correlation
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Time-domain signals ── */}
        {activeView === 'signals' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SIGNAL COMPONENTS</Text>

            <WaveformPlot
              data={result.direct}
              color={Colors.primary}
              label="DIRECT PATH"
              width={PLOT_W}
              height={72}
            />

            <WaveformPlot
              data={result.echoes}
              color={Colors.amber}
              label={`ECHOES  (α₁=${(alpha1).toFixed(2)} · α₂=${(alpha2).toFixed(2)})`}
              width={PLOT_W}
              height={72}
            />

            <WaveformPlot
              data={result.combined}
              color={Colors.cyan}
              label="COMBINED RECEIVED SIGNAL"
              width={PLOT_W}
              height={88}
            />

            <View style={styles.formulaBox}>
              <Text style={styles.formula}>r(t) = s(t) + α₁·s(t−τ₁) + α₂·s(t−τ₂)</Text>
            </View>

            {/* Annotation */}
            <View style={styles.annotationRow}>
              <MaterialIcons name="info-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.annotationText}>
                Despite {alpha1 > 0.3 || alpha2 > 0.3 ? 'strong' : 'weak'} echoes distorting the waveform,
                the CSS matched filter (see Correlation tab) recovers the symbol cleanly.
              </Text>
            </View>
          </View>
        )}

        {/* ── Correlation view ── */}
        {activeView === 'correlation' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CROSS-CORRELATION OUTPUT  R(τ)</Text>

            <CorrelationPlot
              data={result.corrNaive}
              color={Colors.red}
              label="RAW ENERGY  (no CSS)"
              width={PLOT_W}
              height={90}
              threshold={0.65}
            />
            <Text style={styles.graphCaption}>
              Non-matched receiver: energy smears across many lags — echoes are indistinguishable.
            </Text>

            <View style={{ height: Spacing.sm }} />

            <CorrelationPlot
              data={result.corrCSS}
              color={Colors.primary}
              label="CSS MATCHED FILTER"
              width={PLOT_W}
              height={110}
              threshold={0.65}
            />
            <Text style={styles.graphCaption}>
              CSS correlator: sharp dominant peak at lag=0. Echoes remain below threshold.
            </Text>

            {/* Peak quality metrics */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>Peak / 2nd-peak</Text>
                <Text style={[styles.metricValue, { color: peakQuality.color }]}>
                  {result.peakRatio.toFixed(1)}×
                </Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>CSS Quality</Text>
                <Text style={[styles.metricValue, { color: peakQuality.color }]}>
                  {peakQuality.label}
                </Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>Proc. Gain</Text>
                <Text style={[styles.metricValue, { color: Colors.primary }]}>+21 dB</Text>
              </View>
            </View>
          </View>
        )}

        {/* Theory recap */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHY CSS WINS</Text>
          {[
            { icon: 'wifi',          color: Colors.primary, text: 'Chirp energy spreads across the full 2 kHz band — echoes do not concentrate at any single frequency' },
            { icon: 'compare-arrows',color: Colors.cyan,    text: 'Matched filter R(τ) = ∫r(t)·s*(t−τ)dt de-spreads only the direct chirp; echoes arrive at wrong phase → near-zero correlation' },
            { icon: 'trending-up',   color: Colors.amber,   text: 'Processing gain G_p = +21 dB amplifies peak-to-echo ratio: even 80% echoes stay below detection threshold' },
            { icon: 'device-hub',    color: Colors.red,     text: 'Same principle powers LoRa in urban RF environments where reflections from buildings cause 5–15 ms echoes' },
          ].map((item, i) => (
            <View key={i} style={styles.theoryRow}>
              <View style={[styles.theoryIcon, { backgroundColor: item.color + '20' }]}>
                <MaterialIcons name={item.icon as any} size={16} color={item.color} />
              </View>
              <Text style={styles.theoryText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Path model diagram */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROPAGATION MODEL</Text>
          <View style={styles.pathDiagram}>
            <PathNode label="TX" color={Colors.primary} icon="wifi-tethering" />
            <View style={styles.pathLines}>
              <PathArrow label="Direct  τ=0, α=1.0" color={Colors.primary} />
              <PathArrow label={`Echo 1   τ=${delay1Ms.toFixed(1)}ms, α=${alpha1.toFixed(2)}`} color={Colors.amber} />
              <PathArrow label={`Echo 2   τ=${delay2Ms.toFixed(1)}ms, α=${alpha2.toFixed(2)}`} color={Colors.cyan} />
            </View>
            <PathNode label="RX" color={Colors.cyan} icon="sensors" />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function PathNode({ label, color, icon }: { label: string; color: string; icon: string }) {
  return (
    <View style={styles.pathNode}>
      <View style={[styles.pathNodeCircle, { borderColor: color, backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.pathNodeLabel, { color }]}>{label}</Text>
    </View>
  );
}

function PathArrow({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.pathArrow}>
      <View style={[styles.pathArrowLine, { backgroundColor: color + '60' }]} />
      <Text style={[styles.pathArrowLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxxl, paddingTop: Spacing.md },

  header: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    marginBottom:   Spacing.xl,
    gap:            Spacing.sm,
  },
  title:    { fontSize: Typography.sizeXl, fontWeight: Typography.weightBold, color: Colors.textPrimary, fontFamily: 'SpaceMono' },
  subtitle: { fontSize: Typography.sizeSm, color: Colors.textSecondary, marginTop: 2 },
  qualityBadge: {
    borderWidth:     1.5,
    borderRadius:    Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   6,
    alignItems:      'center',
    minWidth:        72,
  },
  qualityLabel: { fontSize: Typography.sizeXs, fontWeight: Typography.weightBold, fontFamily: 'SpaceMono' },

  section:      { marginBottom: Spacing.lg },
  sectionLabel: {
    fontSize:      Typography.sizeXs,
    color:         Colors.textMuted,
    fontFamily:    'SpaceMono',
    letterSpacing: 1.5,
    marginBottom:  Spacing.sm,
    textTransform: 'uppercase',
  },

  toggleRow: { flexDirection: 'row', gap: Spacing.sm },
  toggleBtn: {
    flex:            1,
    backgroundColor: Colors.card,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    borderRadius:    Radius.md,
    padding:         Spacing.sm,
    alignItems:      'center',
    gap:             4,
  },
  toggleLabel: { fontSize: Typography.sizeSm, color: Colors.textMuted, fontFamily: 'SpaceMono', fontWeight: Typography.weightBold },
  toggleSub:   { fontSize: Typography.sizeXs, color: Colors.textMuted, fontFamily: 'SpaceMono' },

  card: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    padding:         Spacing.md,
  },
  echoGroup:    { marginBottom: Spacing.sm },
  echoDivider:  { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: Spacing.md },
  echoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  echoDot:      { width: 8, height: 8, borderRadius: 4 },
  echoTitle:    { fontSize: Typography.sizeSm, fontWeight: Typography.weightBold, fontFamily: 'SpaceMono', flex: 1 },
  echoDistance: { fontSize: Typography.sizeXs, color: Colors.textMuted, fontFamily: 'SpaceMono' },

  viewToggle: {
    flexDirection:   'row',
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    padding:         3,
    gap:             3,
  },
  viewBtn: {
    flex:           1,
    paddingVertical: 9,
    borderRadius:    Radius.md,
    alignItems:     'center',
  },
  viewBtnActive:      { backgroundColor: Colors.primary },
  viewBtnLabel:       { fontSize: Typography.sizeSm, color: Colors.textMuted, fontFamily: 'SpaceMono', fontWeight: Typography.weightSemibold },
  viewBtnLabelActive: { color: Colors.textOnPrimary },

  formulaBox: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    padding:         Spacing.sm,
    alignItems:      'center',
    marginTop:       Spacing.xs,
  },
  formula: { fontSize: Typography.sizeSm, color: Colors.primary, fontFamily: 'SpaceMono' },

  graphCaption: {
    fontSize:  Typography.sizeXs,
    color:     Colors.textMuted,
    fontFamily: 'SpaceMono',
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },

  annotationRow: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    padding:         Spacing.sm,
    marginTop:       Spacing.sm,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
  },
  annotationText: {
    flex:       1,
    fontSize:   Typography.sizeXs,
    color:      Colors.textSecondary,
    lineHeight: 18,
    fontFamily: 'SpaceMono',
  },

  metricsRow:  { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  metricCell: {
    flex:            1,
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    padding:         Spacing.sm,
    alignItems:      'center',
  },
  metricLabel: { fontSize: Typography.sizeXs, color: Colors.textMuted, fontFamily: 'SpaceMono', marginBottom: 3 },
  metricValue: { fontSize: Typography.sizeMd, fontWeight: Typography.weightBold, fontFamily: 'SpaceMono' },

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
  },
  theoryText: {
    flex:       1,
    fontSize:   Typography.sizeSm,
    color:      Colors.textSecondary,
    lineHeight: 20,
    paddingTop: 7,
    fontFamily: 'SpaceMono',
  },

  pathDiagram: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    padding:         Spacing.md,
    gap:             Spacing.sm,
  },
  pathNode:        { alignItems: 'center', gap: 4 },
  pathNodeCircle: {
    width:          44,
    height:         44,
    borderRadius:   22,
    borderWidth:    2,
    alignItems:     'center',
    justifyContent: 'center',
  },
  pathNodeLabel: { fontSize: Typography.sizeXs, fontWeight: Typography.weightBold, fontFamily: 'SpaceMono' },

  pathLines: { flex: 1, gap: 6 },
  pathArrow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  pathArrowLine: { flex: 1, height: 1.5, borderRadius: 1 },
  pathArrowLabel: { fontSize: Typography.sizeXs, fontFamily: 'SpaceMono', minWidth: 160 },
});
