'use client';
import { useState, useEffect, useRef } from 'react';
import { useApp, type Exercise, type ExerciseStats, type SessionRecord } from '../../src/context/AppContext';
import { useRouter } from 'next/navigation';

interface WindowWithAudio extends Window {
  webkitAudioContext: typeof AudioContext;
}

const techniqueColors: Record<string, string> = {
  'LIGADO': 'bg-orange-500',
  'PULGAR': 'bg-yellow-600',
  'ALZAPUA': 'bg-amber-700',
  'PICADOS': 'bg-red-600',
  'ARPEGIO CON PICADO': 'bg-pink-500',
  'ARPEGIO': 'bg-emerald-500',
  'TREMOLO': 'bg-cyan-500',
  'APERTURAS': 'bg-indigo-500',
  'RASGUEOS': 'bg-purple-500',
  'ESTUDIOS': 'bg-slate-500',
  'GRUPOS DE ACORDES': 'bg-lime-500'
};

export default function Home() {
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
    sessionHistory 
  } = useApp();
  
  const [totalSessionTime, setTotalSessionTime] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [isPrep, setIsPrep] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(80);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [beat, setBeat] = useState<number>(0);
  const [maxBeats, setMaxBeats] = useState<number>(4);
  
  const [completedExercises, setCompletedExercises] = useState<Record<string, ExerciseStats>>({});
 const [showSummary, setShowSummary] = useState<boolean>(false);
  const [routineRating, setRoutineRating] = useState<number>(5);
  const [finalXP, setFinalXP] = useState<number>(0);
  const [calculatedTotalTime, setCalculatedTotalTime] = useState<number>(0);
  
  // 🌟 ESTADOS PARA LA FIESTA Y EL CÁLCULO PROPORCIONAL DE XP
  interface RankData {
    level: number;
    name: string;
    minXp: number;
    maxXp: number;
    color: string;
  }
  const [leveledUpData, setLeveledUpData] = useState<{old: RankData, new: RankData, startPercent: number, newEndPercent: number} | null>(null);
  const [normalXpData, setNormalXpData] = useState<{startPercent: number, endPercent: number, minXp: number, maxXp: number} | null>(null);


  // 🏆 DICCIONARIO DE RANGOS (Copiado de tu Perfil para que la Sala sepa leerlos)
  const RANKS = [
    { name: 'Querubín del Traste', minXp: 0, color: 'text-slate-400' },
    { name: 'Tocador de Aire', minXp: 150, color: 'text-gray-400' },
    { name: 'Buscador de Callos', minXp: 350, color: 'text-zinc-400' },
    { name: 'Aprendiz del Metrónomo', minXp: 650, color: 'text-neutral-400' },
    { name: 'Explorador de Cuerdas', minXp: 1000, color: 'text-stone-400' },
    { name: 'Alevín del Compás', minXp: 1500, color: 'text-lime-500' },
    { name: 'Forjador de Acordes', minXp: 2100, color: 'text-lime-400' },
    { name: 'Picapedrero de Escalas', minXp: 2800, color: 'text-green-400' },
    { name: 'Caminante del Mástil', minXp: 3600, color: 'text-green-500' },
    { name: 'Domador de Ligados', minXp: 4600, color: 'text-emerald-400' },
    { name: 'Iniciado de la Cuerda', minXp: 5800, color: 'text-emerald-500' },
    { name: 'Guardián del Tempo', minXp: 7200, color: 'text-teal-400' },
    { name: 'Artesano del Arpegio', minXp: 8800, color: 'text-teal-500' },
    { name: 'Jinete del Picado', minXp: 10600, color: 'text-cyan-400' },
    { name: 'Escudero del Pulgar', minXp: 12600, color: 'text-cyan-500' },
    { name: 'Promesa del Gremio', minXp: 15000, color: 'text-sky-400' },
    { name: 'Hechicero del Rasgueo', minXp: 17800, color: 'text-sky-500' },
    { name: 'Tejedor de Falsetas', minXp: 21000, color: 'text-blue-400' },
    { name: 'Ilusionista del Trémolo', minXp: 24600, color: 'text-blue-500' },
    { name: 'Oficial de la Púa', minXp: 28800, color: 'text-indigo-400' },
    { name: 'Arquitecto del Sonido', minXp: 33600, color: 'text-indigo-500' },
    { name: 'Centinela del Ritmo', minXp: 39000, color: 'text-violet-400' },
    { name: 'Guerrero del Alzapúa', minXp: 45000, color: 'text-violet-500' },
    { name: 'Sabio de la Soleá', minXp: 52000, color: 'text-purple-400' },
    { name: 'Jinete de la Bulería', minXp: 60000, color: 'text-purple-500' },
    { name: 'Titán de la Tensión', minXp: 69000, color: 'text-fuchsia-400' },
    { name: 'Caballero del Apoyando', minXp: 79000, color: 'text-fuchsia-500' },
    { name: 'Mago de la Dinámica', minXp: 90000, color: 'text-pink-400' },
    { name: 'Creador de Silencios', minXp: 102000, color: 'text-pink-500' },
    { name: 'Maestro de la Sonanta', minXp: 116000, color: 'text-rose-400' },
    { name: 'Tormenta de Semicorcheas', minXp: 132000, color: 'text-rose-500' },
    { name: 'Leyenda del Tablao', minXp: 150000, color: 'text-red-400' },
    { name: 'Faraón del Compás', minXp: 172000, color: 'text-red-500' },
    { name: 'Alma de Madera y Cuerda', minXp: 198000, color: 'text-orange-400' },
    { name: 'Virtuoso de la Cejilla', minXp: 230000, color: 'text-orange-500' },
    { name: 'Espíritu del Flamenco', minXp: 270000, color: 'text-amber-400' },
    { name: 'Genio de las Seis Cuerdas', minXp: 320000, color: 'text-amber-500' },
    { name: 'Duende Encarnado', minXp: 400000, color: 'text-yellow-400' },
    { name: 'Mito Inmortal', minXp: 550000, color: 'text-yellow-500' },
    { name: 'Virtuoso Semidiós', minXp: 1000000, color: 'text-yellow-300' }
  ];
  
  const audioContext = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tuningOscillator = useRef<OscillatorNode | null>(null);

  const [recordBpm, setRecordBpm] = useState<string>('');
  const [isTuning, setIsTuning] = useState<boolean>(false);

  // 🧠 MOTOR DE MEMORIA DE VELOCIDAD POR EJERCICIO (INTEGRADO SIN RENDERIZADO EN CASCADA)
  useEffect(() => {
    if (!activeExercise) return;

    Promise.resolve().then(() => {
      // 1. Buscamos en el historial sesiones que contengan estadísticas de este ejercicio exacto
      const pastRecords = sessionHistory.filter(
        (record) => record.exerciseStats && record.exerciseStats[activeExercise.id]
      );

      if (pastRecords.length > 0) {
        // Ordenamos las sesiones de la más reciente a la más antigua
        const sortedRecords = [...pastRecords].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        // Extraemos la velocidad exacta de la última sesión guardada
        const lastSavedBpm = sortedRecords[0].exerciseStats?.[activeExercise.id]?.bpm;
        
        if (lastSavedBpm) {
          setBpm(lastSavedBpm);
          console.log(`🤖 Memoria Activa: Cargando últimos BPM guardados (${lastSavedBpm} BPM) para el ejercicio ${activeExercise.id}`);
          return;
        }
      }

      // 2. Si no hay historial, aplicamos el BPM recomendado de tu base de datos
      if (activeExercise.recommendedBpm) {
        setBpm(activeExercise.recommendedBpm);
        console.log(`🎼 Primera Sesión: Cargando BPM recomendado por el Maestro (${activeExercise.recommendedBpm} BPM)`);
      } else {
        // 3. Fallback de resguardo por seguridad
        setBpm(60);
      }
    });
  }, [activeExercise, sessionHistory]);

  const currentIndex = routine.findIndex(ej => ej.id === activeExercise?.id);
  const isLast = currentIndex === routine.length - 1 || currentIndex === -1;

  const playNext = () => { if (!isLast) setActiveExercise(routine[currentIndex + 1]); };
  
  const stateSnapshot = useRef({
    activeSessionId, completedExercises, totalSessionTime, time, bpm, updateSessionRecord
  });

  useEffect(() => {
    stateSnapshot.current = {
      activeSessionId, completedExercises, totalSessionTime, time, bpm, updateSessionRecord
    };
  }, [activeSessionId, completedExercises, totalSessionTime, time, bpm, updateSessionRecord]);

  useEffect(() => {
    const saveProgressOnExit = () => {
      const snap = stateSnapshot.current;
      if (snap.activeSessionId) {
        snap.updateSessionRecord(snap.activeSessionId, {
          status: 'Inacabada',
          durationSeconds: snap.totalSessionTime + snap.time,
          bpm: snap.bpm,
          exerciseStats: snap.completedExercises
        });
      }
    };

    window.addEventListener('beforeunload', saveProgressOnExit);
    return () => {
      window.removeEventListener('beforeunload', saveProgressOnExit);
      saveProgressOnExit();
    };
  }, []);

