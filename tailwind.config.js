/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#2A2320',
        paper: '#FBF6EE',
        card: '#FFFFFF',
        brand: {
          DEFAULT: '#B3262E',
          50: '#FBEDEE',
          100: '#F6DADB',
          600: '#B3262E',
          700: '#971E25'
        },
        money: '#1E7B41',
        warn: '#B4761A',
        danger: '#C0392B',
        line: '#EDE3D6'
      },
      boxShadow: {
        soft: '0 1px 2px rgba(42,35,32,0.06), 0 6px 18px rgba(42,35,32,0.06)',
        sheet: '0 -8px 30px rgba(42,35,32,0.18)'
      },
      borderRadius: { xl2: '1.25rem' },
      maxWidth: { app: '480px' }
    }
  },
  plugins: []
};
