/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          light: '#3b82f6',   // blue-500
          dark: '#1d4ed8',    // blue-700
          '50': '#eff6ff',
          '100': '#dbeafe',
        },
        secondary: {
          DEFAULT: '#6b7280', // gray-500
          light: '#9ca3af',   // gray-400
          dark: '#4b5563',    // gray-600
        },
        accent: {
          DEFAULT: '#f59e0b', // amber-500
          dark: '#b45309',    // amber-700
        },
        success: {
          DEFAULT: '#16a34a', // green-600
          light: '#22c55e',   // green-500
          '50': '#f0fdf4',
          '100': '#dcfce7',
        },
        danger: {
          DEFAULT: '#dc2626', // red-600
          light: '#ef4444',   // red-500
          '50': '#fef2f2',
          '100': '#fee2e2',
        },
        warning: {
          DEFAULT: '#f97316', // orange-500
          '100': '#ffedd5',
        },
        slate: {
          '50': '#f8fafc',
          '100': '#f1f5f9',
          '200': '#e2e8f0',
          '300': '#cbd5e1',
          '400': '#94a3b8',
          '500': '#64748b',
          '600': '#475569',
          '700': '#334155',
          '800': '#1e293b',
          '900': '#0f172a',
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
