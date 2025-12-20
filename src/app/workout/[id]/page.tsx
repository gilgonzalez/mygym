'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WorkoutOverview } from '@/components/workout/WorkoutOverview'
import { ActiveSession } from '@/components/workout/ActiveSession'
import { WorkoutCompleted } from '@/components/workout/WorkoutCompleted'
import { LocalWorkout } from '@/types/workout/viewTypes'
import { useWorkoutStore } from '@/store/workOutStore'

export default function WorkoutSessionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  
  // Zustand Store
  const { 
    activeWorkout, 
    hasStarted, 
    isCompleted, 
    currentSectionIndex, 
    currentExerciseIndex, 
    currentSet,
    isResting,
    initializeWorkout,
    startSession,
    endSession,
    nextStep,
    restartWorkout,
    jumpToStep
  } = useWorkoutStore()
  
  // Mock Data (Ideally this would come from an API or separate data file)
  const workout: LocalWorkout = {
    id: params.id,
    title: "RUTINA DE CALISTENIA – FULL BODY",
    cover: "https://i.ytimg.com/vi/kuUZYUBHryw/maxresdefault.jpg",
    audio: [
      "https://www.youtube.com/watch?v=JYNa_9pYLGw&list=RDJYNa_9pYLGw"
    ],
    description: "Duración aproximada: 65–75 minutos. Rutina de volumen ajustado.",  
    sections: [
      {
        id: "s1",
        name: "CALENTAMIENTO - Movilidad General",
        orderType: 'linear',
        exercises: [
          {
            id: "e1",
            name: "Movilidad de cuello",
            type: "reps",
            reps: "5-6/lado",
            sets: 1,
            rest: 0,
            media_url: "https://youtu.be/8tyO0ti6NL0?t=153",
            description: "Inclina la cabeza hacia un lado, luego mira al pecho y después al techo. Movimiento lento."
          },
          {
            id: "e2",
            name: "Movilidad de hombros",
            type: "reps",
            reps: "20 atrás + 20 delante",
            sets: 1,
            rest: 0,
            media_url: "https://image.jimcdn.com/app/cms/image/transf/dimension=576x10000:format=gif/path/s923ec5ea63585e73/image/icf2c7678ae698924/version/1620061742/image.gif",
            description: "Brazos relajados a los lados. Haz círculos grandes hacia atrás y luego hacia delante."
          },
          {
            id: "e3",
            name: "Movilidad de columna (gato–vaca)",
            type: "reps",
            reps: "10-12",
            sets: 1,
            rest: 0,
            media_url: "https://www.shutterstock.com/image-vector/woman-doing-cat-cow-workout-260nw-1280135659.jpg",
            description: "A cuatro apoyos. Inhala arqueando la espalda, exhala redondeando."
          },
          {
            id: "e4",
            name: "Movilidad de cadera",
            type: "time",
            duration: 60,
            sets: 1,
            rest: 0,
            media_url: "https://fitenium.com/wp-content/uploads/2021/03/18471301-Hip-Circles-Stretch_Hips_180.gif",
            description: "Realiza círculos amplios con la cadera. 30 segundos en cada sentido."
          },
          {
            id: "e5",
            name: "Movilidad de rodillas y tobillos",
            type: "reps",
            reps: "10/dir",
            sets: 1,
            rest: 0,
            media_url: "https://live.staticflickr.com/5185/5569522342_ff7b68c743.jpg",
            description: "Círculos suaves con rodillas juntas y tobillos elevados."
          },
          {
            id: "e6",
            name: "Sentadilla profunda dinámica",
            type: "reps",
            reps: "8-10",
            sets: 2,
            rest: 30,
            media_url: "https://i.pinimg.com/originals/47/1f/79/471f7949505154f391540967bd5a4388.gif",
            description: "Baja a sentadilla profunda, mantén 2 segundos y sube."
          }
        ]
      },
      {
        id: "s2",
        name: "CALENTAMIENTO - Activación",
        orderType: 'single',
        exercises: [
          {
            id: "e7",
            name: "Band pull-aparts",
            type: "reps",
            reps: "12-15",
            sets: 2,
            rest: 45,
            media_url: "https://www.strengthlog.com/wp-content/uploads/2020/04/Band-Pull-Apart.gif",
            description: "Brazos estirados, abre la banda separando las manos."
          },
          {
            id: "e8",
            name: "Puente de glúteo",
            type: "reps",
            reps: "10-12",
            sets: 2,
            rest: 45,
            media_url: "https://static.wixstatic.com/media/c94d75_0c29504633494d29a610ccc979695020~mv2.gif",
            description: "Eleva la cadera apretando glúteos."
          },
          {
            id: "e9",
            name: "Flexiones inclinadas en banco",
            type: "reps",
            reps: "8",
            sets: 2,
            rest: 45,
            media_url: "https://i.pinimg.com/originals/9d/91/7e/9d917e70d9aa18896ae66ff5d1739419.gif",
            description: "Manos en el banco, cuerpo alineado, baja el pecho."
          },
          {
            id: "e10",
            name: "Dead bug",
            type: "reps",
            reps: "8/lado",
            sets: 2,
            rest: 45,
            media_url: "https://www.verywellfit.com/thmb/MHZjRAV_-B8M38m5mHnX75EmA1c=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/105-Dead-Bug-ExerciseGIF-407d0bbb6d8742be855b219e74c18bd0.gif",
            description: "Tumbado boca arriba, extiende brazo y pierna contraria."
          }
        ]
      },
      {
        id: "s3",
        name: "BLOQUE A – TIRÓN",
        orderType: 'single',
        exercises: [
          {
            id: "e11",
            name: "Dominadas pronas",
            type: "reps",
            reps: "3-5",
            sets: 4,
            rest: 90,
            media_url: "https://wefit.es/library/exercises/pull-ups-dominada.gif",
            description: "Sube llevando el pecho a la barra. Baja lento."
          },
          {
            id: "e12",
            name: "Remo invertido",
            type: "reps",
            reps: "8-10",
            sets: 3,
            rest: 90,
            media_url: "https://hips.hearstapps.com/hmg-prod/images/workouts/2016/03/invertedrow-1457101739.gif?resize=980:*",
            description: "Cuerpo recto bajo barra baja, tira del pecho hacia la barra."
          }
        ]
      },
      {
        id: "s4",
        name: "BLOQUE B – EMPUJE",
        orderType: 'single',
        exercises: [
          {
            id: "e13",
            name: "Fondos en paralelas",
            type: "reps",
            reps: "6-8",
            sets: 3,
            rest: 90,
            media_url: "https://i.makeagif.com/media/1-18-2016/ktp4my.gif",
            description: "Baja controlando con ligera inclinación, empuja hasta extender."
          },
          {
            id: "e14",
            name: "Flexiones en banco",
            type: "reps",
            reps: "8-12",
            sets: 3,
            rest: 90,
            media_url: "https://i.makeagif.com/media/10-01-2017/iwdrrC.gif",
            description: "Manos en banco, cuerpo alineado, pecho al borde."
          }
        ]
      },
      {
        id: "s5",
        name: "BLOQUE C – PIERNAS",
        orderType: 'single',
        exercises: [
          {
            id: "e15",
            name: "Sentadilla búlgara",
            type: "reps",
            reps: "6-8/pierna",
            sets: 3,
            rest: 90,
            media_url: "https://static.wixstatic.com/media/c94d75_474f468bbe954444ac19711721df217f~mv2.gif",
            description: "Pie trasero en banco, baja con pierna delantera."
          },
          {
            id: "e16",
            name: "Step-ups al banco",
            type: "reps",
            reps: "8/pierna",
            sets: 3,
            rest: 90,
            media_url: "https://www.clinicacemes.com/wp-content/uploads/2020/04/chair_steps.gif",
            description: "Sube empujando con el pie sobre el banco."
          },
          {
            id: "e17",
            name: "Elevaciones de gemelo",
            type: "reps",
            reps: "12-15",
            sets: 3,
            rest: 90,
            media_url: "https://hips.hearstapps.com/hmg-prod/images/eccentric-single-leg-calf-raise-calf-stretching-0028-652ef00e9074b.gif?crop=0.99975xw:1xh;center,top&resize=980:*",
            description: "Eleva talones lentamente y baja controlando."
          }
        ]
      },
      {
        id: "s6",
        name: "BLOQUE D – CORE",
        orderType: 'single',
        exercises: [
          {
            id: "e18",
            name: "Plancha frontal",
            type: "time",
            duration: 30,
            sets: 3,
            rest: 60,
            media_url: "https://www.murciaclubdetenis.es/wp-content/uploads/2020/03/plancha.gif",
            description: "Antebrazos en suelo, cuerpo recto, abdomen tenso."
          },
          {
            id: "e19",
            name: "Elevaciones de rodillas",
            type: "reps",
            reps: "6-10",
            sets: 3,
            rest: 60,
            media_url: "https://www.entrenador.fit/wp-content/uploads/Levantamiento-de-rodillas.gif",
            description: "Colgado, eleva rodillas al pecho."
          },
          {
            id: "e20",
            name: "Pallof press con banda",
            type: "reps",
            reps: "8-10/lado",
            sets: 3,
            rest: 60,
            media_url: "https://i.makeagif.com/media/10-01-2014/XREki3.gif",
            description: "Extiende brazos al frente manteniendo estabilidad lateral."
          }
        ]
      },
      {
        id: "s7",
        name: "VUELTA A LA CALMA",
        orderType: 'linear',
        exercises: [
          {
            id: "e21",
            name: "Colgado pasivo",
            type: "time",
            duration: 60,
            sets: 1,
            rest: 0,
            media_url: "https://wefit.es/wp-content/uploads/2024/03/archer-pull-up.gif",
            description: "Simplemente cuélgate de la barra y relaja la espalda."
          },
          {
            id: "e22",
            name: "Estiramiento pecho/hombros",
            type: "time",
            duration: 90,
            sets: 1,
            rest: 0,
            media_url: "https://jlfisios.com/wp-content/uploads/2023/01/Estiramiento-pectoral-en-pared.jpg",
            description: "Estira pectorales y deltoides suavemente."
          },
          {
            id: "e23",
            name: "Isquiotibiales y glúteos",
            type: "time",
            duration: 150,
            sets: 1,
            rest: 0,
            media_url: "https://www.healthline.com/hlcmsresource/images/topic_centers/Fitness-Exercise/400x400_10_Essential_Stretches_For_Runners_Hamstring.gif",
            description: "Estiramientos profundos para la cadena posterior."
          },
          {
            id: "e24",
            name: "Cadera y psoas",
            type: "time",
            duration: 120,
            sets: 1,
            rest: 0,
            media_url: "https://www.hsnstore.com/blog/wp-content/uploads/2013/08/psoas-retroversion-extension.gif",
            description: "Estira los flexores de cadera."
          },
          {
            id: "e25",
            name: "Respiración profunda",
            type: "time",
            duration: 120,
            sets: 1,
            rest: 0,
            media_url: "https://i.gifer.com/9FkX.gif",
            description: "Relajación final, inhala y exhala profundamente."
          }
        ]
      }
    ]
  }

  useEffect(() => {
    // Only initialize if it's a new workout or no workout is loaded
    if (activeWorkout?.id !== workout.id) {
      initializeWorkout(workout)
    }
  }, [params.id])

  // Helper to determine if we have a session in progress
  const hasActiveSession = activeWorkout?.id === workout.id && (currentSectionIndex > 0 || currentExerciseIndex > 0 || isResting)

  // Render Logic
  if (!activeWorkout) return <div>Loading...</div>

  // 1. Completion View
  if (isCompleted) {
    return (
      <WorkoutCompleted 
        workout={activeWorkout} 
        onRestart={restartWorkout} 
      />
    )
  }

  // 2. Intro View
  if (!hasStarted) {
    return (
      <WorkoutOverview 
        workout={activeWorkout}
        onStart={restartWorkout}
        onResume={startSession}
        onBack={() => router.push('/')}
        hasActiveSession={hasActiveSession}
        onExerciseClick={jumpToStep}
      />
    )
  }

  // 3. Active Session View
  return (
    <>
      <ActiveSession 
        workout={activeWorkout}
        currentSectionIndex={currentSectionIndex}
        currentExerciseIndex={currentExerciseIndex}
        currentSet={currentSet}
        isResting={isResting}
        onExit={endSession}
        onNextStep={nextStep}
      />
    </>
  )
}