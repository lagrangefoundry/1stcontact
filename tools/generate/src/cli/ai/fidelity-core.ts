/**
 * REQ-157 — the fidelity surface: the assistant can look, compare and judge.
 *
 * A SECOND SURFACE, NOT MORE OPERATIONS ON THE FIRST. `l1-surface.json` is the
 * L1 **control** surface — the documented way to *change a site* ([[DOC-30]]).
 * Nothing here changes a site: capturing, shooting, comparing and judging are
 * all read-only with respect to it. Bolting them onto the L1 surface would make
 * that document's own claim about itself false, so this is declared, granted and
 * composed separately — the knowledge surface is the working precedent, and
 * `createL1Toolbox` now takes a LIST because two extra surfaces is no longer a
 * hypothetical.
 *
 * THE SAME SPLIT AS `toolbox-core.ts`: `fidelity-surface.json` carries every
 * sentence the model reads and this file carries none. What is here is the
 * bridge from a declared operation to the functions that already do the work —
 * `cmdCapturePage`, `computeDiff`, `reconcileGates` — none of which was written
 * for a model and none of which changed to accommodate one.
 *
 * WHY EVERY VERB IS PORT-SHAPED. The three tickets under this one
 * ([[REQ-154]], [[REQ-155]], [[REQ-156]]) exist so that capture, storage and the
 * image layer have no filesystem and no native code in them. This file is what
 * that was for: it takes a {@link ReferenceStore}, a {@link BrowserDriverFactory}
 * and an origin, and it runs unchanged on a laptop and in a Worker.
 */
import type { ReferenceStore } from '../../store/reference-store'
import { ASSETS_PREFIX, CAPTURE_MEMBER } from '../../store/reference-store'
import { cmdCapturePage } from '../capture/capture'
import { readCapture } from '../capture/bundle'
import { flattenCapture, flattenSignals, diffManifests } from '../capture/values-diff'
import { EXTRACT_SCRIPT } from '../capture/extract'
import type { RawSignals } from '../capture/extract'
import type { Capture, BrowserDriverFactory } from '../capture/types'
import type { ValueManifest } from '../capture/values-diff'
import { computeDiff, cropRaster, downsampleRaster } from '../perceptual-core'
import type { Raster } from '../perceptual-core'
import { decodePng, encodePng } from '../png'
// FROM `gate-core`, NOT `gate` — the split REQ-157 made and the reason it made
// it. `../gate` is the `1c gate` command: it obtains its inputs from `cmdDiff`
// and `cmdValuesDiff` and writes `gate.json`, so importing it here would pull
// `node:fs`, a loopback server and Playwright into the Worker's graph. The
// reconciliation itself needs none of them, and this is the same reconciliation
// the command runs.
import { cmdL1Gate, referenceCoverage, reconcileGates } from '../gate-core'
import { pictureUrl, resolvePicture, PictureNotFoundError, PictureSourceError } from '../picture'
import type { PictureDeps, PictureSource, ResolvedPicture } from '../picture'
import { assertPublicUrl, egressGuard, UrlRefusedError } from '../capture/egress-guard'
import type { EgressRefusal } from '../capture/egress-guard'
import fidelitySurface from './fidelity-surface.json'

/** The declaration, imported as data for the reason `toolbox-core.ts` gives. */
export const FIDELITY_DECLARATION: Record<string, unknown> = fidelitySurface as Record<
  string,
  unknown
>

/** This surface's own version, read the same way the L1 surface's is. */
export const FIDELITY_SURFACE_VERSION = Number(FIDELITY_DECLARATION.surface_version)

