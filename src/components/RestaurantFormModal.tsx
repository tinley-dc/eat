import React, { useState, useRef, useEffect } from 'react';
import { Restaurant, DishRecord, CategoryItem, PRESET_CATEGORIES, OpinionType } from '../types';
import { 
  X, 
  Upload, 
  Plus, 
  Trash2, 
  Star,
  Check,
  Camera,
  Crop,
  Sparkles,
  Clipboard,
  Calendar,
  Globe,
  ExternalLink,
  Clock,
  MapPin,
  StickyNote
} from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import { soundManager } from '../utils/sound';
import { ImageCropModal } from './ImageCropModal';
import { parseRestaurantShareText, unshortenAndEnrich } from '../utils/googleMapsParser';
import { useTheme } from '../context/ThemeContext';
import { SafeImage } from './SafeImage';

interface CropQueueItem {
  id: string;
  dataUrl: string;
  target: 'restaurant' | { dishId: string };
  originalIdx?: number;
  file?: File;
}

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface RestaurantFormModalProps {
  initialData?: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (restaurant: Restaurant) => Promise<void>;
  availableCategories?: CategoryItem[];
  onOpenManageCategories?: () => void;
}

export const RestaurantFormModal: React.FC<RestaurantFormModalProps> = ({
  initialData,
  isOpen,
  onClose,
  onSave,
  availableCategories,
  onOpenManageCategories,
}) => {
  const { theme } = useTheme();
  const isChef = theme === 'chef_menu';

  const [name, setName] = useState(initialData?.name || '');
  const [categories, setCategories] = useState<string[]>(initialData?.categories || []);
  const [customCategory, setCustomCategory] = useState('');
  const [address, setAddress] = useState(initialData?.address || '');
  const [businessHours, setBusinessHours] = useState(initialData?.businessHours || '');
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.websiteUrl || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [bookingUrl, setBookingUrl] = useState(initialData?.bookingUrl || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialData?.googleMapsUrl || '');
  const [note, setNote] = useState(initialData?.note || '');
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [coverIndex, setCoverIndex] = useState(initialData?.coverIndex || 0);
  const [dishes, setDishes] = useState<DishRecord[]>(initialData?.dishes || []);
  const [featuredDishId, setFeaturedDishId] = useState<string | undefined>(initialData?.featuredDishId);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 智慧貼上狀態
  const [smartPasteText, setSmartPasteText] = useState('');
  const [smartPasteStatus, setSmartPasteStatus] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // 照片裁切佇列與當前裁切索引
  const [cropQueue, setCropQueue] = useState<CropQueueItem[]>([]);
  const [currentCropIndex, setCurrentCropIndex] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // 當開啟視窗或切換編輯對象時，立即將店家資料完整帶入表單狀態
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setCategories(initialData.categories ? [...initialData.categories] : []);
        setAddress(initialData.address || '');
        setBusinessHours(initialData.businessHours || '');
        setWebsiteUrl(initialData.websiteUrl || '');
        setPhone(initialData.phone || '');
        setBookingUrl(initialData.bookingUrl || '');
        setGoogleMapsUrl(initialData.googleMapsUrl || '');
        setNote(initialData.note || '');
        setImages(initialData.images ? [...initialData.images] : []);
        setCoverIndex(initialData.coverIndex || 0);
        setDishes(initialData.dishes ? JSON.parse(JSON.stringify(initialData.dishes)) : []);
        setFeaturedDishId(initialData.featuredDishId);
      } else {
        // 新增模式：重設回空白
        setName('');
        setCategories([]);
        setAddress('');
        setBusinessHours('');
        setWebsiteUrl('');
        setPhone('');
        setBookingUrl('');
        setGoogleMapsUrl('');
        setNote('');
        setImages([]);
        setCoverIndex(0);
        setDishes([]);
        setFeaturedDishId(undefined);
      }
      setCustomCategory('');
      setSmartPasteText('');
      setSmartPasteStatus(null);
    }
  }, [isOpen, initialData]);

  // 智慧解析使用者貼上的文字或 Google Maps 分享網址
  const handleSmartParse = async (textOverride?: string) => {
    const raw = (textOverride !== undefined ? textOverride : smartPasteText).trim();
    if (!raw) return;

    setIsParsing(true);
    setSmartPasteStatus('⏳ 正在解析地圖與文字資訊...');

    try {
      let parsed = parseRestaurantShareText(raw);

      // 若為短網址且尚未完整解析出店名、電話或地址，嘗試進行非同步還原
      if ((!parsed.name || !parsed.phone || !parsed.address) && parsed.googleMapsUrl) {
        parsed = await unshortenAndEnrich(parsed);
      }

      const applied: string[] = [];

      if (parsed.name) {
        setName(parsed.name);
        applied.push(`店名「${parsed.name}」`);
      }
      if (parsed.address) {
        setAddress(parsed.address);
        applied.push('地址');
      }
      if (parsed.businessHours) {
        setBusinessHours(parsed.businessHours);
        applied.push(`營業時間「${parsed.businessHours}」`);
      }
      if (parsed.phone) {
        setPhone(parsed.phone);
        setNote(prev => {
          if (prev.includes(parsed.phone!)) return prev;
          return prev ? `${prev}，電話：${parsed.phone}` : `電話：${parsed.phone}`;
        });
        applied.push('電話（已記於備忘）');
      }
      if (parsed.websiteUrl) {
        setWebsiteUrl(parsed.websiteUrl);
        applied.push('店家官網');
      }
      if (parsed.googleMapsUrl) {
        setGoogleMapsUrl(parsed.googleMapsUrl);
        applied.push('Google 地圖');
      }
      if (parsed.bookingUrl) {
        setBookingUrl(parsed.bookingUrl);
        applied.push('訂位網址');
      }

      soundManager.playPop();

      if (applied.length > 0) {
        if (!parsed.name && parsed.googleMapsUrl) {
          setSmartPasteStatus('📍 已成功帶入 Google 地圖網址！因該短網址未直接包含店名文字，請在下方「店家名稱」填寫店名喔。');
          setTimeout(() => nameInputRef.current?.focus(), 150);
        } else {
          setSmartPasteStatus(`✨ 成功帶入：${applied.join('、')}`);
        }
        setSmartPasteText('');
        setTimeout(() => setSmartPasteStatus(null), 6000);
      } else {
        setSmartPasteStatus('⚠️ 未偵測到相符的店名、電話或網址，請手動填寫');
        setTimeout(() => setSmartPasteStatus(null), 4000);
      }
    } catch (err) {
      console.warn('解析失敗:', err);
      setSmartPasteStatus('⚠️ 解析過程發生問題，請手動填寫');
      setTimeout(() => setSmartPasteStatus(null), 4000);
    } finally {
      setIsParsing(false);
    }
  };

  // 讀取手機或電腦剪貼簿
  const handleReadClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && clipText.trim()) {
          setSmartPasteText(clipText);
          handleSmartParse(clipText);
        } else {
          setSmartPasteStatus('剪貼簿目前沒有文字內容');
          setTimeout(() => setSmartPasteStatus(null), 3000);
        }
      } else {
        setSmartPasteStatus('瀏覽器未開放自動讀取剪貼簿，請直接貼在輸入框');
        setTimeout(() => setSmartPasteStatus(null), 4000);
      }
    } catch {
      setSmartPasteStatus('無法存取剪貼簿，請直接按貼上（Cmd+V / Ctrl+V）');
      setTimeout(() => setSmartPasteStatus(null), 4000);
    }
  };

  if (!isOpen) return null;

  const toggleCategory = (catName: string) => {
    soundManager.playPop();
    if (categories.includes(catName)) {
      if (categories.length > 1) {
        setCategories(categories.filter(c => c !== catName));
      }
    } else {
      setCategories([...categories, catName]);
    }
  };

  const addCustomCategory = () => {
    if (!customCategory.trim()) return;
    const trimmed = customCategory.trim();
    if (!categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      soundManager.playPop();
    }
    setCustomCategory('');
  };

  const activeCropItem = cropQueue[currentCropIndex];

  // 完成裁切並更新至對應照片位置
  const handleFinishCrop = (croppedBase64: string) => {
    if (!activeCropItem) return;

    if (activeCropItem.target === 'restaurant') {
      if (activeCropItem.originalIdx !== undefined) {
        setImages(prev => prev.map((img, i) => i === activeCropItem.originalIdx ? croppedBase64 : img));
      } else {
        setImages(prev => [...prev, croppedBase64]);
      }
    } else {
      const dishId = activeCropItem.target.dishId;
      setDishes(prev => prev.map(d => {
        if (d.id === dishId) {
          const currentPhotos = d.photos || [];
          if (activeCropItem.originalIdx !== undefined) {
            return {
              ...d,
              photos: currentPhotos.map((p, i) => i === activeCropItem.originalIdx ? croppedBase64 : p)
            };
          } else {
            return {
              ...d,
              photos: [...currentPhotos, croppedBase64]
            };
          }
        }
        return d;
      }));
    }

    advanceCropQueue();
  };

  // 跳過裁切（直接使用原圖壓縮）
  const handleSkipCrop = async () => {
    if (!activeCropItem) return;
    setIsCompressing(true);
    let finalBase64 = activeCropItem.dataUrl;
    if (activeCropItem.file) {
      try {
        finalBase64 = await compressImage(activeCropItem.file, 1200, 0.82);
      } catch (e) {
        console.warn('原圖壓縮失敗，使用原始 DataURL', e);
      }
    }
    setIsCompressing(false);

    if (activeCropItem.target === 'restaurant') {
      if (activeCropItem.originalIdx === undefined) {
        setImages(prev => [...prev, finalBase64]);
      }
    } else {
      const dishId = activeCropItem.target.dishId;
      if (activeCropItem.originalIdx === undefined) {
        setDishes(prev => prev.map(d => {
          if (d.id === dishId) {
            return { ...d, photos: [...(d.photos || []), finalBase64] };
          }
          return d;
        }));
      }
    }

    advanceCropQueue();
  };

  const advanceCropQueue = () => {
    if (currentCropIndex + 1 < cropQueue.length) {
      setCurrentCropIndex(prev => prev + 1);
    } else {
      setCropQueue([]);
      setCurrentCropIndex(0);
      soundManager.playVictory();
    }
  };

  const handleCancelCrop = () => {
    setCropQueue([]);
    setCurrentCropIndex(0);
  };

  // 對已上傳的店家照片重新裁切
  const handleRecropRestaurantPhoto = (idx: number) => {
    soundManager.playPop();
    setCropQueue([{
      id: `crop-recrop-${Date.now()}`,
      dataUrl: images[idx],
      target: 'restaurant',
      originalIdx: idx
    }]);
    setCurrentCropIndex(0);
  };

  // 對已上傳的餐點照片重新裁切
  const handleRecropDishPhoto = (dishId: string, pIdx: number, photoUrl: string) => {
    soundManager.playPop();
    setCropQueue([{
      id: `crop-recrop-${Date.now()}`,
      dataUrl: photoUrl,
      target: { dishId },
      originalIdx: pIdx
    }]);
    setCurrentCropIndex(0);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    soundManager.playPop();
    const newQueueItems: CropQueueItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await readFileAsDataURL(file);
      newQueueItems.push({
        id: `crop-${Date.now()}-${i}`,
        dataUrl,
        file,
        target: 'restaurant'
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setCropQueue(newQueueItems);
    setCurrentCropIndex(0);
  };

  const removePhoto = (idx: number) => {
    soundManager.playPop();
    const updated = images.filter((_, i) => i !== idx);
    setImages(updated);
    if (coverIndex >= updated.length) {
      setCoverIndex(Math.max(0, updated.length - 1));
    }
  };

  const addDish = () => {
    soundManager.playPop();
    const newDish: DishRecord = {
      id: `dish-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      opinion: 'like',
      note: '',
      photos: []
    };
    setDishes([...dishes, newDish]);
    if (!featuredDishId) {
      setFeaturedDishId(newDish.id);
    }
  };

  const updateDish = (id: string, field: keyof DishRecord, val: unknown) => {
    setDishes(dishes.map(d => d.id === id ? { ...d, [field]: val } : d));
  };

  const removeDish = (id: string) => {
    soundManager.playPop();
    setDishes(dishes.filter(d => d.id !== id));
    if (featuredDishId === id) {
      const remaining = dishes.filter(d => d.id !== id);
      setFeaturedDishId(remaining.length > 0 ? remaining[0].id : undefined);
    }
  };

  const handleDishPhotoUpload = async (dishId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    soundManager.playPop();
    const newQueueItems: CropQueueItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await readFileAsDataURL(file);
      newQueueItems.push({
        id: `crop-${Date.now()}-${i}`,
        dataUrl,
        file,
        target: { dishId }
      });
    }

    e.target.value = '';
    setCropQueue(newQueueItems);
    setCurrentCropIndex(0);
  };

  const removeDishPhoto = (dishId: string, photoIdx: number) => {
    soundManager.playPop();
    setDishes(prev => prev.map(d => {
      if (d.id === dishId) {
        const currentPhotos = d.photos || [];
        return { ...d, photos: currentPhotos.filter((_, i) => i !== photoIdx) };
      }
      return d;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('請輸入店家名稱喔！');
      return;
    }

    setIsSaving(true);
    try {
      const validDishes = dishes.filter(d => d.name.trim().length > 0);
      let finalFeaturedDishId = featuredDishId;
      if (finalFeaturedDishId && !validDishes.some(d => d.id === finalFeaturedDishId)) {
        finalFeaturedDishId = validDishes.length > 0 ? validDishes[0].id : undefined;
      } else if (!finalFeaturedDishId && validDishes.length > 0) {
        finalFeaturedDishId = validDishes[0].id;
      }

      const payload: Restaurant = {
        id: initialData?.id || `rest-${Date.now()}`,
        name: name.trim(),
        categories: categories.length > 0 ? categories : (initialData?.categories && initialData.categories.length > 0 ? initialData.categories : ['其他美味']),
        images: images,
        coverIndex: Math.min(coverIndex, Math.max(0, images.length - 1)),
        address: address.trim() || undefined,
        businessHours: businessHours.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        bookingUrl: bookingUrl.trim() || undefined,
        googleMapsUrl: googleMapsUrl.trim() || undefined,
        phone: phone.trim() || undefined,
        note: note.trim() || undefined,
        dishes: validDishes,
        featuredDishId: finalFeaturedDishId,
        updatedAt: Date.now()
      };

      await onSave(payload);
      soundManager.playVictory();
      onClose();
    } catch (err) {
      console.error('儲存失敗:', err);
      alert('儲存失敗，請檢查輸入內容');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/45 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`rounded-[36px] max-w-2xl w-full max-h-[92vh] overflow-y-auto no-scrollbar shadow-float border-2 flex flex-col relative animate-scaleUp ${
          isChef ? 'bg-[#FFFDF9] border-[#EFE5D8]' : 'bg-[#FAF7F2] border-[#E5DDD2]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部標題 */}
        <div className={`sticky top-0 z-20 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b ${
          isChef ? 'bg-[#FFFDF9]/95 border-[#F0E6D8]' : 'bg-white/95 border-[#EDE6DC]'
        }`}>
          <h2 className={`text-xl sm:text-2xl font-black flex items-center gap-2 ${
            isChef ? 'text-[#4A2613]' : 'text-japandi-text'
          }`}>
            <span>{initialData ? (isChef ? '✏️ 編輯私房美味' : '✏️ 編輯店家與菜色') : (isChef ? '✨ 收藏美味私房店' : '✨ 記錄常吃店家')}</span>
          </h2>
          <button
            onClick={() => { onClose(); soundManager.playPop(); }}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              isChef ? 'text-[#7A543E] hover:bg-[#F5ECE0] hover:text-[#4A2613]' : 'p-1.5 rounded-full hover:bg-japandi-oat text-japandi-text-muted transition-colors'
            }`}
            aria-label="關閉"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* 表單內容 */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6">
          {/* ✨ 智慧貼上 / Google Maps 快速匯入 */}
          <div className={`rounded-2xl p-4 transition-all border-2 ${
            isChef ? 'bg-[#FFF8EE] border-[#F2E4D2]' : 'bg-[#F6F2EC] border-[#E3D9CC]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-black flex items-center gap-1.5 ${
                isChef ? 'text-[#4A2613]' : 'text-japandi-text'
              }`}>
                <Sparkles className={`w-4 h-4 ${isChef ? 'text-[#D86824] fill-[#D86824]' : 'text-japandi-apricot fill-japandi-apricot'}`} />
                <span>智慧貼上 / Google Maps 快速帶入</span>
              </span>
              <span className={`text-xs font-bold hidden sm:inline ${
                isChef ? 'text-[#8A5A38]' : 'text-japandi-text-muted font-medium'
              }`}>
                支援地圖分享文字、電話、inline 訂位
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={smartPasteText}
                onChange={(e) => {
                  const val = e.target.value;
                  setSmartPasteText(val);
                  if (val.trim().startsWith('http') || val.includes('\n')) {
                    handleSmartParse(val);
                  }
                }}
                onPaste={(e) => {
                  const text = e.clipboardData.getData('text');
                  if (text && text.trim()) {
                    setSmartPasteText(text);
                    handleSmartParse(text);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSmartParse();
                  }
                }}
                placeholder="貼上 Google Maps 分享連結、文字或訂位網址..."
                className={`flex-1 px-3.5 py-2.5 rounded-xl border-2 text-sm focus:outline-none bg-white font-medium ${
                  isChef
                    ? 'border-[#E5DACB] focus:border-[#D85A2A] text-[#4A2613] placeholder-[#A8907E]'
                    : 'border-[#D5C7B5] focus:border-japandi-sage text-japandi-text placeholder-japandi-text-muted/70'
                }`}
              />
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleReadClipboard}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 font-black text-xs sm:text-sm rounded-xl border-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
                    isChef
                      ? 'bg-white hover:bg-[#FFF9EE] text-[#7A543E] border-[#E5DACB] hover:border-[#D85A2A]'
                      : 'btn-pebble bg-white hover:bg-japandi-oat text-japandi-text border-[#D5C7B5]'
                  }`}
                  title="從手機或電腦剪貼簿讀取"
                >
                  <Clipboard className={`w-3.5 h-3.5 ${isChef ? 'text-[#D85A2A]' : 'text-japandi-sage-dark'}`} />
                  <span>貼上剪貼簿</span>
                </button>
                <button
                  type="button"
                  disabled={isParsing}
                  onClick={() => handleSmartParse()}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-black text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                    isChef
                      ? 'bg-[#D85A2A] hover:bg-[#C24B1E] text-white border border-[#C24B1E]'
                      : 'btn-pebble bg-japandi-sage hover:bg-japandi-sage-dark text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isParsing ? '解析中...' : '解析帶入'}</span>
                </button>
              </div>
            </div>

            {smartPasteStatus && (
              <div className={`mt-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold animate-fadeIn flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm border ${
                isChef
                  ? 'bg-white text-[#7A543E] border-[#F2E4D2]'
                  : 'bg-white/95 border-japandi-sage/40 text-japandi-sage-dark shadow-soft'
              }`}>
                <span className="flex items-center gap-1.5 leading-relaxed">
                  {smartPasteStatus}
                </span>
                {googleMapsUrl && !name && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg shrink-0 self-start sm:self-auto font-bold ${
                      isChef
                        ? 'text-[#D85A2A] hover:underline bg-[#FFF5ED] border border-[#FCD8BE]'
                        : 'text-japandi-sage-dark hover:underline bg-japandi-oat/80'
                    }`}
                  >
                    <span>開啟地圖查看店名</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* 店家名稱 */}
          <div>
            <label className={`block text-sm font-black mb-1.5 ${
              isChef ? 'text-[#4A2613]' : 'text-japandi-text'
            }`}>
              店家名稱 <span className={isChef ? 'text-[#C73E29]' : 'text-japandi-terracotta'}>*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text');
                if (text && (text.startsWith('http') || text.includes('share.google') || text.includes('maps.app') || text.includes('\n'))) {
                  e.preventDefault();
                  setSmartPasteText(text);
                  handleSmartParse(text);
                }
              }}
              placeholder="例：巷口老牌牛肉麵、卡滋炸豬排"
              required
              className={`w-full px-4 py-3 rounded-2xl border-2 focus:outline-none font-bold text-base bg-white shadow-sm transition-all ${
                isChef
                  ? 'border-[#E5DACB] focus:border-[#D85A2A] text-[#4A2613] placeholder-[#A8907E]'
                  : 'border-[#DCD3C6] focus:border-japandi-sage text-japandi-text placeholder-japandi-text-muted shadow-soft'
              }`}
            />
          </div>

          {/* 分類標籤 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`block text-sm font-black ${
                isChef ? 'text-[#4A2613]' : 'text-japandi-text'
              }`}>
                餐點分類（選填，可複選）
              </label>
              {onOpenManageCategories && (
                <button
                  type="button"
                  onClick={() => { onOpenManageCategories(); soundManager.playPop(); }}
                  className={`text-xs font-bold hover:underline flex items-center gap-1 ${
                    isChef ? 'text-[#D85A2A] hover:text-[#B84518]' : 'text-japandi-sage-dark'
                  }`}
                >
                  <span>🏷️ 管理/排序標籤</span>
                </button>
              )}
            </div>
            {/* 已選標籤快速檢視列（支援點擊 ✕ 移除，包含舊標籤） */}
            {categories.length > 0 && (
              <div className={`flex flex-wrap items-center gap-1.5 mb-2.5 p-2.5 rounded-2xl border ${
                isChef ? 'bg-[#FFF8EE] border-[#F2E4D2]' : 'bg-[#F6F2EC] border-[#E8DFC0]/70'
              }`}>
                <span className={`text-xs font-bold mr-1 ${
                  isChef ? 'text-[#8A5A38]' : 'text-japandi-text-muted'
                }`}>
                  已選標籤 ({categories.length})：
                </span>
                {categories.map((catName) => (
                  <span
                    key={catName}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm transition-all ${
                      isChef
                        ? 'bg-[#D85A2A] text-white hover:bg-[#C24B1E]'
                        : 'bg-japandi-sage text-white hover:bg-japandi-sage-dark'
                    }`}
                  >
                    <span>{catName}</span>
                    <button
                      type="button"
                      onClick={() => { toggleCategory(catName); soundManager.playPop(); }}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors cursor-pointer"
                      title={`取消「${catName}」標籤`}
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => { setCategories([]); soundManager.playPop(); }}
                  className={`text-xs hover:underline ml-auto font-bold px-1.5 py-0.5 cursor-pointer ${
                    isChef ? 'text-[#C73E29]' : 'text-japandi-terracotta'
                  }`}
                >
                  全部清除
                </button>
              </div>
            )}

            {/* 標籤按鈕清單（包含標籤庫標籤 ＋ 該店家原本擁有的任何舊標籤，確保絕不遺漏任何可取消的標籤） */}
            <div className="flex flex-wrap gap-2 mb-2.5">
              {(() => {
                const presetList = (availableCategories || PRESET_CATEGORIES).filter(c => c.id !== 'all');
                const orphanCategories = categories
                  .filter(catName => !presetList.some(p => p.name === catName))
                  .map(name => ({
                    id: `orphan-${name}`,
                    name: name,
                    icon: name.includes('麵') || name.includes('米粉') ? '🍜' : '🏷️'
                  }));
                const allList = [...presetList, ...orphanCategories];

                return allList.map((cat) => {
                  const active = categories.includes(cat.name);
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => toggleCategory(cat.name)}
                      className={`px-3.5 py-1.5 rounded-2xl font-bold text-sm flex items-center gap-1.5 border-2 transition-all cursor-pointer ${
                        active
                          ? (isChef
                              ? 'bg-[#F3A935] text-[#3E1F0D] border-[#E29520] shadow-sm font-black active:scale-95'
                              : 'bg-japandi-sage text-white border-japandi-sage-dark shadow-soft btn-pebble')
                          : (isChef
                              ? 'bg-white text-[#6B4B38] border-[#EADFCF] hover:bg-[#FFF9EE] hover:border-[#D85A2A] active:scale-95'
                              : 'bg-white text-japandi-text-muted border-[#EDE6DC] hover:bg-japandi-oat btn-pebble')
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      {active && <Check className="w-3.5 h-3.5 ml-0.5 stroke-[2.5]" />}
                    </button>
                  );
                });
              })()}
            </div>

            {/* 新增自訂標籤 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomCategory(); } }}
                placeholder="自訂其他分類（例如：便當、甜甜圈）"
                className={`flex-1 px-3.5 py-2.5 rounded-xl border-2 text-sm font-medium focus:outline-none bg-white ${
                  isChef
                    ? 'border-[#E5DACB] focus:border-[#D85A2A] text-[#4A2613] placeholder-[#A8907E]'
                    : 'border-[#DCD3C6] focus:border-japandi-sage text-japandi-text'
                }`}
              />
              <button
                type="button"
                onClick={addCustomCategory}
                className={`px-4 py-2.5 font-black text-sm rounded-xl border-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
                  isChef
                    ? 'bg-white hover:bg-[#FFF9EE] text-[#4A2613] hover:text-[#D85A2A] border-[#E5DACB] hover:border-[#D85A2A]'
                    : 'btn-pebble bg-white hover:bg-japandi-oat text-japandi-text border-[#DCD3C6]'
                }`}
              >
                + 加標籤
              </button>
            </div>
          </div>

          {/* 照片上傳與預覽 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-sm font-black ${
                isChef ? 'text-[#4A2613]' : 'text-japandi-text'
              }`}>
                店家與食物照片（支援多張）
              </label>
              <span className={`text-xs sm:text-sm font-bold ${
                isChef ? 'text-[#8A5A38]' : 'text-japandi-text-muted font-medium'
              }`}>
                點擊星星可設為封面
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-2.5">
              {images.map((img, idx) => (
                <div 
                  key={idx}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 group transition-all bg-white ${
                    idx === coverIndex
                      ? (isChef ? 'border-[#F3A935] ring-2 ring-[#F3A935]/50 shadow-sm' : 'border-japandi-sage ring-2 ring-japandi-sage/50')
                      : (isChef ? 'border-[#EFE5D8]' : 'border-[#EDE6DC]')
                  }`}
                >
                  <SafeImage src={img} alt="food" className="w-full h-full object-cover" />
                  
                  {/* 設為封面 */}
                  <button
                    type="button"
                    onClick={() => { setCoverIndex(idx); soundManager.playPop(); }}
                    title={idx === coverIndex ? '目前為封面照' : '設為封面'}
                    className={`absolute top-1.5 left-1.5 p-1 rounded-lg transition-all cursor-pointer ${
                      idx === coverIndex
                        ? (isChef ? 'bg-[#F3A935] text-[#3E1F0D] shadow-sm' : 'bg-japandi-sage text-white shadow-soft')
                        : (isChef ? 'bg-black/50 text-white hover:bg-[#F3A935] hover:text-[#3E1F0D]' : 'bg-black/40 text-white hover:bg-japandi-sage')
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* 重新裁切照片 */}
                  <button
                    type="button"
                    onClick={() => handleRecropRestaurantPhoto(idx)}
                    title="重新裁切構圖"
                    className={`absolute bottom-1.5 left-1.5 p-1 text-white rounded-lg transition-colors cursor-pointer ${
                      isChef ? 'bg-black/50 hover:bg-[#D85A2A]' : 'bg-black/40 hover:bg-japandi-sage'
                    }`}
                  >
                    <Crop className="w-3.5 h-3.5" />
                  </button>

                  {/* 刪除照片 */}
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className={`absolute top-1.5 right-1.5 p-1 text-white rounded-lg transition-colors cursor-pointer ${
                      isChef ? 'bg-black/50 hover:bg-[#C73E29]' : 'bg-black/40 hover:bg-japandi-terracotta'
                    }`}
                  >
                    <X className="w-3.5 h-3.5 stroke-[2]" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                disabled={isCompressing}
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isChef
                    ? 'border-[#E0D4C5] hover:border-[#D85A2A] bg-white hover:bg-[#FFF9EE] text-[#8A5A38] hover:text-[#D85A2A]'
                    : 'border-[#D5C7B5] hover:border-japandi-sage bg-white hover:bg-[#F2EDE5] text-japandi-text-muted'
                }`}
              >
                <Upload className={`w-6 h-6 ${isChef ? 'text-[#D85A2A]' : 'text-japandi-sage'}`} />
                <span className="text-sm font-bold">
                  {isCompressing ? '壓縮中...' : '選取照片'}
                </span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* 營業時間與地址 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-black mb-1 flex items-center gap-1.5 ${
                isChef ? 'text-[#4A2613]' : 'text-japandi-text'
              }`}>
                <Clock className={`w-3.5 h-3.5 ${isChef ? 'text-[#D85A2A]' : 'text-japandi-terracotta'}`} />
                <span>幾點開始營業 / 營業時間（選填）</span>
              </label>
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="例：11:30 開始營業 或 11:30 - 21:00"
                className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-sm sm:text-base focus:outline-none bg-white font-medium transition-all ${
                  isChef
                    ? 'border-[#E5DACB] focus:border-[#D85A2A] text-[#4A2613] placeholder-[#A8907E]'
                    : 'border-[#DCD3C6] focus:border-japandi-sage text-japandi-text'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-black mb-1 flex items-center gap-1.5 ${
                isChef ? 'text-[#4A2613]' : 'text-japandi-text'
              }`}>
                <MapPin className={`w-3.5 h-3.5 ${isChef ? 'text-[#2D7A46]' : 'text-japandi-sage'}`} />
                <span>店家地址 / 捷運商圈（選填）</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="例：台北市大安區新生南路二段2號"
                className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-sm sm:text-base focus:outline-none bg-white font-medium transition-all ${
                  isChef
                    ? 'border-[#E5DACB] focus:border-[#D85A2A] text-[#4A2613] placeholder-[#A8907E]'
                    : 'border-[#DCD3C6] focus:border-japandi-sage text-japandi-text'
                }`}
              />
            </div>
          </div>

          {/* 店家備忘小抄 / 公休時間 */}
          <div>
            <label className={`block text-sm font-black mb-1 flex items-center gap-1.5 ${
              isChef ? 'text-[#4A2613]' : 'text-japandi-text'
            }`}>
              <StickyNote className={`w-3.5 h-3.5 ${isChef ? 'text-[#F3A935]' : 'text-japandi-apricot'}`} />
              <span>📝 店家備忘小抄 / 公休時間（選填）</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例：週二公休、電話 02-2358-1888、可外送"
              className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-sm sm:text-base focus:outline-none bg-white font-medium transition-all ${
                isChef
                  ? 'border-[#E5DACB] focus:border-[#D85A2A] text-[#4A2613] placeholder-[#A8907E]'
                  : 'border-[#DCD3C6] focus:border-japandi-sage text-japandi-text'
              }`}
            />
          </div>

          {/* 🌐 店家官網、📅 線上訂位與 🗺️ Google 地圖網址 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`block text-sm font-black mb-1 flex items-center gap-1.5 ${
                isChef ? 'text-[#4A2613]' : 'text-japandi-text'
              }`}>
                <Globe className={`w-3.5 h-3.5 ${isChef ? 'text-[#D86824]' : 'text-japandi-sage-dark'}`} />
                <span>店家官網 / 粉專（選填）</span>
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="例：官網、FB 或 IG 網址"
                className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-sm sm:text-base focus:outline-none bg-white font-medium transition-all ${
                  isChef
                    ? 'border-[#E5DACB] focus:border-[#D85A2A] text-[#4A2613] placeholder-[#A8907E]'
                    : 'border-[#DCD3C6] focus:border-japandi-sage text-japandi-text'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-black mb-1 flex items-center gap-1.5 ${
                isChef ? 'text-[#4A2613]' : 'text-japandi-text'
              }`}>
                <Calendar className={`w-3.5 h-3.5 ${isChef ? 'text-[#E86A43]' : 'text-japandi-apricot'}`} />
                <span>線上訂位網址（選填）</span>
              </label>
              <input
                type="url"
                value={bookingUrl}
                onChange={(e) => setBookingUrl(e.target.value)}
                placeholder="例：inline.app、OpenTable 網址"
                className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-sm sm:text-base focus:outline-none bg-white font-medium transition-all ${
                  isChef
                    ? 'border-[#E5DACB] focus:border-[#D85A2A] text-[#4A2613] placeholder-[#A8907E]'
                    : 'border-[#DCD3C6] focus:border-japandi-sage text-japandi-text'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-black mb-1 flex items-center gap-1.5 ${
                isChef ? 'text-[#4A2613]' : 'text-japandi-text'
              }`}>
                <Globe className={`w-3.5 h-3.5 ${isChef ? 'text-[#2D7A46]' : 'text-japandi-sage'}`} />
                <span>Google 地圖網址（選填）</span>
              </label>
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="例：Google Maps 分享網址"
                className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-sm sm:text-base focus:outline-none bg-white font-medium transition-all ${
                  isChef
                    ? 'border-[#E5DACB] focus:border-[#D85A2A] text-[#4A2613] placeholder-[#A8907E]'
                    : 'border-[#DCD3C6] focus:border-japandi-sage text-japandi-text'
                }`}
              />
            </div>
          </div>

          {/* 吃過哪些食物？餐點評價列表 */}
          <div className={`border-t pt-5 ${isChef ? 'border-[#F0E6D8]' : 'border-[#EDE6DC]'}`}>
            <div className="flex items-start sm:items-center justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <h3 className={`text-base sm:text-lg font-black flex items-center gap-1.5 ${
                  isChef ? 'text-[#4A2613]' : 'text-japandi-text'
                }`}>
                  <span>🍽️ 吃過什麼？（必點與避雷紀錄）</span>
                </h3>
                <p className={`text-sm ${isChef ? 'text-[#8A5A38]' : 'text-japandi-text-muted'}`}>
                  標記「必點/避雷」，點擊星星 ★ 即可自訂此店在「餐廳菜單」模式展示的代表餐點！
                </p>
              </div>

              <button
                type="button"
                onClick={addDish}
                className={`shrink-0 whitespace-nowrap self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 font-black text-sm rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 ${
                  isChef
                    ? 'bg-[#2D7A46] hover:bg-[#236337] text-white border border-[#236337]'
                    : 'btn-pebble bg-japandi-sage hover:bg-japandi-sage-dark text-white shadow-soft'
                }`}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>新增餐點</span>
              </button>
            </div>

            <div className="space-y-3">
              {dishes.map((dish) => (
                <div
                  key={dish.id}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    dish.opinion === 'like'
                      ? (isChef ? 'bg-[#FFFDF9] border-[#F2E6D8] shadow-sm' : 'bg-[#F2F7F3] border-[#CFE1D4]')
                      : dish.opinion === 'dislike'
                      ? (isChef ? 'bg-[#FFFDF9] border-[#F8CEC7] shadow-sm' : 'bg-[#FCF2F0] border-[#F2D1CB]')
                      : (isChef ? 'bg-[#FFFDF9] border-[#EADFCF] shadow-sm' : 'bg-white border-[#EDE6DC]')
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <input
                      type="text"
                      value={dish.name}
                      onChange={(e) => updateDish(dish.id, 'name', e.target.value)}
                      placeholder="餐點名稱（例：清燉牛肉麵、起司豬排）"
                      className={`flex-1 min-w-0 w-full sm:w-auto px-3.5 py-2 rounded-xl border-2 text-sm sm:text-base font-bold focus:outline-none bg-white transition-all ${
                        isChef
                          ? 'border-[#E5DACB] focus:border-[#D85A2A] text-[#4A2613] placeholder-[#A8907E]'
                          : 'border-[#DCD3C6] focus:border-japandi-sage text-japandi-text'
                      }`}
                    />

                    {/* 評價切換與刪除區塊 */}
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
                      {/* Menu 代表標記按鈕：單一星星圖示，不帶任何文字 */}
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedDishId(featuredDishId === dish.id ? undefined : dish.id);
                          soundManager.playPop();
                        }}
                        className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer select-none shrink-0 border-2 active:scale-95 ${
                          featuredDishId === dish.id
                            ? (isChef
                                ? 'bg-[#FFF2E2] border-[#D85A2A] text-[#D85A2A] shadow-sm'
                                : 'bg-[#EBF3ED] border-japandi-sage text-japandi-sage-dark shadow-soft')
                            : (isChef
                                ? 'bg-white border-[#E5DACB] text-stone-300 hover:text-[#D85A2A] hover:border-[#D85A2A]/40'
                                : 'bg-white border-[#EDE6DC] text-stone-300 hover:text-japandi-sage hover:border-japandi-sage/40')
                        }`}
                        title={featuredDishId === dish.id ? "菜單代表餐點（點擊取消）" : "設為菜單代表餐點"}
                      >
                        <Star
                          className={`w-5 h-5 transition-transform ${
                            featuredDishId === dish.id
                              ? 'fill-current scale-110'
                              : 'stroke-[2] hover:scale-110'
                          }`}
                        />
                      </button>

                      {/* 評價切換按鈕組 */}
                      <div className={`flex-1 sm:flex-initial flex items-center gap-1 bg-white p-1 rounded-xl border-2 shrink-0 ${
                        isChef ? 'border-[#E5DACB]' : 'border-[#EDE6DC]'
                      }`}>
                        <button
                          type="button"
                          onClick={() => { updateDish(dish.id, 'opinion', 'like' as OpinionType); soundManager.playPop(); }}
                          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-sm font-black whitespace-nowrap transition-all cursor-pointer select-none ${
                            dish.opinion === 'like'
                              ? (isChef ? 'bg-[#D85A2A] text-white shadow-sm' : 'bg-japandi-sage text-white shadow-soft')
                              : (isChef ? 'text-[#8A5A38] hover:text-[#D85A2A]' : 'text-japandi-text-muted hover:text-japandi-sage')
                          }`}
                        >
                          <span>{isChef ? '⭐ 必點' : '💮 必點'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { updateDish(dish.id, 'opinion', 'dislike' as OpinionType); soundManager.playPop(); }}
                          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-sm font-black whitespace-nowrap transition-all cursor-pointer select-none ${
                            dish.opinion === 'dislike'
                              ? (isChef ? 'bg-[#C73E29] text-white shadow-sm' : 'bg-japandi-terracotta text-white shadow-soft')
                            : (isChef ? 'text-[#8A5A38] hover:text-[#C73E29]' : 'text-japandi-text-muted hover:text-japandi-terracotta')
                          }`}
                        >
                          <span>{isChef ? '⚠️ 避雷' : '⚠️ 避雷'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { updateDish(dish.id, 'opinion', 'neutral' as OpinionType); soundManager.playPop(); }}
                          className={`flex-1 sm:flex-initial flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all cursor-pointer select-none ${
                            dish.opinion === 'neutral'
                              ? (isChef ? 'bg-[#F4ECE1] text-[#7A543E]' : 'bg-japandi-oat text-japandi-text')
                              : (isChef ? 'text-[#8A5A38] hover:text-[#4A2613]' : 'text-japandi-text-muted hover:text-japandi-text')
                          }`}
                        >
                          <span>普通</span>
                        </button>
                      </div>

                      {/* 刪除按鈕 */}
                      <button
                        type="button"
                        onClick={() => removeDish(dish.id)}
                        className={`p-2 rounded-lg transition-colors shrink-0 cursor-pointer ${
                          isChef
                            ? 'text-[#9A7B68] hover:text-[#C73E29] hover:bg-[#FDF1EF]'
                            : 'text-japandi-text-muted hover:text-japandi-terracotta hover:bg-japandi-oat'
                        }`}
                        title="刪除這道餐點"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={dish.note || ''}
                      onChange={(e) => updateDish(dish.id, 'note', e.target.value)}
                      placeholder={
                        dish.opinion === 'like'
                          ? '推薦原因（例：牛肉軟嫩湯很甜、小朋友吃光光）'
                          : dish.opinion === 'dislike'
                          ? '避雷原因（例：超級辣！小孩吃一口狂灌水）'
                          : '餐點備註（選填）'
                      }
                      className={`w-full px-3.5 py-2 rounded-lg border-2 text-sm focus:outline-none bg-white transition-all ${
                        isChef
                          ? 'border-[#EADFCF] focus:border-[#D85A2A] text-[#4A2613] placeholder-[#A8907E]'
                          : 'border-[#EDE6DC] focus:border-japandi-sage text-japandi-text'
                      }`}
                    />
                  </div>

                  {/* 餐點照片上傳與縮圖清單 */}
                  <div className={`mt-3 pt-2.5 border-t border-dashed ${
                    isChef ? 'border-[#EADFCF]' : 'border-[#E3D9CC]'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-bold flex items-center gap-1 ${
                        isChef ? 'text-[#8A5A38]' : 'text-japandi-text-muted'
                      }`}>
                        <Camera className={`w-3.5 h-3.5 ${isChef ? 'text-[#D85A2A]' : 'text-japandi-sage'}`} />
                        <span>餐點照片（{(dish.photos || []).length} 張）</span>
                      </span>
                      <span className={`text-xs font-bold ${
                        isChef ? 'text-[#2D7A46]' : 'text-japandi-sage-dark font-medium'
                      }`}>
                        ✨ 自動同步至首圖輪播
                      </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                      {/* 已上傳的照片縮圖 */}
                      {(dish.photos || []).map((photo, pIdx) => (
                        <div 
                          key={pIdx} 
                          className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 shadow-sm group bg-white ${
                            isChef ? 'border-[#EADFCF]' : 'border-[#DCD3C6] shadow-soft'
                          }`}
                        >
                          <SafeImage 
                            src={photo} 
                            alt={`${dish.name || '餐點'}照片`} 
                            className="w-full h-full object-cover" 
                          />
                          {/* 重新裁切照片 */}
                          <button
                            type="button"
                            onClick={() => handleRecropDishPhoto(dish.id, pIdx, photo)}
                            className={`absolute bottom-1 left-1 p-1 text-white rounded-md transition-colors cursor-pointer ${
                              isChef ? 'bg-black/60 hover:bg-[#D85A2A]' : 'bg-black/60 hover:bg-japandi-sage'
                            }`}
                            title="重新裁切構圖"
                          >
                            <Crop className="w-3 h-3" />
                          </button>
                          {/* 刪除照片 */}
                          <button
                            type="button"
                            onClick={() => removeDishPhoto(dish.id, pIdx)}
                            className={`absolute top-1 right-1 p-1 text-white rounded-md transition-colors cursor-pointer ${
                              isChef ? 'bg-black/60 hover:bg-[#C73E29]' : 'bg-black/60 hover:bg-japandi-terracotta'
                            }`}
                            title="刪除這張照片"
                          >
                            <X className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      ))}

                      {/* 上傳照片按鈕 */}
                      <label 
                        className={`w-16 h-16 shrink-0 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                          isChef
                            ? 'border-[#E0D4C5] hover:border-[#D85A2A] bg-white hover:bg-[#FFF9EE] text-[#8A5A38] hover:text-[#D85A2A]'
                            : 'border-[#D5C7B5] hover:border-japandi-sage bg-white hover:bg-japandi-oat/60 text-japandi-text-muted hover:text-japandi-sage'
                        } ${isCompressing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="上傳這道餐點的照片"
                      >
                        <Camera className="w-4 h-4" />
                        <span className="text-[11px] font-bold">加照片</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={isCompressing}
                          className="hidden"
                          onChange={(e) => handleDishPhotoUpload(dish.id, e)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              {dishes.length === 0 && (
                <div 
                  onClick={addDish}
                  className={`border-2 border-dashed bg-white rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    isChef
                      ? 'border-[#E0D4C5] hover:border-[#D85A2A] hover:bg-[#FFFDF9]'
                      : 'border-[#DCD3C6] hover:border-japandi-sage'
                  }`}
                >
                  <p className={`text-sm font-bold ${
                    isChef ? 'text-[#8A5A38]' : 'text-japandi-text-muted'
                  }`}>
                    點擊「＋新增餐點」記錄吃過的食物與心得，避雷不再踩坑！
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 底部按鈕 */}
          <div className={`pt-4 border-t flex items-center justify-end gap-3 ${
            isChef ? 'border-[#F0E6D8]' : 'border-[#EDE6DC]'
          }`}>
            <button
              type="button"
              onClick={() => { onClose(); soundManager.playPop(); }}
              className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                isChef ? 'text-[#7A543E] hover:bg-[#F5ECE0]' : 'text-japandi-text-muted hover:bg-japandi-oat'
              }`}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-sm transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95 ${
                isChef
                  ? 'bg-[#F3A935] hover:bg-[#E09825] active:bg-[#D48A18] text-[#3E1F0D] border-2 border-[#E09825]'
                  : 'btn-pebble bg-japandi-apricot hover:bg-japandi-apricot-dark text-white shadow-soft'
              }`}
            >
              {isSaving ? '儲存中...' : (isChef ? '確認儲存店家 🥞✨' : '確認儲存店家 🌿')}
            </button>
          </div>
        </form>
      </div>

      {/* 照片裁切彈窗 */}
      {cropQueue.length > 0 && activeCropItem && (
        <ImageCropModal
          isOpen={true}
          imageSrc={activeCropItem.dataUrl}
          onClose={handleCancelCrop}
          onCropComplete={handleFinishCrop}
          onSkipCrop={handleSkipCrop}
          currentStep={currentCropIndex + 1}
          totalSteps={cropQueue.length}
        />
      )}
    </div>
  );
};
