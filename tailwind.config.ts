import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Charcoal — structural: sidebar, primary buttons, headings
        primary: {
          DEFAULT: '#1F2937', // gray-800 (brand mark bg)
          hover: '#111827',   // gray-900
          deep: '#111827',    // gray-900 (sidebar)
          soft: '#F3F4F6',    // gray-100 (selected/soft bg)
          faint: '#F9FAFB',   // gray-50 (ghost hover)
        },
        // Lime — the signal/AI accent (the "message delivered" tick)
        accent: {
          DEFAULT: '#A3E635', // lime-400 — fills, ticks, pulse (use with DARK text)
          hover: '#84CC16',   // lime-500 — button hover
          soft: '#ECFCCB',    // lime-100 — soft bg
          text: '#3F6212',    // lime-800 — text on light/soft bg
          icon: '#65A30D',    // lime-600 — icon/accent foreground on white
        },
        surface: {
          page: '#F9FAFB',         // gray-50
          card: '#FFFFFF',
          sunken: '#F3F4F6',       // gray-100
          border: '#E5E7EB',       // gray-200
          borderStrong: '#D1D5DB', // gray-300
        },
        ink: {
          DEFAULT: '#111827',   // gray-900
          secondary: '#4B5563', // gray-600 (the "Reply" wordmark tone)
          muted: '#9CA3AF',     // gray-400
          inverse: '#F9FAFB',
        },
        status: {
          placed: '#16A34A',
          placedBg: '#DCFCE7',
          placedText: '#14532D',
          process: '#F59E0B',
          processBg: '#FEF3C7',
          processText: '#78350F',
          dropped: '#DC2626',
          droppedBg: '#FEE2E2',
          droppedText: '#7F1D1D',
          newLead: '#1F2937',
          newLeadBg: '#F3F4F6',
          newLeadText: '#111827',
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(17, 24, 39, 0.06), 0 1px 3px rgba(17, 24, 39, 0.08)',
        raised: '0 4px 12px rgba(17, 24, 39, 0.10)',
      },
    },
  },
  plugins: [],
}

export default config
