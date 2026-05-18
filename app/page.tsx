'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, Exercise } from '../src/context/AppContext'; 
import SessionInspector from '../src/components/SessionInspector';

export default function Dashboard() {
  const router = useRouter();
// Traemos 'logout', 'user' y 'savedRoutines' del contexto
  const { sessionHistory, removeSessionRecord, loadRoutine, setActiveSessionId, logout, user, savedRoutines } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [viewingSession, setViewingSession] = useState<{id?: string, name: string, exercises: Exercise[], status?: string} | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const isToday = useMemo(() => {
    const today = new Date();
    return selectedDate.getDate() === today.getDate() &&
           selectedDate.getMonth() === today.getMonth() &&
           selectedDate.getFullYear() === today.getFullYear();
  }, [selectedDate]);

  // Calculamos si el día seleccionado es HOY o un día PASADO (bloqueamos el futuro)
  const isPastOrToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reseteamos la hora para comparar solo el día
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
      monthDays: Array.from({ length: daysInMonth }, (_, i) => i + 1) 
    };
  }, [year, month]);

  const dayEvents = useMemo(() => {
    return sessionHistory.filter(record => {
      const d = new Date(record.date);
      return d.getDate() === selectedDate.getDate() && 
             d.getMonth() === selectedDate.getMonth() && 
             d.getFullYear() === selectedDate.getFullYear();
    });
  }, [selectedDate, sessionHistory]);

  // NUEVO: Lógica para saber el estado global de cada día en el calendario
  const dayStatuses = useMemo(() => {
    const statuses: Record<number, 'done' | 'pending' | null> = {};
    monthDays.forEach(day => {
      const events = sessionHistory.filter(record => {
        const d = new Date(record.date);
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
      });
      if (events.length > 0) {
        // Si hay al menos un evento, vemos si TODOS están acabados
        const allDone = events.every(ev => ev.status === 'Acabada');
        statuses[day] = allDone ? 'done' : 'pending';
      } else {
        statuses[day] = null;
      }
    });
    return statuses;
  }, [sessionHistory, monthDays, month, year]);




  return (
    <div className="w-full h-full p-4 lg:p-6 flex flex-col gap-4 bg-slate-900 text-slate-200">
      
      {/* CABECERA SLIM CON LOGOUT */}
      <header className="flex items-center justify-between py-1 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-blue-500 font-black text-xl italic tracking-tighter">GP</span>
          <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Torre de Control</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[8px] font-black text-slate-600 tracking-widest uppercase hidden md:inline-block">{user?.email}</span>
          <button 
            onClick={logout} 
            className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors bg-slate-800 hover:bg-red-500/10 border border-slate-700/50 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full items-start">
        
        {/* COLUMNA IZQUIERDA: CALENDARIO Y AGENDA */}
        <div className="flex flex-col gap-4">
          
          {/* CALENDARIO */}
          <section className="bg-slate-800 border border-slate-700/50 rounded-2xl p-4 shadow-xl shadow-black/20">
            <div className="flex justify-between items-center mb-3 px-1">
              <button onClick={() => { setCurrentDate(new Date(year, month - 1, 1)); setViewingSession(null); }} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">◄</button>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{monthNames[month]} {year}</h2>
              <button onClick={() => { setCurrentDate(new Date(year, month + 1, 1)); setViewingSession(null); }} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">►</button>
            </div>
            <div className="grid grid-cols-7 border-t border-l border-slate-700/50 rounded-lg overflow-hidden">
              {dayNames.map(d => <div key={d} className="py-1.5 text-center text-[9px] font-black text-slate-500 border-b border-r border-slate-700/50 bg-slate-900/50 uppercase">{d}</div>)}
              {blanks.map(id => <div key={id} className="h-9 border-b border-r border-slate-700/50 bg-slate-900/20" />)}
              {monthDays.map(day => {
                const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month;
                const status = dayStatuses[day];

                return (
                  <button 
                    key={day} 
                    onClick={() => { setSelectedDate(new Date(year, month, day)); setViewingSession(null); }}
                    className={`h-9 border-b border-r border-slate-700/50 relative flex items-center justify-center transition-all
                      ${isSelected ? 'bg-blue-500/20' : 'hover:bg-slate-700/50'}`}
                  >
                    <span className={`text-[10px] font-black z-10 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>
                      {day}
                    </span>
                    
                    {/* INDICADORES VISUALES DE ESTADO */}
                    {status === 'done' && (
                      <div className="absolute inset-1 rounded-md border border-emerald-500/30 bg-emerald-500/5 pointer-events-none" />
                    )}
                    {status === 'pending' && (
                      <div className="absolute inset-1 rounded-md border border-amber-500/30 bg-amber-500/5 pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* AGENDA */}
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-xl shadow-black/20">
             <header className="flex justify-between items-center mb-3">
               <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Agenda</h3>
               <span className="text-[9px] font-black text-slate-400 italic bg-slate-900 px-2.5 py-1 rounded border border-slate-700/50 uppercase leading-none">
                 {selectedDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}
               </span>
             </header>
             <div className="flex flex-col gap-2 max-h-55 overflow-y-auto pr-1">
                {dayEvents.length > 0 ? dayEvents.map((ev) => (
                  <div 
                    key={ev.id} 
                    onClick={() => setViewingSession({ id: ev.id, name: ev.technique, exercises: ev.exercises || [], status: ev.status })}
                    className={`p-3 rounded-xl border flex justify-between items-center group cursor-pointer transition-colors shadow-sm
                      ${ev.status === 'Acabada' ? 'bg-slate-900/50 border-slate-800 opacity-50' : ev.isPreset ? 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40' : 'bg-slate-800 border-slate-700/50 hover:border-slate-600'}`}
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-tight leading-none">{ev.technique}</span>
                        <span className={`px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-wide border leading-none ${
                          ev.status === 'Acabada' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          ev.status === 'Inacabada' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                          'bg-slate-900 text-slate-500 border-slate-700/50'
                        }`}>
                          {ev.status || 'Pendiente'}
                        </span>
                      </div>
                      {ev.isPreset && <span className="text-[8px] font-bold text-blue-400/80 uppercase leading-none">Plan de Estudio</span>}
                    </div>
                    
                    {/* Solo mostramos Borrar si la sesión no está acabada, no es de un día pasado Y NO viene asignada por un maestro externo */}
                    {!(ev.status === 'Acabada' || (!isToday && isPastOrToday) || ((ev as { assignedBy?: string }).assignedBy && (ev as { assignedBy?: string }).assignedBy !== user?.uid)) && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          removeSessionRecord(ev.id); 
                          if (viewingSession?.id === ev.id) {
                            setViewingSession(null);
                          }
                        }}
                        className="text-[8px] font-black text-red-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase hover:text-red-400 px-2 py-1.5 bg-red-500/10 rounded leading-none"
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                )) : <div className="text-center py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest border border-dashed border-slate-700/50 rounded-lg bg-slate-900/50">Día Despejado</div>}
             </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: INFORMACIÓN Y PLANES */}
        <div className="flex flex-col gap-4">
          
          {/* INFORMACIÓN DE SESIÓN CON NUESTRO INSPECTOR INTELIGENTE */}
          <SessionInspector 
            name={viewingSession ? viewingSession.name : 'Resumen del Día'}
            exercises={viewingSession ? viewingSession.exercises : dayEvents.flatMap(ev => ev.exercises || [])}
            showAction={!!viewingSession}
            actionButton={
              !viewingSession?.id ? (
                <div className="w-full bg-slate-900/50 border border-dashed border-slate-700/50 text-slate-500 font-black text-[9px] uppercase tracking-widest py-3.5 rounded-xl text-center">
                  Añade la rutina al día (+) para empezar
                </div>
              ) : !isPastOrToday ? (
                <div className="w-full bg-slate-900 border border-slate-800 text-slate-500 font-black text-[9px] uppercase tracking-widest py-3.5 rounded-xl text-center">
                  ⏳ No puedes adelantar rutinas futuras
                </div>
              ) : viewingSession.status !== 'Acabada' ? (
                <button 
                  onClick={() => { 
                    loadRoutine(viewingSession.exercises, viewingSession.name); 
                    if (viewingSession.id) setActiveSessionId(viewingSession.id); 
                    router.push('/practice'); 
                  }} 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  {viewingSession.status === 'Inacabada' ? 'Reanudar Rutina' : 'Empezar Rutina'}
                </button>
              ) : (
                <div className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[10px] uppercase tracking-wider py-3.5 rounded-xl text-center">
                  ✓ Sesión Completada
                </div>
              )
            }
          />

          
          

        </div>
      </div>
    </div>
  );
}