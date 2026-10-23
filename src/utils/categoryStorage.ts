import { CategoryItem, PRESET_CATEGORIES } from '../types';

export const CATEGORIES_STORAGE_KEY = 'wanna_eat_custom_categories_v1';

/**
 * 載入自訂排序與自訂命名的分類清單
 * 若無自訂紀錄，則預設回傳系統的 8 大預設分類（以「全部」為首）
 */
export function loadCategories(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) return [...PRESET_CATEGORIES];

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // 確保開頭永遠有「全部」項目
      const hasAll = parsed.find(c => c.id === 'all');
      const filtered = parsed.filter(c => c.id !== 'all' && c.name?.trim());
      
      const allItem: CategoryItem = hasAll || { id: 'all', name: '全部', icon: '🍽️' };
      return [allItem, ...filtered];
    }
  } catch (err) {
    console.warn('載入自訂分類失敗，恢復為預設分類:', err);
  }
  return [...PRESET_CATEGORIES];
}

/**
 * 儲存自訂排序與內容的分類清單
 */
export function saveCategories(categories: CategoryItem[]): void {
  try {
    // 確保開頭有「全部」
    const hasAll = categories.find(c => c.id === 'all');
    const filtered = categories.filter(c => c.id !== 'all' && c.name?.trim());
    const allItem: CategoryItem = hasAll || { id: 'all', name: '全部', icon: '🍽️' };
    const toSave = [allItem, ...filtered];

    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('儲存自訂分類失敗:', err);
  }
}

/**
 * 恢復為原廠出廠預設分類清單
 */
export function resetCategoriesToDefault(): CategoryItem[] {
  try {
    localStorage.removeItem(CATEGORIES_STORAGE_KEY);
  } catch (err) {
    console.warn('清除分類快取失敗:', err);
  }
  return [...PRESET_CATEGORIES];
}
