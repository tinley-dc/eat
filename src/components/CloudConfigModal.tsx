import React, { useState } from 'react';
import { CloudConfig } from '../types';
import { 
  X, 
  Cloud, 
  Copy, 
  Check, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Smartphone
} from 'lucide-react';
import { testConnection, saveCloudConfig } from '../services/cloudSync';
import { syncWithCloud } from '../db';
import { soundManager } from '../utils/sound';

interface CloudConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CloudConfig;
  onConfigUpdated: (config: CloudConfig) => void;
  onDataSynced: () => void;
}

export const CloudConfigModal: React.FC<CloudConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
  onDataSynced,
}) => {
  const [scriptUrl, setScriptUrl] = useState(config.scriptUrl || '');
  const [autoSync, setAutoSync] = useState(config.autoSync || false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [showTutorial, setShowTutorial] = useState(!config.scriptUrl);

  if (!isOpen) return null;

  const handleCopyShareLink = async () => {
    if (!scriptUrl.trim()) {
      alert('請先輸入 Google Apps Script 網址！');
      return;
    }
    soundManager.playPop();
    const shareUrl = `${window.location.origin}${window.location.pathname}?sync=${encodeURIComponent(scriptUrl.trim())}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 3000);
    } catch {
      prompt('請複製以下連結並傳至手機開啟：', shareUrl);
    }
  };

  const handleCopyScript = async () => {
    soundManager.playPop();
    try {
      const res = await fetch('/google-apps-script.js');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      alert('複製失敗，請直接在專案根目錄開啟 google-apps-script.js 複製程式碼');
    }
  };

  const handleTest = async () => {
    if (!scriptUrl.trim()) {
      setTestResult({ success: false, message: '請先貼上 Google Apps Script 發布網址！' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    soundManager.playPop();
    try {
      const result = await testConnection(scriptUrl.trim());
      setTestResult(result);
      if (result.success) {
        soundManager.playVictory();
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncNow = async () => {
    if (!scriptUrl.trim()) {
      alert('請先填寫並測試 Google 試算表網址！');
      return;
    }

    const newConfig: CloudConfig = {
      scriptUrl: scriptUrl.trim(),
      autoSync: autoSync,
      lastSyncedAt: Date.now()
    };
    saveCloudConfig(newConfig);
    onConfigUpdated(newConfig);

    setIsSyncing(true);
    setSyncResult(null);
    soundManager.playPop();
    try {
      const res = await syncWithCloud();
      setSyncResult(res.message);
      soundManager.playVictory();
      onDataSynced();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setSyncResult(`同步失敗：${errorMsg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveConfig = () => {
    const newConfig: CloudConfig = {
      scriptUrl: scriptUrl.trim(),
      autoSync: autoSync,
      lastSyncedAt: config.lastSyncedAt
    };
    saveCloudConfig(newConfig);
    onConfigUpdated(newConfig);
    soundManager.playPop();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#FAF7F2] rounded-[36px] max-w-xl w-full max-h-[92vh] overflow-y-auto no-scrollbar shadow-float border border-[#E5DDD2] flex flex-col relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部標題 */}
        <div className="bg-japandi-sage text-white p-5 flex items-center justify-between rounded-t-[36px]">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            <h2 className="text-xl font-black">Google 試算表與雲端硬碟同步</h2>
          </div>
          <button
            onClick={() => { onClose(); soundManager.playPop(); }}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-japandi-text">
          <div className="bg-[#EBF3ED] border border-[#CDE1D3] rounded-2xl p-4 text-sm sm:text-base text-japandi-sage-dark leading-relaxed">
            <p className="font-bold mb-1">💡 為什麼要串接 Google 試算表？</p>
            <p>
              爸爸媽媽的手機、平板與電腦隨時即時同步！照片會直接儲存在您的 Google 雲端硬碟，即使更換手機或清除快取，名單永遠安全存在您的 Google 帳號中。
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => { setShowTutorial(!showTutorial); soundManager.playPop(); }}
              className="flex items-center justify-between w-full p-3.5 bg-white hover:bg-japandi-oat border border-[#EDE6DC] rounded-2xl text-sm sm:text-base font-bold text-japandi-text transition-colors shadow-soft"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-japandi-sage" />
                <span>只要 3 步驟！如何取得 Google 試算表網址？</span>
              </span>
              <span className="text-japandi-text-muted">{showTutorial ? '收合 ▲' : '展開觀看 ▼'}</span>
            </button>

            {showTutorial && (
              <div className="mt-3 p-4 bg-white border border-[#EDE6DC] rounded-2xl space-y-3.5 text-sm leading-relaxed animate-fadeIn shadow-soft">
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-japandi-sage text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                  <div>
                    <span className="font-bold text-japandi-text">在 Google 雲端硬碟新建一個試算表</span>
                    <p className="text-japandi-text-muted mt-0.5">命名為「今天吃什麼名單」，點擊上方選單【擴充功能】➔【Apps Script】。</p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-japandi-sage text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                  <div className="flex-1">
                    <span className="font-bold text-japandi-text">複製並貼上後端腳本</span>
                    <p className="text-japandi-text-muted mb-2 mt-0.5">點擊下方按鈕複製腳本，貼上覆蓋 Apps Script 編輯器內所有內容並儲存。</p>
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="btn-pebble flex items-center gap-1.5 px-3.5 py-2 bg-japandi-text hover:bg-black text-white rounded-xl font-bold text-sm shadow-soft"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-japandi-sage" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCode ? '已複製到剪貼簿！' : '一鍵複製 Apps Script 完整程式碼 📋'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-japandi-sage text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                  <div>
                    <span className="font-bold text-japandi-text">發布為網頁應用程式 (Web App)</span>
                    <p className="text-japandi-text-muted mt-0.5">
                      點擊右上角【部署】➔【新增部署】➔ 選擇【網頁應用程式】➔ 存取權限選【任何人 (Anyone)】➔ 複製產生的網址貼在下方。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm sm:text-base font-black text-japandi-text">
              Google Apps Script 網頁應用程式網址 (Web App URL)
            </label>
            <input
              type="url"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-4 py-2.5 rounded-xl border border-[#DCD3C6] focus:border-japandi-sage focus:outline-none text-sm sm:text-base font-mono placeholder-japandi-text-muted bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTest}
              className="btn-pebble px-4 py-2.5 bg-white hover:bg-japandi-oat text-japandi-text font-bold text-sm rounded-xl border border-[#DCD3C6] transition-all"
            >
              {isTesting ? '測試中...' : '🔍 測試連線'}
            </button>

            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncNow}
              className="btn-pebble flex items-center gap-2 px-4 py-2.5 bg-japandi-sage hover:bg-japandi-sage-dark text-white font-bold text-sm rounded-xl shadow-soft transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '同步中...' : '立即雙向同步'}</span>
            </button>
          </div>

          <p className="text-xs text-japandi-text-muted leading-relaxed">
            💡 <b>何時需要點「立即雙向同步」？</b> 平常新增店家只要開啟下方的「背景自動同步」，系統就會<b>自動存進試算表</b>！只有在更換手機/電腦，想立即下載雲端上的最新名單時，才需要點此按鈕。
          </p>

          <div className="p-4 bg-[#F2F7F4] border border-[#CDE1D3] rounded-2xl space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-japandi-sage-dark shrink-0" />
                <span className="font-bold text-sm text-japandi-text">換新手機或家人使用？</span>
              </div>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="btn-pebble flex items-center gap-1.5 px-3 py-1.5 bg-japandi-sage hover:bg-japandi-sage-dark text-white rounded-xl font-bold text-xs shadow-soft transition-all shrink-0"
              >
                {copiedShareLink ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedShareLink ? '已複製專屬連結！' : '📱 複製手機直達同步連結'}</span>
              </button>
            </div>
            <p className="text-xs text-japandi-text-muted leading-relaxed">
              {scriptUrl.trim() 
                ? '點擊複製後，用 LINE 或 AirDrop 傳給手機點開，手機就會自動綁定並下載所有店家，免手動貼網址！' 
                : '💡 先在上方貼上 Google 試算表網址後，點此按鈕即可產生專屬連結，用 LINE 傳給新手機一鍵完成同步！'}
            </p>
          </div>

          {testResult && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-sm font-bold ${
              testResult.success
                ? 'bg-[#EBF3ED] text-japandi-sage-dark border-[#CDE1D3]'
                : 'bg-[#FCF2F0] text-japandi-terracotta-dark border-[#F2D1CB]'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-5 h-5 text-japandi-sage shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-japandi-terracotta shrink-0 mt-0.5" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {syncResult && (
            <div className="p-3.5 bg-white border border-[#EDE6DC] text-japandi-text rounded-xl text-sm font-bold shadow-soft">
              {syncResult}
            </div>
          )}

          <div className="p-4 bg-white rounded-2xl border border-[#EDE6DC] space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-japandi-text">⚡ 背景自動同步</span>
                  <span className="text-[11px] bg-[#EBF3ED] text-japandi-sage-dark font-bold px-2 py-0.5 rounded-full">強烈推薦</span>
                </div>
                <span className="text-xs sm:text-sm text-japandi-text-muted block mt-0.5">
                  每次新增、修改或刪除店家後，系統會自動在背景存回 Google 試算表
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-5 h-5 accent-japandi-sage rounded cursor-pointer shrink-0 ml-3"
              />
            </div>
            {autoSync && (
              <div className="text-xs text-japandi-sage-dark bg-[#EBF3ED] p-2.5 rounded-xl font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>已啟用自動同步：每次新增店家都會自動更新試算表，無需手動去按同步！</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#EDE6DC] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => { onClose(); soundManager.playPop(); }}
              className="px-4 py-2 rounded-xl text-sm font-bold text-japandi-text-muted hover:bg-japandi-oat"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              className="btn-pebble px-5 py-2 bg-japandi-sage hover:bg-japandi-sage-dark text-white font-black text-sm rounded-xl shadow-soft"
            >
              儲存設定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
