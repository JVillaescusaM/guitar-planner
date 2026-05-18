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
  const [sessionRpe, setSessionRpe] = useState<number>(3);
  
  const audioContext = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tuningOscillator = useRef<OscillatorNode | null>(null);

  const [recordBpm, setRecordBpm] = useState<string>('');
  const [isTuning, setIsTuning] = useState<boolean>(false);

  const currentIndex = routine.findIndex(ej => ej.id === activeExercise?.id);
  const isLast = currentIndex === routine.length - 1 || currentIndex === -1;

  const playNext = () => { if (!isLast) setActiveExercise(routine[currentIndex + 1]); };
  
  const stateSnapshot = useRef({
    activeSessionId, completedExercises, totalSessionTime, time, bpm, updateSessionRecord, sessionRpe
  });

  useEffect(() => {
    stateSnapshot.current = {
      activeSessionId, completedExercises, totalSessionTime, time, bpm, updateSessionRecord, sessionRpe
    };
  }, [activeSessionId, completedExercises, totalSessionTime, time, bpm, updateSessionRecord, sessionRpe]);

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
            if(session.rpe) setSessionRpe(session.rpe);
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
      totalXP: earnedXP,
      rpe: sessionRpe
    };
    
    if (currentSessionId) {
      updateSessionRecord(currentSessionId, sessionUpdates);
    } else {
      currentSessionId = addSessionRecord({
        technique: sessionName || 'Sesión Extra',
        ...sessionUpdates,
        bpm: sessionUpdates.bpm || finalBpm || 60,
        durationSeconds: sessionUpdates.durationSeconds || finalTime || 0 // 🛡️ Blindaje para el tiempo
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
      setActiveSessionId(null); 
      stateSnapshot.current.activeSessionId = null; 
      setTimerActive(false);
      clearRoutine(); 
      alert(`¡Entrenamiento Completado!\nHas ganado ${earnedXP} XP.`);
      router.push('/'); // 👈 Viaje suave a la Torre de Control sin cortar el cable de red
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
        durationSeconds: sessionUpdates.durationSeconds || finalTime || 0 // 🛡️ Blindaje para el tiempo
      });
      }
    }
    setActiveSessionId(null);
    stateSnapshot.current.activeSessionId = null; 
    setTimerActive(false);
    setTime(0);
    clearRoutine();
    router.push('/'); // 👈 Viaje suave
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
                
                {/* MEDIDOR DE ESFUERZO (RPE) */}
                {isLast && (
                  <div className="flex flex-col items-center border-r border-slate-800 pr-4 mr-2">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Cansancio</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button 
                          key={val} 
                          onClick={() => setSessionRpe(val)}
                          className={`w-5 h-5 rounded-full text-[9px] font-black transition-all cursor-pointer flex items-center justify-center ${sessionRpe === val ? 'bg-orange-500 text-white scale-110 shadow-md shadow-orange-500/20' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
    </div>
  );
}