'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/Button'
import { Volume2, VolumeX, Play, Pause, Music2, SkipForward, SkipBack } from 'lucide-react'
import { useWorkoutStore } from '@/store/workOutStore'

interface MusicPlayerProps {
  playlist: string[]
  className?: string
}

export function MusicPlayer({ playlist, className }: MusicPlayerProps) {
  const { isSpeaking } = useWorkoutStore()
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(50)
  const [isHovered, setIsHovered] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Extract Video ID from Embed URL
  const getVideoId = (url: string) => {
    if (!url) return ''
    try {
      if (url.includes('youtu.be')) {
        return url.split('youtu.be/')[1].split('?')[0]
      }
      if (url.includes('youtube.com')) {
        const urlObj = new URL(url)
        return urlObj.searchParams.get('v') || ''
      }
    } catch (e) {
      console.error('Error parsing video ID', e)
    }
    return ''
  }

  const currentVideoId = getVideoId(playlist[currentTrackIndex])
  const embedUrl = `https://www.youtube.com/embed/${currentVideoId}?enablejsapi=1&controls=0&showinfo=0&rel=0&autoplay=0&loop=0&playsinline=1`

  // Send Command to YouTube Iframe
  const sendCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        'event': 'command',
        'func': func,
        'args': args
      }), '*')
    }
  }

  useEffect(() => {
    if (playing) {
      sendCommand('playVideo')
    } else {
      sendCommand('pauseVideo')
    }
  }, [playing, currentTrackIndex])

  useEffect(() => {
    if (muted) {
      sendCommand('mute')
    } else {
      sendCommand('unMute')
      sendCommand('setVolume', [volume])
    }
  }, [muted])

  useEffect(() => {
    if (!muted) {
      // If speaking, lower volume to 20, else use user volume
      const targetVolume = isSpeaking ? Math.min(volume, 20) : volume
      sendCommand('setVolume', [targetVolume])
    }
  }, [volume, isSpeaking])

  const handleNextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % playlist.length
    setCurrentTrackIndex(nextIndex)
    setPlaying(true) 
  }

  const handlePrevTrack = () => {
    const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length
    setCurrentTrackIndex(prevIndex)
    setPlaying(true)
  }

  // Note: Detecting "onEnded" with raw iframe requires listening to window messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
       try {
           if (typeof event.data !== 'string') return
           const data = JSON.parse(event.data)
           // YouTube API sends infoDelivery events. 
           // State 0 = Ended
           if (data.event === 'onStateChange' && data.info === 0) {
               handleNextTrack()
           }
       } catch (e) {
           // Ignore non-JSON messages
       }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [currentTrackIndex])


  if (!playlist || playlist.length === 0) return null
  
  return (
    <div 
      className={`z-50 flex flex-col items-center ${className || 'fixed top-4 left-1/2 -translate-x-1/2'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
        {/* 
            Native YouTube Iframe
            Placed off-screen to avoid blocking but keep it active
        */}
        <div style={{ 
            position: 'fixed', 
            top: -1000,
            left: -1000,
            width: '200px', 
            height: '150px', 
            visibility: 'hidden',
            pointerEvents: 'none'
        }}>
            <iframe
                ref={iframeRef}
                width="100%"
                height="100%"
                src={embedUrl}
                title="Background Music"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => {
                  if (playing) {
                    // Retry play command to ensure player is ready after load
                    sendCommand('playVideo')
                    setTimeout(() => sendCommand('playVideo'), 500)
                    setTimeout(() => sendCommand('playVideo'), 1000)
                  }
                }}
            />
        </div>

        {/* Floating Controls */}
        <div className={`
            flex items-center gap-2 bg-background/90 backdrop-blur-md border border-border 
            p-2 rounded-full shadow-2xl transition-all duration-300
            ${playing ? 'border-primary/50 shadow-primary/20' : ''}
        `}>
             <div className="flex items-center justify-center bg-primary/10 rounded-full h-8 w-8">
                <Music2 className={`h-4 w-4 text-primary ${playing ? 'animate-pulse' : ''}`} />
             </div>

             {/* Hidden Controls (Revealed on Hover) */}
             <div className={`flex items-center gap-1 overflow-hidden transition-all duration-300 ${isHovered ? 'w-auto opacity-100 max-w-[500px]' : 'w-0 opacity-0 max-w-0'}`}>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                  onClick={handlePrevTrack}
                  disabled={playlist.length <= 1}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

             </div>

             <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                onClick={() => setPlaying(!playing)}
             >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
             </Button>

             {/* More Hidden Controls (Next & Volume) */}
             <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isHovered ? 'w-auto opacity-100 max-w-[500px]' : 'w-0 opacity-0 max-w-0'}`}>
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                    onClick={handleNextTrack}
                    disabled={playlist.length <= 1}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  <div className="h-4 w-[1px] bg-border mx-1" />

                  <div className="flex items-center gap-2 px-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary"
                      onClick={() => setMuted(!muted)}
                    >
                      {muted || volume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={muted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(Number(e.target.value))
                        if (muted) setMuted(false)
                      }}
                      className="w-16 h-1 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                    />
                  </div>
             </div>
        </div>
    </div>
  )
}