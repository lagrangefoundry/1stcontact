/**
 * [[REQ-312]] — `1c fonts publish`: the staged mirror, put where it is served from.
 *
 * WHY THIS ONE DOES NOT GO THROUGH A WORKER. `push.ts` records the rule that the
 * WORKER writes and Node only posts, and the rule is right for what it is about:
 * a site is a STORE with schema semantics, and a second writer could come to
 * disagree with the first about what a site is made of. A platform font is an
 * opaque byte object in a prefix nothing else writes — there is no second opinion
 * available to have — and a Worker upload path for a GB of fonts would be an
 * endpoint built for exactly one caller, reachable by anyone who found it.
 *
 * SO IT IS THE R2 REST API, with the credential the release-time toolset already
 * uses: `CLOUDFLARE_API_TOKEN`, the account discovered from the token exactly as
 * `1c kb build` discovers it (`cloudflare-account.ts`). One credential for the
 * toolset, not a second one for fonts.
 *
 * INCREMENTAL AND RESUMABLE, because at this scale it has to be. Every object is
 * digest-checked before it is sent, so an interrupted publish resumes by being
 * re-run and a re-publish of an unchanged mirror transfers nothing. That is the
 * same property the mirror itself has, for the same reason.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { PLATFORM_LICENCE_INDEX, platformFontKey, type PlatformFontManifest } from '@1stcontact/site-schema'
import { pathExists } from '../store/fsutil'
import { CLOUDFLARE_API, resolveAccountId } from '../cli/cloudflare-account'
import { CommandError, type ErrorCode } from '../cli/errors'
import { LICENCE_INDEX_FILE, loadPlatformManifest, mirrorDir } from './mirror'
import { sha256 } from './upstream'
import { DEPLOYED_RECORD_KEY, deployedRecord, mirrorDigests, parseDeployedRecord, type DeployedRecord } from './deployed'

/** One object the mirror owes the origin. */
export interface PlatformObject {
  /** Mirror-relative path, `roboto/Roboto[wdth,wght].woff2`. */
  path: string
  /** Absolute path of the staged file. */
  file: string
  contentType: string
}

/**
 * Everything the origin must hold for this manifest to be true: every font file,
 * every family's own licence notice, and the aggregate index.
 *
 * Derived from the MANIFEST rather than from a directory walk, so a stray file
 * left in the staging directory by an older catalogue is never published — the
 * manifest is the statement of what the mirror is.
 */
export function platformObjects(cwd: string, manifest: PlatformFontManifest): PlatformObject[] {
  const staged = mirrorDir(cwd)
  const objects: PlatformObject[] = []
  const add = (rel: string, contentType: string): void => {
    objects.push({ path: rel, file: path.join(staged, ...rel.split('/')), contentType })
  }
  for (const family of manifest.families) {
    for (const file of family.files) add(file.path, 'font/woff2')
    add(family.licence_file, 'text/plain; charset=utf-8')
  }
  add(LICENCE_INDEX_FILE, 'text/plain; charset=utf-8')
  return objects
}

export interface PublishOptions {
  cwd: string
  /** Report what would move without moving it. */
  dryRun?: boolean
  env?: NodeJS.ProcessEnv
  onProgress?: (line: string) => void
}

/**
 * One local miniflare R2 store, and the app whose `wrangler dev` reads it
 * ([[REQ-315]]).
 *
 * DECLARED HERE, beside the report that carries it, rather than in `seed.ts`:
 * the two targets share one report type and one formatter precisely so that an
 * operator reads the same account of a run whichever of them delivered it, and
 * a type the report references cannot live downstream of the report.
 */
export interface LocalStore {
  /** App directory name, e.g. `control-app`. */
  app: string
  /** Repo-relative persist directory the store was written to. */
  persist: string
}

export interface PublishReport {
  bucket: string
  /** Objects sent by this run. */
  uploaded: number
  /** Objects already present with the right bytes, and therefore not sent. */
  unchanged: number
  /** Staged files the manifest names that are not on disk — the mirror is incomplete. */
  missing: string[]
  bytes: number
  dryRun: boolean
  /**
   * Which local stores were written — present only for the dev target
   * ([[REQ-315]]).
   *
   * REPORTED BECAUSE THE LOCAL BUCKET IS NOT ONE PLACE. `.wrangler/state` is per
   * app directory, so a seed that wrote one store leaves every other surface
   * 404ing the fonts the one beside it renders. Saying which stores answer is
   * the difference between that being a fact and being a surprise.
   */
  stores?: LocalStore[]
}

/** The bucket platform fonts are served from — the one public-site already reads. */
export const PLATFORM_BUCKET = '1stcontact-sites'

/**
 * Raised when the mirror cannot be delivered, with what to do about it.
 *
 * A {@link CommandError} SINCE [[REQ-315]], and that is a correction rather than
 * a refinement. A plain `Error` reaches the CLI's `fail()` as an unrecognised
 * throw and is printed `INTERNAL: …` — which tells an operator the tool has a
 * bug, when what actually happened is that they have not run `1c fonts mirror`
 * yet. Now that `bin/deploy --fonts` is a door an operator opens, the refusal on
 * the other side of it has to read as one; and the two targets have to read the
 * same, since they differ only in where the bytes go.
 */
export class PublishError extends CommandError {
  constructor(message: string, code: ErrorCode = 'NOT_FOUND') {
    super({ code, message })
    this.name = 'PublishError'
  }
}

