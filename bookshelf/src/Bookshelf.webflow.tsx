import { useCallback, useEffect, useRef, useState } from "react";

/* ── DATA ── */
const books = [
  { title: "The Creative Act", author: "Rick Rubin", pages: 480, rating: 4 },
  { title: "No More Mr. Nice Guy", author: "Robert A. Glover", pages: 192, rating: 4 },
  { title: "Yellowface", author: "R.F. Kuang", pages: 319, rating: 4 },
  { title: "The Silent Patient", author: "Alex Michaelides", pages: 336, rating: 3 },
  { title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", pages: 320, rating: 3 },
  { title: "The Gentleman From Peru", author: "André Aciman", pages: 3, rating: 4 },
  { title: "The Book Of Clarity", author: "Paras Chopra", pages: 212, rating: 4 },
  { title: "Before the Coffee Gets Cold", author: "Toshikazu Kawaguchi", pages: 213, rating: 4 },
  { title: "The Hard Thing About Hard Things", author: "Ben Horowitz", pages: 304, rating: 4 },
  { title: "Ghachar Ghochar", author: "Vivek Shanbhag", pages: 118, rating: 3 },
  { title: "Tiny Experiments", author: "Anne-Laure Le Cunff", pages: 304, rating: 4 },
  { title: "Piranesi", author: "Susanna Clarke", pages: 245, rating: 4 },
  { title: "White Nights", author: "Fyodor Dostoevsky", pages: 240, rating: 4 },
  { title: "V for Vendetta", author: "Alan Moore", pages: 296, rating: 3 },
  { title: "Of Mice and Men", author: "John Steinbeck", pages: 107, rating: 4 },
  { title: "The Housekeeper and the Professor", author: "Yōko Ogawa", pages: 180, rating: 5 },
  { title: "The Memory Police", author: "Yōko Ogawa", pages: 274, rating: 4 },
  { title: "Hatching Twitter", author: "Nick Bilton", pages: 299, rating: 4 },
  { title: "The Fall", author: "Albert Camus", pages: 147, rating: 4 },
  { title: "Holes", author: "Louis Sachar", pages: 272, rating: 4 },
  { title: "Black Edge", author: "Sheelah Kolhatkar", pages: 295, rating: 5 },
  { title: "Company Of One", author: "Paul Jarvis", pages: 272, rating: 4 },
  { title: "Grief Is the Thing with Feathers", author: "Max Porter", pages: 114, rating: 4 },
  { title: "The Housemaid's Secret", author: "Freida McFadden", pages: 305, rating: 4 },
];

const PALETTE = [
  { bg: "#1a1a2e", text: "#e0e0e0", accent: "#e94560" },
  { bg: "#f4a261", text: "#1a1a1a", accent: "#264653" },
  { bg: "#e9c46a", text: "#1a1a1a", accent: "#2a9d8f" },
  { bg: "#264653", text: "#e9c46a", accent: "#e76f51" },
  { bg: "#2a9d8f", text: "#ffffff", accent: "#264653" },
  { bg: "#e76f51", text: "#ffffff", accent: "#264653" },
  { bg: "#606c38", text: "#fefae0", accent: "#dda15e" },
  { bg: "#283618", text: "#fefae0", accent: "#bc6c25" },
  { bg: "#dda15e", text: "#283618", accent: "#606c38" },
  { bg: "#fefae0", text: "#283618", accent: "#bc6c25" },
  { bg: "#003049", text: "#fcbf49", accent: "#eae2b7" },
  { bg: "#d62828", text: "#eae2b7", accent: "#003049" },
  { bg: "#f77f00", text: "#003049", accent: "#eae2b7" },
  { bg: "#fcbf49", text: "#003049", accent: "#d62828" },
  { bg: "#8338ec", text: "#ffffff", accent: "#ffbe0b" },
  { bg: "#3a86ff", text: "#ffffff", accent: "#ff006e" },
  { bg: "#ff006e", text: "#ffffff", accent: "#3a86ff" },
  { bg: "#ffbe0b", text: "#1a1a1a", accent: "#8338ec" },
  { bg: "#023047", text: "#8ecae6", accent: "#ffb703" },
  { bg: "#219ebc", text: "#023047", accent: "#ffb703" },
  { bg: "#fb8500", text: "#023047", accent: "#8ecae6" },
  { bg: "#6d6875", text: "#e5989b", accent: "#b5838d" },
  { bg: "#e5989b", text: "#1a1a1a", accent: "#6d6875" },
  { bg: "#1a1a2e", text: "#e0e0e0", accent: "#e94560" },
];

const STICKERS = [
  { emoji: "🔥" }, { emoji: "💀" }, { emoji: "😭" }, { emoji: "🤯" },
  { emoji: "❤️" }, { emoji: "🌙" }, { emoji: "✨" }, { emoji: "🫠" },
  { emoji: "💯" }, { emoji: "🧠" }, { emoji: "☕" }, { emoji: "🎭" },
  { emoji: "👻" }, { emoji: "🪐" }, { emoji: "📖" }, { emoji: "🎪" },
];

/* ── UTILS ── */
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function getSparkleRgb(bgHex: string): [number, number, number] {
  const r = parseInt(bgHex.slice(1, 3), 16);
  const g = parseInt(bgHex.slice(3, 5), 16);
  const b = parseInt(bgHex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (brightness < 100) return [255, 255, 255];
  if (brightness < 160) return [255, 245, 220];
  return [60, 40, 20];
}

/* ── PIANO ── */
let audioCtx: AudioContext | null = null;
const NOTES = [261.63, 293.66, 329.63, 392.00, 440.00, 493.88, 523.25,
               587.33, 659.25, 783.99, 880.00, 987.77, 1046.50];

function playNote(index: number, total: number) {
  if (typeof window === "undefined") return;
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const noteIndex = Math.floor((index / total) * NOTES.length);
  const freq = NOTES[Math.min(noteIndex, NOTES.length - 1)];
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, now);
  const osc2 = audioCtx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(freq * 2, now);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.04, now + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

  const gain2 = audioCtx.createGain();
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(0.02, now + 0.02);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  const delay = audioCtx.createDelay();
  delay.delayTime.setValueAtTime(0.12, now);
  const delayGain = audioCtx.createGain();
  delayGain.gain.setValueAtTime(0.03, now);

  osc.connect(gain); osc2.connect(gain2);
  gain.connect(audioCtx.destination); gain2.connect(audioCtx.destination);
  gain.connect(delay); delay.connect(delayGain); delayGain.connect(audioCtx.destination);
  osc.start(now); osc2.start(now);
  osc.stop(now + 1.5); osc2.stop(now + 1.0);
}

/* ── NOISE FRAMES (SSR-safe: guarded behind typeof document check) ── */
let noiseFrames: string[] | null = null;
function getNoiseFrames() {
  if (noiseFrames) return noiseFrames;
  if (typeof document === "undefined") return [];
  const size = 150, frameCount = 12;
  noiseFrames = [];
  for (let f = 0; f < frameCount; f++) {
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const rand = Math.random();
      if (rand > 0.94) {
        d[i] = 255; d[i+1] = 255; d[i+2] = 255;
        d[i+3] = 180 + Math.random() * 75;
      } else {
        const v = Math.random() * 255;
        d[i] = v; d[i+1] = v; d[i+2] = v;
        d[i+3] = 40 + Math.random() * 80;
      }
    }
    ctx.putImageData(img, 0, 0);
    noiseFrames.push(c.toDataURL("image/png"));
  }
  return noiseFrames;
}

