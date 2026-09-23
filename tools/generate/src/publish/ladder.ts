import {
  alternativeDeliveryTypes,
  alternativeDeliveryWidthsFor,
  deliveryExtensionOfType,
  deliveryTypeOfExtension,
  deliveryWidthsFor,
  extensionOfAsset,
  isLadderedAsset,
  renditionPath,
  type ImageDelivery,
  type ImageDeliveryManifest,
  type ImageDeliverySource,
  type ImageRendition,
} from '@1stcontact/framework/worker'
import { contentTypeOf } from '../store/content-type'
import type { AssetRef } from '../store/site-store'

/**
 * The delivery width ladder, built at publish (REQ-222).
 *
 * WHERE THIS SITS. `publish.ts` sequences a publish over the {@link SiteStore}
 * port and knows nothing about HTTP or bindings; this is the same shape for
 * images. The POLICY — which widths, what a rendition is called, what the
 * manifest records — lives here, once, in worker-safe TypeScript. The one thing
 * that genuinely needs a platform is decoding and resizing a picture, and that is
 * {@link ImageSizer}, which the Worker supplies by adapting the renderer
 * [[REQ-219]] already composed. Caching is deliberately NOT here: that renderer
 * is already wrapped in a rendition cache addressed by the original, the recipe
 * and the size asked for, which is exactly the address this ladder would have
 * invented. What this module asks of that cache is one question — *does this
 * rendition cost anything* ({@link ImageSizer.held}) — because a determinate
 * progress bar needs a denominator and a republish's is zero. It still knows
 * nothing about where an answer comes from.
 *
 * WHY NOT A VERB ON THE SITE STORE. Because a store holds bytes and this decides
 * what bytes should exist. Putting it behind `SiteStore` would oblige the
 * filesystem adapter to grow an image pipeline in order to be a store, and the
 * CLI publishes without one deliberately — see {@link ImageLadder}.
 *
 * NOTHING HERE IS UPSCALED, and that rule is enforced on this side rather than
 * left to the transform. A platform transform's fit mode decides what happens
 * when the requested width exceeds the source's, and the answer differs between
 * a local emulation and the real binding — so the ladder simply never asks for a
 * width the source does not have (`deliveryWidthsFor`), and the two agree by
 * construction instead of by configuration.
 */

/**
 * How much of the source digest a rendition's name carries.
 *
 * SIXTY-FOUR BITS. These names address derived bytes within one tenant, and a
 * collision would mean serving one client's picture where another belongs. At 64
 * bits that needs on the order of four billion distinct pictures in one tenant
 * before it is even worth thinking about, and the name stays short enough to
 * read in a bucket listing. It is not a security boundary: the bucket prefix is
 * — [[REQ-219]]'s cache is tenant-prefixed for exactly that reason, and these
 * names never leave a revision's own `out/`.
 *
 * IT IS A PREFIX OF THE STORE'S OWN DIGEST NOW ([[REQ-304]]), rather than a
 * second SHA-256 taken here. That is not merely one hash saved per picture: the
 * ladder had to hold a whole photograph to compute it, which is the retention
 * this ticket removes. The VALUE is unchanged — the store records the full
 * SHA-256 of exactly the same bytes — so every rendition keeps the path it
 * already had and no published `srcset` moves.
 */
const RENDITION_SHA_LENGTH = 16

/** A picture's intrinsic dimensions. */
export interface ImageSize {
  width: number
  height: number
}

/**
 * What the ladder needs of an image renderer — three verbs, and no opinions.
 *
 * NO VERB DECIDES ANYTHING: `measure` reports what a picture IS, `resize`
 * produces a width and format this module already decided to ask for, and `held`
 * reports whether one of those would cost anything. That is what keeps a fake in
 * a test honest — there is no policy inside it to get right differently from the
 * real one.
 *
 * A SIZER AND NOT A RENDERER, because [[REQ-219]] already has a renderer and
 * this is deliberately not a second one. That renderer applies an editorial
 * recipe and takes a delivery width alongside it; `apps/control-app`'s adapter
 * is what turns it into this. The narrower port is what keeps the ladder from
 * knowing that recipes exist at all.
 *
 * NULL IS "I COULD NOT", NEVER A THROW. A picture the renderer cannot decode is
 * an ordinary thing to meet in a client's asset library, and it must cost that
 * picture its ladder and nothing else. A publish that failed because one upload
 * was a `.png` that is not a PNG would be a site nobody can publish, diagnosable
 * only by deleting assets one at a time. The adapter is where the editing path's
 * refusals become this.
 */