/**
 * Upload the staged mirror.
 *
 * `fetch` against the REST API rather than a `wrangler r2 object put` per object:
 * at ten thousand objects the process-spawn cost alone is hours, and none of what
 * wrangler adds — bundling, bindings, config resolution — applies to putting a
 * byte range at a key.
 */
export async function runPublish(options: PublishOptions): Promise<PublishReport> {
  const { cwd, dryRun = false } = options
  const env = options.env ?? process.env
  const progress = options.onProgress ?? (() => {})

  const manifest = loadPlatformManifest(cwd)
  if (!manifest) {
    throw new PublishError(
      'There is no platform font mirror to publish. Run `1c fonts mirror --checkout <google/fonts>` first.',
    )
  }

  const objects = platformObjects(cwd, manifest)
  const missing = objects.filter((o) => !pathExists(o.file)).map((o) => o.path)
  const present = objects.filter((o) => pathExists(o.file))

  if (dryRun) {
    return {
      bucket: PLATFORM_BUCKET,
      uploaded: present.length,
      unchanged: 0,
      missing,
      bytes: present.reduce((n, o) => n + readFileSync(o.file).length, 0),
      dryRun: true,
    }
  }

  const cloud = await cloudBucket(env)

  let uploaded = 0
  let unchanged = 0
  let bytes = 0

  for (const object of present) {
    const body = readFileSync(object.file)
    bytes += body.length
    const key = platformFontKey(object.path)
    const url = cloud.url(key)

    // The digest is carried as object metadata on the way up and read back on the
    // way in, so "is this object already the right bytes" is one HEAD rather than a
    // download — which is what makes a resumed publish cheap instead of a second
    // full transfer.
    const digest = sha256(body)
    const head = await fetch(url, { method: 'HEAD', headers: cloud.auth })
    if (head.ok && head.headers.get('x-amz-meta-sha256') === digest) {
      unchanged += 1
      continue
    }

    const put = await fetch(url, {
      method: 'PUT',
      headers: {
        ...cloud.auth,
        'content-type': object.contentType,
        'x-amz-meta-sha256': digest,
      },
      body: new Uint8Array(body),
    })
    if (!put.ok) {
      throw new PublishError(
        `Could not write ${key} (HTTP ${put.status}). ${uploaded} object(s) landed before this one; ` +
          're-running resumes from here rather than starting again.',
      )
    }
    uploaded += 1
    progress(`  ↑ ${object.path}`)
  }

  // [[REQ-412]] — THE RECORD, LAST, and only for a whole mirror: it is what lets
  // the next `bin/deploy` skip the fonts, so it must never describe a half.
  if (missing.length === 0) {
    const put = await fetch(cloud.url(DEPLOYED_RECORD_KEY), {
      method: 'PUT',
      headers: { ...cloud.auth, 'content-type': 'application/json' },
      body: JSON.stringify(deployedRecord(mirrorDigests(manifest))),
    })
    if (!put.ok) {
      throw new PublishError(
        `Every font landed, but the deploy record could not be written (HTTP ${put.status}). ` +
          'The next deploy will re-check every object rather than skip; re-running fixes it.',
      )
    }
  }

  return { bucket: PLATFORM_BUCKET, uploaded, unchanged, missing, bytes, dryRun: false }
}

/** The platform bucket over the R2 REST API: an object URL and the header that authorises it. */
interface CloudBucket {
  url(key: string): string
  auth: Record<string, string>
}

/**
 * Open the cloud bucket — the one credential and the one account discovery both
 * the publish and [[REQ-412]]'s deploy check use.
 */
async function cloudBucket(env: NodeJS.ProcessEnv): Promise<CloudBucket> {
  const apiToken = env.CLOUDFLARE_API_TOKEN
  if (!apiToken) {
    throw new PublishError(
      'Publishing the font mirror needs R2: set CLOUDFLARE_API_TOKEN (the same credential ' +
        '`pnpm deploy:*` and `1c kb build` use). The account is discovered from the token, so ' +
        'CLOUDFLARE_ACCOUNT_ID is only needed to override that.',
      'ENVIRONMENT',
    )
  }
  const accountId = await resolveAccountId(apiToken, env)
  const base = `${CLOUDFLARE_API}/accounts/${accountId}/r2/buckets/${PLATFORM_BUCKET}/objects`
  return { url: (key) => `${base}/${encodeURIComponent(key)}`, auth: { Authorization: `Bearer ${apiToken}` } }
}

/**
 * [[REQ-412]] — the record the cloud bucket holds of its last full publish, or
 * `null` when it holds none. A failed read throws rather than answering `null`:
 * "could not ask" is not "never published".
 */
export async function readCloudRecord(env: NodeJS.ProcessEnv = process.env): Promise<DeployedRecord | null> {
  const cloud = await cloudBucket(env)
  const got = await fetch(cloud.url(DEPLOYED_RECORD_KEY), { headers: cloud.auth })
  if (got.status === 404) return null
  if (!got.ok) throw new PublishError(`Could not read the font deploy record (HTTP ${got.status}).`, 'ENVIRONMENT')
  return parseDeployedRecord(await got.text())
}

/** The licence index's mirror-relative name, as the serving origin spells it. */
export const LICENCE_INDEX_PATH = PLATFORM_LICENCE_INDEX
