/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './playground/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    { pattern: /grid-/ },
    { pattern: /(col|row)-/ },
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        '64': 'repeat(64, minmax(0, 1fr))',
      },

      gridTemplateRows: {
        '64': 'repeat(64, minmax(0, 1fr))',
      },

      gridRow: Array.from({ length: 52 }).reduce((r, _, i) => {
        const k = 12 + i + 1
        r[`span-${k}`] = `span ${k} / span ${k}`
        return r
      }, {}),

      gridColumn: Array.from({ length: 52 }).reduce((r, _, i) => {
        const k = 12 + i + 1
        r[`span-${k}`] = `span ${k} / span ${k}`
        return r
      }, {}),
    },
  },
  plugins: [],
}