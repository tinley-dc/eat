import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Restaurant, CategoryItem } from './types';
import { 
  db,
  initializeDatabase, 
  getAllRestaurants, 
  addRestaurant, 
  updateRestaurant, 
  deleteRestaurant,
  syncWithCloud,
  triggerAutoSync
} from './db';
import { getCloudConfig, saveCloudConfig } from './services/cloudSync';
import { loadCategories, saveCategories, syncCategoriesWithRestaurants } from './utils/categoryStorage';
import { isDeviceRemembered, setDeviceRemembered } from './utils/securityStorage';
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { RestaurantCard } from './components/RestaurantCard';
import { RestaurantMenuCard } from './components/RestaurantMenuCard';
import { RestaurantDetailModal } from './components/RestaurantDetailModal';
import { RestaurantFormModal } from './components/RestaurantFormModal';
import { CategoryRandomPickerModal } from './components/CategoryRandomPickerModal';
import { CategoryManagementModal } from './components/CategoryManagementModal';
import { BackupModal } from './components/BackupModal';
import { AdminLockModal } from './components/AdminLockModal';
import { BottomNav } from './components/BottomNav';
import { 
  DoodleCarrot, 
  DoodleStrawberry, 
  DoodleTomato, 
  DoodleCelery, 
  DoodleSeed 
} from './components/Doodles';
import { 
  Search, 
  Plus, 
  CheckCircle2,
  Store,
  UtensilsCrossed
} from 'lucide-react';
import { soundManager } from './utils/sound';
import { useTheme } from './context/ThemeContext';

