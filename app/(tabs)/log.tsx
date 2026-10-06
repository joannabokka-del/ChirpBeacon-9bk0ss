// Powered by OnSpace.AI
// Signal Event Log Screen

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { CSS_CONFIG } from '@/constants/config';
import { calculateProcessingGain } from '@/services/chirpService';

const SYSTEM_PARAMS = [
  { group: 'Frequency Band',    items: [
    { k: 'Lower Bound f₀',       v: `${CSS_CONFIG.F_LOW / 1000} kHz` },
    { k: 'Upper Bound f₁',       v: `${CSS_CONFIG.F_HIGH / 1000} kHz` },
    { k: 'Bandwidth B',          v: `${CSS_CONFIG.BANDWIDTH} Hz` },
  ]},
  { group: 'Modulation',        items: [
    { k: 'Symbol Duration T',    v: `${CSS_CONFIG.CHIRP_DURATION * 1000} ms` },
    { k: 'Symbol Rate',          v: `${CSS_CONFIG.SYMBOL_RATE} sym/s` },
    { k: 'Bit Rate Rᵦ',          v: `${CSS_CONFIG.BIT_RATE} bps` },
    { k: 'Time-BW Product BT',   v: `${CSS_CONFIG.TIME_BANDWIDTH_PRODUCT}` },
  ]},
  { group: 'Spreading',         items: [
    { k: 'Spreading Factor SF',  v: `${CSS_CONFIG.SPREADING_FACTOR}` },
    { k: 'Chips per Symbol',     v: `${CSS_CONFIG.CHIPS_PER_SYMBOL}` },
    { k: 'Processing Gain Gₚ',   v: `+${calculateProcessingGain().toFixed(1)} dB` },
  ]},
  { group: 'Detection',         items: [
    { k: 'Corr. Threshold',      v: `${CSS_CONFIG.CORRELATION_THRESHOLD}` },
    { k: 'Min Detectable SNR',   v: `${CSS_CONFIG.SNR_MIN_DB} dB` },
    { k: 'Noise Floor',          v: `${CSS_CONFIG.NOISE_FLOOR_DB} dBm` },
  ]},
  { group: 'Frame Structure',   items: [
    { k: 'Preamble Symbols',     v: `${CSS_CONFIG.PREAMBLE_SYMBOLS} up-chirps` },
    { k: 'SFD Symbols',          v: `${CSS_CONFIG.SFD_SYMBOLS} (↓↑)` },
    { k: 'Max Payload Bits',     v: `${CSS_CONFIG.PAYLOAD_BITS} bits` },
    { k: 'Sample Rate',          v: `${CSS_CONFIG.SAMPLE_RATE / 1000} kHz` },
  ]},
];

const CSS_COMPARISONS = [
  { param: 'Modulation',  css: 'Linear chirp sweep', lora: 'Linear chirp sweep', match: true },
  { param: 'Medium',      css: 'Acoustic (air)',     lora: 'RF 433/868/915 MHz', match: false },
  { param: 'BW',          css: '2 kHz',              lora: '125/250/500 kHz',    match: false },
  { param: 'Processing Gain', css: '+21 dB',         lora: '+17 to +24 dB',     match: true },
  { param: 'Multi-path',  css: 'CSS immune',         lora: 'CSS immune',         match: true },
  { param: 'Noise Imm.',  css: 'High',               lora: 'High',               match: true },
  { param: 'Range',       css: '~10 m (demo)',       lora: '~15 km (outdoor)',   match: false },
  { param: 'Chip',        css: 'Software (DSP)',     lora: 'Semtech SX127x',     match: false },
];

type Tab = 'params' | 'compare' | 'glossary';

