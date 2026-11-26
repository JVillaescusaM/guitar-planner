"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Square,
  Check,
  ListMusic,
  Gauge,
  Volume2,
  VolumeX,
  Trophy,
  Star,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { doc, getDoc, setDoc, increment } from "firebase/firestore";
import { db } from "../../src/lib/firebase";
import {
  useApp,
  type Exercise,
  type ExerciseStats,
  type SessionRecord,
} from "../../src/context/AppContext";

interface WindowWithAudio extends Window {
  webkitAudioContext: typeof AudioContext;
}

const techniqueColors: Record<string, string> = {
  LIGADO: "bg-orange-500",
  PULGAR: "bg-amber-500",
  ALZAPUA: "bg-amber-700",
  PICADOS: "bg-red-500",
  "ARPEGIO CON PICADO": "bg-pink-500",
  ARPEGIO: "bg-emerald-500",
  TREMOLO: "bg-cyan-500",
  APERTURAS: "bg-indigo-500",
  RASGUEOS: "bg-purple-500",
  ESTUDIOS: "bg-slate-500",
  "GRUPOS DE ACORDES": "bg-lime-500",
};

const RANKS = [
  { name: "Querubín del Traste", minXp: 0 },
  { name: "Tocador de Aire", minXp: 150 },
  { name: "Buscador de Callos", minXp: 350 },
  { name: "Aprendiz del Metrónomo", minXp: 650 },
  { name: "Explorador de Cuerdas", minXp: 1000 },
  { name: "Alevín del Compás", minXp: 1500 },
  { name: "Forjador de Acordes", minXp: 2100 },
  { name: "Picapedrero de Escalas", minXp: 2800 },
  { name: "Caminante del Mástil", minXp: 3600 },
  { name: "Domador de Ligados", minXp: 4600 },
  { name: "Iniciado de la Cuerda", minXp: 5800 },
  { name: "Guardián del Tempo", minXp: 7200 },
  { name: "Artesano del Arpegio", minXp: 8800 },
  { name: "Jinete del Picado", minXp: 10600 },
  { name: "Escudero del Pulgar", minXp: 12600 },
  { name: "Promesa del Gremio", minXp: 15000 },
  { name: "Hechicero del Rasgueo", minXp: 17800 },
  { name: "Tejedor de Falsetas", minXp: 21000 },
  { name: "Ilusionista del Trémolo", minXp: 24600 },
  { name: "Oficial de la Púa", minXp: 28800 },
  { name: "Arquitecto del Sonido", minXp: 33600 },
  { name: "Centinela del Ritmo", minXp: 39000 },
  { name: "Guerrero del Alzapúa", minXp: 45000 },
  { name: "Sabio de la Soleá", minXp: 52000 },
  { name: "Jinete de la Bulería", minXp: 60000 },
  { name: "Titán de la Tensión", minXp: 69000 },
  { name: "Caballero del Apoyando", minXp: 79000 },
  { name: "Mago de la Dinámica", minXp: 90000 },
  { name: "Creador de Silencios", minXp: 102000 },
  { name: "Maestro de la Sonanta", minXp: 116000 },
  { name: "Tormenta de Semicorcheas", minXp: 132000 },
  { name: "Leyenda del Tablao", minXp: 150000 },
  { name: "Faraón del Compás", minXp: 172000 },
  { name: "Alma de Madera y Cuerda", minXp: 198000 },
  { name: "Virtuoso de la Cejilla", minXp: 230000 },
  { name: "Espíritu del Flamenco", minXp: 270000 },
  { name: "Genio de las Seis Cuerdas", minXp: 320000 },
  { name: "Duende Encarnado", minXp: 400000 },
  { name: "Mito Inmortal", minXp: 550000 },
  { name: "Virtuoso Semidiós", minXp: 1000000 },
];

