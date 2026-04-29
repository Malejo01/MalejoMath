'use client'

import { GraduationCap, LogIn, ClipboardList } from 'lucide-react'
import { SignInButton, Show, UserButton } from '@clerk/nextjs'
import { StreakBadge } from './streak-badge'
import { useAppStore } from '@/lib/store'
import Link from 'next/link'

export function Navbar() {
  const { userProgress } = useAppStore()

  return (
    <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-foreground tracking-tight leading-none">Malejo Math</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Mastery Learning</p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <div className="hidden xs:block">
            <StreakBadge streak={userProgress.streak} size="sm" />
          </div>

          <div className="h-8 w-[1px] bg-border/50 mx-1 hidden xs:block" />

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:shadow-lg hover:bg-primary/90 transition-all active:scale-95">
                <LogIn className="w-4 h-4" />
                <span>Ingresar</span>
              </button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center gap-3">
              <Link href="/history">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm hover:bg-secondary/80 transition-all active:scale-95 border border-border/50">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">Mis evaluaciones</span>
                </button>
              </Link>
              
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-9 h-9 border-2 border-primary/20 hover:border-primary transition-colors",
                    userButtonTrigger: "focus:shadow-none focus:outline-none"
                  }
                }}
                afterSignOutUrl="/"
              />
            </div>
          </Show>
        </div>
      </div>
    </header>
  )
}
