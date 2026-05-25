'use client';
import { useState, useEffect } from 'react'; // <-- Asegúrate de que está 'useEffect'
import exercisesData from '../../src/data/exercises.json';
import { useApp, Exercise } from '../../src/context/AppContext';
import SessionInspector from '../../src/components/SessionInspector';
import DesktopOnly from '../../src/components/DesktopOnly';
// Extraemos las técnicas de forma limpia para los filtros del constructor
const allTechniques = Array.from(
  new Set(exercisesData.map((ej) => ej.mainTechnique || 'OTROS'))
).sort();

export default function PlansPage() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'routines' | 'plans' | 'manager'>('routines');

  // Seguridad estricta: Solo tú entras al laboratorio
  const isMaster = user?.email?.toLowerCase() === 'jvillaescusam@gmail.com';

  if (!user) return null;

  if (!isMaster) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 text-white h-screen">
        <span className="text-4xl mb-4">⛔</span>
        <h1 className="text-xl font-black uppercase tracking-widest text-slate-500">Acceso Restringido</h1>
      </div>
    );
  }

  return (
    <DesktopOnly label="La Forja Maestra">
    <div className="flex flex-col h-full min-h-0 bg-slate-900 text-slate-200 overflow-hidden font-sans">
      
      {/* MENÚ SUPERIOR DE LA FORJA */}
      <header className="bg-slate-950 border-b border-slate-800/80 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 z-20">
        <div>
          <h1 className="text-lg font-black uppercase tracking-tight text-emerald-400">La Forja Maestra</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Central de Control de Contenidos y Asignaciones</p>
        </div>
        
        {/* PASTILLAS DE NAVEGACIÓN INTERNA */}
        <div className="flex bg-slate-900 rounded-xl border border-slate-800 p-1 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab('routines')}
            className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeTab === 'routines' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🛠️ Crear Rutina
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeTab === 'plans' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📅 Diseñar Plan
          </button>
          <button
            onClick={() => setActiveTab('manager')}
            className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeTab === 'manager' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🗃️ Gestor / Asignar
          </button>
        </div>
      </header>

      {/* CONTENIDO DINÁMICO SEGÚN LA PESTAÑA */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'routines' && <RoutineConstructor />}
        {activeTab === 'plans' && <PlanDesigner />}
        {activeTab === 'manager' && <ContentManager />}
      </div>
    </div>
    </DesktopOnly>
  );
}

