import { cn } from '@/lib/utils'

export function PageContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-10', className)}>
      {children}
    </div>
  )
}
