// Powered by OnSpace.AI
// CSS Theory Dashboard

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { THEORY_CARDS, CSS_CONFIG } from '@/constants/config';
import { calculateProcessingGain } from '@/services/chirpService';

const { width } = Dimensions.get('window');

const PARAM_ROWS = [
  { key: 'F_LOW',            label: 'f₀ (lower)',      value: `${CSS_CONFIG.F_LOW / 1000} kHz`,     color: Colors.amber },
  { key: 'F_HIGH',           label: 'f₁ (upper)',      value: `${CSS_CONFIG.F_HIGH / 1000} kHz`,    color: Colors.primary },
  { key: 'BANDWIDTH',        label: 'Bandwidth B',     value: `${CSS_CONFIG.BANDWIDTH} Hz`,          color: Colors.cyan },
  { key: 'CHIRP_DURATION',   label: 'Symbol time T',   value: `${CSS_CONFIG.CHIRP_DURATION * 1000} ms`, color: Colors.primary },
  { key: 'PROCESSING_GAIN',  label: 'Processing Gain', value: `+${calculateProcessingGain().toFixed(1)} dB`, color: Colors.primary },
  { key: 'TIME_BW',          label: 'BT product',      value: `${CSS_CONFIG.TIME_BANDWIDTH_PRODUCT}`, color: Colors.cyan },
  { key: 'SF',               label: 'Spread Factor',   value: `SF=${CSS_CONFIG.SPREADING_FACTOR}`,  color: Colors.amber },
  { key: 'SNR_MIN',          label: 'Min SNR detect',  value: `${CSS_CONFIG.SNR_MIN_DB} dB`,        color: Colors.red },
];

