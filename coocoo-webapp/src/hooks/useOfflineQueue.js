import { useEffect } from 'react';

const OFFLINE_QUEUE_KEY = 'coocoo_offline_sync_queue';

export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveOfflineQueue(queue) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {}
}

export function enqueueOfflineAction(actionType, payload) {
  const queue = getOfflineQueue();
  queue.push({
    id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    actionType,
    payload,
    timestamp: Date.now()
  });
  saveOfflineQueue(queue);
}

export function useOfflineQueue(supabaseClient, currentUser, showToast) {
  useEffect(() => {
    const flushQueue = async () => {
      if (!supabaseClient || !currentUser || !navigator.onLine) return;
      const queue = getOfflineQueue();
      if (queue.length === 0) return;

      const remainingQueue = [];
      let flushedCount = 0;

      for (const item of queue) {
        try {
          let error = null;
          if (item.actionType === 'add_inventory') {
            const res = await supabaseClient.from('inventory').insert([{ ...item.payload, user_id: currentUser.id }]);
            error = res.error;
          } else if (item.actionType === 'update_inventory') {
            const res = await supabaseClient.from('inventory').update(item.payload.data).eq('id', item.payload.id);
            error = res.error;
          } else if (item.actionType === 'delete_inventory') {
            const res = await supabaseClient.from('inventory').delete().eq('id', item.payload.id);
            error = res.error;
          } else if (item.actionType === 'add_shopping') {
            const res = await supabaseClient.from('shopping_list').insert([{ ...item.payload, user_id: currentUser.id }]);
            error = res.error;
          } else if (item.actionType === 'update_shopping') {
            const res = await supabaseClient.from('shopping_list').update(item.payload.data).eq('id', item.payload.id);
            error = res.error;
          } else if (item.actionType === 'delete_shopping') {
            const res = await supabaseClient.from('shopping_list').delete().eq('id', item.payload.id);
            error = res.error;
          } else if (item.actionType === 'add_cooked_history') {
            const res = await supabaseClient.from('cooked_history').insert([{ ...item.payload, user_id: currentUser.id }]);
            error = res.error;
          }

          if (error) {
            remainingQueue.push(item);
          } else {
            flushedCount++;
          }
        } catch (err) {
          remainingQueue.push(item);
        }
      }

      saveOfflineQueue(remainingQueue);
      if (flushedCount > 0 && showToast) {
        showToast(`已成功離線同步 ${flushedCount} 項操作至 Supabase！`, 'success');
      }
    };

    const handleOnline = () => {
      if (showToast) showToast('網路連線已恢復，正在嘗試同步離線資料...', 'info');
      flushQueue();
    };

    window.addEventListener('online', handleOnline);
    flushQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [supabaseClient, currentUser, showToast]);
}
