'use client'

import { useState } from 'react'
import { Settings, User, Bell, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TONE_LABELS } from '@/lib/utils'
import { Tone } from '@/types'

const TONES: Tone[] = ['formal', 'friendly', 'hinglish']

export default function SettingsPage() {
  const [tone, setTone] = useState<Tone>('friendly')
  const [name, setName] = useState('Sneha Sharma')
  const [company, setCompany] = useState('')

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-400" /> Settings
        </h1>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-4">
            <User className="w-4 h-4 text-gray-400" /> Profile
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest block mb-1.5">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest block mb-1.5">Company / Consultancy Name</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Optional"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-green-500/50"
              />
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-4">
            <Bell className="w-4 h-4 text-gray-400" /> Preferences
          </h2>
          <div>
            <label className="text-xs font-mono text-gray-500 uppercase tracking-widest block mb-2">Default Tone</label>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${
                    tone === t
                      ? 'border-green-500/60 bg-green-500/10 text-green-400'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {TONE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Billing */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-4">
            <CreditCard className="w-4 h-4 text-gray-400" /> Billing
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Free Plan</p>
              <p className="text-xs text-gray-500 mt-0.5">50 replies / month</p>
            </div>
            <Button variant="secondary" size="sm">Manage Billing</Button>
          </div>
        </section>

        <Button className="w-full">Save Changes</Button>
      </div>
    </div>
  )
}