export default function LogScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('params');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Reference Log</Text>
        <Text style={styles.subtitle}>System parameters & CSS theory reference</Text>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {([
            { id: 'params',  label: 'Parameters' },
            { id: 'compare', label: 'vs LoRa' },
            { id: 'glossary', label: 'Glossary' },
          ] as { id: Tab; label: string }[]).map(t => (
            <Pressable
              key={t.id}
              style={[styles.tab, activeTab === t.id && styles.tabActive]}
              onPress={() => setActiveTab(t.id)}
            >
              <Text style={[styles.tabLabel, activeTab === t.id && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* PARAMETERS */}
        {activeTab === 'params' && SYSTEM_PARAMS.map(group => (
          <View key={group.group} style={styles.section}>
            <Text style={styles.groupTitle}>{group.group}</Text>
            <View style={styles.table}>
              {group.items.map((item, i) => (
                <View key={item.k} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={styles.tableKey}>{item.k}</Text>
                  <Text style={styles.tableVal}>{item.v}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* VS LORA */}
        {activeTab === 'compare' && (
          <View style={styles.section}>
            <Text style={styles.groupTitle}>Acoustic CSS vs LoRa RF</Text>
            <View style={styles.compareHeader}>
              <Text style={[styles.compareCell, { flex: 1.5 }]}>Parameter</Text>
              <Text style={[styles.compareCell, { color: Colors.cyan }]}>This App</Text>
              <Text style={[styles.compareCell, { color: Colors.amber }]}>LoRa</Text>
              <Text style={[styles.compareCell, { width: 30 }]}> </Text>
            </View>
            {CSS_COMPARISONS.map((row, i) => (
              <View key={row.param} style={[styles.compareRow, i % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.compareParam, { flex: 1.5 }]}>{row.param}</Text>
                <Text style={[styles.compareVal, { color: Colors.cyan }]}>{row.css}</Text>
                <Text style={[styles.compareVal, { color: Colors.amber }]}>{row.lora}</Text>
                <MaterialIcons
                  name={row.match ? 'check-circle' : 'remove-circle'}
                  size={16}
                  color={row.match ? Colors.primary : Colors.textMuted}
                  style={{ width: 30 }}
                />
              </View>
            ))}
            <View style={styles.infoBox}>
              <MaterialIcons name="info" size={14} color={Colors.cyan} />
              <Text style={styles.infoText}>
                LoRa (Long Range) uses identical CSS physical-layer modulation over radio. This app is a direct software analog over acoustic ultrasound — same math, same processing gain.
              </Text>
            </View>
          </View>
        )}

        {/* GLOSSARY */}
        {activeTab === 'glossary' && (
          <View style={styles.section}>
            {[
              { term: 'CSS',         def: 'Chirp Spread Spectrum — spread-spectrum technique using linear frequency sweeps (chirps)' },
              { term: 'Chirp',       def: 'A signal whose instantaneous frequency changes linearly with time: f(t) = f₀ + (B/T)·t' },
              { term: 'Up-chirp',    def: 'Frequency sweeps low→high (18→20 kHz). Encodes binary 1 in this app' },
              { term: 'Down-chirp',  def: 'Frequency sweeps high→low (20→18 kHz). Encodes binary 0 in this app' },
              { term: 'BW (B)',      def: 'Signal bandwidth in Hz. Here B = 20000 − 18000 = 2000 Hz' },
              { term: 'SF',         def: 'Spreading Factor. Chips per symbol = 2^SF. SF=7 → 128 chips/symbol' },
              { term: 'Gₚ',         def: 'Processing Gain = 10·log₁₀(B/Rᵦ). Represents SNR improvement from spreading' },
              { term: 'BT Product', def: 'Bandwidth × Symbol time. Larger BT → better noise immunity' },
              { term: 'R(τ)',       def: 'Cross-correlation of received signal r(t) with template s(t). Peak at τ=0 = match' },
              { term: 'SFD',        def: 'Start Frame Delimiter — special chirp sequence (↓↑) marking payload start' },
              { term: 'Preamble',   def: '8 up-chirps sent before payload to synchronize receiver timing and frequency' },
              { term: 'SNR',        def: 'Signal-to-Noise Ratio in dB. CSS detects signals at SNR as low as −10 dB' },
              { term: 'LoRa',       def: 'Long Range radio protocol by Semtech using identical CSS physical layer over RF' },
              { term: 'FHSS',       def: 'Frequency Hopping Spread Spectrum — alternative SS technique using abrupt hops' },
              { term: 'DSSS',       def: 'Direct Sequence SS — another SS technique using pseudo-random chip sequences' },
            ].map(g => (
              <View key={g.term} style={styles.glossRow}>
                <Text style={styles.glossTerm}>{g.term}</Text>
                <Text style={styles.glossDef}>{g.def}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxxl, paddingTop: Spacing.md },

  title:    { fontSize: Typography.sizeXl, fontWeight: Typography.weightBold, color: Colors.textPrimary, fontFamily: 'SpaceMono', marginBottom: 2 },
  subtitle: { fontSize: Typography.sizeSm, color: Colors.textSecondary, marginBottom: Spacing.lg },

  tabBar: {
    flexDirection:   'row',
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    padding:         4,
    marginBottom:    Spacing.lg,
    gap:             4,
  },
  tab: {
    flex:           1,
    paddingVertical: 10,
    borderRadius:    Radius.md,
    alignItems:     'center',
  },
  tabActive: { backgroundColor: Colors.primary },
  tabLabel:  { fontSize: Typography.sizeSm, color: Colors.textMuted, fontFamily: 'SpaceMono', fontWeight: Typography.weightSemibold },
  tabLabelActive: { color: Colors.textOnPrimary },

  section:    { marginBottom: Spacing.xl },
  groupTitle: {
    fontSize:      Typography.sizeSm,
    color:         Colors.textMuted,
    fontFamily:    'SpaceMono',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom:  Spacing.sm,
  },

  table: { borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.surfaceBorder },
  tableRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 10 },
  tableRowAlt: { backgroundColor: Colors.surfaceAlt },
  tableKey:    { fontSize: Typography.sizeSm, color: Colors.textSecondary, fontFamily: 'SpaceMono', flex: 1 },
  tableVal:    { fontSize: Typography.sizeSm, color: Colors.primary, fontFamily: 'SpaceMono', fontWeight: Typography.weightBold },

  compareHeader: { flexDirection: 'row', paddingHorizontal: Spacing.sm, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  compareCell:   { flex: 1, fontSize: Typography.sizeXs, fontFamily: 'SpaceMono', fontWeight: Typography.weightBold, color: Colors.textMuted },
  compareRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 9 },
  compareParam:  { flex: 1.5, fontSize: Typography.sizeXs, color: Colors.textSecondary, fontFamily: 'SpaceMono' },
  compareVal:    { flex: 1, fontSize: Typography.sizeXs, fontFamily: 'SpaceMono' },
  infoBox: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             Spacing.sm,
    backgroundColor: Colors.cyanGlow,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.cyan + '40',
    padding:         Spacing.md,
    marginTop:       Spacing.md,
  },
  infoText: { flex: 1, fontSize: Typography.sizeSm, color: Colors.textSecondary, lineHeight: 20, fontFamily: 'SpaceMono' },

  glossRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  glossTerm: { fontSize: Typography.sizeSm, color: Colors.primary, fontWeight: Typography.weightBold, fontFamily: 'SpaceMono', marginBottom: 2 },
  glossDef:  { fontSize: Typography.sizeSm, color: Colors.textSecondary, lineHeight: 20 },
});
