import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  IMAGE_STORE_METHODS,
  generatedMaterialStore,
  imageGrantFor,
} from '../apps/control-app/src/imagegen'
import { webuiPackageDir } from '../tools/generate/src/cli/webui'
import type { TicketStore } from '../apps/control-app/src/tickets'

/**
 * [[BUG-126]] — **the gap that let a two-method handle meet a five-method
 * expectation, closed so it cannot reopen**.
 *
 * WHY THE CRASH WAS INVISIBLE. The handle crosses into the image plugin through
 * `resolvePlugins(…, { options: { create_image: { store } } })`, and the plugin
 * library is imported as `Untyped`. So the ONE place where what this product
 * supplies meets what the surface calls is the one place TypeScript is switched
 * off. Nothing could have caught it there, and nothing did — for the whole life
 * of the capability.
 *
 * SO THE CHECK IS HERE, AND IT IS THE ONLY ONE THAT CAN BE. A type cannot cross
 * an `any`, and an assertion at composition still fails on a client's turn. What
 * this file does is hold this repository's declared method set against the calls
 * the SHIPPED executor actually makes — read out of its own source — so an
 * upstream rung that grows a sixth call fails in CI. Adding that call to
 * `ImageStoreMethod` is then what makes a handle which does not supply it a
 * compile error, which is where a wiring fault belongs.
 *
 * THE CLAIMS:
 *
 *   1. THE DECLARED SET IS THE SET THE SURFACE CALLS — neither short (the bug)
 *      nor long (a method nobody needs, kept alive by a list).
 *   2. THE HANDLE SUPPLIES EXACTLY THAT SET, asserted against the real function
 *      rather than against its type.
 *   3. AN OPERATION THE STORE CANNOT SERVE IS NOT GRANTED, so a narrowed handle
 *      narrows the manual instead of offering a capability that can only crash.
 */

/**
 * Every call the shipped image plugin makes on the store it is given.
 *
 * READ OUT OF THE PACKAGE, NOT OUT OF A LIST IN THIS FILE. A second list here
 * would be a copy of the thing under test, and it would go stale in exactly the
 * way the original did — silently, at the moment upstream changed.
 *
 * EVERY `.js` IN THE PACKAGE, rather than the one file that happens to hold the
 * executor today. Which file the calls live in is upstream's business; that they
 * are made at all is ours.
 */
function storeCallsUpstreamMakes(): string[] {
  const root = webuiPackageDir('ai-imagegen')
  const found = new Set<string>()
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') walk(full)
        continue
      }
      if (!entry.name.endsWith('.js')) continue
      for (const [, method] of fs.readFileSync(full, 'utf8').matchAll(/this\.store\.(\w+)/g)) {
        found.add(method)
      }
    }
  }
  walk(root)
  return [...found].sort()
}

/** A store that would throw if anything actually called it — nothing here does. */
const inertStore = {} as TicketStore

describe('BUG-126 — the handle the image surface is given', () => {
  it('test_UAT_FC_BUG-126_the_declared_method_set_is_the_set_the_surface_calls', async () => {
    // AC1. The bug in one assertion. Before the fix this list held `create` and
    // `attach`; the executor calls `get`, `attachments` and `read_attachment`
    // too, and nothing in the repository compared the two. Comparing them is
    // what turns an upstream rung growing a sixth call into a failure here
    // rather than a failure in front of a client.
    const upstream = storeCallsUpstreamMakes()
    // The guard on the guard: a regex that matched nothing would make this test
    // pass by agreeing with an empty set.
    expect(upstream.length).toBeGreaterThan(0)
    expect([...IMAGE_STORE_METHODS].sort()).toEqual(upstream)
  })

  it('test_UAT_FC_BUG-126_the_handle_supplies_exactly_that_set', async () => {
    // AC2. Asserted against the object the function actually returns, not
    // against the type it declares — the type is the compile-time half and this
    // is the other one. EXACTLY, in both directions: a handle one method short
    // is the bug, and a handle one method wide is a permission granted to the
    // plugin that no operation of its needs.
    const handle = generatedMaterialStore(inertStore, () => 'a-model', null)
    expect(Object.keys(handle).sort()).toEqual([...IMAGE_STORE_METHODS].sort())
  })

  it('test_UAT_FC_BUG-126_an_operation_the_store_cannot_serve_is_not_granted', async () => {
    // AC3. The grant is derived from the surface's declaration, which is right
    // and was not enough: the declaration cannot know what the STORE behind it
    // can serve, so `EditImages` was offered on every turn over a handle that
    // could not serve one call of it. An offered-and-always-crashing capability
    // is worse than an absent one — a model proposes it, apologises for it, and
    // spends a client's turns establishing that it is broken.
    const full = imageGrantFor(generatedMaterialStore(inertStore, () => 'a-model', null))
    const [surface] = Object.keys(full)
    const groupsOf = (grant: Record<string, unknown>): string[] =>
      ((grant[surface] as { groups?: string[] })?.groups ?? []).slice().sort()

    // The whole handle serves both halves, so both are granted — which is the
    // state this deployment is now in, and the reason the tool works at all.
    expect(groupsOf(full)).toHaveLength(2)

    // THE HANDLE AS IT WAS — the two methods `Pick<TicketStore, 'create' |
    // 'attach'>` supplied. Generation is still granted, because the create path
    // only ever touched those two; editing is not, because nothing behind this
    // grant could perform one.
    const whole = generatedMaterialStore(inertStore, () => 'a-model', null)
    const narrowed = imageGrantFor({ create: whole.create, attach: whole.attach })
    expect(groupsOf(narrowed)).toHaveLength(1)
    expect(groupsOf(full)).toEqual(expect.arrayContaining(groupsOf(narrowed)))

    // AND A HANDLE THAT SERVES NOTHING GRANTS NOTHING, rather than granting a
    // surface's default. Absence is the same shape a missing image key already
    // has: no capability, no manual entry, nothing for a model to probe for.
    expect(groupsOf(imageGrantFor({}))).toEqual([])
  })
})
