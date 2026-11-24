"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Rocket, Search, X } from "lucide-react";
import { useApp, Exercise } from "../../src/context/AppContext";
import SessionInspector from "../../src/components/SessionInspector";
import { useIsMobile } from "../../src/hooks/useIsMobile";

interface InspectingState {
  name: string;
  exercises?: Exercise[];
  daysData?: {
    dayNumber: number;
    exercises: Exercise[];
    routineName?: string;
  }[];
}

export default function CatalogPage() {
  const router = useRouter();
  const {
    savedRoutines,
    presets,
    applyPresetToCalendar,
    forceRoutineToToday,
    user,
  } = useApp();
  const isMobile = useIsMobile();
  const [activeSubTab, setActiveSubTab] = useState<"routines" | "plans">(
    "routines",
  );
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [inspectingSession, setInspectingSession] =
    useState<InspectingState | null>(null);

  const publicRoutines = savedRoutines.filter((r) => r.isPublic);
  const publicPresets = presets ? presets.filter((p) => p.isPublic) : [];

  const handleApplyRoutine = async (
    routine: (typeof savedRoutines)[number],
  ) => {
    if (!user) return;
    await forceRoutineToToday(routine.name, routine.exercises || [], user.uid);
    setSelectedItemName(routine.name);
    setTimeout(() => router.push("/"), 1000);
  };

  const handleApplyPreset = async (preset: (typeof publicPresets)[number]) => {
    if (!user) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await applyPresetToCalendar(preset.id, tomorrow);
    setSelectedItemName(preset.name);
    setTimeout(() => router.push("/"), 1000);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50 font-sans overflow-hidden text-slate-900">
      {/* Cabecera */}
      <header className="bg-white border-b border-slate-200 px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Catálogo de Contenidos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Añade rutinas sueltas o planes completos directamente a tu
            calendario
          </p>
        </div>

        <div className="flex bg-slate-100 rounded-xl p-1 self-stretch sm:self-auto">
          <button
            onClick={() => {
              setActiveSubTab("routines");
              setInspectingSession(null);
            }}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "routines"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Rutinas de 1 día
          </button>
          <button
            onClick={() => {
              setActiveSubTab("plans");
              setInspectingSession(null);
            }}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "plans"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Planes completos
          </button>
        </div>
      </header>

      {/* Notificación */}
      {selectedItemName && (
        <div className="mx-6 mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center shrink-0">
          <span className="text-xs font-semibold text-emerald-800">
            &ldquo;{selectedItemName}&rdquo; añadido a tu calendario. Abriendo
            tu Torre de Control...
          </span>
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1 overflow-hidden p-4 md:p-6 min-h-0 flex gap-6 max-w-7xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
          {activeSubTab === "routines" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicRoutines.length === 0 ? (
                <p className="col-span-full text-center text-sm text-slate-400 py-12">
                  No hay rutinas públicas disponibles
                </p>
              ) : (
                publicRoutines.map((routine) => (
                  <div
                    key={routine.id}
                    onClick={() =>
                      setInspectingSession({
                        name: routine.name,
                        exercises: routine.exercises || [],
                      })
                    }
                    className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all cursor-pointer ${
                      inspectingSession?.name === routine.name
                        ? "border-indigo-500 ring-2 ring-indigo-500/10"
                        : "border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full">
                          Rutina única
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {routine.exercises?.length || 0} ejercicios
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-3 truncate">
                        {routine.name}
                      </h3>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyRoutine(routine);
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl mt-4 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Rocket size={14} />
                      Añadir a hoy
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === "plans" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicPresets.length === 0 ? (
                <p className="col-span-full text-center text-sm text-slate-400 py-12">
                  No hay planes públicos disponibles
                </p>
              ) : (
                publicPresets.map((preset) => {
                  const structuredDays = preset.days
                    ? preset.days.map((d) => {
                        const safeData = d as unknown as Record<
                          string,
                          unknown
                        >;
                        const customName = (safeData.routineName ||
                          safeData.name) as string | undefined;
                        return {
                          dayNumber: d.dayIndex + 1,
                          exercises: d.exercises || [],
                          routineName:
                            customName || `Rutina del Día ${d.dayIndex + 1}`,
                        };
                      })
                    : [];

                  return (
                    <div
                      key={preset.id}
                      onClick={() =>
                        setInspectingSession({
                          name: preset.name,
                          daysData: structuredDays,
                        })
                      }
                      className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all cursor-pointer ${
                        inspectingSession?.name === preset.name
                          ? "border-indigo-500 ring-2 ring-indigo-500/10"
                          : "border-slate-200"
                      }`}
                    >
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                          Plan · {preset.durationDays} días
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-3 truncate">
                          {preset.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {preset.description}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyPreset(preset);
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl mt-4 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CalendarPlus size={14} />
                        Iniciar mañana
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Inspector en escritorio */}
        {!isMobile && (
          <div className="w-80 shrink-0 overflow-y-auto custom-scrollbar">
            {inspectingSession ? (
              <SessionInspector
                name={inspectingSession.name}
                exercises={inspectingSession.exercises}
                daysData={inspectingSession.daysData}
                showAction={false}
              />
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 h-72 flex flex-col items-center justify-center text-center gap-2">
                <Search size={22} className="text-slate-300" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  Haz clic en cualquier tarjeta para ver sus ejercicios y
                  enfoque técnico
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de inspección en móvil */}
      {isMobile && inspectingSession && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
          onClick={() => setInspectingSession(null)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setInspectingSession(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-slate-100 text-slate-600"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
            <SessionInspector
              name={inspectingSession.name}
              exercises={inspectingSession.exercises}
              daysData={inspectingSession.daysData}
              showAction={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
