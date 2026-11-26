import { DrumMachine } from "smplr";

export type PaloId =
  | "tangoTrad"
  | "rumba"
  | "modernoSwing"
  | "fandangosBasico"
  | "click";

export type HitType =
  | "grave"
  | "cuerpo"
  | "cuerpoSuave"
  | "fuerte"
  | "seco"
  | "secoEco"
  | "medio"
  | "flojo"
  | "muyFlojo"
  | "clickHi"
  | "clickLo"
  | null;

export interface PaloConfig {
  id: PaloId;
  label: string;
  stepsPerBar: number;
  beatsPerBar: number;
  defaultSwing: number;
  pattern: HitType[];
}

// Rejilla de 8 corcheas: [0]=1, [1]=1&, [2]=2, [3]=2&, [4]=3, [5]=3&, [6]=4, [7]=4&
export const PALOS: Record<PaloId, PaloConfig> = {
  tangoTrad: {
    id: "tangoTrad",
    label: "Tango tradicional",
    stepsPerBar: 8,
    beatsPerBar: 4,
    defaultSwing: 0.08,
    pattern: ["grave", null, "fuerte", null, "flojo", null, "fuerte", null],
  },
  rumba: {
    id: "rumba",
    label: "Rumba",
    stepsPerBar: 8,
    beatsPerBar: 4,
    defaultSwing: 0.06,
    pattern: ["grave", null, "medio", "medio", "seco", null, "fuerte", null],
  },
  modernoSwing: {
    id: "modernoSwing",
    label: "Moderno con swing",
    stepsPerBar: 8,
    beatsPerBar: 4,
    defaultSwing: 0.16,
    pattern: ["grave", null, null, "fuerte", null, null, "seco", null],
  },
  fandangosBasico: {
    id: "fandangosBasico",
    label: "Fandangos básico",
    stepsPerBar: 12,
    beatsPerBar: 12,
    defaultSwing: 0,
    pattern: [
      "cuerpo",
      "medio",
      "muyFlojo", // 1 (bombo fuerte), 2, 3
      "cuerpoSuave",
      "medio",
      "muyFlojo", // 4 (bombo suave), 5, 6
      "cuerpoSuave",
      "medio",
      "muyFlojo", // 7 (bombo suave), 8, 9
      "fuerte",
      "secoEco",
      null, // 10, 11 (seco + bombo suave + eco), 12
    ],
  },
  click: {
    id: "click",
    label: "Click clásico",
    stepsPerBar: 4,
    beatsPerBar: 4,
    defaultSwing: 0,
    pattern: ["clickHi", "clickLo", "clickLo", "clickLo"],
  },
};

function createRoomImpulse(
  ctx: AudioContext,
  duration = 0.5,
  decay = 3.0,
): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * duration);
  const preDelaySamples = Math.floor(ctx.sampleRate * 0.012);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      if (i < preDelaySamples) {
        data[i] = 0;
      } else {
        const env = Math.pow(
          1 - (i - preDelaySamples) / (length - preDelaySamples),
          decay,
        );
        data[i] = (Math.random() * 2 - 1) * env;
      }
    }
  }
  return impulse;
}

export class FlamencoAudioEngine {
  private ctx: AudioContext | null = null;
  private percBus: GainNode | null = null;
  private dryBus: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private drumsWet: DrumMachine | null = null;
  private drumsDry: DrumMachine | null = null;
  private isLoaded = false;
  private reverbAmount = 0.25;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();

      // Compresor suave en el master para pegada uniforme
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 10;
      compressor.ratio.value = 3.5;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.12;
      compressor.connect(this.ctx.destination);

      // Bus directo (para golpes secos y click)
      const dryBus = this.ctx.createGain();
      dryBus.gain.value = 1;
      dryBus.connect(compressor);

      // Bus con reverb de sala
      const percBus = this.ctx.createGain();
      const drySend = this.ctx.createGain();
      const wetGain = this.ctx.createGain();
      const convolver = this.ctx.createConvolver();
      const warmthFilter = this.ctx.createBiquadFilter();

      convolver.buffer = createRoomImpulse(this.ctx, 0.5, 3.0);
      warmthFilter.type = "lowpass";
      warmthFilter.frequency.value = 3000;