// =========================================================================
// 1️⃣ PESTAÑA: CONSTRUCTOR DE RUTINAS SUELTAS
// =========================================================================
function RoutineConstructor() {
  const { routine, addToRoutine, removeFromRoutine, saveCurrentRoutine, clearRoutine } = useApp();
  const [filter, setFilter] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [routineName, setRoutineName] = useState<string>('');

  const filteredExercises = (exercisesData as Exercise[]).filter((ej) => {
    const matchesFilter = filter === 'TODOS' || (ej.mainTechnique || 'OTROS') === filter;
    const matchesSearch = ej.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleBuildRoutine = () => {
    if (!routineName.trim()) return alert('Ponle un nombre descriptivo a la rutina.');
    if (routine.length === 0) return alert('El carrito está vacío. Añade algún ejercicio.');
    
    // Al guardarla inicialmente desde la forja, la creamos pública por defecto
    saveCurrentRoutine(routineName, true, null);
    
    alert('¡Rutina forjada y añadida a tu catálogo general!');
    setRoutineName('');
    clearRoutine();
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Lado Izquierdo: El Carrito Mezclador */}
      <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/40 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 bg-slate-950/20">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mezclador de Ejercicios</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {routine.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 p-4">
              <span className="text-3xl mb-3">🛒</span>
              <p className="text-[9px] font-black uppercase tracking-widest">Añade ejercicios de la tabla derecha para mezclarlos</p>
            </div>
          ) : (
            routine.map((ej, idx) => (
              <div key={`${ej.id}-${idx}`} className="bg-slate-800/80 border border-slate-700/40 rounded-xl p-3 flex justify-between items-center group shadow-sm">
                <div className="min-w-0 pr-2">
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block mb-0.5">{idx + 1}. {ej.mainTechnique}</span>
                  <span className="text-[10px] font-bold text-slate-200 uppercase truncate block">{ej.title}</span>
                </div>
                <button onClick={() => removeFromRoutine(ej.id)} className="text-[9px] font-black text-red-500 bg-red-500/10 px-2 py-1 rounded cursor-pointer hover:bg-red-500/20">X</button>
              </div>
            ))
          )}
        </div>
        {routine.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/20 space-y-3">
            <input 
              type="text" 
              placeholder="Nombre de la Rutina..." 
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
            />
            <button onClick={handleBuildRoutine} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/10">
              Guardar Rutina Nueva
            </button>
          </div>
        )}
      </aside>

      {/* Lado Derecho: Selector de Ejercicios del JSON */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col xl:flex-row gap-3 bg-slate-950/10 shrink-0">
          <input 
            type="text" 
            placeholder="Filtrar por nombre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs w-full xl:w-64 focus:outline-none focus:border-emerald-500/40 placeholder:text-slate-600"
          />
          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button onClick={() => setFilter('TODOS')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${filter === 'TODOS' ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-400' : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300'}`}>TODOS</button>
            {allTechniques.map(tech => (
              <button key={tech} onClick={() => setFilter(tech)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${filter === tech ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-400' : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300'}`}>{tech}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="bg-slate-800/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-800 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="p-3 w-12 text-center">ID</th>
                  <th className="p-3">Título</th>
                  <th className="p-3 hidden md:table-cell">Técnica</th>
                  <th className="p-3 text-center w-24">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {filteredExercises.map((ej) => {
                  const isInRoutine = routine.some(r => r.id === ej.id);
                  return (
                    <tr key={ej.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-slate-600 font-black text-center">{ej.id}</td>
                      <td className="p-3 font-bold text-slate-300 uppercase">{ej.title}</td>
                      <td className="p-3 hidden md:table-cell"><span className="text-[8px] font-black text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded uppercase">{ej.mainTechnique}</span></td>
                      <td className="p-3 text-center">
                        <button onClick={() => addToRoutine(ej)} disabled={isInRoutine} className={`w-full py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${isInRoutine ? 'bg-slate-900 text-slate-600 border border-slate-800' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}>
                          {isInRoutine ? 'Añadido' : '+ Agregar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

// =========================================================================
// 2️⃣ PESTAÑA: DISEÑADOR DE PLANS DE VARIOS DÍAS (PRESETS)
// =========================================================================
function PlanDesigner() {
  const { savedRoutines, savePreset } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(7);
  const [selectedRoutines, setSelectedRoutines] = useState<Record<number, string>>({});

  const availableRoutines = savedRoutines.filter(r => r.exercises && r.exercises.length > 0);

  const handleSavePlan = async () => {
    if (!name.trim()) return alert('Por favor, nombra la planificación.');
    if (!description.trim()) return alert('Añade una descripción pedagógica.');

    const daysConfig = [];
    for (const [dayIndexStr, routineId] of Object.entries(selectedRoutines)) {
      if (routineId) {
        const routineInfo = availableRoutines.find(r => r.id === routineId);
        if (routineInfo) {
          daysConfig.push({
            dayIndex: parseInt(dayIndexStr),
            routineName: routineInfo.name,
            exercises: routineInfo.exercises
          });
        }
      }
    }

    if (daysConfig.length === 0) return alert('Asigna al menos una rutina a algún día del mapa.');

    await savePreset({
      name,
      description,
      isPublic: true, // Las forjamos públicas por defecto
      durationDays: duration,
      days: daysConfig
    });

    alert('¡Planificación multicanal empaquetada con éxito!');
    setName('');
    setDescription('');
    setSelectedRoutines({});
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Configuración del Plan */}
      <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/40 p-4 space-y-4 shrink-0 overflow-y-auto custom-scrollbar">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-2">Configuración del Curso</span>
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Nombre de la Planificación</label>
            <input type="text" placeholder="Ej: Bootcamp Alzapúa..." value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Descripción del Objetivo</label>
            <textarea rows={3} placeholder="¿Qué asimilará el alumno?" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50 resize-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Duración Total</label>
            <select value={duration} onChange={(e) => { setDuration(Number(e.target.value)); setSelectedRoutines({}); }} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50">
              <option value={7}>1 Semana (7 días)</option>
              <option value={14}>2 Semanas (14 days)</option>
              <option value={28}>1 Mes (28 días)</option>
            </select>
          </div>
          <button onClick={handleSavePlan} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/10 mt-2">
            Empaquetar Plan Maestro
          </button>
        </div>
      </aside>

      {/* Timeline del Plan */}
      <main className="flex-1 overflow-y-auto p-6 bg-slate-950/20 custom-scrollbar">
        <div className="max-w-xl mx-auto space-y-3 relative before:absolute before:inset-0 before:ml-4 before:h-full before:w-0.5 before:bg-slate-800">
          {Array.from({ length: duration }).map((_, idx) => (
            <div key={idx} className="relative flex items-center gap-4 group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] shadow border-2 border-slate-900 shrink-0 z-10 ${selectedRoutines[idx] ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                {idx + 1}
              </div>
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center hover:border-slate-700 transition-colors">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Día {idx + 1} del Plan</span>
                  <select 
                    value={selectedRoutines[idx] || ''} 
                    onChange={(e) => setSelectedRoutines(prev => ({ ...prev, [idx]: e.target.value }))}
                    className="bg-transparent text-xs font-bold text-slate-200 uppercase outline-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">☕ Descanso / Recuperación</option>
                    {availableRoutines.map(r => (
                      <option key={r.id} value={r.id} className="bg-slate-900 text-slate-200">{r.name} ({r.exercises?.length} ej.)</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// =========================================================================
// 3️⃣ PESTAÑA: GESTOR DE CONTENIDOS Y ASIGNACIONES EN DOS PASOS (SEGURO)
// =========================================================================
interface InspectingState {
  name: string;
  exercises?: Exercise[];
  daysData?: { dayNumber: number; exercises: Exercise[]; routineName?: string }[];
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
  const { savedRoutines, presets, deleteSavedRoutine, students, applyPresetToCalendar, loadRoutine, removeSessionRecord, user } = useApp();
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  const [inspectingSession, setInspectingSession] = useState<InspectingState | null>(null);
  const [routinesList, setRoutinesList] = useState(() => savedRoutines);
  const [presetsList, setPresetsList] = useState(() => presets);
  const [activeStudentEvents, setActiveStudentEvents] = useState<StudentEvent[]>([]);

  // OBTENEMOS LA FECHA DE HOY POR DEFECTO EN FORMATO YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // ESTADOS LOCALES PARA RECORDAR QUÉ FECHA TIENE SELECCIONADA CADA TARJETA INDEPENDIENTEMENTE
  const [routineDates, setRoutineDates] = useState<Record<string, string>>({});
  const [presetDates, setPresetDates] = useState<Record<string, string>>({});

  useEffect(() => {
    setRoutinesList(savedRoutines);
  }, [savedRoutines]);

  useEffect(() => {
    setPresetsList(presets);
  }, [presets]);

  useEffect(() => {
    if (!selectedStudent) return;

    let unsubscribe = () => {};

    const listenToStudentSessions = async () => {
      const { db } = await import('../../src/lib/firebase');
      const { collection, query, where, onSnapshot } = await import('firebase/firestore');
      
      const q = query(collection(db, 'sessions'), where('userId', '==', selectedStudent));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StudentEvent[];
        
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setActiveStudentEvents(data);
      }, (error) => {
        console.error("Error al auditar la agenda del alumno:", error);
      });
    };

    listenToStudentSessions();
    return () => unsubscribe();
  }, [selectedStudent]);

  const toggleRoutinePublic = async (id: string, currentStatus: boolean) => {
    setRoutinesList(prev => prev.map(r => r.id === id ? { ...r, isPublic: !currentStatus } : r));
    const { db } = await import('../../src/lib/firebase');
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'routines', id), { isPublic: !currentStatus });
  };

  const togglePresetPublic = async (id: string, currentStatus: boolean) => {
    setPresetsList(prev => prev.map(p => p.id === id ? { ...p, isPublic: !currentStatus } : p));
    const { db } = await import('../../src/lib/firebase');
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'presets', id), { isPublic: !currentStatus });
  };

  const handleReforgeRoutine = (routineData: typeof savedRoutines[number]) => {
    if (!routineData.exercises || routineData.exercises.length === 0) return;
    loadRoutine(routineData.exercises, routineData.name);
    alert(`¡Ejercicios de "${routineData.name}" cargados en el Mezclador de la Pestaña 1! Ve allí para editarlos.`);
  };

  // Envía una rutina individual a una fecha seleccionada
  const handleForceRoutineToDate = async (routineData: typeof savedRoutines[number], dateString: string) => {
    if (!selectedStudent) return alert('Elige primero un alumno del selector superior.');
    try {
      const { db } = await import('../../src/lib/firebase');
      const { collection, addDoc } = await import('firebase/firestore');
      
      const targetDate = new Date(dateString + 'T12:00:00');
      
      await addDoc(collection(db, 'sessions'), {
        userId: selectedStudent,
        technique: routineData.name,
        exercises: routineData.exercises || [],
        date: targetDate.toISOString(),
        status: 'Pendiente',
        assignedBy: user?.uid || 'teacher', 
        isPreset: false
      });
      
      alert(`¡Rutina "${routineData.name}" asignada con éxito para el ${targetDate.toLocaleDateString('es-ES')}!`);
    } catch (error) {
      console.error("Error al programar rutina:", error);
      alert("Error al programar la tarea.");
    }
  };

  // Inyecta un bloque multi-día empezando en la fecha exacta elegida
  const handleForcePlanToDate = async (presetId: string, dateString: string) => {
    if (!selectedStudent) return alert('Elige primero un alumno del selector superior.');
    const targetStartDate = new Date(dateString + 'T12:00:00');
    await applyPresetToCalendar(presetId, targetStartDate, selectedStudent);
    alert(`¡Plan semanal activado con éxito a partir del ${targetStartDate.toLocaleDateString('es-ES')}!`);
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden bg-slate-950/10">
      
      {/* SELECCIÓN CENTRAL DEL ALUMNO A CONTROLAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-2xl mx-auto w-full flex items-center justify-between gap-4 shadow-xl shrink-0">
        <div className="min-w-0">
          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-0.5">Torre de Asignaciones</span>
          <p className="text-[11px] font-bold text-slate-400">Selecciona el alumno al que quieres inyectarle o auditar el entrenamiento:</p>
        </div>
        <select 
          value={selectedStudent} 
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-emerald-500/50 cursor-pointer shrink-0"
        >
          <option value="" className="text-slate-500">Elegir Alumno...</option>
          {students.map(s => (
            <option key={s.uid} value={s.uid} className="text-slate-200">{s.email}</option>
          ))}
        </select>
      </div>

      {/* ÁREA DE TRABAJO */}
      <div className="flex-1 flex overflow-hidden gap-6 max-w-7xl mx-auto w-full">
        
        {/* BLOQUE 1: LISTA DE RUTINAS */}
        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col overflow-hidden">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-2 mb-3">Catálogo de Rutinas Creadas</span>
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {routinesList.map(r => (
              <div 
                key={r.id} 
                onClick={() => setInspectingSession({ name: r.name, exercises: r.exercises || [] })}
                className={`bg-slate-950 border rounded-xl p-3 flex flex-col gap-3 hover:border-slate-700 transition-colors cursor-pointer ${inspectingSession?.name === r.name ? 'border-blue-500 shadow-md shadow-blue-500/5' : 'border-slate-800/60'}`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-[11px] font-black uppercase text-slate-200 tracking-wide truncate pr-2">{r.name}</h4>
                  <button onClick={(e) => { e.stopPropagation(); toggleRoutinePublic(r.id, !!r.isPublic); }} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border cursor-pointer ${r.isPublic ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                    {r.isPublic ? '📢 Público' : '🔒 Privado'}
                  </button>
                </div>
                
                {/* ACCIONES DE RUTINA EN DOS PASOS (SIN BOTÓN HOY REDUNDANTE) */}
                <div className="flex flex-col gap-2 border-t border-slate-900 pt-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between gap-2 items-center">
                    <div className="flex gap-1">
                      <button onClick={() => handleReforgeRoutine(r)} className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[8px] font-black uppercase rounded border border-slate-800 cursor-pointer">✏️ Re-forjar</button>
                      <button onClick={() => { if(confirm('¿Seguro?')) deleteSavedRoutine(r.id); }} className="px-2 py-1 bg-red-500/10 text-red-400 text-[8px] font-black uppercase rounded hover:bg-red-500/20 cursor-pointer">🗑️</button>
                    </div>
                  </div>
                  
                  {/* FORMULARIO INTEGRADO EN LINEA */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded px-2 py-1">
                    <input 
                      type="date" 
                      disabled={!selectedStudent}
                      value={routineDates[r.id] || todayStr}
                      onChange={(e) => setRoutineDates(prev => ({ ...prev, [r.id]: e.target.value }))}
                      className="bg-transparent text-slate-300 text-[9px] font-bold outline-none w-full cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed uppercase"
                    />
                    <button
                      disabled={!selectedStudent}
                      onClick={async () => {
                        const targetDate = routineDates[r.id] || todayStr;
                        await handleForceRoutineToDate(r, targetDate);
                      }}
                      className={`px-3 py-1.5 text-[8px] font-black uppercase rounded shrink-0 transition-all ${selectedStudent ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-sm shadow-blue-600/10' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                    >
                      Planificar 🚀
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLOQUE 2: LISTA DE PLANES MULTIDÍAS */}
        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col overflow-hidden">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-2 mb-3">Paquetes de Planes Completos</span>
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {presetsList.map(p => {
              const structuredDays = p.days ? p.days.map((d) => {
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
                  key={p.id} 
                  onClick={() => setInspectingSession({ name: p.name, daysData: structuredDays })}
                  className={`bg-slate-950 border rounded-xl p-3 flex flex-col gap-3 hover:border-slate-700 transition-colors cursor-pointer ${inspectingSession?.name === p.name ? 'border-blue-500 shadow-md shadow-blue-500/5' : 'border-slate-800/60'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1 pr-2">
                      <h4 className="text-[11px] font-black uppercase text-slate-200 tracking-wide truncate">{p.name}</h4>
                      <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">{p.durationDays} Días Totales</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); togglePresetPublic(p.id, !!p.isPublic); }} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border cursor-pointer ${p.isPublic ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                      {p.isPublic ? '📢 Público' : '🔒 Privado'}
                    </button>
                  </div>
                  
                  {/* ACCIONES DE PLAN EN DOS PASOS (FECHA DEFECTO HOY) */}
                  <div className="flex flex-col gap-2 border-t border-slate-900 pt-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded px-2 py-1">
                      <input 
                        type="date" 
                        disabled={!selectedStudent}
                        value={presetDates[p.id] || todayStr}
                        onChange={(e) => setPresetDates(prev => ({ ...prev, [p.id]: e.target.value }))}
                        className="bg-transparent text-slate-300 text-[9px] font-bold outline-none w-full cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                      <button
                        disabled={!selectedStudent}
                        onClick={async () => {
                          const targetDate = presetDates[p.id] || todayStr;
                          await handleForcePlanToDate(p.id, targetDate);
                        }}
                        className={`px-3 py-1.5 text-[8px] font-black uppercase rounded shrink-0 transition-all ${selectedStudent ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm shadow-emerald-600/10' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                      >
                        Planificar 🚀
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BLOQUE 3: AGENDA EN TIEMPO REAL DEL ALUMNO SELECCIONADO */}
        {selectedStudent && (
          <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col overflow-hidden animate-fade-in">
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block border-b border-slate-800 pb-2 mb-3">
              📋 Tareas Activas del Alumno
            </span>
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {activeStudentEvents.length === 0 ? (
                <p className="text-center text-[9px] text-slate-600 font-black uppercase py-12 leading-relaxed">
                  Este alumno no tiene<br />entrenamientos programados
                </p>
              ) : (
                activeStudentEvents.map(ev => (
                  <div 
                    key={ev.id}
                    onClick={() => setInspectingSession({ name: ev.technique, exercises: ev.exercises || [] })}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2.5 hover:border-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="text-[10px] font-black uppercase text-slate-200 tracking-wide truncate">{ev.technique}</h4>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5 block">
                          📆 {new Date(ev.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase border shrink-0 ${
                        ev.status === 'Acabada' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        {ev.status || 'Pendiente'}
                      </span>
                    </div>
                    
                    <div className="flex justify-end border-t border-slate-900 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Seguro que quieres eliminar la rutina "${ev.technique}" del calendario de este alumno?`)) {
                            removeSessionRecord(ev.id);
                            if (inspectingSession?.name === ev.technique) setInspectingSession(null);
                          }
                        }}
                        className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[8px] font-black uppercase rounded tracking-wider transition-all cursor-pointer"
                      >
                        🗑️ Revocar Tarea
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* BLOQUE 4: EL INSPECTOR ADAPTADO A LA DERECHA */}
        <div className="w-72 shrink-0 hidden xl:block overflow-y-auto custom-scrollbar">
          {inspectingSession ? (
            <SessionInspector 
              name={inspectingSession.name}
              exercises={inspectingSession.exercises}
              daysData={inspectingSession.daysData}
              showAction={false}
            />
          ) : (
            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-4 h-full flex flex-col items-center justify-center text-center">
              <span className="text-xl mb-2 opacity-20">🔍</span>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 leading-normal">
                Selecciona una rutina o plan<br />para auditar sus propiedades
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}