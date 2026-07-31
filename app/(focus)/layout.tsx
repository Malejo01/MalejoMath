import { AppGuards } from '@/components/app-guards'

export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppGuards>
      <div className="min-h-screen">{children}</div>
    </AppGuards>
  )
}
