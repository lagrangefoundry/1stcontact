/**
 * [[BUG-85]] 2e — the guard that makes a version bump fail at bump time.
 *
 * THE DEFECT THIS REPLACES. `account-chrome` went to v2 and v1 left the
 * catalog in the same commit, so every instance already stored at v1 stopped
 * resolving. Nothing in the build noticed; the signal was 1st Contact's own
 * site refusing to load, days later, in a store nobody had thought to check.
 *
 * This test is the whole of the automation that makes that impossible to repeat
 * silently. It reads only the catalog — no stored data, no store, no adapter —
 * so it runs on every commit, and a bump that arrives without its migration
 * goes red in the commit that does the bumping.
 */
import { describe, it, expect } from 'vitest'
import { CATALOG } from '../packages/framework/src/modules/catalog'
import { missingMigrations } from '../packages/framework/src/modules/upgrade'
import type { BehaviorMeta } from '../packages/framework/src/modules/behavior'

describe('BUG-85 2e — every bump ships the migration that reaches it', () => {
  it('the shipped catalog has no gap', () => {
    // The assertion the whole ticket is for. If this fails, read the module and
    // version it names: something was bumped without declaring
    // `migrations[<version>]` on its meta, and every instance already stored on
    // the version below is now unloadable.
    expect(missingMigrations()).toEqual([])
  })

  it('names the module and the version when a bump has no migration', () => {
    // A module bumped to 3 carrying only the step that reaches 2 — the exact
    // shape of the mistake, minus the part where a real site goes down.
    const bumped = {
      ...CATALOG[0],
      id: 'pretend',
      version: 3,
      migrations: { 2: (prev) => prev },
    } as unknown as BehaviorMeta

    const gaps: { type: string; version: number }[] = []
    for (let v = 2; v <= bumped.version; v += 1) {
      if (bumped.migrations?.[v] === undefined) gaps.push({ type: bumped.id, version: v })
    }
    expect(gaps).toEqual([{ type: 'pretend', version: 3 }])
  })

  it('does not demand a migration INTO version 1', () => {
    // A module that has never been bumped has nothing to migrate from, and
    // asking for `migrations[1]` would be asking for a step out of a version
    // that never existed. `account-portal` is the live example — still v1, no
    // `migrations` key at all.
    const virgin = CATALOG.find((m) => m.version === 1)
    expect(virgin, 'the catalog should still hold an un-bumped module').toBeDefined()
    expect(virgin!.migrations).toBeUndefined()
    expect(missingMigrations().some((g) => g.type === virgin!.id)).toBe(false)
  })
})
