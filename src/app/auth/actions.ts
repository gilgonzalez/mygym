'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'



// Función para iniciar sesión con proveedores externos
export const signInWithProvider = async (provider: "google" | "github") => {
  const headersList = headers();
  const referer = (await headersList).get("referer") ?? "";
  const url = new URL(referer);
  const redirectParam = url.searchParams.get("redirect");

  // Determine the base URL dynamically
  let siteUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
  
  // Ensure protocol
  if (!siteUrl.startsWith('http')) {
    siteUrl = `https://${siteUrl}`;
  }
  
  // Remove trailing slash
  if (siteUrl.endsWith('/')) {
    siteUrl = siteUrl.slice(0, -1);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${siteUrl}/auth/callback${redirectParam ? '?redirect=' + redirectParam : ''}`, // URL dinámica y robusta
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

