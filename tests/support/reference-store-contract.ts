import { describe, expect, it } from 'vitest'
import {
  listAssets,
  readCapture,
  readCaptureAssets,
  readForms,
  readHints,
  readL1,
  readLadderScreenshot,
  readMultiState,
  writeBundle,
  writeForms,
  writeHints,
  writeL1,
  writeLadderScreenshots,
  writeMultiState,
} from '../../tools/generate/src/cli/capture/bundle'
import {
  ASSETS_PREFIX,
  CAPTURE_MEMBER,
  L1_MEMBER,
  MULTISTATE_MEMBER,
  RAW_MEMBER,
  RENDERED_MEMBER,
  SCREENSHOT_MEMBER,
  bundleNameFor,
  ladderMember,
  type ReferenceStore,
} from '../../tools/generate/src/store/reference-store'
import { syntheticCapture, syntheticL1, syntheticMultiState } from './reference-fixtures'

/**
 * THE PORT'S CONTRACT — one body of assertions, run against every adapter.
 *
 * WHY THIS IS A MODULE AND NOT A TEST FILE. Identical reasoning to
 * `site-store-contract.ts`, which REQ-142/REQ-143 established for `SiteStore`:
 * the filesystem and in-memory adapters run in the node project, and the R2 one
 * can only run inside workerd, in a different Vitest project with a different
 * pool. "One port, one contract, three adapters" is therefore not something a
 * single `describe.each` can express — the adapters do not share a runtime. What
 * they can share is this: the assertions themselves, imported by both projects'
 * suites and registered against whatever store each can build.
 *
 * That is a stronger claim than two files agreeing, because there is nothing to
 * keep in step. A verb added to the port is asserted once here and every adapter
 * is held to it; an adapter that answers differently fails in its own project
 * with the same assertion text.
 *
 * IT ASSERTS THROUGH THE CODEC, NOT AGAINST RAW BYTES, and that is deliberate.
 * What must be true of a bundle is that `capture.json` written by one adapter
 * reads back as the same {@link Capture} through the other — [[DOC-13]] §8's
 * "a bundle written by the laptop and a bundle written by the cloud are the same
 * artifact". Asserting `bundle.read('capture.json')` byte-wise would prove the
 * store echoes bytes and prove nothing about the artifact.
 */

/** What a suite hands this module: a name, and a way to make an empty store. */
export interface ReferenceContractBackend {
  name: string
  /**
   * Build a store with nothing in it.
   *
   * Async because two of the three adapters have to await something to exist,
   * and a contract that only fitted the synchronous one would be a contract
   * shaped around the filesystem.
   */
  makeStore(): Promise<ReferenceStore>
}

const NAME = bundleNameFor({ host: 'example.test', path: '/pricing' })