export const App: React.FC = () => {
  const { theme } = useTheme();
  const isChef = theme === 'chef_menu';

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  const handleToggleSearch = () => {
    setIsSearchOpen(prev => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 120);
      }
      return next;
    });
  };

  // 分類標籤清單（支援自訂排序與內容）
  const [categories, setCategories] = useState<CategoryItem[]>(() => loadCategories());

  // 彈窗開關狀態
  const [detailRestaurant, setDetailRestaurant] = useState<Restaurant | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isRandomPickerOpen, setIsRandomPickerOpen] = useState<boolean>(false);
  const [isCategoryManageOpen, setIsCategoryManageOpen] = useState<boolean>(false);
  const [isBackupOpen, setIsBackupOpen] = useState<boolean>(false);

  // 家長管理鎖狀態（支援「記住此裝置」或 sessionStorage）
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return isDeviceRemembered() || sessionStorage.getItem('wanna_eat_admin_unlocked') === 'true';
  });
  const [isAdminLockModalOpen, setIsAdminLockModalOpen] = useState<boolean>(false);

  // 瀏覽模式：'menu' (餐廳菜單) 或 'store' (店家圖鑑)，預設為餐廳菜單
  const [viewMode, setViewMode] = useState<'store' | 'menu'>(() => {
    return (localStorage.getItem('wanna_eat_view_mode') as 'store' | 'menu') || 'menu';
  });

  const handleToggleViewMode = (mode: 'store' | 'menu') => {
    setViewMode(mode);
    localStorage.setItem('wanna_eat_view_mode', mode);
  };

  useEffect(() => {
    sessionStorage.setItem('wanna_eat_admin_unlocked', isAdminUnlocked ? 'true' : 'false');
  }, [isAdminUnlocked]);

  // 監聽背景自動同步事件與雲端分類更新
  useEffect(() => {
    const handleStatus = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.status === 'success') {
        setSyncToastMessage('☁️ 已自動同步至 Google 試算表！');
        setTimeout(() => {
          setSyncToastMessage(null);
        }, 3200);
        getAllRestaurants().then(updated => {
          setRestaurants(updated);
        });
      }
    };

    const handleCategoriesUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail) && detail.length > 0) {
        setCategories(detail);
      }
    };

    window.addEventListener('cloud-sync-status', handleStatus);
    window.addEventListener('cloud-categories-updated', handleCategoriesUpdate);
    return () => {
      window.removeEventListener('cloud-sync-status', handleStatus);
      window.removeEventListener('cloud-categories-updated', handleCategoriesUpdate);
    };
  }, []);

  // 更新自訂分類並自動持久化儲存（若有修改名稱或刪除，同步更新所有餐廳並推送至雲端）
  const handleUpdateCategories = async (newCategories: CategoryItem[], oldName?: string, newName?: string) => {
    setCategories(newCategories);
    saveCategories(newCategories);
    const exists = newCategories.some(c => c.name === selectedCategory || (c.id === 'all' && selectedCategory === '全部'));
    if (!exists) {
      setSelectedCategory('全部');
    }

    // 若標籤重新命名，同步更新所有餐廳的分類名稱
    if (oldName && newName && oldName !== newName) {
      const allR = await getAllRestaurants();
      let changed = false;
      for (const r of allR) {
        if (r.categories.includes(oldName)) {
          r.categories = r.categories.map(c => c === oldName ? newName : c);
          await updateRestaurant(r);
          changed = true;
        }
      }
      if (changed) {
        const updated = await getAllRestaurants();
        setRestaurants(updated);
      }
    }

    // 自動排程同步至 Google 試算表，確保所有裝置與 GitHub Pages 永遠保持同一順序
    triggerAutoSync();
  };

  // 初始化資料庫
  const loadData = async () => {
    try {
      // 1. 檢查網址是否有分享同步參數 (?sync=... 或 ?scriptUrl=...)
      const params = new URLSearchParams(window.location.search);
      const syncParam = params.get('sync') || params.get('scriptUrl');
      if (syncParam) {
        try {
          const decoded = decodeURIComponent(syncParam).trim();
          if (decoded.startsWith('http')) {
            const current = getCloudConfig();
            saveCloudConfig({
              ...current,
              scriptUrl: decoded,
              autoSync: true
            });
            // 抹除網址上的參數以保持網址乾淨
            const cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, '', cleanUrl);
          }
        } catch (err) {
          console.warn('解析同步參數失敗:', err);
        }
      }

      // 2. 初始化資料庫（若本地無資料且已設定試算表，initializeDatabase 會直接從雲端拉取）
      const data = await initializeDatabase();
      setRestaurants(data);
      setCategories((prev) => syncCategoriesWithRestaurants(prev, data));

      // 3. 若已設定試算表，於背景執行一次同步（若新裝置先前殘留示範店家，會自動以雲端資料完整覆蓋）
      const config = getCloudConfig();
      if (config.scriptUrl && config.autoSync) {
        syncWithCloud()
          .then(async (res) => {
            const updated = await getAllRestaurants();
            setRestaurants(updated);
            setCategories((prev) => syncCategoriesWithRestaurants(prev, updated));
            if (res.count > 0) {
              setSyncToastMessage(`☁️ 已同步 ${res.count} 間店家資料！`);
              setTimeout(() => setSyncToastMessage(null), 3200);
            }
          })
          .catch((err) => {
            console.warn('初次載入背景同步失敗:', err);
          });
      }
    } catch (e) {
      console.error('初始化失敗:', e);
      const list = await getAllRestaurants();
      setRestaurants(list);
      setCategories((prev) => syncCategoriesWithRestaurants(prev, list));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 計算各分類店家數量
  const categoryCounts = useMemo(() => {
    const validRestaurants = restaurants.filter(r => !r.id.startsWith('__CONFIG_'));
    const counts: Record<string, number> = { '全部': validRestaurants.length };
    validRestaurants.forEach((r) => {
      r.categories.forEach((cat) => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });
    return counts;
  }, [restaurants]);

  // 篩選與搜尋
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      if (r.id.startsWith('__CONFIG_')) return false;
      const matchCategory =
        selectedCategory === '全部' || r.categories.includes(selectedCategory);

      if (!searchQuery.trim()) return matchCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchName = r.name.toLowerCase().includes(q);
      const matchAddress = (r.address || '').toLowerCase().includes(q);
      const matchDish = r.dishes.some(
        (d) => d.name.toLowerCase().includes(q) || (d.note || '').toLowerCase().includes(q)
      );

      return matchCategory && (matchName || matchAddress || matchDish);
    });
  }, [restaurants, selectedCategory, searchQuery]);

  // 菜單模式下，依類別進行分組與排序（排除「全部」標籤，各店家歸類至對應分類）
  const categorizedMenuGroups = useMemo(() => {
    const specificCategories = categories.filter(c => c.id !== 'all' && c.name !== '全部');
    const groups: { category: CategoryItem; restaurants: Restaurant[] }[] = [];
    const assignedIds = new Set<string>();

    specificCategories.forEach(cat => {
      const catTrimmed = cat.name.trim();
      const items = filteredRestaurants.filter(r => 
        !assignedIds.has(r.id) && (r.categories || []).some(c => c.trim() === catTrimmed)
      );
      if (items.length > 0) {
        items.forEach(r => assignedIds.add(r.id));
        groups.push({ category: cat, restaurants: items });
      }
    });

    const remaining = filteredRestaurants.filter(r => !assignedIds.has(r.id));
    if (remaining.length > 0) {
      groups.push({
        category: { id: 'other', name: '其他美味', icon: '🍽️' },
        restaurants: remaining
      });
    }

    return groups;
  }, [categories, filteredRestaurants]);

  // 新增 / 編輯店家
  const handleSaveRestaurant = async (data: Restaurant) => {
    const existing = editingRestaurant || (await db.restaurants.get(data.id));
    if (existing) {
      await updateRestaurant(data);
    } else {
      await addRestaurant(data);
    }
    const updated = await getAllRestaurants();
    setRestaurants(updated);
    setEditingRestaurant(null);
    if (detailRestaurant && detailRestaurant.id === data.id) {
      const refreshed = updated.find(r => r.id === data.id) || data;
      setDetailRestaurant(refreshed);
    }
  };

  // 刪除店家
  const handleDeleteRestaurant = async (id: string, name: string) => {
    if (window.confirm(`確定要刪除「${name}」嗎？`)) {
      await deleteRestaurant(id);
      const updated = await getAllRestaurants();
      setRestaurants(updated);
      setDetailRestaurant(null);
      soundManager.playPop();
    }
  };

  return (
    <div className={`min-h-screen ${
      isChef ? 'bg-[#FFFDF6] text-[#422110]' : 'bg-[#F7F2EC] text-japandi-text'
    } pb-24 sm:pb-16 flex flex-col font-comic selection:bg-[#F3A935] selection:text-[#4A2613] relative overflow-x-clip transition-colors duration-300`}>
      {/* 小廚神模式背景溫暖白玉波點 */}
      {isChef && (
        <div className="fixed inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#F5B853_1.5px,transparent_1.5px)] [background-size:24px_24px] z-0" />
      )}

      {/* 兩側日系有機水彩大色塊背景（在小廚神模式下換為溫暖起司與杏桃暖色） */}
      <div className="fixed top-0 bottom-0 left-0 w-12 sm:w-24 md:w-36 pointer-events-none opacity-30 sm:opacity-40 z-0 select-none overflow-hidden">
        <svg viewBox="0 0 160 800" className="w-full h-full" preserveAspectRatio="none" fill="none">
          <path
            d="M0 0 L50 0 C110 180, 20 340, 80 500 C130 640, 40 730, 0 800 Z"
            fill={isChef ? "#F5B853" : "#CCD8CD"}
          />
        </svg>
      </div>
      <div className="fixed top-0 bottom-0 right-0 w-12 sm:w-24 md:w-36 pointer-events-none opacity-30 sm:opacity-40 z-0 select-none overflow-hidden">
        <svg viewBox="0 0 160 800" className="w-full h-full" preserveAspectRatio="none" fill="none">
          <path
            d="M160 0 L110 0 C50 180, 140 340, 80 500 C30 640, 120 730, 160 800 Z"
            fill={isChef ? "#F99B7D" : "#F5C7A9"}
          />
        </svg>
      </div>

      {/* 頂部導覽列 */}
      <Header
        onOpenAddModal={() => { setEditingRestaurant(null); setIsFormOpen(true); }}
        onOpenRandomPicker={() => setIsRandomPickerOpen(true)}
        onOpenBackupModal={() => setIsBackupOpen(true)}
        onResetToAll={() => setSelectedCategory('全部')}
        isAdminUnlocked={isAdminUnlocked}
        onToggleAdminLock={() => {
          if (isAdminUnlocked) {
            setIsAdminUnlocked(false);
            setDeviceRemembered(false);
            sessionStorage.removeItem('wanna_eat_admin_unlocked');
            setSyncToastMessage('🔒 已安全鎖定管理模式');
            setTimeout(() => setSyncToastMessage(null), 2200);
            setIsFormOpen(false);
            setIsCategoryManageOpen(false);
            setIsBackupOpen(false);
          } else {
            setIsAdminLockModalOpen(true);
          }
        }}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        isSearchOpen={isSearchOpen}
        onToggleSearch={handleToggleSearch}
        hasSearchQuery={Boolean(searchQuery.trim())}
      />

      {/* 主要內容區 (響應式：手機 1 欄、平板 2 欄、電腦 3 欄，手機底部留有 BottomNav 高度空間) */}
      <main className="max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-2.5 sm:pt-3.5 pb-28 sm:pb-8 flex-1 w-full space-y-5 sm:space-y-6 relative z-10">
        <div className="absolute top-36 -left-7 pointer-events-none opacity-75 hidden 2xl:block">
          <DoodleTomato className="w-8 h-8 -rotate-6" />
        </div>
        <div className="absolute top-44 -left-3 pointer-events-none opacity-60 hidden 2xl:block">
          <DoodleSeed className="w-3 h-4" />
        </div>
        <div className="absolute top-52 -right-7 pointer-events-none opacity-75 hidden 2xl:block">
          <DoodleStrawberry className="w-8 h-8 rotate-12" />
        </div>
        <div className="absolute bottom-20 -left-8 pointer-events-none opacity-75 hidden 2xl:block">
          <DoodleCelery className="w-8 h-12 -rotate-12" />
        </div>
        <div className="absolute bottom-12 -right-7 pointer-events-none opacity-75 hidden 2xl:block">
          <DoodleCarrot className="w-8 h-8 rotate-25" />
        </div>

        {/* 搜尋與分類導覽列 (置中精緻寬度) */}
        <div className="max-w-2xl mx-auto w-full space-y-3">
          {/* 展開式藥丸全圓角搜尋列 (由 Header 搜尋按鈕觸發) */}
          {isSearchOpen && (
            <div className="animate-fadeIn flex items-center gap-2">
              <div className="relative flex-1">
                <Search className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${
                  isChef ? 'text-[#8A5A3C]' : 'text-japandi-text-muted'
                }`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isChef ? "搜尋想吃的招牌美食、漢堡或店家..." : "搜尋想吃的食物或店家..."}
                  className={`w-full pl-11 pr-14 py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base shadow-soft transition-all ${
                    isChef
                      ? 'border-2 border-[#E8D2B5] focus:border-[#F3A935] bg-white text-[#4A2613] placeholder-[#9D765A] focus:outline-none'
                      : 'border border-[#E4DCCE] focus:border-japandi-sage bg-white/90 text-japandi-text placeholder-japandi-text-muted focus:outline-none'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold rounded-full px-2.5 py-1 ${
                      isChef 
                        ? 'bg-[#F5ECE1] text-[#7A543E] hover:text-[#4A2613]' 
                        : 'bg-japandi-oat text-japandi-text-muted hover:text-japandi-text'
                    }`}
                  >
                    清除
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                  soundManager.playPop();
                }}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-full shrink-0 transition-all ${
                  isChef 
                    ? 'bg-[#F5ECE1] text-[#7A543E] hover:bg-[#EBDDCB]' 
                    : 'bg-japandi-oat text-japandi-text-muted hover:text-japandi-text'
                }`}
              >
                收起
              </button>
            </div>
          )}

          {/* 分類篩選橫條 */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
            categories={categories}
            onOpenManageCategories={() => setIsCategoryManageOpen(true)}
            isAdminUnlocked={isAdminUnlocked}
          />
        </div>

        {/* 快速提示、分類筆數與瀏覽模式切換 */}
        <div className="flex items-center justify-between gap-3 px-1">
          <div className={`text-sm sm:text-base font-black ${
            isChef ? 'text-[#7D533A]' : 'text-japandi-text-muted'
          }`}>
            <span>
              {selectedCategory === '全部' 
                ? (isChef ? '🥞 小廚神美食推薦菜單' : '📖 美食手帳名單') 
                : `分類：${selectedCategory}`
              }
              （共 {filteredRestaurants.length} 間）
            </span>
          </div>

          {/* 電腦/平板雙模式切換膠囊按鈕（手機模式下隱藏，由底部 BottomNav 承接） */}
          <div className={`hidden sm:inline-flex items-center p-1 rounded-2xl border shrink-0 ${
            isChef ? 'bg-[#FFFDF9] border-[#EADFCF]' : 'bg-white border-[#E5DDD2] shadow-soft'
          }`}>
            <button
              type="button"
              onClick={() => { handleToggleViewMode('menu'); soundManager.playPop(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black transition-all cursor-pointer ${
                viewMode === 'menu'
                  ? (isChef ? 'bg-[#D85A2A] text-white shadow-sm' : 'bg-japandi-sage text-white shadow-soft')
                  : (isChef ? 'text-[#8A5A38] hover:text-[#D85A2A]' : 'text-japandi-text-muted hover:text-japandi-text')
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>美味佳餚</span>
            </button>
            <button
              type="button"
              onClick={() => { handleToggleViewMode('store'); soundManager.playPop(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black transition-all cursor-pointer ${
                viewMode === 'store'
                  ? (isChef ? 'bg-[#D85A2A] text-white shadow-sm' : 'bg-japandi-sage text-white shadow-soft')
                  : (isChef ? 'text-[#8A5A38] hover:text-[#D85A2A]' : 'text-japandi-text-muted hover:text-japandi-text')
              }`}
            >
              <Store className="w-4 h-4" />
              <span>餐廳資訊</span>
            </button>
          </div>
        </div>

        {/* 店家卡片清單 (店家圖鑑: 手機1/平板2/電腦3；餐廳菜單: 手機2/平板3/電腦5) */}
        {isLoading ? (
          <div className={`py-20 text-center font-bold animate-pulse text-base ${
            isChef ? 'text-[#7D533A]' : 'text-japandi-text-muted'
          }`}>
            🍲 美食圖鑑載入中...
          </div>
        ) : filteredRestaurants.length > 0 ? (
          viewMode === 'menu' ? (
            /* 📋 餐廳菜單模式：依類別排序分組（手機 2 欄並列，極簡照片＋店名） */
            selectedCategory === '全部' ? (
              <div className="space-y-7 sm:space-y-8">
                {categorizedMenuGroups.map((group) => (
                  <div key={group.category.id} className="space-y-3">
                    {/* 分類群組標題 */}
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-xl sm:text-2xl">{group.category.icon}</span>
                      <h3 className={`font-black text-base sm:text-lg ${
                        isChef ? 'text-[#4A2613]' : 'text-japandi-text'
                      }`}>
                        {group.category.name}
                      </h3>
                      <span className={`text-xs font-bold ${
                        isChef ? 'text-[#8A5A38]' : 'text-japandi-text-muted'
                      }`}>
                        （{group.restaurants.length} 間）
                      </span>
                    </div>

                    {/* 極簡美食點餐卡網格 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-4.5">
                      {group.restaurants.map((restaurant, idx) => (
                        <RestaurantMenuCard
                          key={restaurant.id}
                          cardIndex={idx}
                          restaurant={restaurant}
                          onViewDetail={(r) => setDetailRestaurant(r)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* 當選擇特定類別標籤時 */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-4.5">
                {filteredRestaurants.map((restaurant, idx) => (
                  <RestaurantMenuCard
                    key={restaurant.id}
                    cardIndex={idx}
                    restaurant={restaurant}
                    onViewDetail={(r) => setDetailRestaurant(r)}
                  />
                ))}
              </div>
            )
          ) : (
            /* 🏪 餐廳資訊模式：依類別分組排序（橫向 List Card 清單，手機單欄全寬，平板/電腦雙欄） */
            selectedCategory === '全部' ? (
              <div className="space-y-7 sm:space-y-8">
                {categorizedMenuGroups.map((group) => (
                  <div key={group.category.id} className="space-y-3">
                    {/* 分類群組標題 */}
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-xl sm:text-2xl">{group.category.icon}</span>
                      <h3 className={`font-black text-base sm:text-lg ${
                        isChef ? 'text-[#4A2613]' : 'text-japandi-text'
                      }`}>
                        {group.category.name}
                      </h3>
                      <span className={`text-sm font-bold ${
                        isChef ? 'text-[#8A5A38]' : 'text-japandi-text-muted'
                      }`}>
                        （{group.restaurants.length} 間）
                      </span>
                    </div>

                    {/* 餐廳資訊 List Card 網格 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {group.restaurants.map((restaurant, idx) => (
                        <RestaurantCard
                          key={restaurant.id}
                          cardIndex={idx}
                          restaurant={restaurant}
                          onViewDetail={(r) => setDetailRestaurant(r)}
                          onEdit={(r) => { setEditingRestaurant(r); setIsFormOpen(true); }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* 當選擇特定類別標籤時 */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {filteredRestaurants.map((restaurant, idx) => (
                  <RestaurantCard
                    key={restaurant.id}
                    cardIndex={idx}
                    restaurant={restaurant}
                    onViewDetail={(r) => setDetailRestaurant(r)}
                    onEdit={(r) => { setEditingRestaurant(r); setIsFormOpen(true); }}
                  />
                ))}
              </div>
            )
          )
        ) : (
          <div className="bg-white rounded-[36px] border border-dashed border-[#DCD3C6] p-8 sm:p-12 text-center space-y-3 shadow-soft">
            <span className="text-5xl block">{isChef ? '🍳' : '🍜'}</span>
            <h3 className={`font-black text-xl ${isChef ? 'text-[#4A2613]' : 'text-japandi-text'}`}>
              {isChef ? '小廚神的菜單裡還沒有符合的店家呢！' : '找不到符合的店家呢！'}
            </h3>
            <p className="text-sm sm:text-base text-japandi-text-muted max-w-sm mx-auto leading-relaxed">
              試試看切換其他分類標籤，或是點擊下方按鈕新增一間常吃的美味店家吧！
            </p>
            {isAdminUnlocked && (
              <button
                onClick={() => { setEditingRestaurant(null); setIsFormOpen(true); soundManager.playPop(); }}
                className={`btn-pebble inline-flex items-center gap-1.5 px-5 py-2.5 font-black text-sm sm:text-base rounded-2xl shadow-soft mt-2 text-white ${
                  isChef ? 'bg-[#E86A43] hover:bg-[#D55730]' : 'bg-japandi-sage hover:bg-japandi-sage-dark'
                }`}
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>馬上新增第一家！</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* 詳細資訊彈窗 */}
      <RestaurantDetailModal
        restaurant={detailRestaurant}
        onClose={() => setDetailRestaurant(null)}
        onEdit={(r) => {
          setDetailRestaurant(null);
          setEditingRestaurant(r);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteRestaurant}
        isAdminUnlocked={isAdminUnlocked}
      />

      {/* 新增 / 編輯店家彈窗 */}
      <RestaurantFormModal
        key={editingRestaurant ? `edit-${editingRestaurant.id}` : 'new-restaurant'}
        isOpen={isFormOpen}
        initialData={editingRestaurant}
        onClose={() => { setIsFormOpen(false); setEditingRestaurant(null); }}
        onSave={handleSaveRestaurant}
        availableCategories={categories}
        onOpenManageCategories={() => setIsCategoryManageOpen(true)}
      />

      {/* 隨機分類挑選彈窗 */}
      <CategoryRandomPickerModal
        isOpen={isRandomPickerOpen}
        onClose={() => setIsRandomPickerOpen(false)}
        restaurants={restaurants}
        onSelectRestaurant={(r) => setDetailRestaurant(r)}
        categories={categories}
      />

      {/* 標籤分類管理與排序彈窗 */}
      <CategoryManagementModal
        isOpen={isCategoryManageOpen}
        onClose={() => setIsCategoryManageOpen(false)}
        categories={categories}
        onUpdateCategories={handleUpdateCategories}
      />


      {/* 備份與資料彈窗 */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onDataChanged={loadData}
      />

      {/* 家長管理解鎖彈窗 */}
      <AdminLockModal
        isOpen={isAdminLockModalOpen}
        onClose={() => setIsAdminLockModalOpen(false)}
        onUnlock={() => {
          setIsAdminUnlocked(true);
          setIsAdminLockModalOpen(false);
        }}
      />

      {/* 手機底部導覽列（切換美味佳餚／餐廳資訊，中間逗趣隨便按鈕） */}
      <BottomNav
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        onOpenRandomPicker={() => setIsRandomPickerOpen(true)}
      />

      {/* 背景自動同步浮動提示（在手機版避開底部導覽列高度） */}
      {syncToastMessage && (
        <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-50 bg-[#2D2A26] text-white px-4 py-2.5 rounded-2xl shadow-float flex items-center gap-2.5 text-sm font-bold animate-fadeIn border border-white/10 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncToastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
