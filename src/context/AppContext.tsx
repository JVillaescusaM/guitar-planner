"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

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
  subdivision?: number;
  collection?: string;
  videoId?: string;
  recommendedBpm?: number;
  instanceId?: string;
}

export interface ExerciseStats {
  bpm: number;
  timeSpent: number;
  npm: number;
}

export interface SessionRecord {
  id: string;
  exerciseId?: string | number;
  technique: string;
  date: string;
  durationSeconds: number;
  bpm: number;
  status?: "Acabada" | "Inacabada" | "Pausada" | "Pendiente";
  isPreset?: boolean;
  exercises?: Exercise[];
  completedExercisesData?: Record<string, number>;
  exerciseStats?: Record<string, ExerciseStats>;
  totalXP?: number;
  rpe?: number;
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
  updateSessionRecord: (
    id: string,
    updates: Partial<SessionRecord>,
  ) => Promise<void>;
  addToRoutine: (exercise: Exercise) => void;
  addExercisesToDay: (
    date: Date,
    name: string,
    exercises: Exercise[],
  ) => Promise<void>;
  removeFromRoutine: (id: string | number) => void;
  clearRoutine: () => void;
  loadRoutine: (newRoutine: Exercise[], name?: string) => void;
  reorderRoutine: (startIndex: number, endIndex: number) => void;
  sessionHistory: SessionRecord[];
  addSessionRecord: (record: Omit<SessionRecord, "id" | "date">) => string;
  savedRoutines: SavedRoutine[];
  students: Student[];
  saveCurrentRoutine: (
    name: string,
    isPublic?: boolean,
    assignedTo?: string | null,
  ) => Promise<void>;
  deleteSavedRoutine: (id: string) => Promise<void>;
  weeklyPlan: WeeklyPlan;
  assignRoutineToDay: (day: string, routineId: string | null) => Promise<void>;
  removeSessionRecord: (id: string) => Promise<void>;
  presets: Preset[];
  savePreset: (presetData: Omit<Preset, "id" | "createdBy">) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  applyPresetToCalendar: (
    presetId: string,
    startDate: Date,
    targetUserId?: string,
  ) => Promise<number>;
  forceRoutineToToday: (
    routineName: string,
    exercises: Exercise[],
    targetUserId: string,
  ) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Elimina recursivamente valores `undefined` para que Firestore nunca rechace un documento
function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined) as unknown as T;
  }
  if (obj !== null && typeof obj === "object") {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = stripUndefined(v);
      }
    }
    return clean as T;
  }
  return obj;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [routine, setRoutine] = useState<Exercise[]>([]);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);

  useEffect(() => {
    let unsubscribeSessions = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribeSessions();
      setUser(currentUser);

      if (currentUser) {
        // 1. Historial de sesiones en tiempo real (ordenado de más reciente a más antiguo)
        try {
          const qSessions = query(
            collection(db, "sessions"),
            where("userId", "==", currentUser.uid),
          );
          unsubscribeSessions = onSnapshot(
            qSessions,
            (snapshot) => {
              const history: SessionRecord[] = [];
              snapshot.forEach((d) =>
                history.push({ id: d.id, ...d.data() } as SessionRecord),
              );
              history.sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              );
              setSessionHistory(history);
            },
            (err) => console.error("Error historial:", err),
          );
        } catch (err) {
          console.error("Error historial:", err);
        }

        // 2. Rutinas (Mías + Públicas + Asignadas)
        try {
          const routinesMap = new Map<string, SavedRoutine>();
          const qMine = query(
            collection(db, "routines"),
            where("userId", "==", currentUser.uid),
          );
          const qPublic = query(
            collection(db, "routines"),
            where("isPublic", "==", true),
          );
          const qAssigned = query(
            collection(db, "routines"),
            where("assignedTo", "==", currentUser.uid),
          );

          const [snapMine, snapPublic, snapAssigned] = await Promise.all([
            getDocs(qMine),
            getDocs(qPublic),
            getDocs(qAssigned),
          ]);

          [snapMine, snapPublic, snapAssigned].forEach((snap) => {
            snap.forEach((d) =>
              routinesMap.set(d.id, { id: d.id, ...d.data() } as SavedRoutine),
            );
          });
          setSavedRoutines(Array.from(routinesMap.values()));
        } catch (err) {
          console.error("Error rutinas:", err);
        }

        // 3. Plan semanal guardado del usuario
        try {
          const userSnap = await getDoc(doc(db, "users", currentUser.uid));
          if (userSnap.exists() && userSnap.data().weeklyPlan) {
            setWeeklyPlan(userSnap.data().weeklyPlan as WeeklyPlan);
          }
        } catch (err) {
          console.error("Error weeklyPlan:", err);
        }

        // 4. Directorio de alumnos (solo Maestro)
        if (currentUser.email?.toLowerCase() === "jvillaescusam@gmail.com") {
          try {
            const snapUsers = await getDocs(collection(db, "users"));
            const usersList: Student[] = [];
            snapUsers.forEach((d) => {
              if (d.data().email !== "jvillaescusam@gmail.com") {
                usersList.push({ uid: d.id, ...d.data() } as Student);
              }
            });
            setStudents(usersList);
          } catch (err) {
            console.error("Error alumnos:", err);
          }
        }

        // 5. Planificaciones (Presets)
        try {
          const presetsMap = new Map<string, Preset>();
          const qPublic = query(
            collection(db, "presets"),
            where("isPublic", "==", true),
          );
          const qMine = query(
            collection(db, "presets"),
            where("createdBy", "==", currentUser.uid),
          );

          const [snapPub, snapMine] = await Promise.all([
            getDocs(qPublic),
            getDocs(qMine),
          ]);
          [snapPub, snapMine].forEach((snap) => {
            snap.forEach((d) =>
              presetsMap.set(d.id, { id: d.id, ...d.data() } as Preset),
            );
          });
          setPresets(Array.from(presetsMap.values()));
        } catch (err) {
          console.error("Error presets:", err);
        }
      } else {
        setSessionHistory([]);
        setSavedRoutines([]);
        setWeeklyPlan({});
        setStudents([]);
        setPresets([]);
      }
      setLoadingAuth(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSessions();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (!userCredential.user.emailVerified) {
      await signOut(auth);
      throw new Error(
        "Tu cuenta aún no está verificada. Revisa tu correo (y spam) para activarla.",
      );
    }
  };

  const register = async (email: string, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      pass,
    );
    const newUser = userCredential.user;
    await sendEmailVerification(newUser);
    await setDoc(doc(db, "users", newUser.uid), {
      uid: newUser.uid,
      email: newUser.email,
      role: "student",
      createdAt: new Date().toISOString(),
    });
    await signOut(auth);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const addToRoutine = (exercise: Exercise) => {
    setRoutine((prev) => [...prev, { ...exercise, instanceId: generateId() }]);
  };

  const addExercisesToDay = async (
    date: Date,
    name: string,
    exercisesToAdd: Exercise[],
  ) => {
    if (!user?.uid) return;
    const newId = generateId();
    const newRecord: SessionRecord = {
      id: newId,
      technique: name,
      date: date.toISOString(),
      durationSeconds: 0,
      bpm: 60,
      status: "Pendiente",
      isPreset: true,
      exercises: exercisesToAdd,
      userId: user.uid,
    };
    try {
      await setDoc(doc(db, "sessions", newId), stripUndefined(newRecord));
    } catch (err) {
      console.error("Error al añadir ejercicios al día:", err);
      alert("No se pudo guardar la sesión en la nube.");
    }
  };

  const updateSessionRecord = async (
    id: string,
    updates: Partial<SessionRecord>,
  ) => {
    if (!user?.uid) return;
    const existing = sessionHistory.find((r) => r.id === id);
    const payload = stripUndefined({
      ...(existing || {}),
      ...updates,
      id,
      userId: existing?.userId || user.uid,
    });

    setSessionHistory((prev) =>
      prev.map((record) =>
        record.id === id ? { ...record, ...updates } : record,
      ),
    );

    try {
      await setDoc(doc(db, "sessions", id), payload, { merge: true });
    } catch (err) {
      console.error("Error al actualizar sesión:", err);
    }
  };

  const removeFromRoutine = (identifier: string | number) => {
    setRoutine((prev) =>
      prev.filter((ex) =>
        ex.instanceId ? ex.instanceId !== identifier : ex.id !== identifier,
      ),
    );
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

  const loadRoutine = (
    newRoutine: Exercise[],
    name: string = "Sesión de Estudio",
  ) => {
    setRoutine(newRoutine);
    setSessionName(name);
  };

  const saveCurrentRoutine = async (
    name: string,
    isPublic: boolean = false,
    assignedTo: string | null = null,
  ) => {
    if (routine.length === 0 || !user?.uid) return;
    const newId = generateId();
    const newRoutine: SavedRoutine = {
      id: newId,
      name,
      exercises: [...routine],
      userId: user.uid,
      isPublic,
      assignedTo,
    };
    try {
      await setDoc(doc(db, "routines", newId), stripUndefined(newRoutine));
      setSavedRoutines((prev) => [...prev, newRoutine]);
    } catch (err) {
      console.error("Error al guardar rutina:", err);
      alert("No se pudo guardar la rutina en Firestore.");
    }
  };

  const deleteSavedRoutine = async (id: string) => {
    try {
      await deleteDoc(doc(db, "routines", id));
      setSavedRoutines((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error al eliminar rutina:", err);
      alert("No se pudo eliminar la rutina.");
    }
  };

  const addSessionRecord = (
    record: Omit<SessionRecord, "id" | "date">,
  ): string => {
    const newId = generateId();
    const newRecord: SessionRecord = {
      ...record,
      id: newId,
      date: new Date().toISOString(),
      userId: user?.uid,
    };
    setSessionHistory((prev) => [newRecord, ...prev]);

    setDoc(doc(db, "sessions", newId), stripUndefined(newRecord)).catch(
      (err) => {
        console.error("Error al crear registro de sesión:", err);
      },
    );

    return newId;
  };

  const assignRoutineToDay = async (day: string, routineId: string | null) => {
    const updated = { ...weeklyPlan, [day]: routineId };
    setWeeklyPlan(updated);
    if (user?.uid) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          { weeklyPlan: updated },
          { merge: true },
        );
      } catch (err) {
        console.error("Error al guardar plan semanal:", err);
      }
    }
  };

  const removeSessionRecord = async (id: string) => {
    try {
      await deleteDoc(doc(db, "sessions", id));
      setSessionHistory((prev) => prev.filter((record) => record.id !== id));
    } catch (err) {
      console.error("Error al borrar sesión:", err);
      alert("No se pudo borrar la sesión.");
    }
  };

  const savePreset = async (presetData: Omit<Preset, "id" | "createdBy">) => {
    if (!user?.uid) return;
    const newId = generateId();
    const newPreset: Preset = {
      ...presetData,
      id: newId,
      createdBy: user.uid,
    };
    try {
      await setDoc(doc(db, "presets", newId), stripUndefined(newPreset));
      setPresets((prev) => [...prev, newPreset]);
    } catch (err) {
      console.error("Error al guardar plan:", err);
      alert("No se pudo guardar el plan en Firestore.");
    }
  };

  const deletePreset = async (id: string) => {
    try {
      await deleteDoc(doc(db, "presets", id));
      setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error al eliminar plan:", err);
      alert("No se pudo eliminar el plan.");
    }
  };

  const applyPresetToCalendar = async (
    presetId: string,
    startDate: Date,
    targetUserId?: string,
  ): Promise<number> => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return 0;

    const uidToAssign = targetUserId || user?.uid;
    if (!uidToAssign) return 0;

    // Solo ponemos candado si el maestro se lo asigna a OTRO usuario
    const isExternalAssignment = Boolean(
      targetUserId && targetUserId !== user?.uid,
    );
    let sessionsCreated = 0;

    try {
      for (const day of preset.days) {
        const sessionDate = new Date(startDate);
        sessionDate.setDate(startDate.getDate() + day.dayIndex);
        sessionDate.setHours(12, 0, 0, 0);

        const sessionId = generateId();
        const sessionRecord: SessionRecord = {
          id: sessionId,
          technique: day.routineName,
          date: sessionDate.toISOString(),
          durationSeconds: 0,
          bpm: 60,
          status: "Pendiente",
          isPreset: true,
          exercises: day.exercises,
          userId: uidToAssign,
          ...(isExternalAssignment && user?.uid
            ? { assignedBy: user.uid }
            : {}),
        };

        await setDoc(
          doc(db, "sessions", sessionId),
          stripUndefined(sessionRecord),
        );
        sessionsCreated++;
      }
      return sessionsCreated;
    } catch (err) {
      console.error("Error aplicando plan:", err);
      alert("Hubo un error al aplicar el plan al calendario.");
      return 0;
    }
  };

  const forceRoutineToToday = async (
    routineName: string,
    exercises: Exercise[],
    targetUserId: string,
  ) => {
    if (!targetUserId) return;
    const sessionId = generateId();
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const isExternalAssignment = targetUserId !== user?.uid;
    const sessionRecord: SessionRecord = {
      id: sessionId,
      technique: routineName,
      date: today.toISOString(),
      durationSeconds: 0,
      bpm: 60,
      status: "Pendiente",
      isPreset: true,
      exercises,
      userId: targetUserId,
      ...(isExternalAssignment && user?.uid ? { assignedBy: user.uid } : {}),
    };

    try {
      await setDoc(
        doc(db, "sessions", sessionId),
        stripUndefined(sessionRecord),
      );
    } catch (err) {
      console.error("Error al añadir rutina a hoy:", err);
      alert("No se pudo añadir la rutina a tu agenda.");
    }
  };

  const contextValue: AppContextType = {
    user,
    students,
    login,
    register,
    logout,
    activeExercise,
    setActiveExercise,
    activeSessionId,
    setActiveSessionId,
    updateSessionRecord,
    routine,
    addToRoutine,
    addExercisesToDay,
    removeFromRoutine,
    sessionName,
    clearRoutine,
    loadRoutine,
    reorderRoutine,
    sessionHistory,
    addSessionRecord,
    savedRoutines,
    saveCurrentRoutine,
    deleteSavedRoutine,
    weeklyPlan,
    assignRoutineToDay,
    removeSessionRecord,
    presets,
    savePreset,
    deletePreset,
    applyPresetToCalendar,
    forceRoutineToToday,
  };

  if (loadingAuth) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Cargando Guitar Planner...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      {!user ? <AuthScreen /> : children}
    </AppContext.Provider>
  );
}

