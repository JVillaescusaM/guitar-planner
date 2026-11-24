"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import exercisesDataRaw from "../../src/data/exercises.json";
import { useApp, Exercise } from "../../src/context/AppContext";
import {
  Search,
  FileText,
  SlidersHorizontal,
  Trophy,
  Clock,
  Zap,
  Layers,
  Play,
} from "lucide-react";
import DesktopOnly from "../../src/components/DesktopOnly";

const exercisesData = exercisesDataRaw as Exercise[];

export default function LibraryPage() {
  const router = useRouter();
  const { loadRoutine, setActiveExercise, setActiveSessionId } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnique, setSelectedTechnique] = useState("Todas");
  const [selectedLevel, setSelectedLevel] = useState("Todos");
  const [selectedCollection, setSelectedCollection] = useState("Todas");
  const [selectedObjective, setSelectedObjective] = useState("Todos");
  const [sortBy, setSortBy] = useState<string>("none");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );

  const uniqueTechniques = [
    "Todas",
    ...Array.from(
      new Set(exercisesData.map((ex) => ex.mainTechnique).filter(Boolean)),
    ),
  ];
  const uniqueLevels = [
    "Todos",
    ...Array.from(
      new Set(exercisesData.map((ex) => ex.level).filter(Boolean)),
    ).sort(),
  ];
  const uniqueCollections = [
    "Todas",
    ...Array.from(
      new Set(exercisesData.map((ex) => ex.collection).filter(Boolean)),
    ),
  ];
  const uniqueObjectives = [
    "Todos",
    ...Array.from(
      new Set(exercisesData.flatMap((ex) => ex.objectives).filter(Boolean)),
    ),
  ];

  const filteredExercises = exercisesData
    .filter((ex) => {
      const matchesSearch =
        ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTechnique =
        selectedTechnique === "Todas" ||
        ex.mainTechnique === selectedTechnique ||
        ex.secondaryTechnique === selectedTechnique;
      const matchesLevel =
        selectedLevel === "Todos" || ex.level === selectedLevel;
      const matchesCollection =
        selectedCollection === "Todas" || ex.collection === selectedCollection;
      const matchesObjective =
        selectedObjective === "Todos" ||
        ex.objectives.includes(selectedObjective);

      return (
        matchesSearch &&
        matchesTechnique &&
        matchesLevel &&
        matchesCollection &&
        matchesObjective
      );
    })
    .sort((a, b) => {
      if (sortBy === "duration-asc")
        return a.duration.localeCompare(b.duration);
      if (sortBy === "duration-desc")
        return b.duration.localeCompare(a.duration);
      if (sortBy === "bpm-asc")
        return (a.recommendedBpm || 0) - (b.recommendedBpm || 0);
      if (sortBy === "bpm-desc")
        return (b.recommendedBpm || 0) - (a.recommendedBpm || 0);
      return 0;
    });

  const getSubdivisionLabel = (sub?: number) => {
    const map: Record<number, string> = {
      1: "Negras (x1)",
      2: "Corcheas (x2)",
      3: "Tresillos (x3)",
      4: "Semicorcheas (x4)",
      5: "Cinquillos (x5)",
      6: "Seisillos (x6)",
      7: "Septimillos (x7)",
      8: "Fusas (x8)",
    };
    return map[sub || 1] || `Subdivisión (x${sub || 1})`;
  };

  const getTechniqueBorder = (technique: string) => {
    const tech = technique.toUpperCase();
    if (tech.includes("LIGADO")) return "border-l-blue-500";
    if (tech.includes("ARPEGIO")) return "border-l-emerald-500";
    if (tech.includes("PICADO")) return "border-l-red-500";
    if (tech.includes("PULGAR") || tech.includes("BORD"))
      return "border-l-amber-500";
    if (tech.includes("TREMOLO") || tech.includes("TRÉMOLO"))
      return "border-l-purple-500";
    if (tech.includes("RASGUEO")) return "border-l-orange-500";
    if (tech.includes("ALZAP")) return "border-l-pink-500";
    return "border-l-slate-400";
  };

  const handleQuickPractice = (ex: Exercise) => {
    setActiveSessionId(null);
    loadRoutine([ex], ex.title);
    setActiveExercise(ex);
    router.push("/practice");
  };

  return (
    <DesktopOnly label="La Biblioteca">
      <div className="flex h-full w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
        {/* Panel izquierdo: Filtros y lista */}
        <div className="w-80 lg:w-96 border-r border-slate-200 flex flex-col h-full bg-white shrink-0 min-h-0">
          <div className="p-4 border-b border-slate-200 flex flex-col gap-3 shrink-0">
            <div className="flex items-center gap-2 text-indigo-600">
              <SlidersHorizontal size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Biblioteca
              </span>
            </div>

            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={15}
              />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedTechnique}
                onChange={(e) => setSelectedTechnique(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
              >
                {uniqueTechniques.map((tech) => (
                  <option key={tech} value={tech}>
                    {tech === "Todas" ? "Técnica: Todas" : tech}
                  </option>
                ))}
              </select>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
              >
                {uniqueLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl === "Todos" ? "Nivel: Todos" : `Nivel ${lvl}`}
                  </option>
                ))}
              </select>

              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
              >
                {uniqueCollections.map((col) => (
                  <option key={col} value={col}>
                    {col === "Todas" ? "Colección: Todas" : col}
                  </option>
                ))}
              </select>

              <select
                value={selectedObjective}
                onChange={(e) => setSelectedObjective(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
              >
                {uniqueObjectives.map((obj) => (
                  <option key={obj} value={obj}>
                    {obj === "Todos" ? "Objetivo: Todos" : obj}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="none">Orden por defecto (Código)</option>
              <option value="duration-asc">Duración (menor a mayor)</option>
              <option value="duration-desc">Duración (mayor a menor)</option>
              <option value="bpm-asc">BPM recomendado (menor a mayor)</option>
              <option value="bpm-desc">BPM recomendado (mayor a menor)</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar bg-slate-50/50">
            <div className="text-[11px] font-semibold text-slate-400 px-1">
              {filteredExercises.length} ejercicios
            </div>

            {filteredExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setSelectedExercise(ex)}
                className={`w-full shrink-0 text-left p-3 rounded-xl border border-l-4 transition-all cursor-pointer ${getTechniqueBorder(
                  ex.mainTechnique,
                )} ${
                  selectedExercise?.id === ex.id
                    ? "bg-indigo-50/70 border-y-indigo-300 border-r-indigo-300 shadow-xs"
                    : "bg-white border-y-slate-200 border-r-slate-200 hover:border-y-slate-300 hover:border-r-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {ex.id}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {ex.mainTechnique}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    Nv. {ex.level}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 truncate">
                  {ex.title}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {ex.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap size={12} /> {ex.recommendedBpm || 60} BPM
                  </span>
                </div>
              </button>
            ))}

            {filteredExercises.length === 0 && (
              <div className="text-center py-12 text-xs text-slate-400">
                Sin resultados para los filtros aplicados
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: Visor PDF + Ficha */}
        <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50">
          {selectedExercise ? (
            <>
              <div className="flex-1 p-4 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                      {selectedExercise.id}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 truncate">
                      {selectedExercise.title}
                    </h2>
                  </div>

                  <button
                    onClick={() => handleQuickPractice(selectedExercise)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Play size={14} />
                    Practicar ahora
                  </button>
                </div>

                <iframe
                  src={`${selectedExercise.pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
                  className="w-full flex-1 rounded-2xl border border-slate-200 bg-white shadow-xs"
                  title={selectedExercise.title}
                />
              </div>

              <div className="bg-white border-t border-slate-200 p-5 shrink-0">
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                      <Layers size={12} /> Técnicas
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      {selectedExercise.mainTechnique}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {selectedExercise.secondaryTechnique || "Sin secundaria"}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                      <Zap size={12} /> Parámetros
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      {selectedExercise.recommendedBpm || 60} BPM
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {getSubdivisionLabel(selectedExercise.subdivision)}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                      <Clock size={12} /> Tiempos
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      {selectedExercise.duration}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {selectedExercise.repetitions} vueltas
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                      <Trophy size={12} /> Dificultad
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      Nivel {selectedExercise.level}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {selectedExercise.collection || "General"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
              <FileText size={32} className="text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                Selecciona un ejercicio de la biblioteca
              </p>
              <p className="text-xs text-slate-400">
                Podrás ver su partitura en PDF, parámetros técnicos o lanzarlo
                directo a practicar
              </p>
            </div>
          )}
        </div>
      </div>
    </DesktopOnly>
  );
}
