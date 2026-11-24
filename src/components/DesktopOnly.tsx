"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Monitor } from "lucide-react";
import { useIsMobile } from "../hooks/useIsMobile";

export default function DesktopOnly({
  children,
  label = "Esta sección",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const isMobile = useIsMobile();
  const router = useRouter();

  useEffect(() => {
    if (isMobile) router.replace("/");
  }, [isMobile, router]);

  if (isMobile) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center bg-slate-50 p-8 text-center">
        <div className="max-w-xs space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <Monitor size={24} />
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            Solo disponible en escritorio
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {label} no está disponible en móvil. Abre Guitar Planner en un
            ordenador o tablet en horizontal.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
