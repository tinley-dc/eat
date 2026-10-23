import React, { useState } from 'react';
import { CategoryItem } from '../types';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Check, 
  Smile,
  GripVertical
} from 'lucide-react';
import { soundManager } from '../utils/sound';
import { resetCategoriesToDefault } from '../utils/categoryStorage';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  onUpdateCategories: (newCategories: CategoryItem[], oldName?: string, newName?: string) => void;
}

const POPULAR_FOOD_EMOJIS = [
  // 麵食、米飯、主食類
  '🍜', '🍱', '🍛', '🍙', '🍚', '🥟', '🍝', '🍣',
  // 鍋物、湯品、熱炒肉類
  '🍲', '🥘', '🥣', '🍳', '🍢', '🥩', '🍗', '🍖',
  // 西式速食、早午餐
  '🍔', '🍕', '🥪', '🌮', '🌯', '🥖', '🥐', '🥞',
  // 甜點冰品、烘焙點心
  '🍰', '🍦', '🍨', '🍧', '🍩', '🍪', '🍮', '🧁',
  // 手搖飲品、咖啡茶飲
  '🧋', '☕', '🍵', '🥤', '🧃', '🍺', '🥛', '🍷',
  // 輕食沙拉、蔬果開胃
  '🥗', '🥑', '🌽', '🍅', '🍎', '🍓', '🍌', '🍉',
  // 聚餐氛圍、宵夜外帶
  '🍽️', '🥢', '🥡', '🍴', '⛺', '🎪', '🏮', '✨'
];

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  categories,
  onUpdateCategories,
}) => {
  // 排除 'all'，僅管理可客製的標籤
  const editableCategories = categories.filter(c => c.id !== 'all');

  // 新增標籤輸入狀態
  const [newIcon, setNewIcon] = useState('🍱');
  const [newName, setNewName] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // 正在編輯的項目 ID
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingIcon, setEditingIcon] = useState('');
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);

  // 拖曳排序狀態
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  // 拖曳開始
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (editingId !== null) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  // 拖曳經過目標
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  // 拖曳放下並重新排序
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    soundManager.playPop();
    const updated = [...editableCategories];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);
    saveAndNotify(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 拖曳結束或離開
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 上移標籤
  const moveUp = (index: number) => {
    if (index <= 0) return;
    soundManager.playPop();
    const updated = [...editableCategories];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    saveAndNotify(updated);
  };

  // 下移標籤
  const moveDown = (index: number) => {
    if (index >= editableCategories.length - 1) return;
    soundManager.playPop();
    const updated = [...editableCategories];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    saveAndNotify(updated);
  };

  // 儲存並通知上層
  const saveAndNotify = (newEditable: CategoryItem[], oldName?: string, newName?: string) => {
    const allItem = categories.find(c => c.id === 'all') || { id: 'all', name: '全部', icon: '🍽️' };
    onUpdateCategories([allItem, ...newEditable], oldName, newName);
  };

  // 新增標籤
  const handleAddCategory = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      alert('請輸入分類名稱喔！');
      return;
    }
    if (editableCategories.some(c => c.name === trimmed)) {
      alert('已經有相同名稱的分類囉！');
      return;
    }
    soundManager.playPop();
    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      icon: newIcon || '🍲'
    };
    saveAndNotify([...editableCategories, newCat]);
    setNewName('');
    setShowEmojiPicker(false);
  };

  // 開始行內編輯
  const startEdit = (cat: CategoryItem) => {
    soundManager.playPop();
    setEditingId(cat.id);
    setEditingName(cat.name);
    setEditingIcon(cat.icon);
  };

  // 儲存行內編輯
  const saveEdit = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      alert('分類名稱不能為空喔！');
      return;
    }
    soundManager.playPop();
    const oldCat = editableCategories.find(c => c.id === id);
    const oldName = oldCat?.name;
    const updated = editableCategories.map(c => 
      c.id === id ? { ...c, name: trimmed, icon: editingIcon || c.icon } : c
    );
    saveAndNotify(updated, oldName, trimmed);
    setEditingId(null);
  };

  // 刪除標籤
  const handleDelete = (id: string, name: string) => {
    if (editableCategories.length <= 1) {
      alert('至少要保留一個分類標籤喔！');
      return;
    }
    if (window.confirm(`確定要刪除「${name}」分類標籤嗎？`)) {
      soundManager.playPop();
      const updated = editableCategories.filter(c => c.id !== id);
      saveAndNotify(updated, name, undefined);
    }
  };

  // 恢復預設
  const handleResetDefault = () => {
    if (window.confirm('確定要將所有分類標籤恢復為系統預設清單與順序嗎？')) {
      soundManager.playPop();
      const def = resetCategoriesToDefault();
      onUpdateCategories(def);
      setEditingId(null);
    }
  };

  const handleClose = () => {
    setEditingId(null);
    setShowEditEmojiPicker(false);
    setShowEmojiPicker(false);
    soundManager.playPop();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#FAF7F2] rounded-[36px] max-w-lg w-full max-h-[92vh] overflow-y-auto no-scrollbar shadow-float border border-[#E5DDD2] flex flex-col relative animate-scaleUp p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 右上角關閉鈕 */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 bg-white/90 hover:bg-white text-japandi-text-muted hover:text-japandi-text p-2 rounded-full transition-transform hover:scale-105 border border-[#EDE6DC] shadow-soft"
          aria-label="關閉"
        >
          <X className="w-5 h-5 stroke-[2]" />
        </button>

        {/* 標題 */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EBF3ED] text-japandi-sage-dark rounded-full font-black text-sm mb-2 border border-[#CDE1D3]">
            <span>🏷️ 自由自訂</span>
          </div>
          <h2 className="text-2xl font-black text-japandi-text tracking-tight">
            標籤分類管理與排序
          </h2>
          <p className="text-sm text-japandi-text-muted mt-1 leading-relaxed">
            調整前後順序、修改名稱或新增專屬標籤，最常吃的排在最前面！
          </p>
        </div>

        {/* 新增分類區塊 */}
        <div className="bg-white rounded-2xl p-4 border border-[#EDE6DC] shadow-soft mb-5">
          <div className="text-sm font-black text-japandi-text mb-2.5 flex items-center justify-between">
            <span>✨ 新增分類標籤</span>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-xs text-japandi-sage-dark hover:underline flex items-center gap-1 font-bold"
            >
              <Smile className="w-3.5 h-3.5" />
              <span>{showEmojiPicker ? '收合圖示盤 ▲' : '挑選圖示 ▼'}</span>
            </button>
          </div>

          {/* Emoji 快捷挑選盤 */}
          {showEmojiPicker && (
            <div className="grid grid-cols-8 gap-2 p-3 bg-japandi-oat/50 rounded-xl mb-3 border border-[#EAE3D8] animate-fadeIn">
              {POPULAR_FOOD_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { setNewIcon(emoji); setShowEmojiPicker(false); soundManager.playPop(); }}
                  className={`text-2xl p-1.5 rounded-lg transition-transform hover:scale-125 ${
                    newIcon === emoji ? 'bg-white shadow-soft ring-2 ring-japandi-sage' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-12 h-11 bg-japandi-oat border border-[#DCD3C6] rounded-xl flex items-center justify-center text-2xl hover:bg-[#EAE4DC] transition-colors shrink-0"
              title="點擊更換 Emoji"
            >
              {newIcon}
            </button>

            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
              placeholder="輸入新分類名稱（例：夜市小吃）"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#DCD3C6] text-sm sm:text-base font-medium focus:border-japandi-sage focus:outline-none bg-white"
            />

            <button
              type="button"
              onClick={handleAddCategory}
              className="btn-pebble flex items-center gap-1 px-4 py-2 bg-japandi-sage hover:bg-japandi-sage-dark text-white rounded-xl font-bold text-sm shadow-soft shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>新增</span>
            </button>
          </div>
        </div>

        {/* 標籤列表與上下排序 */}
        <div className="space-y-2.5 flex-1 mb-5">
          <div className="text-xs font-bold text-japandi-text-muted px-1 flex justify-between items-center">
            <span>目前分類（共 {editableCategories.length} 個）</span>
            <span className="flex items-center gap-1">
              <GripVertical className="w-3.5 h-3.5 inline text-japandi-text-muted" />
              <span>拖曳把手或點 ⬆️ ⬇️ 調整順序</span>
            </span>
          </div>

          <div className="space-y-2 max-h-[38vh] overflow-y-auto no-scrollbar pr-0.5">
            {editableCategories.map((cat, idx) => {
              const isEditing = editingId === cat.id;
              const isDragging = draggedIndex === idx;
              const isDragOver = dragOverIndex === idx && draggedIndex !== idx;

              return (
                <div
                  key={cat.id}
                  draggable={!isEditing}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white rounded-2xl p-3 flex ${
                    isEditing ? 'items-start' : 'items-center'
                  } justify-between gap-2 shadow-soft transition-all select-none ${
                    isDragging
                      ? 'opacity-40 border-2 border-dashed border-japandi-sage scale-[0.98]'
                      : isDragOver
                      ? 'border-2 border-japandi-sage ring-2 ring-japandi-sage/30 bg-[#F4F8F5] -translate-y-0.5'
                      : isEditing
                      ? 'border-2 border-japandi-sage ring-2 ring-japandi-sage/20 bg-[#FAF7F2]'
                      : 'border border-[#EDE6DC] hover:border-[#D5C7B5]'
                  }`}
                >
                  {/* 左側：拖曳把手、排序按鈕與內容 */}
                  <div className={`flex ${isEditing ? 'items-start' : 'items-center'} gap-2 flex-1 min-w-0`}>
                    {/* 拖曳把手圖示 */}
                    <div 
                      className={`p-1 -ml-1 text-gray-400 hover:text-japandi-text rounded transition-colors ${
                        isEditing ? 'cursor-not-allowed opacity-30 mt-2' : 'cursor-grab active:cursor-grabbing'
                      }`}
                      title="按住拖曳調整順序"
                    >
                      <GripVertical className="w-4 h-4 stroke-[2]" />
                    </div>

                    {/* 上下排序按鈕組 */}
                    <div className={`flex flex-col gap-0.5 shrink-0 ${isEditing ? 'mt-1' : ''}`}>
                      <button
                        type="button"
                        disabled={idx === 0 || isEditing}
                        onClick={() => moveUp(idx)}
                        className={`p-1 rounded-md transition-colors ${
                          idx === 0 || isEditing
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-japandi-text hover:bg-japandi-oat hover:text-japandi-sage'
                        }`}
                        title="往上移"
                      >
                        <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === editableCategories.length - 1 || isEditing}
                        onClick={() => moveDown(idx)}
                        className={`p-1 rounded-md transition-colors ${
                          idx === editableCategories.length - 1 || isEditing
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-japandi-text hover:bg-japandi-oat hover:text-japandi-sage'
                        }`}
                        title="往下移"
                      >
                        <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* 圖示與名稱（或行內編輯輸入框） */}
                    {isEditing ? (
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {/* 圖示選單展開按鈕 */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowEditEmojiPicker(!showEditEmojiPicker);
                              soundManager.playPop();
                            }}
                            className={`h-11 px-2.5 rounded-xl border-2 flex items-center gap-1.5 transition-all shadow-soft active:scale-95 shrink-0 ${
                              showEditEmojiPicker 
                                ? 'border-japandi-sage ring-2 ring-japandi-sage/20 bg-japandi-sage-light' 
                                : 'border-[#DCD3C6] hover:border-japandi-sage bg-white hover:bg-japandi-oat'
                            }`}
                            title="點擊展開圖示選單"
                          >
                            <span className="text-2xl">{editingIcon || '🍽️'}</span>
                            <span className="text-xs text-japandi-sage-dark font-black flex items-center gap-0.5">
                              <span>選單</span>
                              <span className="text-[10px]">{showEditEmojiPicker ? '▲' : '▼'}</span>
                            </span>
                          </button>

                          {/* 名稱輸入框 */}
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => { 
                              if (e.key === 'Enter') { 
                                e.preventDefault(); 
                                saveEdit(cat.id); 
                              } else if (e.key === 'Escape') {
                                setEditingId(null);
                                setShowEditEmojiPicker(false);
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-xl border-2 border-japandi-sage text-base font-bold bg-white focus:outline-none shadow-soft"
                            placeholder="輸入分類名稱"
                            autoFocus
                          />
                        </div>

                        {/* 點擊展開的圖示選單 */}
                        {showEditEmojiPicker && (
                          <div className="p-3 bg-white rounded-2xl border border-[#EDE6DC] shadow-soft animate-fadeIn">
                            <div className="flex items-center justify-between mb-2 px-1">
                              <span className="text-xs font-black text-japandi-text-muted flex items-center gap-1">
                                <Smile className="w-3.5 h-3.5 text-japandi-sage-dark" />
                                <span>點選美食圖示替換：</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowEditEmojiPicker(false)}
                                className="text-xs font-bold text-japandi-sage-dark hover:underline"
                              >
                                收合選單 ▲
                              </button>
                            </div>

                            <div className="grid grid-cols-8 gap-1.5 sm:gap-2 max-h-36 overflow-y-auto no-scrollbar p-1.5 bg-[#FAF7F2] rounded-xl border border-[#EDE6DC]">
                              {POPULAR_FOOD_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    setEditingIcon(emoji);
                                    setShowEditEmojiPicker(false);
                                    soundManager.playPop();
                                  }}
                                  className={`text-2xl p-1 rounded-lg transition-transform hover:scale-125 flex items-center justify-center ${
                                    editingIcon === emoji 
                                      ? 'bg-white shadow-soft ring-2 ring-japandi-sage scale-110' 
                                      : 'hover:bg-white/80'
                                  }`}
                                  title={`選擇 ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>

                            <div className="mt-2 pt-2 border-t border-[#EDE6DC] flex items-center justify-between text-xs text-japandi-text-muted">
                              <span>或輸入自訂 Emoji：</span>
                              <input
                                type="text"
                                value={editingIcon}
                                onChange={(e) => setEditingIcon(e.target.value)}
                                placeholder="自訂"
                                className="w-14 text-center py-0.5 px-1 bg-[#FAF7F2] border border-[#DCD3C6] rounded-md text-base font-bold"
                                maxLength={4}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-2xl shrink-0">{cat.icon}</span>
                        <span className="font-extrabold text-japandi-text text-base truncate">
                          {cat.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 右側：操作按鈕群 */}
                  <div className={`flex items-center gap-1.5 shrink-0 ${isEditing ? 'self-start mt-1' : ''}`}>
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(cat.id)}
                          className="btn-pebble flex items-center gap-1 px-3 py-2 text-white bg-japandi-sage hover:bg-japandi-sage-dark rounded-xl transition-all shadow-soft text-xs sm:text-sm font-black"
                          title="確認儲存"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>儲存</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingId(null); setShowEditEmojiPicker(false); }}
                          className="p-2 text-japandi-text-muted hover:bg-japandi-oat rounded-xl transition-all"
                          title="取消"
                        >
                          <X className="w-4 h-4 stroke-[2]" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="p-2 text-japandi-text-muted hover:text-japandi-text hover:bg-japandi-oat rounded-xl transition-all"
                          title="修改名稱與圖示"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-2 text-[#C06050] hover:bg-[#FDF2F0] rounded-xl transition-all"
                          title="刪除分類"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部功能與關閉按鈕 */}
        <div className="pt-3 border-t border-[#EDE6DC] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="btn-pebble flex items-center gap-1.5 px-3.5 py-2 text-japandi-text-muted hover:text-japandi-text font-bold text-sm rounded-xl hover:bg-japandi-oat transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>恢復預設分類</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="btn-pebble px-6 py-2.5 bg-japandi-sage hover:bg-japandi-sage-dark text-white font-black text-sm rounded-2xl shadow-soft"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
