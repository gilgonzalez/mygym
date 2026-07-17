"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/Switch"

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-8 w-16 rounded-full border border-border/60 bg-muted/60 sm:h-6 sm:w-11 sm:border-0 sm:bg-muted" />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2 py-1.5 sm:gap-2 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
      <Sun className={cn("h-3.5 w-3.5 transition-colors sm:h-4 sm:w-4", !isDark ? "text-primary" : "text-muted-foreground")} />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />
      <Moon className={cn("h-3.5 w-3.5 transition-colors sm:h-4 sm:w-4", isDark ? "text-primary" : "text-muted-foreground")} />
    </div>
  )
}
