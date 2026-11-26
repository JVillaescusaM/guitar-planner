"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square, X, Music2 } from "lucide-react";
import {
  FlamencoAudioEngine,
  PALOS,
  type PaloId,
  type HitType,
} from "../lib/flamencoMetronome";

const STEP_LABELS_8 = ["1", "&", "2", "&", "3", "&", "4", "&"];

export default function FlamencoMetronomeModal({
  iconOnly = false,
}: {
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [paloId, setPaloId] = useState<PaloId>("tangoTrad");
  const [bpm, setBpm] = useState(110);
  const [swing, setSwing] = useState(PALOS.tangoTrad.defaultSwing);
  const [reverb, setReverb] = useState(0.25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  const engineRef = useRef<FlamencoAudioEngine | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paramsRef = useRef({ paloId, bpm, swing, isPlaying });

  useEffect(() => {
    paramsRef.current = { paloId, bpm, swing, isPlaying };
  }, [paloId, bpm, swing, isPlaying]);

  const getEngine = () => {
    if (!engineRef.current) {
      engineRef.current = new FlamencoAudioEngine();
    }
    return engineRef.current;
  };

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setReverb(reverb);
    }
  }, [reverb]);

  useEffect(() => {
    if (!isPlaying) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const engine = getEngine();
    engine.setReverb(reverb);
    let step = 0;

    const tick = () => {
      const {
        paloId: pId,
        bpm: curBpm,
        swing: curSwing,
        isPlaying: playing,
      } = paramsRef.current;
      if (!playing) return;

      const config = PALOS[pId];
      const safeStep = step % config.stepsPerBar;
      const hit = config.pattern[safeStep];

      engine.playHit(hit);
      setCurrentStep(safeStep);

      const beatMs = 60000 / curBpm;
      const isEighths = config.stepsPerBar === config.beatsPerBar * 2;
      let delayMs = beatMs;

      if (isEighths) {
        const halfBeat = beatMs / 2;
        delayMs =
          safeStep % 2 === 0
            ? halfBeat * (1 + curSwing)
            : halfBeat * (1 - curSwing);
      }

      step = (safeStep + 1) % config.stepsPerBar;
      timeoutRef.current = setTimeout(tick, Math.max(40, delayMs));
    };

    tick();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const handleClose = () => {
    setIsPlaying(false);
    setOpen(false);
  };

  const handleSelectPalo = (id: PaloId) => {
    setPaloId(id);
    setSwing(PALOS[id].defaultSwing);
    setCurrentStep(-1);
  };

  const testHit = (hit: HitType) => {
    const engine = getEngine();
    engine.setReverb(reverb);
    engine.playHit(hit);
  };

  const activeConfig = PALOS[paloId];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Laboratorio de Compás"
        className={
          iconOnly
            ? "p-2.5 md:p-3 rounded-xl transition-all flex items-center justify-center text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 cursor-pointer shrink-0"
            : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer"
        }
      >
        <Music2 size={iconOnly ? 20 : 14} />
        {!iconOnly && "Probar Compás"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[150] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Laboratorio de Compás
                </h2>
                <p className="text-xs text-slate-500">
                  Prueba de sonido, swing y reverb
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selector de Palo */}
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PALOS) as PaloId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => handleSelectPalo(id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    paloId === id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  {PALOS[id].label}
                </button>
              ))}
            </div>

            {/* Visualizador de pasos */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <div className="flex justify-between gap-1">
                {activeConfig.pattern.map((hit, idx) => {
                  const active = isPlaying && currentStep === idx;
                  const hasHit = hit !== null;
                  const label =
                    activeConfig.stepsPerBar === 8
                      ? STEP_LABELS_8[idx]
                      : activeConfig.id === "fandangosBasico"
                        ? String((idx % 3) + 1)
                        : String(idx + 1);

                  return (
                    <div
                      key={idx}
                      className={`flex-1 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                        active
                          ? "bg-indigo-600 text-white scale-105 shadow-xs"
                          : hasHit
                            ? "bg-white border border-slate-300 text-slate-800"
                            : "bg-slate-100/70 text-slate-300"
                      }`}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controles */}
            <div className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Velocidad</span>
                  <span className="text-indigo-600 tabular-nums">
                    {bpm} BPM
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={220}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Swing (soniquete)</span>
                  <span className="text-indigo-600 tabular-nums">
                    {Math.round(swing * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={22}
                  value={Math.round(swing * 100)}
                  onChange={(e) => setSwing(Number(e.target.value) / 100)}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Reverb (sala)</span>
                  <span className="text-indigo-600 tabular-nums">
                    {Math.round(reverb * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={Math.round(reverb * 100)}
                  onChange={(e) => setReverb(Number(e.target.value) / 100)}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Play / Stop */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                isPlaying
                  ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {isPlaying ? <Square size={16} /> : <Play size={16} />}
              {isPlaying ? "Detener" : "Escuchar compás"}
            </button>

            {/* Pads de prueba */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Probar golpes sueltos:
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {(
                  [
                    { id: "grave", label: "Bombo" },
                    { id: "fuerte", label: "Fuerte" },
                    { id: "seco", label: "Seco" },
                    { id: "medio", label: "Medio" },
                    { id: "flojo", label: "Flojo" },
                  ] as const
                ).map((pad) => (
                  <button
                    key={pad.id}
                    type="button"
                    onClick={() => testHit(pad.id)}
                    className="py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer active:scale-95 transition-all"
                  >
                    {pad.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
