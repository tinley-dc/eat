/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        japandi: {
          bg: '#FAF7F2',             // 溫潤米紙畫布
          card: '#FFFFFF',           // 純淨白卡
          border: '#EDE6DC',         // 溫柔米灰邊界
          sage: '#7E9F85',           // 北歐鼠尾草綠 (主色/必點)
          'sage-light': '#F0F5F1',
          'sage-dark': '#55735B',
          apricot: '#F4A261',        // 柔霧杏桃暖橙 (活力副色)
          'apricot-light': '#FDF4ED',
          'apricot-dark': '#D87A36',
          terracotta: '#D47A6B',     // 陶土粉橘 (溫和避雷色)
          'terracotta-light': '#FAECE9',
          'terracotta-dark': '#A84C3E',
          butter: '#FCE8A6',         // 溫暖奶油鵝黃
          lavender: '#9FAEC2',       // 柔霧灰薰衣草藍
          oat: '#F3EFEA',            // 燕麥裸色
          wood: '#B08968',           // 溫潤原木棕
          text: '#2D2A26',           // 深焙咖啡文字
          'text-muted': '#7D756D',   // 溫柔灰褐次要字
        }
      },
      fontFamily: {
        comic: ['"Nunito"', '"Noto Sans TC"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'pebble': '28px',
        'pebble-lg': '36px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(45, 42, 38, 0.05)',
        'float': '0 10px 30px -4px rgba(45, 42, 38, 0.08)',
        'wood': '0 6px 0 #9E7454',
        'wood-active': '0 2px 0 #9E7454',
      }
    },
  },
  plugins: [],
}
