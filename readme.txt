🎯 Propósito del Proyecto
Aplicación web (PWA) diseñada para guitarristas que necesitan gestionar una biblioteca masiva de ejercicios (PDFs) y transformar esa marabunta en planes de estudio estructurados y trackeables.

🛠️ Pilares Funcionales
Explorador de Biblioteca: Filtrado inteligente de +800 ejercicios por técnica (primaria/secundaria), nivel y duración.

Constructor de Rutinas: Creación de planes personalizados o generación automática según tiempo disponible.

Persistencia en Cloud: Los planes y el progreso se almacenan en el Google Drive del usuario (formato JSON).

Tracker de Rendimiento: Registro de velocidad (BPM) y calendario de consistencia.

📂 Propuesta de Estructura de Archivos
Plaintext
/guitar-app
├── /public              # Archivos estáticos (iconos, logo)
├── /src
│   ├── /assets          # Estilos globales (Tailwind/CSS)
│   ├── /components      # Piezas de la interfaz (reutilizables)
│   │   ├── ExerciseCard.jsx   # Visualización individual de cada ejercicio
│   │   ├── FilterBar.jsx      # Los selectores de técnica, nivel, etc.
│   │   ├── PlanEditor.jsx     # Herramienta para añadir/quitar ejercicios
│   │   └── Tracker.jsx        # El input de BPM y el cronómetro
│   │
│   ├── /context         # Gestión del estado global (Auth y Datos)
│   │   └── AuthContext.js     # Estado de la conexión con Google Drive
│   │
│   ├── /data            # El "corazón" de la información
│   │   └── exercises.json     # La base de datos de los 800 ejercicios (lectura)
│   │
│   ├── /hooks           # Lógica extraída para limpieza del código
│   │   └── useDriveAPI.js     # Hook personalizado para leer/escribir en Drive
│   │
│   ├── /services        # Comunicación con el exterior
│   │   └── googleDrive.js     # Configuración de la API de Google (Auth/Picker)
│   │
│   ├── /views           # Las páginas principales de la app
│   │   ├── Library.jsx        # Vista de exploración de la marabunta
│   │   ├── Dashboard.jsx      # Vista principal con el plan del día
│   │   └── Statistics.jsx     # Calendario y evolución de BPMs
│   │
│   ├── App.js           # Enrutador y estructura base
│   └── index.js         # Punto de entrada
├── .env                 # Claves de API (Google Client ID, etc.)
└── README.md            # (Este archivo)
🏗️ Responsabilidades por Módulo
exercises.json: Es el índice maestro. Contiene la ruta al PDF, nombre, técnica 1, técnica 2, nivel y duración. Es la referencia para todos los filtros.

googleDrive.js: Se encarga del "apretón de manos" con Google. Maneja los permisos para que la app pueda crear una carpeta llamada /GuitarApp_Data en tu Drive y guardar ahí tus planes.

useDriveAPI.js: Este archivo será el encargado de que, cada vez que abras la app, vaya al Drive, busque si hay un plan guardado y lo traiga a la interfaz.

PlanEditor.jsx: Su única misión es permitirte "jugar" con la lista: subir un ejercicio, bajar otro o borrarlo antes de guardar el plan definitivo.

Tracker.jsx: Es el componente de "acción". Cuando estás tocando, este componente guarda tu récord de BPM y lo envía al archivo de progreso en la nube.




npm install firebase


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-CV-WE1rngBJViQgEWt9T8rh_tzypqn0",
  authDomain: "guitar-planner-eb672.firebaseapp.com",
  projectId: "guitar-planner-eb672",
  storageBucket: "guitar-planner-eb672.firebasestorage.app",
  messagingSenderId: "735573766761",
  appId: "1:735573766761:web:6fda58aa2c519afb8f68f8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);



¿este es el código que hay que guardar?


npm install -g firebase-tools

firebase login
firebase init
firebase deploy


Hola. Vamos a continuar desarrollando mi aplicación "Guitar Planner". Para ponerte en contexto rápidamente y que estemos totalmente alineados, aquí tienes el estado actual del proyecto, la arquitectura y los últimos cambios críticos que dejamos funcionando anoche:

### 🚀 Tech Stack
- Next.js (App Router), TypeScript, Tailwind CSS.
- Backend: Firebase (Authentication y Firestore Database).

### 🧠 El Cerebro Global (`src/context/AppContext.tsx`)
- Centraliza todo el estado. Al hacer login (`onAuthStateChanged`), ejecuta descargas estáticas mediante `getDocs`.
- Maneja tres estados clave recuperados de la nube:
  1. `sessionHistory`: El historial del calendario de prácticas del alumno.
  2. `savedRoutines`: Descarga cruzada en paralelo (`Promise.all`) que une las rutinas propias (`userId`), las globales de la academia (`isPublic: true`) y las asignadas específicamente a ese usuario (`assignedTo == uid`).
  3. `students`: Un directorio extraído de la colección `users` de Firestore. Solo se descarga si el usuario logueado coincide exactamente con el email del profesor (`maestro@guitarra.com` o similar).

### 🗄️ Estructura en Firestore (Colecciones)
- `users`: Documentos con ID igual al UID del Auth. Campos: `{ uid: string, email: string }`.
- `routines`: Planes de estudio guardados. Campos: `{ id, name, exercises: [], userId, isPublic: boolean, assignedTo: string | null }`.
- `sessions`: Registros de entrenamientos en el calendario (`bpm`, `status: "Acabada" | "Inacabada"`, fecha, etc.).

### 📺 Vistas Principales
1. `app/page.tsx` (Dashboard / Torre de Control):
   - Muestra el calendario mensual y la agenda del día.
   - Contiene el **"Catálogo de Rutinas" combinado**. Pinta los `FACTORY_PRESETS` locales y mapea encima las `savedRoutines` de la nube con bordes ámbar distintivos según su visibilidad. El contenedor tiene scroll interno para no romper el layout visual.
2. `app/library/page.tsx` (Biblioteca):
   - Filtra los ejercicios del JSON local (`exercises.json`) por técnica y texto.
   - Si eres Maestro, activa el *Constructor de Planes* (carrito lateral) para empaquetar ejercicios, nombrar la rutina y elegir en un selector si será "Pública" o para un "Alumno" específico de la lista.

### 🏁 Último Hito Conseguido
- Corregido un problema visual (CSS overflow/max-height) que ocultaba las rutinas de la nube en el catálogo del Dashboard.
- Corregido el flujo de errores de registro en el AuthScreen para que Firebase notifique correctamente si un email ya está duplicado en lugar de dar un falso error de contraseña corta.
- Todo el sistema de base de datos, mapeos y sincronización multiusuario (Profesor -> Alumno) quedó verificado y funcionando al 100%.

Dime que has comprendido el contexto y la estructura y pregúntame con qué pieza o funcionalidad nos ponemos a trabajar hoy.
