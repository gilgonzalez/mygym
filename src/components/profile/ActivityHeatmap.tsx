"use client"

import { useState } from "react"
import { Activity, ChevronLeft, ChevronRight, Dumbbell, Zap, Swords, Shield, Brain, Footprints, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// --- MOCK DATA TYPES & GENERATOR ---
type ActivityDay = {
  date: Date
  intensity: number // 0-4
  workoutTitle?: string
  xpGained?: number
  stats?: {
    strength?: number
    agility?: number
    endurance?: number
    wisdom?: number
  }
}

const generateMonthData = (year: number, month: number): ActivityDay[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const data: ActivityDay[] = []

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    // Random mock data
    const rand = Math.random()
    let intensity = 0
    let workoutTitle
    let xpGained
    let stats

    if (rand > 0.7) {
        intensity = Math.floor(Math.random() * 4) + 1
        workoutTitle = ["Leg Day Destruction", "Upper Body Power", "Cardio Blast", "Zen Yoga"][Math.floor(Math.random() * 4)]
        xpGained = Math.floor(Math.random() * 100) + 50
        stats = {
            strength: Math.random() > 0.5 ? 1 : 0,
            agility: Math.random() > 0.5 ? 1 : 0,
            endurance: Math.random() > 0.5 ? 1 : 0,
            wisdom: Math.random() > 0.8 ? 1 : 0
        }
    }
    
    data.push({ date, intensity, workoutTitle, xpGained, stats })
  }
  return data
}

