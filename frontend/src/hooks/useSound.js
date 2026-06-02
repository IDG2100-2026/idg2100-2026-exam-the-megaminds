import { useAppContext } from "@/context/AppContext";

const SOUNDS = {
    roll: { freq: 400, dur: 0.12, type: 'sine' },
    hold: { freq: 660, dur: 0.10, type: 'sine' },
    win: { freq: 880, dur: 0.90, type: 'sine' },
    lose: { freq: 280, dur: 0.70, type: 'sawtooth' },
    click: { freq: 520, dur: 0.08, type: 'sine' },
    timer: { freq: 330, dur: 0.15, type: 'square' },
};

export function useSound() {
    const { theme } = useAppContext();

    const play = (type) => {
        if (!theme.soundEnabled) return;
        const cfg = SOUNDS[type] || SOUNDS.click;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext) ();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = cfg.type;
            osc.frequency.value = cfg.freq;
            gain.gain.setValueAtTime(0.45, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + cfg.dur);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + cfg.dur);
        } catch {

        }
    };

    return { play };
}