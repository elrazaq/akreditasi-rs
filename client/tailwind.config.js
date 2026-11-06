/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nordic: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#14B8A6',
          600: '#0D9488', // Medical Teal Primary
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        navy: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        surface: {
          base: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'diffuse': '0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
        'diffuse-lg': '0 20px 40px -8px rgba(15, 23, 42, 0.12), 0 6px 16px -3px rgba(15, 23, 42, 0.05)',
        'glow-teal': '0 8px 24px -4px rgba(13, 148, 136, 0.25)',
        'glow-amber': '0 8px 24px -4px rgba(245, 158, 11, 0.25)',
        'modal': '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
