import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * The R2 upload boundary (REQ-110).
 *
 * `1c deploy` writes rendered snapshots to an R2 bucket. Everything above this
 * file talks to {@link R2Client} and nothing else, so the whole deploy pipeline
 * is drivable in tests against an in-memory fake — the suite never touches the
 * network.
 *
 * The shipping implementation shells out to `wrangler r2 object`, which the
 * repo already depends on. The S3 API (`@aws-sdk/client-s3`) would need a
 * separate R2 access key *and* a dependency install; sites are 4–13 files, so
 * per-file `wrangler` invocations cost a few seconds and zero new dependencies.
 */

/** The bucket rendered snapshots are published to. */
export const DEPLOY_BUCKET = '1stcontact-sites'

export interface R2Client {
  /** Upload a local file to `key`, replacing anything already there. */
  put(key: string, localPath: string, contentType?: string): Promise<void>
  /** Upload in-memory text to `key`. */
  putText(key: string, body: string, contentType?: string): Promise<void>
  /** Read `key` as text, or `null` when the object does not exist. */
  get(key: string): Promise<string | null>
  /** Delete `key`. Deleting an absent key is not an error. */
  delete(key: string): Promise<void>
  /**
   * Record that `keys` are about to be written — the write-ahead half of
   * {@link R2Client.list}.
   *
   * R2 itself lists objects, but `wrangler r2 object` exposes only get/put/
   * delete, so {@link WranglerR2Client} answers `list` from a key index it keeps
   * in the bucket. Recording *before* uploading is what makes `--prune` able to
   * collect a snapshot whose upload or manifest write was interrupted: the index
   * remembers the keys even though nothing references them. This seam exists so
   * the index can be deleted outright the day a client with a real LIST arrives.
   */
  record(keys: string[]): Promise<void>
  /** Every known key under `prefix`, sorted. */
  list(prefix: string): Promise<string[]>
}

/** Content types for the file kinds a rendered snapshot contains. */
const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
}

/** The MIME type to publish `key` with; `application/octet-stream` when unknown. */
export function contentTypeFor(key: string): string {
  return CONTENT_TYPES[path.extname(key).toLowerCase()] ?? 'application/octet-stream'
}

/** Where {@link WranglerR2Client} keeps its key index (see {@link R2Client.record}). */
export const KEY_INDEX_KEY = '_index.json'

interface KeyIndex {
  keys: string[]
}

export interface WranglerR2Options {
  bucket?: string
  /** Directory `wrangler` is invoked from (default: process cwd). */
  cwd?: string
}

/**
 * {@link R2Client} backed by the `wrangler r2 object` CLI.
 *
 * Every call is a separate `wrangler` process. That is fine at snapshot scale
 * and keeps the dependency footprint at zero, but it does mean a deploy is
 * `O(files)` process spawns — do not reach for this client to move a corpus.
 */
export class WranglerR2Client implements R2Client {
  private readonly bucket: string
  private readonly cwd: string
  /** Lazily-loaded key index; `null` until first read. */
  private index: KeyIndex | null = null

  constructor(opts: WranglerR2Options = {}) {
    this.bucket = opts.bucket ?? DEPLOY_BUCKET
    this.cwd = opts.cwd ?? process.cwd()
  }

  async put(key: string, localPath: string, contentType?: string): Promise<void> {
    this.wrangler([
      'r2',
      'object',
      'put',
      `${this.bucket}/${key}`,
      '--file',
      localPath,
      '--content-type',
      contentType ?? contentTypeFor(key),
      '--remote',
    ])
  }

  async putText(key: string, body: string, contentType?: string): Promise<void> {
    const dir = mkdtempSync(path.join(tmpdir(), '1c-r2-'))
    const file = path.join(dir, path.basename(key) || 'object')
    try {
      writeFileSync(file, body, 'utf8')
      await this.put(key, file, contentType)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }

  async get(key: string): Promise<string | null> {
    const dir = mkdtempSync(path.join(tmpdir(), '1c-r2-'))
    const file = path.join(dir, 'object')
    try {
      this.wrangler(['r2', 'object', 'get', `${this.bucket}/${key}`, '--file', file, '--remote'])
      return existsSync(file) ? readFileSync(file, 'utf8') : null
    } catch {
      // `wrangler r2 object get` exits non-zero for a missing key; absence is a
      // normal answer here (a site's first deploy has no manifest yet), so it is
      // reported as null rather than raised.
      return null
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }

  async delete(key: string): Promise<void> {
    this.wrangler(['r2', 'object', 'delete', `${this.bucket}/${key}`, '--remote'])
    const index = await this.loadIndex()
    const next = index.keys.filter((k) => k !== key)
    if (next.length !== index.keys.length) {
      this.index = { keys: next }
      await this.saveIndex()
    }
  }

  async record(keys: string[]): Promise<void> {
    const index = await this.loadIndex()
    const merged = new Set(index.keys)
    for (const k of keys) merged.add(k)
    if (merged.size === index.keys.length) return
    this.index = { keys: [...merged].sort() }
    await this.saveIndex()
  }

  async list(prefix: string): Promise<string[]> {
    const index = await this.loadIndex()
    return index.keys.filter((k) => k.startsWith(prefix)).sort()
  }

  private async loadIndex(): Promise<KeyIndex> {
    if (this.index) return this.index
    const raw = await this.get(KEY_INDEX_KEY)
    this.index = raw ? (JSON.parse(raw) as KeyIndex) : { keys: [] }
    return this.index
  }

  private async saveIndex(): Promise<void> {
    await this.putText(
      KEY_INDEX_KEY,
      JSON.stringify(this.index ?? { keys: [] }, null, 2) + '\n',
      'application/json',
    )
  }

  /** Run `wrangler` with `args`, throwing with its stderr on a non-zero exit. */
  private wrangler(args: string[]): void {
    const local = path.join(this.cwd, 'node_modules', '.bin', 'wrangler')
    const bin = existsSync(local) ? local : 'wrangler'
    try {
      execFileSync(bin, args, { cwd: this.cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    } catch (err) {
      const stderr = (err as { stderr?: Buffer }).stderr?.toString().trim()
      throw new Error(`wrangler ${args.join(' ')} failed${stderr ? `:\n${stderr}` : ''}`)
    }
  }
}

/**
 * An in-memory {@link R2Client}. Exported because it is the seam the REQ-110
 * UATs drive — the deploy pipeline runs end-to-end against this with no network.
 */
export class MemoryR2Client implements R2Client {
  readonly objects = new Map<string, Buffer>()
  private readonly recorded = new Set<string>()

  async put(key: string, localPath: string): Promise<void> {
    this.objects.set(key, readFileSync(localPath))
    this.recorded.add(key)
  }

  async putText(key: string, body: string): Promise<void> {
    this.objects.set(key, Buffer.from(body, 'utf8'))
    this.recorded.add(key)
  }

  async get(key: string): Promise<string | null> {
    const buf = this.objects.get(key)
    return buf ? buf.toString('utf8') : null
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key)
    this.recorded.delete(key)
  }

  async record(keys: string[]): Promise<void> {
    for (const k of keys) this.recorded.add(k)
  }

  async list(prefix: string): Promise<string[]> {
    const keys = new Set<string>([...this.objects.keys(), ...this.recorded])
    return [...keys].filter((k) => k.startsWith(prefix)).sort()
  }
}
