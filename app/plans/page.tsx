"use client";

import { useState, useEffect } from "react";
import { Trash2, ArrowUp, ArrowDown, Plus, Search } from "lucide-react";
import exercisesData from "../../src/data/exercises.json";
import { useApp, Exercise } from "../../src/context/AppContext";
import SessionInspector from "../../src/components/SessionInspector";
import DesktopOnly from "../../src/components/DesktopOnly";

const allTechniques = Array.from(
  new Set(exercisesData.map((ej) => ej.mainTechnique || "OTROS")),
).sort();

export default function PlansPage() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<"routines" | "plans" | "manager">(
    "routines",
  );

  const isMaster = user?.email?.toLowerCase() === "jvillaescusam@gmail.com";

  if (!user) return null;

  if (!isMaster) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-700 h-full">
        <h1 className="text-lg font-bold">Acceso restringido</h1>
        <p className="text-xs text-slate-500 mt-1">
          Esta sección es exclusiva para el profesor.
        </p>
      </div>
    );
  }

  return (
    <DesktopOnly label="La Forja Maestra">
      <div className="flex flex-col h-full min-h-0 bg-slate-50 text-slate-900 overflow-hidden font-sans">
        {/* Cabecera */}
        <header className="bg-white border-b border-slate-200 px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              La Forja Maestra
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Crea rutinas, empaqueta planes de varios días y asígnalos a tus
              alumnos
            </p>
          </div>

          <div className="flex bg-slate-100 rounded-xl p-1">
            {(
              [
                { id: "routines", label: "Crear rutina" },
                { id: "plans", label: "Diseñar plan" },
                { id: "manager", label: "Gestor y asignar" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {activeTab === "routines" && <RoutineConstructor />}
          {activeTab === "plans" && <PlanDesigner />}
          {activeTab === "manager" && <ContentManager />}
        </div>
      </div>
    </DesktopOnly>
  );
}

// =========================================================================
// 1. CONSTRUCTOR DE RUTINAS
// =========================================================================
function RoutineConstructor() {
  const {
    routine,
    addToRoutine,
    removeFromRoutine,
    saveCurrentRoutine,
    clearRoutine,
    reorderRoutine,
  } = useApp();
  const [filter, setFilter] = useState<string>("TODOS");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [routineName, setRoutineName] = useState<string>("");

  const filteredExercises = (exercisesData as Exercise[]).filter((ej) => {
    const matchesFilter =
      filter === "TODOS" || (ej.mainTechnique || "OTROS") === filter;
    const matchesSearch = ej.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleBuildRoutine = async () => {
    if (!routineName.trim()) return alert("Ponle un nombre a la rutina.");
    if (routine.length === 0) return alert("Añade al menos un ejercicio.");

    await saveCurrentRoutine(routineName.trim(), true, null);
    alert("Rutina guardada correctamente.");
    setRoutineName("");
    clearRoutine();
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Carrito */}
      <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-700">
            Ejercicios en la rutina ({routine.length})
          </span>
          {routine.length > 0 && (
            <button
              onClick={clearRoutine}
              className="text-xs text-slate-400 hover:text-red-600 cursor-pointer"
            >
              Vaciar
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {routine.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
              <p className="text-xs">
                Añade ejercicios desde la tabla de la derecha.
              </p>
            </div>
          ) : (
            routine.map((ej, idx) => (
              <div
                key={`${ej.instanceId || ej.id}-${idx}`}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center gap-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-indigo-600 block">
                    {idx + 1}. {ej.mainTechnique}
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {ej.title}
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => reorderRoutine(idx, idx - 1)}
                    disabled={idx === 0}
                    className="p-1 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer disabled:opacity-30"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => reorderRoutine(idx, idx + 1)}
                    disabled={idx === routine.length - 1}
                    className="p-1 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer disabled:opacity-30"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => removeFromRoutine(ej.instanceId || ej.id)}
                    className="p-1 text-red-500 hover:bg-red-50 bg-white border border-slate-200 rounded-lg cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {routine.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2.5">
            <input
              type="text"
              placeholder="Nombre de la rutina..."
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleBuildRoutine}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Guardar rutina
            </button>
          </div>
        )}
      </aside>

      {/* Selector de ejercicios */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col xl:flex-row gap-3 shrink-0">
          <input
            type="text"
            placeholder="Filtrar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs w-full xl:w-64 outline-none focus:border-indigo-500 focus:bg-white"
          />
          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setFilter("TODOS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                filter === "TODOS"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              TODOS
            </button>
            {allTechniques.map((tech) => (
              <button
                key={tech}
                onClick={() => setFilter(tech)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  filter === tech
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900"
                }`}
              >
                {tech}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="p-3 w-16 text-center">ID</th>
                  <th className="p-3">Título</th>
                  <th className="p-3 hidden md:table-cell">Técnica</th>
                  <th className="p-3 text-center w-28">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredExercises.map((ej) => (
                  <tr key={ej.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-400 font-mono text-center">
                      {ej.id}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      {ej.title}
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {ej.mainTechnique}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => addToRoutine(ej)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                        <Plus size={13} /> Añadir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

// =========================================================================
// 2. DISEÑADOR DE PLANES
// =========================================================================
function PlanDesigner() {
  const { savedRoutines, savePreset } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(7);
  const [selectedRoutines, setSelectedRoutines] = useState<
    Record<number, string>
  >({});

  const availableRoutines = savedRoutines.filter(
    (r) => r.exercises && r.exercises.length > 0,
  );

  const handleSavePlan = async () => {
    if (!name.trim()) return alert("Ponle un nombre al plan.");
    if (!description.trim()) return alert("Añade una descripción breve.");

    const daysConfig = [];
    for (const [dayIndexStr, routineId] of Object.entries(selectedRoutines)) {
      if (routineId) {
        const routineInfo = availableRoutines.find((r) => r.id === routineId);
        if (routineInfo) {
          daysConfig.push({
            dayIndex: parseInt(dayIndexStr, 10),
            routineName: routineInfo.name,
            exercises: routineInfo.exercises,
          });
        }
      }
    }

    if (daysConfig.length === 0)
      return alert("Asigna al menos una rutina a algún día.");

    await savePreset({
      name: name.trim(),
      description: description.trim(),
      isPublic: true,
      durationDays: duration,
      days: daysConfig,
    });

    alert("Plan guardado correctamente.");
    setName("");
    setDescription("");
    setSelectedRoutines({});
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white p-5 space-y-4 shrink-0 overflow-y-auto custom-scrollbar">
        <h3 className="text-sm font-bold text-slate-900">
          Configuración del plan
        </h3>
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">
              Nombre
            </label>
            <input
              type="text"
              placeholder="Ej: Bootcamp Alzapúa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">
              Descripción
            </label>
            <textarea
              rows={3}
              placeholder="Objetivo del plan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">
              Duración
            </label>
            <select
              value={duration}
              onChange={(e) => {
                setDuration(Number(e.target.value));
                setSelectedRoutines({});
              }}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
            >
              <option value={7}>1 semana (7 días)</option>
              <option value={14}>2 semanas (14 días)</option>
              <option value={28}>1 mes (28 días)</option>
            </select>
          </div>
          <button
            onClick={handleSavePlan}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer mt-2"
          >
            Guardar plan
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
        <div className="max-w-xl mx-auto space-y-3">
          {Array.from({ length: duration }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  selectedRoutines[idx]
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {idx + 1}
              </div>
              <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Día {idx + 1}
                </span>
                <select
                  value={selectedRoutines[idx] || ""}
                  onChange={(e) =>
                    setSelectedRoutines((prev) => ({
                      ...prev,
                      [idx]: e.target.value,
                    }))
                  }
                  className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none cursor-pointer"
                >
                  <option value="">Descanso / Recuperación</option>
                  {availableRoutines.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.exercises?.length} ej.)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// =========================================================================
// 3. GESTOR Y ASIGNACIONES
// =========================================================================
interface InspectingState {
  name: string;
  exercises?: Exercise[];
  daysData?: {
    dayNumber: number;
    exercises: Exercise[];
    routineName?: string;
  }[];
}

interface StudentEvent {
  id: string;
  date: string | Date;
  technique: string;
  status?: string;
  exercises?: Exercise[];
  [key: string]: unknown;
}

function ContentManager() {
  const {
    savedRoutines,
    presets,
    deleteSavedRoutine,
    deletePreset,
    students,
    applyPresetToCalendar,
    loadRoutine,
    removeSessionRecord,
    user,
  } = useApp();
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [inspectingSession, setInspectingSession] =
    useState<InspectingState | null>(null);
  const [routinesList, setRoutinesList] = useState(() => savedRoutines);
  const [presetsList, setPresetsList] = useState(() => presets);
  const [activeStudentEvents, setActiveStudentEvents] = useState<
    StudentEvent[]
  >([]);

  const todayStr = new Date().toISOString().split("T")[0];
  const [routineDates, setRoutineDates] = useState<Record<string, string>>({});
  const [presetDates, setPresetDates] = useState<Record<string, string>>({});

  useEffect(() => {
    setRoutinesList(savedRoutines);
  }, [savedRoutines]);

  useEffect(() => {
    setPresetsList(presets);
  }, [presets]);

  useEffect(() => {
    if (!selectedStudent) {
      setActiveStudentEvents([]);
      return;
    }

    let unsubscribe = () => {};
    const listen = async () => {
      const { db } = await import("../../src/lib/firebase");
      const { collection, query, where, onSnapshot } =
        await import("firebase/firestore");
      const q = query(
        collection(db, "sessions"),
        where("userId", "==", selectedStudent),
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as StudentEvent[];
        data.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        setActiveStudentEvents(data);
      });
    };
    listen();
    return () => unsubscribe();
  }, [selectedStudent]);

  const toggleRoutinePublic = async (id: string, currentStatus: boolean) => {
    setRoutinesList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isPublic: !currentStatus } : r)),
    );
    const { db } = await import("../../src/lib/firebase");
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "routines", id), { isPublic: !currentStatus });
  };

  const togglePresetPublic = async (id: string, currentStatus: boolean) => {
    setPresetsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPublic: !currentStatus } : p)),
    );
    const { db } = await import("../../src/lib/firebase");
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "presets", id), { isPublic: !currentStatus });
  };

  const handleForceRoutineToDate = async (
    routineData: (typeof savedRoutines)[number],
    dateString: string,
  ) => {
    if (!selectedStudent) return alert("Elige primero un alumno.");
    try {
      const { db } = await import("../../src/lib/firebase");
      const { collection, addDoc } = await import("firebase/firestore");
      const targetDate = new Date(dateString + "T12:00:00");
      await addDoc(collection(db, "sessions"), {
        userId: selectedStudent,
        technique: routineData.name,
        exercises: routineData.exercises || [],
        date: targetDate.toISOString(),
        durationSeconds: 0,
        bpm: 60,
        status: "Pendiente",
        assignedBy: user?.uid || "teacher",
        isPreset: false,
      });
      alert(
        `Rutina "${routineData.name}" asignada para el ${targetDate.toLocaleDateString("es-ES")}.`,
      );
    } catch (error) {
      console.error("Error al programar rutina:", error);
      alert("No se pudo asignar la rutina.");
    }
  };

  const handleForcePlanToDate = async (
    presetId: string,
    dateString: string,
  ) => {
    if (!selectedStudent) return alert("Elige primero un alumno.");
    const targetStartDate = new Date(dateString + "T12:00:00");
    const count = await applyPresetToCalendar(
      presetId,
      targetStartDate,
      selectedStudent,
    );
    if (count > 0) {
      alert(
        `Plan asignado (${count} sesiones) desde el ${targetStartDate.toLocaleDateString("es-ES")}.`,
      );
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-5 overflow-hidden bg-slate-50">
      {/* Selector de alumno */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-2xl mx-auto w-full flex items-center justify-between gap-4 shadow-xs shrink-0">
        <div>
          <span className="text-xs font-bold text-indigo-600 block">
            Asignación a alumnos
          </span>
          <p className="text-xs text-slate-500">
            Elige un alumno para asignarle sesiones o revisar su agenda
          </p>
        </div>
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 cursor-pointer shrink-0"
        >
          <option value="">Elegir alumno...</option>
          {students.map((s) => (
            <option key={s.uid} value={s.uid}>
              {s.email}
            </option>
          ))}
        </select>
      </div>

      {/* Columnas */}
      <div className="flex-1 flex overflow-hidden gap-5 max-w-7xl mx-auto w-full">
        {/* Rutinas */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col overflow-hidden shadow-xs">
          <span className="text-xs font-bold text-slate-700 pb-2.5 mb-3 border-b border-slate-100">
            Rutinas ({routinesList.length})
          </span>
          <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
            {routinesList.map((r) => (
              <div
                key={r.id}
                onClick={() =>
                  setInspectingSession({
                    name: r.name,
                    exercises: r.exercises || [],
                  })
                }
                className={`bg-slate-50 border rounded-xl p-3 space-y-2.5 cursor-pointer transition-all ${
                  inspectingSession?.name === r.name
                    ? "border-indigo-500 bg-indigo-50/40"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {r.name}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRoutinePublic(r.id, !!r.isPublic);
                    }}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer shrink-0 ${
                      r.isPublic
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white text-slate-500 border-slate-200"
                    }`}
                  >
                    {r.isPublic ? "Pública" : "Privada"}
                  </button>
                </div>

                <div
                  className="flex justify-between items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        if (r.exercises?.length) {
                          loadRoutine(r.exercises, r.name);
                          alert(
                            `"${r.name}" cargada en la pestaña Crear rutina.`,
                          );
                        }
                      }}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar "${r.name}"?`))
                          deleteSavedRoutine(r.id);
                      }}
                      className="p-1 bg-white hover:bg-red-50 text-red-500 rounded-lg border border-slate-200 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="date"
                    disabled={!selectedStudent}
                    value={routineDates[r.id] || todayStr}
                    onChange={(e) =>
                      setRoutineDates((prev) => ({
                        ...prev,
                        [r.id]: e.target.value,
                      }))
                    }
                    className="bg-transparent text-slate-700 text-xs outline-none w-full px-1 disabled:opacity-40"
                  />
                  <button
                    disabled={!selectedStudent}
                    onClick={() =>
                      handleForceRoutineToDate(
                        r,
                        routineDates[r.id] || todayStr,
                      )
                    }
                    className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shrink-0"
                  >
                    Asignar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Planes */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col overflow-hidden shadow-xs">
          <span className="text-xs font-bold text-slate-700 pb-2.5 mb-3 border-b border-slate-100">
            Planes completos ({presetsList.length})
          </span>
          <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
            {presetsList.map((p) => {
              const structuredDays = p.days
                ? p.days.map((d) => ({
                    dayNumber: d.dayIndex + 1,
                    exercises: d.exercises || [],
                    routineName: d.routineName || `Día ${d.dayIndex + 1}`,
                  }))
                : [];

              return (
                <div
                  key={p.id}
                  onClick={() =>
                    setInspectingSession({
                      name: p.name,
                      daysData: structuredDays,
                    })
                  }
                  className={`bg-slate-50 border rounded-xl p-3 space-y-2.5 cursor-pointer transition-all ${
                    inspectingSession?.name === p.name
                      ? "border-indigo-500 bg-indigo-50/40"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {p.name}
                      </h4>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        {p.durationDays} días
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => togglePresetPublic(p.id, !!p.isPublic)}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer ${
                          p.isPublic
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-white text-slate-500 border-slate-200"
                        }`}
                      >
                        {p.isPublic ? "Público" : "Privado"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar el plan "${p.name}"?`))
                            deletePreset(p.id);
                        }}
                        className="p-1 bg-white hover:bg-red-50 text-red-500 rounded-lg border border-slate-200 cursor-pointer"
                        title="Eliminar plan"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="date"
                      disabled={!selectedStudent}
                      value={presetDates[p.id] || todayStr}
                      onChange={(e) =>
                        setPresetDates((prev) => ({
                          ...prev,
                          [p.id]: e.target.value,
                        }))
                      }
                      className="bg-transparent text-slate-700 text-xs outline-none w-full px-1 disabled:opacity-40"
                    />
                    <button
                      disabled={!selectedStudent}
                      onClick={() =>
                        handleForcePlanToDate(
                          p.id,
                          presetDates[p.id] || todayStr,
                        )
                      }
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shrink-0"
                    >
                      Asignar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda del alumno */}
        {selectedStudent && (
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col overflow-hidden shadow-xs">
            <span className="text-xs font-bold text-slate-700 pb-2.5 mb-3 border-b border-slate-100">
              Agenda del alumno ({activeStudentEvents.length})
            </span>
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {activeStudentEvents.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-10">
                  Sin entrenamientos programados
                </p>
              ) : (
                activeStudentEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() =>
                      setInspectingSession({
                        name: ev.technique,
                        exercises: ev.exercises || [],
                      })
                    }
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center gap-2 cursor-pointer hover:border-slate-300"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {ev.technique}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {new Date(ev.date).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        · {ev.status || "Pendiente"}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Revocar "${ev.technique}"?`)) {
                          removeSessionRecord(ev.id);
                        }
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer shrink-0"
                      title="Revocar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Inspector */}
        <div className="w-72 shrink-0 hidden xl:block overflow-y-auto custom-scrollbar">
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
              <p className="text-xs text-slate-400">
                Selecciona una rutina o plan para inspeccionarlo
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
