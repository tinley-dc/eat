import { Restaurant, CloudConfig } from '../types';
import { compressBase64 } from '../utils/imageCompressor';
import { loadCategories, saveCategories } from '../utils/categoryStorage';
import { getSecurityConfig, saveSecurityConfig } from '../utils/securityStorage';
import { getKnownRestaurantMeta } from '../data/knownRestaurantsMeta';

const CONFIG_KEY = 'wanna_eat_cloud_config';

// 預設 Google Apps Script 網址（任何裝置開啟網頁都會自動連線至該試算表，無需手動設定）
export const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzFSgXbkuKwo4NHSm-CZBJ8LhePs4fleRCzirKnoyWVejgvPGwPkFXqe0OdXsFnw4XV/exec';

export function getCloudConfig(): CloudConfig {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        scriptUrl: parsed.scriptUrl || DEFAULT_SCRIPT_URL,
        autoSync: parsed.autoSync !== undefined ? parsed.autoSync : true,
        lastSyncedAt: parsed.lastSyncedAt
      };
    } catch {
      // ignore
    }
  }
  return {
    scriptUrl: DEFAULT_SCRIPT_URL,
    autoSync: true,
    lastSyncedAt: undefined
  };
}

export function saveCloudConfig(config: CloudConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

// 測試與 Google Apps Script 連線
export async function testConnection(scriptUrl: string): Promise<{ success: boolean; message: string }> {
  if (!scriptUrl.trim()) {
    return { success: false, message: '請輸入有效的 Google Apps Script 網址' };
  }

  try {
    const url = new URL(scriptUrl);
    url.searchParams.set('action', 'ping');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      return { success: false, message: `伺服器回應錯誤 (${res.status})` };
    }

    const data = await res.json();
    if (data.status === 'success') {
      return { success: true, message: data.message || '連線測試成功！' };
    } else {
      return { success: false, message: data.message || '連線失敗' };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `無法連線至該網址：${errorMsg}。請確認發布設定為「任何人 (Anyone)」可存取。` };
  }
}

