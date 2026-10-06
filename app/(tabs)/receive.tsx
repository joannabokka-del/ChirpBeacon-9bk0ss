// Powered by OnSpace.AI
// CSS Receiver Screen

import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Dimensions, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useReceiver } from '@/hooks/useReceiver';
import { CSS_CONFIG } from '@/constants/config';
import { calculateProcessingGain } from '@/services/chirpService';
import {
  SpectrumDisplay, CorrelationGraph, SNRMeter, GlowButton, StatCard,
} from '@/components';

const { width } = Dimensions.get('window');
const GRAPH_W   = width - Spacing.md * 2;

export default function ReceiveScreen() {
  const {
    rxState, noiseLevel, spectrum, correlation,
    snrDb, snrInfo, confidence, lastResult, logs,
    micPermission, detectionCount,
    startListening, stopListening, clearLogs,
    isListening,
  } = useReceiver();

  const detected = rxState === 'detected';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>CSS Receiver</Text>
            <Text style={styles.subtitle}>Matched-filter cross-correlation detector</Text>
          </View>
          <View style={[styles.statusIndicator, {
            backgroundColor: detected ? Colors.primary + '30' : isListening ? Colors.cyan + '20' : Colors.surfaceBorder,
            borderColor:     detected ? Colors.primary : isListening ? Colors.cyan : Colors.surfaceBorder,
          }]}>
            <MaterialIcons
              name={detected ? 'check-circle' : isListening ? 'sensors' : 'sensors-off'}
              size={16}
              color={detected ? Colors.primary : isListening ? Colors.cyan : Colors.textMuted}
            />
            <Text style={[styles.statusText, {
              color: detected ? Colors.primary : isListening ? Colors.cyan : Colors.textMuted,
            }]}>
              {detected ? 'DETECTED' : isListening ? 'SCANNING' : 'IDLE'}
            </Text>
          </View>
        </View>

        {/* Detection alert */}
        {detected && lastResult && (
          <View style={styles.alertBox}>
            <MaterialIcons name="warning" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>DISTRESS SIGNAL RECEIVED</Text>
              <Text style={styles.alertPayload}>{lastResult.payload}</Text>
              <Text style={styles.alertMeta}>
                Confidence: {(lastResult.confidence * 100).toFixed(0)}%  ·  SNR: {lastResult.snr_db.toFixed(1)} dB  ·  Symbols: {lastResult.symbolCount}
              </Text>
            </View>
          </View>
        )}

        {/* Mic permission notice */}
        {micPermission === false && (
          <View style={styles.warnBox}>
            <MaterialIcons name="mic-off" size={16} color={Colors.amber} />
            <Text style={styles.warnText}>Microphone permission denied — running visual simulation</Text>
          </View>
        )}

        {/* Main controls */}
        <View style={styles.section}>
          {isListening ? (
            <GlowButton
              label="STOP LISTENING"
              onPress={stopListening}
              color={Colors.red}
              variant="outline"
              fullWidth
              size="lg"
            />
          ) : (
            <GlowButton
              label="START LISTENING"
              onPress={startListening}
              color={Colors.cyan}
              fullWidth
              size="lg"
              icon={<MaterialIcons name="mic" size={20} color={Colors.textOnPrimary} />}
            />
          )}
        </View>

        {/* Live spectrum */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SPECTRUM  (15–22 kHz)</Text>
          <SpectrumDisplay bins={spectrum} width={GRAPH_W} height={130} />
        </View>

        {/* Cross-correlation */}
        {correlation.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              CROSS-CORRELATION  R(τ) vs τ
            </Text>
            <CorrelationGraph data={correlation} width={GRAPH_W} height={110} />
            <Text style={styles.graphNote}>
              Green bars exceed detection threshold ({CSS_CONFIG.CORRELATION_THRESHOLD}) → symbol detected
            </Text>
          </View>
        )}

        {/* SNR meter */}
        {isListening && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SIGNAL-TO-NOISE RATIO</Text>
            <View style={styles.snrCard}>
              <SNRMeter
                snr={snrDb}
                color={snrInfo.color}
                label={snrInfo.label}
                processingGain={calculateProcessingGain()}
              />
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECEIVER PARAMETERS</Text>
          <View style={styles.statsRow}>
            <StatCard label="Detections" value={String(detectionCount)} color={Colors.primary} />
            <StatCard label="Threshold"  value={String(CSS_CONFIG.CORRELATION_THRESHOLD)} color={Colors.amber} sub="normalized" />
            <StatCard label="Min SNR"    value={String(CSS_CONFIG.SNR_MIN_DB)} unit="dB" color={Colors.cyan} />
          </View>
          <View style={[styles.statsRow, { marginTop: Spacing.sm }]}>
            <StatCard label="Process Gain" value="+21" unit="dB" color={Colors.primary} sub="Gp = 10·log(B/Rb)" />
            <StatCard label="Confidence"   value={isListening ? `${(confidence * 100).toFixed(0)}` : '—'} unit="%" color={Colors.cyan} />
            <StatCard label="Noise Floor"  value={String(CSS_CONFIG.NOISE_FLOOR_DB)} unit="dBm" color={Colors.textSecondary} />
          </View>
        </View>

        {/* Theory recap */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HOW DETECTION WORKS</Text>
          {[
            { step: '1', text: 'Sample 44.1 kHz audio from microphone',          color: Colors.cyan },
            { step: '2', text: 'Mix with reference up/down-chirp template',      color: Colors.cyan },
            { step: '3', text: 'Integrate over one symbol period (50 ms)',        color: Colors.primary },
            { step: '4', text: 'Peak in R(τ) > threshold → bit detected',        color: Colors.primary },
            { step: '5', text: 'Decode payload → UTF-8 message reconstructed',   color: Colors.amber },
          ].map(item => (
            <View key={item.step} style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: item.color + '20', borderColor: item.color + '60' }]}>
                <Text style={[styles.stepNum, { color: item.color }]}>{item.step}</Text>
              </View>
              <Text style={styles.stepText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Recent detections */}
        {logs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.logHeader}>
              <Text style={styles.sectionLabel}>DETECTION LOG</Text>
              <Pressable onPress={clearLogs}>
                <Text style={styles.clearBtn}>CLEAR</Text>
              </Pressable>
            </View>
            {logs.slice(0, 8).map(entry => (
              <View key={entry.id} style={[styles.logRow, !entry.result.detected && styles.logRowMiss]}>
                <MaterialIcons
                  name={entry.result.detected ? 'check-circle' : 'radio-button-unchecked'}
                  size={14}
                  color={entry.result.detected ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.logText, !entry.result.detected && { color: Colors.textMuted }]}>
                  {entry.text}
                </Text>
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

  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   Spacing.xl,
  },
  title:    { fontSize: Typography.sizeXl, fontWeight: Typography.weightBold, color: Colors.textPrimary, fontFamily: 'SpaceMono' },
  subtitle: { fontSize: Typography.sizeSm, color: Colors.textSecondary, marginTop: 2 },
  statusIndicator: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    borderRadius:      Radius.full,
    borderWidth:       1,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   5,
  },
  statusText: { fontSize: Typography.sizeXs, fontWeight: Typography.weightBold, fontFamily: 'SpaceMono' },

  alertBox: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             Spacing.sm,
    backgroundColor: Colors.primaryGlow,
    borderRadius:    Radius.lg,
    borderWidth:     1.5,
    borderColor:     Colors.primary,
    padding:         Spacing.md,
    marginBottom:    Spacing.lg,
  },
  alertTitle:   { fontSize: Typography.sizeSm, fontWeight: Typography.weightBold, color: Colors.primary, fontFamily: 'SpaceMono' },
  alertPayload: { fontSize: Typography.sizeMd, fontWeight: Typography.weightBold, color: Colors.textPrimary, fontFamily: 'SpaceMono', marginVertical: 2 },
  alertMeta:    { fontSize: Typography.sizeXs, color: Colors.textSecondary, fontFamily: 'SpaceMono' },

  warnBox: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.sm,
    backgroundColor: Colors.amberGlow,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.amber + '55',
    padding:         Spacing.sm,
    marginBottom:    Spacing.md,
  },
  warnText: { fontSize: Typography.sizeSm, color: Colors.amber, flex: 1 },

  section:      { marginBottom: Spacing.lg },
  sectionLabel: {
    fontSize:      Typography.sizeXs,
    color:         Colors.textMuted,
    fontFamily:    'SpaceMono',
    letterSpacing: 1.5,
    marginBottom:  Spacing.sm,
    textTransform: 'uppercase',
  },

  snrCard: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.surfaceBorder,
    padding:         Spacing.md,
  },

  graphNote: { fontSize: Typography.sizeXs, color: Colors.textMuted, marginTop: 4, fontFamily: 'SpaceMono' },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },

  stepRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Spacing.sm,
    marginBottom:  Spacing.sm,
  },
  stepBadge: {
    width:          28,
    height:         28,
    borderRadius:   Radius.full,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  stepNum:  { fontSize: Typography.sizeSm, fontWeight: Typography.weightBold, fontFamily: 'SpaceMono' },
  stepText: { flex: 1, fontSize: Typography.sizeSm, color: Colors.textSecondary, lineHeight: 22, paddingTop: 4 },

  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  clearBtn:  { fontSize: Typography.sizeXs, color: Colors.textMuted, fontFamily: 'SpaceMono', letterSpacing: 1 },
  logRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: 6 },
  logRowMiss: { opacity: 0.5 },
  logText:   { fontSize: Typography.sizeSm, color: Colors.textSecondary, fontFamily: 'SpaceMono', flex: 1, lineHeight: 20 },
});
