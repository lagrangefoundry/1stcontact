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
import type { ReferenceBundle, ReferenceStore, ReferenceStoreRoot } from './reference-store'

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
      }
      return store
    },
  }
}
