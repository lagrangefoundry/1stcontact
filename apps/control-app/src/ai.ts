/**
 * The AI host's Cloudflare runtime (REQ-146).
 *
 * `host-core.ts` is the host — the session model, the tool loop, the per-turn
 * change signal, the three entry points. It names no filesystem and takes its
 * runtime as {@link HostDeps}. This file is the runtime workerd supplies, and it
 * is the exact counterpart of `ai/host.ts`, which supplies Node's.
 *
 * FOUR ADAPTERS, and each replaces a thing that used to be a disk:
 *
 *   | Node                        | Here                                    |
 *   |-----------------------------|-----------------------------------------|
 *   | `sharedModuleUrl('ai')`     | the bundled `/workers` rung             |
 *   | `FileArchive(dir)`          | {@link R2TranscriptArchive}             |
 *   | file junction under the cwd | `memoryJunctions()`                     |
 *   | `fileAuditSink` (appends)   | {@link bufferedAuditSink} + a flush     |
 *
 * WHY NOT `FileArchive`, EMPHATICALLY. `node:fs` RESOLVES in workerd under
 * `nodejs_compat` and gives a per-isolate, ephemeral filesystem: `os.homedir()`
 * answers `/tmp/`, writes succeed, reads come back. A file-backed archive
 * therefore passes every test here and loses every conversation in production,
 * on the next eviction. lagrange-framework REQ-103 measured exactly this before
 * drawing the junction port, and it is why the guard on this file is a static
 * import-graph assertion rather than a passing turn.
 *
 * WHERE THE KEYS LIVE, and why they cannot be reached from a URL. Transcripts go
 * to `chat/<tenant>/<session>.md`, audit to `audit/<tenant>/<session>/<n>.json`.
 * Both sit OUTSIDE `draft/`, which is the only prefix the site store composes,
 * and nothing in the router derives an R2 root from a request — DOC-12 §7. A
 * transcript is not a site and must never be servable as one.
 */

