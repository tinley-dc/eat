export type OpinionType = 'like' | 'dislike' | 'neutral';

export interface DishRecord {
  id: string;
  name: string;              // 餐點名稱 (例: 清燉牛肉麵、炸雞塊)
  opinion: OpinionType;      // 'like': 可以再點 👍, 'dislike': 避雷/不吃 ⚡, 'neutral': 吃過普通 😐
  note?: string;             // 備註 (例: "微辣小朋友不敢吃", "肉質很嫩")
  photos?: string[];         // 餐點照片清單 (支援多張照片)
}

export interface Restaurant {
  id: string;
  name: string;              // 店名 (例: 巷口牛肉麵、麥當勞)
  categories: string[];      // 分類標籤 (例: ["拉麵米粉", "手工水餃"])
  images: string[];          // 照片清單 (Base64 或 Google Drive / Web URL)
  coverIndex: number;        // 封面照片索引
  dishes: DishRecord[];      // 餐點紀錄清單
  featuredDishId?: string;   // 使用者手動設定要在 Menu 顯示的代表餐點 ID
  note?: string;             // 店家備註 (例: 週二公休、可外送)
  businessHours?: string;    // 營業時間 / 幾點開始 (選填，例: 11:30 開始營業, 11:30 - 21:00)
  address?: string;          // 地址或捷運站 (選填)
  websiteUrl?: string;       // 店家官網 / FB / IG 粉絲專頁 (選填)
  bookingUrl?: string;       // 線上訂位網址 (選填，例: inline.app, OpenTable)
  googleMapsUrl?: string;    // Google Maps 連結 (選填，即時查看營業時間與評價)
  phone?: string;            // 聯絡電話 (選填，亦可記在店家備註中)
  updatedAt: number;         // 更新時間戳
  syncStatus?: 'synced' | 'pending' | 'local_only';
}

export interface CloudConfig {
  scriptUrl: string;         // Google Apps Script Web App URL
  autoSync: boolean;         // 是否開啟自動同步
  lastSyncedAt?: number;     // 上次同步時間戳
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
}

export const PRESET_CATEGORIES: CategoryItem[] = [
  { id: 'all', name: '全部', icon: '🍽️' },
  { id: 'breakfast', name: '早午餐', icon: '🥪' },
  { id: 'combo', name: '複合', icon: '🍱' },
  { id: 'rice', name: '飯食', icon: '🍚' },
  { id: 'noodle', name: '麵食', icon: '🍜' },
  { id: 'steak', name: '排餐', icon: '🥩' },
  { id: 'dumpling', name: '水餃', icon: '🥟' },
  { id: 'hotpot', name: '火鍋', icon: '🍲' },
  { id: 'fastfood', name: '速食', icon: '🍔' },
  { id: 'other', name: '其它', icon: '🍴' },
];

export const DEFAULT_RESTAURANT_IMAGE = '/default_restaurant_cover.jpg';
