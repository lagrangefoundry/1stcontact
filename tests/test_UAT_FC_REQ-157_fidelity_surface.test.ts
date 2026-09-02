import { describe, expect, it } from 'vitest'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { L1_DECLARATION, L1_INSTANCES } from '../tools/generate/src/cli/ai/toolbox-core'
import {
  FIDELITY_DECLARATION,
  MAX_IMAGE_EDGE,
  fidelityOperations,
  fidelitySurfaceFor,
  isContentBlocks,
} from '../tools/generate/src/cli/ai/fidelity-core'
import type { ContentBlock, FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { ASSETS_PREFIX, bundleNameFor } from '../tools/generate/src/store/reference-store'
import {
  writeBundle,
  writeForms,
  writeHints,
  writeL1,
  writeLadderScreenshots,
  writeMultiState,
} from '../tools/generate/src/cli/capture/bundle'
import { syntheticCapture, syntheticL1, syntheticMultiState } from './support/reference-fixtures'
import { signalsFor } from './support/fake-capture-driver'
import { calls, says } from './support/scripted-model-client'
import { encodePng, decodePng } from '../tools/generate/src/cli/png'
import { computeDiff, cropRaster, downsampleRaster } from '../tools/generate/src/cli/perceptual-core'
import type { Raster } from '../tools/generate/src/cli/perceptual-core'
import { classifyUrl, egressGuard, isPrivateHost } from '../tools/generate/src/cli/capture/egress-guard'
import {
  PERCEPTUAL_MEAN_FLOOR,
  PERCEPTUAL_PCT_FLOOR,
  reconcileGates,
} from '../tools/generate/src/cli/gate'
import type { ReferenceCoverage } from '../tools/generate/src/cli/gate'
import { resolvePicture } from '../tools/generate/src/cli/picture'
import { makeMemorySite } from './support/site-factory'
import { VIEWPORTS } from '../tools/generate/src/cli/capture/screenshot'
import type {
  BrowserDriver,
  CapturedResponse,
  Viewport,
} from '../tools/generate/src/cli/capture/types'

/**
 * REQ-157 — **the fidelity surface: the assistant can look, compare and judge.**
 *
 * WHAT IS REAL HERE AND WHAT IS NOT. The declaration is the shipped one, checked
 * by the framework's OWN validator. The Toolbox is the real one, so parameter
 * validation, capability gating, the manual projection and the audit record are
 * all the production code. The operations are the production operations, over a
 * real `ReferenceStore` and a real `SiteStore`. The tool loop and the Anthropic
 * wire adapter in AC3 are upstream's, driven through `runToolLoop` with an
 * injected `callModel` — which is the same seam the SDK-free `/core` entry point
 * exists to expose.
 *
 * ONE THING IS A DOUBLE: the browser. It is a genuine external boundary reached
 * over a wire protocol, and it is the seam the whole `BrowserDriver` design
 * exists to have injected. Everything on this side of it — picture resolution,
 * the image cap, the diff maths, the reconciliation, the egress policy — is the
 * real thing.
 *
 * WHY THE PICTURES ARE REAL PNGs rather than the 8-byte signature the shared
 * `FakeCaptureDriver` returns. Half of what is under test is what happens to
 * pixels: the cap resamples, `compare` decodes and diffs, and a fixture that
 * cannot be decoded would let every one of those assertions pass vacuously.
 */

// ── real pictures ────────────────────────────────────────────────────────────

/** A solid-colour raster — something with real, predictable pixels. */
function solid(width: number, height: number, rgb: [number, number, number]): Raster {
  const data = new Uint8Array(width * height * 3)
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = rgb[0]
    data[i * 3 + 1] = rgb[1]
    data[i * 3 + 2] = rgb[2]
  }
  return { data, width, height, channels: 3 }
}

/** The same, with a differently-coloured block in one corner. */
function withPatch(
  base: Raster,
  box: { x: number; y: number; w: number; h: number },
  rgb: [number, number, number],
): Raster {
  const out = { ...base, data: new Uint8Array(base.data) }
  for (let y = box.y; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      const i = (y * base.width + x) * 3
      out.data[i] = rgb[0]
      out.data[i + 1] = rgb[1]
      out.data[i + 2] = rgb[2]
    }
  }
  return out
}

const png = (raster: Raster): Promise<Uint8Array> => encodePng(raster)

// ── the one double ───────────────────────────────────────────────────────────

/**
 * A driver that answers a scripted PNG per URL and records what it was asked.
 *
 * It records rather than merely answers because half of what a picture source
 * has to get right is *which URL it built* — a resolver that shot the draft when
 * asked for revision 3 would produce a perfectly valid picture of the wrong
 * thing, and no assertion about the pixels would catch it.
 */
class ScriptedDriver implements BrowserDriver {
  static readonly navigated: string[] = []
  constructor(
    private readonly shots: Map<string, Uint8Array>,
    private readonly fallback: Uint8Array,
  ) {}
  private url = ''
  async navigate(url: string, _viewport?: Viewport): Promise<void> {
    this.url = url
    ScriptedDriver.navigated.push(url)
  }
  async screenshot(_viewport?: Viewport): Promise<Uint8Array> {
    for (const [fragment, bytes] of this.shots) {
      if (this.url.includes(fragment)) return bytes
    }
    return this.fallback
  }
  async query<T>(_script: string): Promise<T> {
    return signalsFor(VIEWPORTS.desktop.width) as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<html><body>scripted</body></html>'
  }
  async close(): Promise<void> {}
}