export interface ImageSizer {
  /** The picture's own pixel dimensions, or null if these bytes are not one. */
  measure(bytes: Uint8Array, contentType: string): Promise<ImageSize | null>
  /**
   * The picture at `width` in `type`, or null if it could not be rendered.
   *
   * `type` ABSENT MEANS THE SOURCE'S OWN FORMAT, which is the rule the whole
   * repository already follows for a picture nobody asked to convert — a PNG
   * stays a PNG and keeps its transparency.
   */
  resize(
    bytes: Uint8Array,
    contentType: string,
    width: number,
    type?: string,
  ): Promise<Uint8Array | null>
  /**
   * Whether this rendition is already held, so producing it costs nothing.
   *
   * IT IS HERE SO THE PUBLISH CAN STATE A REAL DENOMINATOR BEFORE IT STARTS, and
   * nothing else. The builder blocks, explains that FIRST-TIME publication has to
   * resize, and draws a determinate bar — and on a republish every one of those
   * is a lie, because every rendition is already held. A client shown that
   * warning every time has been taught to ignore the one time it means something.
   *
   * OPTIONAL, AND ABSENCE MEANS "NOTHING IS FREE". A sizer with nowhere to keep a
   * rendition holds none, so reporting all of it as work is the truthful answer
   * rather than a conservative one.
   *
   * THIS IS NOT THE LADDER LEARNING ABOUT CACHING. It asks whether a rendition
   * costs anything; where the answer comes from, and whether there is a store
   * behind it at all, stays entirely the adapter's business — the same division
   * {@link measure} and {@link resize} already keep.
   */
  held?(
    bytes: Uint8Array,
    contentType: string,
    width: number,
    type?: string,
  ): Promise<boolean>
}

/**
 * How many renditions are rendered at once.
 *
 * SIX, AND THE NUMBER MATTERS FAR LESS THAN THE FACT THAT IT IS NOT ONE. A
 * sequential ladder makes wall-clock the SUM of every transform on the site, and
 * that is the one arrangement that turns a photo-heavy site's first publish into
 * an open-ended wait — the failure this ceiling exists to remove. Almost all of
 * the available win is in the step from one to a handful; going from six to sixty
 * buys little and starts betting on undocumented platform behaviour.
 *
 * SIX BECAUSE IT IS THE NUMBER OF RUNGS, so one picture's source-format ladder is
 * roughly one wave. That is a readable unit rather than a tuned one, and there is
 * no measurement behind it because there is no measurement to have: the platform
 * documents no concurrency limit on image transforms at all, so a larger ceiling
 * would be an assumption about throttling nobody has confirmed.
 *
 * IT IS A CEILING ON THE AMBITION, NOT ON THE WORK. Every rendition is still
 * built; this only decides how many are in flight, so a bigger site takes longer
 * and never takes less.
 */
export const LADDER_CONCURRENCY = 6

/**
 * The most renditions one publish will build.
 *
 * THE FAILURE THIS GUARDS AGAINST IS NOT SLOWNESS. It is a publish that dies
 * most of the way through with a platform error naming nothing the client did —
 * so if the projected work exceeds what one request can carry, the publish says
 * so IN TERMS OF THE SITE, before it starts, and nothing is written.
 *
 * THE ARITHMETIC, from the platform limits as documented in September 2026 rather
 * than from memory. A Worker on a paid plan may make **10,000 subrequests per
 * invocation** by default (raisable via the `limits` configuration), and a
 * subrequest is *"any request a Worker makes using the Fetch API or to Cloudflare
 * services like R2, KV, or D1"* — so every bucket read and write counts. Whether
 * an Images transform ALSO counts is not documented either way, so it is assumed
 * to. Per rendition, worst case:
 *
 *   1. the `held` read that gives the progress bar a real denominator;
 *   2. `resize`'s own cache read;
 *   3. the transform, on a miss;
 *   4. the cache write, on a miss;
 *   5. the revision write.
 *
 * FIVE, AND THE FIRST OF THEM IS THE PRICE OF THE BAR. `held` and `resize` read
 * the same key moments apart, which is one read paid to be able to say *this will
 * take a minute* rather than leaving the client watching a spinner. It is a read
 * and not a transform, and removing it would mean either caching the answer — state
 * this module deliberately does not hold — or a denominator that lies on every
 * republish.
 *
 * SO 1,200 RENDITIONS IS 6,000, leaving real headroom for the store reads, the
 * page writes, the D1 writes and the revision the publish also performs. A cap
 * sized to land exactly on 10,000 would be a cap with nothing left for the rest
 * of the publish.
 *
 * WHICH MAKES THIS A REAL GUARD AND A DISTANT ONE, and both halves are worth
 * stating. At thirteen renditions for a full-ladder photograph it admits about 90
 * pictures — several times the 20–40 a photo-heavy small-business site holds, so
 * two formats is comfortable rather than marginal, and no ordinary client will
 * ever meet this. A site that does meet it is one this publish genuinely cannot
 * carry in one request, and being told that is strictly better than finding out.
 *
 * A FREE-PLAN DEPLOYMENT IS TIGHTER (1,000 subrequests to Cloudflare services)
 * and is not what this number is set for. The guard still fires there, later than
 * the platform would — which is the acceptable direction for a limit this
 * project does not deploy against.
 */