/**
 * The longest edge, in pixels, any image this surface hands the model may have.
 *
 * WHY THERE IS A CAP AT ALL, and why it is here rather than in the caller. The
 * value the model sees is the same value the host yields as tool activity, which
 * the session manager appends as a `tool` record — a CONTENT record, so it is
 * drained into the durable transcript and carried forward on every recycle.
 * Upstream redacts images in `turn_start` and has no equivalent for tool
 * records, so an uncapped full-page screenshot of a long page would put megabytes
 * of base64 into the session file and into every subsequent turn's context.
 *
 * WHY THIS COSTS NOTHING WORTH HAVING. The provider downscales anything with an
 * edge over ~1568px before the model sees it regardless, so pixels above that
 * are spent and never read. 1024 is comfortably inside that and leaves a
 * desktop-width page legible. Fine detail is what {@link compare} is for — it
 * measures the full-resolution rasters and is not capped, because its result is
 * a handful of numbers.
 */
export const MAX_IMAGE_EDGE = 1024

/**
 * The ceiling on an encoded image, after reduction. A picture over it is
 * refused rather than sent: a silently-dropped image is a model that believes it
 * looked at something it did not.
 */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024

/** The media type every picture this surface returns is encoded as. */
export const IMAGE_MEDIA_TYPE = 'image/png'

// ── the content blocks a tool result may carry ───────────────────────────────

/**
 * An Anthropic content block, as a tool result may carry them.
 *
 * WHY THIS IS THE RETURN TYPE OF AN OPERATION. The transport was already open
 * and needed nothing built: this host registers its tools as closures, and
 * upstream's `ToolSet.run` returns a closure handler's value **unmodified** —
 * only the Toolbox path serializes to a string. So an array of blocks is carried
 * straight through `ToolOutcome` into `AnthropicWire.record`, which puts it on
 * the wire as the `tool_result`'s `content`. The alternative — return a handle
 * and have the host attach the image to the NEXT turn's user message — also
 * works, and costs a turn per look, which is a turn per iteration of the exact
 * loop this surface exists to enable.
 *
 * The text block is not decoration. A transcript that has had the image data
 * redacted out of it still needs to say what was looked at, and an operator
 * reading the activity line needs the same sentence.
 */
export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

/** Whether a value is the block array an image-returning operation produces. */
export function isContentBlocks(value: unknown): value is ContentBlock[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (b) => b !== null && typeof b === 'object' && typeof (b as { type?: unknown }).type === 'string',
    )
  )
}

/**
 * Base64 without `Buffer`, which is Node's and does not exist in workerd.
 *
 * Chunked because `String.fromCharCode(...bytes)` on a multi-megabyte array
 * overflows the argument limit — a failure that appears only on large images,
 * which is to say only on the ones this is for.
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/**
 * Reduce a picture to something a model can be handed, and say what it became.
 *
 * Re-encoded rather than passed through whenever the reduction did anything, so
 * the bytes the model receives are the bytes the dimensions describe.
 */
async function imageBlocks(picture: ResolvedPicture): Promise<{
  blocks: ContentBlock[]
  width: number
  height: number
  reduced: boolean
}> {
  const raster = await decodePng(picture.bytes, picture.label)
  const reduced = downsampleRaster(raster, MAX_IMAGE_EDGE)
  const bytes = reduced === raster ? picture.bytes : await encodePng(reduced)
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new PictureSourceError(
      `that picture is ${bytes.length} bytes after reduction, over the ${MAX_IMAGE_BYTES}-byte ` +
        `ceiling. Take it at a narrower viewport, or compare instead of looking.`,
    )
  }
  const note =
    `${picture.label} — ${reduced.width}×${reduced.height}` +
    (reduced === raster ? '' : ` (reduced from ${raster.width}×${raster.height})`)
  return {
    blocks: [
      { type: 'text', text: note },
      {
        type: 'image',
        source: { type: 'base64', media_type: IMAGE_MEDIA_TYPE, data: bytesToBase64(bytes) },
      },
    ],
    width: reduced.width,
    height: reduced.height,
    reduced: reduced !== raster,
  }
}

// ── the operations ───────────────────────────────────────────────────────────

