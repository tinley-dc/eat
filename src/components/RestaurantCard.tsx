import React, { useState, useEffect, useRef } from 'react';
import { Restaurant, DEFAULT_RESTAURANT_IMAGE, OpinionType } from '../types';
import { soundManager } from '../utils/sound';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatBusinessHours } from '../utils/googleMapsParser';
import { useTheme } from '../context/ThemeContext';
import { SafeImage } from './SafeImage';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onViewDetail: (restaurant: Restaurant) => void;
  onEdit: (restaurant: Restaurant) => void;
  cardIndex?: number;
}

// 嚴格對標目標設計稿（media_1792390039284.png）低飽和暖和風色票（Japandi 風）
const CARD_PALETTES = [
  {
    cardBg: 'bg-[#CCD8CD]',          // 柔霧鼠尾草灰綠 (原圖精確取色)
    titleColor: 'text-[#243528]',
  },
  {
    cardBg: 'bg-[#F5C7A9]',          // 奶油溫潤杏桃粉 (原圖精確取色)
    titleColor: 'text-[#4A2613]',
  },
  {
    cardBg: 'bg-[#CAD3DF]',          // 柔霧晴空淡藍
    titleColor: 'text-[#203144]',
  },
  {
    cardBg: 'bg-[#E3D7C5]',          // 溫潤燕麥奶色
    titleColor: 'text-[#423420]',
  }
];

