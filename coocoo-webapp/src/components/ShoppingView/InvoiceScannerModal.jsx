import React, { useState } from 'react';

const InvoiceScannerModal = ({ isOpen, onClose, onScanComplete }) => {
  const [scanning, setScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState(null);

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScannedItems([
        { name: '有機履歷高麗菜', category: 'produce', qty: 1, unit: '顆', estCost: 45 },
        { name: '冷藏鮮乳 (大)', category: 'protein', qty: 1, unit: '瓶', estCost: 92 },
        { name: '嚴選雪花牛肉片', category: 'protein', qty: 2, unit: '盒', estCost: 180 }
      ]);
    }, 1500);
  };

  const handleConfirmAdd = () => {
    if (scannedItems && onScanComplete) {
      onScanComplete(scannedItems);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fdfae7] border border-[#e07a5f]/30 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#2c221e] text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#be5f48]/20 border border-[#be5f48] flex items-center justify-center text-[#e79d5f]">
              <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide">掃描發票/收據辨識</h3>
              <p className="text-xs text-stone-300">智慧自動解析食材消費明細</p>
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
        <div className="p-6 space-y-5">
          {!scannedItems ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#be5f48]/40 rounded-2xl p-8 bg-[#f1eedb]/60 text-center relative overflow-hidden">
              {scanning ? (
                <div className="space-y-4 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-4 border-[#be5f48] border-t-transparent animate-spin flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-[#be5f48]">search</span>
                  </div>
                  <p className="font-bold text-[#2c221e] animate-pulse">AI 正光學辨識發票中...</p>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-5xl text-[#be5f48] mb-2">document_scanner</span>
                  <p className="font-bold text-[#2c221e] mb-1">將發票 QR Code 或收據置於框內</p>
                  <p className="text-xs text-stone-500 mb-6">支援全台量販、超市、傳統市場收據照片</p>
                  <button
                    onClick={handleSimulateScan}
                    className="bg-[#be5f48] hover:bg-[#9a442d] text-white font-extrabold px-6 py-2.5 rounded-full text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">photo_camera</span> 模擬拍攝/上傳發票
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#386753] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span> 辨識成功！發現 {scannedItems.length} 項食材
                </span>
                <button
                  onClick={() => setScannedItems(null)}
                  className="text-xs text-[#be5f48] hover:underline"
                >
                  重新掃描
                </button>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-stone-200 divide-y divide-stone-100 max-h-48 overflow-y-auto">
                {scannedItems.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center text-sm">
                    <span className="font-bold text-[#2c221e]">{item.name}</span>
                    <span className="text-xs text-stone-500 font-medium">
                      {item.qty} {item.unit} (${item.estCost})
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirmAdd}
                className="w-full bg-[#386753] hover:brightness-110 text-white font-extrabold py-3 rounded-full text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">playlist_add</span> 一鍵加入補貨清單
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceScannerModal;
