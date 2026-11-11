/**
 * {@link ReferenceStore} over R2 — REQ-155, the cloud half of [[DOC-13]] §8's
 * *"`storage/references/` bytes move to R2."*
 *
 * WHICH BUCKET, AND WHY IT IS NOT `SITES`. `BLOBS`, the bucket the ticket store's
 * attachments already use. `SITES` is bound by `apps/public-site`, the Worker
 * whose entire job is serving bytes to the public internet by path — and a
 * capture bundle is the client's *private* material: their old site, and
 * competitors' sites they will never hold the right to republish
 * ([[DOC-38]] §4.2, §7.1). Sharing that bucket would leave only routing code
 * between a third-party capture and a public URL, which is the disclosure shape
 * of BUG-31 rather than its overwrite shape, and a prefix is a convention where a
 * bucket boundary is not.
 *
 * KEYS. `t/<tenant>/ref/<name>/<member>` — [[DOC-38]] §7.2's tenant prefix, with
 * `ref` beside `blob` rather than inside it, because a bundle is a named
 * multi-member thing and an attachment blob is content-addressed and singular.
 * The prefix is what makes {@link ReferenceStoreRoot.forTenant}'s barrier
 * structural: a handle bound to one tenant composes every key from that tenant's
 * prefix and cannot address another's, so isolation is a property of the handle
 * rather than a predicate every query has to remember.
 *
 * NOT CONTENT-ADDRESSED, unlike the attachment blobs beside it, and deliberately.
 * A bundle's members are addressed by the names [[DOC-13]] §4 gives them because
 * the bundle IS its member names — `reextract` asks for `rendered.html`, the gate
 * asks for `multistate.json`, `refold` replaces `l1.json` in place. A
 * content-addressed layout would need a manifest to map names to hashes, which is
 * a second place for the member set to be and a thing that can disagree with the
 * bytes. Dedup across captures is the property that would buy
 * ([[DOC-38]] §9) and it is a `BlobStore` concern, one layer down, when that port
 * arrives.
 */
import { UnknownTenantError, type TenantRecord } from './d1r2-store'
import {
  ASSETS_PREFIX,
  sha256Hex,
  type MirroredMember,
  type ReferenceBundle,
  type ReferenceStore,
  type ReferenceStoreRoot,
} from './reference-store'

/** The two bindings this adapter needs, named as the Workers declare them. */
export interface ReferenceStoreEnv {
  /** The D1 database holding the tenant registry. Read for the barrier, nothing else. */
  DB: D1Database
  /** The bucket holding the client's private material — NOT `SITES`. See above. */
  BLOBS: R2Bucket
}

/** `t/<tenant>/ref/` — everything one tenant's references live under. */
function tenantPrefix(tenantId: string): string {
  return `t/${tenantId}/ref/`
}

/**
 * `t/<tenant>/ref/.mirrored/<sha256>` — the mirrored-subresource index (BUG-84).
 *
 * WHY AN INDEX. The rights gate on `POST /api/import` asks "did we mirror these
 * bytes?". Answered by walking the bundles it costs a GET and a hash of every
 * mirrored member of every capture the business holds, on every push — work
 * that grows with the business, on a Worker request (Architecture Policy #2,
 * #31, #35). Recording the hash when the member is WRITTEN turns the question
 * into one keyed GET per incoming asset, bounded by the request.
 *
 * WHY HERE, INSIDE `ref/`. The entries are the business's capture material as
 * much as the bundles are, so they sit under the prefix erasure already sweeps
 * ([[REQ-190]]), and a leading `.` cannot be a host — `list()` derives bundle
 * names from `<host>/<slug>/<member>` keys, and an index key has only two
 * segments, so it is never mistaken for a bundle.
 *
 * KEYED BY HASH, VALUED BY WHERE. The body is `{ bundle, member }`, so a refusal
 * still names both ends. A re-capture that replaces a member leaves the old
 * hash's entry in place: those bytes were still mirrored from a third party,
 * and the gate refusing them stays correct.
 */
const MIRRORED_SEGMENT = '.mirrored/'

function mirroredKey(tenantId: string, sha256: string): string {
  return `${tenantPrefix(tenantId)}${MIRRORED_SEGMENT}${sha256}`
}

/** Record that `tenantId`'s `bundle` mirrored `bytes` as `member`. */
async function indexMirrored(
  bucket: R2Bucket,
  tenantId: string,
  bundle: string,
  member: string,
  bytes: Uint8Array,
): Promise<void> {
  const sha256 = await sha256Hex(bytes)
  await bucket.put(mirroredKey(tenantId, sha256), JSON.stringify({ bundle, member }), {
    httpMetadata: { contentType: 'application/json' },
  })
}

