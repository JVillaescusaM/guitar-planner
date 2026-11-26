import { DrumMachine } from "smplr";
export type PaloId =
  | "tangoTrad"
  | "rumba"
  | "modernoSwing"
  | "fandangosBasico"
  | "fandangosSoniquete"
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
  | "ta"
  | "taStaccato"
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

  fandangosSoniquete: {
    id: "fandangosSoniquete",
    label: "Fandangos (soniquete)",
    stepsPerBar: 72, // 12 tiempos x 6 (seisillos para que el ta-ca vaya rápido y pegado)
    beatsPerBar: 12,
    defaultSwing: 0,
    pattern: [
      // Compás 1: Bum ... ta-ca-tÁ ... ta-ca-tÁ (R)
      "cuerpo",
      null,
      null,
      null,
      "ta",
      "taStaccato",
      "medio",
      null,
      null,
      null,
      "ta",
      "taStaccato",
      "muyFlojo",
      null,
      null,
      null,
      null,
      null,
      // Compás 2
      "cuerpoSuave",
      null,
      null,
      null,
      "ta",
      "taStaccato",
      "medio",
      null,
      null,
      null,
      "ta",
      "taStaccato",
      "muyFlojo",
      null,
      null,
      null,
      null,
      null,
      // Compás 3
      "cuerpoSuave",
      null,
      null,
      null,
      "ta",
      "taStaccato",
      "medio",
      null,
      null,
      null,
      "ta",
      "taStaccato",
      "muyFlojo",
      null,
      null,
      null,
      null,
      null,
      // Compás 4: Bum ... ta-ca-tÁ (R)(R)
      "cuerpoSuave",
      null,
      null,
      null,
      "ta",
      "taStaccato",
      "secoEco",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
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
  private timerId: number | null = null;
  private nextNoteTime = 0;
  private currentStep = 0;
  private isRunning = false;
  private currentConfig: PaloConfig = PALOS.tangoTrad;
  private currentBpm = 120;
  private currentSwing = 0;
  private onStepCallback: ((step: number) => void) | null = null;
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
  public start(
    config: PaloConfig,
    bpm: number,
    swing: number,
    onStep?: (step: number) => void,
  ) {
    const ctx = this.ensureContext();
    this.stop();
    this.currentConfig = config;
    this.currentBpm = bpm;
    this.currentSwing = swing;
    this.onStepCallback = onStep ?? null;
    this.currentStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this.isRunning = true;
    this.timerId = window.setInterval(() => this.scheduler(), 25);
  }

  public updateParams(config: PaloConfig, bpm: number, swing: number) {
    this.currentConfig = config;
    this.currentBpm = bpm;
    this.currentSwing = swing;
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private scheduler() {
    if (!this.ctx || !this.isRunning) return;
    const scheduleAheadTime = 0.1; // 100ms de colchón

    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
      const stepsPerBar = this.currentConfig.stepsPerBar;
      const step = this.currentStep % stepsPerBar;
      const hit = this.currentConfig.pattern[step];

      if (hit) {
        this.playHit(hit, this.nextNoteTime);
      }

      // Solo refresca la UI en pulsos visibles (evita 72 renders por compás)
      const stepsPerBeat = stepsPerBar / this.currentConfig.beatsPerBar;
      if (
        this.onStepCallback &&
        (stepsPerBeat <= 2 || step % stepsPerBeat === 0)
      ) {
        const delayMs = Math.max(
          0,
          (this.nextNoteTime - this.ctx.currentTime) * 1000,
        );
        const uiStep = step;
        window.setTimeout(() => {
          if (this.isRunning) this.onStepCallback?.(uiStep);
        }, delayMs);
      }

      const beatSec = 60 / this.currentBpm;
      const stepSec = beatSec / stepsPerBeat;
      let dur = stepSec;

      if (stepsPerBeat === 2) {
        dur =
          step % 2 === 0
            ? stepSec * (1 + this.currentSwing)
            : stepSec * (1 - this.currentSwing);
      }

      this.nextNoteTime += dur;
      this.currentStep = (step + 1) % stepsPerBar;
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
        this.drumsDry.start({
          note: "clap",
          velocity: 115,
          time: t,
          duration: 0.08,
        });
        this.drumsDry.start({ note: "stick", velocity: 90, time: t });
        break;
      case "medio":
        this.drumsWet.start({ note: "clap", velocity: 75, time: t });
        break;
      case "flojo":
        this.drumsWet.start({
          note: "clap",
          velocity: 40,
          time: t,
          duration: 0.06,
        });
        break;
      case "muyFlojo":
        this.drumsWet.start({ note: "clap", velocity: 66, time: t });
        break;
      case "cuerpo":
        this.drumsWet.start({ note: "kick", velocity: 118, time: t });
        this.drumsWet.start({ note: "clap", velocity: 120, time: t });
        break;
      case "cuerpoSuave":
        this.drumsWet.start({ note: "kick", velocity: 68, time: t });
        this.drumsWet.start({ note: "clap", velocity: 120, time: t });
        break;
      case "secoEco":
        this.drumsWet.start({ note: "kick", velocity: 68, time: t });
        this.drumsWet.start({
          note: "clap",
          velocity: 122,
          time: t,
          duration: 0.075,
        });
        this.drumsWet.start({ note: "stick", velocity: 95, time: t });
        break;
      case "ta":
        this.drumsWet.start({
          note: "stick",
          velocity: 32,
          time: t,
          duration: 0.03,
        });
        break;
      case "taStaccato":
        this.drumsWet.start({
          note: "stick",
          velocity: 28,
          time: t,
          duration: 0.016,
        });
        break;
    }
  }
}
