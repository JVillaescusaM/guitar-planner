'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup     
} from 'firebase/auth';
import { collection, query, where, getDocs, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';


export interface Exercise {
  id: string;
  title: string;
  repetitions: string;
  mainTechnique: string;
  secondaryTechnique: string;
  level: string;
  duration: string;
  description: string;
  objectives: string[];
  pdfUrl: string;
  subdivision?: number; // 1=Negras, 2=Corcheas, 3=Tresillos, 4=Semicorcheas
  collection?: string;
  videoId?: string;
  recommendedBpm?: number;
  instanceId?: string; // NUEVO: Identificador único para el carrito
}

export interface ExerciseStats {
  bpm: number;
  timeSpent: number; // Segundos reales dedicados a ESTE ejercicio
  npm: number;       // Notas Por Minuto (BPM * Subdivisión)
}

export interface SessionRecord {
  id: string;
  exerciseId?: string | number;
  technique: string;
  date: string; 
  durationSeconds: number;
  bpm: number;
  status?: 'Acabada' | 'Inacabada' | 'Pausada' | 'Pendiente';
  isPreset?: boolean;
  exercises?: Exercise[];
  completedExercisesData?: Record<string, number>; // Legacy (Para no romper datos viejos)
  exerciseStats?: Record<string, ExerciseStats>;   // NUEVO: Analítica profunda por ejercicio
  totalXP?: number;      // NUEVO: Experiencia ganada en la sesión
  rpe?: number;          // NUEVO: Índice de cansancio (1-5)
  userId?: string;       
  assignedBy?: string;   
}

export interface SavedRoutine {
  id: string;
  name: string;
  exercises: Exercise[];
  userId?: string;
  isPublic?: boolean;
  assignedTo?: string | null;
}

export interface Student {
  uid: string;
  email: string;
}

export type WeeklyPlan = Record<string, string | null>;

// --- NUEVOS CONCEPTOS: PRESETS DE VARIOS DÍAS ---
export interface PresetRoutine {
  dayIndex: number;
  routineName: string;
  exercises: Exercise[];
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  isPublic: boolean;
  durationDays: number;
  days: PresetRoutine[];
}

interface AppContextType {
  user: User | null;
  login: (e: string, p: string) => Promise<void>;
  register: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  activeExercise: Exercise | null;
  setActiveExercise: (exercise: Exercise | null) => void;
  routine: Exercise[];
  sessionName: string | null;
  activeSessionId: string | null; 
  setActiveSessionId: (id: string | null) => void; 
  updateSessionRecord: (id: string, updates: Partial<SessionRecord>) => void; 
  addToRoutine: (exercise: Exercise) => void;
  addExercisesToDay: (date: Date, name: string, exercises: Exercise[]) => void;
  removeFromRoutine: (id: string | number) => void;
  clearRoutine: () => void;
  loadRoutine: (newRoutine: Exercise[], name?: string) => void;
  reorderRoutine: (startIndex: number, endIndex: number) => void;
  sessionHistory: SessionRecord[];
  addSessionRecord: (record: Omit<SessionRecord, 'id' | 'date'>) => string; 
  savedRoutines: SavedRoutine[];
  students: Student[];
  saveCurrentRoutine: (name: string, isPublic?: boolean, assignedTo?: string | null) => void;
 deleteSavedRoutine: (id: string) => void;
  weeklyPlan: WeeklyPlan;
  assignRoutineToDay: (day: string, routineId: string | null) => void;
  removeSessionRecord: (id: string) => void;
  
  // --- FUNCIONES DEL MOTOR DE PRESETS ---
  presets: Preset[];
  savePreset: (presetData: Omit<Preset, 'id' | 'createdBy'>) => Promise<void>;
 applyPresetToCalendar: (presetId: string, startDate: Date, targetUserId?: string) => Promise<void>;
  forceRoutineToToday: (routineName: string, exercises: Exercise[], targetUserId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // --- MOVEMOS TODOS LOS ESTADOS AQUÍ ARRIBA ---
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [routine, setRoutine] = useState<Exercise[]>([]);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]); // Estado para las Planificaciones

  useEffect(() => {
    let unsubscribeSessions = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribeSessions();
      setUser(currentUser);
      if (currentUser) {
        // 1. Historial de sesiones en tiempo real (evita datos obsoletos tras asignaciones del maestro)
        try {
          const qSessions = query(collection(db, 'sessions'), where('userId', '==', currentUser.uid));
          unsubscribeSessions = onSnapshot(qSessions, (snapshot) => {
            const history: SessionRecord[] = [];
            snapshot.forEach((d) => history.push({ id: d.id, ...d.data() } as SessionRecord));
            setSessionHistory(history);
          }, (err) => console.error("Error historial:", err));
        } catch (err) { console.error("Error historial:", err); }

        // 2. Descargar Rutinas (Mías + Públicas + Asignadas a mí)
        try {
          const routinesMap = new Map<string, SavedRoutine>();
          const qMine = query(collection(db, 'routines'), where('userId', '==', currentUser.uid));
          const qPublic = query(collection(db, 'routines'), where('isPublic', '==', true));
          const qAssigned = query(collection(db, 'routines'), where('assignedTo', '==', currentUser.uid));

          const [snapMine, snapPublic, snapAssigned] = await Promise.all([getDocs(qMine), getDocs(qPublic), getDocs(qAssigned)]);
          
          [snapMine, snapPublic, snapAssigned].forEach(snap => {
            snap.forEach(doc => routinesMap.set(doc.id, { id: doc.id, ...doc.data() } as SavedRoutine));
          });
          setSavedRoutines(Array.from(routinesMap.values()));
        } catch (err) { console.error("Error rutinas:", err); }

        // 3. Si soy el Maestro, me descargo el directorio de alumnos
        if (currentUser.email?.toLowerCase() === 'jvillaescusam@gmail.com') {
          try {
            const snapUsers = await getDocs(collection(db, 'users'));
            const usersList: Student[] = [];
            snapUsers.forEach(doc => {
              if (doc.data().email !== 'jvillaescusam@gmail.com') {
                usersList.push({ uid: doc.id, ...doc.data() } as Student);
              }
            });
            setStudents(usersList);
          } catch (err) { console.error("Error alumnos:", err); }
        }

        // 4. Descargar Planificaciones (Presets) Públicas y las Mías
        try {
          const presetsMap = new Map<string, Preset>();
          const qPublic = query(collection(db, 'presets'), where('isPublic', '==', true));
          const qMine = query(collection(db, 'presets'), where('createdBy', '==', currentUser.uid));
          
          const [snapPub, snapMine] = await Promise.all([getDocs(qPublic), getDocs(qMine)]);
          
          [snapPub, snapMine].forEach(snap => {
            snap.forEach(doc => presetsMap.set(doc.id, { id: doc.id, ...doc.data() } as Preset));
          });
          setPresets(Array.from(presetsMap.values()));
        } catch (err) { console.error("Error presets:", err); }

      } else {
        setSessionHistory([]);
        setSavedRoutines([]);
        setStudents([]);
        setPresets([]); // Limpiamos al salir
      }
      setLoadingAuth(false);
    });
    return () => {
      unsubscribeAuth();
      unsubscribeSessions();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      
      // 🛡️ DOBLE CHECK DE SEGURIDAD: ¿Ha verificado su correo?
      if (!userCredential.user.emailVerified) {
        // Si no está verificado, le obligamos a cerrar sesión inmediatamente 
        // para que el estado global no lo deje pasar a la Torre de Control
        await signOut(auth);
        alert("🛡️ Control de Seguridad: Tu cuenta aún no está activa.\n\nPor favor, revisa tu bandeja de entrada (y la carpeta de spam) y haz clic en el enlace de verificación para activar tu acceso.");
        return;
      }
    } catch (error) {
      console.error('Error login:', error);
      alert('Error al iniciar sesión. Revisa tus credenciales.');
    }
  };
  
  // Modificamos el registro para que guarde al usuario en la base de datos pública
  const register = async (email: string, pass: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const newUser = userCredential.user;

      // 🛡️ ENVIAR ENLACE DE VERIFICACIÓN AUTOMÁTICO
      await sendEmailVerification(newUser);

      // Creamos su ficha de base de datos en Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        role: 'student',
        createdAt: new Date().toISOString()
      });

      // Como acaba de crearse la cuenta, lo deslogueamos para que no entre directo
      // y se vea obligado a pulsar el enlace de su correo primero
      await signOut(auth);
      
      alert("✨ ¡Cuenta registrada con éxito!\n\nHemos enviado un enlace de activación a tu correo. Revisa tu bandeja de entrada para verificar tu cuenta antes de iniciar sesión.");
    } catch (error) {
      console.error('Error register:', error);
      alert('Error al registrar usuario. Es posible que el correo ya esté en uso o la contraseña sea muy débil.');
    }
  };
  
  const logout = async () => { await signOut(auth); };

  const addToRoutine = (exercise: Exercise) => {
    setRoutine((prev) => [...prev, { ...exercise, instanceId: Math.random().toString(36).substring(2, 11) }]);
  };

  const addExercisesToDay = (date: Date, name: string, exercisesToAdd: Exercise[]) => {
    if (!user?.uid) return;
    const newId = Math.random().toString(36).substring(2, 11);
    const newRecord: SessionRecord = {
      id: newId,
      technique: name,
      date: date.toISOString(),
      durationSeconds: 0,
      bpm: 60,
      status: 'Pendiente',
      isPreset: true,
      exercises: exercisesToAdd,
      userId: user.uid,
    };
    setSessionHistory(prev => [...prev, newRecord]);
    setDoc(doc(db, 'sessions', newId), newRecord);
  };

 const updateSessionRecord = (id: string, updates: Partial<SessionRecord>) => {
    setSessionHistory((prev) =>
      prev.map((record) => {
        if (record.id === id) {
          const updatedRecord = { ...record, ...updates };
          // Actualizamos Firestore en segundo plano
          setDoc(doc(db, 'sessions', id), { ...updatedRecord, userId: user?.uid }, { merge: true });
          return updatedRecord;
        }
        return record;
      })
    );
  };

  const removeFromRoutine = (identifier: string | number) => {
    setRoutine((prev) => prev.filter((ex) => (ex.instanceId ? ex.instanceId !== identifier : ex.id !== identifier)));
  };
