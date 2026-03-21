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

/* ── Stickers: emoji + short label, peeking from behind spines ── */
const STICKERS = [
  { emoji: "🔥", label: "hot" },
  { emoji: "💀", label: "dead" },
  { emoji: "😭", label: "cried" },
  { emoji: "🤯", label: "" },
  { emoji: "❤️", label: "fav" },
  { emoji: "🌙", label: "" },
  { emoji: "✨", label: "magic" },
  { emoji: "🫠", label: "" },
  { emoji: "💯", label: "" },
  { emoji: "🧠", label: "big brain" },
  { emoji: "☕", label: "cozy" },
  { emoji: "🎭", label: "" },
  { emoji: "👻", label: "spooky" },
  { emoji: "🪐", label: "" },
  { emoji: "📖", label: "re-read" },
  { emoji: "🎪", label: "wild" },
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

/* ── 2-3 sparkle stars that appear on hover ── */
function HoverSparkles({ isHovered, width, height, bgColor }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const sparklesRef = useRef(null);

  const pad = 15; // extra padding so sparkles can overflow edges
  const canvasW = width + pad * 2;
  const canvasH = height + pad * 2;

  // Pick new random positions each time hover starts
  useEffect(() => {
    if (!isHovered) {
      sparklesRef.current = null;
      return;
    }
    const count = 2 + Math.floor(Math.random() * 2); // 2 or 3
    const sparkles = [];
    for (let i = 0; i < count; i++) {
      // Position near edges so they straddle the spine boundary
      const edgeChance = Math.random();
      let x, y;
      if (edgeChance < 0.4) {
        // Near left/right edge
        x = Math.random() > 0.5 ? pad + Math.random() * 6 : pad + width - Math.random() * 6;
        y = pad + 20 + Math.random() * (height - 40);
      } else if (edgeChance < 0.7) {
        // Near top/bottom edge
        x = pad + Math.random() * width;
        y = Math.random() > 0.5 ? pad + Math.random() * 10 : pad + height - Math.random() * 10;
      } else {
        // Anywhere on spine
        x = pad + Math.random() * width;
        y = pad + 20 + Math.random() * (height - 40);
      }
      sparkles.push({
        x,
        y,
        maxSize: 4 + Math.random() * 6,
        delay: i * 0.15,
        speed: 1.5 + Math.random() * 1.5,
      });
    }
    sparklesRef.current = sparkles;
  }, [isHovered, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    ctx.scale(dpr, dpr);

    let startTime = performance.now();

    function draw(t) {
      ctx.clearRect(0, 0, canvasW, canvasH);
      const sparkles = sparklesRef.current;

      if (sparkles && isHovered) {
        const elapsed = (t - startTime) / 1000;

        for (const s of sparkles) {
          const adjustedTime = Math.max(0, elapsed - s.delay);
          if (adjustedTime <= 0) continue;

          // Single pulse: grow in, hold briefly, fade out, done
          const duration = 0.8 / s.speed;
          if (adjustedTime > duration) continue;
          const t01 = adjustedTime / duration;
          let scale;
          if (t01 < 0.25) {
            scale = t01 / 0.25;
          } else if (t01 < 0.5) {
            scale = 0.9 + Math.sin(t01 * 20) * 0.1;
          } else {
            scale = 1 - (t01 - 0.5) / 0.5;
          }

          const sz = s.maxSize * scale;
          const alpha = scale * 0.95;

          if (sz < 0.3) continue;

          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.shadowColor = `rgba(255,255,255,${alpha * 0.8})`;
          ctx.shadowBlur = sz * 4;

          // 4-point star
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
  }, [isHovered, width, height, canvasW, canvasH, bgColor]);

  return (
    <canvas
      ref={canvasRef}
      className="hover-sparkle-canvas"
      style={{ width: canvasW, height: canvasH }}
    />
  );
}

function BookSpine({ book, index, spineRef }) {
  const [isHovered, setIsHovered] = useState(false);
  const color = PALETTE[index % PALETTE.length];
  const seed = book.title.length * 7 + index * 13;

  const minH = 300;
  const maxH = 440;
  const pageRatio = Math.min(book.pages / 500, 1);
  const height = minH + pageRatio * (maxH - minH);

  const minPages = 3;
  const maxPages = 480;
  const pageNorm = Math.min(Math.max((book.pages - minPages) / (maxPages - minPages), 0), 1);
  const width = 20 + pageNorm * 45;

  // Consistent vertical text direction
  const direction = "vertical-rl";

  // Sticker — ~35% of books get one, peeking from behind
  const hasSticker = seededRandom(seed + 20) < 0.35;
  const sticker = STICKERS[Math.floor(seededRandom(seed + 21) * STICKERS.length)];
  const stickerSide = seededRandom(seed + 22) > 0.5 ? "right" : "left";
  const stickerTop = 10 + seededRandom(seed + 23) * 60; // % from top
  const stickerRotation = -15 + seededRandom(seed + 24) * 30;

  const handleEnter = useCallback(() => {
    setIsHovered(true);
    playNote(index, books.length);
  }, [index]);

  const handleLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <div className="book-wrapper" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <HoverSparkles isHovered={isHovered} width={width} height={height} bgColor={color.bg} />

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

        {/* Sticker half-peeking from edge of spine */}
        {hasSticker && (
          <div
            className={`spine-sticker sticker-${stickerSide}`}
            style={{
              top: `${stickerTop}%`,
              transform: `rotate(${stickerRotation}deg)`,
            }}
          >
            <span className="sticker-emoji">{sticker.emoji}</span>
          </div>
        )}

        {/* Stars always at top */}
        <div className="spine-stars" style={{ color: color.accent }}>
          {"★".repeat(book.rating)}
        </div>

        {/* Title centered */}
        <div className="spine-title" style={{ writingMode: direction }}>
          {book.title}
        </div>

        {/* Author always at bottom */}
        <div className="spine-author" style={{ writingMode: direction }}>
          {book.author.split(" ").pop()}
        </div>
      </div>
    </div>
  );
}

/* ── Pixel art cloud shapes (grid templates) ── */
const CLOUD_SHAPES = [
  // Large fluffy cloud
  {
    grid: [
      "    1111    ",
      "  11111111  ",
      " 1111111111 ",
      "111111111111",
      "111111111111",
      " 1111111111 ",
    ],
    shadow: [
      "            ",
      "            ",
      "            ",
      "            ",
      "  22222222  ",
      " 2222222222 ",
    ],
  },
  // Wide flat cloud
  {
    grid: [
      "   111111   ",
      " 111111111  ",
      "1111111111111",
      "1111111111111",
      " 11111111111 ",
    ],
    shadow: [
      "             ",
      "             ",
      "             ",
      " 2222222222  ",
      " 22222222222 ",
    ],
  },
  // Small puff
  {
    grid: [
      "  1111  ",
      " 111111 ",
      "11111111",
      "11111111",
      " 111111 ",
    ],
    shadow: [
      "        ",
      "        ",
      "        ",
      " 222222 ",
      " 222222 ",
    ],
  },
  // Tall cumulus
  {
    grid: [
      "   11   ",
      "  1111  ",
      " 111111 ",
      "11111111",
      "11111111",
      "11111111",
      " 111111 ",
    ],
    shadow: [
      "        ",
      "        ",
      "        ",
      "        ",
      "  2222  ",
      "22222222",
      " 222222 ",
    ],
  },
  // Wispy small
  {
    grid: [
      " 111  ",
      "111111",
      "111111",
      " 1111 ",
    ],
    shadow: [
      "      ",
      "      ",
      " 2222 ",
      " 2222 ",
    ],
  },
];

/* ── Pixel Sky with 8-bit clouds ── */
function PixelSky() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const pixelSize = 8; // size of each "pixel" block

    // Create cloud instances
    const clouds = [];
    for (let i = 0; i < 6; i++) {
      const shape = CLOUD_SHAPES[i % CLOUD_SHAPES.length];
      // Mix of sizes: some big, some small
      const sizeRoll = Math.random();
      const scale = sizeRoll < 0.3 ? 1.8 + Math.random() * 1.2 : 0.8 + Math.random() * 0.6;
      clouds.push({
        x: Math.random() * 1.5,
        y: 0.05 + Math.random() * 0.65,
        speed: 0.012 + Math.random() * 0.02,
        scale,
        shape,
      });
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

    function drawCloud(cloud, w) {
      const { shape, scale } = cloud;
      const px = Math.round(pixelSize * scale);
      const cx = cloud.x * w;
      const cy = cloud.y * window.innerHeight;

      // Draw shadow layer first (light blue)
      ctx.fillStyle = "#7CB8F7";
      for (let row = 0; row < shape.shadow.length; row++) {
        for (let col = 0; col < shape.shadow[row].length; col++) {
          if (shape.shadow[row][col] === "2") {
            ctx.fillRect(
              Math.round(cx + col * px),
              Math.round(cy + row * px + px * 0.5),
              px,
              px
            );
          }
        }
      }

      // Draw main cloud (white)
      ctx.fillStyle = "#FFFFFF";
      for (let row = 0; row < shape.grid.length; row++) {
        for (let col = 0; col < shape.grid[row].length; col++) {
          if (shape.grid[row][col] === "1") {
            ctx.fillRect(
              Math.round(cx + col * px),
              Math.round(cy + row * px),
              px,
              px
            );
          }
        }
      }

      // Light highlight on top pixels
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      const topRow = shape.grid[0];
      if (topRow) {
        for (let col = 0; col < topRow.length; col++) {
          if (topRow[col] === "1") {
            ctx.fillRect(
              Math.round(cx + col * px),
              Math.round(cy),
              px,
              Math.round(px * 0.4)
            );
          }
        }
      }
    }

    function draw() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (const cloud of clouds) {
        cloud.x -= cloud.speed / 100; // move right to left
        // Wrap: when fully off left, reappear from right
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
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="night-sky" />;
}

function App() {
  const spineRefs = useRef([]);

  return (
    <div className="page">
      <PixelSky />
      <h1 className="shelf-heading">
        <span className="heading-super">A Year in</span>
        <span className="heading-main">BOOKS OF<br />2025</span>
      </h1>
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