/* ── CLOUD SHAPES ── */
const CLOUD_SHAPES = [
  { grid: ["    1111    ","  11111111  "," 1111111111 ","111111111111","111111111111"," 1111111111 "],
    shadow: ["            ","            ","            ","            ","  22222222  "," 2222222222 "] },
  { grid: ["   111111   "," 111111111  ","1111111111111","1111111111111"," 11111111111 "],
    shadow: ["             ","             ","             "," 2222222222  "," 22222222222 "] },
  { grid: ["  1111  "," 111111 ","11111111","11111111"," 111111 "],
    shadow: ["        ","        ","        "," 222222 "," 222222 "] },
  { grid: ["   11   ","  1111  "," 111111 ","11111111","11111111","11111111"," 111111 "],
    shadow: ["        ","        ","        ","        ","  2222  ","22222222"," 222222 "] },
  { grid: [" 111  ","111111","111111"," 1111 "],
    shadow: ["      ","      "," 2222 "," 2222 "] },
];

const CURSOR_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADpUlEQVR4nO2WTWhdRRTHfzP3zr3v5eslqRWxNCFVWr8KjZiiiwq6ciUuGsXkFVy5UncuRKG46dJdN34sRCNqVoKo1LhRF36T2FjFpB+pRYuSEEuTd9+9d+bI3BeLBB/Je4nBRf/w4N53Zub8zrlnzgxcV5uSd0cDma8+wRal2nI+ezyifPZ5guBZrJtB3Avq1olP2llLtzMJOz9EX+koXaZMb3wvSh9pax3aBSirAVbzPSQ5RLoG6tKOAYig6DCHCVSFXGAlW8bYmR0D4MvxbiIOE2kfPST5aZZ+P7NzAJW8n5o7SC2HLgMh36pDH6+0CxA2M8gHD8UM9t+EUqm6Y+K3a4bO0iFgkMSByTOc+potSDe1DPQdpWIm6Qlekfnqg9f+N+p+KpEmDqBuz/Nn/ZutAIRNLZG+jzgcoRx6RyWZHT2j7pq8TOJGcBn0GEjcd/z4zq//TQa0+oPcOZYTWM1HCMztsjC2D7ibmoXECmk2x3B1SL4f69t+AMdFtE6x4tNeJtL9iB6mLy4V9iupgDxCpE9RMSdl7rG92/sJQLOaClqBFYOwB8s+EqsR38S1JtAHCfyz2ksa/iJnq1PgLnPLW7OKYtQWMhAE0BNJcVwkeR3BofUR6rZxgojAVQtXc6FuQzqjZzDhm5Ti1zh/zO8UtgZgrfMuKYUQBz+Tu5RKvLuwFRn4x2zfEZO8BHIjHcEIzj0t58YGZXY0ah8AermameLJcQ6tdlPLbsCty6xWqgByNApzKfWfp0pgTtFZqrYFIHJcFw7jQLOaQ+puw+jHSV25KMr1h/jf78rD+NrE0B/vJw7H5fOHu1vPwKMvKgIMcaCwzkd5AOFO8vXhNwHxn6TYJFInc3HLAGoSSy5hUXA+IufA+XNQbe4CY9YKN82meOD9xZYB1pRhtCvCKopuk849sO+eRi+SBRtuR918ofwrQrVSHLmt3Nwcgtag5BKhXdhouG5qWalNcSX1EI2oNiM/zmhF5vuD/ZR88ULbAGr4vWWS7FWcq1MKfA1s3NsEoddvfXUBm72t9n9Ubxug0Ew+iaiTVKK8uHzIv6Si2HZrv45QkbplaulLJNlpNiG10QCZrnaySz9HEByjbgeKPtAAaTSgQPm0N25HiZ1jqX6CpGtC3fNyti0AXvLFeA+71JMo9RRwM6EyxczuSFjNhcytYvSHZHJCDb0+TQtSLd2Gfxg1lM0BrHoDrT8j1D+R20VyO01HvqAGJmutOL+u/4X+AigzfAEVJQATAAAAAElFTkSuQmCC";

