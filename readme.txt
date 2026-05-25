🎯 Propósito del Proyecto
Aplicación web (PWA) diseñada para guitarristas que necesitan gestionar una biblioteca masiva de ejercicios (PDFs) y transformar esa marabunta en planes de estudio estructurados y trackeables.

🛠️ Pilares Funcionales
Explorador de Biblioteca: Filtrado inteligente de ejercicios por técnica, nivel y duración.

Constructor de Rutinas: Creación de planes personalizados y asignación maestro → alumno.

Persistencia en Cloud: Los planes y el progreso se almacenan en Firebase (Auth + Firestore).

Tracker de Rendimiento: Registro de velocidad (BPM), XP, calendario de consistencia.

📂 Estructura actual (Next.js App Router)
/guitar-planner
├── app/                 # Páginas: /, /practice, /library, /catalog, /plans, /profile
├── public/pdfs/         # Partituras PDF
├── src/
│   ├── context/         # AppContext.tsx (estado global + auth)
│   ├── components/      # sidebar, SessionInspector, etc.
│   ├── data/            # exercises.json, presets.ts
│   └── lib/             # firebase.ts
├── .env.local           # Credenciales Firebase (NO subir a git)
└── README.md

🔐 Configuración Firebase
Las claves van en .env.local, no en este archivo. Variables requeridas:

  NEXT_PUBLIC_FIREBASE_API_KEY=
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
  NEXT_PUBLIC_FIREBASE_APP_ID=

Copia los valores desde la consola de Firebase: Project settings → Your apps → Web app.

🚀 Comandos útiles
  npm install
  npm run dev
  npm run build

Despliegue (CLI):
  npm install -g firebase-tools
  firebase login
  firebase init
  firebase deploy

🗄️ Firestore (colecciones)
- users: { uid, email, role, createdAt }
- routines: { id, name, exercises, userId, isPublic, assignedTo }
- sessions: calendario de práctica (bpm, status, exerciseStats, userId, assignedBy)
- presets: planes multiday (durationDays, days[])

📺 Vistas principales
- app/page.tsx — Torre de Control (calendario + agenda)
- app/practice/page.tsx — Sala de práctica (metrónomo, PDF, BPM)
- app/library/page.tsx — Biblioteca de ejercicios
- app/catalog/page.tsx — Escaparate (rutinas/planes públicos)
- app/plans/page.tsx — La Forja Maestra (solo profesor)
- app/profile/page.tsx — Analítica y rangos XP
