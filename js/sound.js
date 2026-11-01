/* =====================================================================
   sound.js — tiny sound effects made with the Web Audio API
   ---------------------------------------------------------------------
   We have no audio files, so every sound is a short generated beep.
   (If you add .mp3 files later, you can swap these for Howler.js.)
   Usage: Sound.correct(), Sound.wrong(), Sound.tick(), ...
   ===================================================================== */

const Sound = (() => {
  let ctx = null;
  let enabled = true;

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Play one note: frequency (Hz), start delay (s), length (s), wave type, volume
  function tone(freq, start, dur, type = 'sine', vol = 0.15) {
    if (!enabled) return;
    const c = audio();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    const t = c.currentTime + start;
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  return {
    setEnabled(on) { enabled = on; },
    click() { tone(660, 0, 0.08, 'triangle', 0.08); },
    tick() { tone(880, 0, 0.05, 'square', 0.04); },
    go() { tone(523, 0, 0.12, 'triangle'); tone(784, 0.1, 0.2, 'triangle'); },
    correct() { [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.18, 'triangle', 0.18)); },
    // Wrong answers get a soft, gentle sound — never a harsh buzzer.
    wrong() { tone(392, 0, 0.18, 'sine', 0.12); tone(330, 0.16, 0.28, 'sine', 0.12); },
    pop() { tone(500, 0, 0.06, 'sine', 0.1); tone(750, 0.05, 0.08, 'sine', 0.1); },
    fanfare() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.16));
      tone(1047, 0.5, 0.7, 'triangle', 0.14);
    }
  };
})();

// Confetti helper (canvas-confetti is loaded from a CDN in index.html)
const Celebrate = {
  burst() { if (window.confetti) confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } }); },
  small() { if (window.confetti) confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 }, scalar: 0.8 }); },
  big() {
    if (!window.confetti) return;
    const end = Date.now() + 1500;
    (function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 } });
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }
};