const BUNDLE = bundleNameFor({ host: 'example.test', path: '/pricing' })
const ORIGIN = 'https://app.example.test'

/** A reference store holding one complete bundle, with `shot` as its screenshot. */
async function seededReferences(shot: Uint8Array, ladder?: Uint8Array) {
  const store = memoryReferenceStore()
  const bundle = store.bundle(BUNDLE)
  await writeBundle(bundle, {
    capture: syntheticCapture(),
    screenshot: shot,
    renderedHtml: '<html><body><h1>Pricing</h1></body></html>',
    rawHtml: '<html><body>raw</body></html>',
    assetBytes: new Map([[`${ASSETS_PREFIX}hero.jpg`, new Uint8Array([9, 9, 9])]]),
  })
  await writeMultiState(bundle, syntheticMultiState())
  await writeL1(bundle, syntheticL1())
  await writeForms(bundle, [])
  await writeHints(bundle, { viewport: VIEWPORTS.mobile, mediaBreakpoints: [], nodes: [] })
  if (ladder) {
    await writeLadderScreenshots(bundle, [{ viewport: VIEWPORTS.desktop, bytes: ladder }])
  }
  return store
}

/** The surface's dependencies, with the browser doubled and nothing else. */
async function deps(
  shots: Map<string, Uint8Array>,
  references: Awaited<ReturnType<typeof seededReferences>>,
  slug: string,
): Promise<FidelityDeps> {
  const fallback = await png(solid(64, 64, [255, 255, 255]))
  return {
    slug,
    origin: ORIGIN,
    references,
    driverFactory: async () => new ScriptedDriver(shots, fallback),
    guardedDriver: (guard) => async () => {
      // The guard is exercised for real: the driver asks it about the URL it is
      // about to navigate, exactly as the two production drivers do at their
      // request seams.
      return new (class extends ScriptedDriver {
        async navigate(url: string, viewport?: Viewport): Promise<void> {
          if (!guard.allow(url)) throw new Error(`refused: ${url}`)
          await super.navigate(url, viewport)
        }
      })(shots, fallback)
    },
  }
}

// ── AC1 — a second surface, composed rather than merged ──────────────────────

describe('REQ-157 AC1 — the fidelity surface is declared as data, alongside the L1 one', () => {
  it('test_UAT_FC_REQ_157_both_declarations_validate_together', async () => {
    // Through the framework's OWN validator, which is the check DOC-30 puts in
    // CI. A declaration that fails here would otherwise fail at session
    // construction, on a deployment, with a turn already in flight.
    const { validateData } = await aiCore()
    const report = validateData([L1_DECLARATION, FIDELITY_DECLARATION], L1_INSTANCES)

    expect(report.problems).toEqual([])
    expect(report.ok).toBe(true)
    // BOTH, and separately. A merged surface would report one.
    expect(report.surfaces.sort()).toEqual(['fidelity', 'l1'])
  })

  it('test_UAT_FC_REQ_157_the_l1_surface_gained_no_fidelity_operation', () => {
    // The claim DOC-30 makes about `l1-surface.json` — that it is the documented
    // way to CHANGE a site — stays true only if nothing here was bolted onto it.
    // Asserted against the declaration rather than by reading the diff.
    const l1Ops = (L1_DECLARATION.operations as { op: string }[]).map((o) => o.op)
    const fidelityOps = (FIDELITY_DECLARATION.operations as { op: string }[]).map((o) => o.op)

    expect(fidelityOps.sort()).toEqual([
      'capture_site',
      'check_fidelity',
      'compare',
      'describe_reference',
      'list_references',
      'screenshot',
    ])
    for (const op of fidelityOps) expect(l1Ops).not.toContain(op)
    expect(L1_DECLARATION.surface).toBe('l1')
    expect(FIDELITY_DECLARATION.surface).toBe('fidelity')
  })

  it('test_UAT_FC_REQ_157_one_toolbox_composes_both_surfaces', async () => {
    const site = makeMemorySite()
    try {
      const lib = await aiCore()
      const references = await seededReferences(await png(solid(32, 32, [10, 20, 30])))
      const box = await createL1Toolbox(
        site.slug,
        {},
        {
          lib,
          store: site.store,
          extraSurfaces: [
            { surface: await fidelitySurfaceFor(lib, await deps(new Map(), references, site.slug)) },
          ],
        },
      )

      // One Toolbox, two surfaces, and the tools of both are offered in one set —
      // which is what "registered alongside rather than merged into" means when
      // the model looks at it.
      const tools = Object.keys(box.schemas())
      expect(tools).toContain('set_l1')
      expect(tools).toContain('screenshot')
      expect(tools).toContain('check_fidelity')
    } finally {
      site.cleanup?.()
    }
  })
})

// ── AC2 — one picture vocabulary, resolved in one place ──────────────────────

