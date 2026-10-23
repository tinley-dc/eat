import React from 'react';
import { UtensilsCrossed, Store } from 'lucide-react';
import { soundManager } from '../utils/sound';
import { useTheme } from '../context/ThemeContext';

interface BottomNavProps {
  viewMode: 'menu' | 'store';
  onToggleViewMode: (mode: 'menu' | 'store') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  viewMode,
  onToggleViewMode,
}) => {
  const { theme } = useTheme();
  const isChef = theme === 'chef_menu';

  return (
    <nav 
      aria-label="手機瀏覽模式切換"
      className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-300 border-t ${
        isChef
          ? 'bg-[#3E1F0E]/95 backdrop-blur-md border-[#F3A935]/30 shadow-[0_-4px_24px_rgba(0,0,0,0.25)]'
          : 'bg-[#FDFBF7]/95 backdrop-blur-md border-[#E8E1D5] shadow-[0_-4px_20px_rgba(45,42,38,0.06)]'
      }`}
    >
      <div className="max-w-md mx-auto grid grid-cols-2 gap-2.5">
        {/* 📋 美味佳餚 Tab */}
        <button
          type="button"
          onClick={() => {
            onToggleViewMode('menu');
            soundManager.playPop();
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-black text-sm transition-all duration-200 cursor-pointer ${
            viewMode === 'menu'
              ? (isChef
                  ? 'bg-[#D85A2A] text-white shadow-md scale-[1.02]'
                  : 'bg-japandi-sage text-white shadow-soft scale-[1.02]')
              : (isChef
                  ? 'text-[#C9A68F] hover:text-[#FFF8EE] active:bg-white/10'
                  : 'text-japandi-text-muted hover:text-japandi-text active:bg-japandi-oat')
          }`}
        >
          <UtensilsCrossed className="w-4 h-4 shrink-0" />
          <span>美味佳餚</span>
        </button>

        {/* 🏪 餐廳資訊 Tab */}
        <button
          type="button"
          onClick={() => {
            onToggleViewMode('store');
            soundManager.playPop();
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-black text-sm transition-all duration-200 cursor-pointer ${
            viewMode === 'store'
              ? (isChef
                  ? 'bg-[#D85A2A] text-white shadow-md scale-[1.02]'
                  : 'bg-japandi-sage text-white shadow-soft scale-[1.02]')
              : (isChef
                  ? 'text-[#C9A68F] hover:text-[#FFF8EE] active:bg-white/10'
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
