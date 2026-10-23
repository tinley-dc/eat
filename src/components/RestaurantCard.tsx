import React from 'react';
import { Restaurant, DEFAULT_RESTAURANT_IMAGE } from '../types';
import { soundManager } from '../utils/sound';
import { Clock, MapPin, ChevronRight, Phone } from 'lucide-react';
import { formatBusinessHours } from '../utils/googleMapsParser';
import { useTheme } from '../context/ThemeContext';
import { SafeImage } from './SafeImage';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onViewDetail: (restaurant: Restaurant) => void;
  onEdit?: (restaurant: Restaurant) => void;
  cardIndex?: number;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onViewDetail,
  cardIndex: _cardIndex = 0,
}) => {
  const { theme } = useTheme();
  const isChef = theme === 'chef_menu';

  const storePhotos = restaurant.images || [];
  const dishes = restaurant.dishes || [];
  const featuredDish = 
    dishes.find((d) => d.id === restaurant.featuredDishId) ||
    dishes.find((d) => d.opinion === 'like') ||
    dishes[0];

  // 封面照片優先級：指定封面 -> 第一張店家圖 -> 代表餐點照片 -> 預設圖
  const coverUrl =
    (storePhotos.length > 0 && restaurant.coverIndex !== undefined && storePhotos[restaurant.coverIndex])
      ? storePhotos[restaurant.coverIndex]
      : (storePhotos.length > 0 ? storePhotos[0] : null) ||
        (featuredDish?.photos && featuredDish.photos.length > 0 ? featuredDish.photos[0] : null) ||
        DEFAULT_RESTAURANT_IMAGE;

  return (
    <div
      onClick={() => {
        onViewDetail(restaurant);
        soundManager.playPop();
      }}
      className={`group relative flex items-center gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-[20px] sm:rounded-[22px] border transition-all duration-200 cursor-pointer select-none active:scale-[0.99] shadow-soft hover:shadow-float ${
        isChef
          ? 'bg-white hover:bg-[#FFFDF9] border-[#F0E6D8] hover:border-[#E5DACB]'
          : 'bg-white hover:bg-[#FAF8F5] border-[#EBE3D7] hover:border-[#DCD2C3]'
      }`}
    >
      {/* 左側照片縮圖區 (精巧正方形，高度完美呼應三行資訊) */}
      <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-xl sm:rounded-2xl overflow-hidden shrink-0 relative bg-[#F7F3EE] shadow-2xs">
        <SafeImage
          src={coverUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          loading="lazy"
        />
      </div>

      {/* 右側資訊區 */}
      <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5 space-y-1 sm:space-y-1.5">
        {/* 頂部：店名靠左，分類標籤放到右上角 */}
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-black text-base sm:text-lg truncate leading-snug transition-colors flex-1 min-w-0 ${
            isChef
              ? 'text-[#4A2613] group-hover:text-[#D85A2A]'
              : 'text-stone-800 group-hover:text-japandi-sage-dark'
          }`}>
            {restaurant.name}
          </h3>

          {/* 分類標籤清單（右上角） */}
          {restaurant.categories && restaurant.categories.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-1 shrink-0">
              {restaurant.categories.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className={`inline-block text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    isChef
                      ? 'bg-[#FFF4E8] text-[#B84E12] border border-[#FCD8BE]/60'
                      : 'bg-[#FAF7F2] text-stone-600 border border-[#EDE6DC]'
                  }`}
                >
                  {cat}
                </span>
              ))}
              {restaurant.categories.length > 2 && (
                <span className="text-[10px] text-stone-400 font-bold whitespace-nowrap">
                  +{restaurant.categories.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 營業時間 */}
        {restaurant.businessHours && (
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-600 font-medium truncate">
            <Clock className={`w-3.5 h-3.5 shrink-0 ${isChef ? 'text-[#D85A2A]' : 'text-japandi-apricot'}`} />
            <span className="truncate">{formatBusinessHours(restaurant.businessHours)}</span>
          </div>
        )}

        {/* 地址 */}
        {restaurant.address && (
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-normal truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-stone-400" />
            <span className="truncate">{restaurant.address}</span>
          </div>
        )}

        {/* 電話 */}
        {restaurant.phone && (
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-normal truncate">
            <Phone className="w-3.5 h-3.5 shrink-0 text-stone-400" />
            <span className="truncate">{restaurant.phone}</span>
          </div>
        )}
      </div>

      {/* 右側箭頭指引 */}
      <div className="shrink-0 self-center pl-0.5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all">
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
      </div>
    </div>
  );
};
