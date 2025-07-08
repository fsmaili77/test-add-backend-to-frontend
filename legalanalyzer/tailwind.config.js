/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#1E3A8A', // Deep judicial blue - blue-800
        'secondary': '#64748B', // Sophisticated slate - slate-500
        'accent': '#F59E0B', // Warm amber - amber-500
        'background': '#FAFBFC', // Soft off-white - gray-50
        'surface': '#FFFFFF', // Pure white - white
        'text-primary': '#1F2937', // Rich charcoal - gray-800
        'text-secondary': '#6B7280', // Muted gray - gray-500
        'success': '#10B981', // Professional emerald - emerald-500
        'warning': '#F59E0B', // Consistent amber - amber-500
        'error': '#DC2626', // Clear red - red-600
        'border-light': '#E5E7EB', // Hairline border - gray-200
        'border-medium': '#D1D5DB', // Medium border - gray-300
      },
      fontFamily: {
        'heading': ['Inter', 'sans-serif'],
        'body': ['Source Sans Pro', 'sans-serif'],
        'caption': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'elevation-1': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'elevation-2': '0 4px 6px rgba(0, 0, 0, 0.05)',
        'elevation-3': '0 10px 15px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-in': 'slideIn 300ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}