const reorderRoutine = (startIndex: number, endIndex: number) => {
    setRoutine((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const clearRoutine = () => {
    setRoutine([]);
    setSessionName(null);
    setActiveExercise(null);
    setActiveSessionId(null); 
  };

  const loadRoutine = (newRoutine: Exercise[], name: string = 'Sesión de Estudio') => {
    setRoutine(newRoutine);
    setSessionName(name);
  };

const saveCurrentRoutine = (name: string, isPublic: boolean = false, assignedTo: string | null = null) => {
    if (routine.length === 0) return;
    const newId = Math.random().toString(36).substr(2, 9);
    const newRoutine: SavedRoutine = {
      id: newId,
      name,
      exercises: [...routine],
      userId: user?.uid,
      isPublic,
      assignedTo
    };
    setSavedRoutines(prev => [...prev, newRoutine]);
    setDoc(doc(db, 'routines', newId), newRoutine);
  };

  const deleteSavedRoutine = (id: string) => {
    setSavedRoutines(prev => prev.filter(r => r.id !== id));
    // Borramos la rutina de la nube
    deleteDoc(doc(db, 'routines', id));
  };


const addSessionRecord = (record: Omit<SessionRecord, 'id' | 'date'>): string => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newRecord: SessionRecord = {
      ...record,
      id: newId,
      date: new Date().toISOString(),
    };
    setSessionHistory((prev) => [...prev, newRecord]);

    // Guardamos en Firestore asociándolo al UID del usuario de forma asíncrona
    setDoc(doc(db, 'sessions', newId), { ...newRecord, userId: user?.uid });

    return newId;
  };

  const assignRoutineToDay = (day: string, routineId: string | null) => {
    setWeeklyPlan(prev => ({ ...prev, [day]: routineId }));
  };

const removeSessionRecord = (id: string) => {
    setSessionHistory(prev => prev.filter(record => record.id !== id));
    // Borramos el documento de la nube
    deleteDoc(doc(db, 'sessions', id));
  };

  // --- MOTOR DE PRESETS (PLANIFICACIONES DE VARIOS DÍAS) ---
  const savePreset = async (presetData: Omit<Preset, 'id' | 'createdBy'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newPreset: Preset = {
      ...presetData,
      id: newId,
      createdBy: user?.uid || '',
    };
    setPresets(prev => [...prev, newPreset]);
    await setDoc(doc(db, 'presets', newId), newPreset);
  };

  const applyPresetToCalendar = async (presetId: string, startDate: Date, targetUserId?: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    // Si pasamos un targetUserId (Maestro asignando), lo usamos. Si no, es para mí mismo.
    const uidToAssign = targetUserId || user?.uid;
    if (!uidToAssign) return;

    let sessionsCreated = 0;

    // Iteramos sobre las rutinas configuradas en el preset
    for (const day of preset.days) {
      // Magia temporal: Sumamos el índice del día a la fecha de inicio
      const sessionDate = new Date(startDate);
      sessionDate.setDate(startDate.getDate() + day.dayIndex);
      sessionDate.setHours(12, 0, 0, 0); // Evitamos saltos de zona horaria

      const sessionId = Math.random().toString(36).substr(2, 9);
      const sessionRecord: SessionRecord = {
        id: sessionId,
        technique: day.routineName,
        date: sessionDate.toISOString(),
        durationSeconds: 0,
        bpm: 60,
        status: 'Pendiente',
        isPreset: true,
        exercises: day.exercises,
        userId: uidToAssign,
        // Si el maestro está asignando (targetUserId existe), le ponemos el candado. Si se lo aplica el alumno a sí mismo, se queda vacío.
        assignedBy: targetUserId ? user?.uid : undefined 
      };

      // Inyectamos directo a la base de datos
      await setDoc(doc(db, 'sessions', sessionId), sessionRecord);
      sessionsCreated++;

      // Si el alumno se lo está aplicando a SÍ MISMO, lo metemos en su estado local para que lo vea ya
      if (uidToAssign === user?.uid) {
        setSessionHistory(prev => [...prev, sessionRecord]);
      }
    }
    
    alert(`¡Planificación aplicada! ${sessionsCreated} rutinas inyectadas en el calendario.`);
  };

  // Inyectar una rutina suelta directamente en el día de hoy del alumno ("sin piedad")
  const forceRoutineToToday = async (routineName: string, exercises: Exercise[], targetUserId: string) => {
    if (!targetUserId) return;
    const sessionId = Math.random().toString(36).substr(2, 9);
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Evitamos saltos horarios

    const sessionRecord: SessionRecord = {
      id: sessionId,
      technique: routineName,
      date: today.toISOString(),
      durationSeconds: 0,
      bpm: 60,
      status: 'Pendiente',
      isPreset: true,
      exercises: exercises,
      userId: targetUserId,
      assignedBy: user?.uid || undefined // Candado de no borrar
    };

    await setDoc(doc(db, 'sessions', sessionId), sessionRecord);
    alert(`¡Rutina "${routineName}" inyectada con éxito en la agenda de hoy del alumno!`);
  };



  const contextValue = { 
    user, students, login, register, logout,
    activeExercise, setActiveExercise, activeSessionId, setActiveSessionId, updateSessionRecord,
    routine, addToRoutine, addExercisesToDay, removeFromRoutine, sessionName, clearRoutine, loadRoutine, reorderRoutine,
    sessionHistory, addSessionRecord,
    savedRoutines, saveCurrentRoutine, deleteSavedRoutine,
    weeklyPlan, assignRoutineToDay, removeSessionRecord,
    presets, savePreset, applyPresetToCalendar, forceRoutineToToday
  };
  // 1. Pantalla de Carga Inicial
  if (loadingAuth) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Conectando al servidor...</p>
        </div>
      </div>
    );
  }

  // 2. Muro de Seguridad: Si no hay usuario, interceptamos la app y mostramos el Login
  return (
    <AppContext.Provider value={contextValue}>
      {!user ? <AuthScreen /> : children}
    </AppContext.Provider>
  );
}

