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
  writeL1,
  writeLadderScreenshots,
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
import { syntheticCapture, syntheticL1 } from './reference-fixtures'

/**
 * Reconciliation UATs for story-0cb7f25b — the five acceptance criteria that say
 * "…identically on every backing", written once and run against every one.
 *
 * WHY A MODULE RATHER THAN A TEST FILE. The story states the constraint outright:
 * *"no single suite can hold both the filesystem backing (node only) and the
 * cloud one (workerd only)"*. The two live in different Vitest projects with
 * different pools, so "one contract, three backings" is not something a
 * `describe.each` can express — the backings do not share a runtime. What they
 * can share is this: the assertions themselves, imported by both projects'
 * suites and registered against whatever store each can build.
 *
 * That is a stronger claim than two files agreeing, because there is nothing to
 * keep in step. A backing that answers differently fails in its own project with
 * the same assertion text.
 *
 * IT ASSERTS THROUGH THE BUNDLE CODEC, NOT AGAINST RAW BYTES. What these ACs
 * promise is that a member written through one backing reads back as the same
 * *artifact* through another — "a bundle written by the laptop and one written
 * by the cloud are the same artifact, member for member". Asserting
 * `bundle.read('capture.json')` byte-wise would prove the store echoes bytes and
 * prove nothing about the artifact.
 */

/** One backing under test, plus the one thing only the filesystem can stage. */
export interface ReferenceBundleStoreUnderTest {
  store: ReferenceStore
  /**
   * AC-1770's filesystem-only clause: put a loose file at the references root
   * and a bare host directory with no captures under it, so the listing can be
   * asserted to ignore both. Absent on backings where neither shape exists —
   * a store with no directories has no bare host directory to stage.
   */
  seedNonBundles?(): Promise<void>
}

/** What a suite hands this module: a name, and a way to make an empty store. */
export interface ReferenceBundleBackend {
  name: string
  /**
   * Build a store with nothing in it.
   *
   * Async because two of the three backings have to await something to exist,
   * and a contract that only fitted the synchronous one would be a contract
   * shaped around the filesystem.
   */
  makeStore(): Promise<ReferenceBundleStoreUnderTest>
}

const NAME = bundleNameFor({ host: 'example.test', path: '/pricing' })
const OTHER = bundleNameFor({ host: 'other.test', path: '/' })

