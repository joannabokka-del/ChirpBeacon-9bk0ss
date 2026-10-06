// Powered by OnSpace.AI
// CSS Acoustic Transceiver — Receiver Hook

import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import {
  simulateReceive,
  DecodeResult,
  buildSpectrum,
  SpectrumBin,
  formatLogEntry,
  snrCategory,
} from '@/services/decoderService';
import { CSS_CONFIG } from '@/constants/config';

export type RxState = 'idle' | 'listening' | 'detected' | 'decoding' | 'error';

export interface RxLogEntry {
  id:     string;
  text:   string;
  result: DecodeResult;
}

export function useReceiver() {
  const [rxState,       setRxState]        = useState<RxState>('idle');
  const [noiseLevel,    setNoiseLevel]      = useState(0.25);   // 0–1
  const [spectrum,      setSpectrum]        = useState<SpectrumBin[]>([]);
  const [correlation,   setCorrelation]     = useState<number[]>([]);
  const [snrDb,         setSnrDb]           = useState(0);
  const [confidence,    setConfidence]      = useState(0);
  const [lastResult,    setLastResult]      = useState<DecodeResult | null>(null);
  const [logs,          setLogs]            = useState<RxLogEntry[]>([]);
  const [micPermission, setMicPermission]   = useState<boolean | null>(null);
  const [chirpPhase,    setChirpPhase]      = useState(0);
  const [detectionCount,setDetectionCount]  = useState(0);

  const recordingRef  = useRef<Audio.Recording | null>(null);
  const scanTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef      = useRef(0);

  useEffect(() => {
    return () => {
      stopAllTimers();
      stopRecording();
    };
  }, []);

  const stopAllTimers = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  };

  const stopRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch { /* ignore */ }
      recordingRef.current = null;
    }
  };

  const requestMicPermission = async (): Promise<boolean> => {
    const { status } = await Audio.requestPermissionsAsync();
    const granted = status === 'granted';
    setMicPermission(granted);
    return granted;
  };

  const startListening = useCallback(async () => {
    setRxState('listening');
    setCorrelation([]);
    setLastResult(null);

    // Request mic permission
    const granted = await requestMicPermission();

    if (granted) {
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const rec = new Audio.Recording();
        await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await rec.startAsync();
        recordingRef.current = rec;
      } catch (e) {
        console.warn('Mic recording failed, running simulation:', e);
      }
    }

    // Continuous scan loop (50ms ticks = 1 chirp period)
    let scanCount = 0;
    phaseRef.current = 0;

    scanTimerRef.current = setInterval(() => {
      scanCount++;
      phaseRef.current = (phaseRef.current + 0.05) % 1;
      setChirpPhase(phaseRef.current);

      // Update live spectrum
      const active = scanCount % 4 !== 0; // simulate occasional gaps
      setSpectrum(buildSpectrum(active, phaseRef.current, noiseLevel));

      // Every ~2s: attempt to detect a signal
      if (scanCount % 40 === 0) {
        const signalChance = 0.35; // ~35% chance of detection in demo
        const present = Math.random() < signalChance;
        const result  = simulateReceive(noiseLevel, present);
        setSnrDb(result.snr_db);
        setConfidence(result.confidence);
        setCorrelation(result.correlation);

        if (result.detected) {
          setRxState('detected');
          setLastResult(result);
          setDetectionCount(c => c + 1);
          const entry: RxLogEntry = {
            id:     Date.now().toString(),
            text:   formatLogEntry(result),
            result,
          };
          setLogs(prev => [entry, ...prev.slice(0, 49)]);
          // Return to listening after 2s
          setTimeout(() => setRxState('listening'), 2000);
        }
      }

      // Drift noise level slightly
      setNoiseLevel(n => {
        const drift = (Math.random() - 0.5) * 0.01;
        return Math.max(0.1, Math.min(0.8, n + drift));
      });
    }, 50);
  }, [noiseLevel]);

  const stopListening = useCallback(async () => {
    stopAllTimers();
    await stopRecording();
    setRxState('idle');
    setSpectrum([]);
    setCorrelation([]);
    setChirpPhase(0);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const snrInfo = snrCategory(snrDb);

  return {
    rxState, noiseLevel, setNoiseLevel,
    spectrum, correlation, snrDb, snrInfo,
    confidence, lastResult, logs,
    micPermission, chirpPhase,
    detectionCount,
    startListening, stopListening, clearLogs,
    isListening: rxState === 'listening' || rxState === 'detected',
  };
}
