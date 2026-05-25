'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp, type Exercise, type ExerciseStats } from '../../src/context/AppContext';
import SessionInspector from '../../src/components/SessionInspector';

// --- JERARQUÍA SAGRADA DE RANGOS GUITARRÍSTICOS (GAMIFICACIÓN 40 NIVELES) ---
interface Rank {
  name: string;
  minXp: number;
  color: string;
  bg: string;
  border: string;
  description: string;
}

const RANKS: Rank[] = [
  // FASE 1: EL DESPERTAR (Tonos Grises y Metálicos)
  { name: 'Querubín del Traste', minXp: 0, color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-500/30', description: 'Tus dedos acaban de conocer las cuerdas. El viaje comienza.' },
  { name: 'Tocador de Aire', minXp: 150, color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-500/30', description: 'Empiezas a entender cómo se sostiene la guitarra sin que se caiga.' },
  { name: 'Buscador de Callos', minXp: 350, color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-500/30', description: 'Las yemas de tus dedos arden, pero el sonido empieza a nacer.' },
  { name: 'Aprendiz del Metrónomo', minXp: 650, color: 'text-neutral-400', bg: 'bg-neutral-400/10', border: 'border-neutral-500/30', description: 'Descubres que el "tic-tac" no es tu enemigo, sino tu maestro.' },
  { name: 'Explorador de Cuerdas', minXp: 1000, color: 'text-stone-400', bg: 'bg-stone-400/10', border: 'border-stone-500/30', description: 'Ya sabes dónde está cada traste sin tener que mirar fijamente.' },

  // FASE 2: EL COMPÁS BÁSICO (Tonos Verdes y Limas)
  { name: 'Alevín del Compás', minXp: 1500, color: 'text-lime-500', bg: 'bg-lime-500/10', border: 'border-lime-500/30', description: 'Ya no te asusta tocar a 60 BPM. La mano derecha empieza a obedecer.' },
  { name: 'Forjador de Acordes', minXp: 2100, color: 'text-lime-400', bg: 'bg-lime-400/10', border: 'border-lime-500/30', description: 'Los cambios de acordes son más fluidos. La cejilla empieza a sonar limpia.' },
  { name: 'Picapedrero de Escalas', minXp: 2800, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', description: 'Subir y bajar escalas se ha convertido en tu pan de cada día.' },
  { name: 'Caminante del Mástil', minXp: 3600, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30', description: 'Ganas soltura desplazándote por los trastes superiores.' },
  { name: 'Domador de Ligados', minXp: 4600, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', description: 'Tus dedos martillean y tiran de la cuerda con fuerza propia.' },

  // FASE 3: EL DESARROLLO TÉCNICO (Tonos Cian y Azules)
  { name: 'Iniciado de la Cuerda', minXp: 5800, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', description: 'La técnica base está consolidada. Empieza el verdadero entrenamiento.' },
  { name: 'Guardián del Tempo', minXp: 7200, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30', description: 'Puedes mantener la velocidad constante sin adelantarte ni atrasarte.' },
  { name: 'Artesano del Arpegio', minXp: 8800, color: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/30', description: 'Tus dedos pulgar, índice, medio y anular empiezan a ser independientes.' },
  { name: 'Jinete del Picado', minXp: 10600, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', description: 'Índice y medio corren por las cuerdas apoyando con firmeza.' },
  { name: 'Escudero del Pulgar', minXp: 12600, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', description: 'El pulgar toma el mando. Los bajos empiezan a tener profundidad y peso.' },

  // FASE 4: LA CONSOLIDACIÓN (Tonos Azules e Índigos)
  { name: 'Promesa del Gremio', minXp: 15000, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', description: 'Empiezas a encadenar falsetas completas sin perder el tempo.' },
  { name: 'Hechicero del Rasgueo', minXp: 17800, color: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/30', description: 'Tus rasgueos de abanico suenan a pura percusión. Hay fuego en tu muñeca.' },
  { name: 'Tejedor de Falsetas', minXp: 21000, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', description: 'La memoria muscular hace su trabajo. Memorizas piezas complejas con rapidez.' },
  { name: 'Ilusionista del Trémolo', minXp: 24600, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', description: 'Cuatro notas que suenan como una sola corriente de agua continua.' },
  { name: 'Oficial de la Púa', minXp: 28800, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', description: 'Tu picado es limpio, redondo y estable. La velocidad ya no es casualidad.' },

  // FASE 5: LA EXPRESIÓN MUSICAL (Tonos Violetas y Púrpuras)
  { name: 'Arquitecto del Sonido', minXp: 33600, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', description: 'Ya no solo tocas notas, buscas el timbre perfecto en cada pulsación.' },
  { name: 'Centinela del Ritmo', minXp: 39000, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', description: 'Dominas los contratiempos, las síncopas y los silencios tensos.' },
  { name: 'Guerrero del Alzapúa', minXp: 45000, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/30', description: 'El pulgar vuela de tres en tres cuerdas. Tu mano derecha es un cañón.' },
  { name: 'Sabio de la Soleá', minXp: 52000, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', description: 'Entiendes la gravedad y el peso del compás de doce tiempos.' },
  { name: 'Jinete de la Bulería', minXp: 60000, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30', description: 'Velocidad, pellizco y aire. Navegas por el compás más vertiginoso con soltura.' },

  // FASE 6: EL DOMINIO ABSOLUTO (Tonos Fucsias y Rosas)
  { name: 'Titán de la Tensión', minXp: 69000, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', description: 'Tu resistencia es de acero. Puedes tocar piezas largas sin que los antebrazos ardan.' },
  { name: 'Caballero del Apoyando', minXp: 79000, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', description: 'Cada nota que pulsas tiene el volumen y la presencia de un cañonazo.' },
  { name: 'Mago de la Dinámica', minXp: 90000, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30', description: 'Controlas desde el susurro más delicado hasta el rasgueo más violento.' },
  { name: 'Creador de Silencios', minXp: 102000, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/30', description: 'Has aprendido que lo que no se toca es tan importante como lo que se toca.' },
  { name: 'Maestro de la Sonanta', minXp: 116000, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', description: 'Respetado por la comunidad. Tus rutinas de estudio y disciplina son de platino.' },

  // FASE 7: LA LEYENDA (Tonos Rojos, Naranjas y Dorados)
  { name: 'Tormenta de Semicorcheas', minXp: 132000, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', description: 'Tu velocidad de picado desafía los límites de la física.' },
  { name: 'Leyenda del Tablao', minXp: 150000, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', description: 'Tienes el repertorio, el sonido y el temple para sentarte en cualquier escenario.' },
  { name: 'Faraón del Compás', minXp: 172000, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', description: 'El ritmo no es algo que sigues; el ritmo es algo que tú dictas.' },
  { name: 'Alma de Madera y Cuerda', minXp: 198000, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', description: 'La guitarra ya no es un instrumento, es una extensión literal de tu cuerpo.' },
  { name: 'Virtuoso de la Cejilla', minXp: 230000, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', description: 'Las barreras técnicas han desaparecido. Solo queda la música.' },
  { name: 'Espíritu del Flamenco', minXp: 270000, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', description: 'Transmites verdad en cada toque. Conoces los secretos antiguos del mástil.' },
  { name: 'Genio de las Seis Cuerdas', minXp: 320000, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', description: 'Los estudiantes analizan tus vídeos a cámara lenta intentando entender cómo lo haces.' },
  { name: 'Duende Encarnado', minXp: 400000, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', description: 'Tienes duende. La guitarra habla a través de tus manos y eriza la piel de quien te escucha.' },
  { name: 'Mito Inmortal', minXp: 550000, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', description: 'Tu name resuena en las peñas. Eres la inspiración de la próxima generación.' },
  { name: 'Virtuoso Semidiós', minXp: 1000000, color: 'text-yellow-300', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', description: 'Leyenda viva del instrumento. Has alcanzado el pináculo del esfuerzo, la velocidad y el alma.' }
];

interface TechMetric {
  name: string;
  sessionCount: number;
  maxBpm: number;
  maxNpm: number;
  totalSecondsSpent: number;
}

interface FavoriteExercise {
  id: string;
  title: string;
  technique: string;
  timesPracticed: number;
  recordBpm: number;
}

interface InspectingState {
  id?: string;
  name: string;
  exercises?: Exercise[];
  daysData?: { dayNumber: number; exercises: Exercise[]; routineName?: string }[];
  exerciseStats?: Record<string, ExerciseStats>;
  totalXP?: number;
  rpe?: number;
  durationSeconds?: number;
  bpm?: number;
  date?: string;
}

// Tipamos estrictamente el tipo de pestañas válidas para evitar el @ts-ignore
type ProfileTab = 'general' | 'techniques' | 'exercises' | 'history';

export default function DeepProfileAnalyticsPage() {
  const { user, sessionHistory } = useApp();
  const [activeTab, setActiveTab] = useState<ProfileTab>('general');
  const [inspectingSession, setInspectingSession] = useState<InspectingState | null>(null);

  // =========================================================================
  // 🧠 EL SÚPER MOTOR DE ANÁLISIS DE DATOS CRUZADOS
  // =========================================================================
  const analytics = useMemo(() => {
    const finishedSessions = sessionHistory.filter(s => s.status === 'Acabada');
    
    // 1. CÓMPUTO DE XP, RANGOS Y PROGRESO DE BARRA
    const totalXP = sessionHistory.reduce((acc, s) => acc + (s.totalXP || 0), 0);
    let currentRankIndex = 0;
    for (let i = 0; i < RANKS.length; i++) {
      if (totalXP >= RANKS[i].minXp) currentRankIndex = i;
    }
    const currentRank = RANKS[currentRankIndex];
    const nextRank = RANKS[currentRankIndex + 1] || currentRank;
    
    const xpEarnedInThisLevel = totalXP - currentRank.minXp;
    const xpRequiredForNextLevel = nextRank.minXp - currentRank.minXp;
    const levelProgressPercent = xpRequiredForNextLevel === 0 
      ? 100 
      : Math.min(100, Math.round((xpEarnedInThisLevel / xpRequiredForNextLevel) * 100));

    // 2. CÁLCULO DE RACHAS INTELIGENTES
    const finishedDatesSet = new Set(
      finishedSessions.map(s => s.date.split('T')[0])
    );
    
    let currentStreak = 0;
    const cursorDate = new Date();
    
    while (true) {
      const formattedCursor = cursorDate.toISOString().split('T')[0];
      if (finishedDatesSet.has(formattedCursor)) {
        currentStreak++;
        cursorDate.setDate(cursorDate.getDate() - 1);
      } else {
        if (currentStreak === 0) {
          cursorDate.setDate(cursorDate.getDate() - 1);
          const formattedYesterday = cursorDate.toISOString().split('T')[0];
          if (finishedDatesSet.has(formattedYesterday)) {
            currentStreak++;
            cursorDate.setDate(cursorDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    // 3. ANÁLISIS DE VELOCIDADES MÁXIMAS SEGMENTADAS POR TÉCNICA
    const techRegistry: Record<string, TechMetric> = {};
    
    finishedSessions.forEach(session => {
      if (session.exerciseStats) {
        Object.entries(session.exerciseStats).forEach(([exerciseId, statsObj]) => {
          const matchingExercise = session.exercises?.find(e => e.id === exerciseId);
          const techName = matchingExercise?.mainTechnique || session.technique || 'OTRAS';
          
          if (!techRegistry[techName]) {
            techRegistry[techName] = { name: techName, sessionCount: 0, maxBpm: 0, maxNpm: 0, totalSecondsSpent: 0 };
          }
          
          const current = techRegistry[techName];
          current.totalSecondsSpent += statsObj.timeSpent || 0;
          if (statsObj.bpm > current.maxBpm) current.maxBpm = statsObj.bpm;
          if (statsObj.npm && statsObj.npm > current.maxNpm) current.maxNpm = statsObj.npm;
        });
      } else {
        const fallbackTech = session.technique || 'OTRAS';
        if (!techRegistry[fallbackTech]) {
          techRegistry[fallbackTech] = { name: fallbackTech, sessionCount: 0, maxBpm: 0, maxNpm: 0, totalSecondsSpent: 0 };
        }
        const current = techRegistry[fallbackTech];
        if (session.bpm > current.maxBpm) {
          current.maxBpm = session.bpm;
          current.maxNpm = session.bpm * 2;
        }
        current.totalSecondsSpent += session.durationSeconds || 0;
      }
    });

    finishedSessions.forEach(s => {
      const tName = s.technique || 'OTRAS';
      if (techRegistry[tName]) techRegistry[tName].sessionCount += 1;
    });

    const detailedTechniques = Object.values(techRegistry).sort((a, b) => b.totalSecondsSpent - a.totalSecondsSpent);
    const totalPracticeSeconds = sessionHistory.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

    // 4. RANKING TOP 5 EJERCICIOS
    const exerciseCounters: Record<string, { title: string; tech: string; count: number; maxBpm: number }> = {};
    
    finishedSessions.forEach(s => {
      if (s.exercises) {
        s.exercises.forEach(ex => {
          const recordBpmForThisRun = s.exerciseStats?.[ex.id]?.bpm || s.bpm || 60;
          
          if (!exerciseCounters[ex.id]) {
            exerciseCounters[ex.id] = { title: ex.title, tech: ex.mainTechnique, count: 0, maxBpm: 0 };
          }
          const item = exerciseCounters[ex.id];
          item.count += 1;
          if (recordBpmForThisRun > item.maxBpm) item.maxBpm = recordBpmForThisRun;
        });
      }
    });

    const topExercises: FavoriteExercise[] = Object.entries(exerciseCounters)
      .map(([id, data]) => ({
        id,
        title: data.title,
        technique: data.tech,
        timesPracticed: data.count,
        recordBpm: data.maxBpm
      }))
      .sort((a, b) => b.timesPracticed - a.timesPracticed)
      .slice(0, 5);

    return {
      totalXP,
      currentRank,
      nextRank,
      levelProgressPercent,
      currentStreak,
      finishedCount: finishedSessions.length,
      totalHours: (totalPracticeSeconds / 3600).toFixed(1),
      detailedTechniques,
      topExercises,
      totalPracticeSeconds
    };
  }, [sessionHistory]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-900 font-sans overflow-hidden text-slate-200">
      
      {/* HEADER DE CONTROL */}
      <header className="bg-slate-950 border-b border-slate-800 p-5 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md z-30">
        <div>
          <h1 className="text-lg font-black uppercase tracking-tight text-emerald-400 flex items-center gap-2">
            <span>🛡️</span> Centro de Analítica Avanzada
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
            Diagnóstico de rendimiento e indicadores de velocidad en tiempo real
          </p>
        </div>
        <Link href="/" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer">
          Volver a mi Torre 🚀
        </Link>
      </header>

      {/* MENÚ DE SUB-PESTAÑAS */}
      <nav className="bg-slate-950/40 border-b border-slate-800/60 p-2 shrink-0 flex gap-1 overflow-x-auto custom-scrollbar">
        {([
          { id: 'general', label: '📈 Vista General' },
          { id: 'techniques', label: '⚡ Técnicas y Velocidad (NPM)' },
          { id: 'exercises', label: '🏆 Ejercicios Favoritos (Top 5)' },
          { id: 'history', label: '📋 Historial de Carga Completo' }
        ] as { id: ProfileTab; label: string }[]).map((tab) => (
          <button 
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setInspectingSession(null);
            }}
            className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all shrink-0 cursor-pointer ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ÁREA DE DISTRIBUCIÓN SIDE-BY-SIDE INTEGRADA */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6 max-w-7xl mx-auto w-full">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
          
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <div className={`border rounded-3xl p-6 relative overflow-hidden bg-linear-to-br from-slate-900 to-slate-950 shadow-2xl ${analytics.currentRank.border}`}>
                <div className="absolute top-0 right-0 p-8 opacity-5 text-[9rem] select-none">🎸</div>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className={`w-24 h-24 rounded-full border-2 ${analytics.currentRank.border} ${analytics.currentRank.bg} shadow-inner flex flex-col items-center justify-center shrink-0`}>
                    <span className="text-3xl">🏅</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      LVL {RANKS.indexOf(analytics.currentRank) + 1}
                    </span>
                  </div>
                  <div className="flex-1 w-full text-center md:text-left">
                    <span className="text-[8px] font-black tracking-[0.25em] uppercase text-slate-500 block mb-0.5">Identificador de Rango Docente</span>
                    <h2 className={`text-2xl font-black uppercase tracking-tight ${analytics.currentRank.color}`}>
                      {analytics.currentRank.name}
                    </h2>
                    {/* LEEMOS 'user' CORRECTAMENTE AQUÍ PARA RESOLVER EL AVISO DEL LINTER */}
                    <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                      Identificado como: <span className="text-slate-300 font-bold">{user?.email?.split('@')[0] || 'Guitarrista'}</span>
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 mt-1 max-w-xl">
                      {analytics.currentRank.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-900 space-y-2">
                  <div className="flex justify-between items-end text-[9px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Progreso: {analytics.totalXP} XP totales</span>
                    {analytics.nextRank.name !== analytics.currentRank.name ? (
                      <span className="text-emerald-400">Faltan {analytics.nextRank.minXp - analytics.totalXP} XP para Rango Superior</span>
                    ) : (
                      <span className="text-amber-400">¡Rango Máximo Alcanzado!</span>
                    )}
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner p-0.5">
                    <div 
                      className="h-full bg-linear-to-r from-emerald-600 to-teal-400 rounded-full transition-all duration-1000 relative"
                      style={{ width: `${analytics.levelProgressPercent}%` }}
                    >
                      <div className="absolute inset-0 bg-white/10 w-full h-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl text-center shadow-lg">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Tiempo de Vuelo Neto</span>
                  <p className="text-2xl font-black text-slate-100 tracking-tighter">{analytics.totalHours} <span className="text-xs text-slate-500">HORAS</span></p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl text-center shadow-lg">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Sesiones Concluidas</span>
                  <p className="text-2xl font-black text-slate-100 tracking-tighter">{analytics.finishedCount} <span className="text-xs text-slate-500">RUTINAS</span></p>
                </div>
                <div className="bg-slate-950/60 border border-emerald-900/30 bg-linear-to-b from-transparent to-emerald-950/10 p-5 rounded-2xl text-center shadow-lg">
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 block mb-1">Racha de Entrenamiento</span>
                  <p className="text-2xl font-black text-emerald-400 tracking-tighter">{analytics.currentStreak} <span className="text-xs text-emerald-500/70">DÍAS</span></p>
                </div>
              </div>
              
              <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl text-center">
                <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block mb-1">Regla de Protección de Tendones</span>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase">
                  Las rachas automáticas ignoran los días marcados como Descanso para evitar sobrecargas y asegurar la regeneración de fibras musculares.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'techniques' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4 border-b border-slate-800 pb-2">Distribución Técnica por Segundos de Práctica</span>
                <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
                  {analytics.detailedTechniques.map((tech, idx) => {
                    const percentage = Math.round((tech.totalSecondsSpent / (analytics.totalPracticeSeconds || 1)) * 100);
                    const colors = ['bg-red-500', 'bg-yellow-600', 'bg-emerald-500', 'bg-purple-500', 'bg-cyan-500', 'bg-orange-500'];
                    if (percentage === 0) return null;
                    return <div key={idx} title={`${tech.name}: ${percentage}%`} className={`${colors[idx % colors.length]} h-full border-r border-slate-950/20 last:border-0`} style={{ width: `${percentage}%` }} />;
                  })}
                </div>
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-left text-[10px] font-bold border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[8px] font-black">
                        <th className="pb-3 pl-2">Técnica Específica</th>
                        <th className="pb-3 text-center">Sesiones</th>
                        <th className="pb-3 text-right text-blue-400">BPM Máximo</th>
                        <th className="pb-3 text-right text-emerald-400 pr-2">Velocidad NPM Máxima</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 uppercase">
                      {analytics.detailedTechniques.map((tech, i) => (
                        <tr key={i} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-3 pl-2 font-black text-slate-200">{tech.name}</td>
                          <td className="py-3 text-center text-slate-400">{tech.sessionCount}</td>
                          <td className="py-3 text-right font-mono font-black text-blue-400">{tech.maxBpm} BPM</td>
                          <td className="py-3 text-right font-mono font-black text-emerald-400 pr-2">{tech.maxNpm} <span className="text-[8px] text-slate-600">NPM</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exercises' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4 border-b border-slate-800 pb-2">Top 5: Ejercicios de Mayor Consistencia</span>
                <div className="space-y-3">
                  {analytics.topExercises.map((ex, index) => (
                    <div key={ex.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 flex justify-between items-center hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-black text-xs text-blue-400 shrink-0">#{index + 1}</span>
                        <div className="min-w-0"><h4 className="text-[11px] font-black uppercase text-slate-200 tracking-wide truncate">{ex.title}</h4></div>
                      </div>
                      <div className="flex gap-4 items-center font-mono text-[10px] shrink-0">
                        <span className="text-slate-400 font-black">{ex.timesPracticed} ejecuciones</span>
                        <span className="font-black text-blue-400 bg-blue-500/5 border border-blue-500/10 rounded px-2 py-0.5">{ex.recordBpm} BPM</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2 animate-fade-in">
              {sessionHistory.map(record => {
                const isInspected = inspectingSession?.id === record.id;
                return (
                  <div 
                    key={record.id}
                    onClick={() => setInspectingSession({
                      id: record.id,
                      name: record.technique,
                      exercises: record.exercises || [],
                      exerciseStats: record.exerciseStats,
                      totalXP: record.totalXP,
                      rpe: record.rpe,
                      durationSeconds: record.durationSeconds,
                      bpm: record.bpm,
                      date: record.date
                    })}
                    className={`bg-slate-950/60 border rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-slate-700 transition-all cursor-pointer ${isInspected ? 'border-emerald-500 shadow-md shadow-emerald-500/5 scale-[1.01]' : 'border-slate-800/80'}`}
                  >
                    <div>
                      <h4 className="text-[10px] font-black text-slate-200 uppercase tracking-wide">{record.technique}</h4>
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">
                        {new Date(record.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex gap-3 items-center text-[9px] font-black uppercase">
                      <div className="text-right font-mono">
                        <span className="text-slate-400">{(record.durationSeconds / 60).toFixed(0)} min</span>
                        <span className="text-slate-600 mx-1.5">|</span>
                        <span className="text-blue-400">{record.bpm} BPM</span>
                      </div>
                      <span className={`px-2 py-0.5 border rounded text-[7px] tracking-wider ${record.status === 'Acabada' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {record.status || 'Pendiente'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* COLUMNA DERECHA: EL INSPECTOR ADAPTADO Y EXPANDIDO CON CAJA NEGRA ANALÍTICA */}
        {activeTab === 'history' && (
          <div className="w-80 shrink-0 hidden lg:block overflow-y-auto custom-scrollbar">
            {inspectingSession ? (
              inspectingSession.exerciseStats ? (
                /* VISTA A: INSPECTOR HISTÓRICO ESPECIALIZADO DE ALTA PRECISIÓN */
                <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-xl shadow-black/20 min-h-115 flex flex-col justify-between animate-fade-in">
                  <div>
                    <header className="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">📋 Caja Negra Analítica</h3>
                        <span className="text-[10px] font-black text-slate-200 uppercase block truncate mt-0.5">{inspectingSession.name}</span>
                      </div>
                      {inspectingSession.date && (
                        <span className="text-[8px] font-black text-slate-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded uppercase">
                          {new Date(inspectingSession.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </header>

                    {/* MINI INDICADORES DE CARGA PASADA */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                        <span className="text-[6px] text-slate-500 uppercase font-black block mb-0.5">Tiempo Total</span>
                        <p className="text-xs font-black text-slate-200">{Math.round((inspectingSession.durationSeconds || 0) / 60)} <span className="text-[8px] text-slate-400">m</span></p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                        <span className="text-[6px] text-slate-500 uppercase font-black block mb-0.5">BPM Final</span>
                        <p className="text-xs font-black text-blue-400">{inspectingSession.bpm || 60}</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                        <span className="text-[6px] text-slate-500 uppercase font-black block mb-0.5">Cansancio RPE</span>
                        <p className="text-xs font-black text-orange-400">{inspectingSession.rpe || '—'}<span className="text-[8px] text-slate-500">/5</span></p>
                      </div>
                    </div>

                    {/* EXPERIENCIA GANADA */}
                    {inspectingSession.totalXP !== undefined && (
                      <div className="mb-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2 text-center">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                          ✨ +{inspectingSession.totalXP} XP Añadidos
                        </p>
                      </div>
                    )}

                    {/* DESGLOSE SEGUNDO A SEGUNDO POR EJERCICIO */}
                    <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest block mb-2">Desglose de Tiempos y NPM:</span>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                      {inspectingSession.exercises && inspectingSession.exercises.length > 0 ? (
                        inspectingSession.exercises.map((ex, i) => {
                          const exStat = inspectingSession.exerciseStats?.[ex.id];
                          const timeMin = exStat?.timeSpent ? Math.floor(exStat.timeSpent / 60) : 0;
                          const timeSec = exStat?.timeSpent ? exStat.timeSpent % 60 : 0;

                          return (
                            <div key={ex.id} className="bg-slate-900/60 border border-slate-850 rounded-xl p-2.5 space-y-1">
                              <div className="flex gap-1.5 items-start text-[9px] font-black text-slate-200 uppercase leading-tight">
                                <span className="text-blue-500">{i + 1}.</span>
                                <span className="truncate flex-1">{ex.title}</span>
                              </div>
                              <div className="flex justify-between items-center text-[8px] font-bold uppercase text-slate-400">
                                <span className="text-slate-500">⏱️ {timeMin.toString().padStart(2, '0')}:{timeSec.toString().padStart(2, '0')}</span>
                                <div className="flex gap-1.5">
                                  <span className="text-blue-400 font-black">{exStat?.bpm || inspectingSession.bpm || 60} BPM</span>
                                  {exStat?.npm !== undefined && (
                                    <span className="text-emerald-400 font-black bg-emerald-500/10 px-1 rounded">{exStat.npm} NPM</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-[8px] text-slate-500 italic block text-center py-4">Sin desglose de ejercicios</span>
                      )}
                    </div>
                  </div>
                  <div className="text-[7px] text-slate-600 uppercase font-black text-center pt-2 border-t border-slate-800/40">
                    Métricas de ejecución inmutables
                  </div>
                </div>
              ) : (
                /* VISTA B: INSPECTOR ESTÁNDAR PARA COMPONENTES SIN MÉTRICAS DE CARGA */
                <SessionInspector 
                  name={inspectingSession.name}
                  exercises={inspectingSession.exercises}
                  daysData={inspectingSession.daysData}
                  showAction={false}
                />
              )
            ) : (
              <div className="bg-slate-800/40 border border-dashed border-slate-800 rounded-2xl p-6 h-80 flex flex-col items-center justify-center text-center">
                <span className="text-xl mb-2 opacity-20">🔍</span>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-normal">
                  Haz clic en cualquier sesión<br />del historial para desplegar su auditoría
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}