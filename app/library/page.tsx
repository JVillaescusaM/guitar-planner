'use client';

import { useState } from 'react';
import exercisesData from '../../src/data/exercises.json';
import { useApp, Exercise } from '../../src/context/AppContext';

// Extraemos las técnicas únicas para hacer un filtro rápido
const allTechniques = Array.from(
  new Set(exercisesData.map((ej) => ej.mainTechnique || 'OTROS'))
).sort();

export default function Library() {
  // Solucionado ts(2339) y ts(6133): Eliminada la desestructuración del filtro fantasma
  useApp(); 
  
  const [filter, setFilter] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Lógica de filtrado limpia y directa
  const filteredExercises = (exercisesData as Exercise[]).filter((ej) => {
    const matchesFilter = filter === 'TODOS' || (ej.mainTechnique || 'OTROS') === filter;
    const matchesSearch = ej.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 flex h-screen bg-slate-900 overflow-hidden font-sans">
      
      {/* PANEL ÚNICO A PANTALLA COMPLETA: DICCIONARIO INTERACTIVO */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-900 relative z-10">
        
        {/* CABECERA Y FILTROS */}
        <header className="p-6 lg:p-8 border-b border-slate-700/50 shrink-0 bg-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.2)] z-20">
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-200 mb-6">
            Biblioteca de Ejercicios
          </h1>
          
          <div className="flex flex-col xl:flex-row gap-4 xl:items-center">
            <input 
              type="text" 
              placeholder="Buscar ejercicio por nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-slate-200 text-xs w-full xl:w-72 focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"
            />
            
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <button 
                onClick={() => setFilter('TODOS')}
                className={`px-4 py-2.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap shadow-sm cursor-pointer ${
                  filter === 'TODOS' ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-slate-900 border border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`}
              >
                TODOS
              </button>
              {allTechniques.map(tech => (
                <button 
                  key={tech}
                  onClick={() => setFilter(tech)}
                  className={`px-4 py-2.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap shadow-sm cursor-pointer ${
                    filter === tech ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-slate-900 border border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* TABLA DE RESULTADOS (MODO CONSULTA PURA) */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700/50">
                  <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-16 text-center">ID</th>
                  <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Título / Descripción</th>
                  <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest hidden md:table-cell">Técnica</th>
                  <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest hidden lg:table-cell text-center">Nivel</th>
                  <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest hidden sm:table-cell text-center">Duración</th>
                  <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center w-28">Material</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredExercises.map((ej) => {
                  return (
                    <tr key={ej.id} className="hover:bg-slate-700/30 transition-colors group">
                      <td className="p-4 text-[10px] font-black text-slate-600 text-center">{ej.id}</td>
                      <td className="p-4">
                        <span className="text-[11px] font-bold text-slate-200 uppercase leading-none block mb-1.5">{ej.title}</span>
                        <span className="text-[9px] font-bold text-slate-500 line-clamp-1 hidden md:block">{ej.description || 'Sin descripción'}</span>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">
                          {ej.mainTechnique || 'OTROS'}
                        </span>
                      </td>
                      <td className="p-4 hidden lg:table-cell text-center">
                        <span className="text-[10px] font-bold text-slate-400">{ej.level || '-'}</span>
                      </td>
                      <td className="p-4 hidden sm:table-cell text-center">
                        <span className="text-[10px] font-mono font-bold text-slate-400">{ej.duration || '00:00'}</span>
                      </td>
                      <td className="p-4 text-center">
                        {ej.pdfUrl && ej.pdfUrl !== 'nan' ? (
                          <a 
                            href={ej.pdfUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block px-3 py-1.5 bg-slate-900 border border-slate-700/60 hover:border-blue-500/50 text-slate-400 hover:text-blue-400 text-[9px] font-black tracking-wider uppercase rounded-lg transition-all"
                          >
                            📄 Ver PDF
                          </a>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">No PDF</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredExercises.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 bg-slate-900/30">
                <p className="font-black text-[10px] uppercase tracking-widest mb-2">No se encontraron ejercicios</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}