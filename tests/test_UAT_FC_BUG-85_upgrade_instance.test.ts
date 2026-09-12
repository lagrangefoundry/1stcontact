/**
 * [[BUG-85]] 2b — carrying one stored instance across a contract version bump.
 *
 * The migrations themselves are hand-written and cannot be derived; what is
 * tested here is everything around them — chaining the steps, refusing a pin
 * nothing can reach, dropping undeclared keys in the open, and treating a
 * migration whose output fails its own new contract as an error rather than a
 * warning.
 */
import { describe, it, expect, vi } from 'vitest'
import type { BehaviorInstance, BehaviorMeta } from '../packages/framework/src/modules/behavior'
import {
  MigrationResultInvalidError,
  upgradeInstance,
} from '../packages/framework/src/modules/upgrade'
import type { StoredInstance } from '../packages/framework/src/modules/upgrade'
import * as catalog from '../packages/framework/src/modules/catalog'

/**
 * A module invented for this test, swapped into the catalog's two lookups.
 *
 * SYNTHETIC RATHER THAN A REAL MODULE because the properties under test are
 * the machinery's, not any one behavior's: a two-bump chain, a gap in the
 * middle, a migration that returns something invalid. Driving those from
 * `account-chrome` would mean bumping it to 3 and 4 in a test file, and the
 * next real bump would silently rewrite what this file is asserting.
 */
function withFakeModule<T>(meta: BehaviorMeta, body: () => T): T {
  const realGet = catalog.getModuleMeta
  const realLatest = catalog.latestModuleVersion
  const spyGet = vi.spyOn(catalog, 'getModuleMeta')
  const spyLatest = vi.spyOn(catalog, 'latestModuleVersion')
  spyGet.mockImplementation((id, v) => (id === meta.id ? meta : realGet(id, v)))
  spyLatest.mockImplementation((id) => (id === meta.id ? meta.version : realLatest(id)))
  try {
    return body()
  } finally {
    spyGet.mockRestore()
    spyLatest.mockRestore()
  }
}

/** A minimal contract: one optional config key, one required slot. */
function fakeMeta(version: number, extra: Partial<BehaviorMeta> = {}): BehaviorMeta {
  return {
    id: 'fake',
    version,
    kind: 'behavior',
    config: { label: { type: 'string', required: false, default: 'x' } },
    slots: { body: { required: true } },
    conformance: { obligations: ['safety'] },
    ...extra,
  } as BehaviorMeta
}

const BODY = { kind: 'text', text: 'hello' } as const

function instanceAt(version: number, over: Partial<StoredInstance> = {}): StoredInstance {
  return {
    id: 'thing',
    type: 'fake',
    version,
    config: { label: 'a' },
    slots: { body: { ...BODY } },
    ...over,
  }
}