/* ── INLINE STYLES ── */
const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center" as const,
    padding: "40px 40px 80px",
    justifyContent: "center" as const,
    position: "relative" as const,
    zIndex: 1,
    fontFamily: "'Space Grotesk', sans-serif",
    background: "#386AF5",
    cursor: `url(${CURSOR_PNG}) 16 0, pointer`,
  },
  sky: {
    position: "fixed" as const,
    top: 0, left: 0,
    width: "100%", height: "100%",
    zIndex: 0,
    pointerEvents: "none" as const,
  },
  heading: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center" as const,
    gap: 0,
    marginBottom: 36,
    textAlign: "center" as const,
  },
  headingSuper: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: "0.25em",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 8,
  },
  headingMain: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 72,
    fontWeight: 400,
    lineHeight: 0.95,
    color: "#fff",
    letterSpacing: "-0.02em",
    textTransform: "uppercase" as const,
  },
  shelf: {
    position: "relative" as const,
    width: "100%",
    maxWidth: 1200,
  },
  booksRow: {
    display: "flex",
    alignItems: "flex-end" as const,
    justifyContent: "center" as const,
    gap: 2,
    padding: "40px 20px 0",
    overflowX: "auto" as const,
  },
  ledge: {
    height: 8,
    background: "linear-gradient(to bottom, #2a3a6a, #1a2a4a)",
    borderRadius: "0 0 2px 2px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.03) inset",
  },
  shadow: {
    height: 30,
    background: "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.4) 0%, transparent 70%)",
  },
  bookWrapper: {
    position: "relative" as const,
    flexShrink: 0,
    display: "flex",
    alignItems: "flex-end" as const,
  },
  noise: {
    position: "absolute" as const,
    inset: 0,
    zIndex: 1,
    pointerEvents: "none" as const,
    backgroundSize: "200px 200px",
    backgroundRepeat: "repeat",
    opacity: 0.25,
    mixBlendMode: "overlay" as const,
    borderRadius: "inherit",
  },
  sparkleCanvas: {
    position: "absolute" as const,
    bottom: 0,
    left: -15,
    zIndex: 20,
    pointerEvents: "none" as const,
  },
  wanderingCanvas: {
    position: "absolute" as const,
    top: 0, left: 0,
    width: "100%", height: "100%",
    zIndex: 15,
    pointerEvents: "none" as const,
  },
  stickerEmoji: {
    fontSize: 20,
    lineHeight: 1,
    display: "block",
    background: "white",
    padding: 5,
    borderRadius: "50%",
    boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
  },
  spineStars: {
    fontSize: 6,
    letterSpacing: "0.02em",
    writingMode: "horizontal-tb" as const,
    flexShrink: 0,
    position: "relative" as const,
    zIndex: 2,
    marginBottom: 4,
  },
  spineTitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.04em",
    lineHeight: 1.15,
    textAlign: "center" as const,
    flex: 1,
    display: "flex",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: "4px 0",
    textTransform: "uppercase" as const,
    position: "relative" as const,
    zIndex: 2,
    writingMode: "vertical-rl" as const,
  },
  spineAuthor: {
    fontSize: 8,
    fontWeight: 400,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    opacity: 0.7,
    flexShrink: 0,
    textAlign: "center" as const,
    position: "relative" as const,
    zIndex: 2,
    marginTop: 4,
    writingMode: "vertical-rl" as const,
  },
};

