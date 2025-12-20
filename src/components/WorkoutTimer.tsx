'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import { Play, Pause, SkipForward } from 'lucide-react'

interface WorkoutTimerProps {
  duration: number
  mode: 'exercise' | 'rest'
  onComplete: () => void
  onSkip?: () => void
}

export function WorkoutTimer({ duration, mode, onComplete, onSkip }: WorkoutTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(true)

  // Sound effect helper
  const playBeep = (freq = 880, type: OscillatorType = 'sine') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return
      
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      
      // Smooth attack and release to avoid clicking
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
      
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.1)
    } catch (e) {
      console.error('Audio play failed', e)
    }
  }

  // Handle countdown sounds
  useEffect(() => {
    if (isRunning && timeLeft <= 5 && timeLeft > 0) {
      playBeep(880) // Standard beep for 5, 4, 3, 2, 1
    } else if (isRunning && timeLeft === 0) {
      playBeep(1760, 'square') // Distinct finish sound
    }
  }, [timeLeft, isRunning])

  // Timer Configuration (Pie Chart)
  const radius = 25
  const circumference = 2 * Math.PI * radius
  // strokeWidth = 2 * radius ensures the stroke covers the entire circle, creating a filled pie effect
  const strokeWidth = 50 
  // We want the filled area to shrink: 
  // Full time = full circle (offset 0)
  // 0 time = empty circle (offset = circumference)
  const strokeDashoffset = circumference * (1 - timeLeft / duration)

  // Colors based on mode
  const colorClass = mode === 'rest' ? 'text-orange-500' : 'text-green-500'

  // Reset timer when duration changes
  useEffect(() => {
    setTimeLeft(duration)
    setIsRunning(true)
  }, [duration])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsRunning(false)
      onComplete()
    }

    return () => clearInterval(interval)
  }, [isRunning, timeLeft, onComplete])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => setIsRunning(!isRunning)
  const addTime = () => setTimeLeft(t => t + 10)

  // Compact Row Layout
  return (
    <div className="flex flex-row items-center gap-6 p-2">
      {/* Pie Chart Timer Display - Larger */}
      <div className="relative flex items-center justify-center drop-shadow-lg">
        <svg
          viewBox="0 0 100 100"
          className="w-16 h-16 -rotate-90"
        >
          {/* Background Circle (Light placeholder) */}
          <circle
            cx="50"
            cy="50"
            r="50"
            fill="currentColor"
            className="text-white/20"
          />
          {/* Progress Pie Slice */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            className={`${colorClass} transition-[stroke-dashoffset] duration-1000 ease-linear`}
          />
        </svg>
      </div>

      {/* Time Text & Controls Side-by-Side */}
      <div className="flex flex-col items-center gap-2">
        <div className={`text-2xl font-mono font-bold tracking-tighter tabular-nums leading-none drop-shadow-md ${mode === 'exercise' ? 'text-white' : 'text-foreground'}`}>
           {formatTime(timeLeft)}
        </div>
        
        {/* Minimal Controls */}
        <div className="flex items-center justify-center gap-2">
           {mode === 'exercise' ? (
             <button 
               className="text-white/80 hover:text-white transition-colors p-1"
               onClick={toggleTimer}
               aria-label={isRunning ? "Pause" : "Resume"}
             >
               {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
             </button>
           ) : (
             <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={addTime}>+10s</Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onSkip || onComplete}>
                   Skip <SkipForward className="w-3 h-3 ml-1" />
                </Button>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}

