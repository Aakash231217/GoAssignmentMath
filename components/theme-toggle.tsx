"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/app/providers/theme-provider"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-full"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 text-[#5b6480] transition-all" />
      ) : (
        <Sun className="h-5 w-5 text-yellow-500 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
