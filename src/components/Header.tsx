import React from 'react';
import { 
  Plus, 
  Cloud, 
  CloudCheck, 
  Database, 
  Dices,
  RefreshCw,
  Lock,
  Unlock
} from 'lucide-react';
import { DoodleSun, ChefHatIcon } from './Doodles';
import { soundManager } from '../utils/sound';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenRandomPicker: () => void;
  onOpenCloudModal: () => void;
  onOpenBackupModal: () => void;
  onResetToAll?: () => void;
  isCloudConnected: boolean;
  isSyncingCloud?: boolean;
  isAdminUnlocked?: boolean;
  onToggleAdminLock?: () => void;
  soundEnabled?: boolean;
  setSoundEnabled?: (enabled: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenRandomPicker,
  onOpenCloudModal,
  onOpenBackupModal,
  onResetToAll,
  isCloudConnected,
  isSyncingCloud = false,
  isAdminUnlocked = false,
  onToggleAdminLock,
}) => {
  const { theme } = useTheme();
  const isChef = theme === 'chef_menu';

  return (
    <header className={`sticky top-0 z-30 transition-all duration-300 ${
      isChef 
        ? 'bg-[#4A2613]/95 backdrop-blur-md border-b-4 border-[#F3A935] shadow-md' 
        : 'bg-[#F7F2EC]/95 backdrop-blur-md border-b border-[#E8E1D5]'
    }`}>
      {/* 小廚神模式頂部波浪與白玉波點裝飾飾條 */}
      {isChef && (
        <div className="h-2 w-full bg-[#F3A935] bg-[radial-gradient(#FFF9EE_1.5px,transparent_1.5px)] [background-size:10px_10px]" />
      )}

      <div className="max-w-6xl mx-auto px-3 sm:px-6 md:px-8 py-2 sm:py-3.5 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* 左側：微笑小太陽 / 蓬蓬廚師帽 ＋ 標題（點擊回首頁/全部） */}
        <div 
          onClick={() => {
            soundManager.playPop();
            onResetToAll?.();
          }}
          title="回全部名單"
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group select-none shrink-0"
        >
          {isChef ? (
            <ChefHatIcon className="w-7 h-7 sm:w-10 sm:h-10 shrink-0 group-hover:rotate-12 transition-transform drop-shadow" />
          ) : (
            <DoodleSun className="w-7 h-7 sm:w-10 sm:h-10 shrink-0 group-hover:scale-105 transition-transform" />
          )}

          <div className="shrink-0">
            <h1 className={`font-black text-base sm:text-xl tracking-tight flex items-center gap-1 leading-none whitespace-nowrap transition-colors ${
              isChef ? 'text-[#FFF8EE]' : 'text-japandi-text'
            }`}>
              今天吃什麼？
            </h1>
            <span className={`text-[10px] sm:text-xs font-black tracking-widest uppercase mt-0.5 hidden sm:block whitespace-nowrap transition-colors ${
              isChef ? 'text-[#F5B853]' : 'text-japandi-text-muted'
            }`}>
              {isChef ? '★ KIDS MENU 小小廚神 ★' : 'KIDS\' FOOD EXPLORER'}
            </span>
          </div>
        </div>

        {/* 右側：核心操作群 */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

          {/* 隨機挑選按鈕：隨便 🎲 */}
          <button
            onClick={() => { onOpenRandomPicker(); soundManager.playPop(); }}
            title="隨機幫我挑一家好吃的"
            className={`btn-pebble flex items-center justify-center gap-1 sm:gap-1.5 p-2 sm:px-4 sm:py-2 rounded-full font-black text-xs sm:text-sm shadow-soft transition-all whitespace-nowrap shrink-0 border ${
              isChef
                ? 'bg-[#F3A935]/25 hover:bg-[#F3A935]/35 active:bg-[#F3A935]/40 backdrop-blur-md text-[#FFE082] border-[#F3A935]/50'
                : 'bg-japandi-sage hover:bg-japandi-sage-dark text-white border-transparent'
            }`}
          >
            <Dices className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">隨便</span>
          </button>

          {/* Google 試算表雲端同步（隨時可見，方便跨裝置同步與設定） */}
          <button
            onClick={() => { onOpenCloudModal(); soundManager.playPop(); }}
            title={
              isSyncingCloud 
                ? '正在自動同步至 Google 試算表...' 
                : isCloudConnected 
                  ? 'Google 試算表已連線（點擊查看或同步）' 
                  : 'Google 試算表雲端設定 / 跨裝置同步'
            }
            className={`btn-pebble flex items-center justify-center gap-1 p-2 sm:px-3 sm:py-2 rounded-full border transition-all shadow-soft shrink-0 ${
              isChef
                ? isCloudConnected 
                  ? 'bg-emerald-400/25 text-emerald-300 border-emerald-400/40 backdrop-blur-md'
                  : 'bg-white/10 hover:bg-white/20 active:bg-white/25 backdrop-blur-md text-[#FFF4E0] border-white/20'
                : isCloudConnected 
                  ? 'bg-[#EBF3ED] text-japandi-sage-dark border-[#CDE1D3]'
                  : 'bg-white/90 text-japandi-text-muted border-[#EDE6DC] hover:bg-japandi-oat backdrop-blur-md'
            }`}
          >
            {isSyncingCloud ? (
              <RefreshCw className={`w-4 h-4 animate-spin ${isChef ? 'text-amber-300' : 'text-japandi-sage'}`} />
            ) : isCloudConnected ? (
              <CloudCheck className={`w-4 h-4 ${isChef ? 'text-emerald-300' : 'text-japandi-sage'}`} />
            ) : (
              <Cloud className="w-4 h-4" />
            )}
            <span className="hidden sm:inline font-bold text-xs sm:text-sm">
              {isCloudConnected ? '已連線' : '雲端'}
            </span>
          </button>

          {/* 未解鎖模式：顯示「🔒 管理」按鈕 */}
          {!isAdminUnlocked && onToggleAdminLock && (
            <button
              onClick={() => { onToggleAdminLock(); soundManager.playPop(); }}
              title="管理模式（新增、編輯、備份）"
              className={`btn-pebble flex items-center justify-center gap-1 sm:gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm border transition-all shadow-soft select-none shrink-0 ${
                isChef
                  ? 'bg-white/10 hover:bg-white/20 active:bg-white/25 text-[#FFF4E0] border-white/20 backdrop-blur-md'
                  : 'bg-white/90 hover:bg-japandi-oat text-japandi-text-muted hover:text-japandi-text border-[#EDE6DC] backdrop-blur-md'
              }`}
            >
              <Lock className="w-4 h-4 text-japandi-apricot shrink-0" />
              <span className="hidden sm:inline">管理</span>
            </button>
          )}

          {/* 已解鎖管理模式：顯示管理功能按鈕 */}
          {isAdminUnlocked && (
            <>
              {/* 新增店家按鈕 */}
              <button
                onClick={() => { onOpenAddModal(); soundManager.playPop(); }}
                title="新增店家"
                className={`btn-pebble flex items-center justify-center gap-1 p-2 sm:px-3.5 sm:py-2 rounded-full font-black text-xs sm:text-sm shadow-soft transition-all whitespace-nowrap shrink-0 border ${
                  isChef
                    ? 'bg-[#E86A43]/25 hover:bg-[#E86A43]/35 active:bg-[#E86A43]/40 backdrop-blur-md text-[#FFCCBC] border-[#E86A43]/50'
                    : 'bg-japandi-apricot hover:bg-japandi-apricot-dark text-white border-transparent'
                }`}
              >
                <Plus className="w-4 h-4 stroke-[3] shrink-0" />
                <span className="hidden sm:inline">加店家</span>
              </button>

              {/* 備份管理 */}
              <button
                onClick={() => { onOpenBackupModal(); soundManager.playPop(); }}
                title="備份與資料管理"
                className={`p-2 rounded-full border transition-all shadow-soft shrink-0 ${
                  isChef
                    ? 'bg-white/10 hover:bg-white/20 active:bg-white/25 backdrop-blur-md text-[#FFF4E0] border-white/20'
                    : 'bg-white/90 text-japandi-text-muted hover:text-japandi-text hover:bg-japandi-oat backdrop-blur-md border-[#EDE6DC]'
                }`}
              >
                <Database className="w-4 h-4" />
              </button>

              {/* 一鍵上鎖（返回兒童安全瀏覽模式） */}
              {onToggleAdminLock && (
                <button
                  onClick={() => { onToggleAdminLock(); soundManager.playPop(); }}
                  title="點擊立即鎖定（保護資料，避免小朋友誤觸）"
                  className={`btn-pebble flex items-center justify-center gap-1 p-2 sm:px-3 sm:py-2 rounded-full font-bold text-xs border transition-all shadow-soft select-none shrink-0 ${
                    isChef
                      ? 'bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-200 border-emerald-400/40 backdrop-blur-md'
                      : 'bg-[#EBF3ED] hover:bg-[#DDECE0] text-japandi-sage-dark border-[#CDE1D3] backdrop-blur-md'
                  }`}
                >
                  <Unlock className="w-4 h-4 text-japandi-sage shrink-0" />
                  <span className="hidden sm:inline">鎖定</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
