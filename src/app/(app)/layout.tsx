import { Sidebar } from '@/components/layout/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-page">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        <div className="max-w-[1280px] mx-auto px-4 py-5 lg:px-6 lg:py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
