'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListVideo, ShoppingBag, BarChart3, Hammer, BookOpen } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Sidebar() {
  const { user } = useApp();
  const pathname = usePathname();

  // El maestro también es alumno, pero solo él puede ver la Forja
  const isMaster = user?.email?.toLowerCase() === 'jvillaescusam@gmail.com';

  // Función rápida para iluminar el icono de la página activa
  const linkClass = (path: string, activeColor: string = "text-blue-500") => {
    const isActive = pathname === path;
    return `p-3 rounded-xl transition-all hover:bg-slate-800/60 ${
      isActive ? `${activeColor} bg-slate-800/40 shadow-sm` : "text-slate-500 hover:text-slate-200"
    }`;
  };

  return (
    <nav className="w-16 h-full bg-black border-r border-gray-800 flex flex-col items-center py-8 gap-10 shrink-0 z-30">
      {/* LOGO */}
      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-xs tracking-tighter shadow-lg shadow-blue-600/20 select-none">
        GP
      </div>

      {/* ENLACES DE NAVEGACIÓN */}
      <div className="flex flex-col gap-5 flex-1 w-full items-center">
        <Link href="/" className={linkClass("/", "text-blue-500")} title="Torre de Control">
          <Home size={22} />
        </Link>

            <Link href="/profile" className={linkClass("/profile", "text-amber-500")} title="Mi Perfil y Estadísticas">
          <BarChart3 size={22} />
        </Link>

        <Link href="/catalog" className={linkClass("/catalog", "text-purple-500")} title="Catálogo de Planes">
          <ShoppingBag size={22} />
        </Link>
      
        <Link href="/practice" className={linkClass("/practice", "text-sky-500")} title="Sala de Práctica">
          <ListVideo size={22} />
        </Link>
        
        <Link href="/library" className={linkClass("/library", "text-sky-500")} title="Biblioteca de Consulta">
          <BookOpen size={22} />
        </Link>
        
        
        


        {/* SEPARADOR VISUAL ANTES DEL MODO MAESTRO */}
        {isMaster && <div className="w-8 h-px bg-slate-800/60 my-2" />}

        {/* ACCESOS EXCLUSIVOS DEL MAESTRO */}
        {isMaster && (
          <Link href="/plans" className={linkClass("/plans", "text-emerald-500")} title="La Forja Maestra">
            <Hammer size={22} />
          </Link>
        )}
      </div>
    </nav>
  );
}