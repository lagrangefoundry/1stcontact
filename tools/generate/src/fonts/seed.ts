/**
 * [[REQ-315]] — `1c fonts seed`: the staged mirror, put where **local dev**
 * serves it from.
 *
 * WHY THIS EXISTS AT ALL. `publish.ts` writes the CLOUD bucket over the R2 REST
 * API, and that is the only delivery the mirror had. Local dev is `wrangler dev`,
 * where `env.SITES` is miniflare's own R2 under `.wrangler/state/v3/r2/`, which
 * publish never touches — so after a full mirror and publish, a local preview
 * still 404s every platform font.
 *
 * AND THE GAP GETS WORSE WHEN THE MIRROR FINISHES, not better. The assistant's
 * projection (`1c fonts index`) is built from the STAGED manifest and is a
 * build-time global; the bytes are per-environment. `use_font` refuses honestly
 * while the projection is empty — *"this deployment serves no platform fonts"* —
 * and starts succeeding the moment the mirror completes, binding `/_fonts/…`
 * paths that local dev cannot answer. An honest refusal is traded for a
 * confident bind that 404s: [[REQ-312]]'s own fallback-face failure, surviving in
 * the one environment the work is done in.
 *
 * NOTHING ABOVE THE SEAM LEARNS WHERE IT IS. The browser, the assistant, the
 * renderer and the router are all correctly blind to their environment, and must
 * stay that way. The one environment-specific thing is the DELIVERY of the bytes,
 * and this is the missing half of it. `r2PlatformFonts(env.SITES)` then serves
 * dev **unchanged** — not merely the same interface as production but the same
 * implementation, which is the strongest available statement that the two agree.
 *
 * WHY MINIFLARE-THE-LIBRARY, and not the two alternatives:
 *
 *   - **Not the on-disk format.** Miniflare's local R2 is a SQLite metadata store
 *     whose filename is an opaque Durable Object id derived from the bucket name,
 *     plus content-addressed blobs beside it. Writing that by hand would mean
 *     reverse-engineering an internal layout and re-deriving that id — a second
 *     implementation of somebody else's private format, wrong the first time it
 *     changes underneath us.
 *   - **Not `wrangler r2 object put --local`, once per object.** `publish.ts`
 *     already records why: at thousands of objects the process-spawn cost alone
 *     is hours, and none of what wrangler adds applies to putting bytes at a key.
 *
 * So this drives the same `R2Bucket` API the Worker itself calls, against the
 * same persist directory `wrangler dev` opens. Miniflare is not a new dependency
 * in the tree — it is what `wrangler` already is underneath; declaring it only
 * makes an existing fact importable.
 *
 * THE LOCAL BUCKET IS NOT ONE PLACE. `.wrangler/state` is per app directory, so
 * `apps/control-app/` and `apps/public-site/` hold separate stores of the same
 * logical `1stcontact-sites` bucket. Seeding one leaves the other 404ing the
 * fonts the surface beside it renders, so the default is every app that declares
 * the bucket, and the report names exactly which stores were written.
 */

import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { Miniflare } from 'miniflare'
import type { PlatformFontManifest } from '@1stcontact/site-schema'
import { platformFontKey } from '@1stcontact/site-schema'
import { listDirs, pathExists } from '../store/fsutil'
import { loadPlatformManifest } from './mirror'
import { platformObjects, PLATFORM_BUCKET, PublishError, type LocalStore, type PublishReport } from './publish'
import { sha256 } from './upstream'

/**
 * Where `wrangler dev` keeps a miniflare R2 bucket, under an app directory.
 *
 * Wrangler's default `--persist-to` is `.wrangler/state`, and it hands miniflare
 * `<persist>/v3/r2`. Named here as one constant rather than assembled at three
 * call sites, because a seed written to a directory nothing reads would look
 * exactly like a seed that worked.
 */
export const R2_PERSIST_REL = path.join('.wrangler', 'state', 'v3', 'r2')

/** The binding name the seed opens the bucket under — any name, since nothing reads it back. */
const SEED_BINDING = 'SITES'

/**
 * Every app whose Worker declares the platform bucket, and the local store its
 * `wrangler dev` reads.
 *
 * DISCOVERED, NOT LISTED — the same reason `bin/deploy` and `bin/build` discover
 * their apps. A third surface that starts serving `_fonts/…` gets seeded by
 * existing, and one that never declares the bucket is never given a store it
 * would not open.
 *
 * The match is on the bucket NAME in `wrangler.toml` rather than a parse of it:
 * a TOML parser to answer "does this file mention this bucket" would be a
 * dependency bought for one substring.
 */
export function localStores(cwd: string): LocalStore[] {
  const appsDir = path.join(cwd, 'apps')
  if (!pathExists(appsDir)) return []
  const stores: LocalStore[] = []
  for (const app of listDirs(appsDir)) {
    const config = path.join(appsDir, app, 'wrangler.toml')
    if (!pathExists(config)) continue
    if (!readFileSync(config, 'utf8').includes(`"${PLATFORM_BUCKET}"`)) continue
    stores.push({ app, persist: path.join('apps', app, R2_PERSIST_REL) })
  }
  return stores.sort((a, b) => a.app.localeCompare(b.app))
}

