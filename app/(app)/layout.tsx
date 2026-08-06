import { AppGuards } from '@/components/app-guards'
import { Navbar } from '@/components/navbar'
import { MathBackground } from '@/components/math-background'
import { PageContainer } from '@/components/layout/page-container'
import { Footer } from '@/components/footer'

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppGuards>
      <div className="min-h-screen relative flex flex-col">
        <MathBackground />
        <Navbar />
        <main className="flex-1">
          <PageContainer>{children}</PageContainer>
        </main>
        <Footer />
      </div>
    </AppGuards>
  )
}