      drySend.gain.value = 1;
      wetGain.gain.value = this.reverbAmount;

      percBus.connect(drySend);
      drySend.connect(compressor);

      percBus.connect(convolver);
      convolver.connect(warmthFilter);
      warmthFilter.connect(wetGain);
      wetGain.connect(compressor);

      this.percBus = percBus;
      this.dryBus = dryBus;
      this.wetGain = wetGain;

      // Cargamos el kit LM-2 (LinnDrum: bombo con pegada + clap + rim + congas)
      this.drumsWet = new DrumMachine(this.ctx, {
        instrument: "LM-2",
        destination: percBus,
      });
      this.drumsDry = new DrumMachine(this.ctx, {
        instrument: "LM-2",
        destination: dryBus,
      });

      Promise.all([this.drumsWet.load, this.drumsDry.load])
        .then(() => {
          this.isLoaded = true;
          console.log("SONIDOS LM-2:", this.drumsWet?.getGroupNames());
        })
        .catch((err) => console.error("Error cargando smplr:", err));
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setReverb(amount: number) {
    this.reverbAmount = Math.max(0, Math.min(1, amount));
    if (this.wetGain && this.ctx) {
      this.wetGain.gain.setTargetAtTime(
        this.reverbAmount,
        this.ctx.currentTime,
        0.02,
      );
    }
  }

  private playClickSound(ctx: AudioContext, hi: boolean, t: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = hi ? 1100 : 800;
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.dryBus || ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playHit(hit: HitType, time?: number) {
    if (!hit) return;
    const ctx = this.ensureContext();
    const t = time ?? ctx.currentTime;

    if (hit === "clickHi" || hit === "clickLo") {
      this.playClickSound(ctx, hit === "clickHi", t);
      return;
    }

    if (!this.isLoaded || !this.drumsWet || !this.drumsDry) {
      // Mientras descarga el banco (~300ms la primera vez), no se queda mudo
      this.playClickSound(ctx, hit === "grave", t);
      return;
    }

    switch (hit) {
      case "grave":
        this.drumsWet.start({ note: "kick", velocity: 127, time: t });
        break;
      case "fuerte":
        this.drumsWet.start({ note: "clap", velocity: 120, time: t });
        break;
      case "seco":
        // Fuerte y seco: palma cortada + stick directo sin reverb
        this.drumsDry.start({
          note: "clap",
          velocity: 115,
          time: t,
          duration: 0.08,
        });
        this.drumsDry.start({ note: "stick", velocity: 90, time: t });
        break;
      case "medio":
        this.drumsWet.start({ note: "clap", velocity: 72, time: t });
        break;
      case "flojo":
        // Palma sorda / floja (sin bongo)
        this.drumsWet.start({
          note: "clap",
          velocity: 40,
          time: t,
          duration: 0.06,
        });
      case "cuerpo":
        // 1: Fuerte con bombo
        this.drumsWet.start({ note: "kick", velocity: 118, time: t });
        this.drumsWet.start({ note: "clap", velocity: 120, time: t });
        break;
      case "cuerpoSuave":
        // 4 y 7: Fuerte con un toque de bombo más flojo que el 1
        this.drumsWet.start({ note: "kick", velocity: 68, time: t });
        this.drumsWet.start({ note: "clap", velocity: 120, time: t });
        break;
      case "secoEco":
        // 11: Fuerte y seco + bombo suave + eco que cae en el 12
        this.drumsWet.start({ note: "kick", velocity: 68, time: t });
        this.drumsWet.start({
          note: "clap",
          velocity: 122,
          time: t,
          duration: 0.075,
        });
        this.drumsWet.start({ note: "stick", velocity: 95, time: t });
        break;
      case "medio":
        // 2, 5, 8: Normal
        this.drumsWet.start({ note: "clap", velocity: 75, time: t });
        break;
      case "muyFlojo":
        // 3, 6, 9: Milimétricamente más flojo que 'medio' (66 vs 75)
        this.drumsWet.start({ note: "clap", velocity: 66, time: t });
        break;
    }
  }
}
