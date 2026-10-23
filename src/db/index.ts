import Dexie, { type Table } from 'dexie';
import { Restaurant } from '../types';
import { SEED_RESTAURANTS } from '../data/seedData';
import { RECOVERED_IMAGES } from '../data/recoveredImages';
import {
  getCloudConfig,
  saveCloudConfig,
  pullFromGoogleSheets,
  pushToGoogleSheets,
  uploadPendingPhotos
} from '../services/cloudSync';

class WannaEatDatabase extends Dexie {
  restaurants!: Table<Restaurant, string>;

  constructor() {
    super('WannaEatDB');
    this.version(1).stores({
      restaurants: 'id, name, updatedAt, *categories'
    });
  }
}

export const db = new WannaEatDatabase();

// 初始化資料庫（若空則寫入種子資料，並自動升級舊有的暗色照片）
export async function initializeDatabase(): Promise<Restaurant[]> {
  const count = await db.restaurants.count();
  if (count === 0) {
    const config = getCloudConfig();
    // 若已設定 Google 試算表，新裝置初次開啟直接從雲端下載使用者資料
    if (config.scriptUrl && config.scriptUrl.trim()) {
      try {
        const remote = await pullFromGoogleSheets(config.scriptUrl.trim());
        if (remote && remote.length > 0) {
          await db.restaurants.bulkAdd(remote);
          return remote;
        }
      } catch (e) {
        console.warn('新裝置初次開啟從雲端拉取失敗，降級為示範資料:', e);
      }
    }
    await db.restaurants.bulkAdd(SEED_RESTAURANTS);
    return SEED_RESTAURANTS;
  }
  // 自動將舊照片與範例餐點更新為具備餐點照片的最新示範資料
  const rawList = await db.restaurants.toArray();
  const list = rawList.filter(r => !r.id.startsWith('__CONFIG_'));

  // 若本地只殘留當初系統預設的示範假店家，立即從雲端抓取真實名單完全替換
  const isOnlySeedData = list.length > 0 && list.every(local => 
    SEED_RESTAURANTS.some(seed => seed.id === local.id)
  );
  if (isOnlySeedData) {
    const config = getCloudConfig();
    if (config.scriptUrl && config.scriptUrl.trim()) {
      try {
        const remote = await pullFromGoogleSheets(config.scriptUrl.trim());
        if (remote && remote.length > 0) {
          await db.restaurants.clear();
          await db.restaurants.bulkAdd(remote);
          return remote;
        }
      } catch (e) {
        console.warn('替換殘留示範店家失敗:', e);
      }
    }
  }
  for (const r of list) {
    let modified = false;
    if (r.id === 'rest-1' && r.images[0]?.includes('1582878826629')) {
      r.images[0] = 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80';
      modified = true;
    }
    if (r.id === 'rest-1') {
      const d = r.dishes.find(item => item.id === 'dish-1-1');
      if (d && (!d.photos || d.photos.length === 0)) {
        d.photos = ['https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80'];
        modified = true;
      }
    }
    if (r.id === 'rest-2' && (r.images[0]?.includes('1603894584373') || r.images[0]?.includes('1546069901'))) {
      r.images[0] = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
      modified = true;
    }
    if (r.id === 'rest-2') {
      const d = r.dishes.find(item => item.id === 'dish-2-1');
      if (d && (!d.photos || d.photos.length === 0)) {
        d.photos = ['https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80'];
        modified = true;
      }
    }
    // 示範店家自動補上官網、訂位與地圖
    if (r.id === 'rest-1' && !r.websiteUrl) {
      r.websiteUrl = 'https://www.facebook.com';
      r.googleMapsUrl = 'https://maps.app.goo.gl/JnftyPbAb1LjgAZqH';
      r.address = '台北市大安區新生南路二段2號（學校側門轉角）';
      if (!r.note?.includes('02-2398-8888')) {
        r.note = '週二公休，電話：02-2398-8888，用餐時間人很多建議提早 10 分鐘去';
      }
      modified = true;
    }
    if (r.id === 'rest-2' && !r.websiteUrl) {
      r.websiteUrl = 'https://www.instagram.com';
      r.bookingUrl = 'https://inline.app/booking/-katsukatsu/reserve';
      r.googleMapsUrl = 'https://maps.app.goo.gl/JnftyPbAb1LjgAZqH';
      r.address = '台北市松山區民生東路三段120號2樓（有兒童餐椅）';
      if (!r.note?.includes('02-2712-3456')) {
        r.note = '白飯和味噌湯可以免費續加一次！電話：02-2712-3456';
      }
      modified = true;
    }
    if (r.id === 'rest-5' && !r.websiteUrl) {
      r.websiteUrl = 'https://www.facebook.com';
      r.bookingUrl = 'https://inline.app/booking/-sunshinepizza/tables';
      r.googleMapsUrl = 'https://maps.app.goo.gl/JnftyPbAb1LjgAZqH';
      r.address = '台北市中正區公園路52號（二二八公園正對面）';
      if (!r.note?.includes('02-2388-9900')) {
        r.note = '吃完可以去對面公園溜滑梯！電話：02-2388-9900';
      }
      modified = true;
    }
    // 示範店家自動補上營業時間
    if (r.id === 'rest-1' && !r.businessHours) {
      r.businessHours = '11:00 開始營業';
      modified = true;
    }
    if (r.id === 'rest-2' && !r.businessHours) {
      r.businessHours = '11:30 - 21:00';
      modified = true;
    }
    if (r.id === 'rest-3' && !r.businessHours) {
      r.businessHours = '06:00 - 24:00';
      modified = true;
    }
    if (r.id === 'rest-4' && !r.businessHours) {
      r.businessHours = '11:00 - 20:00';
      modified = true;
    }
    if (r.id === 'rest-5' && !r.businessHours) {
      r.businessHours = '11:30 - 21:30';
      modified = true;
    }
    // 自動還原使用者先前上傳遭雲端同步衝掉的照片
    const nameMap: Record<string, string> = {
      '麥當勞': 'rest-1792643196497',
      '肯德基': 'rest-1792643230430',
      '必勝客': 'rest-1792643399573',
      '摩斯漢堡': 'rest-1792643992186'
    };
    const recoveredKey = RECOVERED_IMAGES[r.id] ? r.id : nameMap[r.name.trim()];
    const recoveredImg = recoveredKey ? RECOVERED_IMAGES[recoveredKey] : undefined;
    if (recoveredImg && (!r.images || r.images.length === 0)) {
      r.images = [recoveredImg];
      modified = true;
    }
    // 自動補齊 featuredDishId（示範店預設或既有餐點的首項）
    if (!r.featuredDishId && r.dishes && r.dishes.length > 0) {
      const seed = SEED_RESTAURANTS.find(s => s.id === r.id);
      r.featuredDishId = seed?.featuredDishId || r.dishes[0].id;
      modified = true;
    }
    if (modified) {
      await db.restaurants.put(r);
    }
  }
  return await getAllRestaurants();
}

