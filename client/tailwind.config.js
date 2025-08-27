/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        foreground: '#ffffff',
        primary: '#3b82f6',
        'primary-foreground': '#ffffff',
        secondary: '#1e1e1e',
        'secondary-foreground': '#ffffff',
        muted: '#2a2a2a',
        'muted-foreground': '#a1a1aa',
        accent: '#3b82f6',
        'accent-foreground': '#ffffff',
        destructive: '#ef4444',
        'destructive-foreground': '#ffffff',
        border: '#2a2a2a',
        input: '#2a2a2a',
        ring: '#3b82f6',
      },
    },
  },
  plugins: [],
}
