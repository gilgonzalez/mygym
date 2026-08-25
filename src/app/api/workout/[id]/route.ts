import { NextResponse } from 'next/server'
import { getRequestContext } from '@/lib/supabase/requestUser'
import { deleteWorkoutForUser } from '@/lib/workout/deleteWorkout'

// Contraparte de deleteWorkoutAction (Server Action, solo la web puede
// invocarla) para mobile, que no tiene forma de llamar una Server Action de
// Next directo — necesita un endpoint HTTP normal, igual que /api/upload
// (mismo esquema cookie-o-bearer, ver getRequestContext). Borrar un workout
// necesita pasar por el server sí o sí porque limpia también el archivo de
// portada en R2 (ver deleteWorkoutForUser) y mobile no tiene esas
// credenciales — antes ni mobile ni la web limpiaban R2 al borrar.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const workoutId = params.id
    if (!workoutId) {
      return NextResponse.json({ error: 'Falta el id del workout' }, { status: 400 })
    }

    const ctx = await getRequestContext(request)
    if (!ctx) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await deleteWorkoutForUser(ctx.supabase, workoutId, ctx.userId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting workout:', error)
    return NextResponse.json({ error: error?.message || 'No se pudo borrar el workout' }, { status: 500 })
  }
}