/** Validated arguments, as the Toolbox hands them over. See `toolbox-core.ts`. */
type Params = Record<string, unknown>

/** One operation implementation, keyed by the `op` the declaration names. */
export type FidelityOperations = Record<string, (params: Params) => unknown>

/** What the surface needs from its host — the runtime, named at the edge. */
export interface FidelityDeps extends PictureDeps {
  /**
   * A driver factory built around a fresh {@link EgressGuard}, for the one verb
   * that fetches a URL a model chose.
   *
   * SEPARATE FROM `driverFactory` DELIBERATELY. The guard is stateful and its
   * budgets belong to one capture; a single guarded factory shared across a
   * session would let one capture's traffic refuse the next one's. The host
   * builds a new one per call and hands its refusals back.
   */
  guardedDriver(guard: ReturnType<typeof egressGuard>): BrowserDriverFactory
}

/**
 * Every declared operation, bound to one site and one store.
 *
 * BOUND AT CONSTRUCTION, exactly as the L1 surface is: no operation declares a
 * `slug`, so there is no value for a model to get wrong and no predicate to
 * refuse it. A picture of kind `draft` is a picture of *this* site's draft, and
 * there is no way to say otherwise.
 */
export function fidelityOperations(deps: FidelityDeps): FidelityOperations {
  const references = deps.references

  /** Read a bundle's capture record, refusing by name when it is not there. */
  async function captureOf(name: string): Promise<Capture> {
    const capture = await readCapture(references.bundle(name))
    if (!capture) {
      throw new PictureNotFoundError(
        `no reference called '${name}'. Use list_references to see what has been captured.`,
      )
    }
    return capture
  }

  /**
   * The value manifest of a live page — the `actual` side of the value gates.
   *
   * The same three steps `1c values-diff` takes (navigate, run the extraction
   * script, flatten), against whichever URL the picture source resolves to. It
   * is here rather than reused from `fidelity.ts` because that module's version
   * renders to disk and serves over loopback first, neither of which exists in a
   * Worker — the browser work, which is the part that matters, is identical.
   */
  async function manifestOf(source: PictureSource): Promise<ValueManifest> {
    const url = pictureUrl(source, deps)
    if (url === null) {
      throw new PictureSourceError(
        `the value gates need a live page, and a picture of kind '${source.kind}' is a ` +
          `recording. Name a draft, edit, revision or url picture.`,
      )
    }
    const driver = await deps.driverFactory()
    try {
      await driver.navigate(url)
      return flattenSignals(await driver.query<RawSignals>(EXTRACT_SCRIPT), url)
    } finally {
      await driver.close()
    }
  }

  /** Both sides of a comparison, decoded and cropped to the rectangle they share. */
  async function commonRasters(
    a: ResolvedPicture,
    b: ResolvedPicture,
  ): Promise<{ a: Raster; b: Raster; w: number; h: number }> {
    const [ra, rb] = await Promise.all([
      decodePng(a.bytes, a.label),
      decodePng(b.bytes, b.label),
    ])
    // A reproduction is rarely exactly as tall as its reference, and refusing to
    // compare on that basis would make the operation useless on the case it is
    // most for. `1c diff` anchors top-left and crops to the common rectangle;
    // this is that, so the two agree by construction rather than by care.
    const w = Math.min(ra.width, rb.width)
    const h = Math.min(ra.height, rb.height)
    return { a: cropRaster(ra, w, h), b: cropRaster(rb, w, h), w, h }
  }

  return {
    capture_site: async (p) => {
      const url = String(p.url)
      // PRE-FLIGHT, BEFORE ANY BROWSER IS LEASED. The guard at the driver's
      // request seam is the control — it is the only thing that sees a redirect
      // — but relying on it alone means an obviously bad address is answered by
      // leasing a metered browser, navigating, being refused, and RETRYING
      // twice more, and the caller is then told the capture failed rather than
      // that the address was refused. Both are worth avoiding, and one line here
      // avoids them.
      const guard = egressGuard()
      let refusals: readonly EgressRefusal[] = []
      try {
        // Inside the `try` so the refusal is mapped to the surface's declared
        // REFUSED code by the one handler below, rather than escaping as a raw
        // error the declaration never named.
        assertPublicUrl(url)
        const guarded = deps.guardedDriver(guard)
        const result = await cmdCapturePage(url, references, {
          driverFactory: guarded,
          // One browser, every engine: a Worker leases Browser Rendering and has
          // no second engine to offer, so the ladder is projected through the
          // same guarded factory rather than skipped for want of one.
          driverFactoryFor: () => guarded,
        })
        refusals = guard.refusals
        return {
          bundle: result.name,
          url: result.capture.url,
          pages: result.multiState.projections.length,
          assets: result.capture.assets.length,
          // Reported ALWAYS, not only on failure. A capture that quietly skipped
          // a third of a page's images is the exact input that makes a later
          // fidelity verdict wrong, and it is invisible unless it is said here.
          refusals: refusals.map((r) => ({ url: r.url, reason: r.reason, detail: r.detail })),
        }
      } catch (error) {
        // A refusal of the typed URL never reaches the browser, so it arrives
        // as this rather than in the guard's list. Both are the same finding.
        if (error instanceof UrlRefusedError) {
          throw new Error(`REFUSED: ${error.message}`)
        }
        throw error
      }
    },

    list_references: async () => {
      const names = await references.list()
      // The URL comes from each bundle's own capture record rather than from its
      // name, because the name is a slug of the URL and reading it back would be
      // a decoding the store never promised.
      const entries = await Promise.all(
        names.map(async (name) => {
          const capture = await readCapture(references.bundle(name))
          return { bundle: name, url: capture?.url ?? null, capturedAt: capture?.capturedAt ?? null }
        }),
      )
      return { references: entries }
    },

    describe_reference: async (p) => {
      const name = String(p.bundle)
      const bundle = references.bundle(name)
      const capture = await captureOf(name)
      const coverage = await referenceCoverage(bundle)
      const members = await bundle.list()
      return {
        bundle: name,
        url: capture.url,
        capturedAt: capture.capturedAt,
        viewports: members
          .map((m) => /^screenshot-(\d+)\.png$/.exec(m))
          .filter((m): m is RegExpExecArray => m !== null)
          .map((m) => Number(m[1]))
          .sort((x, y) => x - y),
        sections: coverage.sections,
        images: {
          mirrored: coverage.mirroredImages,
          referenced: coverage.referencedImages,
          unreferenced: coverage.unreferencedImages,
        },
        // The findings are the operator-facing sentences the coverage proxies
        // produced. They are advisory here and load-bearing in check_fidelity.
        findings: coverage.findings,
        members: members.filter((m) => !m.startsWith(ASSETS_PREFIX)).concat(
          members.some((m) => m.startsWith(ASSETS_PREFIX)) ? [`${ASSETS_PREFIX}… (${coverage.mirroredImages})`] : [],
        ),
      }
    },

    screenshot: async (p) => {
      const picture = await resolvePicture(p.of as PictureSource, deps)
      const { blocks } = await imageBlocks(picture)
      // THE BLOCKS ARE THE RETURN VALUE. Not a wrapper carrying them — the
      // wire adapter puts exactly this array on the `tool_result`, so anything
      // around it would be a shape the model never sees.
      return blocks
    },

    compare: async (p) => {
      const [a, b] = await Promise.all([
        resolvePicture(p.a as PictureSource, deps),
        resolvePicture(p.b as PictureSource, deps),
      ])
      const common = await commonRasters(a, b)
      const core = computeDiff(common.a, common.b)
      return {
        a: a.label,
        b: b.label,
        size: { width: common.w, height: common.h },
        meanDifference: core.meanDiff,
        percentDifferent: core.pctOverThreshold,
        bands: core.bands,
        // The heatmap rasters and the crop triptychs `1c diff` writes are
        // deliberately absent: they are files for an operator to open, and the
        // regions carry the same information as coordinates the model can act on.
        regions: core.regions.map((r) => ({
          rank: r.id,
          area: r.bbox,
          meanDifference: r.meanDiff,
        })),
      }
    },

    check_fidelity: async (p) => {
      const name = String(p.reference)
      const bundle = references.bundle(name)
      await captureOf(name) // refuses by name before any browser is leased
      const actual = p.actual as PictureSource

      // The three gates, and then the reconciliation. Run in this order because
      // the structural one is the cheapest and the browser work is the most
      // expensive; a bundle with no L1 fold fails here without leasing anything.
      const l1Gate = await cmdL1Gate(bundle)
      const coverage = await referenceCoverage(bundle)

      const [actualPicture, referencePicture] = await Promise.all([
        resolvePicture(actual, deps),
        resolvePicture({ kind: 'reference', bundle: name, viewport: actual.viewport }, deps),
      ])
      const common = await commonRasters(referencePicture, actualPicture)
      const core = computeDiff(common.a, common.b)

      const values = diffManifests(flattenCapture(await captureOf(name)), await manifestOf(actual))

      const report = reconcileGates({
        l1Gate,
        coverage,
        perceptual: {
          meanDiff: core.meanDiff,
          pctOverThreshold: core.pctOverThreshold,
          regions: core.regions,
        },
        values,
      })

      return {
        verdict: report.verdict,
        diagnosis: report.diagnosis,
        nextStep: report.nextStep,
        pass: report.pass,
        floor: report.floor,
        perceptual: report.perceptual,
        values: report.values,
        coverage: {
          mirroredImages: report.coverage.mirroredImages,
          referencedImages: report.coverage.referencedImages,
          unreferencedImages: report.coverage.unreferencedImages,
          sections: report.coverage.sections,
          pxPerSection: report.coverage.pxPerSection,
          findings: report.coverage.findings,
        },
      }
    },
  }
}

