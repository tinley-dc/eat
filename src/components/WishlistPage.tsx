import React, { useState, useMemo } from 'react';
import { Restaurant, DEFAULT_RESTAURANT_IMAGE } from '../types';
import { 
  Pin, 
  Plus, 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  Edit3, 
  Trash2, 
  ArrowLeft,
  Search,
  Lock
} from 'lucide-react';
import { formatBusinessHours } from '../utils/googleMapsParser';
import { soundManager } from '../utils/sound';
import { useTheme } from '../context/ThemeContext';
import { SafeImage } from './SafeImage';

interface WishlistPageProps {
  restaurants: Restaurant[];
  onMoveToVisited: (restaurant: Restaurant) => void;
  onOpenAddModal: () => void;
  onViewDetail: (restaurant: Restaurant) => void;
  onEdit: (restaurant: Restaurant) => void;
  onDelete: (id: string, name: string) => void;
  onBackToMenu: () => void;
  isAdminUnlocked?: boolean;
  onRequireAdminUnlock?: () => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  restaurants,
  onMoveToVisited,
  onOpenAddModal,
  onViewDetail,
  onEdit,
  onDelete,
  onBackToMenu,
  isAdminUnlocked = false,
  onRequireAdminUnlock,
}) => {
  const { theme } = useTheme();
  const isChef = theme === 'chef_menu';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');

  // 提取待踩點名單中所有出現過的分類標籤
  const availableCategories = useMemo(() => {
    const catsSet = new Set<string>();
    restaurants.forEach(r => {
      (r.categories || []).forEach(c => catsSet.add(c));
    });
    return Array.from(catsSet);
  }, [restaurants]);

  // 待踩點篩選與搜尋
  const filteredList = useMemo(() => {
    return restaurants.filter(r => {
      const matchCat = selectedCategory === '全部' || (r.categories || []).includes(selectedCategory);
      if (!searchQuery.trim()) return matchCat;

      const q = searchQuery.toLowerCase().trim();
      const matchName = r.name.toLowerCase().includes(q);
      const matchNote = (r.note || '').toLowerCase().includes(q);
      const matchAddress = (r.address || '').toLowerCase().includes(q);
      return matchCat && (matchName || matchNote || matchAddress);
    });
  }, [restaurants, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 頂部功能橫幅 */}
      <div className={`p-4 sm:p-6 rounded-3xl border transition-all ${
        isChef
          ? 'bg-gradient-to-r from-[#FFF8EE] to-[#FFF3E0] border-[#F0DFCD] shadow-sm'
          : 'bg-gradient-to-r from-[#FAF6F0] to-[#F5EFE6] border-[#E8DFD3] shadow-soft'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { onBackToMenu(); soundManager.playPop(); }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isChef
                    ? 'bg-white/80 hover:bg-white text-[#7A543E] border border-[#E5DACB]'
                    : 'bg-white/80 hover:bg-white text-japandi-text-muted hover:text-japandi-text border border-[#E2DAD0]'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>回美食菜單</span>
              </button>

              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                isChef ? 'bg-[#F3A935] text-[#4A2613]' : 'bg-japandi-apricot text-white'
              }`}>
                <Pin className="w-3 h-3 fill-current" />
                <span>口袋名單（{restaurants.length} 間）</span>
              </span>
            </div>

            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${
              isChef ? 'text-[#4A2613]' : 'text-japandi-text'
            }`}>
              📌 待踩點口袋名單
            </h2>
            <p className={`text-xs sm:text-sm max-w-xl leading-relaxed ${
              isChef ? 'text-[#8A5A38]' : 'text-japandi-text-muted'
            }`}>
              這裡記錄了小孩尚未去過的口袋店家。踩點吃過且覺得很讚後，點擊「踩點成功」就能一鍵升級移入「美味佳餚」與「餐廳資訊」喔！
            </p>
          </div>

          {/* 新增想踩點店家按鈕（需管理解鎖） */}
          <div className="shrink-0 flex items-center gap-2">
            {isAdminUnlocked ? (
              <button
                type="button"
                onClick={() => { onOpenAddModal(); soundManager.playPop(); }}
                className={`btn-pebble w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl font-black text-sm text-white shadow-soft transition-all cursor-pointer ${
                  isChef
                    ? 'bg-[#E86A43] hover:bg-[#D55730] active:scale-95'
                    : 'bg-japandi-apricot hover:bg-japandi-apricot-dark active:scale-95'
                }`}
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>新增想踩點店家</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { onRequireAdminUnlock?.(); soundManager.playPop(); }}
                className={`btn-pebble w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-black text-xs sm:text-sm border transition-all cursor-pointer shadow-soft active:scale-95 ${
                  isChef
                    ? 'bg-white/80 hover:bg-white text-[#7A543E] border-[#E5DACB]'
                    : 'bg-white/90 hover:bg-japandi-oat text-japandi-text-muted hover:text-japandi-text border-[#EDE6DC]'
                }`}
                title="需先解鎖管理密碼才能新增店家"
              >
                <Lock className="w-4 h-4 text-japandi-apricot shrink-0" />
                <span>解鎖新增店家</span>
              </button>
            )}
          </div>
        </div>

        {/* 搜尋與分類標籤 (若有資料) */}
        {restaurants.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#EAE0D4] space-y-3">
            {/* 搜尋列 */}
            <div className="relative max-w-md">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isChef ? 'text-[#8A5A3C]' : 'text-japandi-text-muted'
              }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋想踩點的店家、備註或地址..."
                className={`w-full pl-9 pr-8 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs ${
                  isChef
                    ? 'border border-[#E5DACB] focus:border-[#F3A935] bg-white text-[#4A2613] placeholder-[#9D765A] focus:outline-none'
                    : 'border border-[#E4DCCE] focus:border-japandi-sage bg-white text-japandi-text placeholder-japandi-text-muted focus:outline-none'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600 px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 分類篩選膠囊 (若有 2 種以上分類) */}
            {availableCategories.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => { setSelectedCategory('全部'); soundManager.playPop(); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === '全部'
                      ? (isChef ? 'bg-[#D85A2A] text-white shadow-2xs' : 'bg-japandi-sage text-white shadow-2xs')
                      : (isChef ? 'bg-white text-[#7A543E] hover:bg-[#F5ECE1]' : 'bg-white text-japandi-text-muted hover:text-japandi-text')
                  }`}
                >
                  全部 ({restaurants.length})
                </button>
                {availableCategories.map(cat => {
                  const count = restaurants.filter(r => (r.categories || []).includes(cat)).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => { setSelectedCategory(cat); soundManager.playPop(); }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? (isChef ? 'bg-[#D85A2A] text-white shadow-2xs' : 'bg-japandi-sage text-white shadow-2xs')
                          : (isChef ? 'bg-white text-[#7A543E] hover:bg-[#F5ECE1]' : 'bg-white text-japandi-text-muted hover:text-japandi-text')
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 待踩點卡片清單 */}
      {restaurants.length === 0 ? (
        /* 空白狀態 */
        <div className="bg-white rounded-[32px] border border-dashed border-[#DCD3C6] p-8 sm:p-12 text-center space-y-3.5 shadow-soft">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-[#FFF8EE] flex items-center justify-center text-3xl sm:text-4xl shadow-inner">
            📌
          </div>
          <h3 className={`font-black text-lg sm:text-xl ${isChef ? 'text-[#4A2613]' : 'text-japandi-text'}`}>
            目前還沒有待踩點店家喔！
          </h3>
          <p className="text-xs sm:text-sm text-japandi-text-muted max-w-sm mx-auto leading-relaxed">
            滑手機看到想吃、朋友推薦的美味餐廳，或想帶小孩去探險的親子名單，隨手記下來，假日就不怕沒靈感囉！
          </p>
          {isAdminUnlocked ? (
            <button
              type="button"
              onClick={() => { onOpenAddModal(); soundManager.playPop(); }}
              className={`btn-pebble inline-flex items-center gap-1.5 px-5 py-2.5 font-black text-sm rounded-2xl shadow-soft mt-2 text-white ${
                isChef ? 'bg-[#E86A43] hover:bg-[#D55730]' : 'bg-japandi-apricot hover:bg-japandi-apricot-dark'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>新增第一家想踩點店家</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { onRequireAdminUnlock?.(); soundManager.playPop(); }}
              className={`btn-pebble inline-flex items-center gap-1.5 px-5 py-2.5 font-bold text-xs sm:text-sm rounded-2xl shadow-soft mt-2 border transition-all cursor-pointer ${
                isChef
                  ? 'bg-white text-[#7A543E] border-[#E5DACB] hover:bg-[#FFF9EE]'
                  : 'bg-white text-japandi-text-muted hover:text-japandi-text border-[#EDE6DC]'
              }`}
            >
              <Lock className="w-4 h-4 text-japandi-apricot stroke-[2.5]" />
              <span>解鎖管理以新增店家</span>
            </button>
          )}
        </div>
      ) : filteredList.length === 0 ? (
        /* 搜尋無結果 */
        <div className="bg-white rounded-[28px] border border-[#EDE6DC] p-8 text-center space-y-2 shadow-soft">
          <span className="text-3xl block">🔍</span>
          <p className="font-black text-base text-stone-700">找不到符合「{searchQuery}」的待踩點店家</p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setSelectedCategory('全部'); soundManager.playPop(); }}
            className="text-xs font-bold text-japandi-sage-dark underline"
          >
            清除搜尋條件
          </button>
        </div>
      ) : (
        /* 卡片列表 (單欄/雙欄響應式) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredList.map((restaurant) => {
            const storePhotos = restaurant.images || [];
            const coverUrl = (storePhotos.length > 0 && restaurant.coverIndex !== undefined && storePhotos[restaurant.coverIndex])
              ? storePhotos[restaurant.coverIndex]
              : (storePhotos.length > 0 ? storePhotos[0] : null) || DEFAULT_RESTAURANT_IMAGE;

            return (
              <div
                key={restaurant.id}
                className={`group rounded-3xl border transition-all duration-200 overflow-hidden shadow-soft hover:shadow-float flex flex-col justify-between ${
                  isChef
                    ? 'bg-white hover:bg-[#FFFDF9] border-[#EFE5D8]'
                    : 'bg-white hover:bg-[#FAF8F5] border-[#EBE3D7]'
                }`}
              >
                {/* 卡片上半部 (點擊開啟詳細視窗) */}
                <div 
                  onClick={() => { onViewDetail(restaurant); soundManager.playPop(); }}
                  className="p-4 sm:p-5 cursor-pointer space-y-3.5"
                >
                  <div className="flex items-start gap-3.5">
                    {/* 左側照片 */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 relative bg-[#F7F3EE] shadow-2xs">
                      <SafeImage
                        src={coverUrl}
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                        loading="lazy"
                      />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs">
                        待踩點
                      </span>
                    </div>

                    {/* 右側標題與分類 */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-black text-base sm:text-lg leading-snug truncate transition-colors ${
                          isChef ? 'text-[#4A2613] group-hover:text-[#D85A2A]' : 'text-stone-800 group-hover:text-japandi-sage-dark'
                        }`}>
                          {restaurant.name}
                        </h3>

                        {/* 管理模式快速操作 */}
                        {isAdminUnlocked && (
                          <div 
                            className="flex items-center gap-1 shrink-0" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => { onEdit(restaurant); soundManager.playPop(); }}
                              title="編輯"
                              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => { onDelete(restaurant.id, restaurant.name); soundManager.playPop(); }}
                              title="刪除"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 分類標籤 */}
                      {restaurant.categories && restaurant.categories.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          {restaurant.categories.map(cat => (
                            <span
                              key={cat}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                isChef
                                  ? 'bg-[#FFF4E8] text-[#B84E12] border border-[#FCD8BE]/60'
                                  : 'bg-[#FAF7F2] text-stone-600 border border-[#EDE6DC]'
                              }`}
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 營業時間 */}
                      {restaurant.businessHours && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 pt-0.5 truncate">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span className="truncate">{formatBusinessHours(restaurant.businessHours)}</span>
                        </div>
                      )}

                      {/* 地址 */}
                      {restaurant.address && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                          <span className="truncate">{restaurant.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 想踩點原因 / 店家備註 */}
                  {restaurant.note && (
                    <div className={`p-2.5 rounded-xl text-xs sm:text-sm font-medium border leading-relaxed ${
                      isChef
                        ? 'bg-[#FFF9EE] border-[#F2E4D2] text-[#6D4930]'
                        : 'bg-[#FAF7F2] border-[#ECE3D8] text-stone-700'
                    }`}>
                      <span className="font-bold text-amber-600 mr-1.5">💡 想吃原因：</span>
                      <span>{restaurant.note}</span>
                    </div>
                  )}
                </div>

                {/* 卡片下半部：操作列 */}
                <div className={`px-4 py-3 border-t flex flex-wrap items-center justify-between gap-2.5 ${
                  isChef ? 'bg-[#FFFDF9] border-[#F1E7DA]' : 'bg-[#FAF8F5] border-[#EFE9DF]'
                }`}>
                  {/* 外連捷徑 (Maps、電話、官網) */}
                  <div className="flex items-center gap-2">
                    {restaurant.googleMapsUrl && (
                      <a
                        href={restaurant.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => { e.stopPropagation(); soundManager.playPop(); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-stone-600 hover:text-stone-900 border border-stone-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                        title="開啟 Google 地圖導航"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>地圖</span>
                      </a>
                    )}
                    {restaurant.phone && (
                      <a
                        href={`tel:${restaurant.phone}`}
                        onClick={(e) => { e.stopPropagation(); soundManager.playPop(); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-stone-600 hover:text-stone-900 border border-stone-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                        title="撥打電話"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>電話</span>
                      </a>
                    )}
                    {restaurant.websiteUrl && (
                      <a
                        href={restaurant.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => { e.stopPropagation(); soundManager.playPop(); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-stone-600 hover:text-stone-900 border border-stone-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                        title="開啟官網 / 粉絲頁"
                      >
                        <Globe className="w-3.5 h-3.5 text-purple-600" />
                        <span>官網</span>
                      </a>
                    )}
                  </div>

                  {/* 核心英雄操作：🚩 踩點成功！移至美食名單（需解鎖管理模式） */}
                  {isAdminUnlocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        onMoveToVisited(restaurant);
                      }}
                      className={`btn-pebble inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm text-white shadow-soft transition-all cursor-pointer active:scale-95 ${
                        isChef
                          ? 'bg-gradient-to-r from-[#D85A2A] to-[#E86A43] hover:from-[#C24E22] hover:to-[#D55730]'
                          : 'bg-gradient-to-r from-japandi-sage to-emerald-600 hover:from-japandi-sage-dark hover:to-emerald-700'
                      }`}
                      title="踩點吃過覺得很讚，移至美食名單！"
                    >
                      <span>🚩 踩點成功！移至美食</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onRequireAdminUnlock?.();
                        soundManager.playPop();
                      }}
                      className={`btn-pebble inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer active:scale-95 ${
                        isChef
                          ? 'bg-white/80 hover:bg-white text-[#8A5A38] border-[#EADFCF]'
                          : 'bg-white hover:bg-japandi-oat text-japandi-text-muted hover:text-japandi-text border-[#E6DDD2]'
                      }`}
                      title="需先解鎖管理密碼才能將店家移至美食名單"
                    >
                      <Lock className="w-3.5 h-3.5 text-japandi-apricot shrink-0" />
                      <span>踩點升級（需解鎖）</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
