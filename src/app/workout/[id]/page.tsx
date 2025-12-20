'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorkoutOverview } from '@/components/workout/WorkoutOverview'
import { ActiveSession } from '@/components/workout/ActiveSession'
import { WorkoutCompleted } from '@/components/workout/WorkoutCompleted'
import { LocalWorkout } from '@/types/workout/viewTypes'

export default function WorkoutSessionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  
  // State
  const [hasStarted, setHasStarted] = useState(false)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  
  // Mock Data (Ideally this would come from an API or separate data file)
  const workout: LocalWorkout = {
    id: params.id,
    title: "Full Body Destruction",
    description: "A comprehensive full-body workout designed to build strength and endurance. We start with a dynamic warm-up, move into heavy compound lifts, follow up with hypertrophy-focused isolation work, and finish with a core-crushing circuit.",
    sections: [
      {
        id: "s1",
        name: "Warm Up & Mobility",
        exercises: [
          {
            id: "e1",
            name: "Arm Circles",
            type: "time",
            duration: 30,
            rest: 0,
            media_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
            description: "Rotate your arms in large circles, first forward then backward to loosen up the shoulders."
          },
          {
            id: "e2",
            name: "Jumping Jacks",
            type: "time",
            duration: 60,
            rest: 15,
            media_url: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&q=80",
            description: "Classic jumping jacks to get the heart rate up and blood flowing."
          },
          {
            id: "e3",
            name: "World's Greatest Stretch",
            type: "time",
            duration: 60,
            rest: 30,
            media_url: "https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=800&q=80",
            description: "Step forward into a lunge, rotate your torso, and reach for the sky. Alternate sides."
          },
          {
            id: "e13",
            name: "High Knees",
            type: "time",
            duration: 45,
            rest: 15,
            media_url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
            description: "Run in place bringing your knees as high as possible."
          },
          {
            id: "e14",
            name: "Torso Twists",
            type: "time",
            duration: 45,
            rest: 10,
            media_url: "https://images.unsplash.com/photo-1538805060512-e2496a177605?w=800&q=80",
            description: "Standing twist to loosen up the lower back."
          }
        ]
      },
      {
        id: "s2",
        name: "Compound Power",
        exercises: [
          {
            id: "e4",
            name: "Barbell Squats",
            type: "reps",
            reps: "5-8",
            sets: 4,
            rest: 120,
            media_url: "https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80",
            description: "Feet shoulder-width apart. Keep chest up and core tight. Go deep."
          },
          {
            id: "e5",
            name: "Bench Press",
            type: "reps",
            reps: "8-10",
            sets: 3,
            rest: 90,
            media_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
            description: "Control the bar on the way down. Explode up. Keep elbows at 45 degrees."
          },
          {
            id: "e6",
            name: "Deadlifts",
            type: "reps",
            reps: "5",
            sets: 3,
            rest: 180,
            media_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
            description: "Hinge at the hips. Keep the bar close to your shins. Neutral spine."
          },
          {
            id: "e15",
            name: "Overhead Press",
            type: "reps",
            reps: "8",
            sets: 3,
            rest: 90,
            media_url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",
            description: "Strict press. Core engaged, don't arch your back."
          },
          {
            id: "e16",
            name: "Bent Over Rows",
            type: "reps",
            reps: "10",
            sets: 3,
            rest: 90,
            media_url: "https://images.unsplash.com/photo-1603287681836-e5452e4d6f5e?w=800&q=80",
            description: "Pull the barbell to your lower chest. Squeeze shoulder blades."
          }
        ]
      },
      {
        id: "s3",
        name: "Hypertrophy Accessor",
        exercises: [
          {
            id: "e7",
            name: "Dumbbell Lunges",
            type: "reps",
            reps: "12/leg",
            sets: 3,
            rest: 60,
            media_url: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=800&q=80",
            description: "Step forward and drop your back knee. Keep torso upright."
          },
          {
            id: "e8",
            name: "Pull-Ups",
            type: "reps",
            reps: "AMRAP",
            sets: 3,
            rest: 90,
            media_url: "https://images.unsplash.com/photo-1598971639058-211a73287750?w=800&q=80",
            description: "Full extension at the bottom. Chin over bar at the top."
          },
          {
            id: "e9",
            name: "Dumbbell Lateral Raises",
            type: "reps",
            reps: "15",
            sets: 3,
            rest: 45,
            media_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
            description: "Lead with your elbows. Don't swing the weights."
          },
          {
            id: "e17",
            name: "Face Pulls",
            type: "reps",
            reps: "15",
            sets: 3,
            rest: 45,
            media_url: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&q=80",
            description: "Pull rope to forehead. Focus on rear delts."
          },
          {
            id: "e18",
            name: "Tricep Extensions",
            type: "reps",
            reps: "12",
            sets: 3,
            rest: 45,
            media_url: "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=800&q=80",
            description: "Keep elbows tucked in. Full extension."
          }
        ]
      },
      {
        id: "s4",
        name: "Core Finisher",
        exercises: [
          {
            id: "e10",
            name: "Plank",
            type: "time",
            duration: 60,
            rest: 30,
            media_url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80",
            description: "Hold a solid plank position. Squeeze glutes and abs."
          },
          {
            id: "e11",
            name: "Russian Twists",
            type: "time",
            duration: 45,
            rest: 30,
            media_url: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&q=80",
            description: "Feet off the ground if possible. Rotate torso side to side."
          },
          {
            id: "e12",
            name: "Mountain Climbers",
            type: "time",
            duration: 45,
            rest: 0,
            media_url: "https://images.unsplash.com/photo-1434608519344-49d77a699ded?w=800&q=80",
            description: "Drive knees to chest rapidly. Keep hips down."
          },
          {
            id: "e19",
            name: "Leg Raises",
            type: "reps",
            reps: "15",
            sets: 3,
            rest: 45,
            media_url: "https://images.unsplash.com/photo-1566241483342-3658512f5a02?w=800&q=80",
            description: "Lie flat. Lift legs to 90 degrees. Control the descent."
          },
          {
            id: "e20",
            name: "Bicycle Crunches",
            type: "time",
            duration: 45,
            rest: 0,
            media_url: "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=800&q=80",
            description: "Opposite elbow to opposite knee. Constant tension."
          }
        ]
      }
    ]
  }

  const currentSection = workout.sections[currentSectionIndex]

  const finishWorkout = () => {
    setIsCompleted(true)
    setHasStarted(false)
  }

  const handleNextStep = () => {
    if (isResting) {
      // Finishing Rest -> Start Next Exercise
      setIsResting(false)
      if (currentExerciseIndex < currentSection.exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1)
      } else if (currentSectionIndex < workout.sections.length - 1) {
        setCurrentSectionIndex(prev => prev + 1)
        setCurrentExerciseIndex(0)
      } else {
        finishWorkout()
      }
    } else {
      // Finishing Exercise -> Start Rest (or Finish)
      const isLastExerciseInSection = currentExerciseIndex === currentSection.exercises.length - 1
      const isLastSection = currentSectionIndex === workout.sections.length - 1
      
      if (isLastExerciseInSection && isLastSection) {
        finishWorkout()
      } else {
        setIsResting(true)
      }
    }
  }

  // Render Logic
  if (!workout) return <div>Loading...</div>

  // 1. Completion View
  if (isCompleted) {
    return (
      <WorkoutCompleted 
        workout={workout} 
        onRestart={() => window.location.reload()} 
      />
    )
  }

  // 2. Intro View
  if (!hasStarted) {
    return (
      <WorkoutOverview 
        workout={workout}
        onStart={() => setHasStarted(true)}
        onBack={() => router.push('/')}
      />
    )
  }

  // 3. Active Session View
  return (
    <ActiveSession 
      workout={workout}
      currentSectionIndex={currentSectionIndex}
      currentExerciseIndex={currentExerciseIndex}
      isResting={isResting}
      onExit={() => setHasStarted(false)}
      onNextStep={handleNextStep}
    />
  )
}