export const LADDER_MAX_RENDITIONS = 1200

/**
 * Raised when a site's ladder is larger than one publish can carry.
 *
 * IT NAMES THE SITE'S OWN FACTS — how many pictures, how many renditions, and the
 * ceiling — because the client can act on those and cannot act on a subrequest
 * budget. The remedy is theirs and is real: fewer pictures on the site, or
 * pictures that are smaller to begin with.
 */
export class LadderTooLargeError extends Error {
  readonly name = 'LadderTooLargeError'
  constructor(
    readonly pictures: number,
    readonly renditions: number,
    readonly limit: number,
  ) {
    super(
      `This site has ${pictures} picture${pictures === 1 ? '' : 's'} needing ` +
        `${renditions} delivery renditions, and one publish can build ${limit}. ` +
        `Removing some pictures, or replacing the largest with smaller ones, will let it publish.`,
    )
  }
}

/**
 * How far through building the ladder a publish is.
 *
 * DETERMINATE, AND THAT IS THE POINT. A spinner is the right affordance for an
 * unknown wait of a few seconds; for a wait of minutes it is the thing that reads
 * as a hang, which is exactly what this reporting exists to prevent. The total is
 * knowable before the first transform because the ladder plans before it renders,
 * so the denominator is real rather than an animation on a timer.
 */
export interface LadderProgress {
  /** Renditions this publish must build — cache hits already subtracted. */
  total: number
  /** How many of them are done. */
  done: number
}

/** What a ladder build reports as it goes. */
export type LadderProgressReporter = (progress: LadderProgress) => void

/** What a ladder build produced. */
export interface LadderBuild {
  /** What the renderer writes into each `<img>`. */
  manifest: ImageDeliveryManifest
  /**
   * The derived bytes, by path within the revision's `out/`.
   *
   * They go to `out/` and NOT to `source/`: a checkout restores what the site
   * IS, and a delivery rendition is not part of that. So a revision serves its
   * ladder and a checkout never grows six copies of a photograph.
   */
  derived: Map<string, Uint8Array>
}

/**
 * What `publishSite` asks for a ladder through.
 *
 * OPTIONAL BY DESIGN, AND ITS ABSENCE IS NOT A DEGRADED PUBLISH — it is the
 * publish this repository has always performed. `1c publish` runs against an
 * operator's disk with no Images binding anywhere near it, and refusing to
 * publish there because delivery sizes could not be built would take away
 * something that works in exchange for something that was never promised. The
 * ladder is additive: with it the pages carry `srcset`, without it they are
 * byte-identical to today's.
 */
export interface ImageLadder {
  build(source: LadderSource, opts?: LadderBuildOptions): Promise<LadderBuild>
}

/**
 * The pictures a ladder is built over, and how to get one ([[REQ-304]]).
 *
 * A LISTING PLUS A READER, RATHER THAN A LIST OF BYTES. The ladder used to take
 * every asset on the site with its content attached, which meant the caller had
 * already materialised the whole site before the first pixel was measured — the
 * single largest of the four copies a publish held live. What the ladder
 * actually needs is to know WHICH pictures there are (to plan, and to refuse
 * informatively before it starts) and to have ONE of them at a time.
 *
 * THE READER IS BY NAME AND NOT BY DIGEST, because that is the question the
 * store answers cheapest on every adapter — it is the draft being published, and
 * a draft is addressed by name. The ref's digest is used for what only a digest
 * can do: naming the rendition.
 *
 * A PICTURE THAT WILL NOT READ IS DROPPED, exactly as one that will not decode
 * is. Both mean the same thing to a visitor — this photograph is served at its
 * own width — and neither is a reason to refuse a publish.
 */
