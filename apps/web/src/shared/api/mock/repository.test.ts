import { describe, expect, test } from 'vitest'
import { createSeedState } from '@coocoo/core'
import { migrateMockState } from './repository'

describe('mock repository schema migration',()=>{
  test('keeps version one state',()=>expect(migrateMockState(createSeedState())?.version).toBe(1))
  test('migrates unversioned state without losing inventory',()=>{const value=migrateMockState({inventory:[createSeedState().inventory[0]]});expect(value?.version).toBe(1);expect(value?.inventory).toHaveLength(1)})
  test('rejects unknown future versions',()=>expect(migrateMockState({version:99})).toBeNull())
})
