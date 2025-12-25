import { type NextRequest } from 'next/server';

import { NextResponse } from 'next/server';
import { createClient } from './lib/supabase/server';
import { updateSession } from './lib/supabase/middleware';


export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Si la URL incluye /admin, verificar que el usuario esté autenticado y tenga rol válido en el tenant del path
  if (request.url.includes('/editor/workout/create')) {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();
    // Si no hay usuario autenticado, redirigir a login
    if (!user?.user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

  }
  // Llamar a tu función de actualización de sesión (no se modifica)
  return await updateSession(request);
}