describe('REQ-157 AC2 — one picture source, and every operation takes it', () => {
  it('test_UAT_FC_REQ_157_no_operation_carries_its_own_ref_shaped_parameters', () => {
    // The failure this prevents is the CLI's: `--ref`, `--actual`, `--source`,
    // `--size`, `--url` and `--port`, each meaning a picture, each spelled
    // differently per verb. Every parameter that names a picture must be the one
    // declared type; nothing may reintroduce a synonym.
    const ops = FIDELITY_DECLARATION.operations as {
      op: string
      params?: Record<string, { type: string }>
    }[]
    const banned = ['ref', 'actual_image', 'source', 'size', 'port', 'refPng', 'bundleDir']

    for (const op of ops) {
      for (const [name, spec] of Object.entries(op.params ?? {})) {
        expect(banned).not.toContain(name)
        // A picture is named by the declared type or it is not a picture: the
        // three scalar exceptions are a URL to capture and a bundle to describe
        // or judge against, none of which is a picture.
        const scalarExceptions = ['url', 'bundle', 'reference']
        if (!scalarExceptions.includes(name)) expect(spec.type).toBe('picture')
      }
    }
  })

  it('test_UAT_FC_REQ_157_the_picture_type_declares_all_five_kinds', () => {
    const picture = (FIDELITY_DECLARATION.param_types as Record<string, { keys: Record<string, { enum?: string[] }> }>)
      .picture
    expect(picture.keys.kind.enum).toEqual(['reference', 'draft', 'edit', 'revision', 'url'])
    expect(picture.keys.viewport.enum).toEqual(['mobile', 'tablet', 'desktop'])
  })

  it('test_UAT_FC_REQ_157_all_five_kinds_resolve_through_the_one_function', async () => {
    // The claim is that ONE function turns any of the five into pixels. Asserted
    // by resolving all five through it and checking each produced the picture it
    // was asked for — including, for the three that navigate, that the URL built
    // was the right one. A resolver that shot the draft when asked for revision 3
    // would otherwise pass every assertion about the bytes.
    const refShot = await png(solid(40, 40, [1, 2, 3]))
    const references = await seededReferences(refShot)
    const shots = new Map([
      ['/draft/', await png(solid(40, 40, [10, 10, 10]))],
      ['/edit/', await png(solid(40, 40, [20, 20, 20]))],
      ['/rev-3/', await png(solid(40, 40, [30, 30, 30]))],
      ['other.test', await png(solid(40, 40, [40, 40, 40]))],
    ])
    const d = await deps(shots, references, 'studio')
    ScriptedDriver.navigated.length = 0

    const resolved = await Promise.all([
      resolvePicture({ kind: 'reference', bundle: BUNDLE }, d),
      resolvePicture({ kind: 'draft', page: '/' }, d),
      resolvePicture({ kind: 'edit', page: '/about' }, d),
      resolvePicture({ kind: 'revision', revision: 3 }, d),
      resolvePicture({ kind: 'url', url: 'https://other.test/x' }, d),
    ])

    // Five distinct pictures, not one picture five times.
    const firstPixels = await Promise.all(
      resolved.map(async (r) => (await decodePng(r.bytes, r.label)).data[0]),
    )
    expect(firstPixels).toEqual([1, 10, 20, 30, 40])

    // And each of the four that navigates built the URL its kind names.
    expect(ScriptedDriver.navigated).toEqual([
      `${ORIGIN}/preview/studio/draft/`,
      `${ORIGIN}/preview/studio/edit/about`,
      `${ORIGIN}/preview/studio/rev-3/`,
      'https://other.test/x',
    ])
  })

  it('test_UAT_FC_REQ_157_a_kind_missing_its_field_is_refused_by_name', async () => {
    const references = await seededReferences(await png(solid(8, 8, [0, 0, 0])))
    const d = await deps(new Map(), references, 'studio')
    // Which field a kind needs is a cross-field rule no per-key declaration can
    // express, so it is enforced here — and the refusal has to name the field,
    // or the model can only guess again.
    await expect(resolvePicture({ kind: 'revision' }, d)).rejects.toThrow(/needs 'revision'/)
    await expect(resolvePicture({ kind: 'reference' }, d)).rejects.toThrow(/needs 'bundle'/)
  })
})

// ── AC3 — an image content block reaches the backend ─────────────────────────

