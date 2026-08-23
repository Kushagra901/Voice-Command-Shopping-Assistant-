import { useEffect, useRef } from "react";

interface AudioWaveformProps {
  isListening: boolean;
  isSpeaking: boolean;
  className?: string;
  onAmplitudeChange?: (amplitude: number) => void;
}

export function AudioWaveform({
  isListening,
  isSpeaking,
  className = "w-full h-16",
  onAmplitudeChange
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let localAudioCtx: AudioContext | null = null;
    let localAnalyser: AnalyserNode | null = null;
    let localStream: MediaStream | null = null;

    if (isListening && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          localStream = stream;
          mediaStreamRef.current = stream;

          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioContextClass) {
            localAudioCtx = new AudioContextClass();
            audioContextRef.current = localAudioCtx;

            localAnalyser = localAudioCtx.createAnalyser();
            localAnalyser.fftSize = 64;
            analyserRef.current = localAnalyser;

            const source = localAudioCtx.createMediaStreamSource(stream);
            source.connect(localAnalyser);
          }
        })
        .catch(() => {
          // Fallback to simulated audio wave
        });
    }

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 32;
      const barWidth = width / barCount - 3;
      const middleY = height / 2;

      let frequencyData: Uint8Array | null = null;
      let totalAmp = 0;
      if (localAnalyser) {
        frequencyData = new Uint8Array(localAnalyser.frequencyBinCount);
        // justified: DOM standard AnalyserNode getByteFrequencyData call
        (localAnalyser.getByteFrequencyData as (array: Uint8Array) => void)(frequencyData);
      }

      for (let i = 0; i < barCount; i++) {
        let amplitude = 4; // Base height

        if (isListening && frequencyData) {
          const freqIndex = Math.floor((i / barCount) * frequencyData.length);
          const val = frequencyData[freqIndex] || 0;
          amplitude = Math.max(4, (val / 255) * (height - 8));
          totalAmp += val / 255;
        } else if (isListening) {
          // Simulated active voice wave
          amplitude = Math.max(4, Math.sin(phase + i * 0.35) * (height / 2.2) + Math.cos(phase * 1.5 + i * 0.2) * 6 + height / 3);
          totalAmp += amplitude / height;
        } else if (isSpeaking) {
          // Speaking harmonic pulse
          amplitude = Math.max(3, Math.sin(phase * 2 + i * 0.4) * (height / 2.8) + height / 3.5);
          totalAmp += amplitude / height;
        } else {
          // Idle breathing rhythm
          amplitude = Math.max(3, Math.sin(phase * 0.5 + i * 0.2) * 4 + 5);
        }

        const x = i * (barWidth + 3) + 2;
        const y = middleY - amplitude / 2;

        // Gradient styling
        const grad = ctx.createLinearGradient(0, y, 0, y + amplitude);
        if (isListening) {
          grad.addColorStop(0, "#db7040"); // Terracotta-500
          grad.addColorStop(0.5, "#3F6B4C"); // Sage-600
          grad.addColorStop(1, "#a4c4ad"); // Sage-300
        } else if (isSpeaking) {
          grad.addColorStop(0, "#34d399"); // Emerald-400
          grad.addColorStop(1, "#059669"); // Emerald-600
        } else {
          grad.addColorStop(0, "#475569"); // Slate-600
          grad.addColorStop(1, "#1e293b"); // Slate-800
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, amplitude, 3);
        ctx.fill();
      }

      if (onAmplitudeChange) {
        const norm = isListening ? totalAmp / barCount : isSpeaking ? 0.3 : 0;
        onAmplitudeChange(norm);
      }

      phase += 0.08;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (localAudioCtx && localAudioCtx.state !== "closed") {
        localAudioCtx.close().catch(() => {});
      }
    };
  }, [isListening, isSpeaking]);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-slate-900/60 border border-slate-800/80 px-2 py-1 ${className}`}>
      <canvas
        ref={canvasRef}
        width={320}
        height={56}
        className="w-full h-full block"
        aria-hidden="true"
      />
    </div>
  );
}
