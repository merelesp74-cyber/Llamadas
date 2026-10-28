/**
 * Web Audio API synthesized tones for WebRTC calls (calling, ringing, connect, hangup)
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

let activeToneInterval: number | null = null;

/**
 * Plays an outbound telephone ringing tone (low-high pair beep ... silence ... beep)
 */
export function startOutgoingRing(): void {
  stopRingTones();
  const playTone = () => {
    try {
      const ctx = getAudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime); // 440 Hz
      osc2.frequency.setValueAtTime(480, ctx.currentTime); // 480 Hz

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + 1.2);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.3);
      osc2.stop(ctx.currentTime + 1.3);
    } catch (e) {
      // Audio playback restrictions fallback
    }
  };

  playTone();
  activeToneInterval = window.setInterval(playTone, 3000);
}

/**
 * Plays an incoming ringtone (melodic chime repeated)
 */
export function startIncomingRing(): void {
  stopRingTones();
  const playChime = () => {
    try {
      const ctx = getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
      });
    } catch (e) {
      // fallback
    }
  };

  playChime();
  activeToneInterval = window.setInterval(playChime, 2500);
}

/**
 * Stops any ongoing ringing tone
 */
export function stopRingTones(): void {
  if (activeToneInterval !== null) {
    clearInterval(activeToneInterval);
    activeToneInterval = null;
  }
}

/**
 * Play pleasant connect tone
 */
export function playConnectedTone(): void {
  stopRingTones();
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18); // A5

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

/**
 * Play hang up tone
 */
export function playHangupTone(): void {
  stopRingTones();
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch (e) {}
}

/**
 * Creates an Audio Volume Visualizer from a MediaStream
 */
export function createAudioLevelMeter(
  stream: MediaStream,
  onLevel: (level: number) => void
): () => void {
  try {
    const ctx = getAudioContext();
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return () => {};

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animId: number;

    const check = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      onLevel(Math.min(100, Math.round((avg / 128) * 100)));
      animId = requestAnimationFrame(check);
    };

    animId = requestAnimationFrame(check);

    return () => {
      cancelAnimationFrame(animId);
      try {
        source.disconnect();
      } catch (e) {}
    };
  } catch (e) {
    return () => {};
  }
}