describe('REQ-157 AC3 — screenshot returns an image the model can see', () => {
  it('test_UAT_FC_REQ_157_an_image_content_block_reaches_the_backend', async () => {
    // THE LOAD-BEARING TEST OF THIS TICKET, and it is written the way the ticket
    // demands: it asserts what the BACKEND WAS HANDED, not what the operation
    // returned. Asserting that a key or a URL came back would satisfy nothing.
    //
    // The tool loop and the wire adapter are UPSTREAM'S, driven through the
    // SDK-free `/core` entry point with an injected `callModel`. So what is
    // under test is the real path from an operation's return value to the bytes
    // on an Anthropic request — which is precisely the thing the ticket said had
    // to be settled before the operations were built.
    const core = await aiCore()
    const references = await seededReferences(await png(solid(60, 40, [200, 30, 30])))
    const ops = fidelityOperations(await deps(new Map(), references, 'studio'))

    const tool = new core.Tool(
      'screenshot',
      'take a picture',
      { properties: {}, required: [] },
      (input: Record<string, unknown>) => ops.screenshot(input),
    )
    const executor = new core.ToolSet(null, [tool])
    const wire = new core.AnthropicWire()
    const state = { messages: [] as unknown[] }

    // THE WIRE PROTOCOL IS TRANSCRIBED IN EXACTLY ONE PLACE (BUG-39), so the
    // model's two turns come from the shared double's own `calls` and `says`
    // rather than from block events written out again here. A second copy is a
    // copy of a contract that lives upstream, and the next change to it would
    // update whichever copies its author happened to find.
    const script = [calls('screenshot', { of: { kind: 'reference', bundle: BUNDLE } }), says('I can see it.')]
    let turn = 0
    const callModel = async () => {
      const step = script[Math.min(turn, script.length - 1)]
      turn += 1
      const events = step({ system: '', messages: [], tools: [] })
      return (async function* () {
        for (const event of events) yield event
      })()
    }

    for await (const _event of core.runToolLoop({
      wire,
      callModel,
      state,
      executor,
      toolNames: ['screenshot'],
    })) {
      // drained: the loop's own events are not what this asserts on
    }

    // The tool result the wire adapter recorded, as it would go on the request.
    const toolResult = (state.messages as { role: string; content: unknown }[])
      .filter((m) => m.role === 'user')
      .flatMap((m) => (Array.isArray(m.content) ? m.content : []))
      .find((b) => (b as { type?: string }).type === 'tool_result') as {
      content: ContentBlock[]
    }

    expect(toolResult).toBeDefined()
    // AN ARRAY OF BLOCKS, not a string. A string here is the whole failure this
    // ticket exists to avoid: it means the picture was described, not shown.
    expect(Array.isArray(toolResult.content)).toBe(true)
    const image = toolResult.content.find((b) => b.type === 'image')
    expect(image).toBeDefined()
    expect(image).toMatchObject({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png' },
    })
    // Real bytes, and the ones the operation actually produced.
    const data = (image as { source: { data: string } }).source.data
    expect(data.length).toBeGreaterThan(100)
    expect(atob(data.slice(0, 12)).startsWith('\x89PNG')).toBe(true)

    // The text block travels with it, so a transcript that has had the bytes
    // redacted out still says what was looked at.
    const text = toolResult.content.find((b) => b.type === 'text') as { text: string }
    expect(text.text).toContain(BUNDLE)
    expect(text.text).toMatch(/\d+×\d+/)
  })

  it('test_UAT_FC_REQ_157_a_large_picture_is_reduced_before_the_model_sees_it', async () => {
    // The cap is what makes inline delivery affordable: the same value the model
    // sees is appended to the durable transcript as a `tool` record and carried
    // across every recycle, so an uncapped full-page shot would poison a session.
    const tall = await png(solid(2400, 300, [12, 34, 56]))
    const references = await seededReferences(tall)
    const ops = fidelityOperations(await deps(new Map(), references, 'studio'))

    const blocks = (await ops.screenshot({
      of: { kind: 'reference', bundle: BUNDLE },
    })) as ContentBlock[]

    expect(isContentBlocks(blocks)).toBe(true)
    const image = blocks.find((b) => b.type === 'image') as {
      source: { data: string }
    }
    const decoded = await decodePng(
      Uint8Array.from(atob(image.source.data), (c) => c.charCodeAt(0)),
      'reduced',
    )
    expect(Math.max(decoded.width, decoded.height)).toBeLessThanOrEqual(MAX_IMAGE_EDGE)
    // Reduced, not cropped: the aspect ratio survives, so the model is looking at
    // the whole page rather than the top-left corner of it.
    expect(decoded.width / decoded.height).toBeCloseTo(2400 / 300, 1)
    // And it says so, because a silently-resampled picture is one whose
    // measurements cannot be trusted against anything else.
    const text = blocks.find((b) => b.type === 'text') as { text: string }
    expect(text.text).toContain('reduced from 2400×300')
  })

  it('test_UAT_FC_REQ_157_downsampling_averages_rather_than_samples', () => {
    // A unit test, because this is the one piece of genuinely fiddly arithmetic
    // and a UAT over it would only observe that the picture came back smaller.
    // Nearest-neighbour on antialiased text shimmers, and a model asked to judge
    // fidelity reads shimmer as a rendering defect that is not there.
    const checker = withPatch(solid(4, 4, [0, 0, 0]), { x: 0, y: 0, w: 2, h: 2 }, [255, 255, 255])
    const half = downsampleRaster(checker, 2)
    expect(half.width).toBe(2)
    expect(half.height).toBe(2)
    // The top-left destination pixel covers four white source pixels; its
    // neighbour covers four black ones. An averaging filter says so exactly.
    expect(half.data[0]).toBe(255)
    expect(half.data[3]).toBe(0)
    // An image already inside the bound is returned unchanged, not resampled.
    expect(downsampleRaster(checker, 8)).toBe(checker)
  })
})

// ── AC4 — compare agrees with `1c diff` ──────────────────────────────────────

