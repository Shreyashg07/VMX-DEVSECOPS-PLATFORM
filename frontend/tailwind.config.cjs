module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0b1020',
        neon: '#6ee7ff'
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        'neon-glow': '0 0 16px rgba(110,231,255,0.12), 0 0 32px rgba(110,231,255,0.06)'
      }
    }
  },
  plugins: [],
}
