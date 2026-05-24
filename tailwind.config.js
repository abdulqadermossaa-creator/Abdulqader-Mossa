/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0e1116',
        'bg-elev': '#161a22',
        'bg-card': '#1c2230',
        border: '#2a3142',
        accent: '#d4a574',
        'accent-2': '#e8c9a0',
        text: '#e8eaed',
        muted: '#8b94a3',
        success: '#5fb878',
        danger: '#e56b6f',
        warning: '#f0c674',
        info: '#6eb5ff',
      },
      fontFamily: {
        tajawal: ['Tajawal', 'sans-serif'],
        'reem-kufi': ['Reem Kufi', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease',
        'fade-in': 'fadeIn 0.5s ease',
      },
      keyframes: {
        slideIn: {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'qlivn-bg':
          'radial-gradient(circle at 20% 10%, rgba(212,165,116,0.06) 0%, transparent 40%), radial-gradient(circle at 80% 90%, rgba(212,165,116,0.04) 0%, transparent 40%)',
      },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,0.3)',
        glow: '0 0 8px rgba(95,184,120,0.6)',
        'glow-accent': '0 0 12px rgba(212,165,116,0.4)',
      },
    },
  },
  plugins: [],
}
