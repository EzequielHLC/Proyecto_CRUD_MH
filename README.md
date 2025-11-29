# Monster Hunter Quest Planner (Gremio de Cazadores)

Aplicación To‑Do gamificada inspirada en Monster Hunter World. Permite administrar tareas (misiones de cacería), subir de Rango de Cazador (HR), y sincronizar el progreso entre dispositivos mediante un ID de Cazador. Utiliza Firebase para backend (Autenticación y Firestore) y está construida con React + Vite.

- Pulikoski, Mauricio
- Lovera, Hernán
- Fernández, Lautaro

---

## Características principales

- Crear, editar y eliminar tareas (misiones diarias, objetivos).
- Marcar tareas como completadas y contabilización de puntos para subir HR.
- Sincronización en la nube por jugador mediante un ID de Cazador (sincronización entre dispositivos).
- Iconos de monstruos y UI con lucide‑react y API pública de monstruos.
- Autenticación (Anonymous) para una experiencia sin fricción; opcionalmente se puede conectar con providers de Firebase.
- Soporte para web y empaquetado móvil con Capacitor (Android).

---

## Tecnologías y Librerías

- React + Vite
- JavaScript (ES6+)
- Firebase (Authentication + Firestore)
- Tailwind CSS
- lucide‑react (Iconos UI)
- Integración de iconos de monstruos vía API externa (RoboMechE / MHW-Database)
- Capacitor (opcional: Android)

---

## Requisitos previos

- Node.js (LTS) — https://nodejs.org/
- npm (incluido con Node.js)
- Visual Studio Code (recomendado)
- Cuenta Google para Firebase
- Android Studio (opcional, para la versión Android)

---

## Video de Muestra

[![Monster Hunter Quest Planner - Tutorial](https://img.youtube.com/vi/CnX5-saWQ6I/0.jpg)](https://youtu.be/CnX5-saWQ6I)

---

## Instalación y configuración — Web (development)

1. Clonar el repo y entrar en la carpeta:
```bash
git clone <repo-url>
cd mh-planner
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar Tailwind (ya incluido en el proyecto; si quieres comprobarlo):
- `tailwind.config.js` debe contener las rutas `./index.html` y `./src/**/*.{js,ts,jsx,tsx}`
- `postcss.config.js` debería exportar plugins `tailwindcss` y `autoprefixer`
- `src/index.css` debe incluir `@tailwind base`, `@tailwind components`, `@tailwind utilities`

4. Configurar Firebase:
- Crea un proyecto en https://console.firebase.google.com/
- Habilita Firestore y Authentication (method: Anonymous o Google)
- Añade una web app en Firebase Console y copia el objeto de configuración (apiKey, projectId, authDomain, etc.)
- Opciones para colocar la configuración:
  - Reemplaza el `firebaseConfig` en `src/App.jsx` (o en `src/firebase.js` si existe)
  - O crea variables de entorno Vite en `.env.local`:
    ```
    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_PROJECT_ID=...
    VITE_FIREBASE_STORAGE_BUCKET=...
    VITE_FIREBASE_MESSAGING_SENDER_ID=...
    VITE_FIREBASE_APP_ID=...
    ```
    y usa `import.meta.env.VITE_FIREBASE_API_KEY` en el archivo de configuración.
- Reglas de Firestore recomendadas para desarrollo:
  ```
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```
  Para producción, restringe por UID/collections/roles apropiadamente.

5. Ejecutar en desarrollo:
```bash
npm run dev
# Abre http://localhost:5173 (u otra URL que Vite muestre)
```

6. Scripts útiles (verifica `package.json`):
- `npm run dev` — inicia servidor Vite de desarrollo
- `npm run build` — construye la app para producción
- `npm run preview` — vista previa del build de producción

---

## Cómo usar la aplicación (resumen)

- En la pantalla principal puedes:
  - Crear misiones (título, descripción, puntos asociadas, etiquetas, icono de monstruo)
  - Marcar misiones como completadas para ganar puntos de experiencia
  - Visualizar progreso global y subir tu Rango de Cazador (HR)
- Compartir tu ID de Cazador para sincronizar data entre dispositivos (requiere autenticación en Firebase)

---

## Estructura de proyecto (resumen)

- public/ — activos públicos
- src/
  - main.jsx — entrypoint React
  - App.jsx — configuración Firebase + rutas principales
  - index.css / App.css — estilos (Tailwind)
  - components/ — componentes UI reutilizables
  - pages/ — pantallas principales (dashboard, settings...)
  - assets/ — imágenes y iconos del proyecto

---

## Android usando Capacitor (opcional)

1. Instala Capacitor:
```bash
npm install @capacitor/core
npm install -D @capacitor/cli
```

2. Inicializa Capacitor (elige `dist` cuando pregunte por web asset dir):
```bash
npx cap init "MH Planner" com.example.mhplanner
npm install @capacitor/android
npx cap add android
```

3. Compila y sincroniza:
```bash
npm run build
npx cap sync android
npx cap open android  # abrir en Android Studio
```

4. Desde Android Studio compila y ejecuta en un emulador o dispositivo.

---

## Recomendaciones y buenas prácticas

- No subas tus credenciales de Firebase a un repo público. Usa `.env.local` y añade `.env*` en `.gitignore`.
- Gastos de lectura/escritura en Firestore: usa índices y reglas para limitar operaciones masivas.
- Si vas a usar más proveedores de auth, añade roles/UID checks en reglas de Firestore.

---

## Contribuir

- Abre una issue para sugerencias o bugs.
- Crea branches con feature/bugfix y abre un PR con descripción clara y pasos para reproducir/validar.
- Mantén las PR pequeñas y añade tests o notas si cambias reglas/estructuras de datos.

---

## Problemas comunes

- Pantalla en blanco: verifica errores en la consola del navegador y que las importaciones estén bien.
- Firebase: permisos insuficientes → revisa las reglas y que Authentication esté habilitado.
- Tailwind: errores de PostCSS → revisa `postcss.config.js` y `tailwind.config.js`.

---

## Licencia y notas legales

- El proyecto es un fan‑project educativo. Activos y propiedad intelectual pertenecen a Capcom u otros propietarios.
- No usar con fines comerciales ni distribuir assets sin permiso.

---

## Contacto / Créditos

- Proyecto desarrollado como ejercicio/ejemplo.
- Si quieres contribuir o necesitas ayuda, abre una issue en el repositorio.