/** Every key under `prefix`, paginated to exhaustion. */
async function keysUnder(bucket: R2Bucket, prefix: string): Promise<string[]> {
  const out: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await bucket.list({ prefix, cursor })
    for (const obj of page.objects) out.push(obj.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return out
}

function r2Bundle(bucket: R2Bucket, tenantId: string, name: string): ReferenceBundle {
  const prefix = `${tenantPrefix(tenantId)}${name}/`

  return {
    name,

    async read(member) {
      const obj = await bucket.get(`${prefix}${member}`)
      if (!obj) return null
      return new Uint8Array(await obj.arrayBuffer())
    },

    async write(member, bytes) {
      // INDEX FIRST, MEMBER SECOND (BUG-84): a write that dies between the two
      // leaves an entry for bytes the bundle never got — a refusal of bytes we
      // did fetch from a third party, which is safe. The other order would
      // leave mirrored bytes the gate cannot see.
      if (member.startsWith(ASSETS_PREFIX)) await indexMirrored(bucket, tenantId, name, member, bytes)
      // R2 takes an ArrayBuffer; a Uint8Array view over a larger buffer would
      // otherwise store the whole backing store rather than the view.
      await bucket.put(`${prefix}${member}`, bytes.slice().buffer)
    },

    async list(memberPrefix) {
      const keys = await keysUnder(bucket, memberPrefix ? `${prefix}${memberPrefix}` : prefix)
      return keys.map((key) => key.slice(prefix.length)).sort()
    },
  }
}

/**
 * The R2 reference store, before a tenant is chosen.
 *
 * `forTenant` runs the SAME registry check `d1r2SiteStore.forTenant` runs and
 * throws the SAME {@link UnknownTenantError}, rather than a second error type for
 * one condition — a caller catching "unknown tenant" must not have to know which
 * store refused it. References are no different from sites here: a captured
 * competitor site belongs to the account that captured it, and nothing reads
 * across.
 */
export function r2ReferenceStore(env: ReferenceStoreEnv): ReferenceStoreRoot {
  const { DB, BLOBS } = env

  return {
    async forTenant(tenantId) {
      const row = await DB.prepare('SELECT id, name, status FROM tenants WHERE id = ?')
        .bind(tenantId)
        .first<TenantRecord>()
      if (!row) throw new UnknownTenantError(tenantId, 'unknown')
      if (row.status !== 'active') throw new UnknownTenantError(tenantId, 'inactive')

      const store: ReferenceStore = {
        bundle(name) {
          return r2Bundle(BLOBS, tenantId, name)
        },
        async list() {
          const prefix = tenantPrefix(tenantId)
          const names = new Set<string>()
          for (const key of await keysUnder(BLOBS, prefix)) {
            // `<host>/<slug>/<member…>` — the name is the first two segments,
            // which is what `bundleNameFor` composes and every adapter agrees on.
            const rest = key.slice(prefix.length).split('/')
            if (rest.length >= 3) names.add(`${rest[0]}/${rest[1]}`)
          }
          return [...names].sort()
        },
        async findMirrored(hashes) {
          // One keyed GET per DISTINCT hash asked about — bounded by the request
          // that asked, never by how many captures the business holds. Nothing
          // here lists a bundle or reads a member.
          const found: MirroredMember[] = []
          for (const sha256 of new Set(hashes)) {
            if (!SHA256_HEX.test(sha256)) continue
            const entry = await BLOBS.get(mirroredKey(tenantId, sha256))
            if (!entry) continue
            const where = parseIndexEntry(await entry.text())
            if (where) found.push({ sha256, ...where })
          }
          return found
        },
      }
      return store
    },
  }
}

const SHA256_HEX = /^[0-9a-f]{64}$/

function parseIndexEntry(body: string): { bundle: string; member: string } | null {
  try {
    const value = JSON.parse(body) as { bundle?: unknown; member?: unknown }
    if (typeof value.bundle === 'string' && typeof value.member === 'string') {
      return { bundle: value.bundle, member: value.member }
    }
  } catch {
    // An unreadable entry still records that the bytes were mirrored.
  }
  return { bundle: '(unknown capture)', member: '(unknown member)' }
}

/**
 * `t/<tenant>/ref/<host>/<slug>/assets/<file>` — a mirrored member's key, split
 * into the tenant, the bundle name and the member key.
 */
const MIRRORED_MEMBER_KEY = /^t\/([^/]+)\/ref\/([^/.][^/]*\/[^/]+)\/(assets\/.+)$/

/** Progress of {@link backfillMirroredIndex}: where to resume, and whether it is done. */
export interface MirroredBackfillProgress {
  /** The R2 list cursor to resume from; absent at the start. */
  cursor?: string
  /** True once every key has been visited. */
  done: boolean
  /** How many mirrored members this step indexed. */
  indexed: number
}

/** The most keys one backfill step visits — what bounds a step by construction. */
export const MIRRORED_BACKFILL_PAGE = 50

/**
 * ONE STEP of the backfill that indexes captures written before the index
 * existed (BUG-84). Never called from a request: it is the body of the
 * control-app's Cron Trigger (Architecture Policy #8), which runs one step per
 * tick and keeps the cursor in R2, so a killed tick resumes rather than
 * restarts and the whole job is recomputable from storage.
 *
 * BOUNDED BY CONSTRUCTION: one list page of at most `limit` keys, and at most
 * `limit` member reads, whatever the bucket holds. Re-indexing a member that
 * is already indexed writes the same entry, so a repeated step is harmless.
 */
export async function backfillMirroredIndex(
  bucket: R2Bucket,
  from: { cursor?: string },
  limit: number = MIRRORED_BACKFILL_PAGE,
): Promise<MirroredBackfillProgress> {
  const page = await bucket.list({ prefix: 't/', cursor: from.cursor, limit })
  let indexed = 0
  for (const obj of page.objects) {
    const match = MIRRORED_MEMBER_KEY.exec(obj.key)
    if (!match) continue
    const [, tenantId, bundle, member] = match
    const body = await bucket.get(obj.key)
    if (!body) continue
    await indexMirrored(bucket, tenantId, bundle, member, new Uint8Array(await body.arrayBuffer()))
    indexed++
  }
  return page.truncated ? { cursor: page.cursor, done: false, indexed } : { done: true, indexed }
}
