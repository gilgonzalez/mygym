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
    return <div className="w-11 h-6 bg-muted rounded-full" />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <div className="flex items-center space-x-2">
      <Sun className={cn("h-4 w-4 transition-colors", !isDark ? "text-primary" : "text-muted-foreground")} />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />
      <Moon className={cn("h-4 w-4 transition-colors", isDark ? "text-primary" : "text-muted-foreground")} />
    </div>
  )
}
