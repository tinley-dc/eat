import React, { useState, useMemo } from 'react';
import { Restaurant, CategoryItem, PRESET_CATEGORIES } from '../types';
import { DoodleSun, ChefHatIcon } from './Doodles';
import { X, Dices, ArrowRight, RotateCcw, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';
import { useTheme } from '../context/ThemeContext';
import { SafeImage } from './SafeImage';

interface CategoryRandomPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
  categories?: CategoryItem[];
}

export const CategoryRandomPickerModal: React.FC<CategoryRandomPickerModalProps> = ({
  isOpen,
  onClose,
  restaurants,
  onSelectRestaurant,
  categories,
}) => {
  const { theme } = useTheme();
  const isChef = theme === 'chef_menu';

  // 選取的分類集合（預設為全部）
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [isPicking, setIsPicking] = useState<boolean>(false);
  const [winner, setWinner] = useState<Restaurant | null>(null);

  // 可選分類列表 (排除 '全部')
  const availableCategories = useMemo(() => {
    const list = categories || PRESET_CATEGORIES;
    return list.filter(c => c.id !== 'all');
  }, [categories]);

  // 根據勾選分類過濾後的候選名單
  const candidates = useMemo(() => {
    if (selectedCats.length === 0) {
      return restaurants; // 若沒勾選特定分類，預設從全部店家挑選
    }
    return restaurants.filter(r => 
      r.categories.some(c => selectedCats.includes(c))
    );
  }, [restaurants, selectedCats]);

  if (!isOpen) return null;

  // 切換勾選分類
  const toggleCat = (catName: string) => {
    soundManager.playPop();
    if (selectedCats.includes(catName)) {
      setSelectedCats(selectedCats.filter(c => c !== catName));
    } else {
      setSelectedCats([...selectedCats, catName]);
    }
    setWinner(null);
  };

  // 全選 / 清空分類
  const selectAll = () => {
    soundManager.playPop();
    setSelectedCats(availableCategories.map(c => c.name));
    setWinner(null);
  };

  const clearAll = () => {
    soundManager.playPop();
    setSelectedCats([]);
    setWinner(null);
  };

  // 開始隨機挑選
  const handlePick = () => {
    if (candidates.length === 0 || isPicking) return;

    setIsPicking(true);
    setWinner(null);
    soundManager.playPop();

    // 趣味隨機滾動音效
    let count = 0;
    const interval = setInterval(() => {
      soundManager.playTick();
      count++;
      if (count > 8) {
        clearInterval(interval);
      }
    }, 100);

    setTimeout(() => {
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      setWinner(picked);
      setIsPicking(false);
      soundManager.playVictory();

      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 },
        colors: isChef
          ? ['#F3A935', '#E86A43', '#2D7A46', '#D86824', '#FFFDF9', '#4A2613']
          : ['#8FAFA0', '#E79A73', '#E5CE93', '#D89184', '#FAF7F2']
      });
    }, 1000);
  };

  const winnerLike = winner?.dishes.filter(d => d.opinion === 'like') || [];
  const winnerDislike = winner?.dishes.filter(d => d.opinion === 'dislike') || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`rounded-[36px] max-w-xl w-full max-h-[92vh] overflow-y-auto no-scrollbar shadow-float border flex flex-col relative animate-scaleUp p-5 sm:p-7 transition-colors ${
          isChef
            ? 'bg-[#FFFDF9] border-2 border-[#EFE5D8] text-[#4A2613]'
            : 'bg-[#FAF7F2] border border-[#E5DDD2] text-japandi-text'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 關閉按鈕 */}
        <button
          onClick={() => { onClose(); soundManager.playPop(); }}
          className={`absolute top-5 right-5 p-2 rounded-full transition-transform hover:scale-105 border shadow-soft ${
            isChef
              ? 'bg-white hover:bg-[#FFF9EE] text-[#7A543E] hover:text-[#4A2613] border-2 border-[#EADFCF]'
              : 'bg-white/90 hover:bg-white text-japandi-text-muted border border-[#EDE6DC]'
          }`}
          aria-label="關閉"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* 標題與圖標 */}
        <div className="flex items-center gap-3 mb-2">
          {isChef ? (
            <div className="w-12 h-12 rounded-2xl bg-[#FFF8EE] border-2 border-[#F5DFC3] flex items-center justify-center shrink-0 shadow-sm transition-transform hover:rotate-6">
              <ChefHatIcon className="w-8 h-8" />
            </div>
          ) : (
            <DoodleSun className="w-10 h-10 shrink-0 animate-float" />
          )}
          <div>
            <span className={`text-xs font-black tracking-widest uppercase block ${
              isChef ? 'text-[#D86824]' : 'text-japandi-sage-dark'
            }`}>
              {isChef ? '★ CHEF\'S LUCKY PICK 幸運挑選 ★' : 'RANDOM MEAL PICKER'}
            </span>
            <h2 className={`text-2xl font-black tracking-tight flex items-center gap-2 ${
              isChef ? 'text-[#4A2613]' : 'text-japandi-text'
            }`}>
              <span>{isChef ? '今天吃什麼？主廚幫你挑！' : '今天吃什麼？幫你挑！'}</span>
            </h2>
          </div>
        </div>

        <p className={`text-sm sm:text-base mb-4 font-medium ${
          isChef ? 'text-[#7A543E]' : 'text-japandi-text-muted'
        }`}>
          點選今天想吃的類別（可多選），我們從這些範圍裡幫你隨機決定～
        </p>

        {/* 分類篩選區域 */}
        <div className={`rounded-[28px] border-2 p-4 sm:p-5 mb-4 shadow-soft transition-colors ${
          isChef
            ? 'bg-[#FFF8EE] border-[#F2E4D2]'
            : 'bg-white/80 border-[#EDE6DC]'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-black flex items-center gap-1.5 ${
              isChef ? 'text-[#4A2613]' : 'text-japandi-text'
            }`}>
              <span>🎯 想在哪些類別裡挑選？</span>
            </span>
            <div className="flex gap-2.5 text-sm">
              <button
                type="button"
                onClick={selectAll}
                className={`font-black hover:underline cursor-pointer transition-colors ${
                  isChef ? 'text-[#D85A2A] hover:text-[#B64215]' : 'text-japandi-sage-dark'
                }`}
              >
                全選
              </button>
              <span className={isChef ? 'text-[#D5C2B0]' : 'text-japandi-text-muted'}>|</span>
              <button
                type="button"
                onClick={clearAll}
                className={`font-bold hover:underline cursor-pointer transition-colors ${
                  isChef ? 'text-[#A87B60] hover:text-[#4A2613]' : 'text-japandi-text-muted'
                }`}
              >
                清空
              </button>
            </div>
          </div>

          {/* 分類選項按鈕群 */}
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((cat) => {
              const isChecked = selectedCats.includes(cat.name);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCat(cat.name)}
                  className={`btn-pebble flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-black border-2 transition-all cursor-pointer ${
                    isChecked
                      ? isChef
                        ? 'bg-[#F3A935] text-[#3E1F0D] border-[#E29520] shadow-sm scale-[1.02]'
                        : 'bg-japandi-sage text-white border-japandi-sage-dark shadow-soft scale-[1.02]'
                      : isChef
                        ? 'bg-white text-[#7A543E] border-[#EADFCF] hover:bg-[#FFF9EE] hover:border-[#D85A2A] hover:text-[#4A2613]'
                        : 'bg-[#FAF7F2] text-japandi-text-muted hover:text-japandi-text border-[#EDE6DC]'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.name}</span>
                  {isChecked && <Check className="w-4 h-4 stroke-[3] ml-0.5" />}
                </button>
              );
            })}
          </div>

          <div className={`mt-3.5 pt-3 border-t flex items-center justify-between text-sm font-bold ${
            isChef ? 'border-[#EFE1D0] text-[#7A543E]' : 'border-[#F0EAE1] text-japandi-text-muted'
          }`}>
            <span>
              已選 {selectedCats.length === 0 ? '全部類別' : `${selectedCats.length} 個類別`}
            </span>
            <span className={`font-black ${
              isChef ? 'text-[#D85A2A]' : 'text-japandi-sage-dark font-extrabold'
            }`}>
              符合候選名單：{candidates.length} 間
            </span>
          </div>
        </div>

        {/* 抽籤大按鈕 */}
        {candidates.length === 0 ? (
          <div className={`py-6 text-center text-sm sm:text-base font-bold ${
            isChef ? 'text-[#A87B60]' : 'text-japandi-text-muted'
          }`}>
            目前勾選的分類下沒有符合的店家喔，請多勾選幾個分類～
          </div>
        ) : (
          <button
            type="button"
            disabled={isPicking}
            onClick={handlePick}
            className={`btn-pebble w-full py-4 rounded-2xl font-black text-base sm:text-lg border-2 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isPicking
                ? isChef
                  ? 'bg-[#FFF0D4] text-[#B87A24] border-[#F3D19E] cursor-not-allowed'
                  : 'bg-[#EAE4DC] text-japandi-text-muted border-transparent cursor-not-allowed'
                : isChef
                  ? 'bg-[#F3A935] hover:bg-[#E09825] active:bg-[#D48A18] text-[#3E1F0D] border-[#E09825] hover:shadow-lg active:scale-95'
                  : 'bg-japandi-sage hover:bg-japandi-sage-dark text-white border-transparent'
            }`}
          >
            <Dices className={`w-5 h-5 ${isPicking ? 'animate-spin' : ''}`} />
            <span>{isPicking ? '命運挑選中...' : '立即幫我隨機挑一家！'}</span>
          </button>
        )}

        {/* 抽中得獎店家卡片 */}
        {winner && (
          <div className={`mt-5 rounded-[36px] p-5 sm:p-6 shadow-float animate-scaleUp text-left relative overflow-visible border-2 ${
            isChef
              ? 'bg-[#FFFDF9] border-[#FCD8BE]'
              : 'bg-[#EBF3ED] border-[#BCD2C4]'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-black flex items-center gap-1.5 ${
                isChef ? 'text-[#D85A2A]' : 'text-japandi-sage-dark'
              }`}>
                <Sparkles className={`w-4 h-4 ${isChef ? 'text-[#F3A935]' : 'text-japandi-apricot'}`} />
                <span>{isChef ? '✨ 主廚今日特別推薦：' : '今天為你挑選的是：'}</span>
              </span>
              <span className={`text-xs sm:text-sm px-3 py-1 rounded-full font-black border ${
                isChef
                  ? 'bg-[#FFF3E0] text-[#D85A2A] border-[#FCD8BE]'
                  : 'bg-white text-japandi-sage-dark border-[#BCD2C4]'
              }`}>
                {winner.categories.join('・')}
              </span>
            </div>

            {/* 白瓷盤照片視窗 (印章不被裁切) */}
            <div className={`relative rounded-[26px] bg-white p-2.5 mb-3 shadow-soft overflow-visible border ${
              isChef ? 'border-[#EFE5D8]' : 'border-transparent'
            }`}>
              <div className="rounded-[20px] overflow-hidden aspect-video bg-white">
                {((winner.images && winner.images[0]) || winner.dishes.some(d => d.photos && d.photos.length > 0)) ? (
                  <SafeImage
                    src={
                      (winner.images && winner.images[0])
                        ? (winner.images[winner.coverIndex || 0] || winner.images[0])
                        : (winner.dishes.flatMap(d => d.photos || [])[0])
                    }
                    alt={winner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🍲
                  </div>
                )}
              </div>
            </div>

            <h3 className={`text-2xl font-black mb-1 ${
              isChef ? 'text-[#4A2613]' : 'text-japandi-text'
            }`}>
              {winner.name}
            </h3>

            {winner.address && (
              <p className={`text-sm mb-3.5 font-medium ${
                isChef ? 'text-[#7A543E]' : 'text-japandi-text-muted'
              }`}>
                📍 {winner.address}
              </p>
            )}

            {/* 餐點重點推薦與避雷 */}
            <div className="space-y-2 mb-4">
              {winnerLike.length > 0 && (
                <div className={`rounded-xl px-3.5 py-2.5 text-sm flex items-center gap-2 shadow-soft border ${
                  isChef
                    ? 'bg-[#FFF9EE] border-[#F2E5D5] text-[#D85A2A]'
                    : 'bg-white/85 border-[#E5DDD2] text-japandi-text'
                }`}>
                  <span className={`font-black shrink-0 ${isChef ? 'text-[#D85A2A]' : 'text-[#4F6D55]'}`}>
                    ★ 推薦必點：
                  </span>
                  <span className="font-bold truncate text-[#4A2613]">
                    {winnerLike.map(d => d.name).join('、')}
                  </span>
                </div>
              )}

              {winnerDislike.length > 0 && (
                <div className={`rounded-xl px-3.5 py-2.5 text-sm flex items-center gap-2 shadow-soft border ${
                  isChef
                    ? 'bg-[#FDF1EF] border-[#F8CEC7] text-[#C73E29]'
                    : 'bg-white/85 border-[#E5DDD2] text-japandi-text'
                }`}>
                  <span className={`font-black shrink-0 ${isChef ? 'text-[#C73E29]' : 'text-[#B05344]'}`}>
                    ⚠️ 避雷警示：
                  </span>
                  <span className="font-bold truncate text-[#4A2613]">
                    {winnerDislike.map(d => d.name).join('、')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onSelectRestaurant(winner);
                  onClose();
                  soundManager.playPop();
                }}
                className={`btn-pebble flex-1 px-4 py-3 font-black text-sm sm:text-base rounded-2xl shadow-soft flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isChef
                    ? 'bg-[#E86A43] hover:bg-[#D45630] active:bg-[#BF4520] text-white shadow-md'
                    : 'bg-japandi-sage hover:bg-japandi-sage-dark text-white'
                }`}
              >
                <span>查看這家完整菜單</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handlePick}
                className={`btn-pebble px-4 py-3 font-black text-sm rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer border-2 ${
                  isChef
                    ? 'bg-white hover:bg-[#FFF9EE] text-[#4A2613] border-[#DECFC0] shadow-sm'
                    : 'bg-white border-[#BCD2C4] text-japandi-text hover:bg-japandi-oat'
                }`}
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>再挑</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
