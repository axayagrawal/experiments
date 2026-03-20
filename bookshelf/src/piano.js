// Jazz piano synth using Web Audio API
// Scale inspired by Bill Evans' voicings — Cmaj9 spread across the shelf

let audioCtx = null;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Jazz scale: C major pentatonic + some color tones (9ths, 6ths)
// Spread across 2 octaves so sweeping left-to-right feels like a piano run
const NOTES = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  493.88, // B4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  987.77, // B5
  1046.50, // C6
];

export function playNote(index, totalBooks) {
  const ctx = getContext();

  // Map book index to note — spread evenly across the scale
  const noteIndex = Math.floor((index / totalBooks) * NOTES.length);
  const freq = NOTES[Math.min(noteIndex, NOTES.length - 1)];

  // Piano-like tone: fundamental + soft harmonics
  const now = ctx.currentTime;

  // Main oscillator
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, now);

  // Soft harmonic for warmth
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(freq * 2, now);

  // Gain envelope — soft attack, gentle decay (like a felt piano)
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.02); // soft attack
  gain.gain.exponentialRampToValueAtTime(0.04, now + 0.3); // sustain
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2); // long decay

  // Harmonic gain — quieter
  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(0.02, now + 0.02);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  // Slight reverb-like effect with delay
  const delay = ctx.createDelay();
  delay.delayTime.setValueAtTime(0.12, now);
  const delayGain = ctx.createGain();
  delayGain.gain.setValueAtTime(0.03, now);

  // Connect
  osc.connect(gain);
  osc2.connect(gain2);
  gain.connect(ctx.destination);
  gain2.connect(ctx.destination);

  // Delay path
  gain.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(ctx.destination);

  osc.start(now);
  osc2.start(now);
  osc.stop(now + 1.5);
  osc2.stop(now + 1.0);
}
