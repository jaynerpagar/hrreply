import { Users, Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CandidatesPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-orange-400" /> Candidate Tracker
        </h1>
      </div>
      <div className="bg-gray-900 border border-orange-500/20 rounded-xl p-8 text-center">
        <Lock className="w-10 h-10 text-orange-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-2">Pro Feature</h2>
        <p className="text-sm text-gray-400 mb-5 max-w-sm mx-auto">
          Track all your candidates — pipeline stage, last message, follow-up reminders. Upgrade to Pro to unlock.
        </p>
        <Link href="/upgrade">
          <Button>Upgrade to Pro — ₹799/mo</Button>
        </Link>
      </div>
    </div>
  )
}
