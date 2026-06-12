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
        primary: {
          DEFAULT: '#1D4ED8',
          hover: '#1E40AF',
          deep: '#1E3A8A',
          soft: '#DBEAFE',
          faint: '#EFF6FF',
        },
        accent: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          soft: '#FEF3C7',
          text: '#78350F',
        },
        surface: {
          page: '#F8FAFC',
          card: '#FFFFFF',
          sunken: '#F1F5F9',
          border: '#E2E8F0',
          borderStrong: '#CBD5E1',
        },
        ink: {
          DEFAULT: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
          inverse: '#F8FAFC',
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
          newLead: '#1D4ED8',
          newLeadBg: '#DBEAFE',
          newLeadText: '#1E3A8A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.08)',
        raised: '0 4px 12px rgba(15, 23, 42, 0.10)',
      },
    },
  },
  plugins: [],
}

export default config
