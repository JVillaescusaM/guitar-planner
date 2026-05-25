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

  // Función limpia para iluminar el icono de la página activa (Se adapta automáticamente a PC o Móvil)
  const linkClass = (path: string, activeColor: string = "text-blue-500") => {
    const isActive = pathname === path;
    return `p-2.5 md:p-3 rounded-xl transition-all hover:bg-slate-800/60 flex items-center justify-center ${
      isActive ? `${activeColor} bg-slate-800/40 shadow-sm` : "text-slate-500 hover:text-slate-200"
    }`;
  };

  return (
    <nav className="
      /* 📱 COMPORTAMIENTO MÓVIL (Por defecto): Barra superior horizontal */
      w-full h-14 bg-black border-b border-gray-800 flex flex-row items-center justify-between px-4 shrink-0 z-30
      
      /* 🖥️ COMPORTAMIENTO PC (A partir de md: 768px): Se transforma en barra lateral izquierda */
      md:w-16 md:h-full md:border-b-0 md:border-r md:flex-col md:py-8 md:px-0 md:gap-10 md:justify-start
    ">
      
      {/* LOGO (En PC va arriba; en móvil se queda a la izquierda de la barra superior) */}
      <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-xs tracking-tighter shadow-lg shadow-blue-600/20 select-none shrink-0">
        GP
      </div>

      {/* ENLACES DE NAVEGACIÓN */}
      <div className="
        /* 📱 En móvil: Fila horizontal compacta a la derecha */
        flex flex-row gap-2 items-center justify-end
        
        /* 🖥️ En PC: Columna vertical que ocupa el centro del sidebar */
        md:flex-col md:gap-5 md:flex-1 md:w-full md:items-center md:justify-start
      ">
        <Link href="/" className={linkClass("/", "text-blue-500")} title="Torre de Control">
          <Home size={20} className="md:w-[22px] md:h-[22px]" />
        </Link>

        <Link href="/profile" className={linkClass("/profile", "text-amber-500")} title="Mi Perfil y Estadísticas">
          <BarChart3 size={20} className="md:w-[22px] md:h-[22px]" />
        </Link>

        {/* 🌟 ¡CATÁLOGO LIBERADO! Visible en móvil y PC por igual */}
        <Link href="/catalog" className={linkClass("/catalog", "text-purple-500")} title="Catálogo de Planes">
          <ShoppingBag size={20} className="md:w-[22px] md:h-[22px]" />
        </Link>
      
        <Link href="/practice" className={linkClass("/practice", "text-sky-500")} title="Sala de Práctica">
          <ListVideo size={20} className="md:w-[22px] md:h-[22px]" />
        </Link>
        
        {/* La Biblioteca pesada se mantiene oculta en móvil para aligerar la interfaz */}
        <Link href="/library" className={`${linkClass("/library", "text-sky-500")} hidden md:flex`} title="Biblioteca de Consulta">
          <BookOpen size={22} />
        </Link>

        {/* SEPARADOR VISUAL ANTES DEL MODO MAESTRO (Solo tiene sentido en el orden vertical de PC) */}
        {isMaster && <div className="hidden md:block w-8 h-px bg-slate-800/60 my-2" />}

        {/* ACCESOS EXCLUSIVOS DEL MAESTRO */}
        {isMaster && (
          <Link href="/plans" className={`${linkClass("/plans", "text-emerald-500")} hidden md:flex`} title="La Forja Maestra">
            <Hammer size={22} />
          </Link>
        )}
      </div>
    </nav>
  );
}