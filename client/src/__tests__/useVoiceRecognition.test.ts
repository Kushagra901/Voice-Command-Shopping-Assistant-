import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVoiceRecognition } from "../hooks/useVoiceRecognition.js";

// Mock SpeechRecognition Class
class MockSpeechRecognition {
  continuous = false;
  interimResults = true;
  lang = "en-IN";
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((ev: { error: string; message?: string }) => void) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onresult: ((ev: any) => void) | null = null;

  start = vi.fn(() => {
    if (this.onstart) this.onstart();
  });
  stop = vi.fn(() => {
    if (this.onend) this.onend();
  });
  abort = vi.fn();
}

describe("useVoiceRecognition Hook", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalSpeechRecognition = (window as any).SpeechRecognition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalWebkitSpeechRecognition = (window as any).webkitSpeechRecognition;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition = originalSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitSpeechRecognition = originalWebkitSpeechRecognition;
  });

  it("sets isSupported=false and voiceState='unsupported' when SpeechRecognition is not available", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition = undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitSpeechRecognition = undefined;

    const { result } = renderHook(() => useVoiceRecognition());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.voiceState).toBe("unsupported");
  });

  it("initializes and transitions to listening when startListening is called", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition = MockSpeechRecognition;

    const { result } = renderHook(() => useVoiceRecognition());

    expect(result.current.isSupported).toBe(true);
    expect(result.current.voiceState).toBe("idle");

    act(() => {
      result.current.startListening();
    });

    expect(result.current.voiceState).toBe("listening");
  });

  it("handles microphone permission denied error", () => {
    let activeInstance: MockSpeechRecognition | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition = class extends MockSpeechRecognition {
      constructor() {
        super();
        activeInstance = this;
      }
    };

    const { result } = renderHook(() => useVoiceRecognition());

    act(() => {
      result.current.startListening();
    });

    act(() => {
      if (activeInstance && activeInstance.onerror) {
        activeInstance.onerror({ error: "not-allowed" });
      }
    });

    expect(result.current.voiceState).toBe("error");
    expect(result.current.errorState?.code).toBe("permission-denied");
    expect(result.current.errorState?.message).toContain("Microphone access was denied");
  });

  it("processes interim and final speech recognition transcripts", () => {
    let activeInstance: MockSpeechRecognition | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition = class extends MockSpeechRecognition {
      constructor() {
        super();
        activeInstance = this;
      }
    };

    const onCommandFinalized = vi.fn();
    const { result } = renderHook(() => useVoiceRecognition({ onCommandFinalized }));

    act(() => {
      result.current.startListening();
    });

    // 1. Send interim result
    act(() => {
      if (activeInstance && activeInstance.onresult) {
        activeInstance.onresult({
          resultIndex: 0,
          results: [
            {
              isFinal: false,
              0: { transcript: "add two bottles of", confidence: 0.8 }
            }
          ]
        });
      }
    });

    expect(result.current.interimTranscript).toBe("add two bottles of");
    expect(onCommandFinalized).not.toHaveBeenCalled();

    // 2. Send final result
    act(() => {
      if (activeInstance && activeInstance.onresult) {
        activeInstance.onresult({
          resultIndex: 0,
          results: [
            {
              isFinal: true,
              0: { transcript: "add two bottles of milk", confidence: 0.96 }
            }
          ]
        });
      }
    });

    expect(result.current.finalTranscript).toBe("add two bottles of milk");
    expect(result.current.interimTranscript).toBe("");
    expect(onCommandFinalized).toHaveBeenCalledWith("add two bottles of milk");
  });

  it("speaks output message via SpeechSynthesis API", () => {
    const mockSpeak = vi.fn();
    window.speechSynthesis = {
      speak: mockSpeak,
      cancel: vi.fn(),
      speaking: false,
      getVoices: vi.fn().mockReturnValue([])
    } as unknown as SpeechSynthesis;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition = MockSpeechRecognition;

    const { result } = renderHook(() => useVoiceRecognition());

    act(() => {
      result.current.speak("Added milk to your list");
    });

    expect(mockSpeak).toHaveBeenCalled();
  });
});
