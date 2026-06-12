// Synthesized sound effects via Web Audio API — no audio files needed.
// SSR-safe: AudioContext is only created on first user interaction in the browser.

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    return null;
  }
  return ctx;
}

// Pentatonic scale — ascending pitch per chain depth (marimba/ceramic feel).
const NOTES = [220, 261.6, 311.1, 369.9, 440, 523.3, 622.3, 740, 880, 1046.5];

function noise(c: AudioContext, dur: number): AudioBufferSourceNode {
  const len = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

/** Play on each match cascade. chain=1 for a basic match, higher for combos. */
export function playMatch(chain: number): void {
  const c = ac();
  if (!c) return;
  const now = c.currentTime;
  const idx = Math.min(chain - 1, NOTES.length - 1);
  const freq = NOTES[idx];

  // — Noise crunch (the "ceramic crack / rock crumble") —
  const crack = noise(c, 0.09);
  const bandpass = c.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 600 + chain * 180;
  bandpass.Q.value = 1.2;
  const crackGain = c.createGain();
  crackGain.gain.setValueAtTime(0.18, now);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  crack.connect(bandpass);
  bandpass.connect(crackGain);
  crackGain.connect(c.destination);
  crack.start(now);

  // — Tonal pop (pitch rises with combo depth) —
  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq * 1.6, now);
  osc.frequency.exponentialRampToValueAtTime(freq, now + 0.04);
  const oscGain = c.createGain();
  oscGain.gain.setValueAtTime(0.14, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc.connect(oscGain);
  oscGain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.18);
}

/** Soft whoosh when a valid swap is made. */
export function playSwap(): void {
  const c = ac();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.07);
  const g = c.createGain();
  g.gain.setValueAtTime(0.06, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.07);
}

/** Ascending shimmer when a level is completed. */
export function playLevelComplete(): void {
  const c = ac();
  if (!c) return;
  const now = c.currentTime;
  [0, 0.1, 0.2, 0.32, 0.46].forEach((offset, i) => {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = NOTES[i + 4];
    const g = c.createGain();
    g.gain.setValueAtTime(0, now + offset);
    g.gain.linearRampToValueAtTime(0.18, now + offset + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.35);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.35);
  });
}