describe('REQ-157 AC4 — compare returns the verdict the CLI returns', () => {
  it('test_UAT_FC_REQ_157_compare_matches_the_cli_diff_for_the_same_pair', async () => {
    // The claim is equality with `1c diff`'s verdict for the equivalent
    // invocation, so this computes the CLI's answer from the same two images
    // through the same core the CLI uses — `cropRaster` to the common rectangle,
    // then `computeDiff` — and requires the surface to produce it exactly.
    //
    // Recomputing rather than calling `cmdDiff` is deliberate: `cmdDiff` writes
    // heatmaps and crop triptychs to a directory, which is the half of it that
    // has no meaning on this surface and no filesystem in a Worker. What is
    // shared is the verdict, and the verdict is what is compared.
    const base = solid(80, 60, [30, 60, 90])
    const changed = withPatch(base, { x: 10, y: 10, w: 24, h: 24 }, [200, 60, 90])
    const refPng = await png(base)
    const actualPng = await png(changed)

    const references = await seededReferences(refPng)
    const shots = new Map([['/draft/', actualPng]])
    const ops = fidelityOperations(await deps(shots, references, 'studio'))

    const got = (await ops.compare({
      a: { kind: 'reference', bundle: BUNDLE },
      b: { kind: 'draft' },
    })) as {
      size: { width: number; height: number }
      meanDifference: number
      percentDifferent: number
      bands: number[]
      regions: { rank: number; area: { x: number; y: number; w: number; h: number } }[]
    }

    const [ra, rb] = await Promise.all([decodePng(refPng, 'ref'), decodePng(actualPng, 'actual')])
    const w = Math.min(ra.width, rb.width)
    const h = Math.min(ra.height, rb.height)
    const expected = computeDiff(cropRaster(ra, w, h), cropRaster(rb, w, h))

    expect(got.size).toEqual({ width: w, height: h })
    expect(got.meanDifference).toBe(expected.meanDiff)
    expect(got.percentDifferent).toBe(expected.pctOverThreshold)
    expect(got.bands).toEqual(expected.bands)
    expect(got.regions.map((r) => r.rank)).toEqual(expected.regions.map((r) => r.id))
    expect(got.regions.map((r) => r.area)).toEqual(expected.regions.map((r) => r.bbox))
    // The patch is genuinely found, so the equality above is not two agreeing
    // empty answers.
    expect(got.regions.length).toBeGreaterThan(0)
    expect(got.meanDifference).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ_157_compare_crops_to_the_common_rectangle', async () => {
    // A reproduction is rarely exactly as tall as its reference. Refusing on
    // that basis would make the operation useless on the case it is most for, so
    // both sides are anchored top-left and cropped — and `size` says what was
    // actually compared, rather than leaving the caller to assume.
    const references = await seededReferences(await png(solid(100, 200, [0, 0, 0])))
    const shots = new Map([['/draft/', await png(solid(80, 150, [0, 0, 0]))]])
    const ops = fidelityOperations(await deps(shots, references, 'studio'))

    const got = (await ops.compare({
      a: { kind: 'reference', bundle: BUNDLE },
      b: { kind: 'draft' },
    })) as { size: { width: number; height: number }; meanDifference: number }

    expect(got.size).toEqual({ width: 80, height: 150 })
    expect(got.meanDifference).toBe(0)
  })

  it('test_UAT_FC_REQ_157_compare_takes_any_two_kinds', async () => {
    // "Anything against anything" is a claim about the ARGUMENTS. Two pictures
    // neither of which is a reference is the case that would break if any verb
    // had kept a `--ref`-shaped parameter.
    const references = await seededReferences(await png(solid(20, 20, [0, 0, 0])))
    const shots = new Map([
      ['/draft/', await png(solid(20, 20, [0, 0, 0]))],
      ['/rev-2/', await png(solid(20, 20, [255, 255, 255]))],
    ])
    const ops = fidelityOperations(await deps(shots, references, 'studio'))

    const got = (await ops.compare({
      a: { kind: 'revision', revision: 2 },
      b: { kind: 'draft' },
    })) as { a: string; b: string; meanDifference: number }

    expect(got.a).toContain('revision 2')
    expect(got.b).toContain('draft')
    expect(got.meanDifference).toBe(255)
  })
})

// ── AC6 — the egress policy ──────────────────────────────────────────────────