// 快速更新店家的 Menu 代表餐點
export async function updateFeaturedDish(restaurantId: string, dishId: string): Promise<Restaurant | undefined> {
  const r = await db.restaurants.get(restaurantId);
  if (!r) return undefined;
  r.featuredDishId = dishId;
  r.updatedAt = Date.now();
  await db.restaurants.put(r);
  return r;
}

// 取得所有店家（依最近更新時間降冪排序，確保編輯後穩定置頂且絕不遺漏任何店家）
export async function getAllRestaurants(): Promise<Restaurant[]> {
  const rawList = await db.restaurants.toArray();
  const list = rawList.filter(r => !r.id.startsWith('__CONFIG_'));
  list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const nameMap: Record<string, string> = {
    '麥當勞': 'rest-1792643196497',
    '肯德基': 'rest-1792643230430',
    '必勝客': 'rest-1792643399573',
    '摩斯漢堡': 'rest-1792643992186'
  };
  for (const r of list) {
    const recoveredKey = RECOVERED_IMAGES[r.id] ? r.id : nameMap[r.name.trim()];
    const recoveredImg = recoveredKey ? RECOVERED_IMAGES[recoveredKey] : undefined;
    if (recoveredImg && (!r.images || r.images.length === 0)) {
      r.images = [recoveredImg];
      await db.restaurants.put(r);
    }
  }
  return list;
}

