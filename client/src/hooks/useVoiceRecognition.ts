import { useState, useEffect, useRef, useCallback } from "react";

// Web Speech API interface declarations for TypeScript
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onend: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: IWindowSpeechRecognition, ev: { error: string; message?: string }) => void) | null;
  onresult: ((this: IWindowSpeechRecognition, ev: {
    resultIndex: number;
    results: {
      length: number;
      item: (index: number) => {
        isFinal: boolean;
        0: { transcript: string; confidence: number };
      };
      [index: number]: {
        isFinal: boolean;
        0: { transcript: string; confidence: number };
      };
    };
  }) => void) | null;
}

export type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error" | "unsupported";

export interface VoiceErrorState {
  code: "permission-denied" | "no-speech" | "audio-capture" | "network" | "unknown";
  message: string;
  suggestion: string;
}

export interface UseVoiceRecognitionOptions {
  onCommandFinalized?: (text: string) => void;
  lang?: string;
}

export function useVoiceRecognition({ onCommandFinalized, lang = "en-IN" }: UseVoiceRecognitionOptions = {}) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [finalTranscript, setFinalTranscript] = useState<string>("");
  const [errorState, setErrorState] = useState<VoiceErrorState | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const recognitionRef = useRef<IWindowSpeechRecognition | null>(null);
  const isListeningRef = useRef<boolean>(false);

  // Store onCommandFinalized in a ref so the SpeechRecognition instance
  // doesn't get torn down and recreated every time the callback identity changes
  const onCommandFinalizedRef = useRef(onCommandFinalized);
  useEffect(() => {
    onCommandFinalizedRef.current = onCommandFinalized;
  }, [onCommandFinalized]);

  // Initialize SpeechRecognition on client — only depends on `lang`, not on callback identity
  useEffect(() => {
    if (typeof window === "undefined") return;

    // justified: Web Speech API has no standard TypeScript declarations; vendor-prefixed webkitSpeechRecognition requires runtime duck-typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      setVoiceState("unsupported");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass() as IWindowSpeechRecognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setVoiceState("listening");
        setErrorState(null);
        setInterimTranscript("");
      };

      recognition.onresult = (event) => {
        let currentInterim = "";
        let currentFinal = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result && result.isFinal) {
            currentFinal += result[0].transcript;
          } else if (result) {
            currentInterim += result[0].transcript;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (currentFinal) {
          const trimmed = currentFinal.trim();
          setFinalTranscript(trimmed);
          setInterimTranscript("");
          setVoiceState("processing");
          // Read from ref — always calls the latest callback without re-creating recognition
          onCommandFinalizedRef.current?.(trimmed);
        }
      };

      recognition.onerror = (event) => {
        isListeningRef.current = false;

        // 'aborted' fires when recognition is programmatically stopped or restarted
        // — this is not a user-facing error, so silently reset to idle
        if (event.error === "aborted") {
          setInterimTranscript("");
          setVoiceState("idle");
          return;
        }

        setVoiceState("error");
        setInterimTranscript("");

        switch (event.error) {
          case "not-allowed":
          case "permission-denied":
            setErrorState({
              code: "permission-denied",
              message: "Microphone access was denied.",
              suggestion: "Please enable microphone permissions in your browser or use text input below."
            });
            break;
          case "no-speech":
            setErrorState({
              code: "no-speech",
              message: "No speech was detected.",
              suggestion: "Please speak clearly near your microphone, or type your command."
            });
            break;
          case "audio-capture":
            setErrorState({
              code: "audio-capture",
              message: "No microphone was found.",
              suggestion: "Ensure your microphone is plugged in and recognized by your system."
            });
            break;
          case "network":
            setErrorState({
              code: "network",
              message: "Speech recognition network error.",
              suggestion: "Check your internet connection or use manual text input."
            });
            break;
          default:
            setErrorState({
              code: "unknown",
              message: `Voice error: ${event.error || "Unable to recognize"}`,
              suggestion: "Tap the microphone to try again or use manual text command."
            });
            break;
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        // Reset to idle from listening or error (in case of a non-critical error like aborted)
        setVoiceState((prev) => (prev === "listening" || prev === "error" ? "idle" : prev));
      };

      recognitionRef.current = recognition;
    } catch {
      setIsSupported(false);
      setVoiceState("unsupported");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [lang]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setErrorState(null);
    setInterimTranscript("");
    setFinalTranscript("");

    try {
      recognitionRef.current.start();
    } catch {
      // If already started, stop and restart
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current?.start(), 200);
      } catch {
        // Ignore
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // Ignore
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setInterimTranscript("");
    setFinalTranscript("");
    setErrorState(null);
    setVoiceState("idle");
  }, []);

  // Text-to-speech audio feedback helper
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setVoiceState("speaking");
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setVoiceState("idle");
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setVoiceState("idle");
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
      setVoiceState("idle");
    }
  }, []);

  return {
    voiceState,
    setVoiceState,
    interimTranscript,
    finalTranscript,
    setFinalTranscript,
    errorState,
    isSupported,
    isSpeaking,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    speak
  };
}

