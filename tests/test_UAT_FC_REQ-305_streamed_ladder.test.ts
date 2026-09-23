import { describe, expect, it } from 'vitest'
import {
  buildImageLadder,
  imageLadder,
  LadderTooHeavyError,
  LadderTooLargeError,
  LADDER_CONCURRENCY,
  LADDER_MAX_RENDITIONS,
  LADDER_MAX_SOURCE_BYTES,
  type ImageSizer,
  type LadderBuildOptions,
} from '../tools/generate/src/publish/ladder'
import { publishSite } from '../tools/generate/src/publish/publish'
import type { RenditionSink } from '../tools/generate/src/store/revision-model'
import type { SiteStore } from '../tools/generate/src/store/site-store'
import { memorySiteStore } from '../tools/generate/src/store'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { siteSeed } from './support/site-seed'
import { ladderSource } from './support/ladder-source'

/**
 * REQ-305 — the ladder streams its renditions, and refuses on bytes.
 *
 * WHAT THE FAILURE WAS. `buildImageLadder` accumulated every rendition into one
 * map and held the lot until the revision was written. Thirteen renditions for a
 * full-ladder photograph, twenty to forty photographs on a photo-heavy site, and
 * a 128 MB isolate: the publish died most of the way through with a platform
 * error naming nothing the client did. The guard that existed —
 * {@link LADDER_MAX_RENDITIONS}, derived carefully from the subrequest budget —
 * admitted a site roughly an order of magnitude past where memory ran out, so it
 * never fired. It was a good guard against a failure that is not the one that
 * occurs.
 *
 * WHAT EACH CLAIM BELOW IS WORTH, and why it is observed the way it is:
 *
 *   - BOUNDEDNESS IS OBSERVED AS BOUNDEDNESS, not inferred from the absence of a
 *     map. The sizer and the sink together account for every rendition buffer
 *     between the moment it exists and the moment it has been written, so the
 *     test can state the PEAK — which is the quantity the isolate cares about —
 *     and compare it to the site's whole ladder. A test that only asserted the
 *     build returns paths would pass on an implementation that kept the bytes
 *     somewhere else.
 *   - A REFUSAL IS ONLY WORTH ANYTHING IF NOTHING WAS TOUCHED. So the refusals
 *     below assert on what was NOT asked: no measurement, no transform, and no
 *     destination opened. "It threw" is the cheap half.
 *   - THE MANIFEST MUST NOT HAVE MOVED. Streaming changes where bytes go and must
 *     change nothing a page carries, so the manifest is asserted to be identical
 *     with and without a sink — the one comparison that can catch the manifest
 *     having quietly become a function of the write.
 */

/** A rendition's size in the fakes below — one number, so the arithmetic is legible. */
const RENDITION_BYTES = 64 * 1024

/** A picture wide enough to earn every rung, in both formats. */
const WIDE = { width: 4000, height: 2000 }

/**
 * A sizer whose renditions are real buffers, and an account of what is live.
 *
 * `live` IS THE WHOLE INSTRUMENT. It rises when `resize` hands a buffer to the
 * ladder and falls when the sink reports that buffer written — which is exactly
 * the window in which the ladder is the only thing holding it. `peak` is
 * therefore the most rendition memory this build ever occupied, which is the
 * quantity [[REQ-305]] is about and the one a count of renditions cannot see.
 */
function accountedSizer(size = WIDE) {
  const state = { live: 0, peak: 0, written: 0, measured: 0, resized: 0 }
  const sizer: ImageSizer = {
    measure: async () => {
      state.measured += 1
      return size
    },
    resize: async (_bytes, _type, width) => {
      state.resized += 1
      const bytes = new Uint8Array(RENDITION_BYTES)
      // The width is written into the buffer so two renditions are not the same
      // object — a fake that returned one shared array would make the peak a
      // measurement of nothing.
      bytes[0] = width % 256
      state.live += RENDITION_BYTES
      state.peak = Math.max(state.peak, state.live)
      return bytes
    },
  }
  /** The sink the ladder is given: it records the write and releases the buffer. */
  const sink: RenditionSink = async (path, bytes) => {
    expect(bytes.length).toBe(RENDITION_BYTES)
    state.written += 1
    expect(path.startsWith('assets/d/')).toBe(true)
    // A real sink awaits a bucket or a disk. Yielding here is what lets several
    // jobs be in the window at once, so the peak is a peak and not a sequence.
    await new Promise((resolve) => setTimeout(resolve, 0))
    state.live -= RENDITION_BYTES
  }
  return { sizer, sink, state }
}

/** `count` distinct pictures, each cheap on disk and expensive to ladder. */
function pictures(count: number, bytesEach = 32) {
  return Array.from({ length: count }, (_, i) => ({
    name: `photo${i}.jpg`,
    // Distinct bytes, so each gets its own content address.
    bytes: new Uint8Array(bytesEach).fill(i % 256),
  }))
}

