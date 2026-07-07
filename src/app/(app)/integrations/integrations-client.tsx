'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Link2, Link2Off, Download, AlertCircle, Loader2 } from 'lucide-react'

interface ZohoIntegration {
  id: string
  zoho_user_name: string | null
  created_at: string
}

interface ImportResult {
  imported: number
  skipped: number
  total: number
}

function ZohoCard({ integration: initial }: { integration: ZohoIntegration | null }) {
  const params     = useSearchParams()
  const justLinked = params.get('success') === 'zoho'
  const linkError  = params.get('error')

  const [integration, setIntegration] = useState<ZohoIntegration | null>(initial)
  const [disconnecting, setDisconnecting]   = useState(false)
  const [importing, setImporting]           = useState(false)
  const [importResult, setImportResult]     = useState<ImportResult | null>(null)
  const [importError, setImportError]       = useState('')

  async function handleDisconnect() {
    if (!confirm('Disconnect Zoho Recruit? This will not delete your imported candidates.')) return
    setDisconnecting(true)
    await fetch('/api/integrations/zoho/disconnect', { method: 'DELETE' })
    setIntegration(null)
    setDisconnecting(false)
  }

  async function handleImport() {
    setImporting(true)
    setImportResult(null)
    setImportError('')
    const res  = await fetch('/api/integrations/zoho/import', { method: 'POST' })
    const data = await res.json()
    setImporting(false)
    if (!res.ok) { setImportError(data.error || 'Import failed.'); return }
    setImportResult(data)
  }

  const connected = !!integration

  return (
    <Card className="max-w-lg">
      {/* Header row */}
      <div className="flex items-start gap-4">
        {/* Zoho logo placeholder */}
        <div className="w-11 h-11 rounded-lg bg-[#e8f5e9] flex items-center justify-center shrink-0 text-lg font-bold text-[#2e7d32]">
          Z
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-ink">Zoho Recruit</h3>
            {connected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </span>
            )}
          </div>
          <p className="text-sm text-ink-secondary mt-0.5">
            Import candidates and sync your recruitment pipeline.
          </p>
          {connected && integration?.zoho_user_name && (
            <p className="text-xs text-ink-secondary mt-1">
              Signed in as <span className="font-medium">{integration.zoho_user_name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Status / error banners */}
      {justLinked && !linkError && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Zoho Recruit connected successfully!
        </div>
      )}
      {linkError === 'zoho_denied' && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Authorization was denied. Please try again.
        </div>
      )}
      {linkError === 'zoho_token' && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Token exchange failed. Check your ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET.
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          <span className="font-semibold">{importResult.imported} candidates imported</span>
          {importResult.skipped > 0 && ` · ${importResult.skipped} skipped`}
          {' '}→ view them in{' '}
          <a href="/candidates" className="underline font-medium">Candidates</a>
        </div>
      )}
      {importError && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {importError}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {connected ? (
          <>
            <Button
              onClick={handleImport}
              disabled={importing}
              variant="secondary"
              size="sm"
            >
              {importing
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing…</>
                : <><Download className="w-3.5 h-3.5" /> Import Candidates</>
              }
            </Button>
            <Button
              onClick={handleDisconnect}
              disabled={disconnecting}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {disconnecting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Link2Off className="w-3.5 h-3.5" />
              }
              Disconnect
            </Button>
          </>
        ) : (
          <a href="/api/integrations/zoho/auth">
            <Button size="sm">
              <Link2 className="w-3.5 h-3.5" />
              Connect Zoho Recruit
            </Button>
          </a>
        )}
      </div>

      {/* Setup note when not connected */}
      {!connected && (
        <p className="mt-3 text-xs text-ink-secondary">
          Requires <span className="font-medium">ZOHO_CLIENT_ID</span> and{' '}
          <span className="font-medium">ZOHO_CLIENT_SECRET</span> in your environment variables.
        </p>
      )}
    </Card>
  )
}

export default function IntegrationsClient({ zohoIntegration }: { zohoIntegration: ZohoIntegration | null }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-ink-secondary uppercase tracking-wide mb-3">ATS</h2>
        <ZohoCard integration={zohoIntegration} />
      </div>
    </div>
  )
}
