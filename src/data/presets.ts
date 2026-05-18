import exercisesDataRaw from './exercises.json';
import { Exercise } from '../context/AppContext';

// Forzamos el tipado de los datos importados
const exercisesData = exercisesDataRaw as Exercise[];

export const FACTORY_PRESETS = [
  { 
    id: 'factory_picado',
    name: "Picado x1000", 
    color: "border-red-900/50 text-red-500",
    getExercises: () => exercisesData.filter(ex => ex.mainTechnique === "PICADOS").slice(0, 8)
  },
  { 
    id: 'factory_entri',
    name: "Todo Entri Locura Conde", 
    color: "border-purple-900/50 text-purple-500",
    getExercises: () => exercisesData.filter(ex => ex.title.includes("ENTRI")).slice(0, 10)
  },
  { 
    id: 'factory_ligados',
    name: "Resistencia Ligados", 
    color: "border-emerald-900/50 text-emerald-500",
    getExercises: () => exercisesData.filter(ex => ex.mainTechnique === "LIGADO").slice(0, 6)
  }
];