/** Pictures whose total source weight is `total` bytes, in `count` of them. */
function heavyPictures(count: number, total: number) {
  const each = Math.ceil(total / count)
  return Array.from({ length: count }, (_, i) => {
    const bytes = new Uint8Array(each)
    bytes[0] = i % 256
    return { name: `heavy${i}.jpg`, bytes }
  })
}

/**
 * `buildImageLadder` over pictures a case is holding ([[REQ-304]]).
 *
 * The ladder takes a LISTING and a reader rather than the site's bytes, so a
 * case that invents pictures says so once here instead of at every call.
 */
async function buildFrom(
  assets: readonly { name: string; bytes: Uint8Array }[],
  sizer: ImageSizer,
  opts?: LadderBuildOptions,
): ReturnType<typeof buildImageLadder> {
  return buildImageLadder(await ladderSource(assets), sizer, opts)
}

describe('REQ-305 a rendition is written and released, never accumulated', () => {
  it('test_UAT_FC_REQ-305_holds_no_more_rendition_bytes_than_its_concurrency_allows', async () => {
    const { sizer, sink, state } = accountedSizer()
    const build = await buildFrom(pictures(30), sizer, { open: async () => sink })

    // THE SITE'S LADDER IS LARGE: thirty pictures at thirteen rungs each.
    expect(state.written).toBe(390)
    const whole = state.written * RENDITION_BYTES

    // AND THE PEAK IS A HANDFUL OF THEM. This is the ticket in one assertion: the
    // memory a ladder occupies is bounded by how many renditions are in flight —
    // which `LADDER_CONCURRENCY` already bounds — and not by how many the site
    // needs. Before this change the peak WAS `whole`, and `whole` here is 24 MB
    // against a 128 MB isolate for a site of thirty pictures.
    expect(state.peak).toBeLessThanOrEqual(LADDER_CONCURRENCY * RENDITION_BYTES)
    expect(state.peak).toBeLessThan(whole / 10)

    // AND NOTHING WAS RETAINED TO GET THERE. What the build reports is the set of
    // PATHS that landed, which is what deciding the manifest actually needed.
    expect(build.landed.size).toBe(390)
    for (const path of build.landed) expect(typeof path).toBe('string')
  })

  it('test_UAT_FC_REQ-305_the_sink_receives_exactly_the_renditions_the_manifest_names', async () => {
    const seen: string[] = []
    const { sizer } = accountedSizer()
    const build = await buildFrom(pictures(2), sizer, {
      open: async () => async (path) => {
        seen.push(path)
      },
    })

    // A `srcset` candidate the bucket does not hold is a 404 on the one request
    // the page cannot recover from, so the two sets are asserted to be one set.
    const named = Object.values(build.manifest).flatMap((entry) => [
      ...entry.renditions.filter((r) => r.src.startsWith('assets/d/')).map((r) => r.src),
      ...(entry.sources ?? []).flatMap((s) => s.renditions.map((r) => r.src)),
    ])
    expect(seen.sort()).toEqual([...build.landed].sort())
    expect(seen.sort()).toEqual(named.sort())
  })

  it('test_UAT_FC_REQ-305_a_rung_that_would_not_render_is_never_written', async () => {
    const seen: string[] = []
    const sizer: ImageSizer = {
      measure: async () => WIDE,
      // The 640 rung of every format fails, as an undecodable rung does.
      resize: async (_bytes, _type, width) =>
        width === 640 ? null : new Uint8Array(RENDITION_BYTES),
    }
    const build = await buildFrom(pictures(1), sizer, {
      open: async () => async (path) => {
        seen.push(path)
      },
    })
    // Dropped from the write as well as from the manifest: a sink asked to store
    // a null would be a rendition of nothing at a path a page might name.
    expect(seen.some((p) => p.includes('-640.'))).toBe(false)
    expect(seen.length).toBe(11)
    expect([...build.landed].sort()).toEqual(seen.sort())
  })

  it('test_UAT_FC_REQ-305_the_manifest_is_identical_whether_or_not_a_sink_is_open', async () => {
    // WHERE THE BYTES GO IS NOT ALLOWED TO CHANGE WHAT A PAGE CARRIES. Content and
    // ordering both: the order of `sources` is the browser's selection mechanism,
    // so a manifest that agreed on membership and not on order would be a
    // different site.
    const written = await buildFrom(pictures(3), accountedSizer().sizer, {
      open: async () => async () => {},
    })
    const bare = await buildFrom(pictures(3), accountedSizer().sizer)
    expect(written.manifest).toEqual(bare.manifest)
    expect(JSON.stringify(written.manifest)).toBe(JSON.stringify(bare.manifest))
  })
})

