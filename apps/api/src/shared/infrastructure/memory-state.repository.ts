import { createSeedState, type StateRepository } from '@coocoo/core'
import type { AppState } from '@coocoo/contracts'

export class MemoryStateRepository implements StateRepository {
  private value: AppState = createSeedState()
  read() { return structuredClone(this.value) }
  write(value: AppState) { this.value = structuredClone(value) }
  reset() { this.value = createSeedState(); return this.read() }
}
