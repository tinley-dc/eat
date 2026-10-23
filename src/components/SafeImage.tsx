import React, { useState, useEffect } from 'react';
import { DEFAULT_RESTAURANT_IMAGE } from '../types';

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
}

/**
 * 安全圖片元件：
 * 1. 自動辨識 Google Drive 圖片連結，並優先採用穩定之高解析縮圖 CDN（drive.google.com/thumbnail?id=...&sz=w1200）
 * 2. 自動帶入 referrerpolicy="no-referrer"，避免瀏覽器發送跨域 Referer 導致 Google 判定為盜連而回傳 403 Forbidden
 * 3. 具備多重備援自動降級機制（Thumbnail CDN -> Direct CDN -> Export URL -> 預設手繪圖），絕不變死白
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackSrc = DEFAULT_RESTAURANT_IMAGE,
  className,
  ...props
}) => {
  const getGoogleDriveId = (url?: string | null): string | null => {
    if (!url || typeof url !== 'string') return null;
    const match = url.match(
      /(?:lh3\.googleusercontent\.com\/d\/|drive\.google\.com\/(?:uc\?.*id=|thumbnail\?.*id=|file\/d\/))([a-zA-Z0-9_-]+)/
    );
    return match ? match[1] : null;
  };

  const fileId = getGoogleDriveId(src);

  // 建立備援候選清單
  const candidates: string[] = [];
  if (fileId) {
    // 優先 1：Google Drive 官方快取縮圖 API（帶 sz=w1200 高清），最穩定且不易被 403 阻擋
    candidates.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`);
    // 備援 2：Google 使用者內容 CDN
    candidates.push(`https://lh3.googleusercontent.com/d/${fileId}`);
    // 備援 3：Google 匯出檢視端點
    candidates.push(`https://drive.google.com/uc?export=view&id=${fileId}`);
  } else if (src && typeof src === 'string' && src.trim()) {
    candidates.push(src);
  }
  candidates.push(fallbackSrc);

  const [candidateIdx, setCandidateIdx] = useState(0);

  // 當傳入的 src 變更時重設候選索引
  useEffect(() => {
    setCandidateIdx(0);
  }, [src]);

  const currentSrc = candidates[candidateIdx] || fallbackSrc;

  const handleError = () => {
    // 若當前候選網址載入失敗（如遇到 403 / 網路逾時），自動切換至下一個備援網址
    if (candidateIdx + 1 < candidates.length) {
      setCandidateIdx((prev) => prev + 1);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
      {...props}
    />
  );
};
