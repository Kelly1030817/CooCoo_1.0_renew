interface EquipmentRadarProps {
  cookwareCount: number;
}

export function EquipmentRadar({ cookwareCount }: EquipmentRadarProps) {
  const unlockedCount = Math.max(0, cookwareCount * 14);

  return (
    <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-2 text-xs font-black text-emerald-950">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span>裝備適配度雷達：</span>
      </div>
      <span className="font-mono font-black text-emerald-800 text-xs tracking-tight">
        已解鎖約 {unlockedCount} 道專屬料理包
      </span>
    </div>
  );
}
