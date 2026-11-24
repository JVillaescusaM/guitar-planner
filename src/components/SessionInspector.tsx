"use client";

import { useState } from "react";
import { Exercise } from "../context/AppContext";

interface SessionInspectorProps {
  name: string;
  exercises?: Exercise[];
  daysData?: {
    dayNumber: number;
    exercises: Exercise[];
    routineName?: string;
  }[];
  showAction?: boolean;
  actionButton?: React.ReactNode;
}

export default function SessionInspector({
  name,
  exercises = [],
  daysData = [],
  showAction = false,
  actionButton,
}: SessionInspectorProps) {
  const isMultiDay = daysData && daysData.length > 0;
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [prevName, setPrevName] = useState(name);

  if (name !== prevName) {
    setPrevName(name);
    setSelectedDayIndex(0);
  }

  const normalizedDays: {
    dayNumber: number;
    exercises: Exercise[];
    routineName?: string;
  }[] = [];

  if (isMultiDay) {
    const maxDayInDataset = Math.max(...daysData.map((d) => d.dayNumber), 7);
    const totalDaysTarget = Math.ceil(maxDayInDataset / 7) * 7;

    for (let i = 0; i < totalDaysTarget; i++) {
      const currentDayNumber = i + 1;
      const realDayMatch = daysData.find(
        (d) => d.dayNumber === currentDayNumber,
      );

      if (realDayMatch) {
        normalizedDays.push({
          dayNumber: currentDayNumber,
          exercises: realDayMatch.exercises || [],
          routineName: realDayMatch.routineName,
        });
      } else {
        normalizedDays.push({
          dayNumber: currentDayNumber,
          exercises: [],
          routineName: "Descanso opcional",
        });
      }
    }
  }

  const weeks = [];
  if (isMultiDay) {
    for (let i = 0; i < normalizedDays.length; i += 7) {
      weeks.push(normalizedDays.slice(i, i + 7));
    }
  }

  const activeDayData = isMultiDay ? normalizedDays[selectedDayIndex] : null;
  const activeExercises = isMultiDay
    ? activeDayData?.exercises || []
    : exercises;
  const isRestDay = isMultiDay && activeExercises.length === 0;

  const totalExercises = activeExercises.length;
  const totalTime = totalExercises * 5;
  const exerciseNames = activeExercises.map((ex) => ex.title);

  const counts: Record<string, number> = {};
  activeExercises.forEach((ex) => {
    const tech = ex.mainTechnique || "Otras";
    counts[tech] = (counts[tech] || 0) + 1;
  });

  const sortedTechs = Object.entries(counts)
    .map(([techName, count]) => ({
      name: techName,
      percentage: Math.round((count / (totalExercises || 1)) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const techniques = sortedTechs.slice(0, 3);
  const others = sortedTechs
    .slice(3)
    .reduce((acc, curr) => acc + curr.percentage, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs w-full flex flex-col justify-between">
      <div>
        {/* Cabecera */}
        <header className="flex justify-between items-start gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-indigo-600 block">
              {isMultiDay ? "Inspector de Plan" : "Detalle de Sesión"}
            </span>
            <h3 className="text-base font-bold text-slate-900 truncate mt-0.5">
              {name || "Resumen"}
            </h3>
          </div>
          {isMultiDay && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
              {normalizedDays.length} días
            </span>
          )}
        </header>

        {/* Cronograma semanal */}
        {isMultiDay && (
          <div className="mb-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-xs font-semibold text-slate-500 block mb-2">
              Cronograma del plan
            </span>
            <div className="space-y-3">
              {weeks.map((weekDays, wIndex) => (
                <div
                  key={wIndex}
                  className="flex flex-col gap-1.5 border-b border-slate-200/60 last:border-0 pb-2.5 last:pb-0"
                >
                  <span className="text-[11px] font-semibold text-slate-500">
                    Semana {wIndex + 1}
                  </span>
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((d, dIndex) => {
                      const absoluteIndex = wIndex * 7 + dIndex;
                      const isSelected = selectedDayIndex === absoluteIndex;
                      const hasNoExercises = d.exercises.length === 0;

                      return (
                        <button
                          key={absoluteIndex}
                          onClick={() => setSelectedDayIndex(absoluteIndex)}
                          className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center border relative ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : hasNoExercises
                                ? "bg-white/60 text-slate-400 border-slate-200/70 hover:text-slate-600"
                                : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                          }`}
                        >
                          D{d.dayNumber || absoluteIndex + 1}
                          {hasNoExercises && !isSelected && (
                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indicador de día */}
        {isMultiDay && (
          <div
            className={`mb-4 border rounded-xl p-3 text-center ${
              isRestDay
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-indigo-50/70 border-indigo-200/70 text-indigo-950"
            }`}
          >
            <span
              className={`text-[11px] font-semibold block mb-0.5 ${
                isRestDay ? "text-amber-700" : "text-indigo-600"
              }`}
            >
              {isRestDay ? "Estado del día" : `Día ${selectedDayIndex + 1}`}
            </span>
            <p className="text-sm font-bold truncate">
              {isRestDay
                ? "Día de descanso y recuperación"
                : activeDayData?.routineName ||
                  `Entrenamiento #${selectedDayIndex + 1}`}
            </p>
          </div>
        )}

        {isRestDay ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center my-4 flex flex-col items-center justify-center min-h-36">
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              Descanso activo
            </h4>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Hoy no hay ejercicios asignados. Aprovecha para relajar las manos,
              estirar o repasar teoría.
            </p>
          </div>
        ) : (
          <>
            {/* Contadores */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
                <span className="text-xs font-medium text-slate-500 block mb-0.5">
                  Ejercicios
                </span>
                <p className="text-lg font-bold text-slate-900 tabular-nums">
                  {totalExercises}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
                <span className="text-xs font-medium text-slate-500 block mb-0.5">
                  Tiempo estimado
                </span>
                <p className="text-lg font-bold text-slate-900 tabular-nums">
                  {totalTime}{" "}
                  <span className="text-xs font-medium text-slate-500">
                    min
                  </span>
                </p>
              </div>
            </div>

            {/* Lista de ejercicios */}
            <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {exerciseNames.length > 0 ? (
                exerciseNames.map((n, i) => (
                  <div
                    key={i}
                    className="flex gap-2 items-center text-xs font-medium text-slate-700 border-b border-slate-100 pb-1.5 last:border-0"
                  >
                    <span className="text-indigo-600 w-4 text-right font-bold tabular-nums">
                      {i + 1}.
                    </span>
                    <span className="truncate">{n}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  No hay ejercicios para este día
                </p>
              )}
            </div>

            {/* Enfoque técnico */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 block">
                Enfoque técnico
              </span>
              <div className="flex flex-wrap gap-1.5">
                {techniques.map((t) => (
                  <div
                    key={t.name}
                    className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                  >
                    <span className="text-xs font-medium text-slate-700">
                      {t.name}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 tabular-nums">
                      {t.percentage}%
                    </span>
                  </div>
                ))}
                {others > 0 && (
                  <div className="bg-slate-50 border border-dashed border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-500">
                      Otros
                    </span>
                    <span className="text-xs font-bold text-slate-600 tabular-nums">
                      {others}%
                    </span>
                  </div>
                )}
                {techniques.length === 0 && (
                  <span className="text-xs text-slate-400">Sin métricas</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {showAction && actionButton && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          {actionButton}
        </div>
      )}
    </div>
  );
}
