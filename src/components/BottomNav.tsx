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
      className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] transition-all duration-300 border-t ${
        isChef
          ? 'bg-[#FFFBF2]/95 backdrop-blur-md border-[#F1E0CD] shadow-[0_-2px_12px_rgba(138,90,56,0.06)]'
          : 'bg-white/95 backdrop-blur-md border-[#EFECE6] shadow-[0_-2px_12px_rgba(45,42,38,0.05)]'
      }`}
    >
      <div className="max-w-sm mx-auto flex items-center justify-between gap-2 relative">
        {/* 📋 美味佳餚 Tab */}
        <button
          type="button"
          onClick={() => {
            onToggleViewMode('menu');
            soundManager.playPop();
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl font-black text-xs transition-all duration-200 cursor-pointer ${
            viewMode === 'menu'
              ? (isChef
                  ? 'bg-[#FDEFD9] text-[#D85A2A] shadow-xs'
                  : 'bg-[#EEF4EF] text-japandi-sage-dark shadow-xs')
              : (isChef
                  ? 'text-[#9C7E6C] hover:text-[#5B3926] active:bg-[#F8EFE4]'
                  : 'text-japandi-text-muted hover:text-japandi-text active:bg-japandi-oat')
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
          <span>美味佳餚</span>
        </button>

        {/* 🎲 隨便按鈕（微幅向上微凸約 8px，精緻小巧不擋版面） */}
        <div className="relative -top-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              onOpenRandomPicker();
              soundManager.playPop();
            }}
            title="隨機幫我挑一家好吃的"
            className={`flex items-center justify-center w-10.5 h-10.5 rounded-full cursor-pointer transition-all duration-200 active:scale-90 active:rotate-12 select-none shadow-md shrink-0 ${
              isChef
                ? 'bg-[#D85A2A] text-white ring-3 ring-[#FFFBF2] hover:bg-[#C24D20]'
                : 'bg-japandi-apricot text-white ring-3 ring-white hover:bg-japandi-apricot-dark'
            }`}
          >
            <Dices className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* 🏪 餐廳資訊 Tab */}
        <button
          type="button"
          onClick={() => {
            onToggleViewMode('store');
            soundManager.playPop();
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl font-black text-xs transition-all duration-200 cursor-pointer ${
            viewMode === 'store'
              ? (isChef
                  ? 'bg-[#FDEFD9] text-[#D85A2A] shadow-xs'
                  : 'bg-[#EEF4EF] text-japandi-sage-dark shadow-xs')
              : (isChef
                  ? 'text-[#9C7E6C] hover:text-[#5B3926] active:bg-[#F8EFE4]'
                  : 'text-japandi-text-muted hover:text-japandi-text active:bg-japandi-oat')
          }`}
        >
          <Store className="w-3.5 h-3.5 shrink-0" />
          <span>餐廳資訊</span>
        </button>
      </div>
    </nav>
  );
};