export function ActivityHeatmap() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<ActivityDay | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  // Generate data for current view
  const monthData = generateMonthData(year, month)
  
  // Calculate offset for first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(year, month, 1).getDay() 
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleDayClick = (day: ActivityDay) => {
    if (day.intensity > 0) {
        setSelectedDay(day)
        setIsDialogOpen(true)
    }
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  // Mock Total Attributes for the stats column
  // "Points" are used to level up specific attributes
  const USER_ATTRIBUTES = [
    { name: "Strength", level: 12, currentPoints: 850, maxPoints: 1200, icon: Swords, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", bar: "bg-red-500", border: "border-red-200 dark:border-red-800" },
    { name: "Agility", level: 8, currentPoints: 320, maxPoints: 800, icon: Footprints, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", bar: "bg-blue-500", border: "border-blue-200 dark:border-blue-800" },
    { name: "Endurance", level: 15, currentPoints: 1450, maxPoints: 2000, icon: Shield, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", bar: "bg-green-500", border: "border-green-200 dark:border-green-800" },
    { name: "Wisdom", level: 5, currentPoints: 450, maxPoints: 600, icon: Brain, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30", bar: "bg-purple-500", border: "border-purple-200 dark:border-purple-800" },
  ]

  return (
    <>
    <div className="bg-card rounded-xl p-4 sm:p-6 shadow-sm border grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 transition-all">
      {/* LEFT COLUMN: HEATMAP */}
      <div className="space-y-6">
        {/* Header with Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground/90">
                <Activity className="w-5 h-5 text-primary" />
                Activity Log
            </h2>
            <div className="flex items-center justify-between sm:justify-end gap-2 bg-secondary/30 p-1 rounded-lg">
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-background shadow-sm" onClick={handlePrevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[100px] text-center text-sm font-semibold capitalize tabular-nums">{monthName}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-background shadow-sm" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
        
        {/* Month Grid */}
        <div className="w-full">
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="text-center text-[10px] text-muted-foreground w-full aspect-square flex items-center justify-center font-bold tracking-wider">
                        {day}
                    </div>
                ))}
                
                {/* Empty cells for offset */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-full aspect-square" />
                ))}

                {/* Day cells */}
                {monthData.map((day, index) => (
                    <TooltipProvider key={index}>
                        <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => handleDayClick(day)}
                                    disabled={day.intensity === 0}
                                    className={cn(
                                        "w-full aspect-square rounded-md sm:rounded-lg transition-all duration-200 border border-transparent",
                                        day.intensity === 0 && "bg-secondary/20",
                                        day.intensity > 0 && "cursor-pointer hover:scale-110 hover:shadow-md hover:z-10 relative",
                                        day.intensity === 1 && "bg-green-100 dark:bg-green-900/30 text-green-700",
                                        day.intensity === 2 && "bg-green-300 dark:bg-green-700/60 text-green-800",
                                        day.intensity === 3 && "bg-green-400 dark:bg-green-600/80 text-green-900",
                                        day.intensity === 4 && "bg-green-500 dark:bg-green-500 text-white shadow-green-500/20 shadow-lg"
                                    )}
                                >
                                    {day.intensity > 0 && (
                                         <span className="sr-only">Activity on {day.date.toLocaleDateString()}</span>
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent sideOffset={5} className="bg-popover/95 backdrop-blur-sm border-border/50 shadow-xl">
                                <p className="text-xs font-bold">{day.date.toLocaleDateString()}</p>
                                {day.intensity > 0 ? (
                                    <p className="text-xs font-medium text-muted-foreground mt-1">{day.workoutTitle} <span className="text-primary font-bold">(+{day.xpGained} XP)</span></p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Rest Day</p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN: USER ATTRIBUTES */}
      <div className="space-y-6 border-t lg:border-t-0 lg:border-l border-border/40 pt-8 lg:pt-0 lg:pl-10 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-base flex items-center gap-2 text-foreground/90">
              <BarChart2 className="w-4 h-4" />
              Stats
            </h3>
            <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full border border-border/50">Global Stats</span>
        </div>
        
        <div className="space-y-4">
            {USER_ATTRIBUTES.map((attr) => (
                <div key={attr.name} className={cn(
                    "p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:bg-accent/5 bg-card space-y-3",
                    attr.border
                )}>
                    {/* Header: Icon, Name, Level */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg shadow-sm", attr.bg)}>
                                <attr.icon className={cn("w-4 h-4", attr.color)} />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-foreground leading-none">{attr.name}</h4>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-foreground">Lvl {attr.level}</span>
                            <span className="text-[10px] text-muted-foreground font-medium tabular-nums">{attr.currentPoints}/{attr.maxPoints} pts</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                        <div 
                            className={cn("h-full rounded-full transition-all duration-500 ease-out", attr.bar)} 
                            style={{ width: `${(attr.currentPoints / attr.maxPoints) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>

    {/* RPG Detail Dialog */}
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl border-2 border-primary/20">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl text-primary">
                    <Swords className="w-5 h-5" />
                    Activity Report
                </DialogTitle>
                <DialogDescription>
                    {selectedDay?.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-2">
                {/* Single Row Workout Display */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-muted/30 p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors shadow-sm">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* Icon */}
                        <div className="bg-primary/10 p-2.5 rounded-xl ring-1 ring-primary/20 shrink-0 shadow-sm">
                            <Dumbbell className="w-5 h-5 text-primary" />
                        </div>
                        
                        {/* Title */}
                        <div className="flex-1 min-w-[120px] sm:hidden">
                            <h4 className="font-bold text-sm text-foreground truncate">{selectedDay?.workoutTitle}</h4>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Workout</p>
                        </div>
                    </div>
                    
                    {/* Title (Desktop) */}
                    <div className="hidden sm:block flex-1 min-w-[120px]">
                        <h4 className="font-bold text-sm text-foreground truncate">{selectedDay?.workoutTitle}</h4>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Workout</p>
                    </div>

                    {/* Right Side: Stats (Top) & XP (Bottom) */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1.5 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                        {/* Stats Row */}
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {selectedDay?.stats?.strength ? (
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-red-50 text-red-700 border-red-200 shadow-sm">
                                    +1 Strength
                                </Badge>
                            ) : null}
                            {selectedDay?.stats?.agility ? (
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 shadow-sm">
                                    +1 Agility
                                </Badge>
                            ) : null}
                            {selectedDay?.stats?.endurance ? (
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 border-green-200 shadow-sm">
                                    +1 Endurance
                                </Badge>
                            ) : null}
                            {selectedDay?.stats?.wisdom ? (
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200 shadow-sm">
                                    +1 Wisdom
                                </Badge>
                            ) : null}
                        </div>

                        {/* XP Badge */}
                        <Badge variant="secondary" className="text-[10px] px-2.5 py-0.5 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 gap-1.5 shadow-sm">
                            <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                            +{selectedDay?.xpGained} XP
                        </Badge>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
    </>
  )
}