describe('REQ-157 AC6 — capture_site refuses what it must, and says so', () => {
  it('test_UAT_FC_REQ_157_private_and_link_local_space_is_refused', () => {
    // The address that matters most is the cloud metadata endpoint: it answers
    // instance credentials to an unauthenticated GET, and it is reachable by
    // four spellings that a check written around "10." and "192.168." misses.
    for (const host of [
      '169.254.169.254',
      '127.0.0.1',
      '10.0.0.5',
      '192.168.1.1',
      '172.16.4.4',
      '100.64.0.1',
      'localhost',
      'db.internal',
      'printer.local',
      '::1',
      '[::ffff:169.254.169.254]',
      '[fe80::1]',
      '[fd00::1]',
    ]) {
      expect(isPrivateHost(host)).toBe(true)
    }
    // And ordinary public names are not caught by it — a guard that refused
    // everything would pass the assertions above and be useless.
    for (const host of ['example.com', 'notlocalhost.com', '8.8.8.8', '93.184.216.34']) {
      expect(isPrivateHost(host)).toBe(false)
    }
  })

  it('test_UAT_FC_REQ_157_each_refusal_names_its_reason', () => {
    expect(classifyUrl('http://169.254.169.254/latest/meta-data/')).toMatchObject({
      reason: 'private-address',
    })
    expect(classifyUrl('file:///etc/passwd')).toMatchObject({ reason: 'scheme' })
    expect(classifyUrl('data:text/html,<script>')).toMatchObject({ reason: 'scheme' })
    // A URL carrying a password is refused rather than stripped: whoever put it
    // there meant it to be sent, and sending it to a host a model chose is not a
    // thing to do quietly.
    expect(classifyUrl('https://user:pw@example.com/')).toMatchObject({ reason: 'credentials' })
    expect(classifyUrl('https://example.com/fine')).toBeNull()
  })

  it('test_UAT_FC_REQ_157_the_guard_caps_redirects_and_size_and_records_both', () => {
    // The caps are properties of a whole navigation, not of any one request,
    // which is why the guard is stateful and why one belongs to one capture.
    const guard = egressGuard({ maxRedirects: 2, maxBytes: 100 })
    expect(guard.allow('https://a.test/')).toBe(true)
    expect(guard.allow('https://a.test/style.css')).toBe(true) // same origin: not a hop
    expect(guard.allow('https://b.test/')).toBe(true)
    expect(guard.allow('https://c.test/')).toBe(false)
    expect(guard.tripped).toBe(true)
    expect(guard.refusals.map((r) => r.reason)).toContain('redirect-cap')

    const sized = egressGuard({ maxBytes: 100 })
    sized.record(60)
    expect(sized.tripped).toBe(false)
    sized.record(60)
    expect(sized.tripped).toBe(true)
    expect(sized.refusals.map((r) => r.reason)).toContain('response-cap')
    // Once tripped it stays tripped: a capture that has blown its budget must
    // not limp on and return a half-loaded page as though it were the page.
    expect(sized.allow('https://a.test/')).toBe(false)
  })

  it('test_UAT_FC_REQ_157_a_refused_capture_is_journalled_with_its_url', async () => {
    const references = await seededReferences(await png(solid(8, 8, [0, 0, 0])))
    const ops = fidelityOperations(await deps(new Map(), references, 'studio'))

    // The refusal reaches the model as an error naming the address, and the
    // audit record the Toolbox writes carries the same URL — which is what makes
    // "the URL and the refusal are journalled" true rather than aspirational.
    await expect(ops.capture_site({ url: 'http://169.254.169.254/' })).rejects.toThrow(
      /REFUSED.*169\.254\.169\.254/s,
    )
  })

  it('test_UAT_FC_REQ_157_the_audit_record_carries_the_refused_url', async () => {
    // Through the real Toolbox, because the audit record is the Toolbox's and
    // asserting on it anywhere else would be asserting on a copy.
    const site = makeMemorySite()
    try {
      const lib = await aiCore()
      const references = await seededReferences(await png(solid(8, 8, [0, 0, 0])))
      const lines: { operation: string; params: Record<string, unknown>; outcome: { ok: boolean } }[] = []
      const box = await createL1Toolbox(
        site.slug,
        {},
        {
          lib,
          store: site.store,
          audit: (record) => lines.push(record.asObject() as never),
          extraSurfaces: [
            { surface: await fidelitySurfaceFor(lib, await deps(new Map(), references, site.slug)) },
          ],
        },
      )

      const answer = await box.run('capture_site', { url: 'http://10.0.0.1/admin' })
      expect(String(answer)).toMatch(/REFUSED|private/i)

      const record = lines.find((l) => l.operation === 'capture_site')
      expect(record).toBeDefined()
      expect(record!.params.url).toBe('http://10.0.0.1/admin')
      expect(record!.outcome.ok).toBe(false)
    } finally {
      site.cleanup?.()
    }
  })
})

// ── AC7 — the consultant is granted it, and told ──────────────────────────────

describe('REQ-157 AC7 — the consultant has the surface and its manual says so', () => {
  it('test_UAT_FC_REQ_157_the_manual_describes_what_it_can_now_do', async () => {
    const site = makeMemorySite()
    try {
      const lib = await aiCore()
      const references = await seededReferences(await png(solid(8, 8, [0, 0, 0])))
      const box = await createL1Toolbox(
        site.slug,
        {},
        {
          lib,
          store: site.store,
          extraSurfaces: [
            { surface: await fidelitySurfaceFor(lib, await deps(new Map(), references, site.slug)) },
          ],
        },
      )

      // The manual is PROJECTED from the declaration and the grant, so this
      // asserts that the grant reached it — not that a sentence was written.
      const manual = box.manual() as string
      expect(manual).toContain('screenshot')
      expect(manual).toContain('check_fidelity')
      expect(manual).toContain('capture_site')
      // The surface's own framing, which is what tells the model these are ways
      // of looking rather than more ways of editing.
      expect(manual).toMatch(/Looking and judging|This is how you \*\*see\*\*|how you \*\*see\*\*/)
      // And the untrusted-content rule reaches it, because everything a capture
      // returns is a third party's writing.
      expect(manual.toLowerCase()).toContain('untrusted')
    } finally {
      site.cleanup?.()
    }
  })

  it('test_UAT_FC_REQ_157_the_grant_is_local_and_lives_beside_the_l1_one', () => {
    // The knowledge grant travels with its surface because its two scope axes
    // must name the same set. This one has no such coupling, so it is an
    // ordinary entry — and a reviewer looking for what the consultant can do
    // finds all of it in one file.
    const consultant = L1_INSTANCES.consultant as Record<string, { groups: string[] }>
    expect(consultant.fidelity).toEqual({ groups: ['SeeSite'] })
    expect(consultant.l1.groups).toContain('AuthorPages')
  })
})

// ── AC8 — nothing here can change a site ─────────────────────────────────────

