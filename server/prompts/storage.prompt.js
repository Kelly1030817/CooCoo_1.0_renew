export const getStorageProtocol = (name) => {
    let storageProtocol = "方形收納管理：裝入規格化收納盒，先進先出，定期檢查保鮮期。";
    if (name.includes("菜") || name.includes("葉")) {
        storageProtocol = "微氣候維護：避免冷氣直吹。應採用微濕紙巾包裹，再裝入方形保鮮盒冷藏。";
    } else if (name.includes("肉") || name.includes("魚") || name.includes("海鮮")) {
        storageProtocol = "組織液阻斷：冷凍前必須以紙巾緊密包裹以吸附組織液，壓扁冷凍最大化表面積。";
    }
    return storageProtocol;
};
