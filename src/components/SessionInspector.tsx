'use client';

import { useState } from 'react';
import { Exercise } from '../context/AppContext';

interface SessionInspectorProps {
  name: string;
  exercises?: Exercise[]; // Para rutinas sueltas de 1 día
  daysData?: { dayNumber: number; exercises: Exercise[]; routineName?: string }[]; 
  showAction?: boolean;
  actionButton?: React.ReactNode;
}

export default function SessionInspector({ 
  name, 
  exercises = [], 
  daysData = [], 
  showAction = false, 
  actionButton 
}: SessionInspectorProps) {
  
  const isMultiDay = daysData && daysData.length > 0;
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [prevName, setPrevName] = useState(name);

  if (name !== prevName) {
    setPrevName(name);
    setSelectedDayIndex(0);
  }

  // LÓGICA DE NORMALIZACIÓN INDEXADA (Respeta el orden real a rajatabla)
  const normalizedDays: { dayNumber: number; exercises: Exercise[]; routineName?: string }[] = [];
  
  if (isMultiDay) {
    // 1. Buscamos cuál es el último día real que programó el maestro en el plan
    const maxDayInDataset = Math.max(...daysData.map(d => d.dayNumber), 7);
    
    // 2. Calculamos cuántos días totales necesitamos para cerrar semanas completas de 7 días
    const totalDaysTarget = Math.ceil(maxDayInDataset / 7) * 7;
    
    // 3. Rellenamos el molde día por día en su posición exacta
    for (let i = 0; i < totalDaysTarget; i++) {
      const currentDayNumber = i + 1;
      
      // Buscamos si el maestro guardó entrenamiento para este día específico
      const realDayMatch = daysData.find(d => d.dayNumber === currentDayNumber);
      
      if (realDayMatch) {
        // Si existe, lo colocamos en su sitio con sus datos reales
        normalizedDays.push({
          dayNumber: currentDayNumber,
          exercises: realDayMatch.exercises || [],
          routineName: realDayMatch.routineName
        });
      } else {
        // Si no existe, es un hueco real en el cronograma: ¡DÍA DE DESCANSO EN SU SITIO!
        normalizedDays.push({
          dayNumber: currentDayNumber,
          exercises: [],
          routineName: 'Descanso Opcional'
        });
      }
    }
  }

  // Dividimos el cronograma normalizado en bloques exactos de 7 días (Semanas sin scroll)
  const weeks = [];
  if (isMultiDay) {
    for (let i = 0; i < normalizedDays.length; i += 7) {
      weeks.push(normalizedDays.slice(i, i + 7));
    }
  }

  // Obtenemos los datos del día seleccionado actualmente
  const activeDayData = isMultiDay ? normalizedDays[selectedDayIndex] : null;
  const activeExercises = isMultiDay ? (activeDayData?.exercises || []) : exercises;
  
  // Detectamos si el día actual es un día de descanso (no tiene ejercicios o se llama descanso)
  const isRestDay = isMultiDay && activeExercises.length === 0;

  // Estadísticas del bloque activo
  const totalExercises = activeExercises.length;
  const totalTime = totalExercises * 5; 
  const exerciseNames = activeExercises.map(ex => ex.title);

  // Calcular Enfoque Técnico
  const counts: Record<string, number> = {};
  activeExercises.forEach((ex) => {
    const tech = ex.mainTechnique || 'Otras';
    counts[tech] = (counts[tech] || 0) + 1;
  });

  const sortedTechs = Object.entries(counts)
    .map(([techName, count]) => ({ 
      name: techName, 
      percentage: Math.round((count / (totalExercises || 1)) * 100) 
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const techniques = sortedTechs.slice(0, 3);
  const others = sortedTechs.slice(3).reduce((acc, curr) => acc + curr.percentage, 0);

  return (
    <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-xl shadow-black/20 min-h-110 w-full flex flex-col justify-between">
      <div>
        {/* CABECERA */}
        <header className="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
              {isMultiDay ? '📋 Inspector de Plan' : '📋 Información de Sesión'}
            </h3>
            <span className="text-[10px] font-black text-slate-200 uppercase tracking-tight block truncate mt-0.5">
              {name || 'Resumen'}
            </span>
          </div>
          {isMultiDay && (
            <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase shrink-0 ml-2">
              {normalizedDays.length} Días
            </span>
          )}
        </header>

        {/* REJILLA DE SEMANAS Y DÍAS (NORMALIZADA A 7 DÍAS EXACTOS) */}
        {isMultiDay && (
          <div className="mb-4 bg-slate-900/60 border border-slate-700/30 rounded-xl p-2.5">
            <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest block mb-2">Cronograma del Plan:</span>
            
            <div className="space-y-3">
              {weeks.map((weekDays, wIndex) => (
                <div key={wIndex} className="flex flex-col gap-1.5 border-b border-slate-800/50 last:border-0 pb-2 last:pb-0">
                  <span className="text-[8px] font-black text-blue-400/80 uppercase tracking-wider">
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
                          className={`py-1.5 text-[9px] font-black rounded-md transition-all cursor-pointer text-center border relative ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/10 scale-105 z-10'
                              : hasNoExercises
                              ? 'bg-slate-950/40 text-slate-600 border-slate-900/60 hover:text-slate-400'
                              : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          D{d.dayNumber || absoluteIndex + 1}
                          {/* Pequeño indicador visual si el día es de descanso y no está seleccionado */}
                          {hasNoExercises && !isSelected && (
                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500/40 rounded-full"></span>
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

        {/* NOMBRE DE LA RUTINA O INDICADOR DE DESCANSO */}
        {isMultiDay && (
          <div className={`mb-4 border rounded-xl p-2.5 text-center transition-colors ${
            isRestDay 
              ? 'bg-amber-500/5 border-amber-500/20' 
              : 'bg-blue-500/5 border-blue-500/10'
          }`}>
            <span className={`text-[7px] uppercase font-black tracking-widest block mb-0.5 ${
              isRestDay ? 'text-amber-400' : 'text-blue-400'
            }`}>
              {isRestDay ? 'Status del Día:' : `Rutina Enfoque Día ${selectedDayIndex + 1}:`}
            </span>
            <p className="text-[10px] font-black text-slate-200 uppercase tracking-tight truncate">
              {isRestDay ? '🧘 Día de Descanso y Recuperación' : (activeDayData?.routineName || `Entrenamiento Diario #${selectedDayIndex + 1}`)}
            </p>
          </div>
        )}

        {/* MOSTRAR CONTENIDO SEGÚN CORRESPONDA */}
        {isRestDay ? (
          /* VISTA EXCLUSIVA PARA DÍAS DE DESCANSO */
          <div className="bg-slate-900/40 border border-dashed border-slate-700/30 rounded-xl p-6 text-center my-4 flex flex-col items-center justify-center min-h-35">
            <span className="text-xl mb-1 text-amber-500/80 animate-pulse">🧘</span>
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">Músculos en Reparación</h4>
            <p className="text-[9px] text-slate-500 font-bold uppercase max-w-50 leading-normal">
              Hoy no hay ejercicios asignados. Dedica este tiempo a relajar las manos, estirar o repasar teoría.
            </p>
          </div>
        ) : (
          /* VISTA ESTÁNDAR CON EJERCICIOS */
          <>
            {/* CONTADORES */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-center">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-700/50">
                <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest block mb-0.5">Ejercicios</span>
                <p className="text-sm font-black text-slate-200 leading-none">{totalExercises}</p>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-700/50">
                <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest block mb-0.5">Tiempo estimado</span>
                <p className="text-sm font-black text-slate-200 leading-none">{totalTime} <span className="text-[9px] text-slate-400">min</span></p>
              </div>
            </div>

            {/* LISTA DE EJERCICIOS */}
            <div className="space-y-1.5 mb-4 max-h-28 overflow-y-auto pr-1 custom-scrollbar">
              {exerciseNames.length > 0 ? exerciseNames.map((n, i) => (
                <div key={i} className="flex gap-2 items-center text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 pb-1.5 leading-tight last:border-0">
                  <span className="text-blue-500 w-3 text-right font-black">{i + 1}.</span> <span className="truncate">{n}</span>
                </div>
              )) : <span className="text-[9px] text-slate-500 italic block text-center mt-4">No hay ejercicios para este día</span>}
            </div>

            {/* ENFOQUE TÉCNICO */}
            <div className="space-y-2">
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest block">Enfoque Técnico</span>
              <div className="flex flex-wrap gap-1.5">
                {techniques.map(t => (
                  <div key={t.name} className="bg-slate-900 border border-slate-700/50 px-2 py-1 rounded flex items-center gap-1.5 shadow-sm">
                    <span className="text-[8px] font-black text-slate-400 uppercase leading-none">{t.name}</span>
                    <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 px-1 rounded leading-none">{t.percentage}%</span>
                  </div>
                ))}
                {others > 0 && (
                  <div className="bg-slate-900/50 border border-slate-700/50 border-dashed px-2 py-1 rounded flex items-center gap-1.5">
                    <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Otros</span>
                    <span className="text-[8px] font-black text-slate-400 leading-none">{others}%</span>
                  </div>
                )}
                {techniques.length === 0 && (
                  <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider">Sin métricas</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ACCIÓN ACCESORIA */}
      {showAction && actionButton && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          {actionButton}
        </div>
      )}
    </div>
  );
}