// 從 Google 試算表拉取所有店家與餐點
export async function pullFromGoogleSheets(scriptUrl: string): Promise<Restaurant[] | null> {
  if (!scriptUrl.trim()) return null;

  try {
    const url = new URL(scriptUrl);
    url.searchParams.set('action', 'get_all');
    url.searchParams.set('_t', Date.now().toString());

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();

    if (result.status === 'success' && Array.isArray(result.data)) {
      // 提取並儲存雲端同步的自訂分類設定
      const configItem = result.data.find((item: { id?: string; note?: string }) => item.id === '__CONFIG_CATEGORIES__');
      if (configItem && configItem.note) {
        try {
          const parsedCats = JSON.parse(configItem.note);
          if (Array.isArray(parsedCats) && parsedCats.length > 0) {
            saveCategories(parsedCats);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('cloud-categories-updated', { detail: parsedCats }));
            }
          }
        } catch (e) {
          console.warn('解析雲端自訂分類設定失敗:', e);
        }
      }

      // 提取並儲存雲端同步的安全管理密碼設定
      const secItem = result.data.find((item: { id?: string; note?: string }) => item.id === '__CONFIG_SECURITY__');
      if (secItem && secItem.note) {
        try {
          const parsedSec = JSON.parse(secItem.note);
          if (parsedSec && parsedSec.passwordHash) {
            saveSecurityConfig(parsedSec);
          }
        } catch (e) {
          console.warn('解析雲端安全設定失敗:', e);
        }
      }

      // 提取並儲存雲端同步的店家中繼資料 (營業時間、電話、官網、訂位、地圖、待踩點)
      const metaItem = result.data.find((item: { id?: string; note?: string }) => item.id === '__CONFIG_RESTAURANTS_META__');
      let metaMap: Record<string, {
        businessHours?: string;
        phone?: string;
        websiteUrl?: string;
        bookingUrl?: string;
        googleMapsUrl?: string;
        isWishlist?: boolean;
      }> = {};
      if (metaItem && metaItem.note) {
        try {
          metaMap = JSON.parse(metaItem.note) || {};
        } catch (e) {
          console.warn('解析雲端店家中繼資料失敗:', e);
        }
      }

      // 回傳時排除系統設定紀錄，並完整復原營業時間、電話、官網等中繼資料
      return result.data
        .filter((item: { id?: string }) => !item.id?.startsWith('__CONFIG_'))
        .map((r: Restaurant) => {
          const meta = metaMap[r.id] || {};
          let note = r.note || '';

          // 若 note 內含有備用的 [META:{...}] 標籤，解析並過濾乾淨
          let embeddedMeta: any = {};
          const metaMatch = note.match(/\[META:(\{.*?\})\]/);
          if (metaMatch && metaMatch[1]) {
            try {
              embeddedMeta = JSON.parse(metaMatch[1]);
              note = note.replace(/\s*\[META:\{.*?\}\]/g, '').trim();
            } catch {}
          }

          const known = getKnownRestaurantMeta(r.id, r.name);
          return {
            ...r,
            isWishlist: typeof r.isWishlist === 'boolean'
              ? r.isWishlist
              : (meta.isWishlist !== undefined ? meta.isWishlist : (embeddedMeta.l === 1 ? true : false)),
            note: note || undefined,
            businessHours: r.businessHours || meta.businessHours || embeddedMeta.b || known?.businessHours,
            phone: r.phone || meta.phone || embeddedMeta.p || known?.phone,
            websiteUrl: r.websiteUrl || meta.websiteUrl || embeddedMeta.w || known?.websiteUrl,
            bookingUrl: r.bookingUrl || meta.bookingUrl || embeddedMeta.k || known?.bookingUrl,
            googleMapsUrl: r.googleMapsUrl || meta.googleMapsUrl || embeddedMeta.g || known?.googleMapsUrl
          };
        }) as Restaurant[];
    }
    return null;
  } catch (err) {
    console.error('從 Google Sheets 拉取失敗:', err);
    throw err;
  }
}

// 上傳單張圖片至 Google Drive
export async function uploadPhotoToDrive(scriptUrl: string, base64Data: string, fileName?: string): Promise<string | null> {
  if (!scriptUrl.trim() || !base64Data) return null;

  const defaultExt = base64Data.startsWith('data:image/webp') ? 'webp' : 'jpg';

  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'upload_image',
        base64: base64Data,
        fileName: fileName || `food_${Date.now()}.${defaultExt}`
      }),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    if (result.status === 'success' && (result.url || result.fileId)) {
      const fileId = result.fileId || (result.url ? result.url.match(/id=([a-zA-Z0-9_-]+)/)?.[1] : null);
      if (fileId) {
        // 使用 Google Drive thumbnail CDN 端點（帶 sz=w1200 高清），比 lh3 穩定且不易被 403 阻擋
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
      }
      return result.url;
    }
    return null;
  } catch (err) {
    console.error('上傳圖片至 Google Drive 失敗:', err);
    return null;
  }
}

/**
 * 檢查所有店家與餐點，若含有尚未上傳至雲端的本機 Base64 照片：
 * 1. 自動呼叫 compressBase64 將照片縮放至適當大小（1200px / 品質 0.80，約 80KB ~ 120KB），防止大圖塞爆雲端
 * 2. 依序上傳至使用者的 Google 雲端硬碟「今天吃什麼_店家相片」資料夾
 * 3. 取得 Google Drive 專屬公開檢視連結並替換 Base64
 * 4. 回傳已升級為雲端網址的店家資料與是否有異動標記
 */
