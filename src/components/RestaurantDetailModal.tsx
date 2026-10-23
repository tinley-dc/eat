import React, { useState, useEffect, useRef } from 'react';
import { Restaurant, DEFAULT_RESTAURANT_IMAGE } from '../types';
import { 
  X, 
  MapPin, 
  StickyNote, 
  Edit3, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Camera,
  Globe,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react';
import { soundManager } from '../utils/sound';
import { formatBusinessHours } from '../utils/googleMapsParser';
import { useTheme } from '../context/ThemeContext';
import { SafeImage } from './SafeImage';

interface RestaurantDetailModalProps {
  restaurant: Restaurant | null;
  onClose: () => void;
  onEdit: (restaurant: Restaurant) => void;
  onDelete: (id: string, name: string) => void;
  isAdminUnlocked?: boolean;
}

export const RestaurantDetailModal: React.FC<RestaurantDetailModalProps> = ({
  restaurant,
  onClose,
  onEdit,
  onDelete,
  isAdminUnlocked = false,
}) => {
  // 彙整「店家整體照片」與「吃過什麼餐點照片」
  const carouselItems: {
    url: string;
    source: 'restaurant' | 'dish';
    dishName?: string;
    dishOpinion?: 'like' | 'dislike' | 'neutral';
  }[] = [];

  (restaurant?.images || []).forEach(url => {
    carouselItems.push({
      url,
      source: 'restaurant'
    });
  });

  (restaurant?.dishes || []).forEach(dish => {
    (dish.photos || []).forEach(url => {
      carouselItems.push({
        url,
        source: 'dish',
        dishName: dish.name,
        dishOpinion: dish.opinion
      });
    });
  });

  const { theme } = useTheme();
  const isChef = theme === 'chef_menu';

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 切換店家或開啟時，重設照片索引至封面照片（絕不越界），並收合街區地圖與重設捲動位置
  useEffect(() => {
    if (restaurant) {
      const initialIdx = (restaurant.coverIndex !== undefined && restaurant.coverIndex < (restaurant.images?.length || 0))
        ? restaurant.coverIndex
        : 0;
      setActiveImageIndex(initialIdx);
      setShowMiniMap(false);
      setIsScrolled(false);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, [restaurant?.id, restaurant?.coverIndex, restaurant?.images?.length]);

  if (!restaurant) return null;

  // 安全防護：計算確保有效的索引，即使前次索引停留在大數值也不會指向 undefined
  const safeImageIndex = carouselItems.length > 0
    ? (activeImageIndex >= 0 && activeImageIndex < carouselItems.length ? activeImageIndex : 0)
    : 0;
  const currentItem = carouselItems[safeImageIndex];
  const currentImage = currentItem?.url;

  const likeDishes = restaurant.dishes.filter(d => d.opinion === 'like');
  const dislikeDishes = restaurant.dishes.filter(d => d.opinion === 'dislike');
  const neutralDishes = restaurant.dishes.filter(d => d.opinion === 'neutral');

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % carouselItems.length);
    soundManager.playPop();
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
    soundManager.playPop();
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 20) {
      if (!isScrolled) setIsScrolled(true);
    } else {
      if (isScrolled) setIsScrolled(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm animate-fadeIn"
        onClick={() => { onClose(); soundManager.playPop(); }}
      >
        <div 
          className={`bg-white rounded-[32px] sm:rounded-[36px] max-w-2xl w-full max-h-[92vh] shadow-float border ${
            isChef ? 'border-[#EFE5D8]' : 'border-[#E5DDD2]'
          } flex flex-col relative animate-scaleUp overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 固定在右上角的關閉按鈕（獨立於捲動區之外，捲動時永遠保持在右上角） */}
          <button
            type="button"
            onClick={() => { onClose(); soundManager.playPop(); }}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-40 bg-black/50 hover:bg-black/75 backdrop-blur-md text-white p-2.5 rounded-full shadow-md transition-all hover:scale-105 active:scale-95 border border-white/25 cursor-pointer"
            aria-label="關閉"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* 內部可捲動容器 */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="w-full flex-1 overflow-y-auto no-scrollbar"
          >
            {/* 照片輪播區（方案 B：現代美食畫報滿版大頂圖 ＋ 溫和拱門弧線過渡 ＋ 餐點標籤） */}
            <div className="relative w-full h-64 sm:h-80 shrink-0 overflow-hidden bg-white select-none group">
              {carouselItems.length > 0 && currentImage ? (
                <>
                  {/* 滿版大圖（點擊可展開全螢幕燈箱大圖） */}
                  <SafeImage
                    src={currentImage}
                    alt={currentItem?.dishName || restaurant.name}
                    onClick={() => { setShowLightbox(true); soundManager.playPop(); }}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 cursor-pointer"
                  />

                  {/* 頂部微漸層，確保關閉按鈕與餐點標籤高對比清晰可見 */}
                  <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 via-black/15 to-transparent pointer-events-none" />

                  {/* 若為餐點照片，顯示精美餐點標籤徽章 */}
                  {currentItem?.source === 'dish' && (
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-sm font-bold border border-white/20 shadow-md animate-fadeIn">
                      <span>{currentItem.dishOpinion === 'like' ? (isChef ? '⭐' : '💮') : currentItem.dishOpinion === 'dislike' ? '⚠️' : '🍽️'}</span>
                      <span className="max-w-[150px] sm:max-w-[200px] truncate">{currentItem.dishName || '餐點照片'}</span>
                      {currentItem.dishOpinion === 'like' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                          isChef ? 'bg-[#D85A2A] text-white shadow-xs' : 'bg-japandi-sage text-white'
                        }`}>
                          {isChef ? '招牌' : '必點'}
                        </span>
                      )}
                      {currentItem.dishOpinion === 'dislike' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                          isChef ? 'bg-[#C73E29] text-white shadow-xs' : 'bg-japandi-terracotta text-white'
                        }`}>
                          避雷
                        </span>
                      )}
                    </div>
                  )}

                  {/* 溫柔和紙拱門弧線過渡 (Soft Arch Transition) */}
                  <div className="absolute -bottom-0.5 left-0 right-0 z-20 pointer-events-none">
                    <svg 
                      viewBox="0 0 1440 60" 
                      fill="none" 
                      className="w-full h-7 sm:h-10 text-white" 
                      preserveAspectRatio="none"
                    >
                      <path 
                        d="M0,60 L0,30 Q720,-10 1440,30 L1440,60 Z" 
                        fill="currentColor" 
                      />
                    </svg>
                  </div>

                  {/* 左右翻頁箭頭（毛玻璃質感膠囊，捲動時智慧淡出避免與固定關閉按鈕重疊衝突） */}
                  {carouselItems.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-2.5 rounded-full shadow-soft transition-all duration-300 border border-white/20 ${
                          isScrolled ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 hover:scale-110'
                        }`}
                        aria-label="上一張照片"
                      >
                        <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-2.5 rounded-full shadow-soft transition-all duration-300 border border-white/20 ${
                          isScrolled ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 hover:scale-110'
                        }`}
                        aria-label="下一張照片"
                      >
                        <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                      </button>

                      {/* 中間小圓點導航 */}
                      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 pointer-events-auto transition-opacity duration-300 ${
                        isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'
                      }`}>
                        {carouselItems.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); soundManager.playPop(); }}
                            className={`h-2 rounded-full cursor-pointer transition-all ${
                              idx === safeImageIndex ? 'w-6 bg-white shadow-md' : 'w-2 bg-white/60 hover:bg-white/80'
                            }`}
                            aria-label={`切換至第 ${idx + 1} 張照片`}
                            title={item.source === 'dish' ? `餐點：${item.dishName}` : '店家環境'}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* 右下角照片計數與放大徽章（點擊看大圖，捲動時智慧淡出） */}
                  <div 
                    onClick={() => { setShowLightbox(true); soundManager.playPop(); }}
                    className={`absolute bottom-6 right-4 sm:right-6 z-20 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all duration-300 border border-white/20 ${
                      isScrolled ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 hover:scale-105'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{safeImageIndex + 1}/{carouselItems.length}</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full relative">
                  <img
                    src={DEFAULT_RESTAURANT_IMAGE}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
                  <div className="absolute bottom-6 left-6 z-20 bg-black/50 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 border border-white/20">
                    <Camera className="w-3.5 h-3.5" />
                    <span>預設手繪圖（可點擊「編輯」上傳照片）</span>
                  </div>
                </div>
              )}
            </div>

          {/* 內文資訊區 */}
          <div className="p-6 sm:p-7 pt-3 sm:pt-4 space-y-6">
            {/* 標題與操作列 */}
            <div className={`flex items-start justify-between gap-4 border-b ${isChef ? 'border-[#F0E6D8]' : 'border-[#F0EAE1]'} pb-5`}>
              <div className="min-w-0 flex-1">
                {/* 分類小標籤（改為純資訊平面小貼紙，不與按鈕混淆） */}
                {restaurant.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {restaurant.categories.map((c, i) => (
                      <span key={i} className={`font-bold text-sm px-3 py-1 rounded-lg border select-none cursor-default ${
                        isChef
                          ? 'bg-[#F4ECE1] text-[#7A543E] border-[#E5DACB]'
                          : 'bg-japandi-oat text-[#3E5C49] border-[#E6DDD2]'
                      }`}>
                        #{c}
                      </span>
                    ))}
                  </div>
                )}
                <h2 className={`text-2xl sm:text-3xl font-black tracking-tight break-words ${
                  isChef ? 'text-[#4A2613]' : 'text-japandi-text'
                }`}>
                  {restaurant.name}
                </h2>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2.5">
                  {restaurant.businessHours && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm sm:text-base font-bold border select-none cursor-default ${
                      isChef
                        ? 'bg-[#FBF6EE] text-[#7D5638] border-[#EADFCF]'
                        : 'bg-[#FDF4EC] text-[#9E5727] border-[#F8E1CE]'
                    }`}>
                      <Clock className={`w-4 h-4 shrink-0 ${isChef ? 'text-[#D86824]' : 'text-[#D97706]'}`} />
                      <span>{formatBusinessHours(restaurant.businessHours)}</span>
                    </div>
                  )}
                  {restaurant.address && (
                    <p className={`text-sm sm:text-base flex items-center gap-1.5 font-medium ${
                      isChef ? 'text-[#7A543E]' : 'text-japandi-text-muted'
                    }`}>
                      <MapPin className={`w-4 h-4 shrink-0 ${isChef ? 'text-[#D85A2A]' : 'text-japandi-sage'}`} />
                      <span>{restaurant.address}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 右側操作按鈕（僅在管理模式解鎖時開放：白底、實線邊框、浮凸陰影、點擊回饋） */}
              {isAdminUnlocked && (
                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={() => { onEdit(restaurant); soundManager.playPop(); }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-black text-sm rounded-xl transition-all whitespace-nowrap shrink-0 border-2 cursor-pointer shadow-sm hover:shadow active:scale-95 active:translate-y-0.5 ${
                      isChef
                        ? 'bg-white hover:bg-[#FFF9EE] text-[#4A2613] hover:text-[#D85A2A] border-[#E5D7C6] hover:border-[#D85A2A]'
                        : 'bg-japandi-oat hover:bg-[#EAE4DC] text-japandi-text border-[#E6DDD2] shadow-soft'
                    }`}
                    title="編輯店家資訊"
                  >
                    <Edit3 className={`w-4 h-4 shrink-0 ${isChef ? 'text-[#D85A2A]' : ''}`} />
                    <span className="whitespace-nowrap">編輯</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { onDelete(restaurant.id, restaurant.name); soundManager.playPop(); }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-black text-sm rounded-xl transition-all whitespace-nowrap shrink-0 border-2 cursor-pointer shadow-sm hover:shadow active:scale-95 active:translate-y-0.5 ${
                      isChef
                        ? 'bg-white hover:bg-[#FDF2F0] text-[#7A543E] hover:text-[#C73E29] border-[#E5D7C6] hover:border-[#F8CEC7]'
                        : 'bg-[#FDF2F0] hover:bg-[#F9E2DE] text-japandi-terracotta-dark border-transparent shadow-soft'
                    }`}
                    title="刪除此店家"
                  >
                    <Trash2 className={`w-4 h-4 shrink-0 ${isChef ? 'text-[#C73E29]' : ''}`} />
                    <span className="whitespace-nowrap">刪除</span>
                  </button>
                </div>
              )}
            </div>

          {/* 快捷操作按鈕列（強化按鈕實體質感，與上方標籤完全區隔） */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 🌐 店家官網 / 社群粉專（高對比亮眼按鈕） */}
            {restaurant.websiteUrl && (
              <a
                href={restaurant.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundManager.playPop()}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm transition-all cursor-pointer border shadow-sm hover:shadow-md active:scale-95 active:translate-y-0.5 ${
                  isChef
                    ? 'bg-[#F3A935] hover:bg-[#E29520] active:bg-[#CF8415] text-[#3E1F0D] border-[#E29520]'
                    : 'bg-[#EAF3EC] hover:bg-[#DCECE0] text-japandi-sage-dark border-[#CDE1D3] shadow-soft'
                }`}
                title="開啟店家官方網站或社群粉專"
              >
                <Globe className="w-4 h-4 stroke-[2.5]" />
                <span>店家官網</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            )}

            {/* 📅 線上訂位（醒目珊瑚紅行動呼籲按鈕） */}
            {restaurant.bookingUrl && (
              <a
                href={restaurant.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundManager.playPop()}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm transition-all cursor-pointer border shadow-sm hover:shadow-md active:scale-95 active:translate-y-0.5 ${
                  isChef
                    ? 'bg-[#E86A43] hover:bg-[#D45630] active:bg-[#BF4724] text-white border-[#D45630]'
                    : 'bg-[#FDF2EA] hover:bg-[#FAE5D7] text-[#A65313] border-[#F5D8C3] shadow-soft'
                }`}
                title="開啟線上訂位網址"
              >
                <Calendar className="w-4 h-4 stroke-[2.5]" />
                <span>線上訂位</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            )}

            {/* 📍 街區地圖（可收合內嵌地圖按鈕） */}
            {(restaurant.address || restaurant.name) && (
              <button
                type="button"
                onClick={() => {
                  setShowMiniMap(prev => !prev);
                  soundManager.playPop();
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm transition-all cursor-pointer border-2 shadow-sm hover:shadow-md active:scale-95 active:translate-y-0.5 ${
                  showMiniMap
                    ? (isChef ? 'bg-[#4A2613] text-[#FFE8D6] border-[#381B0C] shadow-inner' : 'bg-japandi-sage text-white border-japandi-sage-dark')
                    : (isChef ? 'bg-white hover:bg-[#FFF9EE] text-[#4A2613] hover:text-[#D85A2A] border-[#DECFC0] hover:border-[#D85A2A]' : 'bg-japandi-oat hover:bg-[#EAE4DC] text-japandi-text border-[#E6DDD2] shadow-soft')
                }`}
                title="切換顯示內嵌街區迷你地圖"
              >
                <MapPin className={`w-4 h-4 ${showMiniMap ? 'text-[#F3A935]' : 'text-[#D85A2A]'}`} />
                <span>{showMiniMap ? '收合地圖' : '街區地圖'}</span>
                {showMiniMap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* 方案 B：內嵌街區迷你地圖（展開式） */}
          {showMiniMap && (
            <div className={`rounded-2xl overflow-hidden border bg-white shadow-soft animate-scaleUp ${
              isChef ? 'border-[#EADAC5]' : 'border-[#DFD6CA]'
            }`}>
              <div className={`px-4 py-2.5 border-b flex items-center text-xs sm:text-sm font-bold ${
                isChef ? 'bg-[#FFF8EE] border-[#F5E6D3] text-[#7A543E]' : 'bg-[#F7F3EE] border-[#EDE6DC] text-japandi-text-muted'
              }`}>
                <span className={`flex items-center gap-1.5 ${isChef ? 'text-[#4A2613] font-black' : 'text-japandi-text'}`}>
                  <MapPin className={`w-4 h-4 ${isChef ? 'text-[#D85A2A]' : 'text-japandi-sage'}`} />
                  <span>{restaurant.address || restaurant.name} 周邊街區</span>
                </span>
              </div>
              <div className="w-full h-60 sm:h-72 bg-[#EAE5DF] relative">
                <iframe
                  title={`${restaurant.name} 街區地圖`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen={false}
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent((restaurant.address ? restaurant.address + ' ' : '') + restaurant.name)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                />
              </div>
            </div>
          )}

          {/* 店家備忘 */}
          {restaurant.note && (
            <div className={`border rounded-2xl p-4 flex items-start gap-3 text-sm sm:text-base ${
              isChef
                ? 'bg-[#FFF9EE] border-[#EADAC5] text-[#4A2613]'
                : 'bg-[#FAF6F0] border-[#EADBCC] text-japandi-text'
            }`}>
              <StickyNote className={`w-5 h-5 mt-0.5 shrink-0 ${isChef ? 'text-[#D85A2A]' : 'text-japandi-apricot'}`} />
              <div>
                <span className="font-bold">店家備忘小抄：</span>
                <span className={`ml-1 leading-relaxed ${isChef ? 'text-[#7A543E]' : 'text-japandi-text-muted'}`}>{restaurant.note}</span>
              </div>
            </div>
          )}

          {/* 餐點紅黑榜（日系印章手帳風 vs Little Chef 菜單推薦） */}
          <div className="space-y-6">
            <h3 className={`font-black text-lg sm:text-xl flex items-center justify-between ${
              isChef ? 'text-[#4A2613]' : 'text-japandi-text'
            }`}>
              <span>🍽️ 吃過哪些餐點？</span>
              <span className={`text-sm px-3 py-1 rounded-full font-bold ${
                isChef
                  ? 'bg-[#FFF5ED] text-[#D86824] border border-[#FAD7C0]'
                  : 'bg-japandi-oat text-japandi-text-muted'
              }`}>
                共 {restaurant.dishes.length} 項紀錄
              </span>
            </h3>

            {/* 🌟 必點推薦（有資料才顯示） */}
            {likeDishes.length > 0 && (
              <div>
                <div className={`flex items-center gap-2 font-black text-base mb-3 ${
                  isChef ? 'text-[#D85A2A]' : 'text-japandi-sage-dark'
                }`}>
                  <span className="text-lg">{isChef ? '⭐' : '💮'}</span>
                  <span>{isChef ? '主廚招牌必點（CHEF PICK ★）' : '可以再點一次（必吃推薦）'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {likeDishes.map((dish) => {
                    const dishPhoto = dish.photos && dish.photos.length > 0 ? dish.photos[0] : null;
                    const globalIndex = dishPhoto ? carouselItems.findIndex(item => item.url === dishPhoto) : -1;
                    return (
                      <div
                        key={dish.id}
                        className={`relative rounded-2xl p-3 sm:p-3.5 border-2 shadow-soft transition-all flex items-center gap-3 sm:gap-3.5 ${
                          isChef
                            ? 'bg-[#FFFDF9] border-[#F2E6D8] hover:border-[#FCD8BE]'
                            : 'bg-[#F3F7F4] border-[#CFE1D4] hover:border-[#B7D4BF]'
                        }`}
                      >
                        {/* 餐點單張照片（點擊放大） */}
                        {dishPhoto && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (globalIndex >= 0) setActiveImageIndex(globalIndex);
                              setShowLightbox(true);
                              soundManager.playPop();
                            }}
                            className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden border shadow-sm group cursor-pointer bg-white transition-transform hover:scale-105 ${
                              isChef ? 'border-[#EADAC5]' : 'border-black/10'
                            }`}
                            title={`點擊放大查看 ${dish.name} 照片`}
                          >
                            <SafeImage src={dishPhoto} alt={dish.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                              <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                            </div>
                          </button>
                        )}

                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <div className={`font-black text-base sm:text-lg tracking-tight truncate leading-snug ${
                            isChef ? 'text-[#D85A2A]' : 'text-japandi-sage-dark'
                          }`}>
                            {dish.name}
                          </div>

                          {dish.note && (
                            <p className={`text-sm sm:text-base mt-1 line-clamp-2 leading-relaxed ${
                              isChef ? 'text-[#7A543E]' : 'text-japandi-sage-dark/90'
                            }`}>
                              💬 {dish.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ⚠️ 避雷警示（有踩雷紀錄才顯示，無資料不顯示） */}
            {dislikeDishes.length > 0 && (
              <div>
                <div className={`flex items-center gap-2 font-black text-base mb-3 ${
                  isChef ? 'text-[#C73E29]' : 'text-japandi-terracotta-dark'
                }`}>
                  <span className="text-lg">⚠️</span>
                  <span>{isChef ? '主廚踩雷備忘（WATCH OUT ⚠️）' : '小心避雷（別再點錯了！）'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dislikeDishes.map((dish) => {
                    const dishPhoto = dish.photos && dish.photos.length > 0 ? dish.photos[0] : null;
                    const globalIndex = dishPhoto ? carouselItems.findIndex(item => item.url === dishPhoto) : -1;
                    return (
                      <div
                        key={dish.id}
                        className={`relative rounded-2xl p-3 sm:p-3.5 border-2 shadow-soft transition-all flex items-center gap-3 sm:gap-3.5 ${
                          isChef
                            ? 'bg-[#FFFDF9] border-[#F8CEC7] hover:border-[#F2AEA4]'
                            : 'bg-[#FCF2F0] border-[#F2D1CB] hover:border-[#E8B8B0]'
                        }`}
                      >
                        {/* 避雷小徽章固定在卡片右上角 */}
                        <span className={`absolute top-2.5 right-2.5 text-xs font-black px-2 py-0.5 rounded-md border shrink-0 ${
                          isChef
                            ? 'bg-[#FDF1EF] text-[#C73E29] border-[#F8CEC7]'
                            : 'bg-white text-japandi-terracotta-dark border-[#F2D1CB]'
                        }`}>
                          避雷
                        </span>

                        {/* 餐點單張照片（點擊放大） */}
                        {dishPhoto && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (globalIndex >= 0) setActiveImageIndex(globalIndex);
                              setShowLightbox(true);
                              soundManager.playPop();
                            }}
                            className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden border shadow-sm group cursor-pointer bg-white transition-transform hover:scale-105 ${
                              isChef ? 'border-[#F8CEC7]' : 'border-black/10'
                            }`}
                            title={`點擊放大查看 ${dish.name} 照片`}
                          >
                            <SafeImage src={dishPhoto} alt={dish.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                              <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                            </div>
                          </button>
                        )}

                        <div className="min-w-0 flex-1 flex flex-col justify-center pr-12">
                          <div className={`font-black text-base sm:text-lg tracking-tight truncate leading-snug ${
                            isChef ? 'text-[#C73E29]' : 'text-japandi-terracotta-dark'
                          }`}>
                            {dish.name}
                          </div>

                          {dish.note && (
                            <p className={`text-sm sm:text-base mt-1 line-clamp-2 leading-relaxed ${
                              isChef ? 'text-[#C73E29]/95' : 'text-japandi-terracotta-dark/95'
                            }`}>
                              ⚠️ {dish.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🥢 普通品項 */}
            {neutralDishes.length > 0 && (
              <div>
                <div className={`flex items-center gap-2 font-black text-base mb-3 ${
                  isChef ? 'text-[#7A543E]' : 'text-japandi-text-muted'
                }`}>
                  <span className="text-lg">🥢</span>
                  <span>{isChef ? '其他嚐鮮紀錄' : '吃過普通 / 其他餐點'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {neutralDishes.map((dish) => {
                    const dishPhoto = dish.photos && dish.photos.length > 0 ? dish.photos[0] : null;
                    const globalIndex = dishPhoto ? carouselItems.findIndex(item => item.url === dishPhoto) : -1;
                    return (
                      <div
                        key={dish.id}
                        className={`relative rounded-2xl p-3 sm:p-3.5 border-2 shadow-soft transition-all flex items-center gap-3 sm:gap-3.5 ${
                          isChef
                            ? 'bg-[#FFFDF9] border-[#EADAC5] hover:border-[#D8C2A8]'
                            : 'bg-japandi-oat border-[#EDE6DC] hover:border-[#DFD6C9]'
                        }`}
                      >
                        {/* 餐點單張照片（點擊放大） */}
                        {dishPhoto && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (globalIndex >= 0) setActiveImageIndex(globalIndex);
                              setShowLightbox(true);
                              soundManager.playPop();
                            }}
                            className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden border shadow-sm group cursor-pointer bg-white transition-transform hover:scale-105 ${
                              isChef ? 'border-[#EADAC5]' : 'border-black/10'
                            }`}
                            title={`點擊放大查看 ${dish.name} 照片`}
                          >
                            <SafeImage src={dishPhoto} alt={dish.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                              <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                            </div>
                          </button>
                        )}

                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <div className={`font-black text-base sm:text-lg tracking-tight truncate leading-snug ${
                            isChef ? 'text-[#4A2613]' : 'text-japandi-text'
                          }`}>
                            {dish.name}
                          </div>

                          {dish.note && (
                            <p className={`text-sm sm:text-base mt-1 line-clamp-2 leading-relaxed ${
                              isChef ? 'text-[#9A7B68]' : 'text-japandi-text-muted'
                            }`}>
                              💬 {dish.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 若整間店完全無任何餐點紀錄時的乾淨佔位提示 */}
            {restaurant.dishes.length === 0 && (
              <p className={`text-sm italic p-4 rounded-2xl border text-center ${
                isChef
                  ? 'text-[#9A7B68] bg-[#FFF9EE] border-[#F2E5D5]'
                  : 'text-japandi-text-muted bg-japandi-oat border-[#EDE6DC]'
              }`}>
                {isChef ? '主廚尚未新增此店的餐點紀錄，下次吃過記得來記錄！' : '尚未記錄此店的餐點心得，吃過記得來記錄喔！'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>

      {/* 全螢幕大圖燈箱 (Lightbox) */}
      {showLightbox && carouselItems.length > 0 && (
        <div 
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setShowLightbox(false)}
        >
          {/* 關閉按鈕 */}
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-5 right-5 z-50 bg-white/20 hover:bg-white/35 text-white p-3 rounded-full transition-transform hover:scale-105 backdrop-blur-sm"
            aria-label="關閉全螢幕預覽"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* 圖片容器 */}
          <div 
            className="relative max-w-5xl max-h-[90vh] flex items-center justify-center select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <SafeImage
              src={currentImage}
              alt={currentItem?.dishName || restaurant.name}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-scaleUp bg-white"
            />

            {/* 多圖翻頁 */}
            {carouselItems.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-2 sm:-left-14 top-1/2 -translate-y-1/2 bg-black/50 sm:bg-white/20 hover:bg-black/70 sm:hover:bg-white/35 text-white p-3 rounded-full transition-all hover:scale-110 backdrop-blur-sm"
                  aria-label="上一張"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-2 sm:-right-14 top-1/2 -translate-y-1/2 bg-black/50 sm:bg-white/20 hover:bg-black/70 sm:hover:bg-white/35 text-white p-3 rounded-full transition-all hover:scale-110 backdrop-blur-sm"
                  aria-label="下一張"
                >
                  <ChevronRight className="w-6 h-6 stroke-[2.5]" />
                </button>
                <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 text-white font-bold text-sm bg-black/60 px-4 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm border border-white/10">
                  {currentItem?.source === 'dish' ? (
                    <span className="text-japandi-apricot flex items-center gap-1">
                      <span>{currentItem.dishOpinion === 'like' ? (isChef ? '⭐' : '💮') : currentItem.dishOpinion === 'dislike' ? '⚠️' : '🍽️'}</span>
                      <span>{currentItem.dishName}</span>
                    </span>
                  ) : (
                    <span>🏠 店家環境照片</span>
                  )}
                  <span className="text-white/70">({safeImageIndex + 1} / {carouselItems.length})</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
