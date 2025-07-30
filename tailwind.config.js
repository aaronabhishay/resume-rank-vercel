/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        violet: {
          DEFAULT: 'hsl(var(--violet))',
          foreground: 'hsl(var(--violet-foreground))'
        },
        indigo: {
          DEFAULT: 'hsl(var(--indigo))',
          foreground: 'hsl(var(--indigo-foreground))'
        }
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-primary-subtle': 'var(--gradient-primary-subtle)',
        'gradient-background': 'var(--gradient-background)',
        'gradient-glow': 'var(--gradient-glow)',
        'gradient-premium': 'var(--gradient-premium)',
        'gradient-hero': 'var(--gradient-hero)',
        'hero-pattern': 'var(--hero-pattern)'
      },
      boxShadow: {
        'premium': 'var(--shadow-premium)',
        'premium-lg': 'var(--shadow-premium-lg)',
        'glow': 'var(--shadow-glow)',
        'glow-primary': 'var(--shadow-glow-primary)',
        'glow-violet': 'var(--shadow-glow-violet)'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        'fadeIn': {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        },
        'cosmic-pulse': {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' }
        },
        'slideUp': {
          'from': { opacity: '0', transform: 'translateY(60px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        },
        'scaleIn': {
          'from': { opacity: '0', transform: 'scale(0.9)' },
          'to': { opacity: '1', transform: 'scale(1)' }
        },
        'blurIn': {
          'from': { opacity: '0', filter: 'blur(10px)' },
          'to': { opacity: '1', filter: 'blur(0)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'cosmic-pulse': 'cosmic-pulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up-delay': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
        'scale-in': 'scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'blur-in': 'blurIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};

