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
import { LICENCE_INDEX_FILE, loadPlatformManifest, mirrorDir } from './mirror'
import { sha256 } from './upstream'

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
}

/** The bucket platform fonts are served from — the one public-site already reads. */
export const PLATFORM_BUCKET = '1stcontact-sites'

/** Raised when the mirror cannot be published, with what to do about it. */
export class PublishError extends Error {}

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

  const apiToken = env.CLOUDFLARE_API_TOKEN
  if (!apiToken) {
    throw new PublishError(
      'Publishing the font mirror needs R2: set CLOUDFLARE_API_TOKEN (the same credential ' +
        '`pnpm deploy:*` and `1c kb build` use). The account is discovered from the token, so ' +
        'CLOUDFLARE_ACCOUNT_ID is only needed to override that.',
    )
  }
  const accountId = await resolveAccountId(apiToken, env)
  const base = `${CLOUDFLARE_API}/accounts/${accountId}/r2/buckets/${PLATFORM_BUCKET}/objects`
  const auth = { Authorization: `Bearer ${apiToken}` }

  let uploaded = 0
  let unchanged = 0
  let bytes = 0

  for (const object of present) {
    const body = readFileSync(object.file)
    bytes += body.length
    const key = platformFontKey(object.path)
    const url = `${base}/${encodeURIComponent(key)}`

    // The digest is carried as object metadata on the way up and read back on the
    // way in, so "is this object already the right bytes" is one HEAD rather than a
    // download — which is what makes a resumed publish cheap instead of a second
    // full transfer.
    const digest = sha256(body)
    const head = await fetch(url, { method: 'HEAD', headers: auth })
    if (head.ok && head.headers.get('x-amz-meta-sha256') === digest) {
      unchanged += 1
      continue
    }

    const put = await fetch(url, {
      method: 'PUT',
      headers: {
        ...auth,
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

  return { bucket: PLATFORM_BUCKET, uploaded, unchanged, missing, bytes, dryRun: false }
}

/** The licence index's mirror-relative name, as the serving origin spells it. */
export const LICENCE_INDEX_PATH = PLATFORM_LICENCE_INDEX
