import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

/**
 * REQ-141 — the workerd project proves it is workerd, with real bindings.
 *
 * Everything here would pass against a hand-written fake, which is exactly why
 * each assertion reaches for something a fake could not produce: SQLite's own
 * `sqlite_master` catalogue for D1, a round-tripped object body plus R2's
 * server-computed metadata for R2, and the runtime's own identity for the pool.
 */

const DB = (env as Record<string, any>).DB
const SITES = (env as Record<string, any>).SITES

describe('REQ-141 workers-runtime project', () => {
  it('runs inside workerd, not node', () => {
    // workerd reports itself here; node reports "Node.js/…" (or nothing at all).
    expect(navigator.userAgent).toBe('Cloudflare-Workers')
    // The Workers globals exist because this IS the Workers runtime.
    expect(typeof caches).toBe('object')
  })

  it('reaches a real D1 binding through cloudflare:test and applies a schema', async () => {
    expect(DB).toBeDefined()

    await DB.exec(
      'CREATE TABLE IF NOT EXISTS sites (slug TEXT PRIMARY KEY, definition TEXT NOT NULL)',
    )

    // SQLite's own catalogue — present only because a real engine executed the
    // DDL above. A stub that swallowed `exec` cannot answer this.
    const schema = await DB.prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?",
    )
      .bind('sites')
      .first()
    expect(schema?.sql).toContain('slug TEXT PRIMARY KEY')

    const definition = JSON.stringify({ pages: ['home'] })
    await DB.prepare('INSERT INTO sites (slug, definition) VALUES (?, ?)')
      .bind('acme', definition)
      .run()

    const row = await DB.prepare('SELECT definition FROM sites WHERE slug = ?')
      .bind('acme')
      .first()
    expect(row?.definition).toBe(definition)

    // The primary key is enforced by SQLite, not by us.
    await expect(
      DB.prepare('INSERT INTO sites (slug, definition) VALUES (?, ?)')
        .bind('acme', definition)
        .run(),
    ).rejects.toThrow()
  })

  it('writes and reads back a real R2 binding', async () => {
    expect(SITES).toBeDefined()

    const key = 'sites/acme/index.html'
    const body = '<!doctype html><title>acme</title>'

    const put = await SITES.put(key, body, {
      httpMetadata: { contentType: 'text/html' },
    })
    // R2 computes the etag and size itself — neither is echoed from the input.
    expect(put?.size).toBe(body.length)
    expect(put?.etag).toMatch(/^[0-9a-f]{32}$/)

    const got = await SITES.get(key)
    expect(got).not.toBeNull()
    expect(await got!.text()).toBe(body)
    expect(got!.httpMetadata?.contentType).toBe('text/html')

    const listed = await SITES.list({ prefix: 'sites/acme/' })
    expect(listed.objects.map((o: { key: string }) => o.key)).toContain(key)

    await SITES.delete(key)
    expect(await SITES.get(key)).toBeNull()
  })
})
