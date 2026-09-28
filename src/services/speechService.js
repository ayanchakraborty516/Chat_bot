/**
 * Speech-to-Text Service using standard Web Speech API
 */

class SpeechService {
  constructor() {
    this.recognition = null;
    this.isSupported = false;
    this.isListening = false;

    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }
    }
  }

  /**
   * Check if speech recognition is supported in this browser
   * @returns {boolean}
   */
  hasSupport() {
    return this.isSupported;
  }

  /**
   * Start speech recognition
   * @param {object} callbacks
   * @param {(text: string, isFinal: boolean) => void} callbacks.onResult
   * @param {(error: string) => void} callbacks.onError
   * @param {() => void} callbacks.onStart
   * @param {() => void} callbacks.onEnd
   */
  start({ onResult, onError, onStart, onEnd }) {
    if (!this.isSupported || !this.recognition) {
      if (onError) onError('Speech recognition is not supported in this browser.');
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      if (onStart) onStart();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (onResult) {
        onResult(finalTranscript || interimTranscript, Boolean(finalTranscript));
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (onError) {
        let msg = 'Speech recognition error.';
        if (event.error === 'not-allowed') {
          msg = 'Microphone access was denied. Please allow microphone permissions.';
        } else if (event.error === 'no-speech') {
          msg = 'No speech was detected. Please try speaking again.';
        }
        onError(msg);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Speech recognition start error:', err);
    }
  }

  /**
   * Stop speech recognition
   */
  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Speech recognition stop error:', err);
      }
      this.isListening = false;
    }
  }
}

export const speechService = new SpeechService();
export default speechService;
