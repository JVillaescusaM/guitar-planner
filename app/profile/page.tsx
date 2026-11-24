"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  Clock,
  CheckCircle2,
  Flame,
  ArrowLeft,
  Search,
} from "lucide-react";
import {
  useApp,
  type Exercise,
  type ExerciseStats,
} from "../../src/context/AppContext";
import SessionInspector from "../../src/components/SessionInspector";

interface Rank {
  name: string;
  minXp: number;
  description: string;
}

const RANKS: Rank[] = [
  {
    name: "Querubín del Traste",
    minXp: 0,
    description: "Tus dedos acaban de conocer las cuerdas. El viaje comienza.",
  },
  {
    name: "Tocador de Aire",
    minXp: 150,
    description:
      "Empiezas a entender cómo se sostiene la guitarra con soltura.",
  },
  {
    name: "Buscador de Callos",
    minXp: 350,
    description: "Las yemas arden, pero el sonido empieza a nacer.",
  },
  {
    name: "Aprendiz del Metrónomo",
    minXp: 650,
    description: "Descubres que el tic-tac no es tu enemigo, sino tu maestro.",
  },
  {
    name: "Explorador de Cuerdas",
    minXp: 1000,
    description:
      "Ya sabes dónde está cada traste sin tener que mirar fijamente.",
  },
  {
    name: "Alevín del Compás",
    minXp: 1500,
    description:
      "Ya no te asusta tocar a 60 BPM. La mano derecha empieza a obedecer.",
  },
  {
    name: "Forjador de Acordes",
    minXp: 2100,
    description: "Los cambios son más fluidos y la cejilla suena limpia.",
  },
  {
    name: "Picapedrero de Escalas",
    minXp: 2800,
    description:
      "Subir y bajar escalas se ha convertido en tu pan de cada día.",
  },
  {
    name: "Caminante del Mástil",
    minXp: 3600,
    description: "Ganas soltura desplazándote por los trastes superiores.",
  },
  {
    name: "Domador de Ligados",
    minXp: 4600,
    description: "Tus dedos martillean y tiran de la cuerda con fuerza propia.",
  },
  {
    name: "Iniciado de la Cuerda",
    minXp: 5800,
    description:
      "La técnica base está consolidada. Empieza el verdadero entrenamiento.",
  },
  {
    name: "Guardián del Tempo",
    minXp: 7200,
    description:
      "Mantienes la velocidad constante sin adelantarte ni atrasarte.",
  },
  {
    name: "Artesano del Arpegio",
    minXp: 8800,
    description:
      "Pulgar, índice, medio y anular empiezan a ser independientes.",
  },
  {
    name: "Jinete del Picado",
    minXp: 10600,
    description: "Índice y medio corren por las cuerdas apoyando con firmeza.",
  },
  {
    name: "Escudero del Pulgar",
    minXp: 12600,
    description:
      "El pulgar toma el mando. Los bajos tienen profundidad y peso.",
  },
  {
    name: "Promesa del Gremio",
    minXp: 15000,
    description: "Empiezas a encadenar falsetas completas sin perder el tempo.",
  },
  {
    name: "Hechicero del Rasgueo",
    minXp: 17800,
    description: "Tus rasgueos de abanico suenan a pura percusión.",
  },
  {
    name: "Tejedor de Falsetas",
    minXp: 21000,
    description: "La memoria muscular hace su trabajo con piezas complejas.",
  },
  {
    name: "Ilusionista del Trémolo",
    minXp: 24600,
    description: "Cuatro notas que suenan como una corriente continua.",
  },
  {
    name: "Oficial de la Púa",
    minXp: 28800,
    description: "Tu picado es limpio, redondo y estable.",
  },
  {
    name: "Arquitecto del Sonido",
    minXp: 33600,
    description: "Buscas el timbre perfecto en cada pulsación.",
  },
  {
    name: "Centinela del Ritmo",
    minXp: 39000,
    description: "Dominas contratiempos, síncopas y silencios tensos.",
  },
  {
    name: "Guerrero del Alzapúa",
    minXp: 45000,
    description: "El pulgar vuela de tres en tres cuerdas.",
  },
  {
    name: "Sabio de la Soleá",
    minXp: 52000,
    description: "Entiendes la gravedad y el peso del compás de doce tiempos.",
  },
  {
    name: "Jinete de la Bulería",
    minXp: 60000,
    description: "Velocidad, pellizco y aire en el compás más vertiginoso.",
  },
  {
    name: "Titán de la Tensión",
    minXp: 69000,
    description: "Resistencia de acero en piezas largas.",
  },
  {
    name: "Caballero del Apoyando",
    minXp: 79000,
    description: "Cada nota tiene volumen y presencia de cañonazo.",
  },
  {
    name: "Mago de la Dinámica",
    minXp: 90000,
    description:
      "Controlas desde el susurro más delicado hasta el rasgueo más fuerte.",
  },
  {
    name: "Creador de Silencios",
    minXp: 102000,
    description: "Lo que no se toca es tan importante como lo que se toca.",
  },
  {
    name: "Maestro de la Sonanta",
    minXp: 116000,
    description: "Tus rutinas de estudio y disciplina son de platino.",
  },
  {
    name: "Tormenta de Semicorcheas",
    minXp: 132000,
    description: "Tu velocidad de picado desafía los límites.",
  },
  {
    name: "Leyenda del Tablao",
    minXp: 150000,
    description: "Repertorio, sonido y temple para cualquier escenario.",
  },
  {
    name: "Faraón del Compás",
    minXp: 172000,
    description: "El ritmo no es algo que sigues; es algo que dictas.",
  },
  {
    name: "Alma de Madera y Cuerda",
    minXp: 198000,
    description: "La guitarra es una extensión literal de tu cuerpo.",
  },
  {
    name: "Virtuoso de la Cejilla",
    minXp: 230000,
    description:
      "Las barreras técnicas han desaparecido. Solo queda la música.",
  },
  {
    name: "Espíritu del Flamenco",
    minXp: 270000,
    description: "Transmites verdad en cada toque.",
  },
  {
    name: "Genio de las Seis Cuerdas",
    minXp: 320000,
    description: "Dominio absoluto del mástil y el sonido.",
  },
  {
    name: "Duende Encarnado",
    minXp: 400000,
    description: "La guitarra habla a través de tus manos.",
  },
  {
    name: "Mito Inmortal",
    minXp: 550000,
    description: "Tu nombre resuena en las peñas.",
  },
  {
    name: "Virtuoso Semidiós",
    minXp: 1000000,
    description:
      "Has alcanzado el pináculo del esfuerzo, la velocidad y el alma.",
  },
];