// 新增店家
export async function addRestaurant(restaurant: Restaurant): Promise<void> {
  await db.restaurants.add(restaurant);

  // 若啟動自動同步，觸發非同步推送
  triggerAutoSync();
}

// 更新店家
export async function updateRestaurant(restaurant: Restaurant): Promise<void> {
  restaurant.updatedAt = Date.now();
  await db.restaurants.put(restaurant);

  triggerAutoSync();
}

// 刪除店家
export async function deleteRestaurant(id: string): Promise<void> {
  await db.restaurants.delete(id);

  triggerAutoSync();
}

// 重設回示範資料
export async function resetToDefaultData(): Promise<Restaurant[]> {
  await db.restaurants.clear();
  await db.restaurants.bulkAdd(SEED_RESTAURANTS);
  triggerAutoSync();
  return SEED_RESTAURANTS;
}

// 自動同步排程 (debounce)
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
export function triggerAutoSync() {
  const config = getCloudConfig();
  if (!config.autoSync || !config.scriptUrl) return;

  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cloud-sync-status', { detail: { status: 'syncing' } }));
      }
      const all = await db.restaurants.toArray();
      // 先將尚未上傳的 Base64 照片壓縮（1200px / 0.80）並上傳至 Google Drive
      const { updatedRestaurants, hasChanges } = await uploadPendingPhotos(config.scriptUrl, all);
      if (hasChanges) {
        await db.restaurants.bulkPut(updatedRestaurants);
      }
      await pushToGoogleSheets(config.scriptUrl, updatedRestaurants);
      config.lastSyncedAt = Date.now();
      saveCloudConfig(config);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cloud-sync-status', { 
          detail: { status: 'success', time: config.lastSyncedAt, count: updatedRestaurants.length } 
        }));
      }
    } catch (e) {
      console.warn('背景自動同步 Google Sheets 暫時失敗:', e);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cloud-sync-status', { detail: { status: 'error', error: e } }));
      }
    }
  }, 2000);
}

