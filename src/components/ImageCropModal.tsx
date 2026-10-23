import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  RotateCw, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  Crop,
  RotateCcw as ResetIcon
} from 'lucide-react';
import { soundManager } from '../utils/sound';

export type AspectRatioType = '4:3' | '1:1' | '16:9' | 'free';

export interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
  onSkipCrop?: () => void;
  currentStep?: number;
  totalSteps?: number;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  onSkipCrop,
  currentStep = 1,
  totalSteps = 1,
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('4:3');
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });

  const containerRef = useRef<HTMLDivElement>(null);

  // 當圖片切換或開啟時，重設狀態
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setBgColor('#FFFFFF');

      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        setNaturalDimensions({
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 600
        });
      };
    }
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  // 計算裁切框視窗大小 (寬高限制在 380x300 內)
  const isRotated = rotation === 90 || rotation === 270;
  const imgW = isRotated ? naturalDimensions.height : naturalDimensions.width;
  const imgH = isRotated ? naturalDimensions.width : naturalDimensions.height;
  const originalAspect = imgW / imgH;

  let viewWidth = 380;
  let viewHeight = 285;

  if (aspectRatio === '4:3') {
    viewWidth = 380;
    viewHeight = Math.round(380 / (4 / 3)); // 285
  } else if (aspectRatio === '1:1') {
    viewWidth = 320;
    viewHeight = 320;
  } else if (aspectRatio === '16:9') {
    viewWidth = 380;
    viewHeight = Math.round(380 / (16 / 9)); // 214
  } else if (aspectRatio === 'free') {
    if (originalAspect >= 1) {
      viewWidth = 380;
      viewHeight = Math.min(300, Math.round(380 / originalAspect));
    } else {
      viewHeight = 300;
      viewWidth = Math.min(380, Math.round(300 * originalAspect));
    }
  }

  // 基準尺寸（填滿視窗）
  const baseScale = isRotated
    ? Math.max(viewWidth / naturalDimensions.height, viewHeight / naturalDimensions.width)
    : Math.max(viewWidth / naturalDimensions.width, viewHeight / naturalDimensions.height);

  const baseWidth = naturalDimensions.width * baseScale;
  const baseHeight = naturalDimensions.height * baseScale;

  // 滑鼠/觸控拖曳平移
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 滾輪縮放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(3, Math.max(1, Number((prev + delta).toFixed(2)))));
  };

  // 旋轉 90 度
  const handleRotate = (dir: 'cw' | 'ccw') => {
    soundManager.playPop();
    setRotation((prev) => {
      const step = dir === 'cw' ? 90 : -90;
      return (prev + step + 360) % 360;
    });
  };

  // 重設位置與縮放
  const handleReset = () => {
    soundManager.playPop();
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
  };

  // 產出裁切後的高解析度圖檔 (Canvas)
  const handleConfirmCrop = () => {
    soundManager.playPop();
    const canvas = document.createElement('canvas');
    const targetWidth = Math.min(1200, Math.round(viewWidth * 3));
    const targetHeight = Math.round(targetWidth * (viewHeight / viewWidth));

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 若非透明，先鋪上底色（預設純白），徹底避免透明 PNG / 去背圖轉為 JPEG 時轉成死黑色
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    const K = targetWidth / viewWidth;

    ctx.save();
    // 移動到畫布中心並套用平移
    ctx.translate(targetWidth / 2 + offset.x * K, targetHeight / 2 + offset.y * K);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom * K, zoom * K);
    // 繪製以中心點對齊的原始影像
    ctx.drawImage(
      containerRef.current?.querySelector('img') || new Image(),
      -baseWidth / 2,
      -baseHeight / 2,
      baseWidth,
      baseHeight
    );
    ctx.restore();

    let croppedBase64: string;
    if (bgColor === 'transparent') {
      try {
        croppedBase64 = canvas.toDataURL('image/webp', 0.9);
        if (!croppedBase64.startsWith('data:image/webp')) {
          croppedBase64 = canvas.toDataURL('image/png');
        }
      } catch {
        croppedBase64 = canvas.toDataURL('image/png');
      }
    } else {
      croppedBase64 = canvas.toDataURL('image/jpeg', 0.88);
    }
    onCropComplete(croppedBase64);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-[#FAF7F2] rounded-[32px] max-w-lg w-full max-h-[94vh] overflow-y-auto no-scrollbar shadow-float border border-[#E5DDD2] flex flex-col relative animate-scaleUp p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部標題列 */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE6DC] mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-japandi-sage/15 text-japandi-sage-dark rounded-xl">
              <Crop className="w-5 h-5 stroke-[2.5]" />
            </span>
            <div>
              <h3 className="text-lg font-black text-japandi-text tracking-tight flex items-center gap-2">
                <span>裁切與調整照片</span>
                {totalSteps > 1 && (
                  <span className="text-xs bg-japandi-apricot text-white font-bold px-2 py-0.5 rounded-full">
                    第 {currentStep} / {totalSteps} 張
                  </span>
                )}
              </h3>
              <p className="text-xs text-japandi-text-muted mt-0.5">
                拖曳移動美食焦點、縮放或旋轉構圖
              </p>
            </div>
          </div>

          <button
            onClick={() => { onClose(); soundManager.playPop(); }}
            className="p-1.5 rounded-full hover:bg-japandi-oat text-japandi-text-muted transition-colors"
            aria-label="取消"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 比例切換標籤 */}
        <div className="flex items-center justify-center gap-1.5 mb-2.5 bg-japandi-oat/60 p-1.5 rounded-2xl border border-[#EDE6DC]">
          {[
            { id: '4:3', label: '4:3 畫報（推薦）' },
            { id: '1:1', label: '1:1 正方' },
            { id: '16:9', label: '16:9 寬景' },
            { id: 'free', label: '原圖比例' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setAspectRatio(item.id as AspectRatioType);
                soundManager.playPop();
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                aspectRatio === item.id
                  ? 'bg-japandi-sage text-white shadow-soft'
                  : 'text-japandi-text-muted hover:text-japandi-text'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 底色選擇（針對去背/透明圖片，預設純白避免黑底） */}
        <div className="flex items-center justify-between mb-3 px-2 py-1 bg-white/70 rounded-2xl border border-[#EDE6DC]">
          <span className="text-xs font-bold text-japandi-text-muted pl-1">
            底色：
          </span>
          <div className="flex items-center gap-1">
            {[
              { id: '#FFFFFF', label: '純白 (預設)', dot: '#FFFFFF' },
              { id: '#FAF7F2', label: '柔米', dot: '#FAF7F2' },
              { id: '#FFF4E5', label: '暖橙', dot: '#FFF4E5' },
              { id: 'transparent', label: '保留透明', dot: 'transparent' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setBgColor(item.id);
                  soundManager.playPop();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  bgColor === item.id
                    ? 'bg-japandi-sage text-white shadow-soft'
                    : 'text-japandi-text-muted hover:text-japandi-text hover:bg-black/5'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-stone-300 inline-block shrink-0 shadow-inner"
                  style={{
                    backgroundColor: item.dot === 'transparent' ? '#ffffff' : item.dot,
                    backgroundImage: item.dot === 'transparent' ? 'linear-gradient(45deg, #bbb 25%, transparent 25%), linear-gradient(-45deg, #bbb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #bbb 75%), linear-gradient(-45deg, transparent 75%, #bbb 75%)' : 'none',
                    backgroundSize: '4px 4px'
                  }}
                />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 裁切預覽畫布視窗 */}
        <div className="flex items-center justify-center p-3 bg-[#2D2824] rounded-2xl relative select-none overflow-hidden min-h-[300px]">
          <div
            ref={containerRef}
            style={{ 
              width: viewWidth, 
              height: viewHeight,
              backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor,
              backgroundImage: bgColor === 'transparent'
                ? 'linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)'
                : 'none',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            className={`relative overflow-hidden rounded-xl border-2 border-white/70 shadow-2xl ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* 實際圖片 */}
            <img
              src={imageSrc}
              alt="裁切預覽"
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: baseWidth,
                height: baseHeight,
                marginLeft: -baseWidth / 2,
                marginTop: -baseHeight / 2,
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                maxWidth: 'none',
                maxHeight: 'none'
              }}
              className="pointer-events-none select-none"
            />

            {/* 九宮格輔助構圖線 */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-60">
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-b border-white/40" />
              <div className="border-r border-white/40" />
              <div className="border-r border-white/40" />
              <div />
            </div>
          </div>
        </div>

        {/* 工具控制列：縮放滑桿與旋轉 */}
        <div className="mt-4 space-y-3 px-1">
          {/* 縮放滑桿 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, Number((prev - 0.2).toFixed(2))))}
              className="p-1 text-japandi-text-muted hover:text-japandi-text transition-colors"
              title="縮小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-japandi-sage cursor-pointer h-2 bg-[#E6DDD2] rounded-lg"
            />

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3, Number((prev + 0.2).toFixed(2))))}
              className="p-1 text-japandi-text-muted hover:text-japandi-text transition-colors"
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-japandi-text-muted w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* 旋轉與重設快捷鈕 */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRotate('ccw')}
                className="btn-pebble flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-japandi-oat border border-[#DCD3C6] rounded-xl text-xs font-bold text-japandi-text transition-all"
                title="逆時針轉 90°"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>逆時針</span>
              </button>

              <button
                type="button"
                onClick={() => handleRotate('cw')}
                className="btn-pebble flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-japandi-oat border border-[#DCD3C6] rounded-xl text-xs font-bold text-japandi-text transition-all"
                title="順時針轉 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>順時針</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-japandi-text-muted hover:text-japandi-text flex items-center gap-1 font-bold underline transition-colors"
            >
              <ResetIcon className="w-3.5 h-3.5" />
              <span>重設位置</span>
            </button>
          </div>
        </div>

        {/* 底部操作鈕 */}
        <div className="pt-4 mt-4 border-t border-[#EDE6DC] flex items-center justify-between gap-2">
          {onSkipCrop ? (
            <button
              type="button"
              onClick={() => { onSkipCrop(); soundManager.playPop(); }}
              className="px-4 py-2 text-japandi-text-muted hover:text-japandi-text text-xs sm:text-sm font-bold rounded-xl hover:bg-japandi-oat transition-colors"
            >
              使用原圖
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { onClose(); soundManager.playPop(); }}
              className="px-4 py-2 text-japandi-text-muted hover:text-japandi-text text-xs sm:text-sm font-bold rounded-xl hover:bg-japandi-oat transition-colors"
            >
              取消
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirmCrop}
            className="btn-pebble flex items-center gap-1.5 px-6 py-2.5 bg-japandi-sage hover:bg-japandi-sage-dark text-white rounded-2xl font-black text-sm shadow-soft transition-all"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>完成裁切 🌿</span>
          </button>
        </div>
      </div>
    </div>
  );
};