describe('REQ-157 AC8 — no operation on this surface can change a site', () => {
  it('test_UAT_FC_REQ_157_every_declared_operation_is_a_read', () => {
    // The first half of the claim, and the one the Toolbox enforces: effect
    // gating happens before invocation, so an operation declared `read` cannot
    // reach a write even if its implementation tried.
    const ops = FIDELITY_DECLARATION.operations as { op: string; effect: string }[]
    for (const op of ops) expect(op.effect).toBe('read')
    const groups = FIDELITY_DECLARATION.groups as { group: string; effect: string }[]
    for (const group of groups) expect(group.effect).toBe('read')
  })

  it('test_UAT_FC_REQ_157_running_every_operation_leaves_the_change_counter_where_it_was', async () => {
    // The second half, and the one the ticket asks for by name: ASSERTED, not
    // asserted-by-inspection. Every operation the surface has is run against a
    // real store and the site's own change counter is read either side. Anything
    // that wrote — through `edit.ts` or around it — moves that number.
    const site = makeMemorySite()
    try {
      const refPng = await png(solid(40, 40, [7, 7, 7]))
      const references = await seededReferences(refPng, refPng)
      const shots = new Map([['/draft/', refPng]])
      const ops = fidelityOperations(await deps(shots, references, site.slug))

      const before = await site.store.counter(site.slug)

      await ops.list_references({})
      await ops.describe_reference({ bundle: BUNDLE })
      await ops.screenshot({ of: { kind: 'reference', bundle: BUNDLE } })
      await ops.compare({
        a: { kind: 'reference', bundle: BUNDLE },
        b: { kind: 'reference', bundle: BUNDLE },
      })
      // `capture_site` is included through its refusal path, which is the only
      // one that does not need a live network — and a refusal is still a call
      // that ran, which is what this is checking.
      await ops.capture_site({ url: 'http://127.0.0.1/' }).catch(() => undefined)

      expect(await site.store.counter(site.slug)).toBe(before)
    } finally {
      site.cleanup?.()
    }
  })

  it('test_UAT_FC_REQ_157_the_surface_declares_no_slug_parameter', () => {
    // Bound to one site at construction, exactly as the L1 surface is. There is
    // therefore no value for a model to get wrong and no predicate to refuse it —
    // strictly stronger than a scope axis, and the reason a picture of kind
    // `draft` cannot be a picture of somebody else's draft.
    const ops = FIDELITY_DECLARATION.operations as {
      params?: Record<string, { type: string; keys?: Record<string, unknown> }>
    }[]
    for (const op of ops) {
      expect(Object.keys(op.params ?? {})).not.toContain('slug')
      expect(Object.keys(op.params ?? {})).not.toContain('site')
    }
    const picture = (FIDELITY_DECLARATION.param_types as Record<string, { keys: Record<string, unknown> }>).picture
    expect(Object.keys(picture.keys)).not.toContain('slug')
  })
})

// ── AC5 — check_fidelity reproduces the gate's reconciliation ────────────────

