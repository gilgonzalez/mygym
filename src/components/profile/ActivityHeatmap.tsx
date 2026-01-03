"use client"

import { useState } from "react"
import { Activity, ChevronLeft, ChevronRight, Dumbbell, Zap, Swords, Shield, Brain, Footprints, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getWorkoutLogsAction } from "@/app/actions/user/getLogs"
import { useQuery } from "@tanstack/react-query"

type ActivityDay = {
  date: Date
  intensity: number // 0-4
  workoutTitle?: string
  xpGained?: number
}

interface ActivityHeatmapProps {
  userId?: string
  attributes?: {
    strength: number
    agility: number
    endurance: number
    wisdom: number
  }
}

export function ActivityHeatmap({ userId, attributes }: ActivityHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<ActivityDay | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const { data: monthData = [] } = useQuery({
    queryKey: ['workoutLogs', userId, year, month],
    queryFn: async () => {
      if (!userId) return []
      const startOfMonth = new Date(year, month, 1)
      const endOfMonth = new Date(year, month + 1, 0)
      
      const { success, data, error } = await getWorkoutLogsAction(
        userId,
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      )

      if (!success) throw new Error(error)
      return data || []
    },
    enabled: !!userId,
    select: (data) => {
        const endOfMonth = new Date(year, month + 1, 0)
        const daysInMonth = endOfMonth.getDate()
        const newMonthData: ActivityDay[] = []

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i)
            const dayLogs = data.filter(log => {
            const logDate = new Date(log.completed_at || '')
            return logDate.getDate() === i && logDate.getMonth() === month && logDate.getFullYear() === year
            })

            let intensity = 0
            let workoutTitle
            let xpGained = 0

            if (dayLogs.length > 0) {
                xpGained = dayLogs.reduce((sum, log) => sum + (log.xp_earned || 0), 0)
                
                if (xpGained > 200) intensity = 4
                else if (xpGained > 100) intensity = 3
                else if (xpGained > 50) intensity = 2
                else intensity = 1

                // @ts-ignore
                workoutTitle = dayLogs[0].workouts?.title || "Workout Session"
                if (dayLogs.length > 1) workoutTitle += ` (+${dayLogs.length - 1} more)`
            }
            
            newMonthData.push({ date, intensity, workoutTitle, xpGained })
        }
        return newMonthData
    }
  })
  
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

  // Map real attributes to display format
  const USER_ATTRIBUTES = [
    { 
      name: "Strength", 
      level: attributes?.strength || 0, 
      currentPoints: (attributes?.strength || 0) * 10, // Visual filler
      maxPoints: ((attributes?.strength || 0) + 1) * 10, 
      icon: Swords, 
      color: "text-red-600", 
      bg: "bg-red-100 dark:bg-red-900/30", 
      bar: "bg-red-500", 
      border: "border-red-200 dark:border-red-800" 
    },
    { 
      name: "Agility", 
      level: attributes?.agility || 0, 
      currentPoints: (attributes?.agility || 0) * 10, 
      maxPoints: ((attributes?.agility || 0) + 1) * 10, 
      icon: Footprints, 
      color: "text-blue-600", 
      bg: "bg-blue-100 dark:bg-blue-900/30", 
      bar: "bg-blue-500", 
      border: "border-blue-200 dark:border-blue-800" 
    },
    { 
      name: "Endurance", 
      level: attributes?.endurance || 0, 
      currentPoints: (attributes?.endurance || 0) * 10, 
      maxPoints: ((attributes?.endurance || 0) + 1) * 10, 
      icon: Shield, 
      color: "text-green-600", 
      bg: "bg-green-100 dark:bg-green-900/30", 
      bar: "bg-green-500", 
      border: "border-green-200 dark:border-green-800" 
    },
    { 
      name: "Wisdom", 
      level: attributes?.wisdom || 0, 
      currentPoints: (attributes?.wisdom || 0) * 10, 
      maxPoints: ((attributes?.wisdom || 0) + 1) * 10, 
      icon: Brain, 
      color: "text-purple-600", 
      bg: "bg-purple-100 dark:bg-purple-900/30", 
      bar: "bg-purple-500", 
      border: "border-purple-200 dark:border-purple-800" 
    },
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
                                        "w-full aspect-square rounded-md sm:rounded-lg transition-all duration-200 border",
                                        day.intensity === 0 && "bg-secondary/10 border-border/30",
                                        day.intensity > 0 && "border-transparent cursor-pointer hover:scale-110 hover:shadow-md hover:z-10 relative",
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