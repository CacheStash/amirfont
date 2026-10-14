/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'royal': ['"Royal Grande Variable"', 'serif'],
        'thanjavur': ['"Thanjavur Variable"', 'serif'],
        'mono': ['"Space Mono"', 'monospace'],
        'recursive': ['"Recursive"', 'sans-serif'],
        'inter': ['"Inter"', 'sans-serif'],
        'roboto-flex': ['"Roboto Flex"', 'sans-serif'],
      },
      colors: {
        'vintage': {
          'background': '#EDEBE6',
          'paper': '#F5F3EE',
          'ink': '#1a1a1a',
        },
      },
    },
  },
  plugins: [],
};
