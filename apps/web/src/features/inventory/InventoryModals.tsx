import { useQueryClient } from "@tanstack/react-query";
import { useUi } from "@/app/ui-context";
import { Modal, ModalHeader } from "@/shared/ui/Modal";
import { api, json } from "@/shared/api/client";
import { formFieldString } from "@/shared/lib/form-fields";
import { stateQueryKey } from "@/entities/app-state/model";

export type AddInventoryModalProps = {
  onClose: () => void;
};

export function AddInventoryModal({ onClose }: AddInventoryModalProps) {
  const ui = useUi();
  const query = useQueryClient();
  return (
    <Modal label="新增食材" onClose={onClose}>
      <ModalHeader title="新增精確食材" kicker="數量、位置與期限都會影響推薦" onClose={onClose} />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget),
            name = formFieldString(f, "name"),
            expiresOn = formFieldString(f, "expiresOn"),
            daysLeft = Math.max(
              0,
              Math.ceil((new Date(`${expiresOn}T00:00:00`).getTime() - Date.now()) / 86400000),
            );
          await api(
            "/inventory",
            json("POST", {
              ingredientKey: name,
              name,
              chamber: formFieldString(f, "chamber"),
              qty: Number(f.get("qty")),
              unit: formFieldString(f, "unit"),
              daysLeft,
              expiresOn,
              lastConfirmedAt: new Date().toISOString(),
              image: "/favicon.svg",
              addedDate: new Date().toISOString().slice(0, 10),
              estimatedValue: Number(f.get("estimatedValue") || 0),
              storageProtocol: "先進先出，使用前依期限確認。",
              boxSize: "M",
            }),
          );
          await query.invalidateQueries({ queryKey: stateQueryKey });
          onClose();
          ui.toast("食材已加入精確冰箱");
        }}
        className="grid grid-cols-2 gap-md"
      >
        <label className="col-span-2 text-xs font-bold text-on-surface-variant">
          食材名稱
          <input className="field" name="name" required placeholder="例如：空心菜" />
        </label>
        <label className="text-xs font-bold text-on-surface-variant">
          存放區
          <select className="field" name="chamber">
            <option value="cold">冷藏室</option>
            <option value="frozen">冷凍庫</option>
            <option value="pantry">常溫</option>
          </select>
        </label>
        <label className="text-xs font-bold text-on-surface-variant">
          期限
          <input className="field" name="expiresOn" type="date" required />
        </label>
        <label className="text-xs font-bold text-on-surface-variant">
          數量
          <input
            className="field"
            name="qty"
            type="number"
            defaultValue="1"
            min="0.01"
            step="0.01"
            required
          />
        </label>
        <label className="text-xs font-bold text-on-surface-variant">
          單位
          <input className="field" name="unit" defaultValue="包" required />
        </label>
        <label className="col-span-2 text-xs font-bold text-on-surface-variant">
          實付總價（選填）
          <input
            className="field"
            name="estimatedValue"
            type="number"
            min="0"
            step="1"
            placeholder="沒有收據可先留空"
          />
          <span className="mt-1 block text-[10px] font-normal text-stone-500">
            留空會顯示「未記錄成本」，不會猜測價格。
          </span>
        </label>
        <div className="col-span-2 mt-md flex gap-sm">
          <button type="button" onClick={onClose} className="secondary-btn flex-1">
            取消
          </button>
          <button className="primary-btn flex-1">確認加入</button>
        </div>
      </form>
    </Modal>
  );
}
