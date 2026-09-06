import { Elysia, t } from 'elysia';
import { SyncRequestSchema, type SyncResult } from '@coocoo/contracts';
import { authenticateRequest, getSupabaseAdmin } from '../../shared/infrastructure/supabase';
import { SupabaseCookingRepository } from '../cooking/supabase-cooking.repository';
export function syncRoutes(){return new Elysia({name:'offline-sync'})
 .post('/api/v1/sync',async({headers,body})=>{
  const user=await authenticateRequest(headers.authorization);const results:SyncResult['results']=[];
  for(const operation of body.operations){
   if(operation.id!==operation.payload.completionKey)throw new Error('OPERATION_ID_MISMATCH');
   const r=await new SupabaseCookingRepository().complete(user.id,operation.payload);
   results.push({id:operation.id,status:r.hasConflict?'conflict':'synced',...(r.hasConflict?{message:'料理結果已保存，庫存用量有衝突，請確認。'}:{})});
  }return {data:{results}};
 },{body:SyncRequestSchema})
 .get('/api/v1/sync/conflicts',async({headers})=>{const u=await authenticateRequest(headers.authorization);const r=await getSupabaseAdmin().from('sync_conflicts').select('id,kind,message,created_at').eq('user_id',u.id).is('resolved_at',null);if(r.error)throw r.error;return {data:r.data};})
 .post('/api/v1/sync/conflicts/:id/acknowledge',async({headers,params})=>{const u=await authenticateRequest(headers.authorization);const r=await getSupabaseAdmin().from('sync_conflicts').update({resolved_at:new Date().toISOString()}).eq('user_id',u.id).eq('id',params.id).select('id').single();if(r.error)throw r.error;return {data:r.data};},{params:t.Object({id:t.String({format:'uuid'})})});}
