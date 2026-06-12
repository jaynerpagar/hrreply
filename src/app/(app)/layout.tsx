import { Sidebar } from '@/components/layout/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-page">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
