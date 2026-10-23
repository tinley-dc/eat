/**
 * 在前端將使用者上傳的大尺寸照片自動壓縮並轉為優化的 Base64 字串
 * 適合手機相簿上傳，防止照片太大造成儲存空間爆滿或上傳緩慢
 */
export async function compressImage(file: File, maxWidth: number = 1000, quality: number = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // 等比例縮小
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // 若原圖為透明格式（PNG / WebP），嘗試使用 webp 壓縮以保留透明通道
        const isPngOrWebp = file.type === 'image/png' || file.type === 'image/webp' || /\.(png|webp)$/i.test(file.name);
        if (isPngOrWebp) {
          ctx.drawImage(img, 0, 0, width, height);
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        }

        // 若轉為 JPEG，預先鋪上純白底色，徹底避免透明底色被瀏覽器補成黑色！
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * 檢查並將 Base64 圖片壓縮至適當大小（預設最大長寬 1200px、JPEG 品質 0.80）
 * 確保上傳至 Google Drive 的照片既清晰高畫質，又不會過度佔用雲端空間（約 80KB ~ 150KB）
 */
export async function compressBase64(
  base64Str: string, 
  maxWidth: number = 1200, 
  quality: number = 0.80
): Promise<string> {
  if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image')) {
    return base64Str;
  }

  // 若資料量已經小於 120KB，直接回傳免重複壓縮
  if (base64Str.length < 130000) {
    return base64Str;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // 若長寬都在限制內且檔案不大，直接回傳
      if (width <= maxWidth && height <= maxWidth && base64Str.length < 250000) {
        resolve(base64Str);
        return;
      }

      // 等比例縮小至最大邊長 maxWidth
      if (width > maxWidth || height > maxWidth) {
        if (width >= height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 若原圖為透明格式（PNG / WebP），嘗試使用 webp 壓縮以保留透明通道
      const isPngOrWebp = base64Str.startsWith('data:image/png') || base64Str.startsWith('data:image/webp');
      if (isPngOrWebp) {
        ctx.drawImage(img, 0, 0, width, height);
        const webpData = canvas.toDataURL('image/webp', quality);
        if (webpData.startsWith('data:image/webp')) {
          resolve(webpData);
          return;
        }
      }

      // 若轉為 JPEG，預先鋪上純白底色，徹底避免透明底色被瀏覽器補成黑色！
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}

