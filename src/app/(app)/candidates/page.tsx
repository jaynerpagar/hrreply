import { Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/card'

export default function CandidatesPage() {
  return (
    <div>
      <PageHeader
        title="Candidate tracker"
        description="Track pipeline stage, last message, and follow-up reminders."
        action={<Button variant="primary" disabled>Add candidate</Button>}
      />

      <div className="bg-surface-card border border-primary rounded-lg shadow-card p-8 max-w-lg">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded bg-primary-soft flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-ink mb-1">Pro feature</h2>
            <p className="text-sm text-ink-secondary leading-relaxed mb-4">
              Track all your candidates — pipeline stage, last message sent, and smart follow-up reminders. Upgrade to Pro to unlock.
            </p>
            <Link href="/upgrade">
              <Button variant="primary">Upgrade to Pro — ₹799/mo</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