// --- COMPONENTE DE LOGIN Y REGISTRO ---
function AuthScreen() {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) await login(email, password);
      else await register(email, password);
    } catch (error) {
      // Le decimos a TypeScript que el error de Firebase contiene un 'code'
      const err = error as { code?: string };
      
      if (isLogin) {
        setError('Credenciales incorrectas.');
      } else {
        if (err.code === 'auth/email-already-in-use') {
          setError('Este correo ya está registrado por un alumno.');
        } else if (err.code === 'auth/weak-password') {
          setError('La contraseña es muy débil (mínimo 6 caracteres).');
        } else {
          setError('Error en el registro. Revisa los datos.');
        }
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      
      // 📝 Creamos o actualizamos la ficha del usuario con su rol real al instante
      await setDoc(doc(db, 'users', result.user.uid), { 
        uid: result.user.uid, 
        email: result.user.email,
        role: result.user.email?.toLowerCase() === 'jvillaescusam@gmail.com' ? 'teacher' : 'student',
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error(error);
      setError('Error al conectar con Google.');
    }
    setLoading(false);
  };
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-900 p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <span className="text-[40rem]">🎸</span>
      </div>
      <div className="w-full max-w-sm bg-slate-800 border border-slate-700/50 p-8 rounded-3xl shadow-2xl shadow-black/40 z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl mx-auto mb-6 shadow-lg shadow-blue-600/20">GP</div>
          <h1 className="text-xl font-black uppercase tracking-widest text-slate-200">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Tu entrenador de guitarra</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</label>
            <input type="email" id="email" name="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-colors" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contraseña</label>
            <input type="password" id="password" name="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-colors" />
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center"><span className="text-[10px] font-black text-red-400 uppercase">{error}</span></div>}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 mt-2 cursor-pointer disabled:opacity-50">
            {loading ? 'Procesando...' : (isLogin ? 'Entrar' : 'Registrarse')}
          </button>
        </form>

        <div className="mt-4">
          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            disabled={loading} 
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Entrar con Google
          </button>
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} type="button" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors cursor-pointer">
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}