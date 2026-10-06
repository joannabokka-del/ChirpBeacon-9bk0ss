// Powered by OnSpace.AI
// CSS Acoustic Transceiver — Transmitter Hook

import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import {
  encodeTextToSymbols,
  samplesToWavBase64,
  ChirpSymbol,
  getChirpVisualizationData,
  WaveformPoint,
} from '@/services/chirpService';
import { buildSpectrum, SpectrumBin } from '@/services/decoderService';

export type TxState = 'idle' | 'encoding' | 'transmitting' | 'done' | 'error';

export interface TransmitLog {
  id:        string;
  message:   string;
  symbols:   number;
  timestamp: number;
  duration:  number;
}

export function useTransmitter() {
  const [txState,      setTxState]      = useState<TxState>('idle');
  const [message,      setMessage]      = useState('SOS');
  const [symbols,      setSymbols]      = useState<ChirpSymbol[]>([]);
  const [currentSymIdx,setCurrentSymIdx]= useState(-1);
  const [progress,     setProgress]     = useState(0);   // 0–1
  const [waveformData, setWaveformData] = useState<WaveformPoint[]>([]);
  const [spectrum,     setSpectrum]     = useState<SpectrumBin[]>([]);
  const [logs,         setLogs]         = useState<TransmitLog[]>([]);
  const [error,        setError]        = useState('');
  const [totalDuration,setTotalDuration]= useState(0);

  const soundRef     = useRef<Audio.Sound | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  // Setup audio session once
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS:              false,
      playsInSilentModeIOS:            true,
      shouldDuckAndroid:               false,
      playThroughEarpieceAndroid:      false,
      staysActiveInBackground:         false,
    }).catch(() => {});
    return () => {
      stopAnimation();
      unloadSound();
    };
  }, []);

  const stopAnimation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const unloadSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch { /* ignore */ }
      soundRef.current = null;
    }
  };

  const transmit = useCallback(async (text?: string) => {
    const msg = (text ?? message).trim();
    if (!msg) { setError('Enter a message to transmit'); return; }

    setError('');
    setTxState('encoding');
    setProgress(0);
    setCurrentSymIdx(0);

    // Encode to symbols
    const syms = encodeTextToSymbols(msg);
    setSymbols(syms);
    const durationSec = syms.length * 0.05; // 50ms per symbol
    setTotalDuration(durationSec);

    // Initial waveform (up-chirp)
    setWaveformData(getChirpVisualizationData('up'));

    let wavBase64: string;
    try {
      wavBase64 = samplesToWavBase64(syms);
    } catch (e) {
      setError('Encoding failed: ' + String(e));
      setTxState('error');
      return;
    }

    try {
      await unloadSound();
      const { sound } = await Audio.Sound.createAsync(
        { uri: wavBase64 },
        { shouldPlay: false, volume: 1.0 },
      );
      soundRef.current = sound;
    } catch (e) {
      // On platforms where data-URI audio fails, continue with visual-only demo
      console.warn('Audio load failed, running visual demo:', e);
    }

    setTxState('transmitting');
    startTimeRef.current = Date.now();

    // Start playback
    try {
      if (soundRef.current) await soundRef.current.playAsync();
    } catch { /* visual demo fallback */ }

    // Animate progress & spectrum
    timerRef.current = setInterval(() => {
      const elapsed  = (Date.now() - startTimeRef.current) / 1000;
      const pct      = Math.min(1, elapsed / durationSec);
      const symIdx   = Math.min(syms.length - 1, Math.floor(pct * syms.length));
      const chirpPhase = (elapsed % 0.05) / 0.05; // 0–1 within current chirp

      setProgress(pct);
      setCurrentSymIdx(symIdx);

      const chirp = syms[symIdx]?.chirp ?? 'up';
      setWaveformData(getChirpVisualizationData(chirp));
      setSpectrum(buildSpectrum(true, chirp === 'up' ? chirpPhase : 1 - chirpPhase));

      if (pct >= 1) {
        stopAnimation();
        setTxState('done');
        setProgress(1);
        setSpectrum(buildSpectrum(false, 0));
        setLogs(prev => [{
          id:        Date.now().toString(),
          message:   msg,
          symbols:   syms.length,
          timestamp: Date.now(),
          duration:  durationSec,
        }, ...prev.slice(0, 19)]);
        unloadSound();
      }
    }, 50);
  }, [message]);

  const stop = useCallback(async () => {
    stopAnimation();
    await unloadSound();
    setTxState('idle');
    setProgress(0);
    setCurrentSymIdx(-1);
    setSpectrum([]);
  }, []);

  return {
    txState, message, setMessage,
    symbols, currentSymIdx, progress,
    waveformData, spectrum, logs,
    error, totalDuration,
    transmit, stop,
    isTransmitting: txState === 'transmitting',
  };
}
