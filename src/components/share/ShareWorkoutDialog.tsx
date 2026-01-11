import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Check, Link as LinkIcon, Share2, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface ShareWorkoutDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workout: {
        id: string
        title: string
        description?: string | null
        cover?: string | null
    }
}

export function ShareWorkoutDialog({ open, onOpenChange, workout }: ShareWorkoutDialogProps) {
    const [copied, setCopied] = useState(false)
    const [copiedInstagram, setCopiedInstagram] = useState(false)
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/workout/${workout.id}` : ''

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleInstagramCopy = () => {
        const text = `Check out this workout: ${workout.title}\n\n${shareUrl}`
        navigator.clipboard.writeText(text)
        setCopiedInstagram(true)
        setTimeout(() => setCopiedInstagram(false), 2000)
    }

    const WhatsAppIcon = ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
             <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.16C10.56 20.16 9.1 19.76 7.82 19L7.52 18.82L4.41 19.64L5.24 16.6L5.05 16.29C4.22 14.97 3.79 13.46 3.79 11.91C3.79 7.37 7.49 3.67 12.04 3.67C14.25 3.67 16.32 4.53 17.89 6.09C19.45 7.65 20.32 9.73 20.32 11.92C20.32 16.47 16.61 20.16 12.05 20.16ZM16.56 14.45C16.31 14.33 15.09 13.73 14.86 13.65C14.63 13.57 14.47 13.53 14.3 13.78C14.14 14.03 13.67 14.58 13.52 14.75C13.38 14.92 13.23 14.94 12.98 14.81C12.73 14.69 11.93 14.42 10.98 13.58C10.24 12.92 9.74 12.11 9.59 11.86C9.44 11.61 9.58 11.47 9.7 11.35C9.81 11.23 9.95 11.05 10.07 10.9C10.2 10.76 10.24 10.65 10.32 10.49C10.4 10.32 10.36 10.18 10.3 10.05C10.23 9.93 9.76 8.76 9.56 8.29C9.37 7.83 9.18 7.89 9.04 7.89C8.91 7.89 8.75 7.88 8.59 7.88C8.42 7.88 8.15 7.95 7.92 8.2C7.69 8.45 7.05 9.05 7.05 10.27C7.05 11.49 7.94 12.67 8.07 12.84C8.19 13 9.91 15.65 12.54 16.79C13.17 17.06 13.65 17.22 14.03 17.34C14.63 17.53 15.18 17.51 15.62 17.44C16.1 17.37 17.11 16.83 17.32 16.24C17.53 15.65 17.53 15.15 17.47 15.05C17.4 14.94 17.25 14.88 17 14.75L16.56 14.45Z" />
        </svg>
    )

    const XIcon = ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
    )

    const LinkedInIcon = ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.6.6 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
        </svg>
    )

    const InstagramIcon = ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a3.961 3.961 0 110-7.922 3.961 3.961 0 010 7.922zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
    )

    const shareLinks = [
        {
            name: "WhatsApp",
            icon: WhatsAppIcon,
            color: "bg-[#25D366] text-white hover:bg-[#25D366]/90",
            url: `https://wa.me/?text=${encodeURIComponent(`Check out this workout: ${workout.title} ${shareUrl}`)}`
        },
        {
            name: "X",
            icon: XIcon,
            color: "bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black",
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this workout: ${workout.title}`)}&url=${encodeURIComponent(shareUrl)}`
        },
        {
            name: "LinkedIn",
            icon: LinkedInIcon,
            color: "bg-[#0077b5] text-white hover:bg-[#0077b5]/90",
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="w-[90vw] max-w-[420px] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-border/50 shadow-2xl bg-background/95 backdrop-blur-xl gap-0">
                <div className="flex flex-col gap-5 sm:gap-6">
                    {/* Header & Preview */}
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold tracking-tight">Share Workout</h2>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -mr-2" onClick={() => onOpenChange(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        
                        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 bg-secondary/30">
                            <div className="flex items-stretch">
                                <div className="w-20 sm:w-24 bg-muted shrink-0 relative overflow-hidden">
                                    {workout.cover ? (
                                        <img src={workout.cover} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                            <Share2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary/40" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center min-w-0">
                                    <h3 className="font-bold text-sm sm:text-base text-foreground truncate">{workout.title}</h3>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
                                        Check out this routine on MyGym
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Row */}
                    <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:justify-between px-0 sm:px-2">
                        {shareLinks.map((link) => (
                            <div key={link.name} className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer">
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110 hover:shadow-md",
                                        link.color
                                    )}
                                >
                                    <link.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </a>
                                <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                    {link.name}
                                </span>
                            </div>
                        ))}
                        
                        {/* Instagram Special Case */}
                        <div className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer">
                            <button
                                onClick={handleInstagramCopy}
                                className={cn(
                                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110 hover:shadow-md",
                                    "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white"
                                )}
                            >
                                {copiedInstagram ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : <InstagramIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                            </button>
                            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                {copiedInstagram ? "Copied!" : "Stories"}
                            </span>
                        </div>
                    </div>

                    {/* Copy Link Input */}
                    <div className="space-y-1.5 sm:space-y-2 pt-1 sm:pt-2">
                        <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">Page Link</label>
                        <div className="flex items-center gap-2 p-1.5 rounded-xl border bg-muted/40 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-background border shadow-sm shrink-0">
                                <LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                            </div>
                            <input 
                                readOnly 
                                value={shareUrl} 
                                className="flex-1 bg-transparent text-xs font-medium text-foreground focus:outline-none truncate px-1"
                            />
                            <Button 
                                size="sm" 
                                onClick={handleCopy} 
                                className={cn(
                                    "shrink-0 gap-1.5 h-7 sm:h-8 px-3 sm:px-4 rounded-lg transition-all duration-300 text-xs sm:text-sm",
                                    copied ? "bg-green-500 hover:bg-green-600 text-white" : ""
                                )}
                            >
                                {copied ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                                <span>{copied ? "Copied" : "Copy"}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}