function AuthScreen() {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
        setInfo(
          "Cuenta creada. Revisa tu correo para verificarla antes de entrar.",
        );
        setIsLogin(true);
      }
    } catch (err) {
      const eObj = err as { code?: string; message?: string };
      if (eObj.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado.");
      } else if (eObj.code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else if (
        eObj.code === "auth/invalid-credential" ||
        eObj.code === "auth/wrong-password"
      ) {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError(eObj.message || "No se pudo completar la operación.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      await setDoc(
        doc(db, "users", result.user.uid),
        {
          uid: result.user.uid,
          email: result.user.email,
          role:
            result.user.email?.toLowerCase() === "jvillaescusam@gmail.com"
              ? "teacher"
              : "student",
          createdAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (err) {
      console.error(err);
      setError("No se pudo iniciar sesión con Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="w-full max-w-sm bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-lg mx-auto mb-4 shadow-sm">
            GP
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Guitar Planner · Estudio de técnica
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold text-slate-700"
            >
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-slate-700"
            >
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-medium text-red-700">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-medium text-emerald-700">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50 mt-1"
          >
            {loading
              ? "Procesando..."
              : isLogin
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-slate-400">o continúa con</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setInfo("");
            }}
            type="button"
            className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            {isLogin
              ? "¿No tienes cuenta? Regístrate"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