// 小廚神菜單風（方案 B）：還原原圖純白/米白手作菜單卡，搭配繽紛甜點與飲品手繪字色
const CHEF_CARD_PALETTES = [
  {
    cardBg: 'bg-white',
    titleColor: 'text-[#D86824]',          // 活力蜜桃甜點橘（對標原圖 DESSERTS）
    badgeBg: 'bg-[#FFF6ED] text-[#B84E12] border-[#FCD8BE]',
    accentColor: '#D86824',
  },
  {
    cardBg: 'bg-white',
    titleColor: 'text-[#2D7A46]',          // 清新薄荷羅勒綠（對標原圖 DRINKS）
    badgeBg: 'bg-[#EDF7F0] text-[#1E5C33] border-[#C4E7CF]',
    accentColor: '#2D7A46',
  },
  {
    cardBg: 'bg-white',
    titleColor: 'text-[#C73E29]',          // 經典蕃茄珊瑚紅
    badgeBg: 'bg-[#FDF1EF] text-[#A62714] border-[#F8CEC7]',
    accentColor: '#C73E29',
  },
  {
    cardBg: 'bg-white',
    titleColor: 'text-[#8A501F]',          // 濃醇焦糖烤吐司棕
    badgeBg: 'bg-[#F9F4EE] text-[#693911] border-[#EADAC8]',
    accentColor: '#8A501F',
  }
];

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onViewDetail,
  cardIndex = 0,
}) => {
  // 彙整店家照片與餐點照片
  const carouselItems: {
    url: string;
    source: 'restaurant' | 'dish';
    dishName?: string;
    dishOpinion?: OpinionType;
  }[] = [];

  // 1. 店家整體照片
  (restaurant.images || []).forEach((url) => {
    carouselItems.push({
      url,
      source: 'restaurant',
    });
  });

  // 2. 餐點照片
  (restaurant.dishes || []).forEach((dish) => {
    (dish.photos || []).forEach((url) => {
      carouselItems.push({
        url,
        source: 'dish',
        dishName: dish.name,
        dishOpinion: dish.opinion,
      });
    });
  });

  // 初始索引：優先指向用戶設定的封面照片
  const initialIndex = (restaurant.coverIndex !== undefined && restaurant.coverIndex < (restaurant.images?.length || 0))
    ? restaurant.coverIndex
    : 0;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // 當店家資料改變時重置索引
  useEffect(() => {
    const nextIdx = (restaurant.coverIndex !== undefined && restaurant.coverIndex < (restaurant.images?.length || 0))
      ? restaurant.coverIndex
      : 0;
    setCurrentIndex(nextIdx);
  }, [restaurant.id, restaurant.coverIndex]);

  // 安全防護有效索引
  const safeIndex = carouselItems.length > 0
    ? (currentIndex >= 0 && currentIndex < carouselItems.length ? currentIndex : 0)
    : 0;
  const currentItem = carouselItems[safeIndex];
  const currentImage = currentItem?.url || DEFAULT_RESTAURANT_IMAGE;

  // 自動輪播（4.5 秒，滑鼠懸停暫停）
  useEffect(() => {
    if (carouselItems.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [carouselItems.length, isHovered]);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (carouselItems.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (carouselItems.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // 水平滑動幅度大於 35px 且大於垂直滑動時觸發切換
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const { theme } = useTheme();
  const isChef = theme === 'chef_menu';

  const palette = isChef 
    ? CHEF_CARD_PALETTES[cardIndex % CHEF_CARD_PALETTES.length]
    : CARD_PALETTES[cardIndex % CARD_PALETTES.length];

  return (
    <div 
      onClick={() => {
        onViewDetail(restaurant);
        soundManager.playPop();
      }}
      className={`${
        isChef
          ? 'rounded-t-[34px] sm:rounded-t-[54px] rounded-b-[26px] sm:rounded-b-[46px] border-2 border-[#F3ECE1] hover:border-[#E8D9C5] shadow-soft hover:shadow-float hover:-translate-y-1.5'
          : 'rounded-t-[36px] sm:rounded-t-[54px] rounded-b-[28px] sm:rounded-b-[46px] shadow-soft hover:shadow-float hover:-translate-y-1'
      } ${palette.cardBg} transition-all duration-300 p-3 sm:p-6 pb-3.5 sm:pb-7 cursor-pointer flex flex-col justify-between group relative`}
    >
      <div>
        {/* 照片區域（純淨舒展大拱門，同原版食譜卡） */}
        <div 
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div 
            className="relative aspect-[4/3.8] w-full rounded-t-[26px] sm:rounded-t-[46px] rounded-b-[18px] sm:rounded-b-[30px] overflow-hidden bg-white shadow-soft select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* 照片本體 */}
            <SafeImage
              src={currentImage}
              alt={currentItem?.dishName || restaurant.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />

            {/* 柔和漸層陰影：提高白色標籤與白色指示點的對比度 */}
            {carouselItems.length > 0 && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35 pointer-events-none" />
            )}

            {/* 左上角標籤：店家環境 / 餐點名稱 */}
            {currentItem && (
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 pointer-events-none max-w-[75%]">
                <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/90 backdrop-blur-md shadow-sm text-[10px] sm:text-sm font-black truncate ${
                  isChef ? 'text-[#4A2613]' : 'text-stone-800'
                }`}>
                  <span className="shrink-0 text-xs sm:text-base">
                    {currentItem.source === 'dish' 
                      ? (currentItem.dishOpinion === 'dislike' ? (isChef ? '⚠️' : '⚡') : (isChef ? '⭐' : '🍽️'))
                      : (isChef ? '👨‍🍳' : '🏠')
                    }
                  </span>
                  <span className="truncate">
                    {currentItem.source === 'dish' ? currentItem.dishName : (isChef ? '店景' : '環境')}
                  </span>
                </span>
              </div>
            )}

            {/* 右上角張數計數（多於 1 張時顯示，例：1/3） */}
            {carouselItems.length > 1 && (
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 pointer-events-none">
                <span className={`inline-block px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-bold shadow-sm tracking-wider ${
                  isChef
                    ? 'bg-[#4A2613]/80 text-[#FFF9EE] backdrop-blur-md border border-[#F3A935]/40'
                    : 'bg-black/45 backdrop-blur-md text-white'
                }`}>
                  {safeIndex + 1}/{carouselItems.length}
                </span>
              </div>
            )}

            {/* 左右切換箭頭（多於 1 張時顯示：手機端常態可點，電腦端 hover 浮現） */}
            {carouselItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="上一張照片"
                  className="absolute left-1.5 sm:left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/85 hover:bg-white text-stone-800 shadow-md backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-110 z-20 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="下一張照片"
                  className="absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/85 hover:bg-white text-stone-800 shadow-md backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-110 z-20 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </button>
              </>
            )}

            {/* 下方圓點指示器（多於 1 張時顯示，若大於 6 張則精簡呈現） */}
            {carouselItems.length > 1 && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-2 sm:bottom-3 left-0 right-0 flex items-center justify-center gap-1 sm:gap-1.5 z-20 pointer-events-auto px-2 sm:px-4"
              >
                {carouselItems.slice(0, 6).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                      idx === safeIndex 
                        ? 'w-3 sm:w-4 bg-white shadow' 
                        : 'w-1 sm:w-1.5 bg-white/60 hover:bg-white'
                    }`}
                    aria-label={`切換至第 ${idx + 1} 張照片`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 標題與營業時間（對標原圖純白菜單卡上的繽紛手繪標題與精緻標籤） */}
        <div className="mt-2.5 sm:mt-5 mb-0.5 sm:mb-1 text-center px-1 sm:px-2 flex flex-col items-center">
          <h3 className={`font-black text-sm sm:text-2xl ${palette.titleColor} tracking-wide group-hover:scale-105 transition-transform leading-snug line-clamp-1 sm:line-clamp-none`}>
            {restaurant.name}
          </h3>
          {restaurant.businessHours && (
            <div className={`mt-1 sm:mt-2 inline-flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-sm font-bold px-2 py-0.5 sm:px-3 sm:py-0.5 rounded-full ${
              isChef && 'badgeBg' in palette
                ? `${palette.badgeBg} border font-black shadow-2xs`
                : 'bg-black/5 text-[#423420] opacity-80'
            }`}>
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate max-w-[110px] sm:max-w-none">{formatBusinessHours(restaurant.businessHours)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
