'use client';

import { useState } from 'react';
import { useApp, Exercise } from '../../src/context/AppContext';
import SessionInspector from '../../src/components/SessionInspector';

// Definimos una interfaz limpia para el estado del inspector para que admita ambos casos
interface InspectingState {
  name: string;
  exercises?: Exercise[];
  daysData?: { dayNumber: number; exercises: Exercise[]; routineName?: string }[];
}

export default function CatalogPage() {
  const { savedRoutines, presets, applyPresetToCalendar, forceRoutineToToday, user } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'routines' | 'plans'>('routines');
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);

  // Estado del inspector
  const [inspectingSession, setInspectingSession] = useState<InspectingState | null>(null);

  // Filtramos los contenidos públicos firmados por el maestro
  const publicRoutines = savedRoutines.filter(r => r.isPublic);
  const publicPresets = presets ? presets.filter((p) => p.isPublic) : [];

  const handleApplyRoutine = async (routine: typeof savedRoutines[number]) => {
    if (!user) return;
    await forceRoutineToToday(routine.name, routine.exercises || [], user.uid);
    setSelectedItemName(routine.name); // Mostramos la notificación verde
    
    // Automatización total: Tras 1.5 segundos, forzamos la recarga en la Torre de Control
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };

  const handleApplyPreset = async (preset: typeof publicPresets[number]) => {
    if (!user) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await applyPresetToCalendar(preset.id, tomorrow, user.uid);
    setSelectedItemName(preset.name);

    // Automatización total también para los planes
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-900 font-sans overflow-hidden text-slate-200">
      
      {/* CABECERA DEL ESCAPARATE */}
      <header className="bg-slate-950 border-b border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-lg font-black uppercase tracking-tight text-purple-400">Escaparate de Contenidos</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Auto-asígnate entrenamientos públicos diseñados por el maestro</p>
        </div>

        {/* SELECTOR DE CATEGORÍA */}
        <div className="flex bg-slate-900 rounded-xl border border-slate-800 p-1 self-stretch sm:self-auto">
          <button
            onClick={() => { setActiveSubTab('routines'); setInspectingSession(null); }}
            className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeSubTab === 'routines' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📦 Rutinas de 1 Día
          </button>
          <button
            onClick={() => { setActiveSubTab('plans'); setInspectingSession(null); }}
            className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeSubTab === 'plans' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📆 Planes Completos
          </button>
        </div>
      </header>

      
      {/* NOTIFICACIÓN FLOTANTE AUTOMÁTICA */}
      {selectedItemName && (
        <div className="mx-6 mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center shrink-0 animate-fade-in shadow-lg">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
            ¡Inscripción en &ldquo;{selectedItemName}&rdquo;! Redirigiendo a tu Torre... 🚀
          </span>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* COLUMNA IZQUIERDA: LISTADO DE TARJETAS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          
          {activeSubTab === 'routines' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicRoutines.length === 0 ? (
                <p className="col-span-full text-center text-[10px] text-slate-600 font-bold uppercase py-12">No hay rutinas públicas</p>
              ) : (
                publicRoutines.map(routine => (
                  <div 
                    key={routine.id} 
                    onClick={() => setInspectingSession({ name: routine.name, exercises: routine.exercises || [] })}
                    className={`bg-slate-800 border rounded-2xl p-4 shadow-lg flex flex-col justify-between hover:border-purple-500/40 transition-all group cursor-pointer ${inspectingSession?.name === routine.name ? 'border-purple-500 shadow-purple-500/5' : 'border-slate-700/40'}`}
                  >
                    <div>
                      <span className="text-[7px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">Rutina Única</span>
                      <h3 className="text-xs font-black uppercase tracking-tight text-slate-200 mt-2 truncate group-hover:text-purple-400 transition-colors">{routine.name}</h3>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApplyRoutine(routine); }}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-[8px] uppercase tracking-widest py-2 rounded-lg mt-4 transition-all cursor-pointer shadow-md shadow-purple-600/20"
                    >
                      🚀 Añadir a Hoy
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === 'plans' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicPresets.length === 0 ? (
                <p className="col-span-full text-center text-[10px] text-slate-600 font-bold uppercase py-12">No hay planes públicos</p>
              ) : (
                publicPresets.map((preset) => {
                  // Mapeamos los días de forma tipada, extrayendo nombres dinámicos de forma segura
                 // Mapeamos los días de forma tipada, extrayendo nombres dinámicos de forma ultra-segura
const structuredDays = preset.days ? preset.days.map((d) => {
  // El doble cast "unknown -> Record" es la forma legal en TypeScript de leer propiedades ocultas
  const safeData = d as unknown as Record<string, unknown>;
  const customName = (safeData.routineName || safeData.name) as string | undefined;

  return {
    dayNumber: d.dayIndex + 1,
    exercises: d.exercises || [],
    routineName: customName || `Rutina del Día ${d.dayIndex + 1}`
  };
}) : [];

                  return (
                    <div 
                      key={preset.id}
                      onClick={() => setInspectingSession({ 
                        name: preset.name, 
                        daysData: structuredDays 
                      })}
                      className={`bg-slate-800 border rounded-2xl p-4 shadow-lg flex flex-col justify-between hover:border-purple-500/40 transition-all group cursor-pointer ${inspectingSession?.name === preset.name ? 'border-purple-500 shadow-purple-500/5' : 'border-slate-700/40'}`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">Curso {preset.durationDays} Días</span>
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-tight text-slate-200 mt-2 truncate group-hover:text-purple-400 transition-colors">{preset.name}</h3>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">{preset.description}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleApplyPreset(preset); }}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-[8px] uppercase tracking-widest py-2 rounded-lg mt-4 transition-all cursor-pointer shadow-md shadow-purple-600/20"
                      >
                        📆 Iniciar Mañana
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>

        {/* COLUMNA DERECHA: NUESTRO INSPECTOR DE CONSULTA PURA */}
        <div className="w-80 shrink-0 hidden lg:block overflow-y-auto custom-scrollbar">
          {inspectingSession ? (
            <SessionInspector 
              name={inspectingSession.name}
              exercises={inspectingSession.exercises}
              daysData={inspectingSession.daysData}
              showAction={false}
            />
          ) : (
            <div className="bg-slate-800/40 border border-dashed border-slate-800 rounded-2xl p-6 h-80 flex flex-col items-center justify-center text-center">
              <span className="text-xl mb-2 opacity-30">🔍</span>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-normal">
                Haz clic en cualquier tarjeta<br />para inspeccionar sus ejercicios y técnicas
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}