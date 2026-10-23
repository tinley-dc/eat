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

        {/* 🎲 隨便按鈕（純色扁平無漸層，只放骰子 icon，不需文字） */}
        <div className="flex-shrink-0 px-2 relative -top-3">
          <button
            type="button"
            onClick={() => {
              onOpenRandomPicker();
              soundManager.playPop();
            }}
            title="隨機幫我挑一家好吃的"
            className={`flex items-center justify-center w-12 h-12 rounded-full cursor-pointer transition-all duration-200 active:scale-90 active:rotate-12 select-none shadow-md ${
              isChef
                ? 'bg-[#D85A2A] text-white ring-4 ring-[#FFFBF2] hover:bg-[#C24D20]'
                : 'bg-japandi-apricot text-white ring-4 ring-white hover:bg-japandi-apricot-dark'
            }`}
          >
            <Dices className="w-6 h-6 stroke-[2.2]" />
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
