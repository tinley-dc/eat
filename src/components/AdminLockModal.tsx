import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';
import { soundManager } from '../utils/sound';

interface AdminLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

export const AdminLockModal: React.FC<AdminLockModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
}) => {
  const [num1, setNum1] = useState(7);
  const [num2, setNum2] = useState(8);
  const [answer, setAnswer] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 每次開啟時生成新的隨機九九乘法驗證題
  useEffect(() => {
    if (isOpen) {
      const a = Math.floor(Math.random() * 6) + 4; // 4 ~ 9
      const b = Math.floor(Math.random() * 6) + 4; // 4 ~ 9
      setNum1(a);
      setNum2(b);
      setAnswer('');
      setErrorMessage('');
      setHoldProgress(0);
      setIsHolding(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 長按 2 秒計時器
  useEffect(() => {
    if (isHolding) {
      const stepMs = 25;
      const totalMs = 1800; // 1.8 秒
      const increment = (stepMs / totalMs) * 100;

      holdTimerRef.current = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev + increment >= 100) {
            clearInterval(holdTimerRef.current!);
            handleSuccess();
            return 100;
          }
          return prev + increment;
        });
      }, stepMs);
    } else {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      setHoldProgress(0);
    }

    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, [isHolding]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    soundManager.playVictory();
    onUnlock();
    onClose();
  };

  const handleSubmitMath = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(answer.trim(), 10);
    if (parsed === num1 * num2) {
      handleSuccess();
    } else {
      soundManager.playPop();
      setErrorMessage('答案不正確喔！請重新計算，或直接使用下方的長按解鎖。');
      setAnswer('');
      inputRef.current?.focus();
    }
  };

  const handleStartHold = () => {
    setIsHolding(true);
    soundManager.playPop();
  };

  const handleEndHold = () => {
    setIsHolding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#FAF7F2] rounded-[36px] max-w-md w-full shadow-float border border-[#E5DDD2] p-6 relative animate-scaleUp text-japandi-text"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { onClose(); soundManager.playPop(); }}
          className="absolute top-5 right-5 p-1.5 text-japandi-text-muted hover:text-japandi-text rounded-full hover:bg-japandi-oat transition-colors"
        >
          <X className="w-5 h-5 stroke-[2]" />
        </button>

        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#FCF2E9] text-japandi-apricot-dark border border-[#F6DEC9] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-japandi-apricot" />
          </div>
          <div>
            <h2 className="text-xl font-black text-japandi-text">家長管理模式解鎖</h2>
            <span className="text-xs text-japandi-text-muted block">避免小朋友誤觸新增、刪除或修改</span>
          </div>
        </div>

        <p className="text-sm text-japandi-text-muted mb-5 leading-relaxed bg-white/70 p-3.5 rounded-2xl border border-[#EDE6DC]">
          👶 <b>小寶貝安全瀏覽中</b>：目前僅開放翻看手帳、餐點照片、推薦心得與抽籤挑選。請家長透過以下方式驗證以解鎖完整管理功能。
        </p>

        {/* 驗證方式 1：家長乘法快問快答 */}
        <form onSubmit={handleSubmitMath} className="space-y-3 mb-5">
          <div className="p-4 bg-white rounded-2xl border border-[#EDE6DC] shadow-soft">
            <label className="block text-xs font-bold text-japandi-text-muted mb-2">
              方式一：請家長回答算式（小朋友解不開，大人一秒答）
            </label>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-mono text-xl sm:text-2xl font-black text-japandi-text bg-[#FAF7F2] px-3.5 py-2 rounded-xl border border-[#E5DDD2]">
                <span>{num1}</span>
                <span className="text-japandi-apricot">×</span>
                <span>{num2}</span>
                <span>=</span>
              </div>

              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="請輸入答案"
                className="w-28 sm:w-32 px-3 py-2 text-center text-lg sm:text-xl font-black rounded-xl border-2 border-[#DCD3C6] focus:border-japandi-sage focus:outline-none bg-white"
              />

              <button
                type="submit"
                className="btn-pebble px-4 py-2 bg-japandi-sage hover:bg-japandi-sage-dark text-white rounded-xl font-black text-sm shrink-0 shadow-soft"
              >
                解鎖
              </button>
            </div>

            {errorMessage && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-japandi-terracotta-dark font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </form>

        {/* 驗證方式 2：長按 2 秒解鎖 */}
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-2xl border border-[#EDE6DC] bg-white shadow-soft">
            <button
              type="button"
              onMouseDown={handleStartHold}
              onMouseUp={handleEndHold}
              onMouseLeave={handleEndHold}
              onTouchStart={handleStartHold}
              onTouchEnd={handleEndHold}
              className="w-full py-3.5 px-4 flex items-center justify-center gap-2 font-bold text-sm text-japandi-text select-none cursor-pointer active:scale-[0.99] transition-all relative z-10"
            >
              <Lock className={`w-4 h-4 transition-transform ${isHolding ? 'scale-110 text-japandi-sage' : 'text-japandi-text-muted'}`} />
              <span>
                {isHolding 
                  ? `持續按住中... ${Math.round(holdProgress)}%` 
                  : '方式二：按住此處不放 2 秒快速解鎖 👉'}
              </span>
            </button>

            {/* 長按進度條填滿背景 */}
            <div 
              className="absolute left-0 top-0 bottom-0 bg-[#E1EFE4] transition-all duration-75 pointer-events-none"
              style={{ width: `${holdProgress}%` }}
            />
          </div>
          <span className="text-[11px] text-japandi-text-muted text-center block">
            小朋友通常只會快點，大人只要長按 2 秒就能自動放行
          </span>
        </div>
      </div>
    </div>
  );
};
