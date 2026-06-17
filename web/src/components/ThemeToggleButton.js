"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <div className="flex h-8 w-[72px] shrink-0 items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-0.5 opacity-50" />
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="relative flex h-8 w-[72px] shrink-0 items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-0.5 transition-colors duration-200 hover:border-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
    >
      {/* sliding thumb */}
      <span
        className={`absolute top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-700 shadow-sm transition-all duration-200
          ${isDark ? 'left-[calc(100%-1.875rem)]' : 'left-0.5'}`}
      >
        {isDark
          ? <Moon className="h-3.5 w-3.5 text-teal-400" />
          : <Sun className="h-3.5 w-3.5 text-amber-500" />
        }
      </span>

      {/* labels */}
      <Sun className={`ml-1.5 h-3 w-3 transition-opacity duration-200 ${isDark ? 'opacity-30 text-slate-400' : 'opacity-0'}`} />
      <Moon className={`ml-auto mr-1.5 h-3 w-3 transition-opacity duration-200 ${isDark ? 'opacity-0' : 'opacity-30 text-slate-400'}`} />
    </button>
  )
}
