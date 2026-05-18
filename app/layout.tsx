import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "../src/context/AppContext";
import Sidebar from "../src/components/sidebar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Guitar Planner",
  description: "Tu entrenador personal de guitarra",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full w-full flex bg-gray-950 overflow-hidden">
        <AppProvider>
          {/* NUESTRA NUEVA BARRA LATERAL INTELIGENTE */}
          <Sidebar />

          {/* CONTENEDOR DE PÁGINA */}
          <main className="flex-1 h-full overflow-y-auto min-w-0">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}