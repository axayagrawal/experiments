import { useCallback } from "react";
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

function BookSpine({ book, index }) {
  const color = PALETTE[index % PALETTE.length];
  const seed = book.title.length * 7 + index * 13;
  const styleVariant = index % 5;

  const minH = 300;
  const maxH = 440;
  const pageRatio = Math.min(book.pages / 500, 1);
  const height = minH + pageRatio * (maxH - minH);

  // Width proportional to page count: thinnest ~20px (short story), thickest ~65px (480pg)
  const minPages = 3;
  const maxPages = 480;
  const pageNorm = Math.min(Math.max((book.pages - minPages) / (maxPages - minPages), 0), 1);
  const width = 20 + pageNorm * 45;

  const direction = seededRandom(seed + 3) > 0.5 ? "vertical-rl" : "sideways-lr";

  const hasStripe = styleVariant === 0 || styleVariant === 4;
  const hasDot = styleVariant === 2;
  const hasTopLabel = styleVariant === 1 || styleVariant === 3;

  // Sticky note — show on ~25% of books, prefer 5-star and 4-star
  const stickyChance = book.rating >= 5 ? 0.8 : book.rating >= 4 ? 0.3 : 0.1;
  const hasSticky = seededRandom(seed + 7) < stickyChance;
  const stickyText = STICKY_NOTES[Math.floor(seededRandom(seed + 8) * STICKY_NOTES.length)];
  const stickyColor = STICKY_COLORS[Math.floor(seededRandom(seed + 9) * STICKY_COLORS.length)];
  const stickyRotation = -12 + seededRandom(seed + 10) * 24;
  const stickySide = seededRandom(seed + 11) > 0.5 ? "right" : "left";
  const stickyTop = 15 + seededRandom(seed + 12) * 30;

  const handleHover = useCallback(() => {
    playNote(index, books.length);
  }, [index]);

  return (
    <div className="book-wrapper" onMouseEnter={handleHover}>
      {/* Sticky note */}
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
        className="book-spine"
        style={{
          backgroundColor: color.bg,
          color: color.text,
          height: `${height}px`,
          width: `${width}px`,
        }}
        title={`${book.title} by ${book.author} — ${"★".repeat(book.rating)}${"☆".repeat(5 - book.rating)}`}
      >
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
  return (
    <div className="page">
      <div className="shelf">
        <div className="books-row">
          {books.map((book, i) => (
            <BookSpine key={book.title} book={book} index={i} />
          ))}
        </div>
        <div className="shelf-ledge" />
        <div className="shelf-shadow" />
      </div>
    </div>
  );
}

export default App;
