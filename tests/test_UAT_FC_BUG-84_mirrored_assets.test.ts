/**
 * BUG-84 — a capture-mirrored picture cannot reach a site's assets.
 *
 * WHAT WENT WRONG. `promoteToSiteAsset` refuses to put a capture-sourced
 * picture on a site, because doing that publishes third-party copyright under
 * the client's own domain. It enforces that by reading `republishable` off the
 * material's own record. The seed/push door has no record to read: `1c repro`
 * mirrors a captured page's subresources into
 * `storage/sites/<slug>/draft/assets/` so the reproduction renders from its own
 * media, `1c push` copies whatever is in that directory up, and nothing along
 * the way mints a ticket. So the gate had nothing to consult and a third
 * party's photograph went straight past it.
 *
 * WHY THE ASSERTIONS ARE ABOUT BYTES. The copy into the draft directory
 * destroys every other link back to the capture — the member arrives under its
 * own basename in a directory that records nothing — so the content hash is the
 * only evidence that survives it. `test_UAT_FC_BUG-84_the_refusal_is_about_the
 * _bytes_not_the_name` is the one that makes that a claim rather than a comment:
 * the same bytes under a different name are still refused, and different bytes
 * under the captured name are not.
 *
 * THIS IS THE HALF THAT SEES THE REPORTED CASE. The gigabytealchemy capture was
 * taken on the operator's own disk and was never adopted into any tenant's
 * cloud store, so the Worker-side gate (its own suite, `.workers.test.ts`) would
 * have found nothing to match. Both halves exist because neither sees the
 * other's captures.
 */
import { describe, expect, it } from 'vitest'
import { pushSite, readSitePayload } from '../tools/generate/src/cli/push'
import { MirroredAssetError } from '../tools/generate/src/store/asset-rights'
import { memorySiteStore } from '../tools/generate/src/store/memory-store'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { ASSETS_PREFIX } from '../tools/generate/src/store/reference-store'
import type { ReferenceStore } from '../tools/generate/src/store/reference-store'

/** The mirrored photograph, as a capture would hold it. */
const PHOTO = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4, 5, 6, 7, 8])
/** A file of the client's own, byte-different from anything captured. */
const OWN = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 9, 9, 9, 9])

/** A store holding one site with the given assets on its draft. */
function siteWith(assets: Record<string, Uint8Array>, slug = 'demo') {
  const store = memorySiteStore()
  store.seed(slug, { siteJson: { name: slug }, pages: { index: { kind: 'page' } }, assets })
  return store
}

/** A reference store holding one capture that mirrored `members`. */
async function capturedSite(
  members: Record<string, Uint8Array>,
  name = 'gigabytealchemy.ai/index',
): Promise<ReferenceStore> {
  const references = memoryReferenceStore()
  const bundle = references.bundle(name)
  // The capture record itself, so the bundle is a bundle rather than a bag of
  // assets — the gate must not depend on reading it, and this is what proves it
  // is not accidentally scanning it.
  await bundle.write('capture.json', new TextEncoder().encode('{"host":"gigabytealchemy.ai"}'))
  for (const [member, bytes] of Object.entries(members)) {
    await bundle.write(`${ASSETS_PREFIX}${member}`, bytes)
  }
  return references
}

/** A `fetch` that records every request and always answers as the import route would. */
function recordingFetch() {
  const calls: string[] = []
  const impl = ((url: string) => {
    calls.push(url)
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"pages":1,"assets":1,"siteJson":true}'),
    })
  }) as unknown as typeof fetch
  return { impl, calls }
}

