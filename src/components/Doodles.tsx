import React from 'react';

// 繪本風：微笑小太陽 ☀️
export const DoodleSun: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="#E79A73" strokeWidth="4" strokeLinecap="round">
      <line x1="50" y1="12" x2="50" y2="4" />
      <line x1="50" y1="88" x2="50" y2="96" />
      <line x1="12" y1="50" x2="4" y2="50" />
      <line x1="88" y1="50" x2="96" y2="50" />
      <line x1="23" y1="23" x2="17" y2="17" />
      <line x1="77" y1="77" x2="83" y2="83" />
      <line x1="23" y1="77" x2="17" y2="83" />
      <line x1="77" y1="23" x2="83" y2="17" />
    </g>
    <circle cx="50" cy="50" r="28" fill="#FCE8A6" stroke="#E79A73" strokeWidth="3" />
    <circle cx="41" cy="48" r="3" fill="#3C3836" />
    <circle cx="59" cy="48" r="3" fill="#3C3836" />
    <ellipse cx="36" cy="54" rx="4" ry="2.5" fill="#F5A394" opacity="0.8" />
    <ellipse cx="64" cy="54" rx="4" ry="2.5" fill="#F5A394" opacity="0.8" />
    <path d="M 44 55 Q 50 61 56 55" stroke="#3C3836" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

// 繪本手繪空心小星星 ⭐
export const DoodleStar: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L14.8 8.2L21.5 9.1L16.5 13.8L17.8 20.5L12 17.2L6.2 20.5L7.5 13.8L2.5 9.1L9.2 8.2L12 2Z"
      stroke="#B0A495"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#FAF4EC"
    />
  </svg>
);

// 繪本小胡蘿蔔 🥕
export const DoodleCarrot: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 14C24 9 27 6 30 7C31 10 28 13 24 16" stroke="#7E9F85" strokeWidth="2.5" strokeLinecap="round" fill="#ABC5B5" />
    <path d="M25 12C28 9 32 8 33 11C33 14 30 15 25 15" stroke="#7E9F85" strokeWidth="2.5" strokeLinecap="round" fill="#ABC5B5" />
    <path
      d="M24 15C25 18 20 28 12 34C11 35 9 34 9 32C10 26 18 16 22 15C23 15 23.5 15 24 15Z"
      fill="#F4A261"
      stroke="#D87A36"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M19 19L16 20" stroke="#D87A36" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 24L14 25" stroke="#D87A36" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 繪本小草莓 🍓
export const DoodleStrawberry: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 11C18 7 22 7 24 11C26 8 30 9 30 13C26 14 22 14 16 11Z" fill="#7E9F85" />
    <path
      d="M14 13C26 11 30 18 27 27C24 33 20 35 19 35C18 35 14 33 11 27C8 18 12 13 14 13Z"
      fill="#E78878"
      stroke="#C85A48"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="18" r="1" fill="#FFF2EE" />
    <circle cx="22" cy="19" r="1" fill="#FFF2EE" />
    <circle cx="19" cy="24" r="1" fill="#FFF2EE" />
    <circle cx="15" cy="26" r="1" fill="#FFF2EE" />
    <circle cx="23" cy="27" r="1" fill="#FFF2EE" />
  </svg>
);

