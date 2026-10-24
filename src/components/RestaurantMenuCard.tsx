import React from 'react';
import { Restaurant, DEFAULT_RESTAURANT_IMAGE, DishRecord } from '../types';
import { soundManager } from '../utils/sound';
import { useTheme } from '../context/ThemeContext';
import { SafeImage } from './SafeImage';

interface RestaurantMenuCardProps {
  restaurant: Restaurant;
  onViewDetail: (restaurant: Restaurant) => void;
  cardIndex?: number;
}

export const RestaurantMenuCard: React.FC<RestaurantMenuCardProps> = ({
  restaurant,
  onViewDetail,
}) => {
  const { theme } = useTheme();
  const isChef = theme === 'chef_menu';

  // 取得使用者設定的代表餐點（或第一道餐點備案）
  const dishes = restaurant.dishes || [];
  const featuredDish: DishRecord | undefined = 
    (restaurant.featuredDishId ? dishes.find(d => d.id === restaurant.featuredDishId) : undefined) ||
    dishes.find(d => d.photos && d.photos.length > 0) ||
    (dishes.length > 0 ? dishes[0] : undefined);

  // 代表餐點照片：優先取餐點照片，若無則取店家照片，再無則使用預設圖
  const photoUrl = 
    (featuredDish?.photos && featuredDish.photos.length > 0)
      ? featuredDish.photos[0]
      : (dishes.find(d => d.photos && d.photos.length > 0)?.photos?.[0])
      || (restaurant.images && restaurant.images.length > 0
        ? (restaurant.images[restaurant.coverIndex || 0] || restaurant.images[0])
        : DEFAULT_RESTAURANT_IMAGE);

  return (
    <div
      onClick={() => {
        onViewDetail(restaurant);
        soundManager.playPop();
      }}
      className={`group cursor-pointer flex flex-col transition-all duration-200 select-none ${
        isChef
          ? 'bg-white hover:bg-[#FFFDF9] border border-[#F0E6D8] hover:border-[#E5DACB]'
          : 'bg-white hover:bg-[#FAF8F5] border border-[#EBE3D7] hover:border-[#DCD2C3]'
      } rounded-[24px] sm:rounded-[28px] p-2.5 sm:p-3 shadow-soft hover:shadow-float hover:-translate-y-1`}
    >
      {/* 餐點照片容器（正方形裁切，如點餐 App 示意圖風格） */}
      <div className="relative aspect-square w-full rounded-[18px] sm:rounded-[22px] overflow-hidden bg-white shadow-2xs">
        <SafeImage
          src={photoUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          loading="lazy"
        />
      </div>

      {/* 照片下方：僅單純顯示店家名稱（永遠置中） */}
      <div className="pt-2 sm:pt-2.5 px-1 pb-0.5 text-center">
        <h4 className={`text-sm sm:text-base font-bold truncate leading-tight transition-colors text-center ${
          isChef
            ? 'text-[#694228] group-hover:text-[#D85A2A]'
            : 'text-stone-700 group-hover:text-japandi-sage-dark'
        }`}>
          {restaurant.name}
        </h4>
      </div>
    </div>
  );
};
