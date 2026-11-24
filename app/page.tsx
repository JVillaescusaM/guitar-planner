"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Trash2,
  Play,
  CheckCircle2,
} from "lucide-react";
import { useApp, Exercise } from "../src/context/AppContext";
import SessionInspector from "../src/components/SessionInspector";

export default function Dashboard() {
  const router = useRouter();
  const {
    sessionHistory,
    removeSessionRecord,
    loadRoutine,
    setActiveSessionId,
    logout,
    user,
  } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [viewingSession, setViewingSession] = useState<{
    id?: string;
    name: string;
    exercises: Exercise[];
    status?: string;
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const dayNames = ["L", "M", "X", "J", "V", "S", "D"];

  const todayObj = new Date();

  const isToday = useMemo(() => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  }, [selectedDate]);

  const isPastOrToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(selectedDate);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate.getTime() <= today.getTime();
  }, [selectedDate]);

  const { blanks, monthDays } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    return {
      blanks: Array.from({ length: startingDay }, (_, i) => `blank-${i}`),
      monthDays: Array.from({ length: daysInMonth }, (_, i) => i + 1),
    };
  }, [year, month]);

  const dayEvents = useMemo(() => {
    return sessionHistory.filter((record) => {
      const d = new Date(record.date);
      return (
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [selectedDate, sessionHistory]);

  const dayStatuses = useMemo(() => {
    const statuses: Record<number, "done" | "pending" | null> = {};
    monthDays.forEach((day) => {
      const events = sessionHistory.filter((record) => {
        const d = new Date(record.date);
        return (
          d.getDate() === day &&
          d.getMonth() === month &&
          d.getFullYear() === year
        );
      });
      if (events.length > 0) {
        const allDone = events.every((ev) => ev.status === "Acabada");
        statuses[day] = allDone ? "done" : "pending";
      } else {
        statuses[day] = null;
      }
    });
    return statuses;
  }, [sessionHistory, monthDays, month, year]);

  return (
    <div className="w-full min-h-full p-4 lg:p-8 flex flex-col gap-6 bg-slate-50 text-slate-900 max-w-6xl mx-auto">
      {/* Cabecera */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Torre de Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tu calendario y sesiones de estudio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 hidden sm:inline-block">
            {user?.email}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
        {/* Columna izquierda: Calendario y Agenda */}
        <div className="flex flex-col gap-6">
          {/* Calendario */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => {
                  setCurrentDate(new Date(year, month - 1, 1));
                  setViewingSession(null);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Mes anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-sm font-bold text-slate-900">
                {monthNames[month]} {year}
              </h2>
              <button
                onClick={() => {
                  setCurrentDate(new Date(year, month + 1, 1));
                  setViewingSession(null);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Mes siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map((d) => (
                <div
                  key={d}
                  className="py-1.5 text-center text-xs font-semibold text-slate-400"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {blanks.map((id) => (
                <div key={id} className="h-10" />
              ))}
              {monthDays.map((day) => {
                const isSelected =
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() === month &&
                  selectedDate.getFullYear() === year;
                const isCurrentDay =
                  todayObj.getDate() === day &&
                  todayObj.getMonth() === month &&
                  todayObj.getFullYear() === year;
                const status = dayStatuses[day];

                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDate(new Date(year, month, day));
                      setViewingSession(null);
                    }}
                    className={`h-10 rounded-xl relative flex flex-col items-center justify-center transition-all cursor-pointer text-sm font-semibold tabular-nums ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-xs"
                        : isCurrentDay
                          ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300"
                          : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{day}</span>
                    {status && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          isSelected
                            ? "bg-white"
                            : status === "done"
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Agenda del día */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <header className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Agenda del día
              </h3>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg capitalize">
                {selectedDate.toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            </header>

            <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {dayEvents.length > 0 ? (
                dayEvents.map((ev) => {
                  const isSelectedEvent = viewingSession?.id === ev.id;
                  const canDelete = !(
                    ev.status === "Acabada" ||
                    (!isToday && isPastOrToday) ||
                    (ev.assignedBy && ev.assignedBy !== user?.uid)
                  );

                  return (
                    <div
                      key={ev.id}
                      onClick={() =>
                        setViewingSession({
                          id: ev.id,
                          name: ev.technique,
                          exercises: ev.exercises || [],
                          status: ev.status,
                        })
                      }
                      className={`p-3.5 rounded-xl border flex justify-between items-center group cursor-pointer transition-all ${
                        isSelectedEvent
                          ? "bg-indigo-50/60 border-indigo-400 shadow-xs"
                          : ev.status === "Acabada"
                            ? "bg-slate-50 border-slate-200/80 opacity-75 hover:opacity-100"
                            : "bg-white border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex flex-col gap-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {ev.technique}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              ev.status === "Acabada"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : ev.status === "Inacabada"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {ev.status || "Pendiente"}
                          </span>
                        </div>
                        {ev.isPreset && (
                          <span className="text-xs font-medium text-indigo-600">
                            Plan de estudio
                          </span>
                        )}
                      </div>

                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSessionRecord(ev.id);
                            if (viewingSession?.id === ev.id)
                              setViewingSession(null);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Borrar sesión"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs font-medium text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  Día despejado. Añade una rutina desde el Catálogo.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Columna derecha: Inspector */}
        <div className="flex flex-col gap-4">
          <SessionInspector
            name={viewingSession ? viewingSession.name : "Resumen del día"}
            exercises={
              viewingSession
                ? viewingSession.exercises
                : dayEvents.flatMap((ev) => ev.exercises || [])
            }
            showAction={true}
            actionButton={
              !viewingSession?.id ? (
                <div className="w-full bg-slate-50 border border-dashed border-slate-200 text-slate-500 font-medium text-xs py-3 px-4 rounded-xl text-center">
                  Selecciona una sesión de la agenda para empezar a practicar
                </div>
              ) : !isPastOrToday ? (
                <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs py-3 rounded-xl text-center">
                  No puedes adelantar sesiones de días futuros
                </div>
              ) : viewingSession.status !== "Acabada" ? (
                <button
                  onClick={() => {
                    loadRoutine(viewingSession.exercises, viewingSession.name);
                    if (viewingSession.id)
                      setActiveSessionId(viewingSession.id);
                    router.push("/practice");
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  {viewingSession.status === "Inacabada"
                    ? "Reanudar rutina"
                    : "Empezar rutina"}
                </button>
              ) : (
                <div className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  Sesión completada
                </div>
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