/** The PNG signature — what "reads back as an image" means at the byte level. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47]

function png(...tail: number[]): Uint8Array {
  return new Uint8Array([...PNG_SIGNATURE, 0x0d, 0x0a, 0x1a, 0x0a, ...tail])
}

export function registerReferenceBundleContract(backend: ReferenceBundleBackend): void {
  describe(`story-0cb7f25b — bundle storage contract on the ${backend.name} backing`, () => {
    it('test_UAT_AC1768_absent_members_are_answers_except_the_capture_record', async () => {
      const { store } = await backend.makeStore()
      const bundle = store.bundle('nothing.test/index')

      // A bundle predating a member is the ordinary case — REQ-48, REQ-83 and
      // REQ-93 each added one to the artifact over time — so reading a member the
      // bundle does not hold succeeds and reports absence rather than raising.
      expect(await bundle.read(MULTISTATE_MEMBER)).toBeNull()
      expect(await readMultiState(bundle)).toBeNull()
      expect(await readL1(bundle)).toBeNull()
      expect(await readHints(bundle)).toBeNull()

      // Two deliberate exceptions, because empty is the honest reading of "this
      // page has no behaviours" and "this page mirrored no remote media" — not a
      // missing artifact.
      expect(await readForms(bundle)).toEqual([])
      expect(await readCaptureAssets(bundle)).toEqual([])

      // Enumerating an empty bundle yields nothing at all.
      expect(await bundle.list()).toEqual([])

      // `capture.json` is the one member a bundle cannot be without, so its
      // absence is refused BY NAME rather than failing on a parse of nothing.
      await expect(readCapture(bundle)).rejects.toThrow(/nothing\.test\/index/)
      await expect(readCapture(bundle)).rejects.toThrow(/capture\.json/)
    })

    it('test_UAT_AC1769_a_rewritten_member_replaces_rather_than_accumulating', async () => {
      const { store } = await backend.makeStore()
      const bundle = store.bundle(NAME)

      await writeL1(bundle, syntheticL1())
      // `1c refold` rewrites `l1.json` and `forms.json` in place against a bundle
      // it did not create, so a store that accumulated would leave the bundle
      // holding two answers to the same question.
      await writeL1(bundle, { ...syntheticL1(), widths: [375, 768] })

      expect((await bundle.list()).filter((member) => member === L1_MEMBER)).toHaveLength(1)
      expect((await readL1(bundle))?.widths).toEqual([375, 768])
    })

    it('test_UAT_AC1770_the_store_lists_only_the_bundles_that_hold_something', async () => {
      const { store, seedNonBundles } = await backend.makeStore()

      // An empty (or entirely absent) store lists nothing rather than failing.
      expect(await store.list()).toEqual([])

      // Taking a handle is free and total — a capture's first act is to write into
      // a bundle that does not yet exist — so merely asking for one must not
      // conjure it into the listing.
      store.bundle('unwritten.test/index')
      expect(await store.list()).toEqual([])

      await writeL1(store.bundle(NAME), syntheticL1())
      await writeL1(store.bundle(OTHER), syntheticL1())
      expect(await store.list()).toEqual([OTHER, NAME].sort())

      // On the operator's tree specifically, only two-segment `<host>/<slug>`
      // pairs are bundles: a loose file at the references root and a bare host
      // directory with no captures under it are not listed.
      if (seedNonBundles) {
        await seedNonBundles()
        expect(await store.list()).toEqual([OTHER, NAME].sort())
      }
    })

    it('test_UAT_AC1771_members_enumerate_sorted_and_forward_slashed_and_narrow_by_prefix', async () => {
      const { store } = await backend.makeStore()
      const bundle = store.bundle(NAME)
      await writeBundle(bundle, {
        capture: syntheticCapture(),
        screenshot: png(),
        renderedHtml: '<html><body><h1>Pricing</h1></body></html>',
        rawHtml: '<html><body>raw</body></html>',
        assetBytes: new Map([
          [`${ASSETS_PREFIX}hero.jpg`, new Uint8Array([1])],
          [`${ASSETS_PREFIX}css2`, new Uint8Array([2])],
        ]),
      })

      const all = await bundle.list()
      for (const member of [CAPTURE_MEMBER, SCREENSHOT_MEMBER, RENDERED_MEMBER, RAW_MEMBER]) {
        expect(all, `enumeration is missing ${member}`).toContain(member)
      }
      // Including the nested `assets/<name>` keys, which are the only members
      // whose key has a separator in it at all.
      expect(all).toContain(`${ASSETS_PREFIX}hero.jpg`)

      // Sorted…
      expect(all).toEqual([...all].sort())
      // …and forward-slashed regardless of the host's separator. A member key is a
      // key inside the artifact, not a filesystem path, so two backings must not
      // enumerate the same bundle differently.
      for (const member of all) expect(member).not.toContain('\\')

      // Narrowing to the asset prefix returns exactly the mirrored subresources
      // and nothing else, sorted. This is the verb the port exists for:
      // `reextract` rewrites absolute URLs only for the subresources the bundle
      // actually holds, and a bundle's asset set is recorded nowhere else.
      expect(await listAssets(bundle)).toEqual([
        `${ASSETS_PREFIX}css2`,
        `${ASSETS_PREFIX}hero.jpg`,
      ])
    })

    it('test_UAT_AC1774_a_ladder_screenshot_is_retrievable_by_width_and_an_unshot_width_is_absent', async () => {
      const { store } = await backend.makeStore()
      const bundle = store.bundle(NAME)
      await writeLadderScreenshots(bundle, [
        { viewport: { width: 768, height: 1024 }, bytes: png(0x68) },
      ])

      // Asked for by WIDTH, never by composing a location.
      const shot = await readLadderScreenshot(bundle, 768)
      expect(shot).not.toBeNull()
      expect([...shot!.slice(0, 4)]).toEqual(PNG_SIGNATURE)

      // A width the ladder was never shot at reports absence, so a size-aware
      // comparison fails loudly rather than silently falling back to the desktop
      // shot and reporting a fidelity verdict against the wrong image.
      expect(await readLadderScreenshot(bundle, 999)).toBeNull()

      // The member is named `screenshot-<width>.png` on every backing, because
      // that name is what makes a locally written and a cloud written bundle the
      // same artifact.
      expect(ladderMember(768)).toBe('screenshot-768.png')
      expect(await bundle.list()).toContain('screenshot-768.png')
    })
  })
}
