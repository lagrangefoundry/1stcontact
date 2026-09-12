/**
 * [[BUG-85]] 2a — the hand-written `account-chrome` v1 → v2 migration, run
 * against the instance that actually broke.
 *
 * THE FIXTURE IS THE REAL ORPHAN. `tests/fixtures/bug85/` holds the
 * `account-chrome` instance lifted out of 1st Contact's own D1 draft while
 * diagnosing this bug — undeclared `account` key, `sentMessage` string, no
 * `sent` or `error` slot, pinned at v1. It is the only surviving example of an
 * instance orphaned by a real version bump, and every property below is
 * asserted against it rather than against something convenient.
 *
 * This is also the known limit made concrete: the guard in
 * `test_UAT_FC_BUG-85_migration_path_guard` can force a migration to EXIST,
 * but only a test like this one can say whether it is any good.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { accountChromeMeta } from '../packages/framework/src/modules/account-chrome/meta'
import {
  validateBehaviorConfig,
  validateBehaviorSlots,
} from '../packages/framework/src/modules/behavior'
import { upgradeInstance } from '../packages/framework/src/modules/upgrade'
import type { StoredInstance } from '../packages/framework/src/modules/upgrade'

const ORPHAN = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'fixtures/bug85/account-chrome-v1-orphan.json'),
    'utf8',
  ),
) as StoredInstance

/** A fresh copy per test — `upgradeInstance` must not be able to poison the fixture. */
const orphan = (): StoredInstance => structuredClone(ORPHAN)

describe('BUG-85 2a — account-chrome v1 → v2, against the instance that broke', () => {
  it('the fixture is the orphan this bug is about', () => {
    // Guards the test itself: if somebody "tidies" the fixture up to v2, every
    // assertion below would pass vacuously.
    expect(ORPHAN.version).toBe(1)
    expect(ORPHAN.config).toHaveProperty('sentMessage')
    expect(ORPHAN.config).toHaveProperty('account')
    expect(Object.keys(ORPHAN.slots ?? {}).sort()).toEqual([
      'businesses',
      'dialog',
      'signedIn',
      'signedOut',
    ])
  })

  it('produces an instance the v2 contract accepts', () => {
    const { instance } = upgradeInstance(orphan())
    expect(instance.version).toBe(2)
    expect([
      ...validateBehaviorConfig(accountChromeMeta, instance.config),
      ...validateBehaviorSlots(accountChromeMeta, instance.slots),
    ]).toEqual([])
  })

  it("carries the author's own confirmation wording into the sent card", () => {
    // The words were config and are now a slot. An upgrade changes WHERE they
    // are authored; it must not change what the visitor reads.
    const { instance } = upgradeInstance(orphan())
    const sent = instance.slots!.sent as { children: { text: string }[] }
    expect(sent.children[0].text).toBe(ORPHAN.config!.sentMessage)
  })

  it('authors an error card, which v1 stored nothing at all to build from', () => {
    const { instance } = upgradeInstance(orphan())
    const error = instance.slots!.error as { children: { text: string }[] }
    expect(error.children[0].text).toBe('Could not reach the server. Please try again.')
  })

  it('cuts both cards from the instance\'s own dialog, not from the L2 preset', () => {
    // The property that makes this migration worth hand-writing. This site
    // paints on palette refs at radius 16; `accountChromePreset()` paints
    // `#ffffff` at radius 8 because it has no site to look at. A card in the
    // preset's clothes would sit next to a dialog in the author's.
    const { instance } = upgradeInstance(orphan())
    const dialog = ORPHAN.slots!.dialog as Record<string, unknown>
    for (const name of ['sent', 'error']) {
      const card = instance.slots![name] as Record<string, unknown>
      expect(card.axes, name).toEqual(dialog.axes)
      expect(card.padding, name).toEqual(dialog.padding)
      expect(card.sizing, name).toEqual(dialog.sizing)
    }
    // …and specifically the palette refs, so a regression to hardcoded hex is
    // visible as itself rather than as an object mismatch.
    const sent = instance.slots!.sent as { axes: { surfaceFill: unknown } }
    expect(sent.axes.surfaceFill).toEqual({ ref: 'paper' })
  })

  it('gives the card text the colour the dialog gives its own prose', () => {
    const { instance } = upgradeInstance(orphan())
    const sent = instance.slots!.sent as { children: { axes: { color: unknown } }[] }
    expect(sent.children[0].axes.color).toEqual({ ref: 'ink' })
  })

  it('removes sentMessage, and drops the undeclared account key in the open', () => {
    const { instance, droppedConfigKeys } = upgradeInstance(orphan())
    expect(instance.config).not.toHaveProperty('sentMessage')
    expect(instance.config).not.toHaveProperty('account')
    // `sentMessage` was a declared v1 field whose content MOVED, so the
    // migration retires it and it is not a "drop". `account` was never declared
    // at any version, so it is — and the operator is told.
    expect(droppedConfigKeys).toEqual(['account'])
  })

  it('leaves every config key v2 still declares exactly as it was', () => {
    const { instance } = upgradeInstance(orphan())
    for (const key of ['signIn', 'portal', 'businesses', 'signInLabel', 'emailLabel']) {
      expect(instance.config![key], key).toBe(ORPHAN.config![key])
    }
  })

  it('leaves the four slots the author already drew untouched', () => {
    const { instance } = upgradeInstance(orphan())
    for (const name of ['signedOut', 'signedIn', 'businesses', 'dialog']) {
      expect(instance.slots![name], name).toEqual(ORPHAN.slots![name])
    }
  })

  it('is idempotent in the way that matters: it never overwrites an authored card', () => {
    // An instance can reach the migration already holding a `sent` slot — v1
    // refused no undeclared slot — and a second run of an upgrade must not
    // replace a card somebody has since drawn.
    const withCard = orphan()
    const mine = { kind: 'text', text: 'my own words' }
    withCard.slots = { ...withCard.slots, sent: mine }
    const { instance } = upgradeInstance(withCard)
    expect(instance.slots!.sent).toEqual(mine)
  })

  it('reproduces the hand-repair that unblocked the site', () => {
    // The repair was applied to D1 by hand before this facility existed. If the
    // migration disagrees with it, one of the two is wrong — and the operator
    // is looking at the hand-repaired version right now.
    const { instance } = upgradeInstance(orphan())
    const sent = instance.slots!.sent as Record<string, unknown>
    expect(sent.kind).toBe('container')
    expect(sent.layout).toBe('stack')
    expect(sent.gapPx).toBe(12)
    expect((sent.children as { axes: Record<string, unknown> }[])[0].axes).toEqual({
      color: { ref: 'ink' },
      fontSizePx: 15,
      lineHeightPx: 22,
    })
  })
})