useEffect(() => {
    if (routine.length > 0) {
      Promise.resolve().then(() => {
        const prevCompleted: Record<string, ExerciseStats> = {};
        let prevTime = 0;

        if (activeSessionId) {
          const session = sessionHistory.find(s => s.id === activeSessionId);
          if (session) {
            const rawData = session.exerciseStats || session.completedExercisesData || {};
            for (const [key, val] of Object.entries(rawData)) {
              if (typeof val === 'number') {
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

        const isActiveExerciseValid = activeExercise && routine.some(ej => ej.id === activeExercise.id);
        
        if (!isActiveExerciseValid) {
          if (Object.keys(prevCompleted).length > 0) {
            const firstPending = routine.find(ej => !prevCompleted[ej.id]);
            setActiveExercise(firstPending || routine[0]);
          } else {
            setActiveExercise(null);
          }
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine, activeSessionId]); 

  const handleCompleteExercise = () => {
    if (!activeExercise) return;
    
    const finalBpm = recordBpm === '' ? bpm : parseInt(recordBpm);
    const exerciseTime = isPrep ? 0 : time;
    const finalTime = totalSessionTime + exerciseTime;
    
    const npmCalculated = finalBpm * (activeExercise.subdivision || 1);

    const newCompleted = {
      ...completedExercises,
      [activeExercise.id]: {
        bpm: finalBpm,
        timeSpent: exerciseTime,
        npm: npmCalculated
      }
    };
    
    setCompletedExercises(newCompleted);

    const totalMinutes = Math.floor(finalTime / 60);
    const earnedXP = (totalMinutes * 10) + (isLast ? 50 : 0);

    let currentSessionId = activeSessionId;
    const sessionUpdates: Partial<SessionRecord> = {
      status: isLast ? 'Acabada' : 'Inacabada',
      durationSeconds: finalTime,
      bpm: finalBpm,
      exerciseStats: newCompleted,
      totalXP: earnedXP
    };
    
    if (currentSessionId) {
      updateSessionRecord(currentSessionId, sessionUpdates);
    } else {
      currentSessionId = addSessionRecord({
        technique: sessionName || 'Sesión Extra',
        ...sessionUpdates,
        bpm: sessionUpdates.bpm || finalBpm || 60,
        durationSeconds: sessionUpdates.durationSeconds || finalTime || 0
      }) as string;
      setActiveSessionId(currentSessionId);
    }

    if (!isLast) {
      setTotalSessionTime(finalTime); 
      setRecordBpm('');
      setTime(6);
      setIsPrep(true);
      playNext();
    } else {
      // 🧠 MOTOR DE CÁLCULO DE NOMBRES Y RANGOS
      const previousXP = sessionHistory
        .filter(s => s.id !== currentSessionId)
        .reduce((sum, s) => sum + (s.totalXP || 0), 0);
      
      const newTotalXP = previousXP + earnedXP;

      let oldRankIndex = 0;
      let newRankIndex = 0;
      
      for (let i = 0; i < RANKS.length; i++) {
        if (previousXP >= RANKS[i].minXp) oldRankIndex = i;
        if (newTotalXP >= RANKS[i].minXp) newRankIndex = i;
      }

      // 🧮 MATEMÁTICAS PROPORCIONALES (Calculamos "El Hueco" del rango antiguo)
      const oldRankMin = RANKS[oldRankIndex].minXp;
      const oldRankMax = RANKS[oldRankIndex + 1]?.minXp || oldRankMin + 10000;
      const oldBracket = oldRankMax - oldRankMin;
      // Porcentaje en el que estaba la barra ANTES de la sesión
      const startPercent = Math.max(0, Math.min(100, ((previousXP - oldRankMin) / oldBracket) * 100));

      if (newRankIndex > oldRankIndex) {
        // 🌟 HAY SUBIDA DE NIVEL
        const newRankMin = RANKS[newRankIndex].minXp;
        const newRankMax = RANKS[newRankIndex + 1]?.minXp || newRankMin + 10000;
        const newBracket = newRankMax - newRankMin;
        // Porcentaje en el que se quedará la barra en el NUEVO nivel tras estallar
        const newEndPercent = Math.max(0, Math.min(100, ((newTotalXP - newRankMin) / newBracket) * 100));

        setLeveledUpData({ 
          old: { ...RANKS[oldRankIndex], level: oldRankIndex + 1, maxXp: oldRankMax }, 
          new: { ...RANKS[newRankIndex], level: newRankIndex + 1, maxXp: newRankMax },
          startPercent,
          newEndPercent
        });
        setNormalXpData(null);
      } else {
        // 🔹 DÍA NORMAL (Se mueve dentro de "su" hueco)
        const endPercent = Math.max(0, Math.min(100, ((newTotalXP - oldRankMin) / oldBracket) * 100));
        setNormalXpData({
          startPercent,
          endPercent,
          minXp: oldRankMin,
          maxXp: oldRankMax
        });
        setLeveledUpData(null);
      }

      setTimerActive(false);
      setCalculatedTotalTime(finalTime);
      setFinalXP(earnedXP);
      setShowSummary(true);
    }
  };

  const handleAbortSession = () => {
    if (confirm("¿Quieres pausar y guardar el progreso actual para reanudar luego?")) {
      const finalTime = totalSessionTime + time;
      const earnedXP = Math.floor(finalTime / 60) * 10;
      
      const sessionUpdates: Partial<SessionRecord> = {
        status: 'Inacabada',
        durationSeconds: finalTime,
        bpm: bpm,
        exerciseStats: completedExercises,
        totalXP: earnedXP
      };

      if (activeSessionId) {
        updateSessionRecord(activeSessionId, sessionUpdates);
      } else {
        addSessionRecord({
          technique: sessionName || 'Sesión de Estudio',
          ...sessionUpdates,
          bpm: sessionUpdates.bpm || bpm || 60,
          durationSeconds: sessionUpdates.durationSeconds || finalTime || 0
        });
      }
    }
    setActiveSessionId(null);
    stateSnapshot.current.activeSessionId = null; 
    setTimerActive(false);
    setTime(0);
    clearRoutine();
    router.push('/');
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTime((prev) => {
          if (isPrep) {
            if (prev <= 1) { setIsPrep(false); return 0; }
            return prev - 1;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerActive, isPrep]);

  useEffect(() => {
    if (isPlaying) {
      if (!audioContext.current) {
        const WinAudio = window as unknown as WindowWithAudio;
        const AudioContextClass = window.AudioContext || WinAudio.webkitAudioContext;
        audioContext.current = new AudioContextClass();
      }
      const playClick = () => {
        if (!audioContext.current) return;
        const osc = audioContext.current.createOscillator();
        const envelope = audioContext.current.createGain();
        osc.frequency.value = (maxBeats > 0 && beat === 0) ? 1000 : 800;
        envelope.gain.value = 1;
        envelope.gain.exponentialRampToValueAtTime(0.001, audioContext.current.currentTime + 0.1);
        osc.connect(envelope);
        envelope.connect(audioContext.current.destination);
        osc.start();
        osc.stop(audioContext.current.currentTime + 0.1);
        setBeat((prev) => (maxBeats === 0 ? 0 : (prev + 1) % maxBeats));
      };
      timerRef.current = setInterval(playClick, (60 / bpm) * 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, bpm, beat, maxBeats]);

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
      const AudioContextClass = window.AudioContext || WinAudio.webkitAudioContext;
      audioContext.current = new AudioContextClass();
    }
    if (audioContext.current.state === 'suspended') audioContext.current.resume();
    const osc = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gainNode.gain.value = 0.15;
    osc.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    osc.start();
    tuningOscillator.current = osc;
    setIsTuning(true);
  };

  useEffect(() => {
    return () => { if (tuningOscillator.current) tuningOscillator.current.stop(); };
  }, []);

  const handleSelectExercise = (ej: Exercise) => {
    setActiveExercise(ej);
    setIsPrep(true);
    setTime(6);
    setTimerActive(true);
  };

  return (
    <div className="flex h-full w-full bg-slate-900 text-slate-200 overflow-hidden font-sans relative">
      
      {/* 1. SIDEBAR IZQUIERDO */}
      <aside className="w-64 lg:w-72 border-r border-slate-700/50 flex flex-col shrink-0 bg-slate-800 z-20 shadow-xl shadow-black/20">
        <div className="p-4 border-b border-slate-700/50 text-center">
          <h1 className="text-xs font-black tracking-widest text-blue-400 uppercase truncate">
            {sessionName ? sessionName : 'Sin Sesión'}
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessionName && routine.length > 0 ? (
            routine.map((ej, index) => {
              const stats = completedExercises[ej.id];
              const isCompleted = !!stats;
              
              return (
                <button
                  key={`${ej.id}-${index}`}
                  onClick={() => handleSelectExercise(ej)}
                  className={`w-full text-left rounded-xl overflow-hidden flex transition-all border shadow-sm group
                    ${activeExercise?.id === ej.id ? 'bg-blue-500/10 border-blue-500/50 scale-[1.02]' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}
                    ${isCompleted ? 'opacity-40 grayscale' : ''}`}
                >
                  <div className={`w-1.5 shrink-0 ${techniqueColors[ej.mainTechnique] || 'bg-slate-500'}`} />
                  <div className="p-3 flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        <span className="text-blue-400 mr-1">{index + 1}.</span>
                        {ej.mainTechnique}
                      </span>
                      {isCompleted && (
                        <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {stats.bpm} BPM ✓
                        </span>
                      )}
                    </div>
                    <h3 className={`font-bold text-[10px] uppercase truncate ${isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {ej.title}
                    </h3>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 opacity-30">
              <span className="text-3xl opacity-50">📂</span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                Session Room Vacía
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* 2. ÁREA CENTRAL */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-900 relative z-10 overflow-hidden">
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeExercise ? (
            <>
              <header className="h-10 border-b border-slate-700/50 flex flex-col md:flex-row items-center justify-between px-6 bg-slate-800 shrink-0">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{activeExercise.title}</h2>
                {activeExercise.subdivision && (
                  <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded uppercase border border-blue-500/20 hidden md:block">
                    Subdivisión x{activeExercise.subdivision}
                  </span>
                )}
              </header>
              <div className="flex-1 relative bg-slate-900">
                <iframe src={`${activeExercise.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} className="w-full h-full border-none pointer-events-auto opacity-90" />
              </div>
            </>
          ) : sessionName ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 p-10 z-30">
              <div className="text-center max-w-sm w-full">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-blue-400 mb-2">Preparación</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">Afina antes de arrancar</p>
                <div className="bg-slate-800 border border-slate-700/50 rounded-3xl p-8 mb-10 shadow-2xl shadow-black/20 flex flex-col items-center gap-6 relative overflow-hidden">
                  {isTuning && <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />}
                  <span className={`text-6xl transition-transform duration-500 ${isTuning ? 'scale-110 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'grayscale opacity-30'}`}>🎸</span>
                  <button onClick={toggleTuning} className={`relative z-50 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-lg ${isTuning ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'}`}>
                    {isTuning ? 'DETENER LA' : 'ESCUCHAR LA (440Hz)'}
                  </button>
                </div>
                <button 
                  onClick={() => { if (isTuning) toggleTuning(); setActiveExercise(routine[0]); setIsPrep(true); setTime(6); setTimerActive(true); }} 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-xl cursor-pointer transition-all shadow-lg shadow-emerald-600/20"
                >
                  ARRANCAR SESIÓN
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 opacity-20">
              <div className="text-center space-y-6 flex flex-col items-center">
                <div className="relative w-24 h-24 flex items-center justify-center">
                   <span className="text-5xl absolute opacity-50 block">🎸</span>
                   <div className="absolute inset-0 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
                <p className="font-black uppercase tracking-widest text-[10px] text-slate-400 mt-4">
                  Esperando carga de sesión...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 3. FOOTER (EL COCKPIT) */}
        <footer className="h-24 bg-slate-800 border-t border-slate-700/50 flex items-center justify-between px-8 lg:px-12 shrink-0 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
          {sessionName && activeExercise ? (
            <>
              <div className="flex items-center gap-6 lg:gap-10">
                <div className="flex flex-col items-center min-w-20">
                  <span className={`font-mono text-3xl font-black tracking-tighter leading-none ${isPrep ? 'text-orange-400 animate-pulse' : (timerActive ? 'text-emerald-400' : 'text-yellow-400')}`}>
                    {Math.floor(time / 60).toString().padStart(2, '0')}:{(time % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1.5">{isPrep ? 'Preparación' : 'Tiempo'}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setTimerActive(!timerActive)} className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-lg ${timerActive ? 'bg-slate-900 text-yellow-400 shadow-black/30' : 'bg-blue-600 text-white shadow-blue-600/20'}`}>
                    {timerActive ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </button>
                  <button 
                    onClick={handleAbortSession}
                    className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-slate-900 text-red-400 border border-slate-700/50 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 cursor-pointer transition-all shadow-sm group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform"><rect x="6" y="6" width="12" height="12"/></svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 lg:gap-6 bg-slate-900 p-2.5 px-6 rounded-2xl border border-slate-700/50 shadow-inner">
                

                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Registrar BPM</span>
                  <input type="number" placeholder={bpm.toString()} value={recordBpm} onChange={(e) => setRecordBpm(e.target.value)} className="bg-transparent text-slate-200 font-black text-xl outline-none w-16 lg:w-20 placeholder:text-slate-600" />
                </div>
                <button onClick={handleCompleteExercise} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] lg:text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl cursor-pointer transition-all shadow-lg shadow-emerald-600/20">
                  {isLast ? 'Finalizar Sesión' : 'Marcar como Acabado'}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-between items-center opacity-40">
               <div className="flex items-center gap-10">
                 <span className="font-mono text-3xl font-black text-slate-700">00:00</span>
                 <div className="w-12 h-12 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center text-[9px] font-black text-slate-600 uppercase tracking-tighter">OFF</div>
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">Sistemas en Standby</span>
               <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="w-1/2 h-full bg-slate-700 animate-pulse" /></div>
            </div>
          )}
        </footer>
      </main>

      {/* 3. SIDEBAR DERECHO: METRÓNOMO */}
      <aside className="w-64 lg:w-72 border-l border-slate-700/50 flex flex-col shrink-0 bg-slate-800 p-6 z-20 shadow-2xl shadow-black/20">
        <h3 className="text-[10px] font-black text-slate-400 uppercase mb-8 text-center tracking-widest">Metrónomo</h3>
        <div className="flex flex-col items-center gap-8">
          <div className="flex gap-1 bg-slate-900 p-1.5 rounded-xl w-full border border-slate-700/50 shadow-inner">
            {[0, 1, 2, 3, 4, 5].map((b) => (
              <button key={b} onClick={() => { setMaxBeats(b); setBeat(0); }} className={`flex-1 py-2 text-[10px] font-black rounded-lg cursor-pointer transition-all ${maxBeats === b ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
                {b === 0 ? '∞' : b}
              </button>
            ))}
          </div>
          <div className="flex gap-2.5">
            {maxBeats > 0 && Array.from({ length: maxBeats }).map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full transition-all duration-100 ${beat === i && isPlaying ? 'bg-blue-500 scale-125 shadow-[0_0_10px_rgba(59,130,246,0.6)]' : 'bg-slate-700'}`} />
            ))}
          </div>
          <div className="text-center">
            <span className="text-5xl lg:text-6xl font-black block text-slate-200 leading-none">{bpm}</span>
            <span className="text-[9px] text-slate-500 font-black tracking-widest uppercase mt-3 block">BPM</span>
          </div>
          <input type="range" min="40" max="240" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} className="w-full cursor-pointer accent-blue-500 h-1.5 bg-slate-700 rounded-lg appearance-none" />
          <button onClick={() => setIsPlaying(!isPlaying)} className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all shadow-lg ${isPlaying ? 'bg-slate-900 text-yellow-400 shadow-black/30' : 'bg-blue-600 text-white shadow-blue-600/20'}`}>
            {isPlaying ? 'Detener Beat' : 'Iniciar Metrónomo'}
          </button>
        </div>
      </aside>

      {/* 🏆 POP-UP DE RESUMEN FINAL DE SESIÓN */}
      {showSummary && (
        <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center z-100 p-6 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
            
            <div className="text-center border-b border-slate-700/50 pb-6 relative">
              <span className="text-5xl block mb-2 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">🎸</span>
              <h2 className="text-2xl font-black uppercase tracking-wider text-slate-100">¡Entrenamiento Superado!</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sincronizando telemetría neuronal...</p>
            </div>

{/* 📊 Métrica de XP Dinámica: MOTOR GRÁFICO GPU (scaleX) */}
            <div className={`bg-slate-900/80 border ${leveledUpData ? 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'border-slate-700/50'} p-6 rounded-2xl text-center relative overflow-hidden shrink-0 transition-all duration-1000 z-50`}>
              
              {leveledUpData ? (
                // 🌟 LA FIESTA DEL ASCENSO DE RANGO 🌟
                <>
                  <style>{`
                    /* ANIMACIONES DE GPU PURA: scaleX evita bloqueos de renderizado y va a 60fps constantes */
                    @keyframes scaleOldFinal { 
                      0% { transform: scaleX(${leveledUpData.startPercent / 100}); } 
                      100% { transform: scaleX(1); } 
                    }
                    @keyframes scaleNewFinal { 
                      0% { transform: scaleX(0); } 
                      100% { transform: scaleX(${leveledUpData.newEndPercent / 100}); } 
                    }
                    
                    @keyframes hideOldLayer { 0%, 99% { opacity: 1; } 100% { opacity: 0; } }
                    @keyframes showNewLayer { 0%, 99% { opacity: 0; } 100% { opacity: 1; } }
                    
                    @keyframes flashWhite { 0%, 85% { opacity: 0; filter: brightness(1); } 95% { opacity: 1; filter: brightness(3) drop-shadow(0 0 20px white); } 100% { opacity: 0; filter: brightness(1); } }
                    @keyframes blastOff { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
                    @keyframes starBurst { 0% { transform: scale(0) rotate(0deg); opacity: 1; } 100% { transform: scale(2.5) rotate(180deg); opacity: 0; } }
                    @keyframes shakeEm { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px) rotate(-3deg); } 40%, 80% { transform: translateX(5px) rotate(3deg); } }
                    @keyframes textExit { 0%, 85% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.8); } }
                    @keyframes textPopIn { 0% { opacity: 0; transform: translateY(5px); } 100% { opacity: 1; transform: translateY(0); } }
                  `}</style>

                  <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent pointer-events-none opacity-0" style={{ animation: 'showNewLayer 3.8s forwards, blastOff 0.8s 3.8s forwards' }} />
                  
                  {/* FASE 1: Textos del Rango Antiguo */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-20" style={{ animation: 'textExit 4s forwards' }}>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-black">Llenando medidor de rango...</span>
                    <span className="text-xl font-black text-slate-400 line-through decoration-red-500 decoration-2">
                      Nivel {leveledUpData.old.level} - {leveledUpData.old.name}
                    </span>
                    <div className="text-[10px] font-black text-emerald-400 uppercase mt-4">
                      Superando los {leveledUpData.old.maxXp} XP...
                    </div>
                  </div>

                  {/* FASE 2: Textos del Nuevo Nivel */}
                  <div className="relative z-10 flex flex-col items-center justify-center py-2 pointer-events-none opacity-0" style={{ animation: 'showNewLayer 3.8s forwards, blastOff 0.5s 3.8s forwards' }}>
                    <span className="text-5xl mb-3 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" style={{ animation: 'shakeEm 2s 3.8s infinite' }}>🏆</span>
                    <h3 className="text-[12px] font-black text-amber-400 uppercase tracking-[0.3em] drop-shadow-md mb-1">
                      ¡NIVEL {leveledUpData.new.level} ALCANZADO!
                    </h3>
                    <h2 className={`text-2xl lg:text-3xl text-center font-black uppercase tracking-tight ${leveledUpData.new.color} drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-4`}>
                      {leveledUpData.new.name}
                    </h2>
                    
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0 left-5 text-yellow-300 text-4xl opacity-0" style={{ animation: 'starBurst 1.5s 3.8s ease-out forwards' }}>✨</div>
                      <div className="absolute top-10 right-5 text-amber-500 text-5xl opacity-0" style={{ animation: 'starBurst 1.5s 4.0s ease-out forwards' }}>⭐</div>
                      <div className="absolute bottom-5 left-16 text-emerald-400 text-3xl opacity-0" style={{ animation: 'starBurst 1.5s 3.9s ease-out forwards' }}>✦</div>
                      <div className="absolute bottom-10 right-16 text-sky-400 text-4xl opacity-0" style={{ animation: 'starBurst 1.5s 4.1s ease-out forwards' }}>✨</div>
                    </div>

                    <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 w-full pointer-events-auto">
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1">Experiencia de Sesión Ganada</span>
                      <span className="font-mono text-2xl font-black text-sky-400">+{finalXP} XP</span>
                    </div>
                  </div>

                  {/* CAJÓN MAESTRO: Recorta todo lo que se salga y mantiene los bordes redondos */}
                  <div className="w-full bg-slate-950 rounded-full h-4 mt-6 border border-slate-800 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] z-30 overflow-hidden">
                    
                    {/* CAPA 1: Barra Antigua y Flash (Se ocultan a los 3.8s) */}
                    <div className="absolute inset-0" style={{ animation: 'hideOldLayer 3.8s forwards' }}>
                      <div 
                        className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-200 origin-left" 
                        style={{ animation: 'scaleOldFinal 3.6s cubic-bezier(0.4, 0, 0.2, 1) forwards' }} 
                      />
                      <div 
                        className="absolute top-0 left-0 w-full h-full bg-white opacity-0 mix-blend-overlay" 
                        style={{ animation: 'flashWhite 3.8s forwards' }} 
                      />
                    </div>
                    
                    {/* CAPA 2: Barra Nueva (Aparece a los 3.8s y arranca desde cero) */}
                    <div className="absolute inset-0 opacity-0" style={{ animation: 'showNewLayer 3.8s forwards' }}>
                      <div 
                        className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600 via-sky-400 to-emerald-400 origin-left" 
                        style={{ animation: 'scaleNewFinal 1.5s 3.8s cubic-bezier(0.16, 1, 0.3, 1) both' }} 
                      />
                    </div>

                  </div>

                  {/* NUMERACIONES DE APOYO BAJO LA BARRA */}
                  <div className="relative h-4 mt-2 px-1">
                    <div className="absolute inset-0 flex justify-between text-[8px] font-black text-slate-500 uppercase" style={{ animation: 'textExit 4s forwards' }}>
                      <span>{leveledUpData.old.minXp} XP</span>
                      <span className="text-amber-500/70">Asimilando carga técnica...</span>
                      <span>{leveledUpData.old.maxXp} XP</span>
                    </div>

                    <div className="absolute inset-0 flex justify-between text-[8px] font-black text-slate-500 uppercase opacity-0" style={{ animation: 'textPopIn 0.5s 4.0s forwards' }}>
                      <span>{leveledUpData.new.minXp} XP</span>
                      <span className="text-emerald-400 font-bold">Residuo de XP acumulado ✓</span>
                      <span>{leveledUpData.new.maxXp} XP</span>
                    </div>
                  </div>
                </>
              ) : normalXpData ? (
                // 🔹 ANIMACIÓN NORMAL DE XP PROPORCIONAL
                <>
                  <style>{`
                    @keyframes scaleNormalFinal { 
                      0% { transform: scaleX(${(normalXpData?.startPercent || 0) / 100}); } 
                      100% { transform: scaleX(${(normalXpData?.endPercent || 0) / 100}); } 
                    }
                  `}</style>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Experiencia Obtenida</span>
                  <span className="font-mono text-5xl font-black text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.4)] block">+{finalXP} XP</span>
                  
                  {/* Cajón recorta las esquinas */}
                  <div className="w-full bg-slate-950 rounded-full h-4 mt-6 overflow-hidden border border-slate-800 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] z-30">
                    <div 
                      className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600 via-sky-400 to-emerald-400 origin-left" 
                      style={{ animation: 'scaleNormalFinal 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }} 
                    />
                  </div>
                  
                  <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase mt-2 px-1">
                    <span>{normalXpData?.minXp || 0} XP</span>
                    <span className="text-slate-400">Progreso en el Nivel</span>
                    <span>{normalXpData?.maxXp || 0} XP</span>
                  </div>
                </>
              ) : null}
            </div>

            {/* ⏱️ Tiempo y Lista de Ejercicios */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desglose Técnico</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">
                  Tiempo Total: {Math.floor(calculatedTotalTime / 60)}m {calculatedTotalTime % 60}s
                </span>
              </div>
              
              <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                {routine.map((ej) => {
                  const stats = completedExercises[ej.id];
                  const currentBpm = stats?.bpm || 60;
                  const timeSpent = stats?.timeSpent || 0;
                  
                  // Lógica para detectar mejoras de velocidad buscando en el historial
                  const pastRecords = sessionHistory.filter(r => r.id !== activeSessionId && r.exerciseStats && r.exerciseStats[ej.id]);
                  let improvementBadge = <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">NUEVO</span>;
                  
                  if (pastRecords.length > 0) {
                    const sorted = [...pastRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    const prevBpm = sorted[0].exerciseStats?.[ej.id]?.bpm;
                    if (prevBpm) {
                      const diff = currentBpm - prevBpm;
                      if (diff > 0) improvementBadge = <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">+{diff} BPM 🚀</span>;
                      else if (diff < 0) improvementBadge = <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">{diff} BPM</span>;
                      else improvementBadge = <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">= BPM</span>;
                    }
                  }

                  return (
                    <div key={ej.id} className="bg-slate-900/50 border border-slate-700/50 p-3 rounded-xl flex items-center justify-between group hover:bg-slate-800/50 transition-colors">
                      <div className="flex flex-col truncate max-w-[50%]">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{ej.mainTechnique}</span>
                        <span className="text-xs font-bold text-slate-200 truncate">{ej.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black text-slate-500 uppercase">Tiempo</span>
                          <span className="text-xs font-mono text-slate-300">{Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, '0')}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black text-slate-500 uppercase">Speed</span>
                          <span className="text-xs font-mono font-bold text-sky-400">{currentBpm} BPM</span>
                        </div>
                        <div className="w-16 flex justify-end">{improvementBadge}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ⭐ Valoración de la Rutina */}
            <div className="bg-slate-900/30 border border-slate-700/50 p-5 rounded-2xl flex flex-col items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Cómo has sentido esta rutina?</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRoutineRating(star)}
                    className={`text-3xl transition-all cursor-pointer hover:scale-125 hover:-translate-y-1 ${star <= routineRating ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-slate-700'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* ✅ Botón Final: Guarda y te devuelve a inicio */}
            <button
              onClick={() => {
                if (activeSessionId) {
                  // Guardamos el estado definitivo en la nube
                  updateSessionRecord(activeSessionId, {
                    status: 'Acabada',
                    rpe: routineRating // Aprovechamos el campo RPE para guardar tu valoración de 1 a 5 estrellas
                  });
                }
                setActiveSessionId(null);
                stateSnapshot.current.activeSessionId = null;
                clearRoutine();
                router.push('/');
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-xl cursor-pointer transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50"
            >
              Registrar Sesión en Base de Datos ✓
            </button>

          </div>
        </div>
      )}
    </div>
  );
}