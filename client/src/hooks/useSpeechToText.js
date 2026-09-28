import { useState, useEffect, useCallback } from 'react';
import { speechService } from '../services/speechService';

export function useSpeechToText({ onTranscript } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const isSupported = speechService.hasSupport();

  const startListening = useCallback(() => {
    setError(null);
    speechService.start({
      onStart: () => setIsListening(true),
      onEnd: () => setIsListening(false),
      onResult: (text) => {
        setTranscript(text);
        if (onTranscript) {
          onTranscript(text);
        }
      },
      onError: (errMsg) => {
        setError(errMsg);
        setIsListening(false);
      },
    });
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    speechService.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