export default function PracticePage() {
  const router = useRouter();
  const {
    activeExercise,
    setActiveExercise,
    activeSessionId,
    setActiveSessionId,
    updateSessionRecord,
    routine,
    sessionName,
    clearRoutine,
    addSessionRecord,
    sessionHistory,
  } = useApp();

  const [totalSessionTime, setTotalSessionTime] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [isPrep, setIsPrep] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(80);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [beat, setBeat] = useState<number>(0);
  const [maxBeats, setMaxBeats] = useState<number>(4);

  const [completedExercises, setCompletedExercises] = useState<
    Record<string, ExerciseStats>
  >({});
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [routineRating, setRoutineRating] = useState<number>(5);
  const [finalXP, setFinalXP] = useState<number>(0);
  const [bonusXPAccumulated, setBonusXPAccumulated] = useState<number>(0);
  const [calculatedTotalTime, setCalculatedTotalTime] = useState<number>(0);
  const [recordBpm, setRecordBpm] = useState<string>("");
  const [isTuning, setIsTuning] = useState<boolean>(false);

  // Refuerzo inmediato e intermitente
  const [globalAvgBpm, setGlobalAvgBpm] = useState<number | null>(null);
  const [prToast, setPrToast] = useState<{
    title: string;
    subtitle: string;
  } | null>(null);
  const [flashChallenge, setFlashChallenge] = useState<{
    exerciseId: string;
    targetBpm: number;
    bonusXp: number;
  } | null>(null);

  const [isLeftMenuOpen, setIsLeftMenuOpen] = useState(false);
  const [isRightMenuOpen, setIsRightMenuOpen] = useState(false);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);

  const [rankSummary, setRankSummary] = useState<{
    leveledUp: boolean;
    oldLevel: number;
    oldName: string;
    newLevel: number;
    newName: string;
    progressPercent: number;
  } | null>(null);

  const audioContext = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tuningOscillator = useRef<OscillatorNode | null>(null);
  const beatRef = useRef<number>(0);
  const sessionFinishedRef = useRef<boolean>(false);

  // Historial del ejercicio activo (últimos 8 intentos ordenados cronológicamente)
  const exerciseHistoryBpms = useMemo(() => {
    if (!activeExercise) return [];
    return sessionHistory
      .filter((r) => r.exerciseStats && r.exerciseStats[activeExercise.id]?.bpm)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-8)
      .map((r) => ({
        date: new Date(r.date).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
        }),
        bpm: r.exerciseStats![activeExercise.id].bpm,
      }));
  }, [activeExercise, sessionHistory]);

  const personalBestBpm = useMemo(() => {
    if (exerciseHistoryBpms.length === 0) return null;
    return Math.max(...exerciseHistoryBpms.map((item) => item.bpm));
  }, [exerciseHistoryBpms]);

  const lastAttemptBpm = useMemo(() => {
    if (exerciseHistoryBpms.length === 0) return null;
    return exerciseHistoryBpms[exerciseHistoryBpms.length - 1].bpm;
  }, [exerciseHistoryBpms]);

  // Progreso de la rutina (%)
  const completedCount = useMemo(
    () => routine.filter((ej) => !!completedExercises[ej.id]).length,
    [routine, completedExercises],
  );
  const routineProgressPercent = useMemo(() => {
    if (routine.length === 0) return 0;
    return Math.round((completedCount / routine.length) * 100);
  }, [completedCount, routine.length]);

  // Sonido agradable para Nuevo Récord Personal o Reto Superado
  const playSuccessChime = () => {
    try {
      if (!audioContext.current) {
        const WinAudio = window as unknown as WindowWithAudio;
        const AudioContextClass =
          window.AudioContext || WinAudio.webkitAudioContext;
        audioContext.current = new AudioContextClass();
      }
      if (audioContext.current.state === "suspended") {
        audioContext.current.resume().catch(() => {});
      }
      const ctx = audioContext.current;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.36);
      });
    } catch {
      /* ignore audio errors */
    }
  };

  // Cargar media global del ejercicio desde Firestore (`exerciseBenchmarks/{id}`)
  useEffect(() => {
    if (!activeExercise) return;
    let cancelled = false;
    const fetchBenchmark = async () => {
      try {
        const snap = await getDoc(
          doc(db, "exerciseBenchmarks", activeExercise.id),
        );
        if (!cancelled && snap.exists()) {
          const data = snap.data() as { totalBpmSum?: number; count?: number };
          if (data.count && data.count > 0 && data.totalBpmSum) {
            setGlobalAvgBpm(Math.round(data.totalBpmSum / data.count));
            return;
          }
        }
        if (!cancelled) setGlobalAvgBpm(null);
      } catch {
        if (!cancelled) setGlobalAvgBpm(null);
      }
    };
    fetchBenchmark();
    return () => {
      cancelled = true;
    };
  }, [activeExercise]);

  // Refuerzo intermitente: ~25% de probabilidad de Reto Relámpago al entrar a un ejercicio
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      if (!activeExercise || completedExercises[activeExercise.id]) {
        setFlashChallenge(null);
        return;
      }
      const baseBpm = lastAttemptBpm || activeExercise.recommendedBpm || 80;
      const roll = Math.random();
      if (roll < 0.25) {
        setFlashChallenge({
          exerciseId: activeExercise.id,
          targetBpm: Math.min(240, baseBpm + 4),
          bonusXp: 25,
        });
      } else {
        setFlashChallenge(null);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExercise?.id]);

  // Orientación móvil
  useEffect(() => {
    const updateOrientation = () => {
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      const portrait = window.matchMedia("(orientation: portrait)").matches;
      setIsPortraitMobile(mobile && portrait);
    };
    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);
    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  useEffect(() => {
    if (!activeExercise) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      if (lastAttemptBpm) {
        setBpm(lastAttemptBpm);
      } else {
        setBpm(activeExercise.recommendedBpm || 60);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeExercise, lastAttemptBpm]);

  // Snapshot para guardar progreso si sales sin acabar
  const stateSnapshot = useRef({
    activeSessionId,
    completedExercises,
    totalSessionTime,
    time,
    bpm,
    updateSessionRecord,
  });

  useEffect(() => {
    stateSnapshot.current = {
      activeSessionId,
      completedExercises,
      totalSessionTime,
      time,
      bpm,
      updateSessionRecord,
    };
  }, [
    activeSessionId,
    completedExercises,
    totalSessionTime,
    time,
    bpm,
    updateSessionRecord,
  ]);

  useEffect(() => {
    const saveProgressOnExit = () => {
      if (sessionFinishedRef.current) return;
      const snap = stateSnapshot.current;
      if (snap.activeSessionId) {
        snap.updateSessionRecord(snap.activeSessionId, {
          status: "Inacabada",
          durationSeconds: snap.totalSessionTime + snap.time,
          bpm: snap.bpm,
          exerciseStats: snap.completedExercises,
        });
      }
    };

    window.addEventListener("beforeunload", saveProgressOnExit);
    return () => {
      window.removeEventListener("beforeunload", saveProgressOnExit);
      saveProgressOnExit();
    };
  }, []);

  // Cargar progreso previo si reanudamos sesión
  useEffect(() => {
    if (routine.length === 0) return;
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      const prevCompleted: Record<string, ExerciseStats> = {};
      let prevTime = 0;

      if (activeSessionId) {
        const session = sessionHistory.find((s) => s.id === activeSessionId);
        if (session) {
          const rawData =
            session.exerciseStats || session.completedExercisesData || {};
          for (const [key, val] of Object.entries(rawData)) {
            if (typeof val === "number") {
              prevCompleted[key] = { bpm: val, timeSpent: 0, npm: val };
            } else {
              prevCompleted[key] = val as ExerciseStats;
            }
          }
          prevTime = session.durationSeconds || 0;
        }
      }

      setCompletedExercises(prevCompleted);
      setTotalSessionTime(prevTime);

      const isActiveValid =
        activeExercise && routine.some((ej) => ej.id === activeExercise.id);
      if (!isActiveValid && Object.keys(prevCompleted).length > 0) {
        const firstPending = routine.find((ej) => !prevCompleted[ej.id]);
        setActiveExercise(firstPending || routine[0]);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine, activeSessionId]);

  const remainingCount = routine.filter(
    (ej) => !completedExercises[ej.id],
  ).length;
  const isFinalPending =
    !!activeExercise &&
    !completedExercises[activeExercise.id] &&
    remainingCount === 1;

  const handleCompleteExercise = () => {
    if (!activeExercise) return;

    const parsedBpm = recordBpm === "" ? bpm : parseInt(recordBpm, 10);
    const finalBpm = Number.isNaN(parsedBpm) ? bpm : parsedBpm;
    const exerciseTime = isPrep ? 0 : time;
    const finalTime = totalSessionTime + exerciseTime;
    const npmCalculated = finalBpm * (activeExercise.subdivision || 1);

    // Actualizar media global de usuarios en segundo plano
    setDoc(
      doc(db, "exerciseBenchmarks", activeExercise.id),
      {
        totalBpmSum: increment(finalBpm),
        count: increment(1),
      },
      { merge: true },
    ).catch(() => {
      /* Si las reglas de Firestore aún no habilitan esta colección, no bloqueamos nada */
    });

    // Comprobar Nuevo Récord Personal (PR) y Reto Relámpago
    const isNewPR = personalBestBpm !== null && finalBpm > personalBestBpm;
    const beatChallenge =
      flashChallenge?.exerciseId === activeExercise.id &&
      finalBpm >= flashChallenge.targetBpm;

    let addedBonus = 0;
    if (beatChallenge && flashChallenge) {
      addedBonus += flashChallenge.bonusXp;
    }
    if (isNewPR) {
      addedBonus += 15;
    }

    if (isNewPR || beatChallenge) {
      playSuccessChime();
      setPrToast({
        title: beatChallenge
          ? "¡Reto Relámpago superado!"
          : `¡Nuevo Récord Personal: ${finalBpm} BPM!`,
        subtitle: beatChallenge
          ? `+${addedBonus} XP extra añadidos a tu sesión`
          : `Has subido +${finalBpm - (personalBestBpm || 0)} BPM (+15 XP)`,
      });
      setTimeout(() => setPrToast(null), 4000);
    }

    const newBonusTotal = bonusXPAccumulated + addedBonus;
    setBonusXPAccumulated(newBonusTotal);

    const newCompleted: Record<string, ExerciseStats> = {
      ...completedExercises,
      [activeExercise.id]: {
        bpm: finalBpm,
        timeSpent: exerciseTime,
        npm: npmCalculated,
      },
    };
    setCompletedExercises(newCompleted);

    const nextPending = routine.find((ej) => !newCompleted[ej.id]);
    const allDone = !nextPending;

    const totalMinutes = Math.floor(finalTime / 60);
    const earnedXP = totalMinutes * 10 + (allDone ? 50 : 0) + newBonusTotal;

    let currentSessionId = activeSessionId;
    const sessionUpdates: Partial<SessionRecord> = {
      status: allDone ? "Acabada" : "Inacabada",
      durationSeconds: finalTime,
      bpm: finalBpm,
      exerciseStats: newCompleted,
      totalXP: earnedXP,
    };

    if (currentSessionId) {
      updateSessionRecord(currentSessionId, sessionUpdates);
    } else {
      currentSessionId = addSessionRecord({
        technique: sessionName || "Sesión Extra",
        exercises: routine,
        ...sessionUpdates,
        bpm: finalBpm || 60,
        durationSeconds: finalTime || 0,
      });
      setActiveSessionId(currentSessionId);
    }

    if (!allDone && nextPending) {
      setTotalSessionTime(finalTime);
      setRecordBpm("");
      setTime(6);
      setIsPrep(true);
      setActiveExercise(nextPending);
    } else {
      sessionFinishedRef.current = true;
      setIsPlaying(false);
      setTimerActive(false);

      const previousXP = sessionHistory
        .filter((s) => s.id !== currentSessionId)
        .reduce((sum, s) => sum + (s.totalXP || 0), 0);
      const newTotalXP = previousXP + earnedXP;

      let oldIdx = 0;
      let newIdx = 0;
      for (let i = 0; i < RANKS.length; i++) {
        if (previousXP >= RANKS[i].minXp) oldIdx = i;
        if (newTotalXP >= RANKS[i].minXp) newIdx = i;
      }

      const curMin = RANKS[newIdx].minXp;
      const nextMin = RANKS[newIdx + 1]?.minXp || curMin + 10000;
      const progressPercent = Math.min(
        100,
        Math.max(
          0,
          Math.round(((newTotalXP - curMin) / (nextMin - curMin)) * 100),
        ),
      );

      setRankSummary({
        leveledUp: newIdx > oldIdx,
        oldLevel: oldIdx + 1,
        oldName: RANKS[oldIdx].name,
        newLevel: newIdx + 1,
        newName: RANKS[newIdx].name,
        progressPercent,
      });

      setCalculatedTotalTime(finalTime);
      setFinalXP(earnedXP);
      setShowSummary(true);
    }
  };

  const handleAbortSession = () => {
    if (
      confirm(
        "¿Quieres pausar y guardar el progreso actual para reanudar luego?",
      )
    ) {
      const finalTime = totalSessionTime + (isPrep ? 0 : time);
      const earnedXP = Math.floor(finalTime / 60) * 10 + bonusXPAccumulated;

      const sessionUpdates: Partial<SessionRecord> = {
        status: "Inacabada",
        durationSeconds: finalTime,
        bpm,
        exerciseStats: completedExercises,
        totalXP: earnedXP,
      };

      if (activeSessionId) {
        updateSessionRecord(activeSessionId, sessionUpdates);
      } else {
        addSessionRecord({
          technique: sessionName || "Sesión de Estudio",
          exercises: routine,
          ...sessionUpdates,
          bpm: bpm || 60,
          durationSeconds: finalTime || 0,
        });
      }
    }
    sessionFinishedRef.current = true;
    setIsPlaying(false);
    setActiveSessionId(null);
    stateSnapshot.current.activeSessionId = null;
    setTimerActive(false);
    setTime(0);
    clearRoutine();
    router.push("/");
  };

  // Cronómetro
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTime((prev) => {
        if (isPrep) {
          if (prev <= 1) {
            setIsPrep(false);
            return 0;
          }
          return prev - 1;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, isPrep]);

  // Metrónomo estable
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (!audioContext.current) {
      const WinAudio = window as unknown as WindowWithAudio;
      const AudioContextClass =
        window.AudioContext || WinAudio.webkitAudioContext;
      audioContext.current = new AudioContextClass();
    }
    if (audioContext.current.state === "suspended") {
      audioContext.current.resume().catch(() => {});
    }

    const playClick = () => {
      if (!audioContext.current) return;
      const currentBeat = beatRef.current;
      const osc = audioContext.current.createOscillator();
      const envelope = audioContext.current.createGain();
      osc.frequency.value = maxBeats > 0 && currentBeat === 0 ? 1050 : 780;
      envelope.gain.value = 0.8;
      envelope.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.current.currentTime + 0.08,
      );
      osc.connect(envelope);
      envelope.connect(audioContext.current.destination);
      osc.start();
      osc.stop(audioContext.current.currentTime + 0.08);

      setBeat(currentBeat);
      beatRef.current = maxBeats === 0 ? 0 : (currentBeat + 1) % maxBeats;
    };

    beatRef.current = 0;
    playClick();
    timerRef.current = setInterval(playClick, (60 / bpm) * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, bpm, maxBeats]);

  // Afinador LA 440Hz
  const toggleTuning = () => {
    if (isTuning) {
      if (tuningOscillator.current) {
        try {
          tuningOscillator.current.stop();
          tuningOscillator.current.disconnect();
        } catch {}
        tuningOscillator.current = null;
      }
      setIsTuning(false);
      return;
    }
    if (!audioContext.current) {
      const WinAudio = window as unknown as WindowWithAudio;
      const AudioContextClass =
        window.AudioContext || WinAudio.webkitAudioContext;
      audioContext.current = new AudioContextClass();
    }
    if (audioContext.current.state === "suspended") {
      audioContext.current.resume().catch(() => {});
    }
    const osc = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    osc.type = "sine";
    osc.frequency.value = 440;
    gainNode.gain.value = 0.15;
    osc.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    osc.start();
    tuningOscillator.current = osc;
    setIsTuning(true);
  };

  useEffect(() => {
    return () => {
      if (tuningOscillator.current) {
        try {
          tuningOscillator.current.stop();
        } catch {}
      }
    };
  }, []);

  const handleSelectExercise = (ej: Exercise) => {
    setActiveExercise(ej);
    setRecordBpm("");
    setIsPrep(true);
    setTime(6);
    setTimerActive(true);
    setIsLeftMenuOpen(false);
  };

  return (
    <div className="practice-room max-md:fixed max-md:left-0 max-md:right-0 max-md:top-14 max-md:bottom-0 max-md:z-20 flex flex-col md:flex-row h-full min-h-0 w-full bg-slate-50 text-slate-900 overflow-hidden font-sans relative">
      {/* Toast de Nuevo Récord / Reto Superado */}
      {prToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-bounce">
          <Sparkles size={18} />
          <div>
            <p className="text-xs font-bold leading-tight">{prToast.title}</p>
            <p className="text-[11px] text-emerald-100">{prToast.subtitle}</p>
          </div>
        </div>
      )}

      {isPortraitMobile && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-50 p-8 text-center md:hidden">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xs shadow-sm space-y-2">
            <h2 className="text-base font-bold text-slate-900">
              Gira el móvil en horizontal
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              La Sala de Práctica está optimizada para pantalla horizontal para
              leer mejor las partituras.
            </p>
          </div>
        </div>
      )}

      {/* 1. SIDEBAR IZQUIERDO: LISTA DE EJERCICIOS */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[min(75vw,18rem)] max-md:top-14 bg-white border-r border-slate-200 shadow-lg transition-transform duration-300 ease-in-out flex flex-col min-h-0
          md:static md:w-72 md:z-20 md:shadow-none md:translate-x-0 md:top-auto
          ${isLeftMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-4 border-b border-slate-200 shrink-0 space-y-2.5">
          <div>
            <span className="text-[11px] font-semibold text-indigo-600 block">
              Sesión activa
            </span>
            <h1 className="text-sm font-bold text-slate-900 truncate mt-0.5">
              {sessionName || "Sin sesión cargada"}
            </h1>
          </div>

          {routine.length > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold">
                <span className="text-slate-500">
                  {completedCount}/{routine.length} ejercicios
                </span>
                <span className="text-indigo-600 tabular-nums">
                  {routineProgressPercent}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${routineProgressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {sessionName && routine.length > 0 ? (
            routine.map((ej, index) => {
              const stats = completedExercises[ej.id];
              const isCompleted = !!stats;
              const isActive = activeExercise?.id === ej.id;

              return (
                <button
                  key={`${ej.id}-${index}`}
                  onClick={() => handleSelectExercise(ej)}
                  className={`w-full text-left rounded-xl overflow-hidden flex transition-all border cursor-pointer ${
                    isActive
                      ? "bg-indigo-50/80 border-indigo-400 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  } ${isCompleted ? "opacity-60" : ""}`}
                >
                  <div
                    className={`w-1.5 shrink-0 ${techniqueColors[ej.mainTechnique] || "bg-slate-400"}`}
                  />
                  <div className="p-3 flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-1 mb-1">
                      <span className="text-[11px] font-semibold text-slate-500 truncate">
                        <span className="text-indigo-600 mr-1">
                          {index + 1}.
                        </span>
                        {ej.mainTechnique}
                      </span>
                      {isCompleted && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 tabular-nums">
                          {stats.bpm} BPM ✓
                        </span>
                      )}
                    </div>
                    <h3
                      className={`font-semibold text-xs truncate ${
                        isCompleted
                          ? "line-through text-slate-400"
                          : "text-slate-900"
                      }`}
                    >
                      {ej.title}
                    </h3>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-slate-400">
              <ListMusic size={28} />
              <p className="text-xs font-medium">
                Elige una sesión en la Torre de Control o un ejercicio en la
                Biblioteca.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* 2. ÁREA CENTRAL: VISOR PDF + COCKPIT */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-100 relative z-10 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeExercise ? (
            <>
              <header className="border-b border-slate-200 bg-white shrink-0">
                <div className="h-11 flex items-center justify-between px-3 md:px-4 gap-2">
                  <button
                    onClick={() => setIsLeftMenuOpen(true)}
                    className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg shrink-0"
                    aria-label="Lista de ejercicios"
                  >
                    <ListMusic size={18} />
                  </button>

                  <h2 className="text-xs md:text-sm font-bold text-slate-900 truncate flex-1 text-center min-w-0">
                    {activeExercise.title}
                  </h2>

                  <div className="hidden md:flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full tabular-nums">
                      {routineProgressPercent}% completado
                    </span>
                  </div>

                  <button
                    onClick={() => setIsRightMenuOpen(true)}
                    className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg shrink-0"
                    aria-label="Metrónomo"
                  >
                    <Gauge size={18} />
                  </button>
                </div>

                {/* Barra fina de progreso visual en el borde inferior de la cabecera */}
                <div className="w-full h-1 bg-slate-100">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${routineProgressPercent}%` }}
                  />
                </div>
              </header>

              {/* Reto Relámpago (Refuerzo intermitente) */}
              {flashChallenge &&
                flashChallenge.exerciseId === activeExercise.id && (
                  <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 text-xs text-amber-900">
                      <Zap size={14} className="text-amber-600 shrink-0" />
                      <span>
                        <strong>Reto sorpresa:</strong> completa este ejercicio
                        a{" "}
                        <strong className="tabular-nums">
                          {flashChallenge.targetBpm} BPM
                        </strong>{" "}
                        o más para ganar{" "}
                        <strong>+{flashChallenge.bonusXp} XP extra</strong>.
                      </span>
                    </div>
                    <button
                      onClick={() => setBpm(flashChallenge.targetBpm)}
                      className="text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg cursor-pointer shrink-0 transition-colors"
                    >
                      Poner {flashChallenge.targetBpm} BPM
                    </button>
                  </div>
                )}

              <div className="flex-1 relative bg-slate-200/70">
                <iframe
                  src={`${activeExercise.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                  className="w-full h-full border-none bg-white"
                  title={activeExercise.title}
                />
              </div>
            </>
          ) : sessionName ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 overflow-y-auto">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-xs space-y-6">
                <div>
                  <span className="text-xs font-semibold text-indigo-600">
                    Preparación
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {sessionName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Afina tu guitarra antes de arrancar el cronómetro
                  </p>
                </div>

                <button
                  onClick={toggleTuning}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 border ${
                    isTuning
                      ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {isTuning ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  {isTuning ? "Detener LA 440Hz" : "Sonar LA 440Hz"}
                </button>

                <button
                  onClick={() => {
                    if (isTuning) toggleTuning();
                    setActiveExercise(routine[0]);
                    setIsPrep(true);
                    setTime(6);
                    setTimerActive(true);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-3.5 rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  Arrancar sesión
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-600">
                No hay ninguna sesión activa
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Ir a la Torre de Control
              </button>
            </div>
          )}
        </div>

        {/* FOOTER: COCKPIT */}
        <footer className="shrink-0 z-30 bg-white border-t border-slate-200 px-3 py-2.5 md:h-20 md:px-6 flex items-center justify-between gap-3">
          {sessionName && activeExercise ? (
            <>
              <div className="flex items-center gap-3 md:gap-5">
                <div className="flex flex-col items-center min-w-[3.75rem]">
                  <span
                    className={`font-mono text-xl md:text-2xl font-bold tabular-nums leading-none ${
                      isPrep
                        ? "text-amber-600 animate-pulse"
                        : timerActive
                          ? "text-emerald-600"
                          : "text-slate-700"
                    }`}
                  >
                    {Math.floor(time / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(time % 60).toString().padStart(2, "0")}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    {isPrep ? "Prep" : "Tiempo"}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setTimerActive(!timerActive)}
                    className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                      timerActive
                        ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                    title={timerActive ? "Pausar" : "Reanudar"}
                  >
                    {timerActive ? <Pause size={18} /> : <Play size={18} />}
                  </button>

                  <button
                    onClick={handleAbortSession}
                    className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white text-red-600 border border-slate-200 hover:bg-red-50 hover:border-red-200 flex items-center justify-center cursor-pointer transition-colors"
                    title="Pausar y salir"
                  >
                    <Square size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-500">
                    BPM logrados
                  </span>
                  <input
                    type="number"
                    placeholder={bpm.toString()}
                    value={recordBpm}
                    onChange={(e) => setRecordBpm(e.target.value)}
                    className="bg-transparent text-slate-900 font-bold text-base outline-none w-14 md:w-16 tabular-nums placeholder:text-slate-400"
                  />
                </div>
                <button
                  onClick={handleCompleteExercise}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs md:text-sm px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Check size={16} />
                  <span>{isFinalPending ? "Finalizar" : "Completar"}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-between items-center text-slate-400 text-xs">
              <span className="font-mono text-lg font-bold tabular-nums">
                00:00
              </span>
              <span>En espera de sesión</span>
            </div>
          )}
        </footer>
      </main>

      {/* 3. SIDEBAR DERECHO: METRÓNOMO + GRÁFICO DE EVOLUCIÓN */}
      <aside
        className={`
          fixed inset-y-0 right-0 z-50 w-[min(78vw,18.5rem)] max-md:top-14 bg-white p-5 border-l border-slate-200 shadow-lg transition-transform duration-300 ease-in-out flex flex-col min-h-0 overflow-y-auto custom-scrollbar gap-6
          md:static md:w-72 md:z-20 md:shadow-none md:translate-x-0 md:top-auto
          ${isRightMenuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Bloque Metrónomo */}
        <div className="flex flex-col items-center gap-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
            Metrónomo
          </h3>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full">
            {[0, 1, 2, 3, 4, 5].map((b) => (
              <button
                key={b}
                onClick={() => {
                  setMaxBeats(b);
                  setBeat(0);
                  beatRef.current = 0;
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  maxBeats === b
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {b === 0 ? "∞" : b}
              </button>
            ))}
          </div>

          <div className="flex gap-2.5 h-3 items-center">
            {maxBeats > 0 &&
              Array.from({ length: maxBeats }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-100 ${
                    beat === i && isPlaying
                      ? "bg-indigo-600 scale-125"
                      : "bg-slate-200"
                  }`}
                />
              ))}
          </div>

          <div className="text-center">
            <span className="text-5xl font-bold block text-slate-900 tabular-nums leading-none">
              {bpm}
            </span>
            <span className="text-xs font-semibold text-slate-400 mt-1 block">
              BPM
            </span>
          </div>

          <div className="w-full space-y-2.5">
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value, 10))}
              className="w-full cursor-pointer accent-indigo-600"
            />
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setBpm((b) => Math.max(40, b - 5))}
                className="py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
              >
                -5
              </button>
              <button
                onClick={() => setBpm((b) => Math.min(240, b + 2))}
                className="py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg cursor-pointer"
                title="Escalada rápida"
              >
                +2
              </button>
              <button
                onClick={() => setBpm((b) => Math.min(240, b + 5))}
                className="py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
              >
                +5
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-full py-3 rounded-xl font-semibold text-sm cursor-pointer transition-colors ${
              isPlaying
                ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {isPlaying ? "Detener" : "Iniciar metrónomo"}
          </button>
        </div>

        {/* Bloque Gráfico de Evolución + Media Global */}
        {activeExercise && (
          <div className="pt-5 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-600" />
                Tu evolución
              </span>
              {personalBestBpm && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full tabular-nums">
                  PR: {personalBestBpm}
                </span>
              )}
            </div>

            <ExerciseProgressChart
              history={exerciseHistoryBpms}
              globalAvg={globalAvgBpm}
              currentBpm={bpm}
            />

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2">
                <span className="text-[10px] font-medium text-slate-500 block">
                  Última vez
                </span>
                <span className="text-xs font-bold text-slate-900 tabular-nums">
                  {lastAttemptBpm ? `${lastAttemptBpm} BPM` : "—"}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2">
                <span className="text-[10px] font-medium text-slate-500 block">
                  Media global
                </span>
                <span className="text-xs font-bold text-amber-600 tabular-nums">
                  {globalAvgBpm ? `${globalAvgBpm} BPM` : "Sin datos"}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {(isLeftMenuOpen || isRightMenuOpen) && (
        <div
          className="fixed inset-0 bg-slate-900/30 z-40 md:hidden max-md:top-14"
          onClick={() => {
            setIsLeftMenuOpen(false);
            setIsRightMenuOpen(false);
          }}
        />
      )}

      {/* MODAL RESUMEN FINAL */}
      {showSummary && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="text-center border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Trophy size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                ¡Sesión completada!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tiempo total: {Math.floor(calculatedTotalTime / 60)}m{" "}
                {calculatedTotalTime % 60}s ·{" "}
                <span className="font-bold text-indigo-600">+{finalXP} XP</span>
              </p>
            </div>

            {rankSummary && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-700">
                    {rankSummary.leveledUp
                      ? `¡Ascenso a Nivel ${rankSummary.newLevel}: ${rankSummary.newName}!`
                      : `Nivel ${rankSummary.newLevel} · ${rankSummary.newName}`}
                  </span>
                  <span className="text-indigo-600 tabular-nums">
                    {rankSummary.progressPercent}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                    style={{ width: `${rankSummary.progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {routine.map((ej) => {
                const stats = completedExercises[ej.id];
                return (
                  <div
                    key={ej.id}
                    className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-slate-400 block">
                        {ej.mainTechnique}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate block">
                        {ej.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono text-xs tabular-nums">
                      <span className="text-slate-500">
                        {Math.floor((stats?.timeSpent || 0) / 60)}:
                        {String((stats?.timeSpent || 0) % 60).padStart(2, "0")}
                      </span>
                      <span className="font-bold text-indigo-600">
                        {stats?.bpm || 60} BPM
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                ¿Cómo has sentido esta sesión?
              </span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRoutineRating(star)}
                    className={`p-1 transition-transform hover:scale-110 cursor-pointer ${
                      star <= routineRating
                        ? "text-amber-400"
                        : "text-slate-300"
                    }`}
                  >
                    <Star
                      size={24}
                      fill={star <= routineRating ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={async () => {
                if (activeSessionId) {
                  await updateSessionRecord(activeSessionId, {
                    status: "Acabada",
                    rpe: routineRating,
                  });
                }
                setActiveSessionId(null);
                stateSnapshot.current.activeSessionId = null;
                clearRoutine();
                router.push("/");
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 rounded-xl cursor-pointer transition-colors"
            >
              Guardar y volver a inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// MINI-GRÁFICO SVG DE EVOLUCIÓN DE BPM + MEDIA GLOBAL
// =========================================================================
function ExerciseProgressChart({
  history,
  globalAvg,
  currentBpm,
}: {
  history: { date: string; bpm: number }[];
  globalAvg: number | null;
  currentBpm: number;
}) {
  if (history.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center">
        <p className="text-[11px] text-slate-400">
          Completa este ejercicio por primera vez para empezar tu gráfica de
          evolución.
        </p>
      </div>
    );
  }

  const width = 220;
  const height = 88;
  const padX = 14;
  const padY = 14;

  const allValues = [
    ...history.map((h) => h.bpm),
    ...(globalAvg ? [globalAvg] : []),
    currentBpm,
  ];
  const minVal = Math.min(...allValues) - 5;
  const maxVal = Math.max(...allValues) + 5;
  const range = Math.max(10, maxVal - minVal);

  const getY = (val: number) =>
    height - padY - ((val - minVal) / range) * (height - padY * 2);

  const points = history.map((item, idx) => {
    const x =
      history.length === 1
        ? width / 2
        : padX + (idx / (history.length - 1)) * (width - padX * 2);
    return { x, y: getY(item.bpm), ...item };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const avgY = globalAvg ? getY(globalAvg) : null;

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-24 overflow-visible"
      >
        {/* Línea punteada de media global */}
        {avgY !== null && (
          <g>
            <line
              x1={padX}
              y1={avgY}
              x2={width - padX}
              y2={avgY}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <text
              x={width - padX}
              y={avgY - 4}
              textAnchor="end"
              className="fill-amber-600 text-[9px] font-bold"
            >
              Media {globalAvg}
            </text>
          </g>
        )}

        {/* Línea de progreso del usuario */}
        {points.length > 1 && (
          <polyline
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />
        )}

        {/* Puntos */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={i === points.length - 1 ? 4 : 3}
              className={
                i === points.length - 1
                  ? "fill-indigo-600"
                  : "fill-white stroke-indigo-600"
              }
              strokeWidth="2"
            >
              <title>{`${p.date}: ${p.bpm} BPM`}</title>
            </circle>
          </g>
        ))}
      </svg>

      <div className="flex justify-between text-[10px] text-slate-400 px-1 mt-1">
        <span>{history[0].date}</span>
        <span>Último: {history[history.length - 1].bpm} BPM</span>
      </div>
    </div>
  );
}
