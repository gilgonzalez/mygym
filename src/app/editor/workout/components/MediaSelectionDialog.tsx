'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { X, Image as ImageIcon, Music, Film, Loader2, Check, AlertCircle, Search } from 'lucide-react'
import { listMediaAction, MediaItem } from '@/app/actions/media/list'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'

interface MediaSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string) => void
  mediaType?: 'image' | 'audio' | 'video'
}

export function MediaSelectionDialog({ isOpen, onClose, onSelect, mediaType = 'image' }: MediaSelectionDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const { data: result, isLoading } = useQuery({
    queryKey: ['media', mediaType, debouncedSearch],
    queryFn: () => listMediaAction(mediaType === 'image' ? 'image' : mediaType === 'audio' ? 'audio' : undefined, debouncedSearch),
    enabled: isOpen,
  })

  const mediaList = result?.data || []

  if (!isOpen || !mounted) return null

  const handleSelect = (item: MediaItem) => {
    setSelectedId(item.id)
    setSelectedUrl(item.url)
  }

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl)
      onClose()
    }
  }

  const getMediaType = (item: MediaItem) => {
    if (item.type?.startsWith('video') || item.mime_type?.startsWith('video')) return 'video'
    if (item.type?.startsWith('audio') || item.mime_type?.startsWith('audio')) return 'audio'
    if (item.type?.startsWith('image') || item.mime_type?.startsWith('image')) return 'image'
    
    // Fallback: check extension
    const ext = (item.filename || item.url).split('.').pop()?.toLowerCase()
    if (['mp4', 'mov', 'webm', 'mkv'].includes(ext || '')) return 'video'
    if (['mp3', 'wav', 'm4a', 'aac'].includes(ext || '')) return 'audio'
    
    return 'image' // Default to image
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-border w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex flex-col gap-4 p-4 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {mediaType === 'audio' ? <Music className="h-5 w-5 text-primary" /> : <ImageIcon className="h-5 w-5 text-primary" />}
                    <h3 className="font-bold text-lg">Select {mediaType === 'audio' ? 'Audio' : 'Media'}</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                    <X className="h-5 w-5" />
                </Button>
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Search by name..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
            {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Loading your library...</p>
                </div>
            ) : mediaList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <div className="p-4 rounded-full bg-muted/50">
                        {mediaType === 'audio' ? <Music className="h-8 w-8 opacity-50" /> : <ImageIcon className="h-8 w-8 opacity-50" />}
                    </div>
                    <p>No media found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {mediaList.map((item) => {
                        const itemType = getMediaType(item)
                        return (
                        <div 
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className={cn(
                                "group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all",
                                selectedId === item.id 
                                    ? "border-primary ring-2 ring-primary/20" 
                                    : "border-transparent hover:border-primary/50"
                            )}
                        >
                            {itemType === 'image' ? (
                                <>
                                    <img 
                                        src={item.url} 
                                        alt={item.filename || 'Media'} 
                                        className={cn(
                                            "w-full h-full object-cover transition-transform group-hover:scale-105",
                                            imgErrors[item.id] ? "hidden" : "block"
                                        )}
                                        loading="lazy"
                                        onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))}
                                    />
                                    {imgErrors[item.id] && (
                                        <div className="w-full h-full bg-muted flex flex-col items-center justify-center p-4 text-center">
                                            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                                            <span className="text-xs text-muted-foreground">Error</span>
                                        </div>
                                    )}
                                </>
                            ) : itemType === 'video' ? (
                                <div className="w-full h-full bg-black relative flex items-center justify-center">
                                     <video src={item.url} className="w-full h-full object-cover opacity-80" />
                                     <Film className="absolute text-white/50 h-8 w-8" />
                                </div>
                            ) : (
                                <div className="w-full h-full bg-muted flex flex-col items-center justify-center p-4 text-center">
                                    <Music className="h-8 w-8 text-primary mb-2" />
                                    <span className="text-xs text-muted-foreground truncate w-full">{item.filename || 'Audio Track'}</span>
                                </div>
                            )}

                            {/* Selection Overlay */}
                            <div className={cn(
                                "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                                selectedId === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}>
                                {selectedId === item.id && (
                                    <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg scale-110">
                                        <Check className="h-5 w-5" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
                {selectedId ? '1 item selected' : 'No item selected'}
            </span>
            <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button onClick={handleConfirm} disabled={!selectedId}>
                    Use Selected
                </Button>
            </div>
        </div>
      </div>
    </div>,
    document.body
  )
}