describe('REQ-305 a publish that would exhaust memory is refused in the site’s terms', () => {
  /** An `open` that records whether it was ever asked for. */
  function watchedOpen(): LadderBuildOptions & { opens: number } {
    const state = { opens: 0 }
    return {
      get opens() {
        return state.opens
      },
      open: async (): Promise<RenditionSink> => {
        state.opens += 1
        return async () => {}
      },
    }
  }

  it('test_UAT_FC_REQ-305_refuses_a_site_whose_pictures_weigh_more_than_a_publish_can_hold', async () => {
    const heavy = heavyPictures(5, LADDER_MAX_SOURCE_BYTES + 1024 * 1024)
    const { sizer, state } = accountedSizer()
    const watched = watchedOpen()

    const err = await buildFrom(heavy, sizer, watched).catch((e) => e)
    expect(err).toBeInstanceOf(LadderTooHeavyError)

    // IT NAMES THE SITE'S OWN FACTS AND A REMEDY THE CLIENT CAN CARRY OUT, because
    // those are the things they can act on and a memory budget is not.
    expect(err.message).toContain('5 pictures')
    expect(err.message).toContain((err.bytes / (1024 * 1024)).toFixed(1))
    expect(err.message).toContain((LADDER_MAX_SOURCE_BYTES / (1024 * 1024)).toFixed(1))
    expect(err.message).toContain('Removing some pictures')
    expect(err.limit).toBe(LADDER_MAX_SOURCE_BYTES)
    expect(err.pictures).toBe(5)

    // AND NOTHING WAS TOUCHED. Not a measurement, not a transform, and no
    // destination opened — the refusal is upstream of the platform being asked
    // anything at all, which is what makes it free and what makes it safe.
    expect(state.measured).toBe(0)
    expect(state.resized).toBe(0)
    expect(watched.opens).toBe(0)
  })

  it('test_UAT_FC_REQ-305_weighs_the_pictures_and_not_the_whole_asset_library', async () => {
    // A document on the same site weighs on the same isolate, but it is not
    // something this module decided to do anything with — and a refusal blaming a
    // client's photographs for a PDF's weight would name a remedy that does not
    // work. So the ceiling counts what the ladder will actually carry.
    const brochure = {
      name: 'brochure.pdf',
      bytes: new Uint8Array(LADDER_MAX_SOURCE_BYTES + 1024 * 1024),
    }
    const { sizer, sink } = accountedSizer()
    const build = await buildFrom([brochure, ...pictures(1)], sizer, {
      open: async () => sink,
    })
    expect(Object.keys(build.manifest)).toEqual(['photo0.jpg'])
  })

  it('test_UAT_FC_REQ-305_keeps_the_subrequest_ceiling_and_reports_the_one_a_site_meets_first', async () => {
    // BOTH LIMITS ARE REAL AND A SITE CAN MEET EITHER. A site of many tiny
    // pictures is nowhere near the weight ceiling and still asks for more
    // renditions than one request can carry, so the subrequest guard is what
    // refuses it — kept, not replaced.
    const many = pictures(Math.ceil(LADDER_MAX_RENDITIONS / 13) + 1)
    const light = await buildFrom(many, accountedSizer().sizer).catch((e) => e)
    expect(light).toBeInstanceOf(LadderTooLargeError)

    // AND A SITE OVER BOTH IS TOLD THE FACT THAT WAS GOING TO KILL IT. Weight is
    // checked first because it costs nothing to compute and because it is the
    // ceiling that actually fires.
    const both = heavyPictures(200, LADDER_MAX_SOURCE_BYTES * 2)
    const heavy = await buildFrom(both, accountedSizer().sizer).catch((e) => e)
    expect(heavy).toBeInstanceOf(LadderTooHeavyError)
  })
})