export interface LadderSource {
  /** Every asset on the site, by name and content identity. */
  assets: readonly AssetRef[]
  /** One asset's bytes, or null when the store no longer holds them. */
  read(name: string): Promise<Uint8Array | null>
}

/** What a caller may ask of one ladder build. */
export interface LadderBuildOptions {
  /** Told the total once the plan is known, then told each completion. */
  onProgress?: LadderProgressReporter
}

/** Nothing rendered: the manifest is empty and every `<img>` is emitted as it is. */
export const EMPTY_LADDER: LadderBuild = { manifest: {}, derived: new Map() }

/**
 * A pool over `jobs`, at most `limit` in flight, in order of completion.
 *
 * HAND-ROLLED RATHER THAN A DEPENDENCY, because it is nine lines and this package
 * is worker-safe TypeScript with no runtime dependencies at all — adding one for
 * a bounded `map` would be the largest thing about it.
 *
 * EACH RESULT IS DELIVERED AS IT LANDS, through `onDone`, and that is what the
 * progress reporting is made of: a pool that only resolved at the end could tell
 * the client the total and then nothing until it was over, which is the silence
 * the bar exists to fill.
 */
async function pooled<T>(
  jobs: readonly (() => Promise<T>)[],
  limit: number,
  onDone: (result: T) => void,
): Promise<void> {
  let next = 0
  const worker = async (): Promise<void> => {
    for (;;) {
      const index = next++
      if (index >= jobs.length) return
      onDone(await jobs[index]())
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, worker))
}

/** One rendition the plan decided to ask for. */
interface RenditionJob {
  width: number
  /** The delivery format, or undefined for the source's own. */
  type?: string
  /** Where the bytes land inside the revision's `out/`. */
  path: string
}

/**
 * One picture's whole plan: what it measures, and every rung it wants.
 *
 * IT HOLDS NO BYTES ([[REQ-304]]). A plan is what the publish intends to build;
 * the picture itself is read when a phase needs it and released when that phase
 * is done with it, so the plan for a hundred photographs is a hundred small
 * objects rather than a hundred photographs.
 */
interface PicturePlan {
  asset: AssetRef
  contentType: string
  size: ImageSize
  /** The source-format rungs, ascending. */
  own: RenditionJob[]
  /** The alternative formats, best first, each with its own rungs ascending. */
  alternatives: { type: string; jobs: RenditionJob[] }[]
}

/**
 * Build the ladder for a snapshot's assets.
 *
 * THREE PHASES, AND THE SPLIT IS THE LATENCY ANSWER. It plans every picture
 * first, then checks the plan against what one request can carry, then renders —
 * with a bounded number in flight rather than one at a time.
 *
 *   1. MEASURE AND PLAN. Measuring is what caps a ladder at the source, and it is
 *      free at the platform (`.info()` is documented as such), so it happens for
 *      every picture before anything is encoded. What comes out is the exact list
 *      of renditions this publish wants, which is also the DENOMINATOR the builder
 *      draws its bar from — a real number known before the first transform rather
 *      than an animation on a timer.
 *   2. REFUSE INFORMATIVELY IF IT IS TOO LARGE. See {@link LADDER_MAX_RENDITIONS}.
 *      This is before any rendition is written, so a site over the ceiling
 *      publishes nothing rather than dying halfway with a platform error.
 *   3. RENDER, AT MOST {@link LADDER_CONCURRENCY} AT ONCE. Sequentially, wall-clock
 *      is the SUM of every transform on the site; bounded, it is that sum divided
 *      by the ceiling. Nothing else about the work changes — every rendition is
 *      still built, and a rung that fails still drops out alone.
 *
 * THE PLAN SUBTRACTS WHAT IS ALREADY HELD, through the sizer's optional `held`.
 * That is what makes the *first* publish the slow one and says so honestly: a
 * republish plans the same rungs, finds every one of them free, and reports a
 * total of zero — which is what lets the builder stay quiet instead of warning
 * about a resize that is not going to happen.
 *
 * NEITHER PHASE HOLDS THE SITE ([[REQ-304]]). Each reads one picture, does
 * everything that picture's bytes are needed for, and lets go — so what is live
 * at any moment is at most {@link LADDER_CONCURRENCY} sources, whether the site
 * has three photographs or three hundred. The price is that a picture is read
 * twice, once per phase, which is one bucket read against a transform. (What the
 * ladder still accumulates is its OUTPUT; that is [[REQ-305]].)
 *
 * THE MANIFEST IS A RECORD OF WHAT LANDED. An entry is written only from
 * renditions that are in `derived`, because a `srcset` candidate the bucket does
 * not hold is a 404 on the one request the page cannot recover from — and the
 * browser will have chosen it precisely because it was the best fit.
 *
 * THE ORIGINAL IS THE TOP RUNG OF THE SOURCE-FORMAT LADDER. It is already in
 * `assets/`, it is already the `src`, and naming it in the `srcset` is what lets a
 * wide viewport take the full picture through the same mechanism as every other
 * width — for no transform at all. An ALTERNATIVE format has no such free rung,
 * which is why its ladder includes the source's own width as something encoded.
 */
