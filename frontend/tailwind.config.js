/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			'persian-teal': '#1a3d47',
  			'persian-gold': '#f0c419',
  			'persian-dark': '#0f2933',
  			'persian-light': '#234854',
  			pd: {
  				ink: '#0E1A20',
  				'ink-2': '#4A5560',
  				'ink-3': '#8A949C',
  				canvas: '#FFFFFF',
  				surface: '#F6F5F2',
  				line: 'rgba(14, 26, 32, 0.08)',
  				action: '#B4232F',
  				'action-press': '#951B26',
  				'action-tint': '#FBEDEE',
  				gold: '#B8862B',
  				'gold-tint': '#FBF4E4',
  				teal: '#1A3D47',
  				veg: '#1E8E3E',
  				nonveg: '#A1341E',
  				success: '#1E8E3E',
  				warn: '#B26A00',
  				error: '#C62828'
  			}
  		},
  		boxShadow: {
  			'pd-1': '0 1px 2px rgba(14, 26, 32, 0.06), 0 2px 8px rgba(14, 26, 32, 0.04)',
  			'pd-2': '0 8px 24px rgba(14, 26, 32, 0.12)'
  		},
  		transitionTimingFunction: {
  			'pd-out': 'cubic-bezier(0.23, 1, 0.32, 1)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};