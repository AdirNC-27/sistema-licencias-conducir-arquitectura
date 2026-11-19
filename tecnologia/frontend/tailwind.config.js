/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marca: { DEFAULT: '#1E4FD8', oscuro: '#0B2A6F', claro: '#E8EFFF' },
        acento: { DEFAULT: '#FF7A00', fuerte: '#CC4E00', claro: '#FFF1E4' },
        fondo: '#F5F8FF',
      },
      fontFamily: { sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