describe('BUG-84 — the seed/push door has a rights gate', () => {
  it('test_UAT_FC_BUG-84_a_capture_mirrored_asset_cannot_be_pushed', async () => {
    // The reported instance, reduced: a subresource mirrored from a captured
    // third-party page sits in the draft's assets because `1c repro` put it
    // there, and `1c push` would have copied it onto a client's site with no
    // rights record and no gate. It is refused, and the refusal names the asset
    // AND the bundle member it mirrors — told only that a push failed, the
    // operator has a directory of files and no idea which one is the problem.
    const references = await capturedSite({ 'AlchemistLabWithTech.png': PHOTO })
    const store = siteWith({ 'AlchemistLabWithTech.png': PHOTO })

    const failure = await pushSite(store, 'demo', {
      origin: 'http://localhost:8788',
      references,
      fetch: recordingFetch().impl,
    }).catch((err: unknown) => err)

    expect(failure).toBeInstanceOf(MirroredAssetError)
    const refused = failure as MirroredAssetError
    expect(refused.asset).toBe('AlchemistLabWithTech.png')
    expect(refused.bundle).toBe('gigabytealchemy.ai/index')
    expect(refused.member).toBe('assets/AlchemistLabWithTech.png')
    expect(refused.message).toContain('republish')
  })

  it('test_UAT_FC_BUG-84_nothing_is_posted_when_the_push_is_refused', async () => {
    // BEFORE THE WIRE, not after a rejection. A gate that let the bytes upload
    // and then complained would have already put a third party's photograph in
    // somebody else's storage — which is the act, not a step towards it.
    const references = await capturedSite({ 'hero.jpg': PHOTO })
    const store = siteWith({ 'hero.jpg': PHOTO })
    const { impl, calls } = recordingFetch()

    await expect(
      pushSite(store, 'demo', { origin: 'http://localhost:8788', references, fetch: impl }),
    ).rejects.toBeInstanceOf(MirroredAssetError)
    expect(calls).toEqual([])
  })

  it('test_UAT_FC_BUG-84_the_refusal_is_about_the_bytes_not_the_name', async () => {
    // The copy into `draft/assets/` destroys every link back to the capture but
    // the bytes, so the bytes are what the gate reads. Both directions are
    // asserted because either alone would pass against a name test: the SAME
    // bytes renamed are still refused, and DIFFERENT bytes under the captured
    // name are let through.
    const references = await capturedSite({ 'AlchemistLabWithTech.png': PHOTO })

    const renamed = await readSitePayload(
      siteWith({ 'banner.png': PHOTO }),
      references,
      'demo',
    ).catch((err: unknown) => err)
    expect(renamed).toBeInstanceOf(MirroredAssetError)
    expect((renamed as MirroredAssetError).asset).toBe('banner.png')

    const collision = await readSitePayload(
      siteWith({ 'AlchemistLabWithTech.png': OWN }),
      references,
      'demo',
    )
    expect(collision.assets.map((a) => a.name)).toEqual(['AlchemistLabWithTech.png'])
  })

  it('test_UAT_FC_BUG-84_every_mirrored_subresource_counts_not_only_pictures', async () => {
    // A third party's stylesheet or licensed webfont republished on a client's
    // domain is the same act as their photograph, and the real draft this bug
    // was found in holds three of them beside the picture. The gate reads the
    // bundle's `assets/` prefix rather than a file type, so there is no
    // per-type carve-out to get wrong.
    const font = new Uint8Array([0x77, 0x4f, 0x46, 0x32, 4, 4])
    const references = await capturedSite({ '8vIJ7ww63mVu7gt79mT7PkRXMw.woff2': font })

    await expect(
      readSitePayload(siteWith({ '8vIJ7ww63mVu7gt79mT7PkRXMw.woff2': font }), references, 'demo'),
    ).rejects.toBeInstanceOf(MirroredAssetError)
  })

  it('test_UAT_FC_BUG-84_a_clean_draft_still_pushes', async () => {
    // The gate must be exactly discriminating or it is a gate nobody can ship
    // behind. A site whose assets are the client's own passes untouched, with
    // its payload intact, even while the operator's reference store holds
    // captures — which is the real shape of this repository's own `storage/`.
    const references = await capturedSite({ 'AlchemistLabWithTech.png': PHOTO })
    const { impl, calls } = recordingFetch()

    const result = await pushSite(siteWith({ 'logo.png': OWN }), 'demo', {
      origin: 'http://localhost:8788',
      references,
      fetch: impl,
    })
    expect(result.assets).toEqual(['logo.png'])
    expect(calls).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-84_no_captures_and_no_assets_are_both_ordinary', async () => {
    // Two absences that must stay cheap and silent rather than becoming a third
    // state a caller has to reason about: an operator who has never captured
    // anything, and a site with no assets at all.
    const noCaptures = await readSitePayload(
      siteWith({ 'logo.png': OWN }),
      memoryReferenceStore(),
      'demo',
    )
    expect(noCaptures.assets).toHaveLength(1)

    const noAssets = await readSitePayload(
      siteWith({}),
      await capturedSite({ 'AlchemistLabWithTech.png': PHOTO }),
      'demo',
    )
    expect(noAssets.assets).toEqual([])
  })
})
