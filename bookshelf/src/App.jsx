import { useCallback, useEffect, useRef, useState } from "react";
import { books } from "./books";
import { playNote } from "./piano";
import "./App.css";

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
];

const STICKY_NOTES = [
  "loved this!",
  "re-read?",
  "gift idea",
  "wow",
  "so good",
  "mind blown",
  "cried",
  "couldn't stop",
  "beautiful",
  "need sequel",
];

const STICKY_COLORS = [
  "#fff740",
  "#ff7eb3",
  "#7afcff",
  "#98fb98",
  "#ffb347",
  "#ff6b6b",
];

function seededRandom(seed) {
  let x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/* ── Generate multiple noise frames for animated grain ── */
let noiseFrames = null;
function getNoiseFrames() {
  if (noiseFrames) return noiseFrames;
  const size = 150;
  const frameCount = 12;
  noiseFrames = [];
  for (let f = 0; f < frameCount; f++) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const rand = Math.random();
      if (rand > 0.94) {
        // Bright glitter sparkle point — Eiffel Tower flash
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 180 + Math.random() * 75;
      } else {
        // Normal grain
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 40 + Math.random() * 80;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    noiseFrames.push(canvas.toDataURL("image/png"));
  }
  return noiseFrames;
}

/* ── Get sparkle color based on spine brightness ── */
function getSparkleRgb(bgHex) {
  const r = parseInt(bgHex.slice(1, 3), 16);
  const g = parseInt(bgHex.slice(3, 5), 16);
  const b = parseInt(bgHex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (brightness < 100) return [255, 255, 255];
  if (brightness < 160) return [255, 245, 220];
  return [60, 40, 20];
}

/* ── Single wandering sparkle that hops between books ── */
function WanderingSparkle({ spineRefs }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let currentBookIdx = Math.floor(Math.random() * books.length);
    let sparkleX = 0;
    let sparkleY = 0;
    let phase = 0; // 0 = growing, 1 = shrinking, 2 = waiting
    let progress = 0; // 0→1 within each phase
    let maxSize = 0;
    let sparkleColor = [255, 255, 255];
    let animId;

    function pickNewSparkle() {
      currentBookIdx = Math.floor(Math.random() * books.length);
      const spine = spineRefs.current[currentBookIdx];
      if (!spine) return false;
      const rect = spine.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      sparkleX = rect.left - canvasRect.left + Math.random() * rect.width;
      sparkleY = rect.top - canvasRect.top + Math.random() * rect.height;
      maxSize = 3 + Math.random() * 8; // random size 3-11px
      const bg = PALETTE[currentBookIdx % PALETTE.length].bg;
      sparkleColor = getSparkleRgb(bg);
      phase = 0;
      progress = 0;
      return true;
    }

    function resizeCanvas() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.scale(dpr, dpr);
    }

    resizeCanvas();
    pickNewSparkle();

    const growSpeed = 0.025;   // how fast it grows
    const shrinkSpeed = 0.03;  // how fast it fades
    const waitFrames = 20 + Math.random() * 40; // pause between sparkles
    let waitCounter = 0;

    function draw() {
      const parent = canvas.parentElement;
      if (!parent) { animId = requestAnimationFrame(draw); return; }
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;

      ctx.clearRect(0, 0, w, h);

      if (phase === 0) {
        // Growing
        progress += growSpeed;
        if (progress >= 1) { phase = 1; progress = 1; }
      } else if (phase === 1) {
        // Shrinking
        progress -= shrinkSpeed;
        if (progress <= 0) {
          phase = 2;
          waitCounter = 0;
        }
      } else {
        // Waiting, then pick new
        waitCounter++;
        if (waitCounter > waitFrames) {
          pickNewSparkle();
        }
        animId = requestAnimationFrame(draw);
        return;
      }

      const sz = maxSize * progress;
      const alpha = progress;
      const [r, g, b] = sparkleColor;

      if (sz > 0.5) {
        // Draw 4-point star
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

        // Glow
        ctx.shadowColor = `rgba(${r},${g},${b},${alpha * 0.6})`;
        ctx.shadowBlur = sz * 2;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [spineRefs]);

  return <canvas ref={canvasRef} className="wandering-sparkle-canvas" />;
}

/* ── Animated noise overlay — cycles through grain frames ── */
function NoiseOverlay() {
  const ref = useRef(null);

  useEffect(() => {
    const frames = getNoiseFrames();
    let frameIdx = 0;
    let lastTime = 0;
    let animId;

    function tick(t) {
      if (t - lastTime > 70) { // ~14fps shutter flicker
        frameIdx = (frameIdx + 1) % frames.length;
        if (ref.current) {
          ref.current.style.backgroundImage = `url(${frames[frameIdx]})`;
        }
        lastTime = t;
      }
      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return <div ref={ref} className="noise-overlay" />;
}

function BookSpine({ book, index, spineRef }) {
  const [isHovered, setIsHovered] = useState(false);
  const color = PALETTE[index % PALETTE.length];
  const seed = book.title.length * 7 + index * 13;
  const styleVariant = index % 5;

  const minH = 300;
  const maxH = 440;
  const pageRatio = Math.min(book.pages / 500, 1);
  const height = minH + pageRatio * (maxH - minH);

  const minPages = 3;
  const maxPages = 480;
  const pageNorm = Math.min(Math.max((book.pages - minPages) / (maxPages - minPages), 0), 1);
  const width = 20 + pageNorm * 45;

  const direction = seededRandom(seed + 3) > 0.5 ? "vertical-rl" : "sideways-lr";

  const hasStripe = styleVariant === 0 || styleVariant === 4;
  const hasDot = styleVariant === 2;
  const hasTopLabel = styleVariant === 1 || styleVariant === 3;

  const stickyChance = book.rating >= 5 ? 0.8 : book.rating >= 4 ? 0.3 : 0.1;
  const hasSticky = seededRandom(seed + 7) < stickyChance;
  const stickyText = STICKY_NOTES[Math.floor(seededRandom(seed + 8) * STICKY_NOTES.length)];
  const stickyColor = STICKY_COLORS[Math.floor(seededRandom(seed + 9) * STICKY_COLORS.length)];
  const stickyRotation = -12 + seededRandom(seed + 10) * 24;
  const stickySide = seededRandom(seed + 11) > 0.5 ? "right" : "left";
  const stickyTop = 15 + seededRandom(seed + 12) * 30;

  const handleEnter = useCallback(() => {
    setIsHovered(true);
    playNote(index, books.length);
  }, [index]);

  const handleLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <div className="book-wrapper" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {hasSticky && (
        <div
          className={`sticky-note sticky-${stickySide}`}
          style={{
            backgroundColor: stickyColor,
            transform: `rotate(${stickyRotation}deg)`,
            top: `${stickyTop}%`,
            [stickySide]: "-18px",
          }}
        >
          {stickyText}
        </div>
      )}

      <div
        ref={spineRef}
        className="book-spine"
        style={{
          backgroundColor: color.bg,
          color: color.text,
          height: `${height}px`,
          width: `${width}px`,
        }}
        title={`${book.title} by ${book.author} — ${"★".repeat(book.rating)}${"☆".repeat(5 - book.rating)}`}
      >
        <NoiseOverlay />

        {hasStripe && (
          <div
            className="spine-stripe"
            style={{ backgroundColor: color.accent }}
          />
        )}

        {hasTopLabel && (
          <div className="spine-top-label" style={{ color: color.accent }}>
            {"★".repeat(book.rating)}
          </div>
        )}

        <div className="spine-title" style={{ writingMode: direction }}>
          {book.title}
        </div>

        {hasDot && (
          <div className="spine-dot" style={{ backgroundColor: color.accent }} />
        )}

        <div className="spine-author" style={{ writingMode: direction }}>
          {book.author.split(" ").pop()}
        </div>
      </div>
    </div>
  );
}

function App() {
  const spineRefs = useRef([]);

  return (
    <div className="page">
      <div className="shelf">
        <div className="books-row">
          {books.map((book, i) => (
            <BookSpine
              key={book.title}
              book={book}
              index={i}
              spineRef={(el) => { spineRefs.current[i] = el; }}
            />
          ))}
        </div>
        <WanderingSparkle spineRefs={spineRefs} />
        <div className="shelf-ledge" />
        <div className="shelf-shadow" />
      </div>
    </div>
  );
}

export default App;