export interface SeedOptions {
  cwd: string
  /** Report what would move without moving it. */
  dryRun?: boolean
  /** Restrict to these app directory names; every discovered store by default. */
  apps?: string[]
  onProgress?: (line: string) => void
}

/**
 * What the seed says when there is no mirror to seed.
 *
 * IT NAMES THE QUALITY CLIFF, because the default costs an hour and a quarter
 * and nothing else in the system says so. `sfntToWoff2` at the default brotli
 * quality runs at roughly 0.65 MB/s over a 2.45 GB corpus; quality 9 is about
 * 20x faster for some 9% more bytes, which for a local dev seed is obviously the
 * right trade and for a production publish is obviously not. Leaving that to the
 * operator to discover is how a four-minute job becomes a ninety-minute one.
 */
const NO_MIRROR =
  'There is no platform font mirror to seed. Run `1c fonts mirror --repo <google/fonts>` first.\n' +
  '  For a local dev seed, pass `--quality 9`: brotli has a steep cliff between 10 and 9, and ' +
  'quality 9 mirrors the corpus roughly 20x faster for about 9% more bytes. The default (11) is ' +
  'what a production publish wants and costs around 75-90 minutes over the full corpus.'

/**
 * Write the staged mirror into each local miniflare R2 store.
 *
 * THE SAME PREFIX, THE SAME KEY FUNCTION AND THE SAME DIGEST CHECK `publish.ts`
 * uses, deliberately: the set of objects comes from {@link platformObjects}, so
 * a stray file left in the staging directory by an older catalogue is no more
 * published locally than it is to the cloud, and "is this object already the
 * right bytes" is one `head` rather than a re-read — which is what makes a
 * re-seed of an unchanged mirror near-free, exactly as a re-publish is.
 */
export async function runSeed(options: SeedOptions): Promise<PublishReport> {
  const { cwd, dryRun = false } = options
  const progress = options.onProgress ?? (() => {})

  const manifest = loadPlatformManifest(cwd)
  if (!manifest) throw new PublishError(NO_MIRROR)

  const stores = selectStores(cwd, options.apps)
  const objects = platformObjects(cwd, manifest)
  const missing = objects.filter((o) => !pathExists(o.file)).map((o) => o.path)
  const present = objects.filter((o) => pathExists(o.file))

  // HOW BIG THE MIRROR IS, counted ONCE and never once per store: seeding two
  // apps does not make the corpus twice the size, and a report that said so
  // would be the one number an operator checks against their disk. `uploaded`
  // does scale with the stores, because those really are separate writes.
  const bytes = present.reduce((n, o) => n + statSync(o.file).size, 0)

  // The same shape publish's rehearsal takes, so the two targets do not describe
  // the same run differently: a dry run reports what it WOULD send and checks
  // nothing, rather than being quietly more precise than the real thing.
  if (dryRun) {
    return {
      bucket: PLATFORM_BUCKET,
      uploaded: present.length * stores.length,
      unchanged: 0,
      missing,
      bytes,
      dryRun: true,
      stores,
    }
  }

  let uploaded = 0
  let unchanged = 0

  for (const store of stores) {
    progress(`  seeding ${store.app} (${store.persist})`)
    const mf = new Miniflare({
      modules: true,
      // A Worker is required to open a store and is never called: this reaches
      // past the fetch handler to the binding, which is the whole object here.
      script: 'export default { fetch() { return new Response(null, { status: 404 }) } }',
      r2Buckets: { [SEED_BINDING]: PLATFORM_BUCKET },
      r2Persist: path.resolve(cwd, store.persist),
    })
    try {
      const bucket = await mf.getR2Bucket(SEED_BINDING)
      for (const object of present) {
        const body = readFileSync(object.file)
        const digest = sha256(body)
        const key = platformFontKey(object.path)
        const head = await bucket.head(key)
        if (head?.customMetadata?.sha256 === digest) {
          unchanged += 1
          continue
        }
        await bucket.put(key, body, {
          httpMetadata: { contentType: object.contentType },
          // `sha256` is the name R2 gives `x-amz-meta-sha256`, so the metadata a
          // seeded object carries reads identically to a published one's.
          customMetadata: { sha256: digest },
        })
        uploaded += 1
      }
    } finally {
      await mf.dispose()
    }
  }

  return { bucket: PLATFORM_BUCKET, uploaded, unchanged, missing, bytes, dryRun: false, stores }
}

/**
 * The stores this run writes, refusing a name that is not one.
 *
 * AN EMPTY SELECTION IS AN ERROR, not a silent success: "seeded 0 objects" and
 * "seeded every store there is" are the same sentence from the outside, and only
 * one of them means local dev will serve a font.
 */
function selectStores(cwd: string, apps: string[] | undefined): LocalStore[] {
  const all = localStores(cwd)
  if (all.length === 0) {
    throw new PublishError(
      `No app under apps/ declares the '${PLATFORM_BUCKET}' bucket, so there is no local store to seed.`,
    )
  }
  if (!apps || apps.length === 0) return all
  return apps.map((want) => {
    const found = all.find((store) => store.app === want)
    if (!found) {
      throw new PublishError(
        `'${want}' does not serve platform fonts locally. Apps that do: ${all.map((s) => s.app).join(', ')}.`,
      )
    }
    return found
  })
}
