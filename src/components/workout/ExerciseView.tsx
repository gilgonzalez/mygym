import { Button } from '@/components/Button'
import { WorkoutTimer } from '@/components/WorkoutTimer'
import { CheckCircle2, ChevronLeft, Dumbbell, Volume2, VolumeX } from 'lucide-react'
import { LocalExercise, LocalSection } from '@/types/workout/viewTypes'
import { useState, useRef } from 'react'

interface ExerciseViewProps {
  currentExercise: LocalExercise
  currentExerciseIndex: number
  currentSection: LocalSection
  currentSet: number
  onComplete: () => void
  onPrev?: () => void
}

export function ExerciseView({ 
  currentExercise, 
  currentExerciseIndex, 
  currentSection, 
  currentSet,
  onComplete,
  onPrev
}: ExerciseViewProps) {
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const videoRef = useRef<HTMLIFrameElement>(null)
  const totalSets = currentExercise.sets || 1

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

  const isVideoFile = (url: string) => {
    return /\.(mp4|webm|ogg|mov)($|\?)/i.test(url)
  }

  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = ''
    if (url.includes('youtu.be')) {
      videoId = url.split('youtu.be/')[1].split('?')[0]
    } else if (url.includes('youtube.com')) {
      videoId = new URL(url).searchParams.get('v') || ''
    }
    // Add autoplay, mute, loop, controls=0, enablejsapi=1
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&loop=1&playlist=${videoId}&playsinline=1&rel=0&enablejsapi=1`
  }

  const toggleVideoMute = () => {
    if (currentExercise.media_url && isYouTubeUrl(currentExercise.media_url)) {
      if (videoRef.current && videoRef.current.contentWindow) {
        const command = isVideoMuted ? 'unMute' : 'mute'
        videoRef.current.contentWindow.postMessage(JSON.stringify({
          'event': 'command',
          'func': command,
          'args': []
        }), '*')
      }
    }
    setIsVideoMuted(!isVideoMuted)
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-black animate-in fade-in duration-500">
       <div className="relative flex-1 w-full h-full overflow-hidden">
          {currentExercise.media_url ? (
            isYouTubeUrl(currentExercise.media_url) ? (
               <>
                 <iframe 
                   ref={videoRef}
                   src={getYouTubeEmbedUrl(currentExercise.media_url)} 
                   className="w-full h-full object-cover opacity-90 pointer-events-none scale-125"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowFullScreen
                 />
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleVideoMute}
                    className="absolute top-20 right-6 z-30 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border border-white/10"
                 >
                    {isVideoMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                 </Button>
               </>
            ) : isVideoFile(currentExercise.media_url) ? (
               <>
                 <video 
                   src={currentExercise.media_url} 
                   className="w-full h-full object-cover opacity-90"
                   autoPlay
                   loop
                   muted={isVideoMuted}
                   playsInline
                 />
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleVideoMute}
                    className="absolute top-20 right-6 z-30 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border border-white/10"
                 >
                    {isVideoMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                 </Button>
               </>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                {/* Blurred Background */}
                <div className="absolute inset-0 overflow-hidden">
                  <img 
                    src={currentExercise.media_url} 
                    alt="" 
                    className="w-full h-full object-cover blur-3xl opacity-30 scale-110" 
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* Card Image */}
                <div className="relative z-10 w-full max-w-md px-6 -mt-20">
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-zinc-900/50 backdrop-blur-sm">
                    <img 
                      src={currentExercise.media_url} 
                      alt={currentExercise.name} 
                      className="w-full h-full object-contain p-2" 
                    />
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-700">
              <Dumbbell className="w-24 h-24 mb-4 opacity-20" />
              <span className="font-mono text-sm opacity-40">No Media Available</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40 pointer-events-none" />

          {currentExercise.type === 'time' && (
            <div className="absolute top-20 left-6 z-30">
               <div className="bg-black/30 backdrop-blur-xl rounded-[2rem] pr-6 border border-white/10 shadow-2xl ring-1 ring-white/5">
                  <WorkoutTimer 
                    key={`exercise-${currentExercise.id}`}
                    duration={currentExercise.duration || 60}
                    mode="exercise"
                    onComplete={onComplete}
                  />
               </div>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-20 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-6">
              <div className="flex-1 space-y-2 max-w-2xl w-full">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary text-primary-foreground">
                     {currentExercise.type === 'time' ? 'Duration' : 'Reps'}
                   </span>
                   <span className="text-white/60 text-xs font-mono">
                     {currentExerciseIndex + 1} / {currentSection.exercises.length}
                   </span>
                 </div>
                 
                 {/* Big Stats Display */}
                 <div className="flex items-baseline gap-1 text-white mb-2">
                    {currentExercise.type === 'reps' ? (
                        <>
                            <span className="text-6xl sm:text-7xl font-black tracking-tighter leading-none">
                                {currentExercise.reps}
                            </span>
                            <span className="text-xl sm:text-2xl font-medium text-white/60 uppercase tracking-widest ml-2">
                                Reps
                            </span>
                        </>
                    ) : (
                        <>
                             <span className="text-6xl sm:text-7xl font-black tracking-tighter leading-none">
                                {currentExercise.duration}
                            </span>
                            <span className="text-xl sm:text-2xl font-medium text-white/60 uppercase tracking-widest ml-2">
                                Sec
                            </span>
                        </>
                    )}
                 </div>

                 {totalSets > 1 && (
                    <div className="inline-block px-3 py-1 mb-2 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider border border-orange-500/20">
                      Set {currentSet} of {totalSets} <span className="text-white/40 ml-1">• {totalSets - currentSet} Left</span>
                    </div>
                 )}
                 <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
                   {currentExercise.name}
                 </h2>
                 {currentExercise.description && (
                   <p className="text-white/80 text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-none max-w-xl font-light">
                     {currentExercise.description}
                   </p>
                 )}
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                 {onPrev && (
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-16 w-16 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md shrink-0"
                        onClick={onPrev}
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </Button>
                 )}
                 <Button 
                   size="lg" 
                   className="h-16 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform shrink-0 flex-1 sm:flex-none" 
                   onClick={onComplete}
                 >
                   <CheckCircle2 className="mr-3 w-6 h-6" /> 
                   {currentExercise.type === 'reps' 
                     ? `Done` 
                     : currentSet < totalSets ? 'Next Set' : 'Next Exercise'
                   }
                 </Button>
              </div>
          </div>
       </div>
    </div>
  )
}