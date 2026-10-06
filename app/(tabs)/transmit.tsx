// Powered by OnSpace.AI
// CSS Transmitter Screen

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, Pressable, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useTransmitter } from '@/hooks/useTransmitter';
import { DEMO_MESSAGES, CSS_CONFIG } from '@/constants/config';
import { ChirpWaveform, SpectrumDisplay, StatCard, GlowButton } from '@/components';

const { width } = Dimensions.get('window');
const GRAPH_W = width - Spacing.md * 2;

export default function TransmitScreen() {
  const {
    txState, message, setMessage,
    symbols, currentSymIdx, progress,
    waveformData, spectrum, logs,
    error, totalDuration,
    transmit, stop, isTransmitting,
  } = useTransmitter();

  const [customMsg, setCustomMsg] = useState('');

  const currentSym = symbols[currentSymIdx];
  const chirpType  = currentSym?.chirp ?? 'up';

  const handleQuickMsg = (text: string) => {
    if (text === '') {
      // custom — handled separately
      return;
    }
    setMessage(text);
    transmit(text);
  };

  const handleTransmit = () => {
    const msg = message || customMsg;
    transmit(msg);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>CSS Transmitter</Text>
              <Text style={styles.subtitle}>Acoustic chirp beacon · 18–20 kHz</Text>
            </View>
            <View style={[styles.statusDot, {
              backgroundColor: isTransmitting ? Colors.primary : Colors.surfaceBorder,
              shadowColor:     isTransmitting ? Colors.primary : 'transparent',
              shadowOpacity:   0.8,
              shadowRadius:    8,
              elevation:       4,
            }]} />
          </View>

          {/* Quick message presets */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>QUICK TRANSMIT</Text>
            <View style={styles.presetRow}>
              {DEMO_MESSAGES.filter(m => m.id !== 'cus').map(m => (
                <Pressable
                  key={m.id}
                  style={({ pressed }) => [
                    styles.preset,
                    message === m.text && styles.presetActive,
                    pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={() => setMessage(m.text)}
                >
                  <Text style={[styles.presetLabel, message === m.text && { color: Colors.primary }]}>
                    {m.label}
                  </Text>
                  <Text style={[styles.presetValue, message === m.text && { color: Colors.primary }]}>
                    {m.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Custom message */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CUSTOM MESSAGE</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder="Enter SOS message or GPS coords…"
                placeholderTextColor={Colors.textMuted}
                maxLength={50}
                autoCorrect={false}
                autoCapitalize="characters"
              />
              <Text style={styles.charCount}>{message.length}/50</Text>
            </View>
          </View>

          {/* Transmit control */}
          <View style={styles.section}>
            {error ? (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={16} color={Colors.red} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {isTransmitting ? (
              <GlowButton
                label="STOP TRANSMISSION"
                onPress={stop}
                color={Colors.red}
                variant="outline"
                fullWidth
                size="lg"
              />
            ) : (
              <GlowButton
                label={txState === 'done' ? 'RETRANSMIT' : 'TRANSMIT SOS'}
                onPress={handleTransmit}
                color={Colors.primary}
                fullWidth
                size="lg"
                icon={<MaterialIcons name="wifi-tethering" size={20} color={Colors.textOnPrimary} />}
              />
            )}
          </View>

          {/* Progress */}
          {(isTransmitting || txState === 'done') && (
            <View style={styles.section}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>
                  Symbol {Math.max(0, currentSymIdx + 1)} / {symbols.length}
                </Text>
                <Text style={styles.progressLabel}>
                  {(progress * totalDuration).toFixed(2)}s / {totalDuration.toFixed(2)}s
                </Text>
              </View>

              {/* Current chirp indicator */}
              <View style={styles.chirpIndicator}>
                <View style={[styles.chirpBadge, {
                  backgroundColor: chirpType === 'up' ? Colors.primaryGlow : Colors.amberGlow,
                  borderColor:     chirpType === 'up' ? Colors.primary : Colors.amber,
                }]}>
                  <MaterialIcons
                    name={chirpType === 'up' ? 'trending-up' : 'trending-down'}
                    size={18}
                    color={chirpType === 'up' ? Colors.primary : Colors.amber}
                  />
                  <Text style={[styles.chirpBadgeText, { color: chirpType === 'up' ? Colors.primary : Colors.amber }]}>
                    {chirpType === 'up' ? 'UP-CHIRP (1)' : 'DOWN-CHIRP (0)'}
                  </Text>
                </View>
                <Text style={styles.chirpFreq}>
                  {chirpType === 'up' ? '18 kHz → 20 kHz' : '20 kHz → 18 kHz'}
                </Text>
              </View>
            </View>
          )}

          {/* Waveform */}
          {isTransmitting && waveformData.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CHIRP WAVEFORM (f vs t)</Text>
              <ChirpWaveform
                data={waveformData}
                chirpType={chirpType}
                width={GRAPH_W}
                height={100}
              />
              <View style={styles.waveLabels}>
                <Text style={styles.waveLabelL}>18 kHz</Text>
                <Text style={styles.waveLabelC}>← frequency sweep →</Text>
                <Text style={styles.waveLabelR}>20 kHz</Text>
              </View>
            </View>
          )}

          {/* Live spectrum */}
          {isTransmitting && spectrum.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LIVE SPECTRUM</Text>
              <SpectrumDisplay bins={spectrum} width={GRAPH_W} height={120} />
            </View>
          )}

          {/* Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SIGNAL PARAMETERS</Text>
            <View style={styles.statsRow}>
              <StatCard label="Bandwidth" value="2" unit="kHz" color={Colors.cyan} />
              <StatCard label="Symbol Time" value="50" unit="ms" color={Colors.primary} />
              <StatCard label="Bit Rate" value={String(CSS_CONFIG.BIT_RATE)} unit="bps" color={Colors.amber} />
            </View>
            <View style={[styles.statsRow, { marginTop: Spacing.sm }]}>
              <StatCard label="Process Gain" value="+21" unit="dB" color={Colors.primary} />
              <StatCard label="Chirp Count" value={String(symbols.length || '—')} color={Colors.cyan} />
              <StatCard label="Duration" value={totalDuration > 0 ? totalDuration.toFixed(1) : '—'} unit="s" color={Colors.amber} />
            </View>
          </View>

          {/* Recent transmissions */}
          {logs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>RECENT TRANSMISSIONS</Text>
              {logs.slice(0, 5).map(l => (
                <View key={l.id} style={styles.logRow}>
                  <MaterialIcons name="check-circle" size={14} color={Colors.primary} />
                  <Text style={styles.logText}>
                    "{l.message}"  ·  {l.symbols} symbols  ·  {new Date(l.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxxl, paddingTop: Spacing.md },

  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   Spacing.xl,
  },
  title:    { fontSize: Typography.sizeXl, fontWeight: Typography.weightBold, color: Colors.textPrimary, fontFamily: 'SpaceMono' },
  subtitle: { fontSize: Typography.sizeSm, color: Colors.textSecondary, marginTop: 2 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginTop: 6 },

  section:      { marginBottom: Spacing.lg },
  sectionLabel: {
    fontSize:      Typography.sizeXs,
    color:         Colors.textMuted,
    fontFamily:    'SpaceMono',
    letterSpacing: 1.5,
    marginBottom:  Spacing.sm,
    textTransform: 'uppercase',
  },

  presetRow: { gap: Spacing.sm },
  preset: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    padding:         Spacing.sm,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
  },
  presetActive:  { borderColor: Colors.primary + '66', backgroundColor: Colors.primaryMuted },
  presetLabel:   { fontSize: Typography.sizeSm, color: Colors.textSecondary, fontFamily: 'SpaceMono' },
  presetValue:   { fontSize: Typography.sizeSm, color: Colors.textMuted, fontFamily: 'SpaceMono' },

  inputRow: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  input: {
    fontSize:   Typography.sizeBase,
    color:      Colors.textPrimary,
    fontFamily: 'SpaceMono',
    minHeight:  44,
  },
  charCount: { fontSize: Typography.sizeXs, color: Colors.textMuted, alignSelf: 'flex-end', marginTop: 2 },

  errorBox: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.redGlow,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.red + '55',
    padding:         Spacing.sm,
    gap:             Spacing.xs,
    marginBottom:    Spacing.sm,
  },
  errorText: { fontSize: Typography.sizeSm, color: Colors.red, flex: 1 },

  progressBar:  { height: 6, backgroundColor: Colors.surfaceBorder, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel:  { fontSize: Typography.sizeXs, color: Colors.textMuted, fontFamily: 'SpaceMono' },

  chirpIndicator: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  chirpBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      Radius.full,
    borderWidth:       1,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   4,
    gap:               4,
  },
  chirpBadgeText: { fontSize: Typography.sizeSm, fontWeight: Typography.weightBold, fontFamily: 'SpaceMono' },
  chirpFreq:      { fontSize: Typography.sizeSm, color: Colors.textSecondary, fontFamily: 'SpaceMono' },

  waveLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  waveLabelL: { fontSize: Typography.sizeXs, color: Colors.amber,       fontFamily: 'SpaceMono' },
  waveLabelC: { fontSize: Typography.sizeXs, color: Colors.textMuted,   fontFamily: 'SpaceMono' },
  waveLabelR: { fontSize: Typography.sizeXs, color: Colors.primary,     fontFamily: 'SpaceMono' },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },

  logRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: 6 },
  logText: { fontSize: Typography.sizeSm, color: Colors.textSecondary, fontFamily: 'SpaceMono', flex: 1, lineHeight: 20 },
});
