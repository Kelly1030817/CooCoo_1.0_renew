import React, { useState, useEffect } from 'react';

const VoiceInputModal = ({ isOpen, onClose, onVoiceResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsListening(true);
      setTranscript('正在聆聽中... 請說如「買兩盒蛋跟一把空心菜」');
      const timer = setTimeout(() => {
        setIsListening(false);
        setTranscript('「買 1 盒冷藏雞蛋與 2 包有機空心菜」');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onVoiceResult) {
      onVoiceResult([
        { name: '冷藏雞蛋', category: 'protein', qty: 1, unit: '盒', estCost: 80 },
        { name: '有機空心菜', category: 'produce', qty: 2, unit: '包', estCost: 70 }
      ]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fdfae7] border border-[#e07a5f]/30 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#2c221e] text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#be5f48]/20 border border-[#be5f48] flex items-center justify-center text-[#e79d5f]">
              <span className="material-symbols-outlined text-xl">mic</span>
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide">AI 語音智慧輸入</h3>
              <p className="text-xs text-stone-300">說出你想採購的食材與數量</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center space-y-6">
          <div className="flex justify-center items-center h-24">
            {isListening ? (
              <div className="flex items-center gap-2">
                <span className="w-3 h-8 bg-[#be5f48] rounded-full animate-bounce"></span>
                <span className="w-3 h-12 bg-[#e07a5f] rounded-full animate-bounce delay-100"></span>
                <span className="w-3 h-16 bg-[#386753] rounded-full animate-bounce delay-200"></span>
                <span className="w-3 h-10 bg-[#e07a5f] rounded-full animate-bounce delay-150"></span>
                <span className="w-3 h-6 bg-[#be5f48] rounded-full animate-bounce"></span>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#386753]/15 text-[#386753] border-2 border-[#386753] flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">check</span>
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-inner">
            <p className="text-sm font-bold text-[#2c221e]">{transcript}</p>
          </div>

          {!isListening && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsListening(true);
                  setTranscript('正在聆聽中...');
                  setTimeout(() => {
                    setIsListening(false);
                    setTranscript('「買 1 盒冷藏雞蛋與 2 包有機空心菜」');
                  }, 2500);
                }}
                className="flex-1 bg-stone-200 hover:bg-stone-300 text-[#2c221e] font-extrabold py-3 rounded-full text-xs transition-all"
              >
                重說一次
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-[#be5f48] hover:bg-[#9a442d] text-white font-extrabold py-3 rounded-full text-xs shadow-md transition-all active:scale-95"
              >
                確認加入清單
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceInputModal;
