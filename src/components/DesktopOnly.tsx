'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '../hooks/useIsMobile';

export default function DesktopOnly({
  children,
  label = 'Esta sección',
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const isMobile = useIsMobile();
  const router = useRouter();

  useEffect(() => {
    if (isMobile) router.replace('/');
  }, [isMobile, router]);

  if (isMobile) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center bg-slate-900 p-8 text-center">
        <div className="max-w-xs space-y-3">
          <span className="text-3xl block">🖥️</span>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-200">
            Solo disponible en escritorio
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-relaxed">
            {label} no está disponible en la versión móvil. Abre Guitar Planner en un ordenador o tablet en horizontal.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