function toLocalDateKey(dateInput: string | Date): string {
  const d = new Date(dateInput);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
  daysData?: {
    dayNumber: number;
    exercises: Exercise[];
    routineName?: string;
  }[];
  exerciseStats?: Record<string, ExerciseStats>;
  totalXP?: number;
  rpe?: number;
  durationSeconds?: number;
  bpm?: number;
  date?: string;
}

type ProfileTab = "general" | "techniques" | "exercises" | "history";

export default function ProfileAnalyticsPage() {
  const { user, sessionHistory } = useApp();
  const [activeTab, setActiveTab] = useState<ProfileTab>("general");
  const [inspectingSession, setInspectingSession] =
    useState<InspectingState | null>(null);

  const sortedHistory = useMemo(
    () =>
      [...sessionHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [sessionHistory],
  );

  const analytics = useMemo(() => {
    const finishedSessions = sessionHistory.filter(
      (s) => s.status === "Acabada",
    );

    const totalXP = sessionHistory.reduce(
      (acc, s) => acc + (s.totalXP || 0),
      0,
    );
    let currentRankIndex = 0;
    for (let i = 0; i < RANKS.length; i++) {
      if (totalXP >= RANKS[i].minXp) currentRankIndex = i;
    }
    const currentRank = RANKS[currentRankIndex];
    const nextRank = RANKS[currentRankIndex + 1] || currentRank;

    const xpEarnedInThisLevel = totalXP - currentRank.minXp;
    const xpRequiredForNextLevel = nextRank.minXp - currentRank.minXp;
    const levelProgressPercent =
      xpRequiredForNextLevel === 0
        ? 100
        : Math.min(
            100,
            Math.round((xpEarnedInThisLevel / xpRequiredForNextLevel) * 100),
          );

    // Racha en hora local
    const finishedDatesSet = new Set(
      finishedSessions.map((s) => toLocalDateKey(s.date)),
    );
    let currentStreak = 0;
    const cursorDate = new Date();

    while (true) {
      const key = toLocalDateKey(cursorDate);
      if (finishedDatesSet.has(key)) {
        currentStreak++;
        cursorDate.setDate(cursorDate.getDate() - 1);
      } else {
        if (currentStreak === 0) {
          cursorDate.setDate(cursorDate.getDate() - 1);
          const yesterdayKey = toLocalDateKey(cursorDate);
          if (finishedDatesSet.has(yesterdayKey)) {
            currentStreak++;
            cursorDate.setDate(cursorDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    // Técnicas
    const techRegistry: Record<string, TechMetric> = {};
    finishedSessions.forEach((session) => {
      if (session.exerciseStats) {
        Object.entries(session.exerciseStats).forEach(
          ([exerciseId, statsObj]) => {
            const matchingExercise = session.exercises?.find(
              (e) => e.id === exerciseId,
            );
            const techName =
              matchingExercise?.mainTechnique || session.technique || "OTRAS";
            if (!techRegistry[techName]) {
              techRegistry[techName] = {
                name: techName,
                sessionCount: 0,
                maxBpm: 0,
                maxNpm: 0,
                totalSecondsSpent: 0,
              };
            }
            const current = techRegistry[techName];
            current.totalSecondsSpent += statsObj.timeSpent || 0;
            if (statsObj.bpm > current.maxBpm) current.maxBpm = statsObj.bpm;
            if (statsObj.npm && statsObj.npm > current.maxNpm)
              current.maxNpm = statsObj.npm;
          },
        );
      } else {
        const fallbackTech = session.technique || "OTRAS";
        if (!techRegistry[fallbackTech]) {
          techRegistry[fallbackTech] = {
            name: fallbackTech,
            sessionCount: 0,
            maxBpm: 0,
            maxNpm: 0,
            totalSecondsSpent: 0,
          };
        }
        const current = techRegistry[fallbackTech];
        if (session.bpm > current.maxBpm) {
          current.maxBpm = session.bpm;
          current.maxNpm = session.bpm * 2;
        }
        current.totalSecondsSpent += session.durationSeconds || 0;
      }
    });

    finishedSessions.forEach((s) => {
      const tName = s.technique || "OTRAS";
      if (techRegistry[tName]) techRegistry[tName].sessionCount += 1;
    });

    const detailedTechniques = Object.values(techRegistry).sort(
      (a, b) => b.totalSecondsSpent - a.totalSecondsSpent,
    );
    const totalPracticeSeconds = sessionHistory.reduce(
      (acc, s) => acc + (s.durationSeconds || 0),
      0,
    );

    // Top 5 ejercicios
    const exerciseCounters: Record<
      string,
      { title: string; tech: string; count: number; maxBpm: number }
    > = {};

    finishedSessions.forEach((s) => {
      if (s.exercises) {
        s.exercises.forEach((ex) => {
          const recordBpm = s.exerciseStats?.[ex.id]?.bpm || s.bpm || 60;
          if (!exerciseCounters[ex.id]) {
            exerciseCounters[ex.id] = {
              title: ex.title,
              tech: ex.mainTechnique,
              count: 0,
              maxBpm: 0,
            };
          }
          exerciseCounters[ex.id].count += 1;
          if (recordBpm > exerciseCounters[ex.id].maxBpm) {
            exerciseCounters[ex.id].maxBpm = recordBpm;
          }
        });
      }
    });

    const topExercises: FavoriteExercise[] = Object.entries(exerciseCounters)
      .map(([id, data]) => ({
        id,
        title: data.title,
        technique: data.tech,
        timesPracticed: data.count,
        recordBpm: data.maxBpm,
      }))
      .sort((a, b) => b.timesPracticed - a.timesPracticed)
      .slice(0, 5);

    return {
      totalXP,
      currentRank,
      currentRankLevel: currentRankIndex + 1,
      nextRank,
      levelProgressPercent,
      currentStreak,
      finishedCount: finishedSessions.length,
      totalHours: (totalPracticeSeconds / 3600).toFixed(1),
      detailedTechniques,
      topExercises,
      totalPracticeSeconds,
    };
  }, [sessionHistory]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50 font-sans overflow-hidden text-slate-900">
      {/* Cabecera */}
      <header className="bg-white border-b border-slate-200 px-6 py-5 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Perfil y Estadísticas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Progreso técnico, velocidades máximas e historial completo
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
        >
          <ArrowLeft size={14} />
          Volver a inicio
        </Link>
      </header>

      {/* Pestañas */}
      <nav className="bg-white border-b border-slate-200 px-6 py-2 shrink-0 flex gap-2 overflow-x-auto custom-scrollbar">
        {(
          [
            { id: "general", label: "Vista general" },
            { id: "techniques", label: "Técnicas y velocidad" },
            { id: "exercises", label: "Top 5 ejercicios" },
            { id: "history", label: "Historial completo" },
          ] as { id: ProfileTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setInspectingSession(null);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Contenido */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6 max-w-6xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Tarjeta de Rango */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex flex-col items-center justify-center shrink-0">
                    <Award size={28} />
                    <span className="text-[11px] font-bold mt-0.5">
                      Nv. {analytics.currentRankLevel}
                    </span>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <span className="text-xs font-semibold text-indigo-600 block">
                      {user?.email?.split("@")[0] || "Guitarrista"}
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                      {analytics.currentRank.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      {analytics.currentRank.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-600 tabular-nums">
                      {analytics.totalXP} XP totales
                    </span>
                    {analytics.nextRank.name !== analytics.currentRank.name ? (
                      <span className="text-indigo-600 tabular-nums">
                        Faltan {analytics.nextRank.minXp - analytics.totalXP} XP
                        para {analytics.nextRank.name}
                      </span>
                    ) : (
                      <span className="text-emerald-600">
                        ¡Rango máximo alcanzado!
                      </span>
                    )}
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                      style={{ width: `${analytics.levelProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">
                      Tiempo total
                    </span>
                    <p className="text-xl font-bold text-slate-900 tabular-nums">
                      {analytics.totalHours} h
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">
                      Sesiones acabadas
                    </span>
                    <p className="text-xl font-bold text-slate-900 tabular-nums">
                      {analytics.finishedCount}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Flame size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">
                      Racha actual
                    </span>
                    <p className="text-xl font-bold text-emerald-700 tabular-nums">
                      {analytics.currentStreak} días
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "techniques" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Distribución por tiempo de práctica
                </h3>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex mt-3">
                  {analytics.detailedTechniques.map((tech, idx) => {
                    const percentage = Math.round(
                      (tech.totalSecondsSpent /
                        (analytics.totalPracticeSeconds || 1)) *
                        100,
                    );
                    const colors = [
                      "bg-indigo-500",
                      "bg-emerald-500",
                      "bg-amber-500",
                      "bg-rose-500",
                      "bg-cyan-500",
                      "bg-purple-500",
                    ];
                    if (percentage === 0) return null;
                    return (
                      <div
                        key={idx}
                        title={`${tech.name}: ${percentage}%`}
                        className={`${colors[idx % colors.length]} h-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="pb-3">Técnica</th>
                      <th className="pb-3 text-center">Sesiones</th>
                      <th className="pb-3 text-right">BPM Máx.</th>
                      <th className="pb-3 text-right">NPM Máx.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.detailedTechniques.map((tech, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-slate-900">
                          {tech.name}
                        </td>
                        <td className="py-3 text-center text-slate-600 tabular-nums">
                          {tech.sessionCount}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-indigo-600 tabular-nums">
                          {tech.maxBpm} BPM
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-emerald-600 tabular-nums">
                          {tech.maxNpm} NPM
                        </td>
                      </tr>
                    ))}
                    {analytics.detailedTechniques.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center text-slate-400"
                        >
                          Aún no hay sesiones completadas para calcular métricas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "exercises" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Top 5 ejercicios más practicados
              </h3>
              {analytics.topExercises.length > 0 ? (
                analytics.topExercises.map((ex, index) => (
                  <div
                    key={ex.id}
                    className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex justify-between items-center gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-indigo-600 shrink-0">
                        #{index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {ex.title}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {ex.technique}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3 items-center font-mono text-xs shrink-0 tabular-nums">
                      <span className="text-slate-500">
                        {ex.timesPracticed} veces
                      </span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-0.5">
                        {ex.recordBpm} BPM
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 py-8">
                  Completa sesiones para ver tus ejercicios más frecuentes
                </p>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-2.5">
              {sortedHistory.map((record) => {
                const isInspected = inspectingSession?.id === record.id;
                return (
                  <div
                    key={record.id}
                    onClick={() =>
                      setInspectingSession({
                        id: record.id,
                        name: record.technique,
                        exercises: record.exercises || [],
                        exerciseStats: record.exerciseStats,
                        totalXP: record.totalXP,
                        rpe: record.rpe,
                        durationSeconds: record.durationSeconds,
                        bpm: record.bpm,
                        date: record.date,
                      })
                    }
                    className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all cursor-pointer ${
                      isInspected
                        ? "border-indigo-500 ring-2 ring-indigo-500/10"
                        : "border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {record.technique}
                      </h4>
                      <span className="text-xs text-slate-500 block mt-0.5 capitalize">
                        {new Date(record.date).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex gap-3 items-center text-xs">
                      <div className="font-mono tabular-nums text-slate-600">
                        <span>
                          {Math.round((record.durationSeconds || 0) / 60)} min
                        </span>
                        <span className="text-slate-300 mx-1.5">|</span>
                        <span className="font-bold text-indigo-600">
                          {record.bpm} BPM
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 border rounded-full text-[11px] font-semibold ${
                          record.status === "Acabada"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {record.status || "Pendiente"}
                      </span>
                    </div>
                  </div>
                );
              })}
              {sortedHistory.length === 0 && (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-400">
                  Todavía no hay sesiones registradas
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna derecha: Caja Negra Analítica */}
        {activeTab === "history" && (
          <div className="w-80 shrink-0 hidden lg:block overflow-y-auto custom-scrollbar">
            {inspectingSession ? (
              inspectingSession.exerciseStats ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <header className="flex justify-between items-start gap-2 pb-3 border-b border-slate-100">
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-emerald-600 block">
                        Detalle de sesión
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                        {inspectingSession.name}
                      </h3>
                    </div>
                    {inspectingSession.date && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                        {new Date(inspectingSession.date).toLocaleDateString(
                          "es-ES",
                          {
                            day: "2-digit",
                            month: "short",
                          },
                        )}
                      </span>
                    )}
                  </header>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        Tiempo
                      </span>
                      <p className="text-sm font-bold text-slate-900 tabular-nums">
                        {Math.round(
                          (inspectingSession.durationSeconds || 0) / 60,
                        )}
                        m
                      </p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        BPM
                      </span>
                      <p className="text-sm font-bold text-indigo-600 tabular-nums">
                        {inspectingSession.bpm || 60}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        RPE
                      </span>
                      <p className="text-sm font-bold text-amber-600 tabular-nums">
                        {inspectingSession.rpe || "—"}/5
                      </p>
                    </div>
                  </div>

                  {inspectingSession.totalXP !== undefined && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center text-xs font-bold text-emerald-700">
                      +{inspectingSession.totalXP} XP ganados
                    </div>
                  )}

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {inspectingSession.exercises &&
                    inspectingSession.exercises.length > 0 ? (
                      inspectingSession.exercises.map((ex, i) => {
                        const exStat = inspectingSession.exerciseStats?.[ex.id];
                        const mins = exStat?.timeSpent
                          ? Math.floor(exStat.timeSpent / 60)
                          : 0;
                        const secs = exStat?.timeSpent
                          ? exStat.timeSpent % 60
                          : 0;

                        return (
                          <div
                            key={ex.id}
                            className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1"
                          >
                            <div className="flex gap-1.5 text-xs font-bold text-slate-900">
                              <span className="text-indigo-600">{i + 1}.</span>
                              <span className="truncate">{ex.title}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-mono tabular-nums text-slate-500">
                              <span>
                                {String(mins).padStart(2, "0")}:
                                {String(secs).padStart(2, "0")}
                              </span>
                              <div className="flex gap-2">
                                <span className="font-bold text-indigo-600">
                                  {exStat?.bpm || inspectingSession.bpm || 60}{" "}
                                  BPM
                                </span>
                                {exStat?.npm !== undefined && (
                                  <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 rounded">
                                    {exStat.npm} NPM
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-4">
                        Sin desglose de ejercicios
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <SessionInspector
                  name={inspectingSession.name}
                  exercises={inspectingSession.exercises}
                  daysData={inspectingSession.daysData}
                  showAction={false}
                />
              )
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 h-72 flex flex-col items-center justify-center text-center gap-2">
                <Search size={22} className="text-slate-300" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  Haz clic en cualquier sesión del historial para ver su
                  desglose
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
