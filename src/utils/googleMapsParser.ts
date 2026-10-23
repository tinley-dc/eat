export interface ParsedRestaurantInfo {
  name?: string;
  address?: string;
  phone?: string;
  googleMapsUrl?: string;
  bookingUrl?: string;
  websiteUrl?: string;
  businessHours?: string;
}

/**
 * 智慧解析使用者貼上的文字或連結（包含 Google Maps 分享文字、網址、電話、inline 訂位等）
 */
export function parseRestaurantShareText(text: string): ParsedRestaurantInfo {
  if (!text || !text.trim()) return {};

  const cleanText = text.trim();
  const result: ParsedRestaurantInfo = {};

  // 1. 擷取所有 URL
  const urlRegex = /(https?:\/\/[^\s+]+)/gi;
  const matches = cleanText.match(urlRegex) || [];
  const urls: string[] = matches.map(u => u.trim());

  urls.forEach(url => {
    // 判斷是否為線上訂位網址
    if (
      /inline\.app|opentable|eztable|tablecheck|oddle|hungryfork|funnow|reserve|booking/i.test(url)
    ) {
      if (!result.bookingUrl) result.bookingUrl = url;
    } 
    // 判斷是否為 Google Maps 或 Google 搜尋相關網址
    else if (
      /maps\.app\.goo\.gl|goo\.gl\/maps|google\.[a-z.]+\/(maps|search)|share\.google/i.test(url)
    ) {
      if (!result.googleMapsUrl) {
        result.googleMapsUrl = url;

        // 若是完整 place URL，嘗試從路徑還原店名
        const placeMatch = url.match(/\/maps\/place\/([^/@?]+)/);
        if (placeMatch && placeMatch[1]) {
          try {
            const decoded = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
            if (decoded && !result.name) {
              result.name = decoded;
            }
          } catch {
            // ignore URI decode error
          }
        }

        // 若是 URL 帶有 q=店名 或 query=店名
        try {
          const parsedUrl = new URL(url);
          const q = parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query');
          if (q && !result.name) {
            const decodedQ = decodeURIComponent(q.replace(/\+/g, ' ')).trim();
            // 排除純經緯度
            if (!/^[-+]?\d+(\.\d+)?\s*,\s*[-+]?\d+(\.\d+)?$/.test(decodedQ)) {
              result.name = decodedQ;
            }
          }
        } catch {
          // ignore URL parsing error
        }
      }
    } 
    // 判斷是否為店家官網、FB 或 IG 粉專
    else if (!result.websiteUrl) {
      result.websiteUrl = url;
    }
  });

  // 2. 擷取電話號碼
  // 支援格式：02-1234-5678, 02 1234 5678, (02)12345678, 0912-345-678, +886 2 1234 5678 等
  const explicitPhoneMatch = cleanText.match(/(?:電話|TEL|Tel|tel|phone|Phone)[:：\s]*([+0-9\s-()]{7,20})/);
  if (explicitPhoneMatch && explicitPhoneMatch[1]) {
    result.phone = explicitPhoneMatch[1].trim();
  } else {
    // 台灣市話或手機
    const generalPhoneMatch = cleanText.match(/(?:(?:\+?886[-\s]?|0)[2-8][-\s]?\d{3,4}[-\s]?\d{4})|(?:\(?0\d\)?[-.\s]?\d{3,4}[-.\s]?\d{4})|(?:(?:\+?886[-\s]?|0)9\d{2}[-\s]?\d{3}[-\s]?\d{3})/);
    if (generalPhoneMatch) {
      result.phone = generalPhoneMatch[0].trim();
    }
  }

  // 3. 擷取地址
  const explicitAddressMatch = cleanText.match(/(?:地址|位置|Address)[:：\s]*([^\n]+)/i);
  if (explicitAddressMatch && explicitAddressMatch[1]) {
    result.address = explicitAddressMatch[1].trim();
  } else {
    // 台灣常見縣市行政區格式
    const twAddressMatch = cleanText.match(/(?:\d{3,5}\s*)?(?:[台臺]北市|[台臺]中市|[基新]北市|桃園市|新竹[縣市]|苗栗縣|彰化縣|南投縣|雲林縣|嘉義[縣市]|[台臺]南市|高雄市|屏東縣|宜蘭縣|花蓮縣|[台臺]東縣|澎湖縣|金門縣|連江縣)[^\s\n,，]{3,40}(?:路|街|巷|弄|號|樓)/);
    if (twAddressMatch) {
      result.address = twAddressMatch[0].trim();
    }
  }

  // 3.5 擷取營業時間 / 幾點開始營業
  const explicitHoursMatch = cleanText.match(/(?:營業時間|開店時間|營業|開店)[:：\s]*([^\n]+)/i);
  if (explicitHoursMatch && explicitHoursMatch[1]) {
    result.businessHours = explicitHoursMatch[1].trim();
  } else {
    const generalHoursMatch = cleanText.match(/(?:\d{1,2}:\d{2}\s*(?:~|–|-|至)\s*\d{1,2}:\d{2}(?:\s*,\s*\d{1,2}:\d{2}\s*(?:~|–|-|至)\s*\d{1,2}:\d{2})?)|(?:\d{1,2}:\d{2}\s*(?:開始營業|開始|營業|開店))/);
    if (generalHoursMatch) {
      result.businessHours = generalHoursMatch[0].trim();
    }
  }

  // 4. 擷取店名
  const explicitNameMatch = cleanText.match(/(?:店名|餐廳|店家)[:：\s]*([^\n]+)/);
  if (explicitNameMatch && explicitNameMatch[1]) {
    result.name = explicitNameMatch[1].trim();
  } else if (!result.name) {
    // 若沒有顯式店名標籤，從各行過濾挑選第一行有效文字
    const lines = cleanText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    for (const line of lines) {
      // 排除網址
      if (/^https?:\/\//i.test(line)) continue;
      // 排除純電話
      if (result.phone && line.includes(result.phone) && line.length < result.phone.length + 5) continue;
      // 排除已找到的地址行
      if (result.address && line.includes(result.address)) continue;
      // 排除常見關鍵字開頭的說明行
      if (/^(電話|TEL|地址|營業時間|公休|評分|星等|價位|https?)/i.test(line)) continue;
      // 排除過長的段落（通常為評價或說明）
      if (line.length > 40) continue;

      // 清理常見的後綴，如 " - Google 地圖" 或 " - Google Maps"
      const cleanedLine = line
        .replace(/\s*[-–—|]\s*Google\s*(?:地圖|Maps).*/i, '')
        .trim();

      if (cleanedLine) {
        result.name = cleanedLine;
        break;
      }
    }
  }

  return result;
}

/**
 * 針對 Google 地圖短網址（如 share.google 或 maps.app.goo.gl），非同步嘗試透過後端中繼還原真實店名、電話、地址與原始網址
 */
export async function unshortenAndEnrich(info: ParsedRestaurantInfo): Promise<ParsedRestaurantInfo> {
  if (!info.googleMapsUrl) return info;

  const url = info.googleMapsUrl;
  if (/share\.google|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url)) {
    try {
      const res = await fetch(`/api/unshorten?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.name && !info.name) {
          info.name = data.name;
        }
        if (data.phone && !info.phone) {
          info.phone = data.phone;
        }
        if (data.address && !info.address) {
          info.address = data.address;
        }
        if (data.businessHours && !info.businessHours) {
          info.businessHours = data.businessHours;
        }
        if (data.finalUrl) {
          info.googleMapsUrl = data.finalUrl;
        }
      }
    } catch {
      // ignore network errors
    }
  }
  return info;
}

/**
 * 格式化營業時間顯示：
 * - 若僅填寫單一時間（如 "11:30" 或 "11:00"），自動友善標記為 "11:30 開始營業"
 * - 若已包含「營業」或「開店」或「開始」，維持原樣
 * - 若為時段（如 "11:30 - 21:00"），補上 "營業時間：11:30 - 21:00"
 */
export function formatBusinessHours(hours?: string): string {
  if (!hours) return '';
  const trimmed = hours.trim();
  if (!trimmed) return '';

  // 若為純時間（例如 11:30 或 11:00）
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    return `${trimmed} 開始營業`;
  }
  if (trimmed.includes('營業') || trimmed.includes('開店') || trimmed.includes('開始')) {
    return trimmed;
  }
  return `營業時間：${trimmed}`;
}
