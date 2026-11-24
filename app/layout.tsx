import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "../src/context/AppContext";
import Sidebar from "../src/components/sidebar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Guitar Planner",
  description: "Tu entrenador personal de guitarra",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Guitar Planner",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="h-full w-full flex flex-col md:flex-row bg-slate-50 text-slate-900 overflow-hidden">
        <AppProvider>
          <Sidebar />
          <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