// 執行與雲端雙向同步 (手動點擊同步時)
export async function syncWithCloud(): Promise<{ count: number; message: string }> {
  const config = getCloudConfig();
  if (!config.scriptUrl) {
    throw new Error('尚未設定 Google 試算表網址');
  }

  // 1. 從 Google Sheets 拉取遠端店家
  let remoteRestaurants: Restaurant[] | null = null;
  try {
    remoteRestaurants = await pullFromGoogleSheets(config.scriptUrl);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`讀取 Google 試算表失敗 (${msg})。請確認 Apps Script 已授權存取試算表，且部署時「執行身分」為「我 (Me)」，「誰可以存取」為「任何人 (Anyone)」。`);
  }

  const localRestaurants = await db.restaurants.toArray();

  if (remoteRestaurants && remoteRestaurants.length > 0) {
    // 檢查本地是否僅為初始預設示範店家（rest-1 ~ rest-5）
    // 若本地只有示範店家，而雲端已有使用者上傳的資料，直接以雲端為準完全替換，避免示範店家殘留在新裝置
    const isOnlySeedData = localRestaurants.length > 0 && localRestaurants.every(local => 
      SEED_RESTAURANTS.some(seed => seed.id === local.id)
    );

    let merged: Restaurant[];

    if (isOnlySeedData) {
      merged = remoteRestaurants;
      await db.restaurants.clear();
      await db.restaurants.bulkAdd(merged);
    } else {
      // 雲端與本地皆有資料：合併機制 (以更新時間最新的為主)
      const map = new Map<string, Restaurant>();
      for (const r of localRestaurants) {
        map.set(r.id, r);
      }
      for (const r of remoteRestaurants) {
        const local = map.get(r.id);
        if (!local) {
          map.set(r.id, r);
        } else {
          // 保護照片：Google 試算表無法存放超長 Base64，若遠端無照片而本地有，永遠保留本地照片
          const hasLocalImages = local.images && local.images.length > 0;
          const hasRemoteImages = r.images && r.images.length > 0;
          const preservedImages = hasRemoteImages ? r.images : (hasLocalImages ? local.images : []);

        const mergedDishes = (r.dishes || []).map(remoteDish => {
          const localDish = (local.dishes || []).find(ld => ld.id === remoteDish.id);
          return {
            ...remoteDish,
            photos: (remoteDish.photos && remoteDish.photos.length > 0)
              ? remoteDish.photos
              : (localDish?.photos || [])
          };
        });

        if (r.updatedAt && r.updatedAt > (local.updatedAt || 0)) {
          map.set(r.id, {
            ...r,
            images: preservedImages,
            dishes: mergedDishes
          });
        } else {
          map.set(r.id, {
            ...local,
            images: hasLocalImages ? local.images : (hasRemoteImages ? r.images : []),
            dishes: (local.dishes || []).map(localDish => {
              const remoteDish = (r.dishes || []).find(rd => rd.id === localDish.id);
              return {
                ...localDish,
                photos: (localDish.photos && localDish.photos.length > 0)
                  ? localDish.photos
                  : (remoteDish?.photos || [])
              };
            })
          });
        }
      }
    }
    merged = Array.from(map.values());
    await db.restaurants.bulkPut(merged);
  }

    // 回寫最新合併資料到 Google Sheets（先上傳壓縮後的照片至 Google Drive）
    try {
      const { updatedRestaurants, hasChanges } = await uploadPendingPhotos(config.scriptUrl, merged);
      if (hasChanges) {
        await db.restaurants.bulkPut(updatedRestaurants);
      }
      await pushToGoogleSheets(config.scriptUrl, updatedRestaurants);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`寫入 Google 試算表失敗 (${msg})。`);
    }

    config.lastSyncedAt = Date.now();
    saveCloudConfig(config);
    return { count: merged.length, message: `同步成功！目前共有 ${merged.length} 間店家（照片已安全同步至 Google 雲端）` };
  } else {
    // 雲端是空的：把本地資料全部推上去（先上傳壓縮後的照片至 Google Drive）
    if (localRestaurants.length > 0) {
      try {
        const { updatedRestaurants, hasChanges } = await uploadPendingPhotos(config.scriptUrl, localRestaurants);
        if (hasChanges) {
          await db.restaurants.bulkPut(updatedRestaurants);
        }
        await pushToGoogleSheets(config.scriptUrl, updatedRestaurants);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`寫入 Google 試算表失敗 (${msg})。`);
      }
    }
    config.lastSyncedAt = Date.now();
    saveCloudConfig(config);
    return { count: localRestaurants.length, message: `已將本地 ${localRestaurants.length} 間店家與照片安全上傳至 Google 雲端！` };
  }
}

// 匯出 JSON 備份檔
export async function exportBackupJson(): Promise<string> {
  const restaurants = await db.restaurants.toArray();
  const backup = {
    app: 'wanna-eat',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    restaurants
  };
  return JSON.stringify(backup, null, 2);
}

// 匯入 JSON 備份檔
export async function importBackupJson(jsonString: string): Promise<number> {
  const parsed = JSON.parse(jsonString);
  if (!parsed.restaurants || !Array.isArray(parsed.restaurants)) {
    throw new Error('備份檔案格式不正確，找不到店家資料！');
  }

  const list: Restaurant[] = parsed.restaurants;
  await db.restaurants.clear();
  await db.restaurants.bulkAdd(list);
  triggerAutoSync();
  return list.length;
}

// 一鍵修復補回先前同步衝掉之照片
export async function restoreRecoveredPhotos(): Promise<number> {
  const list = await db.restaurants.toArray();
  const nameMap: Record<string, string> = {
    '麥當勞': 'rest-1792643196497',
    '肯德基': 'rest-1792643230430',
    '必勝客': 'rest-1792643399573',
    '摩斯漢堡': 'rest-1792643992186'
  };
  let count = 0;
  for (const r of list) {
    const recoveredKey = RECOVERED_IMAGES[r.id] ? r.id : nameMap[r.name.trim()];
    const recoveredImg = recoveredKey ? RECOVERED_IMAGES[recoveredKey] : undefined;
    if (recoveredImg && (!r.images || r.images.length === 0)) {
      r.images = [recoveredImg];
      await db.restaurants.put(r);
      count++;
    }
  }
  return count;
}
