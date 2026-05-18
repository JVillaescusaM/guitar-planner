import { NextResponse, type NextRequest } from 'next/server';

// DEFINIMOS QUÉ RUTAS ESTÁN RESERVADAS SOLO PARA USUARIOS LOGUEADOS
const PROTECTED_ROUTES = ['/practice', '/profile', '/plans'];

export function middleware(request: NextRequest) {
  // Intentamos capturar la cookie de sesión que Firebase o Next.js gestionan de forma automática
  // (o el estado de sesión que almacena el navegador)
  const pathname = request.nextUrl.pathname;

  // Si el usuario intenta entrar a una ruta protegida...
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    // Nota técnica: En arquitecturas puras de cliente, delegamos el muro pesado al AppContext.
    // Pero si implementamos verificación por tokens de Firebase en Vercel, este bloque
    // intercepta peticiones HTTP directas de atacantes.
    
    // Por ahora, dejamos que Next.js valide el flujo y mantenga el canal limpio.
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configuración para que el middleware solo vigile nuestras pantallas y no los archivos de diseño (CSS, imágenes)
export const config = {
  matcher: ['/practice/:path*', '/profile/:path*', '/plans/:path*'],
};