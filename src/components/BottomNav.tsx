import React from 'react';
import { UtensilsCrossed, Store, Dices } from 'lucide-react';
import { soundManager } from '../utils/sound';
import { useTheme } from '../context/ThemeContext';

interface BottomNavProps {
  viewMode: 'menu' | 'store';
  onToggleViewMode: (mode: 'menu' | 'store') => void;
  onOpenRandomPicker: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  viewMode,
  onToggleViewMode,
  onOpenRandomPicker,
}) => {
  const { theme } = useTheme();
  const isChef = theme === 'chef_menu';

  return (
    <nav 
      aria-label="手機底部導覽列"
      className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-all duration-300 border-t ${
        isChef
          ? 'bg-[#FFFBF2]/95 backdrop-blur-xl border-[#F1E0CD] shadow-[0_-8px_24px_rgba(138,90,56,0.08)]'
          : 'bg-white/95 backdrop-blur-xl border-[#EFECE6] shadow-[0_-8px_24px_rgba(45,42,38,0.06)]'
      }`}
    >
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {/* 📋 美味佳餚 Tab */}
        <button
          type="button"
          onClick={() => {
            onToggleViewMode('menu');
            soundManager.playPop();
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
            viewMode === 'menu'
              ? (isChef
                  ? 'bg-[#FDEFD9] text-[#D85A2A] shadow-sm font-black'
                  : 'bg-[#EEF4EF] text-japandi-sage-dark shadow-sm font-black')
              : (isChef
                  ? 'text-[#9C7E6C] hover:text-[#5B3926] active:bg-[#F8EFE4]'
                  : 'text-japandi-text-muted hover:text-japandi-text active:bg-japandi-oat')
          }`}
        >
          <UtensilsCrossed className="w-4 h-4 shrink-0" />
          <span>美味佳餚</span>
        </button>

        {/* 🎲 隨便逗趣大按鈕（凸起懸浮 FAB） */}
        <div className="flex-shrink-0 px-2.5 relative -top-3.5">
          <button
            type="button"
            onClick={() => {
              onOpenRandomPicker();
              soundManager.playPop();
            }}
            title="隨機幫我挑一家好吃的"
            className={`group relative flex flex-col items-center justify-center w-14 h-14 rounded-full text-white cursor-pointer transition-all duration-200 active:scale-90 active:rotate-6 select-none ${
              isChef
                ? 'bg-gradient-to-tr from-[#E26618] via-[#F3911E] to-[#FFA834] shadow-[0_6px_18px_rgba(243,145,30,0.45)] ring-4 ring-[#FFFBF2]'
                : 'bg-gradient-to-tr from-japandi-terracotta via-japandi-apricot to-[#FFA07A] shadow-[0_6px_18px_rgba(235,134,103,0.45)] ring-4 ring-white'
            }`}
          >
            <Dices className="w-5 h-5 -rotate-6 group-hover:rotate-45 group-active:scale-110 transition-transform duration-300 drop-shadow-sm" />
            <span className="text-[10px] font-black tracking-tight leading-none mt-0.5 drop-shadow-sm">
              隨便！
            </span>
          </button>
        </div>

        {/* 🏪 餐廳資訊 Tab */}
        <button
          type="button"
          onClick={() => {
            onToggleViewMode('store');
            soundManager.playPop();
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
            viewMode === 'store'
              ? (isChef
                  ? 'bg-[#FDEFD9] text-[#D85A2A] shadow-sm font-black'
                  : 'bg-[#EEF4EF] text-japandi-sage-dark shadow-sm font-black')
              : (isChef
                  ? 'text-[#9C7E6C] hover:text-[#5B3926] active:bg-[#F8EFE4]'
                  : 'text-japandi-text-muted hover:text-japandi-text active:bg-japandi-oat')
          }`}
        >
          <Store className="w-4 h-4 shrink-0" />
          <span>餐廳資訊</span>
        </button>
      </div>
    </nav>
  );
};