export function registerReferenceStoreContract(backend: ReferenceContractBackend): void {
  describe(`ReferenceStore contract — ${backend.name}`, () => {
    it('test_UAT_FC_REQ-155_bundle_round_trips_every_member', async () => {
      const store = await backend.makeStore()
      const bundle = store.bundle(NAME)
      const capture = syntheticCapture()

      const location = await writeBundle(bundle, {
        capture,
        screenshot: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]),
        renderedHtml: '<html><body><h1>Pricing</h1></body></html>',
        rawHtml: '<html><body>raw</body></html>',
        assetBytes: new Map([[`${ASSETS_PREFIX}hero.jpg`, new Uint8Array([9, 9, 9])]]),
      })
      expect(location.name).toBe(NAME)

      const multiState = syntheticMultiState()
      await writeMultiState(bundle, multiState)
      await writeL1(bundle, syntheticL1())
      await writeForms(bundle, [])
      const hints = { viewport: { width: 375, height: 667 }, mediaBreakpoints: [], nodes: [] }
      await writeHints(bundle, hints)
      await writeLadderScreenshots(bundle, [
        { viewport: { width: 375, height: 667 }, bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 119]) },
      ])

      // Every member DOC-13 §4 names is present, and reads back through the
      // codec as the artifact that went in — not merely as some bytes.
      expect(await readCapture(bundle)).toEqual(capture)
      expect(await readMultiState(bundle)).toEqual(multiState)
      expect((await readL1(bundle))?.widths).toEqual([375])
      expect(await readForms(bundle)).toEqual([])
      expect(await readHints(bundle)).toEqual(hints)
      expect(await readCaptureAssets(bundle)).toEqual(capture.assets)

      const shot = await readLadderScreenshot(bundle, 375)
      expect([...(shot ?? [])].slice(0, 4)).toEqual([0x89, 0x50, 0x4e, 0x47])
      // A width the ladder never shot is null, so a size-aware diff fails loudly
      // rather than silently comparing against the desktop shot.
      expect(await readLadderScreenshot(bundle, 999)).toBeNull()
    })

    it('test_UAT_FC_REQ-155_list_enumerates_members_and_narrows_by_prefix', async () => {
      const store = await backend.makeStore()
      const bundle = store.bundle(NAME)
      await writeBundle(bundle, {
        capture: syntheticCapture(),
        screenshot: new Uint8Array([1]),
        renderedHtml: '<html></html>',
        rawHtml: '<html></html>',
        assetBytes: new Map([
          [`${ASSETS_PREFIX}hero.jpg`, new Uint8Array([1])],
          [`${ASSETS_PREFIX}css2`, new Uint8Array([2])],
        ]),
      })

      const all = await bundle.list()
      expect(all).toContain(CAPTURE_MEMBER)
      expect(all).toContain(SCREENSHOT_MEMBER)
      expect(all).toContain(RENDERED_MEMBER)
      expect(all).toContain(RAW_MEMBER)
      // Sorted, and forward-slashed regardless of the host's separator — a member
      // key is a key, not a path (see `reference-store.ts`).
      expect([...all].sort()).toEqual(all)

      // The verb `SiteStore` did not need: `reextract` has to know which
      // subresources were actually mirrored, and nothing else records that.
      expect(await listAssets(bundle)).toEqual([`${ASSETS_PREFIX}css2`, `${ASSETS_PREFIX}hero.jpg`])
    })

    it('test_UAT_FC_REQ-155_absent_members_read_as_null_not_as_an_error', async () => {
      const store = await backend.makeStore()
      const bundle = store.bundle('nothing.test/index')

      // A bundle predating a member is the ordinary case — REQ-48, REQ-83 and
      // REQ-93 each added one — so an absent member is an answer, not a fault.
      expect(await bundle.read(MULTISTATE_MEMBER)).toBeNull()
      expect(await readMultiState(bundle)).toBeNull()
      expect(await readL1(bundle)).toBeNull()
      expect(await readHints(bundle)).toBeNull()
      // …with two deliberate exceptions. `forms.json` and the asset map answer
      // empty, because empty is the honest reading of "this page has no
      // behaviours" / "no remote media", not a missing artifact.
      expect(await readForms(bundle)).toEqual([])
      expect(await readCaptureAssets(bundle)).toEqual([])
      expect(await bundle.list()).toEqual([])
      // `capture.json` is the one member a bundle cannot be without, so its
      // absence names the bundle rather than throwing a parse error.
      await expect(readCapture(bundle)).rejects.toThrow(/nothing\.test/)
    })

    it('test_UAT_FC_REQ-155_a_rewritten_member_replaces_rather_than_appends', async () => {
      const store = await backend.makeStore()
      const bundle = store.bundle(NAME)
      await writeL1(bundle, syntheticL1())
      // `1c refold` rewrites `l1.json` and `forms.json` in place against a
      // bundle it did not create; the store must replace, not accumulate.
      await writeL1(bundle, { ...syntheticL1(), widths: [375, 768] })
      expect((await readL1(bundle))?.widths).toEqual([375, 768])
      expect((await bundle.list()).filter((m) => m === L1_MEMBER)).toHaveLength(1)
    })

    it('test_UAT_FC_REQ-155_store_lists_the_bundles_it_holds', async () => {
      const store = await backend.makeStore()
      // Merely asking for a handle must not conjure a bundle into the listing:
      // `bundle()` is total by design, because a capture's first act is to write
      // into one that does not exist yet.
      store.bundle('unwritten.test/index')
      expect(await store.list()).toEqual([])

      await writeL1(store.bundle(NAME), syntheticL1())
      await writeL1(store.bundle('other.test/index'), syntheticL1())
      expect(await store.list()).toEqual(['example.test/pricing', 'other.test/index'])
    })

    it('test_UAT_FC_REQ-155_two_bundles_do_not_bleed_into_each_other', async () => {
      const store = await backend.makeStore()
      const a = store.bundle('a.test/index')
      const b = store.bundle('b.test/index')
      await a.write(RENDERED_MEMBER, new TextEncoder().encode('<html>A</html>'))
      await b.write(RENDERED_MEMBER, new TextEncoder().encode('<html>B</html>'))
      expect(new TextDecoder().decode((await a.read(RENDERED_MEMBER))!)).toBe('<html>A</html>')
      expect(new TextDecoder().decode((await b.read(RENDERED_MEMBER))!)).toBe('<html>B</html>')
      expect(await a.list()).toEqual([RENDERED_MEMBER])
    })

    it('test_UAT_FC_REQ-155_the_ladder_member_is_named_the_same_on_every_adapter', async () => {
      const store = await backend.makeStore()
      const bundle = store.bundle(NAME)
      await writeLadderScreenshots(bundle, [
        { viewport: { width: 768, height: 1024 }, bytes: new Uint8Array([7]) },
      ])
      // The name is what makes a laptop bundle and a cloud bundle the same
      // artifact: `1c diff --size tablet` looks for exactly this key.
      expect(await bundle.list()).toContain(ladderMember(768))
      expect(ladderMember(768)).toBe('screenshot-768.png')
    })
  })
}