/**
 * The class the Toolbox composes — built inside a factory for the reason
 * `toolbox-core.ts`'s `l1ToolboxClass` gives: `ToolboxSurface` is untyped
 * JavaScript in the shared artifact store and only exists after an `import()`,
 * and a host may inject its own copy of the library.
 */
const bound = new WeakMap<object, Promise<Untyped>>()

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

export function fidelityToolboxClass(lib: Untyped): Promise<Untyped> {
  return Promise.resolve(lib).then((mod: Untyped) => {
    const existing = bound.get(mod as object)
    if (existing) return existing
    const built = Promise.resolve(
      class FidelityToolbox extends mod.ToolboxSurface {
        constructor(fidelityDeps: FidelityDeps) {
          super(FIDELITY_DECLARATION)
          // Installed as OWN methods, not prototype ones, so the Toolbox's
          // startup binding check sees exactly the declared set and no more.
          for (const [op, run] of Object.entries(fidelityOperations(fidelityDeps))) {
            ;(this as unknown as Params)[op] = run
          }
        }
      },
    )
    bound.set(mod as object, built)
    return built
  })
}

/**
 * The surface and the grant it adds, in the shape `createL1Toolbox` composes.
 *
 * The GRANT IS NOT BUILT HERE. It is local — it has none of the cross-axis
 * coupling that makes the knowledge grant travel with its surface — so it is
 * written in `instances.json` beside the L1 grant, where every other local grant
 * is and where a reviewer will look for it.
 */
export async function fidelitySurfaceFor(
  lib: Untyped,
  fidelityDeps: FidelityDeps,
): Promise<Untyped> {
  const FidelityToolbox = await fidelityToolboxClass(lib)
  return new FidelityToolbox(fidelityDeps)
}
