/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: '#090d16',
          card: '#111726',
          cardHover: '#172033',
          border: '#1e293b',
          borderHover: '#334155',
          primary: '#6366f1',
          primaryHover: '#4f46e5',
          accent: '#22d3ee',
          success: '#34d399',
          warning: '#fbbf24',
          danger: '#fb7185',
          muted: '#94a3b8',
          text: '#f1f5f9',
          textSecondary: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        fintech: '0 20px 40px -28px rgba(0, 0, 0, 0.55)',
        'fintech-lg': '0 24px 50px -28px rgba(0, 0, 0, 0.65)',
        'glow-primary': '0 0 24px rgba(99, 102, 241, 0.22)',
        'glow-success': '0 0 24px rgba(52, 211, 153, 0.22)',
      },
    },
  },
  plugins: [],
};