describe('BUG-85 2b — upgradeInstance', () => {
  it('is a no-op for an instance already on the current contract', () => {
    const meta = fakeMeta(1)
    withFakeModule(meta, () => {
      const stored = instanceAt(1)
      const { instance, droppedConfigKeys, droppedSlots } = upgradeInstance(stored)
      // The very same object: an upgrade that rebuilt a current instance would
      // rewrite every page on every run, and the report would never be empty.
      expect(instance).toBe(stored)
      expect(droppedConfigKeys).toEqual([])
      expect(droppedSlots).toEqual([])
    })
  })

  it('chains every step, so an instance two bumps behind crosses both', () => {
    const seen: string[] = []
    const meta = fakeMeta(3, {
      migrations: {
        2: (prev: BehaviorInstance) => {
          seen.push('to-2')
          return { ...prev, config: { ...prev.config, label: `${prev.config.label}+2` } }
        },
        3: (prev: BehaviorInstance) => {
          seen.push('to-3')
          return { ...prev, config: { ...prev.config, label: `${prev.config.label}+3` } }
        },
      },
    })
    withFakeModule(meta, () => {
      const { instance } = upgradeInstance(instanceAt(1))
      // In order, each step seeing the previous one's output — which is what
      // lets a migration only ever know about the single version it produces.
      expect(seen).toEqual(['to-2', 'to-3'])
      expect(instance.config).toEqual({ label: 'a+2+3' })
      expect(instance.version).toBe(3)
    })
  })

  it('refuses a pin no declared migration can reach, and says what to declare', () => {
    const meta = fakeMeta(3, { migrations: { 3: (prev: BehaviorInstance) => prev } })
    withFakeModule(meta, () => {
      expect(() => upgradeInstance(instanceAt(1))).toThrow(/no migration declared for v2/)
      expect(() => upgradeInstance(instanceAt(1))).toThrow(/migrations\[2\]/)
    })
  })

  it('refuses a pin below a declared-extinct floor, naming the remedy', () => {
    // The floor is a CLAIM that nothing is stored below it. An instance that
    // turns up below it disproves the claim, and the message has to say so —
    // "no migration declared" would send somebody to write a migration without
    // also correcting the declaration that said none was needed.
    const meta = fakeMeta(3, {
      migrationsFrom: 2,
      migrations: { 3: (prev: BehaviorInstance) => prev },
    })
    withFakeModule(meta, () => {
      expect(() => upgradeInstance(instanceAt(1))).toThrow(/below the oldest version/)
      expect(() => upgradeInstance(instanceAt(1))).toThrow(/migrationsFrom/)
      // …while an instance AT the floor still upgrades.
      expect(upgradeInstance(instanceAt(2)).instance.version).toBe(3)
    })
  })

  it('drops undeclared config keys and slots, and names every one it dropped', () => {
    const meta = fakeMeta(2, { migrations: { 2: (prev: BehaviorInstance) => prev } })
    withFakeModule(meta, () => {
      const { instance, droppedConfigKeys, droppedSlots } = upgradeInstance(
        instanceAt(1, {
          config: { label: 'a', account: 'https://example.test', stray: 1 },
          slots: { body: { ...BODY }, ghost: { ...BODY } },
        }),
      )
      // Sorted and complete — this is what the dry-run report prints, and the
      // operator's only chance to notice something they cared about going.
      expect(droppedConfigKeys).toEqual(['account', 'stray'])
      expect(droppedSlots).toEqual(['ghost'])
      expect(instance.config).toEqual({ label: 'a' })
      expect(Object.keys(instance.slots ?? {})).toEqual(['body'])
    })
  })

  it('strips undeclared keys AFTER the migrations, not before', () => {
    // A migration is entitled to read the key it is retiring — v1 → v2 reads
    // `sentMessage` to fill the `sent` slot. Stripping first would take the
    // input out from under every migration that carries data forward.
    const meta = fakeMeta(2, {
      migrations: {
        2: (prev: BehaviorInstance) => ({
          config: { label: String(prev.config.retiring) },
          slots: prev.slots,
        }),
      },
    })
    withFakeModule(meta, () => {
      const { instance } = upgradeInstance(
        instanceAt(1, { config: { label: 'a', retiring: 'carried' } }),
      )
      expect(instance.config).toEqual({ label: 'carried' })
    })
  })

  it('throws when a migration produces an instance its own new contract rejects', () => {
    // The alternative is writing it back: trading a loud catalog miss, which at
    // least names the module and both versions, for a quiet one that surfaces
    // later as a render fault somewhere else entirely.
    const meta = fakeMeta(2, {
      migrations: { 2: (prev: BehaviorInstance) => ({ config: prev.config, slots: {} }) },
    })
    withFakeModule(meta, () => {
      expect(() => upgradeInstance(instanceAt(1))).toThrow(MigrationResultInvalidError)
      expect(() => upgradeInstance(instanceAt(1))).toThrow(/required slot 'body' is missing/)
    })
  })

  it('refuses an instance pinned AHEAD of the catalog rather than downgrading it', () => {
    const meta = fakeMeta(2, { migrations: { 2: (prev: BehaviorInstance) => prev } })
    withFakeModule(meta, () => {
      expect(() => upgradeInstance(instanceAt(5))).toThrow(/ahead of the catalog/)
    })
  })

  it('carries page-level fields the contract says nothing about', () => {
    const meta = fakeMeta(2, { migrations: { 2: (prev: BehaviorInstance) => prev } })
    withFakeModule(meta, () => {
      const { instance } = upgradeInstance(
        instanceAt(1, { slot: 'hero', background: { fill: '#fff' } }),
      )
      // `slot` is the page's binding, not the behavior's config. A version bump
      // says nothing about it, so neither does the upgrade.
      expect(instance.slot).toBe('hero')
      expect(instance.background).toEqual({ fill: '#fff' })
    })
  })
})
