import { Database } from 'bun:sqlite'

export class SqliteTestHarness {
  readonly db = new Database(':memory:', { strict: true })
  ping() { return this.db.query<{ ok: number }, []>('select 1 as ok').get()?.ok === 1 }
  transactionProbe(shouldRollback = false) {
    this.db.exec('create temp table if not exists transaction_probe (value integer not null)')
    const transaction = this.db.transaction(() => {
      this.db.run('insert into transaction_probe values (1)')
      if (shouldRollback) throw new Error('ROLLBACK_PROBE')
    })
    transaction()
    return this.db.query<{ count: number }, []>('select count(*) as count from transaction_probe').get()?.count ?? 0
  }
  close() { this.db.close() }
}
