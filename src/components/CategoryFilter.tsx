import React from 'react';
import { CategoryItem, PRESET_CATEGORIES } from '../types';
import { soundManager } from '../utils/sound';
import { Settings2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  categories?: CategoryItem[];
  onOpenManageCategories?: () => void;
  isAdminUnlocked?: boolean;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  categories = PRESET_CATEGORIES,
  onOpenManageCategories,
  isAdminUnlocked = false,
}) => {
  const { theme } = useTheme();
  const isChef = theme === 'chef_menu';

  const allCategory = categories.find(c => c.id === 'all') || { id: 'all', name: '全部', icon: '🍽️' };
  const otherCategories = categories.filter(c => c.id !== 'all');

  const isAllSelected = selectedCategory === '全部' || selectedCategory === allCategory.name;
  const allCount = categoryCounts['全部'] || 0;

  const renderCategoryButton = (cat: CategoryItem, isSelected: boolean, count: number) => (
    <button
      key={cat.id}
      type="button"
      onClick={() => {
        onSelectCategory(cat.name);
        soundManager.playPop();
      }}
      className={`btn-pebble flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all border shrink-0 cursor-pointer select-none ${
        isSelected
          ? isChef
            ? 'bg-[#F3A935] hover:bg-[#E09825] active:bg-[#D48A18] backdrop-blur-md text-[#3E1F0D] border-[#E29520] shadow-soft font-black scale-[1.02]'
            : 'bg-[#5F7B67]/90 hover:bg-[#5F7B67] backdrop-blur-md text-white border-transparent shadow-soft scale-[1.02]'
          : isChef
            ? 'bg-white/75 hover:bg-white active:bg-white backdrop-blur-md text-[#69432D] border-white/80 hover:border-amber-200/60 shadow-soft'
            : 'bg-white/80 hover:bg-white backdrop-blur-md text-japandi-text-muted hover:text-japandi-text border-[#E6DDD2]'
      }`}
    >
      <span className="text-base shrink-0">{cat.icon}</span>
      <span className="whitespace-nowrap">{cat.name}</span>
      {count > 0 && (
        <span
          className={`text-sm px-2.5 py-0.5 rounded-full font-bold shrink-0 ${
            isSelected 
              ? (isChef ? 'bg-[#3E1F0D]/15 text-[#3E1F0D]' : 'bg-white/25 text-white')
              : (isChef ? 'bg-[#4A2613]/10 text-[#7A543E]' : 'bg-[#EFEAE2] text-japandi-text-muted')
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="w-full flex items-center gap-2 py-2">
      {/* 永久固定在最左側的「全部」按鈕 */}
      <div className="shrink-0">
        {renderCategoryButton(allCategory, isAllSelected, allCount)}
      </div>

      {/* 質感直向分隔線 */}
      <div className={`w-[2px] h-6 rounded-full shrink-0 ${
        isChef ? 'bg-[#E5DACB]' : 'bg-[#E6DDD2]'
      }`} />

      {/* 其餘可橫向滑動的分類標籤 */}
      <div className="min-w-0 flex-1 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-2 min-w-max pr-2">
          {otherCategories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            const count = categoryCounts[cat.name] || 0;
            return renderCategoryButton(cat, isSelected, count);
          })}

          {/* 管理標籤入口按鈕（僅在管理模式解鎖時開放） */}
          {isAdminUnlocked && onOpenManageCategories && (
            <button
              type="button"
              onClick={() => {
                onOpenManageCategories();
                soundManager.playPop();
              }}
              className={`btn-pebble flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-bold text-sm border-2 border-dashed transition-all shrink-0 cursor-pointer select-none ${
                isChef
                  ? 'bg-white/50 hover:bg-white/85 active:bg-white backdrop-blur-md text-[#69432D] border-[#D6C2A7]/80 shadow-soft'
                  : 'bg-[#FAF6F0]/80 hover:bg-[#FAF6F0] backdrop-blur-md text-japandi-text-muted hover:text-japandi-text border-[#D5C7B5]'
              }`}
              title="自訂、排序與增刪分類標籤"
            >
              <Settings2 className={`w-4 h-4 shrink-0 ${isChef ? 'text-[#D85A2A]' : 'text-japandi-sage'}`} />
              <span className="whitespace-nowrap">管理標籤</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