/* ── COMPONENTS ── */

function NoiseOverlay() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frames = getNoiseFrames();
    let frameIdx = 0, lastTime = 0, animId: number;
    function tick(t: number) {
      if (t - lastTime > 70) {
        frameIdx = (frameIdx + 1) % frames.length;
        if (ref.current) ref.current.style.backgroundImage = `url(${frames[frameIdx]})`;
        lastTime = t;
      }
      animId = requestAnimationFrame(tick);
    }
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);
  return <div ref={ref} style={styles.noise} />;
}

function HoverSparkles({ isHovered, width, height }: { isHovered: boolean; width: number; height: number; bgColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const sparklesRef = useRef<any[] | null>(null);
  const pad = 15;
  const canvasW = width + pad * 2;
  const canvasH = height + pad * 2;

  useEffect(() => {
    if (!isHovered) { sparklesRef.current = null; return; }
    const count = 2 + Math.floor(Math.random() * 2);
    const sparkles = [];
    for (let i = 0; i < count; i++) {
      const edge = Math.random();
      let x, y;
      if (edge < 0.4) {
        x = Math.random() > 0.5 ? pad + Math.random() * 6 : pad + width - Math.random() * 6;
        y = pad + 20 + Math.random() * (height - 40);
      } else if (edge < 0.7) {
        x = pad + Math.random() * width;
        y = Math.random() > 0.5 ? pad + Math.random() * 10 : pad + height - Math.random() * 10;
      } else {
        x = pad + Math.random() * width;
        y = pad + 20 + Math.random() * (height - 40);
      }
      sparkles.push({ x, y, maxSize: 4 + Math.random() * 6, delay: i * 0.15, speed: 1.5 + Math.random() * 1.5 });
    }
    sparklesRef.current = sparkles;
  }, [isHovered, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    ctx.scale(dpr, dpr);
    const startTime = performance.now();

    function draw(t: number) {
      ctx.clearRect(0, 0, canvasW, canvasH);
      const sparkles = sparklesRef.current;
      if (sparkles && isHovered) {
        const elapsed = (t - startTime) / 1000;
        for (const s of sparkles) {
          const adj = Math.max(0, elapsed - s.delay);
          if (adj <= 0) continue;
          const dur = 0.8 / s.speed;
          if (adj > dur) continue;
          const t01 = adj / dur;
          let scale: number;
          if (t01 < 0.25) scale = t01 / 0.25;
          else if (t01 < 0.5) scale = 0.9 + Math.sin(t01 * 20) * 0.1;
          else scale = 1 - (t01 - 0.5) / 0.5;
          const sz = s.maxSize * scale;
          const alpha = scale * 0.95;
          if (sz < 0.3) continue;
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.shadowColor = `rgba(255,255,255,${alpha * 0.8})`;
          ctx.shadowBlur = sz * 4;
          ctx.beginPath();
          ctx.moveTo(s.x - sz * 2, s.y);
          ctx.lineTo(s.x - sz * 0.25, s.y - sz * 0.25);
          ctx.lineTo(s.x, s.y - sz * 2);
          ctx.lineTo(s.x + sz * 0.25, s.y - sz * 0.25);
          ctx.lineTo(s.x + sz * 2, s.y);
          ctx.lineTo(s.x + sz * 0.25, s.y + sz * 0.25);
          ctx.lineTo(s.x, s.y + sz * 2);
          ctx.lineTo(s.x - sz * 0.25, s.y + sz * 0.25);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      animRef.current = requestAnimationFrame(draw);
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [isHovered, width, height, canvasW, canvasH]);

  return <canvas ref={canvasRef} style={{ ...styles.sparkleCanvas, width: canvasW, height: canvasH }} />;
}

function WanderingSparkle({ spineRefs }: { spineRefs: React.MutableRefObject<(HTMLDivElement | null)[]> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let currentBookIdx = Math.floor(Math.random() * books.length);
    let sparkleX = 0, sparkleY = 0, phase = 2, progress = 0, maxSize = 0;
    let sparkleColor: [number, number, number] = [255, 255, 255];
    let animId: number;
    let waitCounter = 0;
    const waitFrames = 20 + Math.random() * 40;

    function pickNew() {
      currentBookIdx = Math.floor(Math.random() * books.length);
      const spine = spineRefs.current[currentBookIdx];
      if (!spine) return;
      const rect = spine.getBoundingClientRect();
      const cRect = canvas.getBoundingClientRect();
      sparkleX = rect.left - cRect.left + Math.random() * rect.width;
      sparkleY = rect.top - cRect.top + Math.random() * rect.height;
      maxSize = 3 + Math.random() * 8;
      sparkleColor = getSparkleRgb(PALETTE[currentBookIdx % PALETTE.length].bg);
      phase = 0; progress = 0;
    }

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.offsetWidth * dpr;
      canvas.height = parent.offsetHeight * dpr;
      canvas.style.width = parent.offsetWidth + "px";
      canvas.style.height = parent.offsetHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize(); pickNew();
    window.addEventListener("resize", resize);

    function draw() {
      const parent = canvas.parentElement;
      if (!parent) { animId = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, parent.offsetWidth, parent.offsetHeight);

      if (phase === 0) {
        progress += 0.025;
        if (progress >= 1) { phase = 1; progress = 1; }
      } else if (phase === 1) {
        progress -= 0.03;
        if (progress <= 0) { phase = 2; waitCounter = 0; }
      } else {
        waitCounter++;
        if (waitCounter > waitFrames) pickNew();
        animId = requestAnimationFrame(draw);
        return;
      }

      const sz = maxSize * progress;
      const alpha = progress;
      const [r, g, b] = sparkleColor;

      if (sz > 0.5) {
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.beginPath();
        ctx.moveTo(sparkleX - sz * 2, sparkleY);
        ctx.lineTo(sparkleX - sz * 0.3, sparkleY - sz * 0.3);
        ctx.lineTo(sparkleX, sparkleY - sz * 2);
        ctx.lineTo(sparkleX + sz * 0.3, sparkleY - sz * 0.3);
        ctx.lineTo(sparkleX + sz * 2, sparkleY);
        ctx.lineTo(sparkleX + sz * 0.3, sparkleY + sz * 0.3);
        ctx.lineTo(sparkleX, sparkleY + sz * 2);
        ctx.lineTo(sparkleX - sz * 0.3, sparkleY + sz * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = `rgba(${r},${g},${b},${alpha * 0.6})`;
        ctx.shadowBlur = sz * 2;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [spineRefs]);

  return <canvas ref={canvasRef} style={styles.wanderingCanvas} />;
}

function PixelSky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    const pixelSize = 8;

    const clouds: any[] = [];
    for (let i = 0; i < 6; i++) {
      const shape = CLOUD_SHAPES[i % CLOUD_SHAPES.length];
      const sizeRoll = Math.random();
      const scale = sizeRoll < 0.3 ? 1.8 + Math.random() * 1.2 : 0.8 + Math.random() * 0.6;
      clouds.push({ x: Math.random() * 1.5, y: 0.05 + Math.random() * 0.65, speed: 0.012 + Math.random() * 0.02, scale, shape });
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    function drawCloud(cloud: any, w: number) {
      const { shape, scale } = cloud;
      const px = Math.round(pixelSize * scale);
      const cx = cloud.x * w;
      const cy = cloud.y * window.innerHeight;

      ctx.fillStyle = "#7CB8F7";
      for (let r = 0; r < shape.shadow.length; r++)
        for (let c = 0; c < shape.shadow[r].length; c++)
          if (shape.shadow[r][c] === "2")
            ctx.fillRect(Math.round(cx + c * px), Math.round(cy + r * px + px * 0.5), px, px);

      ctx.fillStyle = "#FFFFFF";
      for (let r = 0; r < shape.grid.length; r++)
        for (let c = 0; c < shape.grid[r].length; c++)
          if (shape.grid[r][c] === "1")
            ctx.fillRect(Math.round(cx + c * px), Math.round(cy + r * px), px, px);

      ctx.fillStyle = "rgba(255,255,255,0.3)";
      const topRow = shape.grid[0];
      if (topRow)
        for (let c = 0; c < topRow.length; c++)
          if (topRow[c] === "1")
            ctx.fillRect(Math.round(cx + c * px), Math.round(cy), px, Math.round(px * 0.4));
    }

    function draw() {
      const w = window.innerWidth;
      ctx.clearRect(0, 0, w, window.innerHeight);
      for (const cloud of clouds) {
        cloud.x -= cloud.speed / 100;
        const cloudWidth = (cloud.shape.grid[0]?.length || 10) * pixelSize * cloud.scale;
        if (cloud.x * w + cloudWidth < -100) {
          cloud.x = 1.1 + Math.random() * 0.3;
          cloud.y = 0.05 + Math.random() * 0.65;
        }
        drawCloud(cloud, w);
      }
      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} style={styles.sky} />;
}

function BookSpine({ book, index, spineRef }: { book: typeof books[0]; index: number; spineRef: (el: HTMLDivElement | null) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const color = PALETTE[index % PALETTE.length];
  const seed = book.title.length * 7 + index * 13;

  const pageRatio = Math.min(book.pages / 500, 1);
  const height = 300 + pageRatio * 140;
  const pageNorm = Math.min(Math.max((book.pages - 3) / (480 - 3), 0), 1);
  const width = 20 + pageNorm * 45;

  const hasSticker = seededRandom(seed + 20) < 0.35;
  const sticker = STICKERS[Math.floor(seededRandom(seed + 21) * STICKERS.length)];
  const stickerSide = seededRandom(seed + 22) > 0.5 ? "right" : "left";
  const stickerTop = 10 + seededRandom(seed + 23) * 60;
  const stickerRot = -15 + seededRandom(seed + 24) * 30;

  const handleEnter = useCallback(() => { setIsHovered(true); playNote(index, books.length); }, [index]);
  const handleLeave = useCallback(() => { setIsHovered(false); }, []);

  const spineStyle: React.CSSProperties = {
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "8px 4px 12px",
    borderRadius: "2px 3px 1px 1px",
    cursor: "inherit",
    position: "relative",
    overflow: "hidden",
    transition: "transform 0.4s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s cubic-bezier(0.23,1,0.32,1)",
    boxShadow: isHovered
      ? "1px 0 0 rgba(255,255,255,0.1) inset, -1px 0 0 rgba(0,0,0,0.3) inset, 0 12px 32px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.3)"
      : "1px 0 0 rgba(255,255,255,0.04) inset, -1px 0 0 rgba(0,0,0,0.2) inset",
    transformOrigin: "bottom center",
    transform: isHovered ? "translateY(-16px) rotateX(-4deg) scale(1.02)" : "none",
    zIndex: isHovered ? 10 : "auto",
    backgroundColor: color.bg,
    color: color.text,
    height,
    width,
  };

  return (
    <div style={styles.bookWrapper} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <HoverSparkles isHovered={isHovered} width={width} height={height} bgColor={color.bg} />
      <div ref={spineRef} style={spineStyle} title={`${book.title} by ${book.author} — ${"★".repeat(book.rating)}${"☆".repeat(5 - book.rating)}`}>
        <NoiseOverlay />
        {hasSticker && (
          <div style={{
            position: "absolute",
            zIndex: 5,
            pointerEvents: "none",
            [stickerSide]: -12,
            top: `${stickerTop}%`,
            transform: `rotate(${stickerRot}deg)`,
          }}>
            <span style={styles.stickerEmoji}>{sticker.emoji}</span>
          </div>
        )}
        <div style={{ ...styles.spineStars, color: color.accent }}>{"★".repeat(book.rating)}</div>
        <div style={styles.spineTitle}>{book.title}</div>
        <div style={styles.spineAuthor}>{book.author.split(" ").pop()}</div>
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ── */
export default function Bookshelf() {
  const spineRefs = useRef<(HTMLDivElement | null)[]>([]);

  /*
   * Google Fonts: Add this to Webflow site's <head> custom code:
   * <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&family=Caveat:wght@400;600&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap" rel="stylesheet">
   */

  return (
    <div style={styles.wrap}>
      <PixelSky />
      <h1 style={styles.heading}>
        <span style={styles.headingSuper}>A Year in</span>
        <span style={styles.headingMain}>BOOKS OF<br />2025</span>
      </h1>
      <div style={styles.shelf}>
        <div style={styles.booksRow}>
          {books.map((book, i) => (
            <BookSpine key={book.title} book={book} index={i} spineRef={(el) => { spineRefs.current[i] = el; }} />
          ))}
        </div>
        <WanderingSparkle spineRefs={spineRefs} />
        <div style={styles.ledge} />
        <div style={styles.shadow} />
      </div>
    </div>
  );
}