export async function uploadPendingPhotos(
  scriptUrl: string, 
  restaurants: Restaurant[]
): Promise<{ updatedRestaurants: Restaurant[]; hasChanges: boolean }> {
  if (!scriptUrl.trim() || !restaurants || restaurants.length === 0) {
    return { updatedRestaurants: restaurants, hasChanges: false };
  }

  let hasChanges = false;
  const updatedRestaurants: Restaurant[] = [];

  for (const r of restaurants) {
    let restaurantChanged = false;
    let newImages = [...(r.images || [])];

    // 處理店家主要相片
    for (let i = 0; i < newImages.length; i++) {
      const img = newImages[i];
      if (typeof img === 'string' && img.startsWith('data:image')) {
        try {
          // 壓縮至適當大小（1200px，品質 0.80），確保檔案不會過大
          const compressed = await compressBase64(img, 1200, 0.80);
          const ext = compressed.startsWith('data:image/webp') ? 'webp' : (compressed.startsWith('data:image/png') ? 'png' : 'jpg');
          const safeName = `${(r.name || 'restaurant').replace(/[/\\?%*:|"<>]/g, '_')}_${i + 1}_${Date.now()}.${ext}`;
          const driveUrl = await uploadPhotoToDrive(scriptUrl, compressed, safeName);
          if (driveUrl) {
            newImages[i] = driveUrl;
            restaurantChanged = true;
            hasChanges = true;
          }
        } catch (e) {
          console.warn(`上傳店家 [${r.name}] 第 ${i + 1} 張照片至雲端硬碟失敗:`, e);
        }
      }
    }

    // 處理餐點相片
    let newDishes = [...(r.dishes || [])];
    for (let dIdx = 0; dIdx < newDishes.length; dIdx++) {
      const dish = newDishes[dIdx];
      let dishChanged = false;
      let newPhotos = [...(dish.photos || [])];

      for (let pIdx = 0; pIdx < newPhotos.length; pIdx++) {
        const p = newPhotos[pIdx];
        if (typeof p === 'string' && p.startsWith('data:image')) {
          try {
            const compressed = await compressBase64(p, 1200, 0.80);
            const ext = compressed.startsWith('data:image/webp') ? 'webp' : (compressed.startsWith('data:image/png') ? 'png' : 'jpg');
            const safeName = `${(dish.name || 'dish').replace(/[/\\?%*:|"<>]/g, '_')}_${pIdx + 1}_${Date.now()}.${ext}`;
            const driveUrl = await uploadPhotoToDrive(scriptUrl, compressed, safeName);
            if (driveUrl) {
              newPhotos[pIdx] = driveUrl;
              dishChanged = true;
              restaurantChanged = true;
              hasChanges = true;
            }
          } catch (e) {
            console.warn(`上傳餐點 [${dish.name}] 照片至雲端硬碟失敗:`, e);
          }
        }
      }

      if (dishChanged) {
        newDishes[dIdx] = { ...dish, photos: newPhotos };
      }
    }

    if (restaurantChanged) {
      updatedRestaurants.push({
        ...r,
        images: newImages,
        dishes: newDishes,
        updatedAt: Date.now()
      });
    } else {
      updatedRestaurants.push(r);
    }
  }

  return { updatedRestaurants, hasChanges };
}

