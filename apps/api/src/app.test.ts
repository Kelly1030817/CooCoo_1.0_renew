import { afterAll, describe, expect, test } from 'bun:test'
import { app } from './app'
import { SqliteTestHarness } from './shared/infrastructure/sqlite-test-harness'

describe('HTTP contract adapter', () => {
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
