import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import { app, repository } from './app'
import { SqliteTestHarness } from './shared/infrastructure/sqlite-test-harness'

describe('HTTP contract adapter', () => {
  beforeEach(()=>repository.reset())
  test('returns the current state envelope', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/state'))
    expect(response.status).toBe(200)
    expect((await response.json()) as object).toHaveProperty('data')
  })
  test('exposes deterministic recipe errors', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/recipes/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ingredientIds:[]})}))
    expect(response.status).toBe(422)
    expect((await response.json()) as {error:{code:string;requestId:string}}).toMatchObject({error:{code:'VALIDATION_ERROR'}})
  })
  test('updates reminder categories while keeping the fixed weekly cap', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/settings/reminders',{
      method:'PATCH',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({expiringIngredients:false,plannedMeals:true,weeklyRhythm:false}),
    }))
    expect(response.status).toBe(200)
    expect((await response.json()) as {data:{weeklyLimit:number;expiringIngredients:boolean}}).toMatchObject({data:{weeklyLimit:3,expiringIngredients:false}})
  })
  test('applies a confirmed recipe adjustment to the MealTask and rejects an unknown preview', async () => {
    const previewId=crypto.randomUUID()
    const recipeId='11111111-1111-4111-8111-111111111111'
    const previewResponse=await app.handle(new Request(`http://localhost/api/v1/recipes/${recipeId}/adjustments/preview`,{
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({operationId:previewId,servings:2,replacementRequests:[],context:'兩人晚餐'}),
    }))
    expect(previewResponse.status).toBe(200)
    const preview=(await previewResponse.json()) as {data:{adjustedRecipe:{servings:number};changes:unknown[]}}
    expect(preview.data.adjustedRecipe.servings).toBe(2)
    expect(preview.data.changes.length).toBeGreaterThan(0)

    const taskId=crypto.randomUUID()
    const taskResponse=await app.handle(new Request('http://localhost/api/v1/meal-tasks',{
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({operationId:taskId,recipePackageId:recipeId,adjustmentPreviewId:previewId,currentMeal:{date:'2026-09-11',slot:'dinner',servings:2},nextMeal:{strategy:'skip'}}),
    }))
    expect(taskResponse.status).toBe(200)
    expect((await taskResponse.json()) as {data:{id:string;recipe:{servings:number}}}).toMatchObject({data:{id:taskId,recipe:{servings:2}}})

    const invalidResponse=await app.handle(new Request('http://localhost/api/v1/meal-tasks',{
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({operationId:crypto.randomUUID(),recipePackageId:recipeId,adjustmentPreviewId:crypto.randomUUID(),currentMeal:{date:'2026-09-11',slot:'dinner',servings:1},nextMeal:{strategy:'skip'}}),
    }))
    expect(invalidResponse.status).toBe(422)
    expect((await invalidResponse.json()) as {error:{code:string}}).toMatchObject({error:{code:'ADJUSTMENT_PREVIEW_INVALID'}})
  })
  test('keeps only the latest ten chef chats and deletes a selected session', async () => {
    for(let index=0;index<11;index+=1){
      const response=await app.handle(new Request('http://localhost/api/v1/chef-chat/sessions',{
        method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({operationId:crypto.randomUUID(),message:`第 ${index+1} 次相談`}),
      }))
      expect(response.status).toBe(200)
    }
    const listResponse=await app.handle(new Request('http://localhost/api/v1/chef-chat/sessions'))
    const list=(await listResponse.json()) as {data:Array<{id:string;title:string}>}
    expect(list.data).toHaveLength(10)
    expect(list.data[0].title).toBe('第 11 次相談')
    const target=list.data[0]
    const deleteResponse=await app.handle(new Request(`http://localhost/api/v1/chef-chat/sessions/${target.id}`,{method:'DELETE'}))
    expect(deleteResponse.status).toBe(200)
    const after=(await (await app.handle(new Request('http://localhost/api/v1/chef-chat/sessions'))).json()) as {data:Array<{id:string}>}
    expect(after.data.some((session)=>session.id===target.id)).toBeFalse()
  })
})

describe('SQLite integration-test harness', () => {
  const sqlite = new SqliteTestHarness()
  afterAll(()=>sqlite.close())
  test('connects to an in-memory database',()=>expect(sqlite.ping()).toBeTrue())
  test('commits a transaction',()=>expect(sqlite.transactionProbe()).toBe(1))
  test('rolls back a failed transaction',()=>{
    expect(()=>sqlite.transactionProbe(true)).toThrow('ROLLBACK_PROBE')
    expect(sqlite.db.query<{count:number},[]>('select count(*) as count from transaction_probe').get()?.count).toBe(1)
  })
})
