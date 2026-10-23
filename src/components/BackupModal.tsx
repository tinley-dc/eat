import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Database, 
  Check, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { exportBackupJson, importBackupJson, restoreRecoveredPhotos } from '../db';
import { soundManager } from '../utils/sound';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [msg, setMsg] = useState<{ text: string; success: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    soundManager.playPop();
    try {
      const json = await exportBackupJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wanna_eat_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg({ text: '備份檔案已成功下載！', success: true });
      soundManager.playVictory();
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setMsg({ text: `匯出失敗：${errorMsg}`, success: false });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundManager.playPop();
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const count = await importBackupJson(text);
        setMsg({ text: `匯入成功！已還原 ${count} 間店家資料`, success: true });
        soundManager.playVictory();
        onDataChanged();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setMsg({ text: `匯入失敗：${errorMsg}`, success: false });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleRestorePhotos = async () => {
    soundManager.playPop();
    try {
      const count = await restoreRecoveredPhotos();
      soundManager.playVictory();
      setMsg({ 
        text: count > 0 ? `已成功搶救補回 ${count} 間店家的照片！` : '目前所有自建店家照片均已完整存在，無需修復。', 
        success: true 
      });
      onDataChanged();
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setMsg({ text: `照片修復失敗：${errorMsg}`, success: false });
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
          className="absolute top-5 right-5 p-1.5 text-japandi-text-muted hover:text-japandi-text rounded-full hover:bg-japandi-oat"
        >
          <X className="w-5 h-5 stroke-[2]" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <Database className="w-5 h-5 text-japandi-sage" />
          <h2 className="text-xl font-black">資料備份與還原</h2>
        </div>

        <p className="text-sm text-japandi-text-muted mb-5 leading-relaxed">
          您可以隨時將所有店家清單、照片與踩雷紀錄下載為檔案保存，或在其他手機／電腦上直接匯入。
        </p>

        {msg && (
          <div className={`p-3.5 rounded-2xl mb-4 text-sm font-bold flex items-center gap-2 ${
            msg.success ? 'bg-[#EBF3ED] text-japandi-sage-dark border border-[#CDE1D3]' : 'bg-[#FCF2F0] text-japandi-terracotta-dark border border-[#F2D1CB]'
          }`}>
            {msg.success ? <Check className="w-4 h-4 text-japandi-sage" /> : <AlertTriangle className="w-4 h-4 text-japandi-terracotta" />}
            <span>{msg.text}</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleRestorePhotos}
            className="btn-pebble w-full flex items-center justify-between p-3.5 bg-[#FAF3EC] hover:bg-[#F3E7DC] border border-[#E8D9CB] rounded-2xl text-japandi-terracotta-dark font-bold text-sm transition-all shadow-soft"
          >
            <span className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-japandi-terracotta" />
              <span>一鍵搶救還原遺失照片</span>
            </span>
            <span className="text-sm text-white bg-japandi-terracotta px-3 py-0.5 rounded-lg font-bold">還原</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="btn-pebble w-full flex items-center justify-between p-3.5 bg-white hover:bg-japandi-oat border border-[#EDE6DC] rounded-2xl text-japandi-text font-bold text-sm transition-all shadow-soft"
          >
            <span className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-japandi-sage" />
              <span>匯出備份檔案 (JSON)</span>
            </span>
            <span className="text-sm text-japandi-sage-dark bg-[#EBF3ED] px-3 py-0.5 rounded-lg font-bold">下載</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-pebble w-full flex items-center justify-between p-3.5 bg-white hover:bg-japandi-oat border border-[#EDE6DC] rounded-2xl text-japandi-text font-bold text-sm transition-all shadow-soft"
          >
            <span className="flex items-center gap-2.5">
              <Upload className="w-4 h-4 text-japandi-apricot" />
              <span>匯入還原備份檔案</span>
            </span>
            <span className="text-sm text-japandi-apricot-dark bg-[#FDF4ED] px-3 py-0.5 rounded-lg font-bold">讀取</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>
    </div>
  );
};
