// Synthesized sound effects — marimba-style hits, no audio files needed.
// SSR-safe: AudioContext only lives in the browser.

const SOUND_KEY = "sol:sound";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SOUND_KEY) !== "off";
}

export function toggleSound(): boolean {
  const next = !isSoundEnabled();
  if (typeof window !== "undefined") localStorage.setItem(SOUND_KEY, next ? "on" : "off");
  return next;
}

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!isSoundEnabled()) return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    return null;
  }
  return ctx;
}

// Pentatonic scale — each chain depth triggers a higher note.
const NOTES = [196, 220, 261.6, 311.1, 369.9, 440, 523.3, 622.3, 740, 880];

function marimbaHit(c: AudioContext, freq: number, vol: number, when: number) {
  // Sharp noise transient — the "knock" of the mallet
  const transientLen = Math.ceil(c.sampleRate * 0.025);
  const tBuf = c.createBuffer(1, transientLen, c.sampleRate);
  const td = tBuf.getChannelData(0);
  for (let i = 0; i < transientLen; i++) td[i] = (Math.random() * 2 - 1) * (1 - i / transientLen);
  const transient = c.createBufferSource();
  transient.buffer = tBuf;
  const tFilter = c.createBiquadFilter();
  tFilter.type = "bandpass";
  tFilter.frequency.value = freq * 3;
  tFilter.Q.value = 2.5;
  const tGain = c.createGain();
  tGain.gain.setValueAtTime(vol * 1.6, when);
  tGain.gain.exponentialRampToValueAtTime(0.001, when + 0.025);
  transient.connect(tFilter);
  tFilter.connect(tGain);
  tGain.connect(c.destination);
  transient.start(when);

  // Fundamental — long warm ring
  const fund = c.createOscillator();
  fund.type = "sine";
  fund.frequency.value = freq;
  const fundGain = c.createGain();
  fundGain.gain.setValueAtTime(vol, when);
  fundGain.gain.exponentialRampToValueAtTime(0.001, when + 0.55);
  fund.connect(fundGain);
  fundGain.connect(c.destination);
  fund.start(when);
  fund.stop(when + 0.55);

  // Inharmonic overtone — gives marimba its woody character
  const overtone = c.createOscillator();
  overtone.type = "sine";
  overtone.frequency.value = freq * 3.92;
  const overGain = c.createGain();
  overGain.gain.setValueAtTime(vol * 0.45, when);
  overGain.gain.exponentialRampToValueAtTime(0.001, when + 0.09);
  overtone.connect(overGain);
  overGain.connect(c.destination);
  overtone.start(when);
  overtone.stop(when + 0.09);
}

/** Play on each match cascade. chain=1 basic match, higher = escalating combo. */
export function playMatch(chain: number): void {
  const c = ac();
  if (!c) return;
  const now = c.currentTime;
  const idx = Math.min(chain - 1, NOTES.length - 1);

  if (chain <= 2) {
    // Single hit — slight random detune so consecutive matches don't sound identical
    const detune = 0.97 + Math.random() * 0.06;
    marimbaHit(c, NOTES[idx] * detune, 0.22, now);
  } else {
    // Arpeggio — rapid cascade of ascending notes for satisfying combo crunch
    const count = Math.min(chain, 5);
    for (let i = 0; i < count; i++) {
      const noteIdx = Math.min(idx - count + 1 + i, NOTES.length - 1);
      marimbaHit(c, NOTES[Math.max(0, noteIdx)], 0.18, now + i * 0.055);
    }
  }
}

/** Soft woody tap when a valid swap fires. */
export function playSwap(): void {
  const c = ac();
  if (!c) return;
  const now = c.currentTime;
  marimbaHit(c, 280, 0.07, now);
}

/** Ascending shimmer across five notes when a level is completed. */
export function playLevelComplete(): void {
  const c = ac();
  if (!c) return;
  const now = c.currentTime;
  [0, 0.11, 0.22, 0.35, 0.5].forEach((offset, i) => {
    marimbaHit(c, NOTES[i + 4], 0.22, now + offset);
  });
}