describe('REQ-305 the publish opens one destination, and a refused publish opens none', () => {
  /** A site holding `assets`, over the in-memory adapter. */
  function siteWith(assets: Record<string, Uint8Array>) {
    const seed = siteSeed({
      pages: {
        'home.json': {
          ...starterHomePage('home'),
          l1: {
            widths: [320, 1280],
            root: {
              kind: 'box',
              children: Object.keys(assets).map((name) => ({
                kind: 'image',
                src: `/assets/${name}`,
                alt: name,
                sizing: { width: { mode: 'fluid' } },
              })),
            },
          },
        },
      },
      assets,
    })
    const store = memorySiteStore()
    store.seed(seed.slug, { siteJson: seed.siteJson, pages: seed.pages, assets: seed.assets })
    return { store, slug: seed.slug }
  }

  /** The store, with the order of its revision lifecycle recorded. */
  function recorded(store: SiteStore): { store: SiteStore; log: string[] } {
    const log: string[] = []
    const wrapped: SiteStore = {
      ...store,
      async beginRevision(site, id) {
        log.push(`begin:${id}`)
        const sink = await store.beginRevision(site, id)
        return async (path, bytes) => {
          log.push('rendition')
          await sink(path, bytes)
        }
      },
      async writeRevision(site, entry, content) {
        log.push(`revision:${entry.id}`)
        await store.writeRevision(site, entry, content)
      },
    }
    return { store: wrapped, log }
  }

  it('test_UAT_FC_REQ-305_opens_the_destination_once_before_the_first_rendition_and_before_the_revision', async () => {
    const seeded = siteWith({ 'hero.jpg': new Uint8Array(64).fill(7) })
    const { store, log } = recorded(seeded.store)
    const { sizer } = accountedSizer()
    const result = await publishSite(store, seeded.slug, { ladder: imageLadder(sizer) })
    expect(result.published).toBe(true)

    // THE LIFECYCLE, IN ORDER: the destination is opened, the renditions are
    // written into it, and the revision that makes them reachable lands last.
    expect(log.filter((e) => e.startsWith('begin:'))).toEqual(['begin:1'])
    expect(log[0]).toBe('begin:1')
    expect(log[log.length - 1]).toBe('revision:1')
    expect(log.filter((e) => e === 'rendition').length).toBeGreaterThan(0)

    // AND THE RENDITIONS ARE IN THE REVISION THE PUBLISH MINTED, at the paths the
    // pages name — the sink's destination and the manifest's are the same place.
    const derived = seeded.store.derivedRevision(seeded.slug, result.id) ?? new Map()
    const html = seeded.store.renderedRevision(seeded.slug, result.id)?.get('home.html') ?? ''
    for (const candidate of /srcset="([^"]+)"/.exec(html)![1].split(', ')) {
      const src = candidate.split(' ')[0]
      if (!src.startsWith('assets/d/')) continue
      expect(derived.has(src), src).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-305_a_publish_with_no_ladder_still_opens_exactly_one_destination', async () => {
    // The destination has ONE lifecycle whether or not this deployment can build
    // renditions. A publish that sometimes prepared and sometimes did not would
    // be two lifecycles wearing one name.
    const seeded = siteWith({ 'hero.jpg': new Uint8Array(64).fill(7) })
    const { store, log } = recorded(seeded.store)
    await publishSite(store, seeded.slug, {})
    expect(log).toEqual(['begin:1', 'revision:1'])
  })

  it('test_UAT_FC_REQ-305_a_publish_refused_by_weight_leaves_no_revision_and_opens_nothing', async () => {
    const heavy = heavyPictures(4, LADDER_MAX_SOURCE_BYTES + 1024 * 1024)
    const seeded = siteWith(Object.fromEntries(heavy.map((p) => [p.name, p.bytes])))
    const { store, log } = recorded(seeded.store)
    const { sizer } = accountedSizer()

    await expect(
      publishSite(store, seeded.slug, { ladder: imageLadder(sizer) }),
    ).rejects.toBeInstanceOf(LadderTooHeavyError)

    // INSIDE THE PUBLISH'S OWN PROMISE: no revision, no history entry, no byte of
    // output, and no destination opened — exactly as an invalid draft leaves it.
    expect(log).toEqual([])
    expect(await store.revisions(seeded.slug)).toEqual([])
    expect(await store.nextRevision(seeded.slug)).toBe(1)
    expect(seeded.store.derivedRevision(seeded.slug, 1)).toBeNull()
  })

  it('test_UAT_FC_REQ-305_a_republish_reports_nothing_outstanding_and_names_the_same_renditions', async () => {
    // A REPUBLISH IS THE COMMON CASE AND MUST STAY QUIET. Every rendition is
    // already held, so the denominator is zero and the builder has nothing to warn
    // about — a client shown "this will take a minute" every time has been taught
    // to ignore the one time it means something.
    const seeded = siteWith({ 'hero.jpg': new Uint8Array(64).fill(7) })
    const first = await buildFrom([{ name: 'hero.jpg', bytes: new Uint8Array(64).fill(7) }], accountedSizer().sizer)

    const frames: { total: number; done: number }[] = []
    const { sizer, sink } = accountedSizer()
    const republish = await buildFrom(
      [{ name: 'hero.jpg', bytes: new Uint8Array(64).fill(7) }],
      { ...sizer, held: async () => true },
      { open: async () => sink, onProgress: (p) => frames.push(p) },
    )
    expect(frames).toEqual([{ total: 0, done: 0 }])
    expect(republish.manifest).toEqual(first.manifest)
    expect([...republish.landed].sort()).toEqual([...first.landed].sort())
  })
})