// 100% SVG 向量手刻印章：必點推薦 ★ (1:1 還原原版設計圖：橄欖草本綠、雙星環繞、手作紙質感)
export const MustOrderStamp: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    width="84"
    height="84"
    viewBox="0 0 80 80"
    className={`w-[78px] h-[78px] sm:w-[86px] sm:h-[86px] -rotate-6 filter drop-shadow-lg select-none transition-transform hover:rotate-0 hover:scale-105 shrink-0 ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 外圈手刻和風橄欖綠實心底 */}
    <circle cx="40" cy="40" r="38" fill="#828F5A" />
    {/* 內圈縫線虛線 */}
    <circle cx="40" cy="40" r="32" stroke="#FAF8F5" strokeWidth="1.8" strokeDasharray="3 2" opacity="0.9" />
    {/* 頂部星星 */}
    <text x="40" y="24" textAnchor="middle" fill="#FAF8F5" fontSize="10" fontWeight="900">
      ★
    </text>
    {/* 中間文字 */}
    <text x="40" y="37" textAnchor="middle" fill="#FAF8F5" fontSize="11.5" fontWeight="900" letterSpacing="1.2">
      MUST
    </text>
    <text x="40" y="50" textAnchor="middle" fill="#FAF8F5" fontSize="11.5" fontWeight="900" letterSpacing="1.2">
      ORDER
    </text>
    {/* 底部星星 */}
    <text x="40" y="64" textAnchor="middle" fill="#FAF8F5" fontSize="10" fontWeight="900">
      ★
    </text>
  </svg>
);

// 100% SVG 向量手刻印章：小心避雷 ⚠️ (1:1 還原原版設計圖：陶土磚紅、警示三角、連字排版)
export const WatchoutStamp: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    width="84"
    height="84"
    viewBox="0 0 80 80"
    className={`w-[78px] h-[78px] sm:w-[86px] sm:h-[86px] rotate-6 filter drop-shadow-lg select-none transition-transform hover:rotate-0 hover:scale-105 shrink-0 ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 外圈手刻陶土磚紅底 */}
    <circle cx="40" cy="40" r="38" fill="#BF705C" />
    {/* 內圈縫線虛線 */}
    <circle cx="40" cy="40" r="32" stroke="#FDF6F4" strokeWidth="1.8" strokeDasharray="3 2" opacity="0.9" />
    {/* 頂部三角形警示圖標 */}
    <g stroke="#FDF6F4" strokeWidth="1.8" strokeLinejoin="round" fill="none">
      <path d="M40 16 L47 28 L33 28 Z" />
      <line x1="40" y1="20" x2="40" y2="24" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="40" cy="26.2" r="0.7" fill="#FDF6F4" />
    </g>
    {/* 中間文字 */}
    <text x="40" y="42" textAnchor="middle" fill="#FDF6F4" fontSize="10" fontWeight="900" letterSpacing="0.8">
      WATCH-
    </text>
    <text x="40" y="55" textAnchor="middle" fill="#FDF6F4" fontSize="10.5" fontWeight="900" letterSpacing="1">
      OUT
    </text>
  </svg>
);

// 手繪小番茄 🍅 (同原圖左側塗鴉)
export const DoodleTomato: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12 C18 8, 14 6, 11 9" stroke="#7E9F85" strokeWidth="2" strokeLinecap="round" />
    <path d="M21 12 C23 8, 27 7, 29 10" stroke="#7E9F85" strokeWidth="2" strokeLinecap="round" />
    <circle cx="20" cy="24" r="13" fill="#E88365" stroke="#C8583B" strokeWidth="2" />
    <circle cx="16" cy="20" r="2" fill="#FAF4EC" opacity="0.6" />
  </svg>
);

// 手繪青蔥/西洋芹 🥬 (同原圖左下角塗鴉)
export const DoodleCelery: React.FC<{ className?: string }> = ({ className = "w-7 h-10" }) => (
  <svg viewBox="0 0 30 50" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 45 C12 30, 8 18, 5 6" stroke="#87A98F" strokeWidth="3" strokeLinecap="round" />
    <path d="M15 45 C17 28, 18 16, 17 5" stroke="#789B80" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M20 45 C20 32, 23 20, 26 8" stroke="#87A98F" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
);

// 手繪種子/麥粒 🌾 (同原圖隨機小點綴)
export const DoodleSeed: React.FC<{ className?: string }> = ({ className = "w-3 h-4" }) => (
  <svg viewBox="0 0 16 20" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="8" cy="10" rx="4" ry="7" fill="#E3B377" transform="rotate(25 8 10)" />
  </svg>
);

// 小廚神風：純白蓬蓬廚師帽 👨‍🍳
export const ChefHatIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 帽沿底座 */}
    <path d="M28 72 H72 V82 C72 84 70 86 68 86 H32 C30 86 28 84 28 82 Z" fill="#F8E392" stroke="#4A2613" strokeWidth="3.5" strokeLinejoin="round" />
    {/* 蓬蓬帽頂 */}
    <path
      d="M30 72 C22 70 14 62 16 50 C18 38 28 36 34 40 C34 32 40 20 52 20 C64 20 68 30 68 38 C74 34 82 36 84 48 C86 60 78 70 70 72 Z"
      fill="#FFFFFF"
      stroke="#4A2613"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* 陰影立體折線 */}
    <path d="M38 48 C39 58 40 68 40 72" stroke="#E6D3B3" strokeWidth="3" strokeLinecap="round" />
    <path d="M52 36 C52 50 51 64 51 72" stroke="#E6D3B3" strokeWidth="3" strokeLinecap="round" />
    <path d="M64 46 C63 56 62 66 62 72" stroke="#E6D3B3" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// 小廚神風勳章：主廚推薦 ★ CHEF'S PICK
