import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import {
  Mic,
  Sparkles,
  Search,
  History,
  Command,
  ChevronRight,
  ChevronLeft,
  X,
  Rocket,
  Volume2,
  Type,
  ListChecks,
  Lightbulb,
  Globe
} from "lucide-react";

const STORAGE_KEY = "voice-shopping-onboarding-complete";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  targetId: string;
  placement: "top" | "bottom" | "left" | "right";
  tip?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "🎙️ Voice Commands",
    description:
      "Tap this microphone and speak naturally — \"Add 2 bottles of milk\" or \"Remove apples from my list\".",
    icon: <Mic className="w-5 h-5" />,
    targetId: "mic-primary-button",
    placement: "right",
    tip: "Hold Spacebar anywhere for push-to-talk!"
  },
  {
    title: "🇮🇳 Hinglish Support",
    description:
      "The bilingual NLU engine resolves Hindi words automatically — doodh → milk, aloo → potato, pyaz → onion.",
    icon: <Globe className="w-5 h-5" />,
    targetId: "tour-nlu-badge",
    placement: "bottom"
  },
  {
    title: "📊 Live Audio Waveform",
    description:
      "Real-time mic amplitude rendered on canvas — not a fake animation, but actual audio data from AnalyserNode.",
    icon: <Volume2 className="w-5 h-5" />,
    targetId: "tour-waveform",
    placement: "bottom"
  },
  {
    title: "📝 Live Transcript",
    description:
      "See your speech transcribed in real-time. Interim results show in green, final results in bold — distinct styling so you always know the state.",
    icon: <Type className="w-5 h-5" />,
    targetId: "tour-transcript",
    placement: "bottom"
  },
  {
    title: "⌨️ Text Input",
    description:
      "Prefer typing? Same NLU parser, no mic required. Type any command like \"Find toothpaste under 5 dollars\".",
    icon: <Type className="w-5 h-5" />,
    targetId: "tour-text-input",
    placement: "top"
  },
  {
    title: "⚡ Quick Try Commands",
    description:
      "One-tap demo commands to test the parser instantly — English, Hinglish, search, and suggestions all covered.",
    icon: <Sparkles className="w-5 h-5" />,
    targetId: "tour-quick-try",
    placement: "top"
  },
  {
    title: "📋 Shopping List",
    description:
      "Your items auto-categorize, merge duplicates, and support quantity editing and mark-as-purchased.",
    icon: <ListChecks className="w-5 h-5" />,
    targetId: "tour-nav-list",
    placement: "top"
  },
  {
    title: "🔍 Product Search",
    description:
      "Browse the full catalog with category and price filters. Voice commands like \"Search for cheese\" switch here automatically.",
    icon: <Search className="w-5 h-5" />,
    targetId: "tour-nav-search",
    placement: "top"
  },
  {
    title: "💡 Smart Suggestions",
    description:
      "Ask \"What should I buy?\" for recommendations based on your current list — complementary items you might be missing.",
    icon: <Lightbulb className="w-5 h-5" />,
    targetId: "tour-nav-suggestions",
    placement: "top"
  },
  {
    title: "📜 Command History",
    description:
      "Every command logged with intent, confidence score, and timestamp. Great for debugging and auditing.",
    icon: <History className="w-5 h-5" />,
    targetId: "tour-nav-history",
    placement: "top"
  },
  {
    title: "⚡ Command Palette",
    description:
      "Press Ctrl+K (⌘K on Mac) for keyboard-only access to every feature — full parity with voice. Built for accessibility.",
    icon: <Command className="w-5 h-5" />,
    targetId: "tour-text-input",
    placement: "top",
    tip: "Try it now! Ctrl+K or ⌘K"
  }
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getElementRect(id: string): SpotlightRect | null {
  const el = document.getElementById(id);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

// Calculates tooltip position relative to the target rect
function calcTooltipPos(
  rect: SpotlightRect,
  placement: TourStep["placement"],
  tooltipW: number,
  tooltipH: number
): { top: number; left: number } {
  const PAD = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top = 0;
  let left = 0;

  switch (placement) {
    case "bottom":
      top = rect.top + rect.height + PAD;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
    case "top":
      top = rect.top - tooltipH - PAD;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
    case "right":
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left + rect.width + PAD;
      break;
    case "left":
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - PAD;
      break;
  }

  // Clamp to viewport
  if (left < 12) left = 12;
  if (left + tooltipW > vw - 12) left = vw - tooltipW - 12;
  if (top < 12) top = 12;
  if (top + tooltipH > vh - 12) top = vh - tooltipH - 12;

  return { top, left };
}

export function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [animating, setAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Show for first-time users
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        timer = setTimeout(() => setIsVisible(true), 900);
      }
    } catch {
      // storage unavailable
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Position the spotlight and tooltip whenever step changes
  const positionTour = useCallback(() => {
    if (!isVisible) return;
    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    const rect = getElementRect(step.targetId);
    if (!rect) return;

    // Scroll element into view if needed
    const el = document.getElementById(step.targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }

    // Small delay for scroll to settle
    requestAnimationFrame(() => {
      const freshRect = getElementRect(step.targetId);
      if (!freshRect) return;

      const SPOTLIGHT_PAD = 10;
      setSpotlight({
        top: freshRect.top - SPOTLIGHT_PAD,
        left: freshRect.left - SPOTLIGHT_PAD,
        width: freshRect.width + SPOTLIGHT_PAD * 2,
        height: freshRect.height + SPOTLIGHT_PAD * 2
      });

      // Measure tooltip
      const tw = tooltipRef.current?.offsetWidth ?? 340;
      const th = tooltipRef.current?.offsetHeight ?? 200;
      setTooltipPos(calcTooltipPos(freshRect, step.placement, tw, th));
    });
  }, [isVisible, currentStep]);

  // Re-position on step change
  useLayoutEffect(() => {
    positionTour();
  }, [positionTour]);

  // Re-position on resize/scroll
  useEffect(() => {
    if (!isVisible) return;
    const handler = () => positionTour();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [isVisible, positionTour]);

  const completeTour = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch { /* ignore */ }
    setIsVisible(false);
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      if (animating || idx < 0 || idx >= TOUR_STEPS.length) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrentStep(idx);
        setTimeout(() => setAnimating(false), 60);
      }, 180);
    },
    [animating]
  );

  const handleNext = useCallback(() => {
    if (currentStep >= TOUR_STEPS.length - 1) completeTour();
    else goTo(currentStep + 1);
  }, [currentStep, goTo, completeTour]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) goTo(currentStep - 1);
  }, [currentStep, goTo]);

  // Keyboard nav
  useEffect(() => {
    if (!isVisible) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); handleNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); handlePrev(); }
      else if (e.key === "Escape") { e.preventDefault(); completeTour(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isVisible, handleNext, handlePrev, completeTour]);

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  if (!step) return null;

  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <>
      {/* Full-screen overlay with spotlight cutout via box-shadow */}
      <div
        className="fixed inset-0 z-[9998] pointer-events-none"
        style={{ transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {spotlight && (
          <div
            className="absolute rounded-2xl"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              border: "2px solid rgba(142, 214, 41, 0.6)",
              pointerEvents: "none"
            }}
          />
        )}
      </div>

      {/* Click-capture backdrop (outside the spotlight) */}
      <div
        className="fixed inset-0 z-[9997]"
        onClick={completeTour}
        style={{ cursor: "default" }}
      />

      {/* Tooltip Card */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] w-[340px] max-w-[calc(100vw-24px)]"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: animating ? 0 : 1,
          transform: animating ? "scale(0.95) translateY(6px)" : "scale(1) translateY(0)"
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden">
          {/* Header bar */}
          <div className="bg-[#0C2B21] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-lime-400">
                {step.icon}
              </div>
              <span className="text-white font-bold text-sm tracking-tight">
                {step.title}
              </span>
            </div>
            <button
              type="button"
              onClick={completeTour}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition cursor-pointer"
              aria-label="Close tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-0.5 bg-slate-100">
            <div
              className="h-full bg-lime-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Body */}
          <div className="px-4 py-3.5 space-y-2.5">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              {step.description}
            </p>

            {step.tip && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/60">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] text-amber-800 font-medium leading-snug">
                  {step.tip}
                </span>
              </div>
            )}

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1 pt-0.5">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    i === currentStep
                      ? "w-5 h-1.5 bg-[#0C2B21]"
                      : i < currentStep
                      ? "w-1.5 h-1.5 bg-emerald-400"
                      : "w-1.5 h-1.5 bg-slate-200 hover:bg-slate-300"
                  }`}
                  aria-label={`Step ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-1">
              {!isFirst ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-700 transition cursor-pointer min-h-[36px] px-2.5 rounded-lg hover:bg-slate-100"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={completeTour}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 transition cursor-pointer min-h-[36px] px-2.5 rounded-lg hover:bg-slate-100"
                >
                  Skip
                </button>
              )}

              <span className="text-[10px] text-slate-300 font-bold ml-1">
                {currentStep + 1}/{TOUR_STEPS.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 min-h-[36px] rounded-full shadow-md transition-all cursor-pointer active:scale-95 ${
                isLast
                  ? "bg-lime-500 hover:bg-lime-400 text-[#0C2B21]"
                  : "bg-[#0C2B21] hover:bg-emerald-950 text-white"
              }`}
            >
              {isLast ? (
                <>
                  <Rocket className="w-3.5 h-3.5" />
                  Done!
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function resetOnboardingTour(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}
