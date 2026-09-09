import { api, json } from '@/shared/api/client';
import type { SyncResult } from '@coocoo/contracts';
import { supabase } from '@/shared/auth/supabase';
import { pendingOperations, removeOperation } from './recipe-packages';
let syncPromise:Promise<number>|null=null;
export function syncOfflineOperations(){
 if(!navigator.onLine)return Promise.resolve(0);if(syncPromise)return syncPromise;
 syncPromise=(async()=>{
  const userId=(await supabase?.auth.getSession())?.data.session?.user.id;if(!userId)return 0;
  let synced=0;
  for(const operation of await pendingOperations()){
   // Never replay another account's data, or an unowned legacy operation.
   if(operation.userId!==userId||operation.kind!=='cooking_complete')continue;
   try{const response=await api<SyncResult>('/sync',json('POST',{operations:[{id:operation.id,kind:operation.kind,payload:operation.payload}]}));
    const result=response.results.find(r=>r.id===operation.id);if(!result)break;
    if(result.status==='synced'||result.status==='conflict'){await removeOperation(operation.id);synced++;}
   }catch{break;}
  }return synced;
 })().finally(()=>{syncPromise=null;});return syncPromise;
}