export const ChefRecommendedStamp: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    width="88"
    height="88"
    viewBox="0 0 88 88"
    className={`w-[82px] h-[82px] sm:w-[90px] sm:h-[90px] -rotate-6 filter drop-shadow-md select-none transition-transform hover:rotate-0 hover:scale-105 shrink-0 ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 暖黃起司圓底與深棕邊 */}
    <circle cx="44" cy="44" r="41" fill="#F3A935" stroke="#4A2613" strokeWidth="3" />
    <circle cx="44" cy="44" r="34" stroke="#FFF7E6" strokeWidth="2" strokeDasharray="3.5 2.5" />
    {/* 小廚師帽圖案 */}
    <g transform="translate(30, 11) scale(0.28)">
      <path d="M28 72 H72 V82 C72 84 70 86 68 86 H32 C30 86 28 84 28 82 Z" fill="#F8E392" stroke="#4A2613" strokeWidth="6" />
      <path
        d="M30 72 C22 70 14 62 16 50 C18 38 28 36 34 40 C34 32 40 20 52 20 C64 20 68 30 68 38 C74 34 82 36 84 48 C86 60 78 70 70 72 Z"
        fill="#FFFFFF"
        stroke="#4A2613"
        strokeWidth="6"
      />
    </g>
    {/* 中間文字 */}
    <text x="44" y="47" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="900" letterSpacing="0.8" stroke="#4A2613" strokeWidth="1" paintOrder="stroke fill">
      CHEF
    </text>
    <text x="44" y="58" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="900" letterSpacing="0.5" stroke="#4A2613" strokeWidth="1" paintOrder="stroke fill">
      PICK ★
    </text>
    {/* 底部小字標籤 */}
    <rect x="23" y="63" width="42" height="13" rx="6.5" fill="#4A2613" />
    <text x="44" y="73" textAnchor="middle" fill="#F3A935" fontSize="8.5" fontWeight="900">
      招牌必點
    </text>
  </svg>
);

// 小廚神風勳章：小心避雷 ⚠️ WATCH OUT
export const ChefWatchoutStamp: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    width="88"
    height="88"
    viewBox="0 0 88 88"
    className={`w-[82px] h-[82px] sm:w-[90px] sm:h-[90px] rotate-6 filter drop-shadow-md select-none transition-transform hover:rotate-0 hover:scale-105 shrink-0 ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="44" cy="44" r="41" fill="#E86A43" stroke="#4A2613" strokeWidth="3" />
    <circle cx="44" cy="44" r="34" stroke="#FFF0EB" strokeWidth="2" strokeDasharray="3.5 2.5" />
    {/* 警示小三角 */}
    <g transform="translate(32, 13) scale(0.6)">
      <path d="M20 5 L36 32 L4 32 Z" fill="#FFDE59" stroke="#4A2613" strokeWidth="3.5" strokeLinejoin="round" />
      <line x1="20" y1="14" x2="20" y2="22" stroke="#4A2613" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="20" cy="27" r="2" fill="#4A2613" />
    </g>
    {/* 中間文字 */}
    <text x="44" y="47" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="900" letterSpacing="0.8" stroke="#4A2613" strokeWidth="1" paintOrder="stroke fill">
      WATCH
    </text>
    <text x="44" y="58" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900" letterSpacing="0.8" stroke="#4A2613" strokeWidth="1" paintOrder="stroke fill">
      OUT ⚠️
    </text>
    {/* 底部小字標籤 */}
    <rect x="23" y="63" width="42" height="13" rx="6.5" fill="#4A2613" />
    <text x="44" y="73" textAnchor="middle" fill="#FFDE59" fontSize="8.5" fontWeight="900">
      記得避開
    </text>
  </svg>
);