// 將所有店家批次同步推送到 Google 試算表
export async function pushToGoogleSheets(scriptUrl: string, restaurants: Restaurant[]): Promise<boolean> {
  if (!scriptUrl.trim()) return false;

  // 收集所有店家的完整中繼擴充資料 (營業時間、電話、官網、訂位、地圖、待踩點)
  const metaMap: Record<string, {
    businessHours?: string;
    phone?: string;
    websiteUrl?: string;
    bookingUrl?: string;
    googleMapsUrl?: string;
    isWishlist?: boolean;
  }> = {};

  const sanitizedRestaurants = restaurants.map(r => {
    const known = getKnownRestaurantMeta(r.id, r.name);
    const resolvedHours = r.businessHours || known?.businessHours;
    const resolvedPhone = r.phone || known?.phone;
    const resolvedWeb = r.websiteUrl || known?.websiteUrl;
    const resolvedBooking = r.bookingUrl || known?.bookingUrl;
    const resolvedMaps = r.googleMapsUrl || known?.googleMapsUrl;
    const isWishlist = Boolean(r.isWishlist);

    if (!r.id.startsWith('__CONFIG_')) {
      if (resolvedHours || resolvedPhone || resolvedWeb || resolvedBooking || resolvedMaps || isWishlist) {
        metaMap[r.id] = {
          businessHours: resolvedHours,
          phone: resolvedPhone,
          websiteUrl: resolvedWeb,
          bookingUrl: resolvedBooking,
          googleMapsUrl: resolvedMaps,
          isWishlist: isWishlist ? true : undefined
        };
      }
    }

    // 雙重備份：在每個店家的 note 結尾附加 [META:{...}]，即使系統設定遺失也能保證該店家資料完整復原
    let combinedNote = (r.note || '').replace(/\s*\[META:\{.*?\}\]/g, '').trim();
    if (!r.id.startsWith('__CONFIG_') && (resolvedHours || resolvedPhone || resolvedWeb || resolvedBooking || resolvedMaps || isWishlist)) {
      const singleMeta = {
        b: resolvedHours,
        p: resolvedPhone,
        w: resolvedWeb,
        k: resolvedBooking,
        g: resolvedMaps,
        l: isWishlist ? 1 : undefined
      };
      combinedNote = combinedNote ? `${combinedNote}\n[META:${JSON.stringify(singleMeta)}]` : `[META:${JSON.stringify(singleMeta)}]`;
    }

    return {
      ...r,
      isWishlist,
      businessHours: resolvedHours,
      phone: resolvedPhone,
      websiteUrl: resolvedWeb,
      bookingUrl: resolvedBooking,
      googleMapsUrl: resolvedMaps,
      note: combinedNote || undefined,
      images: (r.images || []).filter(img => typeof img === 'string' && !img.startsWith('data:')),
      dishes: (r.dishes || []).map(d => ({
        ...d,
        photos: (d.photos || []).filter(p => typeof p === 'string' && !p.startsWith('data:'))
      }))
    };
  });

  // 同步附加自訂分類設定至試算表，確保所有裝置與 GitHub Pages 分類順序皆能即時同步
  const currentCats = loadCategories();
  const configRecord: Restaurant = {
    id: '__CONFIG_CATEGORIES__',
    name: '__CONFIG_CATEGORIES__',
    categories: [],
    images: [],
    coverIndex: 0,
    dishes: [],
    note: JSON.stringify(currentCats),
    updatedAt: Date.now()
  };

  // 同步附加安全管理密碼設定至試算表（不可逆雜湊，保護管理模式）
  const secConfig = getSecurityConfig();
  const secRecord: Restaurant | null = secConfig && secConfig.passwordHash ? {
    id: '__CONFIG_SECURITY__',
    name: '__CONFIG_SECURITY__',
    categories: [],
    images: [],
    coverIndex: 0,
    dishes: [],
    note: JSON.stringify(secConfig),
    updatedAt: Date.now()
  } : null;

  // 同步附加所有店家營業時間與中繼資料對照表（確保免更新 Apps Script 也能跨裝置完整同步）
  const metaRecord: Restaurant = {
    id: '__CONFIG_RESTAURANTS_META__',
    name: '__CONFIG_RESTAURANTS_META__',
    categories: [],
    images: [],
    coverIndex: 0,
    dishes: [],
    note: JSON.stringify(metaMap),
    updatedAt: Date.now()
  };

  const finalRestaurantsToSave = [
    ...sanitizedRestaurants.filter(r => !r.id.startsWith('__CONFIG_')),
    configRecord,
    metaRecord,
    ...(secRecord ? [secRecord] : [])
  ];

  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'save_all',
        restaurants: finalRestaurantsToSave
      }),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // GAS 跨域 POST 避免觸發 OPTIONS preflight 阻擋
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    return result.status === 'success';
  } catch (err) {
    console.error('推送至 Google Sheets 失敗:', err);
    throw err;
  }
}
