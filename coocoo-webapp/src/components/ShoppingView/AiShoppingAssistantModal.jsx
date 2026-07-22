import React, { useState } from 'react';

const AiShoppingAssistantModal = ({ isOpen, onClose, onAddShoppingItem }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: '你好！我是你的 AI 陪我逛市場主廚 👨‍🍳🛒。你可以拍照上傳市場特價食材，我會為你自動辨識，並推薦美味料理、告訴你怎麼煮與該怎麼買！'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result);
      processPhotoAi(reader.result, file.name);
    };
    reader.readAsDataURL(file);
  };

  const processPhotoAi = (imageData, filename) => {
    setLoading(true);
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: '📷 [照片上傳] 分析食材中...', image: imageData }
    ]);

    setTimeout(() => {
      const mockRecognitions = [
        {
          ingredient: '牛番茄 ＆ 鮮干貝',
          recipe: '主廚推薦【番茄干貝佐九層塔】',
          howToCook: '【滲透壓與熱平衡】：番茄下鍋先以微鹽排汁定味；干貝大火快速雙面煎 40 秒鎖住組織液，關火利用餘熱燜熟。',
          howToBuy: '冰箱現有番茄；建議補買：鮮干貝 (1盒) ＆ 蒜片。',
          itemToAdd: { name: '鮮干貝 (盒)', category: 'protein', estCost: 160 }
        },
        {
          ingredient: '有機青花菜 ＆ 履歷雞胸肉',
          recipe: '主廚推薦【蒜香清炒雞丁青花菜】',
          howToCook: '【澱粉醃製與大火翻炒】：雞肉切丁過太白粉薄漿，強火滾水川燙青花菜 30 秒後，一鍋到底翻炒出鍋。',
          howToBuy: '建議補買：有機青花菜 (1朵) ＆ 蒜頭 (1袋)。',
          itemToAdd: { name: '有機青花菜 (朵)', category: 'produce', estCost: 45 }
        }
      ];

      const picked = mockRecognitions[Math.floor(Math.random() * mockRecognitions.length)];

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `👨‍🍳 主廚完成照片辨識！成果為【${picked.ingredient}】！\n\n✨ **${picked.recipe}**\n\n🍳 **怎麼料理**：${picked.howToCook}\n\n🛒 **該怎麼買**：${picked.howToBuy}`,
          itemRecommendation: picked.itemToAdd
        }
      ]);
      setPreviewImage(null);
      setLoading(false);
    }, 1200);
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userText = inputValue;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputValue('');
    setLoading(true);

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `👨‍🍳 主廚建議：針對「${userText}」，可以搭配一把當季綠色蔬菜與蛋品，極簡料理又省預算！\n\n🍳 **怎麼料理**：熱鍋少油，快速滾水川燙保持鮮翠口感。\n🛒 **該怎麼買**：採買一把空心菜與一盒土雞蛋即可！`,
          itemRecommendation: { name: '當季蔬菜 (包)', category: 'produce', estCost: 35 }
        }
      ]);
      setLoading(false);
    }, 600);
  };

  const handlePickSuggestion = (item) => {
    onAddShoppingItem(item);
    setMessages(prev => [
      ...prev,
      { sender: 'ai', text: `已為您將「${item.name}」加入補貨清單！` }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fdfae7] border border-[#e07a5f]/30 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#2c221e] text-white p-4 sm:p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#be5f48] flex items-center justify-center text-white shadow-inner">
              <span className="material-symbols-outlined text-xl">forum</span>
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide">AI 陪我逛市場助手 🛒</h3>
              <p className="text-xs text-stone-300">主廚陪你拍照辨識食材 ‧ 推薦料理與採買</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Chat Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-sm">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-[#be5f48] text-white rounded-br-none shadow-sm font-medium'
                    : 'bg-white text-[#2c221e] border border-stone-300/50 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.image && (
                  <img src={msg.image} alt="拍攝食材" className="w-48 h-36 object-cover rounded-xl mb-2 border border-white/30" />
                )}
                <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                {msg.itemRecommendation && (
                  <button
                    onClick={() => handlePickSuggestion(msg.itemRecommendation)}
                    className="mt-3 bg-[#e07a5f]/15 hover:bg-[#e07a5f]/25 border border-[#be5f48]/40 text-[#be5f48] px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                    將「{msg.itemRecommendation.name}」加入補貨清單 (NT$ {msg.itemRecommendation.estCost})
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#be5f48] font-bold animate-pulse bg-white p-3 rounded-2xl border border-stone-200 w-fit">
              <span className="material-symbols-outlined text-base animate-spin">sync</span>
              AI 主廚正在辨識食材與構思推薦菜色...
            </div>
          )}
        </div>

        {/* Photo Preview Strip */}
        {previewImage && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={previewImage} alt="預覽" className="w-10 h-10 rounded-lg object-cover" />
              <span className="text-xs font-bold text-amber-800">照片準備上傳中...</span>
            </div>
          </div>
        )}

        {/* Input Bar with Camera Button */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-[#ece9d6] border-t border-stone-300 flex items-center gap-2">
          <label className="w-10 h-10 rounded-full bg-white border border-stone-300 hover:bg-stone-100 cursor-pointer flex items-center justify-center text-[#be5f48] transition-all shadow-sm shrink-0" title="拍照或上傳特價品食材照片">
            <span className="material-symbols-outlined text-xl">add_a_photo</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </label>

          <input
            type="text"
            placeholder="輸入想買的菜，或點左側📷拍照..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-full bg-white border border-stone-300 text-sm focus:outline-none focus:border-[#be5f48]"
          />

          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="w-10 h-10 rounded-full bg-[#be5f48] hover:bg-[#9a442d] disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiShoppingAssistantModal;
