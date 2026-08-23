import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// Mock SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = "en-IN";
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onresult: (() => void) | null = null;
  start() {}
  stop() {}
  abort() {}
}

// Mock SpeechSynthesis
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn().mockReturnValue([])
};

Object.defineProperty(window, "SpeechRecognition", {
  writable: true,
  value: MockSpeechRecognition
});

Object.defineProperty(window, "webkitSpeechRecognition", {
  writable: true,
  value: MockSpeechRecognition
});

Object.defineProperty(window, "speechSynthesis", {
  writable: true,
  value: mockSpeechSynthesis
});

Object.defineProperty(window, "SpeechSynthesisUtterance", {
  writable: true,
  value: vi.fn()
});

// Mock Canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  clearRect: vi.fn(),
  createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  beginPath: vi.fn(),
  roundRect: vi.fn(),
  fill: vi.fn()
});

// Mock ResizeObserver for cmdk
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