describe('REQ-157 AC5 — check_fidelity names which of the five verdicts applies', () => {
  it('test_UAT_FC_REQ_157_check_fidelity_runs_the_real_reconciliation', async () => {
    // End to end through the surface, over a real bundle: the structural gate,
    // the coverage proxies, the perceptual diff and the value gates all run, and
    // what comes back is `reconcileGates`' own report rather than a summary of
    // it. Identical pictures on both sides, so the perceptual floor is not
    // breached and the verdict is decided by the structural gate.
    const shot = await png(solid(40, 40, [7, 7, 7]))
    const references = await seededReferences(shot, shot)
    const ops = fidelityOperations(await deps(new Map([['/draft/', shot]]), references, 'studio'))

    const report = (await ops.check_fidelity({
      actual: { kind: 'draft' },
      reference: BUNDLE,
    })) as {
      verdict: string
      diagnosis: string
      nextStep: string
      pass: boolean
      floor: { mean: number; pct: number }
      perceptual: { meanDiff: number; pctOverThreshold: number; regions: number }
      values: { deltas: number; matched: number; unmatched: number }
      coverage: { mirroredImages: number; referencedImages: number; sections: number }
    }

    // One of the five, never anything else — the closed set is what makes the
    // verdict actionable rather than advisory.
    expect([
      'pass',
      'structural-failure',
      'capture-incomplete',
      'reproduction-wrong',
      'unexplained-disagreement',
    ]).toContain(report.verdict)
    // Every field the CLI's report carries, so a caller reading this is reading
    // the gate rather than a précis of it.
    expect(report.diagnosis).toBeTruthy()
    expect(report.nextStep).toBeTruthy()
    expect(report.floor).toEqual({ mean: PERCEPTUAL_MEAN_FLOOR, pct: PERCEPTUAL_PCT_FLOOR })
    // The pictures are identical, so the eye is clean and the perceptual floor
    // cannot be what decided this.
    expect(report.perceptual.meanDiff).toBe(0)
    expect(report.perceptual.pctOverThreshold).toBe(0)
    // The value gates and the coverage proxies genuinely ran.
    expect(report.values).toHaveProperty('deltas')
    expect(report.values).toHaveProperty('matched')
    // The coverage proxies read the bundle rather than the page: the one asset
    // the fixture mirrored is counted, which is what says `referenceCoverage`
    // ran over this bundle rather than returning an empty shell.
    expect(report.coverage.mirroredImages).toBe(1)
    expect(report.coverage).toHaveProperty('unreferencedImages')
    expect(report.coverage).toHaveProperty('pxPerSection')
  })

  it('test_UAT_FC_REQ_157_the_reference_side_is_read_at_the_viewport_the_actual_side_asked_for', async () => {
    // A page can be right at one width and wrong at another, so comparing a
    // mobile reproduction against a desktop reference would manufacture a
    // failure that is entirely the gate's own doing. The reference picture must
    // follow the actual one's viewport.
    const desktop = await png(solid(40, 40, [1, 1, 1]))
    const references = await seededReferences(desktop)
    const bundle = references.bundle(BUNDLE)
    await writeLadderScreenshots(bundle, [
      { viewport: VIEWPORTS.mobile, bytes: await png(solid(40, 40, [2, 2, 2])) },
      { viewport: VIEWPORTS.desktop, bytes: await png(solid(40, 40, [3, 3, 3])) },
    ])
    const d = await deps(new Map(), references, 'studio')

    const mobile = await resolvePicture({ kind: 'reference', bundle: BUNDLE, viewport: 'mobile' }, d)
    const wide = await resolvePicture({ kind: 'reference', bundle: BUNDLE, viewport: 'desktop' }, d)

    expect((await decodePng(mobile.bytes, 'm')).data[0]).toBe(2)
    expect((await decodePng(wide.bytes, 'd')).data[0]).toBe(3)
    expect(mobile.label).toContain('mobile')
  })

  it('test_UAT_FC_REQ_157_a_bundle_without_a_ladder_member_falls_back_and_says_so', async () => {
    // A bundle captured before the viewport ladder existed still has a
    // full-page shot, and reading it beats refusing a comparison the operator
    // can plainly see is possible. But a comparison against a fallback must
    // never be mistaken for one against the right width, so the label says which
    // it was.
    const references = await seededReferences(await png(solid(40, 40, [4, 4, 4])))
    const d = await deps(new Map(), references, 'studio')

    const picture = await resolvePicture({ kind: 'reference', bundle: BUNDLE, viewport: 'mobile' }, d)
    expect((await decodePng(picture.bytes, 'f')).data[0]).toBe(4)
    expect(picture.label).toContain('no mobile ladder member')
  })

  it('test_UAT_FC_REQ_157_each_of_the_five_verdicts_is_reachable_and_carries_its_own_next_step', () => {
    // The five causes are the whole reason this operation exists rather than
    // `compare` alone, and each implies a DIFFERENT action — so the test that
    // matters is that they are distinguishable, not merely that they are typed.
    //
    // Driven through `reconcileGates`, which is the pure function
    // `check_fidelity` and `1c gate` both call: the reconciliation is shared by
    // construction, so this pins the causes without pinning a second copy.
    const clean: ReferenceCoverage = {
      mirroredImages: 3,
      referencedImages: 3,
      unreferencedImages: [],
      sections: 6,
      pageHeightPx: 4000,
      pxPerSection: 666,
      findings: [],
    }
    const suspect: ReferenceCoverage = {
      ...clean,
      referencedImages: 0,
      unreferencedImages: ['assets/hero.jpg', 'assets/logo.png', 'assets/x.png'],
      findings: [{ kind: 'unreferenced-image', detail: '3 mirrored images are referenced by nothing' }],
    }
    const quiet = { meanDiff: 1, pctOverThreshold: 1, regions: [] }
    const loud = { meanDiff: 90, pctOverThreshold: 80, regions: [{}, {}] }
    // `deltas` is the delta LIST, not a count — `reconcileGates` reads its
    // length, so a number here would silently read as zero and two of the five
    // causes would be unreachable.
    const noDeltas = { deltas: [], matched: 40, unmatched: 0 }
    const deltas = {
      deltas: [{ property: 'color' }, { property: 'fontSizePx' }] as never,
      matched: 30,
      unmatched: 2,
    }

    const verdicts = {
      pass: reconcileGates({ l1Gate: { pass: true }, coverage: clean, perceptual: quiet, values: noDeltas }),
      structural: reconcileGates({ l1Gate: { pass: false }, coverage: clean, perceptual: quiet, values: noDeltas }),
      incomplete: reconcileGates({ l1Gate: { pass: true }, coverage: suspect, perceptual: loud, values: noDeltas }),
      wrong: reconcileGates({ l1Gate: { pass: true }, coverage: clean, perceptual: loud, values: deltas }),
      unexplained: reconcileGates({ l1Gate: { pass: true }, coverage: clean, perceptual: loud, values: noDeltas }),
    }

    expect(verdicts.pass.verdict).toBe('pass')
    expect(verdicts.structural.verdict).toBe('structural-failure')
    expect(verdicts.incomplete.verdict).toBe('capture-incomplete')
    expect(verdicts.wrong.verdict).toBe('reproduction-wrong')
    expect(verdicts.unexplained.verdict).toBe('unexplained-disagreement')

    // The disagreement case is the one nothing else catches: the value gates are
    // clean and the picture is 80% wrong, because they can only compare what is
    // present on both sides and the capture never recorded the imagery. An
    // assistant told only "no deltas" would work a reference that was never
    // valid.
    // The report COUNTS them, where the input carries the list — asserted on the
    // count because that is what a caller reads.
    expect(verdicts.incomplete.values.deltas).toBe(0)
    expect(verdicts.wrong.values.deltas).toBe(2)
    expect(verdicts.incomplete.perceptual.pctOverThreshold).toBe(80)

    // Five causes, five different next steps — the field is what the model acts
    // on, so two causes sharing one sentence would make the distinction useless.
    const steps = Object.values(verdicts).map((v) => v.nextStep)
    expect(new Set(steps).size).toBe(steps.length)
  })
})
