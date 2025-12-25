'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
type credentials = {
  email : string,
  password: string
}


// Función para iniciar sesión con proveedores externos
export const signInWithProvider = async (provider: "google" | "github") => {
  const headersList = headers();
  const referer = (await headersList).get("referer") ?? "";
  const url = new URL(referer);
  const redirectParam = url.searchParams.get("redirect");

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback${redirectParam ? '?redirect=' + redirectParam : ''}`, // IMPORTANTE: URL correcta
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data?.url; 
  } catch (error) {
    console.error("Error during OAuth authentication:", error);
    throw new Error("Authentication failed.");
  }
};