import * as aiLib from './generated/ai-workers.js'
import type { TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'
import type { HostDeps } from '../../../tools/generate/src/cli/ai/host-core'
import {
  bufferedAuditSink,
  type AuditLine,
  type BufferedAuditSink,
} from '../../../tools/generate/src/cli/ai/toolbox-core'

/** The library is untyped JavaScript; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const lib = aiLib as unknown as Untyped

/**
 * A `TranscriptArchive` over R2 (REQ-146), the port `FileArchive` also
 * implements.
 *
 * THE STORED FORM IS UNCHANGED, deliberately. `FileArchive` writes the
 * language-neutral session file — a JSON header plus the `xgd-chat` transcript —
 * and so does this, byte for byte, because `Session.toFile()` produces it and
 * `Session.fromFile()` round-trips it. A session archived by the Worker loads in
 * the Node host and in the Python peer. Inventing a Cloudflare-shaped row format
 * would have made the two runtimes stop being the same product.
 *
 * `apply` FOLDS RATHER THAN APPENDS: read the current file, apply the increment,
 * write it back. That is what the port asks for and what `FileArchive` does; R2
 * has no append, so the read-modify-write is explicit here rather than hidden in
 * an `O_APPEND`. The junction — not this — is the tier that needs cheap appends,
 * and `ArchiveSyncer` drains into this one off the critical path.
 *
 * A LOST RACE COSTS THE LATER WRITE, and cannot corrupt the file: R2 puts are
 * atomic per key, so a concurrent fold either wins or is overwritten whole.
 * Two writers to ONE session means two tabs driving one conversation, which the
 * junction already serialises upstream of here.
 */
export class R2TranscriptArchive {
  constructor(
    private readonly bucket: R2Bucket,
    private readonly tenantId: string,
  ) {}

  /** Outside `draft/`, so no site path can ever name it. */
  private key(sessionId: string): string {
    return `chat/${this.tenantId}/${sessionId}.md`
  }

  private get prefix(): string {
    return `chat/${this.tenantId}/`
  }

  async apply(sessionId: string, records: Untyped[]): Promise<void> {
    if (!records || records.length === 0) return
    const existing = await this.bucket.get(this.key(sessionId))
    const current = existing ? lib.Session.fromFile(await existing.text()) : null
    const session = lib.applyRecords(current, records)
    await this.bucket.put(this.key(sessionId), session.toFile(), {
      httpMetadata: { contentType: 'text/markdown; charset=utf-8' },
    })
  }

  async load(sessionId: string): Promise<Untyped> {
    const object = await this.bucket.get(this.key(sessionId))
    if (!object) {
      throw new Error(`No session file for ${JSON.stringify(sessionId)}`)
    }
    return lib.Session.fromFile(await object.text())
  }

  async list(): Promise<string[]> {
    const out: string[] = []
    let cursor: string | undefined
    // Paged, because a truncated listing would silently make old conversations
    // look absent — and `attach` reads this to decide whether a session exists,
    // so "absent" there means "start a new one over the top of it".
    for (;;) {
      const page = await this.bucket.list({ prefix: this.prefix, cursor })
      for (const o of page.objects) {
        if (o.key.endsWith('.md')) out.push(o.key.slice(this.prefix.length, -3))
      }
      if (!page.truncated) break
      cursor = page.cursor
    }
    return out.sort()
  }

  async homeRef(sessionId: string): Promise<string> {
    return this.key(sessionId)
  }
}

/**
 * Write a turn's audit records durably, one object per record.
 *
 * ONE OBJECT PER RECORD rather than a read-modify-write of a `.jsonl`. R2 has no
 * append, and a fold would make two concurrent turns able to lose each other's
 * records — an audit trail that drops entries under load is worse than none,
 * because it reads as evidence. Distinct keys cannot collide, so the write is
 * append-only by construction, which is what `appendFileSync` bought on Node.
 *
 * The key sorts chronologically: the record's own timestamp, then its index
 * within the flush, so replaying a session's audit is a prefix listing.
 */
export async function flushAudit(
  bucket: R2Bucket,
  tenantId: string,
  sessionId: string,
  lines: AuditLine[],
): Promise<void> {
  await Promise.all(
    lines.map((line, i) => {
      const stamp = String((line as Untyped).timestamp ?? '').replace(/[^0-9A-Za-z._-]/g, '-')
      const key = `audit/${tenantId}/${sessionId}/${stamp}-${String(i).padStart(4, '0')}.json`
      return bucket.put(key, JSON.stringify(line), {
        httpMetadata: { contentType: 'application/json; charset=utf-8' },
      })
    }),
  )
}

/** What the Worker needs to build a host: the store, the bindings, the secret. */
export interface WorkerAiEnv {
  SITES: R2Bucket
  TENANT_ID?: string
  /** A `wrangler secret`. Absent is an ordinary state — the panel says so. */
  ANTHROPIC_API_KEY?: string
}

/**
 * The Worker's {@link HostDeps}, plus the audit buffer its route must flush.
 *
 * The buffer is handed back rather than hidden because flushing is the ROUTE'S
 * job: upstream's `emit` is synchronous and swallows failures, so the durable
 * write cannot happen inside the sink, and in a Worker the isolate can go away
 * the moment the response ends. The route awaits {@link flushAudit} before it
 * finishes, which is what makes the trail survive the isolate that produced it.
 */
export interface WorkerHost {
  deps: HostDeps
  audit: BufferedAuditSink
  flush(sessionId: string): Promise<void>
}

/**
 * Build the host runtime for one request.
 *
 * The MANAGER CACHE is keyed by the store's object identity (`host-core.ts`), and
 * `storeFor` constructs a store per request so the tenant check is never stale —
 * so a fresh store per request would mean a fresh conversation per request. The
 * store handed in here is therefore the caller's to keep for as long as it wants
 * the conversation to live; `router.ts` holds one per isolate for the chat routes
 * alone, which is the one place that trade is the right way round.
 */
export function workerHost(
  env: WorkerAiEnv,
  store: TenantSiteStore,
  tenantId: string,
): WorkerHost {
  const audit = bufferedAuditSink()
  return {
    audit,
    deps: {
      lib,
      store,
      archive: new R2TranscriptArchive(env.SITES, tenantId),
      // The in-memory junction, per REQ-103's Cloudflare packaging. Its cost is
      // stated rather than hidden: an eviction mid-turn loses the turn in
      // flight, because `ArchiveSyncer` drains continuously and everything
      // before it is already in R2.
      junctions: lib.memoryJunctions(),
      audit: audit.sink,
      // Absent is fine and must stay fine: the backend's factory is lazy, so a
      // deployment with no key still opens the session, still replays the
      // transcript, and says why it cannot take a turn.
      ...(env.ANTHROPIC_API_KEY ? { apiKey: env.ANTHROPIC_API_KEY } : {}),
    },
    flush: (sessionId: string) =>
      flushAudit(env.SITES, tenantId, sessionId, audit.drain()),
  }
}
