import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import { soundManager } from '../utils/sound';
import { 
  hasPasswordConfigured, 
  verifyPassword, 
  setupPassword, 
  setDeviceRemembered
} from '../utils/securityStorage';
import { triggerAutoSync } from '../db';

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
  const [mode, setMode] = useState<'unlock' | 'setup' | 'change'>('unlock');
  
  // 密碼輸入狀態
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // 每次開啟時檢查是否已設定過密碼
  useEffect(() => {
    if (isOpen) {
      const isConfigured = hasPasswordConfigured();
      setMode(isConfigured ? 'unlock' : 'setup');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setShowPassword(false);
      setRememberMe(true);
      setErrorMessage('');
      setSuccessMessage('');
      setIsSubmitting(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 處理解鎖驗證
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('請輸入管理密碼');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const isValid = await verifyPassword(password);
      if (isValid) {
        soundManager.playVictory();
        setDeviceRemembered(rememberMe);
        onUnlock();
        onClose();
      } else {
        soundManager.playPop();
        setErrorMessage('密碼不正確，請重新輸入');
        setPassword('');
        inputRef.current?.focus();
      }
    } catch (err) {
      setErrorMessage('驗證過程發生錯誤，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 處理初次設定密碼
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setErrorMessage('請輸入欲設定的管理密碼');
      return;
    }
    if (newPassword.trim().length < 4) {
      setErrorMessage('為確保安全，密碼長度至少需 4 碼');
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMessage('兩次輸入的密碼不一致，請再次確認');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await setupPassword(newPassword.trim());
      // 觸發雲端自動備份，將加密後雜湊同步至 Google 試算表
      triggerAutoSync();
      soundManager.playVictory();
      setDeviceRemembered(rememberMe);
      onUnlock();
      onClose();
    } catch (err) {
      setErrorMessage('儲存密碼失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 處理變更密碼
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      setErrorMessage('請輸入目前舊密碼');
      return;
    }
    if (!newPassword.trim()) {
      setErrorMessage('請輸入新密碼');
      return;
    }
    if (newPassword.trim().length < 4) {
      setErrorMessage('新密碼長度至少需 4 碼');
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMessage('兩次輸入的新密碼不一致');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const isCurrentValid = await verifyPassword(currentPassword);
      if (!isCurrentValid) {
        soundManager.playPop();
        setErrorMessage('目前的舊密碼輸入錯誤');
        return;
      }

      await setupPassword(newPassword.trim());
      triggerAutoSync();
      soundManager.playVictory();
      setSuccessMessage('密碼修改成功！');
      setTimeout(() => {
        setMode('unlock');
        setSuccessMessage('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1200);
    } catch (err) {
      setErrorMessage('變更密碼失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
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
          aria-label="關閉"
        >
          <X className="w-5 h-5 stroke-[2]" />
        </button>

        {/* 標題區域 */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#FCF2E9] text-japandi-apricot-dark border border-[#F6DEC9] flex items-center justify-center">
            {mode === 'setup' ? (
              <KeyRound className="w-5 h-5 text-japandi-apricot" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-japandi-apricot" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-japandi-text">
              {mode === 'setup' && '建立專屬管理密碼'}
              {mode === 'unlock' && '管理員密碼驗證'}
              {mode === 'change' && '修改專屬管理密碼'}
            </h2>
            <span className="text-xs text-japandi-text-muted block">
              {mode === 'setup' && '設定只有您知道的密碼，保護店家不被外人改動'}
              {mode === 'unlock' && '輸入管理密碼即可新增、編輯或管理店家'}
              {mode === 'change' && '更新您的管理密碼並自動同步至雲端'}
            </span>
          </div>
        </div>

        {/* 模式 1：密碼解鎖 */}
        {mode === 'unlock' && (
          <form onSubmit={handleUnlock} className="space-y-4 mt-4">
            <div className="p-4 bg-white rounded-2xl border border-[#EDE6DC] shadow-soft space-y-3">
              <label className="block text-xs font-bold text-japandi-text-muted">
                請輸入管理密碼（或 PIN 碼）
              </label>

              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入密碼"
                  className="w-full pl-3.5 pr-10 py-3 text-base sm:text-lg font-black rounded-xl border-2 border-[#DCD3C6] focus:border-japandi-sage focus:outline-none bg-white tracking-widest"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                  aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* 在這台裝置記住我 */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-japandi-sage focus:ring-japandi-sage accent-japandi-sage cursor-pointer"
                />
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-japandi-sage" />
                  在這台裝置記住我（下次開啟免輸入）
                </span>
              </label>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-japandi-terracotta-dark font-bold px-1 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-pebble flex-1 py-3 bg-japandi-sage hover:bg-japandi-sage-dark text-white rounded-xl font-black text-sm shadow-soft flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>{isSubmitting ? '驗證中...' : '驗證解鎖'}</span>
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode('change'); setErrorMessage(''); }}
                className="text-xs text-japandi-text-muted hover:text-japandi-text underline transition-colors"
              >
                想要修改管理密碼？
              </button>
            </div>
          </form>
        )}

        {/* 模式 2：初次設定密碼 */}
        {mode === 'setup' && (
          <form onSubmit={handleSetup} className="space-y-4 mt-4">
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed font-medium">
              💡 這是第一次開啟管理模式，請為自己設定一組<b>專屬管理密碼</b>（例如 4 位數 PIN 碼）。密碼會加密備份至您的 Google 試算表，<b>GitHub 原始碼完全看不到</b>！
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#EDE6DC] shadow-soft space-y-3">
              <div>
                <label className="block text-xs font-bold text-japandi-text-muted mb-1.5">
                  設定新密碼（至少 4 碼）
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="請輸入新密碼"
                    className="w-full pl-3.5 pr-10 py-2.5 text-base font-black rounded-xl border-2 border-[#DCD3C6] focus:border-japandi-sage focus:outline-none bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-japandi-text-muted mb-1.5">
                  再次確認新密碼
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="請再次輸入相同密碼"
                  className="w-full px-3.5 py-2.5 text-base font-black rounded-xl border-2 border-[#DCD3C6] focus:border-japandi-sage focus:outline-none bg-white"
                />
              </div>

              {/* 在這台裝置記住我 */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-japandi-sage focus:ring-japandi-sage accent-japandi-sage cursor-pointer"
                />
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-japandi-sage" />
                  在這台裝置記住我（推薦）
                </span>
              </label>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-japandi-terracotta-dark font-bold px-1 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-pebble w-full py-3 bg-japandi-sage hover:bg-japandi-sage-dark text-white rounded-xl font-black text-sm shadow-soft flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? '儲存中...' : '儲存密碼並進入管理'}</span>
            </button>
          </form>
        )}

        {/* 模式 3：修改密碼 */}
        {mode === 'change' && (
          <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
            <div className="p-4 bg-white rounded-2xl border border-[#EDE6DC] shadow-soft space-y-3">
              <div>
                <label className="block text-xs font-bold text-japandi-text-muted mb-1.5">
                  目前舊密碼
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="請輸入目前密碼"
                  className="w-full px-3.5 py-2.5 text-base font-black rounded-xl border-2 border-[#DCD3C6] focus:border-japandi-sage focus:outline-none bg-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-japandi-text-muted mb-1.5">
                  設定新密碼（至少 4 碼）
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="請輸入新密碼"
                  className="w-full px-3.5 py-2.5 text-base font-black rounded-xl border-2 border-[#DCD3C6] focus:border-japandi-sage focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-japandi-text-muted mb-1.5">
                  再次確認新密碼
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="請再次輸入新密碼"
                  className="w-full px-3.5 py-2.5 text-base font-black rounded-xl border-2 border-[#DCD3C6] focus:border-japandi-sage focus:outline-none bg-white"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-japandi-terracotta-dark font-bold px-1 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold px-1 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setMode('unlock'); setErrorMessage(''); }}
                className="flex-1 py-2.5 border border-[#DCD3C6] text-stone-600 hover:bg-stone-50 rounded-xl font-bold text-sm transition-colors"
              >
                返回
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-pebble flex-1 py-2.5 bg-japandi-sage hover:bg-japandi-sage-dark text-white rounded-xl font-black text-sm shadow-soft transition-transform active:scale-95"
              >
                {isSubmitting ? '更新中...' : '確認更新'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
