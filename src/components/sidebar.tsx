"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ListVideo,
  ShoppingBag,
  BarChart3,
  Hammer,
  BookOpen,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Sidebar() {
  const { user } = useApp();
  const pathname = usePathname();

  const isMaster = user?.email?.toLowerCase() === "jvillaescusam@gmail.com";

  const linkClass = (path: string) => {
    const isActive = pathname === path;
    return `p-2.5 md:p-3 rounded-xl transition-all flex items-center justify-center ${
      isActive
        ? "bg-indigo-50 text-indigo-600 shadow-xs ring-1 ring-indigo-200/70"
        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
    }`;
  };

  return (
    <nav
      className="
        w-full h-14 bg-white border-b border-slate-200 flex flex-row items-center justify-between px-3 shrink-0 z-30
        md:w-16 md:h-full md:border-b-0 md:border-r md:flex-col md:py-6 md:px-0 md:gap-8 md:justify-start
      "
    >
      {/* Logo */}
      <Link
        href="/"
        className="w-9 h-9 md:w-10 md:h-10 bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-xl flex items-center justify-center font-bold text-white text-sm tracking-tight shadow-xs select-none shrink-0"
        title="Guitar Planner"
      >
        GP
      </Link>

      {/* Navegación */}
      <div
        className="
          flex flex-row gap-1 items-center justify-end overflow-x-auto max-w-[calc(100%-3rem)]
          md:overflow-visible md:max-w-none md:flex-col md:gap-3 md:flex-1 md:w-full md:items-center md:justify-start
        "
      >
        <Link href="/" className={linkClass("/")} title="Torre de Control">
          <Home size={20} />
        </Link>

        <Link
          href="/profile"
          className={linkClass("/profile")}
          title="Mi Perfil y Estadísticas"
        >
          <BarChart3 size={20} />
        </Link>

        <Link
          href="/catalog"
          className={linkClass("/catalog")}
          title="Catálogo de Planes"
        >
          <ShoppingBag size={20} />
        </Link>

        <Link
          href="/practice"
          className={linkClass("/practice")}
          title="Sala de Práctica"
        >
          <ListVideo size={20} />
        </Link>

        <Link
          href="/library"
          className={`${linkClass("/library")} hidden md:flex`}
          title="Biblioteca de Consulta"
        >
          <BookOpen size={20} />
        </Link>

        {isMaster && (
          <div className="hidden md:block w-8 h-px bg-slate-200 my-1" />
        )}

        {isMaster && (
          <Link
            href="/plans"
            className={`${linkClass("/plans")} hidden md:flex`}
            title="La Forja Maestra"
          >
            <Hammer size={20} />
          </Link>
        )}
      </div>
    </nav>
  );
}
