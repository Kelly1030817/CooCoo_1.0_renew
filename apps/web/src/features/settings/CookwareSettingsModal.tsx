import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { CookwareProfile } from "@coocoo/contracts";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { api, json } from "@/shared/api/client";
import { Modal, ModalHeader } from "@/shared/ui/Modal";
import { useUi } from "@/app/ui-context";

export type CookwareModalProps = { onClose: () => void; enabled?: boolean };

export function CookwareModal({ onClose, enabled = true }: CookwareModalProps) {
  const { data } = useAppState(enabled);
  const query = useQueryClient();
  const ui = useUi();
  const [draft, setDraft] = useState<CookwareProfile[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const items = draft ?? data?.cookware ?? [];
  const close = () => {
    if (!busy) onClose();
  };
  const update = (id: string, patch: Partial<CookwareProfile>) =>
    setDraft(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  return (
    <Modal label="廚房裝備設定" onClose={close}>
      <ModalHeader title="我的廚房裝備" onClose={close} />
      <p className="mb-md text-sm text-on-surface-variant">
        加入你實際擁有的加熱設備。儲存後，料理推薦會依這份清單重新檢查。
      </p>
      <form
        className="space-y-md"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!data || busy) return;
          const normalized = items.map((item) => ({
            ...item,
            type: item.type.trim(),
            name: item.type.trim(),
            capacity: item.capacity.trim(),
          }));
          if (!normalized.length || normalized.some((item) => !item.type)) {
            setError("請至少新增一項廚具，並填寫名稱。");
            return;
          }
          if (
            new Set(normalized.map((item) => item.type.toLocaleLowerCase())).size !==
            normalized.length
          ) {
            setError("廚具名稱重複，請合併或使用不同名稱。");
            return;
          }
          setBusy(true);
          setError("");
          try {
            await api<CookwareProfile[]>("/settings/cookware", json("PUT", normalized));
            await query.invalidateQueries({ queryKey: stateQueryKey });
            ui.toast("廚具已儲存，已更新料理推薦條件");
            onClose();
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : "廚具未能儲存，請重試。");
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy || !data} className="min-w-0 space-y-md">
          {items.length === 0 && <p role="status">尚未登記廚具，請先新增一項。</p>}
          {items.map((item, index) => (
            <div key={item.id} className="space-y-sm rounded-2xl bg-surface-container-low p-md">
              <label className="block text-sm font-bold">
                廚具 {index + 1} 名稱／類型
                <input
                  className="field"
                  list="cookware-types"
                  required
                  maxLength={40}
                  value={item.type}
                  onChange={(event) => update(item.id, { type: event.target.value })}
                  placeholder="例如：快煮鍋"
                />
              </label>
              <label className="block text-sm">
                廚具 {index + 1} 容量（選填）
                <input
                  className="field"
                  maxLength={40}
                  value={item.capacity}
                  onChange={(event) => update(item.id, { capacity: event.target.value })}
                  placeholder="例如：2 公升"
                />
              </label>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setDraft(items.filter((row) => row.id !== item.id))}
                aria-label={`移除廚具 ${index + 1}`}
              >
                移除這項
              </button>
            </div>
          ))}
          <datalist id="cookware-types">
            {["快煮鍋", "電子壓力鍋", "電磁爐", "瓦斯爐", "微波爐", "電鍋", "氣炸鍋", "小烤箱"].map(
              (type) => (
                <option key={type} value={type} />
              ),
            )}
          </datalist>
          <button
            type="button"
            className="secondary-btn w-full"
            onClick={() =>
              setDraft([
                ...items,
                {
                  id: crypto.randomUUID(),
                  type: "",
                  name: "",
                  brand: "",
                  model: "",
                  capacity: "",
                  wattage: 0,
                },
              ])
            }
          >
            新增廚具
          </button>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <div className="flex gap-sm">
          <button type="button" disabled={busy} className="secondary-btn flex-1" onClick={close}>
            取消
          </button>
          <button disabled={busy || !data} className="primary-btn flex-1">
            {busy ? "儲存中…" : "儲存廚具"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
