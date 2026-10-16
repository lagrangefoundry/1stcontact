import { heldRefusal, type DraftLeases, type Lease } from './leases'

/**
 * [[REQ-397]] — draft-file leases in D1 (`draft_leases`, migration 0029).
 *
 * ACQUIRE IS ONE BATCH, so it is all-or-nothing across isolates. The batch's
 * first statement is a guard in the shape `d1r2-store.ts` uses for its
 * compare-and-set: it re-inserts any requested row held by another unexpired
 * holder, the primary key refuses it, and D1 rolls the whole batch back. Only
 * then does this read who held what, to say so.
 */

interface Row {
  file: string
  holder: string
  acquired_at: number
  expires_at: number
}

const asLease = (row: Row): Lease => ({
  file: row.file,
  holder: row.holder,
  acquiredAt: row.acquired_at,
  expiresAt: row.expires_at,
})

/** D1 binds at most 100 parameters per statement; a file list is chunked well under that. */
const CHUNK = 50

function chunks<T>(items: readonly T[]): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += CHUNK) out.push(items.slice(i, i + CHUNK))
  return out
}

const marks = (n: number): string => Array.from({ length: n }, () => '?').join(', ')

export function d1Leases(DB: D1Database, now: () => number = Date.now): DraftLeases {
  const held = async (site: string): Promise<Lease[]> => {
    const { results } = await DB.prepare(
      'SELECT file, holder, acquired_at, expires_at FROM draft_leases WHERE site_id = ? AND expires_at > ? ORDER BY file',
    )
      .bind(site, now())
      .all<Row>()
    return (results ?? []).map(asLease)
  }

  return {
    held,

    async acquire(site, files, holder, idleMs) {
      if (files.length === 0) return
      const t = now()
      const statements: D1PreparedStatement[] = [
        DB.prepare('DELETE FROM draft_leases WHERE site_id = ? AND expires_at <= ?').bind(site, t),
      ]
      for (const part of chunks(files)) {
        statements.push(
          DB.prepare(
            'INSERT INTO draft_leases (site_id, file, holder, acquired_at, expires_at) ' +
              'SELECT site_id, file, holder, acquired_at, expires_at FROM draft_leases ' +
              `WHERE site_id = ? AND holder <> ? AND expires_at > ? AND file IN (${marks(part.length)})`,
          ).bind(site, holder, t, ...part),
        )
      }
      for (const file of files) {
        statements.push(
          DB.prepare(
            'INSERT INTO draft_leases (site_id, file, holder, acquired_at, expires_at) VALUES (?, ?, ?, ?, ?) ' +
              'ON CONFLICT (site_id, file) DO UPDATE SET holder = excluded.holder, ' +
              'acquired_at = CASE WHEN draft_leases.holder = excluded.holder THEN draft_leases.acquired_at ' +
              'ELSE excluded.acquired_at END, expires_at = excluded.expires_at',
          ).bind(site, file, holder, t, t + idleMs),
        )
      }
      try {
        await DB.batch(statements)
      } catch (err) {
        const blocking = (await held(site)).find((l) => files.includes(l.file) && l.holder !== holder)
        if (blocking) throw heldRefusal(blocking, now())
        throw err
      }
    },

    async renew(site, holder, idleMs) {
      const t = now()
      await DB.prepare('UPDATE draft_leases SET expires_at = ? WHERE site_id = ? AND holder = ? AND expires_at > ?')
        .bind(t + idleMs, site, holder, t)
        .run()
    },

    async release(site, holder, files) {
      if (!files) {
        await DB.prepare('DELETE FROM draft_leases WHERE site_id = ? AND holder = ?').bind(site, holder).run()
        return
      }
      if (files.length === 0) return
      await DB.batch(
        chunks(files).map((part) =>
          DB.prepare(
            `DELETE FROM draft_leases WHERE site_id = ? AND holder = ? AND file IN (${marks(part.length)})`,
          ).bind(site, holder, ...part),
        ),
      )
    },
  }
}
