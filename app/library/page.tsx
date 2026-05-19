'use client';

import React, { useState } from 'react';
import exercisesDataRaw from '../../src/data/exercises.json';
import { useApp, Exercise } from '../../src/context/AppContext';
import { Search, ListVideo, Plus, FileText, SlidersHorizontal, Trophy, Clock, Zap, Layers, Video } from 'lucide-react';

// 🛡️ Forzamos a TypeScript a usar nuestra interfaz oficial en lugar de adivinar el contenido del JSON
const exercisesData = exercisesDataRaw as Exercise[];

export default function LibraryPage() {
  const { addToRoutine } = useApp();  
  
  // Estados para controlar los filtros y búsquedas de la columna izquierda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState('Todas');
  const [selectedLevel, setSelectedLevel] = useState('Todos');
  const [selectedCollection, setSelectedCollection] = useState('Todas');
  const [selectedObjective, setSelectedObjective] = useState('Todos');
  const [sortBy, setSortBy] = useState<string>('none');

  // Estado para el ejercicio seleccionado en el Visualizador Derecho
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Extracción dinámica de valores únicos presentes en tu JSON para alimentar los selectores
  const uniqueTechniques = ['Todas', ...Array.from(new Set(exercisesData.map(ex => ex.mainTechnique).filter(Boolean)))];
  const uniqueLevels = ['Todos', ...Array.from(new Set(exercisesData.map(ex => ex.level).filter(Boolean)))];
  const uniqueCollections = ['Todas', ...Array.from(new Set(exercisesData.map(ex => ex.collection).filter(Boolean)))];
  const uniqueObjectives = ['Todos', ...Array.from(new Set(exercisesData.flatMap(ex => ex.objectives).filter(Boolean)))];

  // 🧠 Algoritmo de filtrado y ordenación combinada
  const filteredExercises = exercisesData
    .filter((ex) => {
      const matchesSearch = ex.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            ex.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTechnique = selectedTechnique === 'Todas' || 
                               ex.mainTechnique === selectedTechnique || 
                               ex.secondaryTechnique === selectedTechnique;
      const matchesLevel = selectedLevel === 'Todos' || ex.level === selectedLevel;
      const matchesCollection = selectedCollection === 'Todas' || ex.collection === selectedCollection;
      
      // Filtro por objetivos global: busca el objetivo en la lista sin importar si era el 1, 2 o el 3
      const matchesObjective = selectedObjective === 'Todos' || ex.objectives.includes(selectedObjective);
      
      return matchesSearch && matchesTechnique && matchesLevel && matchesCollection && matchesObjective;
    })
    .sort((a, b) => {
      if (sortBy === 'duration-asc') return a.duration.localeCompare(b.duration);
      if (sortBy === 'duration-desc') return b.duration.localeCompare(a.duration);
      if (sortBy === 'bpm-asc') return (a.recommendedBpm || 0) - (b.recommendedBpm || 0);
      if (sortBy === 'bpm-desc') return (b.recommendedBpm || 0) - (a.recommendedBpm || 0);
      return 0;
    });

  // Helper estético para pintar las subdivisiones musicales
  const getSubdivisionLabel = (sub?: number) => {
    if (sub === 1) return 'Negras (x1)';
    if (sub === 2) return 'Corcheas (x2)';
    if (sub === 3) return 'Tresillos (x3)';
    if (sub === 4) return 'Semicorcheas (x4)';
    return 'Negras (x1)';
  };

  return (
    <div className="flex h-full w-full bg-slate-900 text-slate-200 font-sans overflow-hidden">
      
      {/* 📱 COLUMNA IZQUIERDA: Panel de Mandos, Filtros y Lista */}
      <div className="w-105 border-r border-slate-800 flex flex-col h-full bg-slate-950/30 shrink-0">
        
        {/* Cabecera de Filtros */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-2 text-sky-400">
            <SlidersHorizontal size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Biblioteca / Panel Filtros</span>
          </div>

          {/* Buscador de texto */}
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Buscar por nombre o código de ejercicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-300 outline-none focus:border-sky-500/40 transition-colors"
            />
          </div>

          {/* Rejilla de Selectores Avanzados */}
          <div className="grid grid-cols-2 gap-2">
            
            {/* Filtro Técnico */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Técnica</label>
              <select
                value={selectedTechnique}
                onChange={(e) => setSelectedTechnique(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-sky-500/40 cursor-pointer"
              >
                {uniqueTechniques.map(tech => <option key={tech} value={tech}>{tech}</option>)}
              </select>
            </div>

            {/* Filtro de Nivel */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Nivel</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-sky-500/40 cursor-pointer"
              >
                {uniqueLevels.map(lvl => <option key={lvl} value={lvl}>{lvl === 'Todos' ? 'Todos los Niveles' : `Grado ${lvl}`}</option>)}
              </select>
            </div>

            {/* Filtro de Colección */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Colección</label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-sky-500/40 cursor-pointer"
              >
                {uniqueCollections.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>

            {/* Filtro de Objetivos Múltiples */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Objetivo Pedagógico</label>
              <select
                value={selectedObjective}
                onChange={(e) => setSelectedObjective(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-sky-500/40 cursor-pointer"
              >
                {uniqueObjectives.map(obj => <option key={obj} value={obj}>{obj}</option>)}
              </select>
            </div>

          </div>

          {/* Menú de Ordenación Dinámica */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Criterio de Ordenación</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-sky-500/40 cursor-pointer"
            >
              <option value="none">Ordenación por Defecto (Código)</option>
              <option value="duration-asc">⏱️ Duración (Menor a Mayor)</option>
              <option value="duration-desc">⏱️ Duración (Mayor a Menor)</option>
              <option value="bpm-asc">⚡ BPM Recomendado (Menor a Mayor)</option>
              <option value="bpm-desc">⚡ BPM Recomendado (Mayor a Menor)</option>
            </select>
          </div>

        </div>

        {/* Listado Inferior de Resultados */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-slate-950/10">
          <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 px-1">
            Ejercicios Disponibles ({filteredExercises.length})
          </div>
          
          {filteredExercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelectedExercise(ex)}
              className={`w-full shrink-0 text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 group relative overflow-hidden ${
                selectedExercise?.id === ex.id
                  ? 'bg-sky-500/10 border-sky-500/40 shadow-lg shadow-sky-500/5'
                  : 'bg-slate-850/40 border-slate-800/60 hover:bg-slate-800/50 hover:border-slate-700/50'
              }`}
            >
              <div className="flex flex-col gap-1 truncate">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300 transition-colors">
                    {ex.id}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-slate-300 transition-colors">
                    {ex.mainTechnique}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                  {ex.title}
                </h3>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><Clock size={11} /> {ex.duration}</span>
                  <span className="flex items-center gap-1"><Zap size={11} /> {ex.recommendedBpm || 60} BPM</span>
                </div>
              </div>
              
              {/* Botón rápido incorporado para añadir a la rutina de estudio */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addToRoutine(ex);
                }}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-sky-600 text-slate-400 hover:text-white transition-all shadow-sm shrink-0 z-10 cursor-pointer"
                title="Añadir a la rutina de estudio"
              >
                <Plus size={13} />
              </button>
            </button>
          ))}

          {filteredExercises.length === 0 && (
            <div className="text-center py-16 text-[10px] text-slate-600 uppercase font-black tracking-widest">
              Sin resultados para los filtros aplicados
            </div>
          )}
        </div>
      </div>

      {/* 📺 COLUMNA DERECHA: El Visualizador e Inspector Tecnológico */}
      <div className="flex-1 flex flex-col h-full bg-slate-900">
        {selectedExercise ? (
          <>
            {/* 1. VISUALIZADOR SUPERIOR: La Partitura en PDF */}
            <div className="flex-1 bg-slate-950 p-4 border-b border-slate-800/80 flex flex-col">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  <ListVideo size={14} className="text-sky-400" />
                  Visor de Partitura PDF Integrado
                </div>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800/60">
                  {selectedExercise.pdfUrl}
                </span>
              </div>
              <iframe
                src={`${selectedExercise.pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
                className="w-full h-full rounded-2xl border border-slate-800/60 bg-slate-900 shadow-2xl"
                title={selectedExercise.title}
              />
            </div>

            {/* 2. MONITOR INFERIOR: El Inspector Detallado del Ejercicio */}
            <div className="h-85 bg-slate-950/40 p-6 overflow-y-auto flex flex-col gap-5 shrink-0 border-t border-slate-800/50">
              
              {/* Cabecera del Inspector */}
              <div className="flex items-start justify-between border-b border-slate-800/60 pb-3.5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                      CÓDIGO: {selectedExercise.id}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                      COLECCIÓN: {selectedExercise.collection || 'General'}
                    </span>
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-wide text-slate-100 mt-1">
                    {selectedExercise.title}
                  </h2>
                </div>

                {/* Botón de acción principal dentro del Monitor */}
                <button
                  onClick={() => addToRoutine(selectedExercise)}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-lg shadow-sky-600/10 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={14} />
                  Cargar en Rutina de Estudio
                </button>
              </div>

              {/* Matriz de Parámetros de Excel */}
              <div className="grid grid-cols-4 gap-4">
                
                {/* Cuadrante Técnicas */}
                <div className="bg-slate-900/60 border border-slate-800/50 p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Layers size={10} /> Arquitectura Técnica
                  </span>
                  <div className="text-xs font-bold text-slate-200 mt-1 space-y-0.5">
                    <p><span className="text-slate-500 text-[10px] font-medium">Principal:</span> {selectedExercise.mainTechnique}</p>
                    <p><span className="text-slate-500 text-[10px] font-medium">Secundaria:</span> {selectedExercise.secondaryTechnique || 'Ninguna'}</p>
                  </div>
                </div>

                {/* Cuadrante Métricas de Ejecución */}
                <div className="bg-slate-900/60 border border-slate-800/50 p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Zap size={10} /> Parámetros Iniciales
                  </span>
                  <div className="text-xs font-bold text-slate-200 mt-1 space-y-0.5">
                    <p><span className="text-slate-500 text-[10px] font-medium">BPM Inicial:</span> {selectedExercise.recommendedBpm || 60} bpm</p>
                    <p><span className="text-slate-500 text-[10px] font-medium">Subdivisión:</span> {getSubdivisionLabel(selectedExercise.subdivision)}</p>
                  </div>
                </div>

                {/* Cuadrante Tiempos y Objetivos */}
                <div className="bg-slate-900/60 border border-slate-800/50 p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Clock size={10} /> Control de Tiempos
                  </span>
                  <div className="text-xs font-bold text-slate-200 mt-1 space-y-0.5">
                    <p><span className="text-slate-500 text-[10px] font-medium">Duración:</span> {selectedExercise.duration}</p>
                    <p><span className="text-slate-500 text-[10px] font-medium">Repeticiones:</span> {selectedExercise.repetitions} vueltas</p>
                  </div>
                </div>

                {/* Cuadrante Datos de Clasificación */}
                <div className="bg-slate-900/60 border border-slate-800/50 p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Trophy size={10} /> Clasificación
                  </span>
                  <div className="text-xs font-bold text-slate-200 mt-1 space-y-0.5">
                    <p><span className="text-slate-500 text-[10px] font-medium">Nivel:</span> Grado {selectedExercise.level}</p>
                    <p className="flex items-center gap-1 truncate">
                      <span className="text-slate-500 text-[10px] font-medium">Video ID:</span> 
                      {selectedExercise.videoId ? (
                        <span className="text-amber-400 flex items-center gap-0.5 font-mono text-[11px]"><Video size={10} /> {selectedExercise.videoId}</span>
                      ) : <span className="text-slate-600 font-normal italic">Sin vídeo</span>}
                    </p>
                  </div>
                </div>

              </div>

              {/* Sección Inferior de Objetivos y Notas Adicionales */}
              <div className="grid grid-cols-12 gap-4 mt-1">
                
                {/* Bloque de Tags de Objetivos */}
                <div className="col-span-4 flex flex-col gap-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Objetivos Pedagógicos</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedExercise.objectives && selectedExercise.objectives.length > 0 ? (
                      selectedExercise.objectives.map((obj, idx) => (
                        <span key={idx} className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center justify-center">
                          🎯 {obj}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-600 italic">No definidos en la ficha</span>
                    )}
                  </div>
                </div>

                {/* Bloque de Notas y Descripción */}
                <div className="col-span-8 flex flex-col gap-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Notas de Ejecución y Guía del Ejercicio</span>
                  <div className="bg-slate-900/30 border border-slate-800/40 p-3 rounded-xl h-full min-h-15 text-xs text-slate-400 font-medium leading-relaxed">
                    {selectedExercise.description && selectedExercise.description !== 'nan' ? selectedExercise.description : 'Este ejercicio no contiene notas explicativas ni indicaciones de ejecución complementarias.'}
                  </div>
                </div>

              </div>

            </div>
          </>
        ) : (
          /* 📭 Estado Inicial: Monitor Apagado */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 bg-slate-950/10">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/40 flex items-center justify-center border border-slate-800 shadow-inner">
              <FileText size={24} className="text-slate-600" />
            </div>
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Monitor del Inspector Inactivo</p>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Selecciona cualquier ejercicio de la biblioteca para inicializar la telemetría</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}