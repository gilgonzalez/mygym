import { useEffect } from 'react'
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio'
import * as Speech from 'expo-speech'
import type { SpeechOptions } from 'expo-speech'

// Cues de sesión — puerto de dos cosas que en web viven separadas:
//   - WorkoutExecutionView.tsx: beep de countdown (880 Hz) en los últimos 5s
//     de un ejercicio por tiempo, y beep más agudo al llegar a 0.
//   - ActiveSession.tsx: TTS en español con el nombre + duración/reps.
// En web el TTS corre durante el DESCANSO (anuncia lo que viene). Acá se
// anuncia al COMENZAR el ejercicio, que es el momento en el que el
// dispositivo ya está en la mano y el dato es el de la actividad actual.
//
// Audio: expo-audio (no expo-av, deprecado) con un wav corto generado, no
// un oscilador — RN no tiene Web Audio API. TTS: expo-speech. playsInSilentMode
// porque el switch silencioso del iPhone suele estar on en el gym, y
// mixWithOthers para no cortar la música de fondo.
//
// Los players son de módulo, no del componente: el beep de cierre se dispara
// al terminar el último ejercicio, justo cuando ExecutionView se desmonta.
//
// Voz: Speech.speak() sin `voice` usa la voz default del sistema, que en
// muchos Android es el motor clásico (tipo robot, sin entonación) en vez de
// las voces "Enhanced" que Google TTS ya trae instaladas de fábrica en
// casi todos los dispositivos Android — no es un tema de la librería, es
// que nunca se estaba pidiendo la voz correcta. getAvailableVoicesAsync()
// lista TODAS las voces del dispositivo con su `quality` (Default/Enhanced);
// acá se busca la mejor voz en español disponible y se fija su id, sin
// pagar nada ni depender de red (sigue siendo el motor de TTS del
// dispositivo, solo que se le pide la voz buena en vez de la que toque por
// default). Si el dispositivo no tiene ninguna voz en español, se cae al
// comportamiento de siempre (voz default del sistema).
const countdownBeep = require('../../assets/sounds/beep.wav') as number
const finishBeep = require('../../assets/sounds/beep-finish.wav') as number

const SPEECH_OPTIONS: SpeechOptions = {
  language: 'es-ES',
  pitch: 1,
  rate: 1,
}

let preferredVoiceId: string | null | undefined // undefined = todavía no resuelta
let voiceResolvePromise: Promise<string | null> | null = null

async function resolvePreferredVoice(): Promise<string | null> {
  if (preferredVoiceId !== undefined) return preferredVoiceId
  if (voiceResolvePromise) return voiceResolvePromise

  voiceResolvePromise = (async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync()
      const spanishVoices = voices.filter((voice) => voice.language?.toLowerCase().startsWith('es'))
      if (spanishVoices.length === 0) return null

      const ranked = [...spanishVoices].sort((a, b) => {
        const enhancedA = a.quality === Speech.VoiceQuality.Enhanced ? 1 : 0
        const enhancedB = b.quality === Speech.VoiceQuality.Enhanced ? 1 : 0
        if (enhancedA !== enhancedB) return enhancedB - enhancedA

        // Entre voces de la misma calidad, preferir es-ES (mismo locale que
        // ya se usa en `language` acá abajo) antes que otras variantes
        // (es-US, es-MX, etc.) — cualquiera suena mejor que la default, pero
        // esta mantiene el acento consistente con el resto de los textos.
        const esEsA = a.language?.toLowerCase() === 'es-es' ? 1 : 0
        const esEsB = b.language?.toLowerCase() === 'es-es' ? 1 : 0
        return esEsB - esEsA
      })

      return ranked[0]?.identifier ?? null
    } catch {
      return null
    }
  })()

  preferredVoiceId = await voiceResolvePromise
  return preferredVoiceId
}

export interface CueExercise {
  name: string
  type: string
  duration?: number | null
  reps?: number | null
}

let countdownPlayer: AudioPlayer | null = null
let finishPlayer: AudioPlayer | null = null
let preparePromise: Promise<void> | null = null

async function prepareSessionCues() {
  if (countdownPlayer && finishPlayer) return
  if (preparePromise) {
    await preparePromise
    return
  }

  preparePromise = (async () => {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
      allowsRecording: false,
    })

    if (!countdownPlayer) {
      countdownPlayer = createAudioPlayer(countdownBeep, { keepAudioSessionActive: true })
      countdownPlayer.volume = 0.7
    }
    if (!finishPlayer) {
      finishPlayer = createAudioPlayer(finishBeep, { keepAudioSessionActive: true })
      finishPlayer.volume = 0.85
    }
  })()

  try {
    await preparePromise
  } catch {
    countdownPlayer?.remove()
    finishPlayer?.remove()
    countdownPlayer = null
    finishPlayer = null
    preparePromise = null
  }
}

async function replay(player: AudioPlayer) {
  await player.seekTo(0)
  player.play()
}

export function formatExerciseCue(exercise: CueExercise): string {
  if (exercise.type === 'time') {
    return `${exercise.duration || 0} segundos`
  }

  const cleanReps = String(exercise.reps || 0).replace('/', ' por ')

  if (exercise.type === 'emom') {
    return `${cleanReps} repeticiones en ${exercise.duration || 60} segundos`
  }

  return `${cleanReps} repeticiones`
}

export function stopSpeaking() {
  void Speech.stop()
}

export function announceExercise(exercise: CueExercise, options?: { set?: number; totalSets?: number }) {
  const details = formatExerciseCue(exercise)
  const parts = [exercise.name.trim() || 'Siguiente ejercicio']

  if (options && (options.totalSets ?? 1) > 1 && options.set) {
    parts.push(`Serie ${options.set}`)
  }

  if (details) parts.push(details)

  const text = `${parts.join('. ')}.`

  void Promise.all([Speech.stop().catch(() => undefined), resolvePreferredVoice()]).then(([, voiceId]) => {
    Speech.speak(text, voiceId ? { ...SPEECH_OPTIONS, voice: voiceId } : SPEECH_OPTIONS)
  })
}

export function playCountdownBeep() {
  void prepareSessionCues()
    .then(() => (countdownPlayer ? replay(countdownPlayer) : undefined))
    .catch(() => undefined)
}

export function playFinishBeep() {
  void Speech.stop()
  void prepareSessionCues()
    .then(() => (finishPlayer ? replay(finishPlayer) : undefined))
    .catch(() => undefined)
}

export function useSessionCues() {
  useEffect(() => {
    void prepareSessionCues()
    // Precalienta la resolución de la voz acá para que el primer
    // announceExercise() de la sesión ya la tenga lista, en vez de esperar
    // a resolverla recién en el primer llamado.
    void resolvePreferredVoice()
    return () => {
      void Speech.stop()
    }
  }, [])
}