export default function TheoryScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroContainer}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#002918' }]} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.background, opacity: 0.55, top: '50%' }]} />
          {/* Decorative chirp lines */}
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={{
              position: 'absolute',
              left: 0, right: 0,
              top: 20 + i * 35,
              height: 2,
              opacity: 0.12 + i * 0.04,
              backgroundColor: i % 2 === 0 ? Colors.primary : Colors.amber,
              transform: [{ scaleX: 0.6 + i * 0.07 }],
            }} />
          ))}
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadge}>
              <MaterialIcons name="wifi" size={12} color={Colors.textOnPrimary} />
              <Text style={styles.heroBadgeText}>CSS · LoRa Physical Layer</Text>
            </View>
            <Text style={styles.heroTitle}>Acoustic{'\n'}Emergency{'\n'}Transceiver</Text>
            <Text style={styles.heroSub}>
              Chirp Spread Spectrum over sound{'\n'}18–20 kHz ultrasonic band
            </Text>
          </View>
        </View>

        {/* Parameters grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.accent, { backgroundColor: Colors.cyan }]} />
            <Text style={[styles.sectionTitle, { color: Colors.cyan }]}>Signal Parameters</Text>
          </View>
          <View style={styles.paramGrid}>
            {PARAM_ROWS.map(p => (
              <View key={p.key} style={styles.paramCell}>
                <Text style={styles.paramLabel}>{p.label}</Text>
                <Text style={[styles.paramValue, { color: p.color }]}>{p.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Chirp diagram */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.accent, { backgroundColor: Colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: Colors.primary }]}>Chirp Encoding</Text>
          </View>
          <View style={styles.chirpDiagram}>
            <ChirpDiagramItem
              label="UP-CHIRP"
              subLabel="Binary  1"
              from="18 kHz"
              to="20 kHz"
              color={Colors.primary}
              direction="up"
            />
            <View style={styles.chirpDivider} />
            <ChirpDiagramItem
              label="DOWN-CHIRP"
              subLabel="Binary  0"
              from="20 kHz"
              to="18 kHz"
              color={Colors.amber}
              direction="down"
            />
          </View>
        </View>

        {/* Theory cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.accent, { backgroundColor: Colors.amber }]} />
            <Text style={[styles.sectionTitle, { color: Colors.amber }]}>Core Theory</Text>
          </View>
          {THEORY_CARDS.map(card => {
            const open = expanded === card.id;
            return (
              <Pressable
                key={card.id}
                style={[styles.theoryCard, open && { borderColor: card.color + '55' }]}
                onPress={() => setExpanded(open ? null : card.id)}
              >
                <View style={styles.theoryHeader}>
                  <View style={[styles.theoryIcon, { backgroundColor: card.color + '20' }]}>
                    <MaterialIcons name={card.icon as any} size={20} color={card.color} />
                  </View>
                  <View style={styles.theoryTitleWrap}>
                    <Text style={[styles.theoryTitle, { color: card.color }]}>{card.title}</Text>
                    <Text style={styles.theorySummary} numberOfLines={open ? undefined : 2}>{card.summary}</Text>
                  </View>
                  <MaterialIcons
                    name={open ? 'expand-less' : 'expand-more'}
                    size={22}
                    color={Colors.textMuted}
                  />
                </View>
                {open && (
                  <View style={styles.theoryBody}>
                    <View style={[styles.formulaBox, { borderColor: card.color + '40' }]}>
                      <Text style={[styles.formula, { color: card.color }]}>{card.formula}</Text>
                    </View>
                    {card.detail.map((line, i) => (
                      <View key={i} style={styles.detailRow}>
                        <View style={[styles.bullet, { backgroundColor: card.color }]} />
                        <Text style={styles.detailText}>{line}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Frame structure */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.accent, { backgroundColor: Colors.red }]} />
            <Text style={[styles.sectionTitle, { color: Colors.red }]}>Frame Structure</Text>
          </View>
          <View style={styles.frameRow}>
            {[
              { label: 'PREAMBLE', count: '8 ↑', color: Colors.primary },
              { label: 'SFD',      count: '↓↑',  color: Colors.amber },
              { label: 'PAYLOAD',  count: '≤64b', color: Colors.cyan },
            ].map(f => (
              <View key={f.label} style={[styles.frameCell, { borderColor: f.color + '60' }]}>
                <Text style={[styles.frameCellLabel, { color: f.color }]}>{f.label}</Text>
                <Text style={styles.frameCellCount}>{f.count}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.frameNote}>
            Preamble: 8 up-chirps for sync · SFD: ↓↑ Start-Frame Delimiter · Payload: ASCII bits
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function ChirpDiagramItem({
  label, subLabel, from, to, color, direction,
}: {
  label: string; subLabel: string; from: string; to: string;
  color: string; direction: 'up' | 'down';
}) {
  const POINTS = 30;
  const W = (width - Spacing.md * 2 - 32) / 2 - 8;
  const H = 60;

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[styles.chirpLabel, { color }]}>{label}</Text>
      <Text style={styles.chirpSub}>{subLabel}</Text>
      <View style={[styles.miniWave, { width: W, height: H }]}>
        {Array.from({ length: POINTS }, (_, i) => {
          const pct = i / (POINTS - 1);
          const y   = direction === 'up'
            ? H - 4 - pct * (H - 8)
            : 4 + pct * (H - 8);
          return (
            <View
              key={i}
              style={{
                position:        'absolute',
                left:            (i / POINTS) * W,
                top:             y - 2,
                width:           W / POINTS + 1,
                height:          4,
                backgroundColor: color,
                borderRadius:    2,
                opacity:         0.8 + 0.2 * pct,
              }}
            />
          );
        })}
      </View>
      <View style={styles.freqRow}>
        <Text style={[styles.freqLabel, { color }]}>{from}</Text>
        <MaterialIcons name={direction === 'up' ? 'arrow-forward' : 'arrow-forward'} size={14} color={Colors.textMuted} />
        <Text style={[styles.freqLabel, { color }]}>{to}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { paddingBottom: Spacing.xxxl },

  heroContainer: { height: 260, position: 'relative', marginBottom: Spacing.md },

  heroOverlay:   { position: 'absolute', bottom: Spacing.lg, left: Spacing.md, right: Spacing.md },
  heroBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.primary,
    borderRadius:    Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   3,
    alignSelf:       'flex-start',
    gap:             4,
    marginBottom:    Spacing.sm,
  },
  heroBadgeText: { fontSize: Typography.sizeXs, color: Colors.textOnPrimary, fontWeight: Typography.weightBold },
  heroTitle: {
    fontSize:   Typography.sizeXxl,
    fontWeight: Typography.weightBold,
    color:      Colors.textPrimary,
    fontFamily: 'SpaceMono',
    lineHeight: 36,
    marginBottom: Spacing.xs,
  },
  heroSub: { fontSize: Typography.sizeSm, color: Colors.textSecondary, lineHeight: 20 },

  section:       { paddingHorizontal: Spacing.md, marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  accent:        { width: 3, height: 18, borderRadius: 2 },
  sectionTitle:  { fontSize: Typography.sizeMd, fontWeight: Typography.weightBold, fontFamily: 'SpaceMono', letterSpacing: 0.5 },

  paramGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  paramCell:  {
    width:           (width - Spacing.md * 2 - Spacing.sm) / 2 - 1,
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
  },
  paramLabel: { fontSize: Typography.sizeXs, color: Colors.textMuted, fontFamily: 'SpaceMono', marginBottom: 4 },
  paramValue: { fontSize: Typography.sizeMd, fontWeight: Typography.weightBold, fontFamily: 'SpaceMono' },

  chirpDiagram: {
    flexDirection:   'row',
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    gap:             Spacing.md,
  },
  chirpLabel:  { fontSize: Typography.sizeSm, fontWeight: Typography.weightBold, fontFamily: 'SpaceMono', marginBottom: 2 },
  chirpSub:    { fontSize: Typography.sizeXs, color: Colors.textMuted, marginBottom: Spacing.sm },
  miniWave:    { position: 'relative', marginBottom: Spacing.sm, overflow: 'hidden' },
  freqRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  freqLabel:   { fontSize: Typography.sizeXs, fontFamily: 'SpaceMono' },
  chirpDivider: { width: 1, backgroundColor: Colors.surfaceBorder },

  theoryCard: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    marginBottom:    Spacing.sm,
  },
  theoryHeader:   { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  theoryIcon:     { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  theoryTitleWrap: { flex: 1 },
  theoryTitle:    { fontSize: Typography.sizeMd, fontWeight: Typography.weightBold, fontFamily: 'SpaceMono', marginBottom: 4 },
  theorySummary:  { fontSize: Typography.sizeSm, color: Colors.textSecondary, lineHeight: 20 },
  theoryBody:     { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder },
  formulaBox: {
    backgroundColor: Colors.background,
    borderRadius:    Radius.sm,
    borderWidth:     1,
    padding:         Spacing.sm,
    marginBottom:    Spacing.sm,
    alignItems:      'center',
  },
  formula:    { fontSize: Typography.sizeMd, fontFamily: 'SpaceMono', letterSpacing: 1 },
  detailRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: 6 },
  bullet:     { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  detailText: { flex: 1, fontSize: Typography.sizeSm, color: Colors.textSecondary, lineHeight: 20, fontFamily: 'SpaceMono' },

  frameRow:  { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  frameCell: {
    flex:            1,
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    borderWidth:     1.5,
    padding:         Spacing.sm,
    alignItems:      'center',
  },
  frameCellLabel: { fontSize: Typography.sizeXs, fontWeight: Typography.weightBold, fontFamily: 'SpaceMono', marginBottom: 2 },
  frameCellCount: { fontSize: Typography.sizeLg, fontWeight: Typography.weightBold, color: Colors.textPrimary, fontFamily: 'SpaceMono' },
  frameNote:      { fontSize: Typography.sizeXs, color: Colors.textMuted, lineHeight: 18 },
});