export async function buildImageLadder(
  source: LadderSource,
  sizer: ImageSizer,
  opts: LadderBuildOptions = {},
): Promise<LadderBuild> {
  const { assets } = source

  // ---- 1. Measure and plan -------------------------------------------------
  //
  // The measures run through the same pool the renders do. They are free at the
  // platform but they are still a round trip each, and a site's worth of them in
  // series is the same open-ended silence the renders were.
  //
  // [[REQ-304]] — ONE PICTURE IS READ, PLANNED, ASKED ABOUT AND RELEASED. The
  // bytes are needed three times here — to measure, to plan, and to ask `held`
  // whether each rung costs anything — and all three happen while this picture
  // is the one in hand, so what the phase holds is bounded by
  // {@link LADDER_CONCURRENCY} pictures rather than by the site.
  const plans: (PicturePlan | null)[] = new Array(assets.length).fill(null)
  const free: number[] = new Array(assets.length).fill(0)
  await pooled(
    assets.map((asset, index) => async (): Promise<void> => {
      // SVG is resolution-independent and GIF is animated; both are served as
      // they are, and anything else unknown is left alone rather than guessed at.
      // Asked BEFORE the read, so a site's PDFs and vectors cost nothing at all.
      if (!isLadderedAsset(asset.name)) return
      const bytes = await source.read(asset.name)
      // A picture whose bytes have gone gets no ladder, exactly as one that
      // cannot be decoded does. Both mean "served at its own width".
      if (bytes === null) return
      const contentType = contentTypeOf(asset.name)
      const size = await sizer.measure(bytes, contentType)
      if (size === null) return

      const widths = deliveryWidthsFor(size.width)
      if (widths.length === 0) return

      const extension = extensionOfAsset(asset.name)
      // The store's own digest, truncated — see {@link RENDITION_SHA_LENGTH}.
      const sha = asset.digest.slice(0, RENDITION_SHA_LENGTH)
      const own: RenditionJob[] = widths.map((width) => ({
        width,
        path: renditionPath(sha, width, extension),
      }))

      // THE ALTERNATIVE FORMATS, and their order is the manifest's rather than
      // the renderer's — see `ImageDelivery.sources`. Which ones exist is decided
      // by the source's own type, so an AVIF is not offered a larger WebP and a
      // WebP is not offered itself.
      const alternatives: PicturePlan['alternatives'] = []
      for (const type of alternativeDeliveryTypes(deliveryTypeOfExtension(extension))) {
        const altExtension = deliveryExtensionOfType(type)
        if (altExtension === null) continue
        alternatives.push({
          type,
          jobs: alternativeDeliveryWidthsFor(size.width).map((width: number) => ({
            width,
            type,
            path: renditionPath(sha, width, altExtension),
          })),
        })
      }

      plans[index] = { asset, contentType, size, own, alternatives }

      // WHAT IS ALREADY HELD IS NOT WORK, and the difference is the client's
      // whole experience of this: the same plan, reported as a minute's resizing
      // the first time and as nothing at all every time after. Asked here, while
      // the picture is in hand, rather than in a second pass that would have to
      // read every one of them again.
      if (!sizer.held) return
      const held = sizer.held.bind(sizer)
      const rungs = [...own, ...alternatives.flatMap((a) => a.jobs)]
      for (const rung of rungs) {
        if (await held(bytes, contentType, rung.width, rung.type)) free[index] += 1
      }
    }),
    LADDER_CONCURRENCY,
    () => {},
  )

  const planned = plans.filter((p): p is PicturePlan => p !== null)
  const jobs = planned.flatMap((p) => [...p.own, ...p.alternatives.flatMap((a) => a.jobs)])

  // ---- 2. Refuse informatively if it is too large --------------------------
  if (jobs.length > LADDER_MAX_RENDITIONS) {
    throw new LadderTooLargeError(planned.length, jobs.length, LADDER_MAX_RENDITIONS)
  }

  const progress: LadderProgress = {
    total: jobs.length - free.reduce((sum, n) => sum + n, 0),
    done: 0,
  }
  opts.onProgress?.({ ...progress })

  // ---- 3. Render, bounded --------------------------------------------------
  //
  // POOLED OVER PICTURES RATHER THAN OVER RUNGS ([[REQ-304]]). Every rendition
  // of one photograph is made from the same source bytes, so reading them once
  // and rendering that picture's whole ladder before moving on is both fewer
  // reads and — the reason it changed — a bound on what is held: at most
  // {@link LADDER_CONCURRENCY} sources at a time, whatever the site's size.
  //
  // IT IS THE SAME CEILING ON THE SAME AMBITION. A picture with thirteen rungs
  // renders them in series where they used to interleave with other pictures';
  // the number in flight is unchanged and so is the total work.
  const derived = new Map<string, Uint8Array>()
  await pooled(
    planned.map((plan) => async (): Promise<void> => {
      const bytes = await source.read(plan.asset.name)
      if (bytes === null) return
      for (const job of [...plan.own, ...plan.alternatives.flatMap((a) => a.jobs)]) {
        const rendered = await sizer.resize(bytes, plan.contentType, job.width, job.type)
        // A rung that would not render is dropped and the rest of the ladder
        // stands: fewer choices for the browser, never a broken candidate.
        if (rendered !== null) derived.set(job.path, rendered)
        // REPORTED AGAINST THE OUTSTANDING TOTAL, and clamped, because a
        // rendition the plan counted as free may still be rendered here — `held`
        // answered before this phase began, and nothing promises the two agree.
        // A bar that read 7/5 would be a worse report than one that sat at 5/5
        // for a moment.
        const done = Math.min(progress.done + 1, progress.total)
        // AND ONLY WHEN IT MOVED. A republish's total is zero, so every clamped
        // completion would otherwise emit an identical frame — a stream of
        // frames saying nothing, down a connection whose whole purpose is to say
        // something.
        if (done === progress.done) continue
        progress.done = done
        opts.onProgress?.({ ...progress })
      }
    }),
    LADDER_CONCURRENCY,
    () => {},
  )

  const manifest: Record<string, ImageDelivery> = {}
  for (const plan of planned) {
    const renditions: ImageRendition[] = plan.own
      .filter((job) => derived.has(job.path))
      .map((job) => ({ src: job.path, width: job.width }))
    if (renditions.length === 0) continue
    // The source itself, last and widest — the bytes `src` already names.
    renditions.push({ src: `assets/${plan.asset.name}`, width: plan.size.width })

    // AN ALTERNATIVE WITH FEWER THAN TWO LANDED RUNGS IS DROPPED WHOLE. It has no
    // fallback of its own — the `<img>` carries the source format — so a
    // `<source>` a browser prefers and cannot choose usefully within is strictly
    // worse than no `<source>` at all.
    const sources: ImageDeliverySource[] = []
    for (const alternative of plan.alternatives) {
      const landed = alternative.jobs
        .filter((job) => derived.has(job.path))
        .map((job) => ({ src: job.path, width: job.width }))
      if (landed.length >= 2) sources.push({ type: alternative.type, renditions: landed })
    }

    manifest[plan.asset.name] = {
      width: plan.size.width,
      height: plan.size.height,
      renditions,
      ...(sources.length > 0 ? { sources } : {}),
    }
  }

  return { manifest, derived }
}

/** An {@link ImageLadder} over a sizer. */
export function imageLadder(sizer: ImageSizer): ImageLadder {
  return { build: (source, opts) => buildImageLadder(source, sizer, opts) }
}
