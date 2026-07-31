import { AppGuards } from '@/components/app-guards'
import { Navbar } from '@/components/navbar'
import { MathBackground } from '@/components/math-background'
import { PageContainer } from '@/components/layout/page-container'

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppGuards>
      <div className="min-h-screen relative">
        <MathBackground />
        <Navbar />
        <main>
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </AppGuards>
  )
}
