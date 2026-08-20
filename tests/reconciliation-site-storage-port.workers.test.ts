import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

/**
 * Reconciliation UAT for story-3f4a5f2b, AC-1328 — one invocation runs two
 * runtimes, and a test file's runtime is legible from its name alone.
 *
 * THIS FILE IS ITS OWN EVIDENCE. It carries the `.workers` marker and it imports
 * `cloudflare:test`, a module that exists only inside the Workers pool — so if
 * the routing convention did not hold, this file would not have loaded, let
 * alone reported the Workers user agent. Its sibling
 * `reconciliation-site-storage-port.test.ts` carries the other half: it imports
 * `node:fs` at module scope, so it could only have loaded where a filesystem
 * exists, and it asserts that the two inclusion rules partition the test files
 * with none claimed by both and none by neither.
 *
 * Every assertion below reaches for something a hand-written fake could not
 * produce — SQLite's own catalogue, a primary key the engine enforces, and R2's
 * server-computed size and entity tag — because a binding that were merely
 * shaped like D1 or R2 would prove nothing about where the store will run.
 */

// Reached the way the sibling workerd suite reaches them: the Workers type
// definitions are not in this project's `tsc` graph (the node tsconfig owns
// `tests/`), so the bindings are read loosely here and proved strictly below.
const DB = (env as Record<string, any>).DB
const SITES = (env as Record<string, any>).SITES

describe('story-3f4a5f2b — the Workers runtime, with real bindings', () => {
  it('test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings', async () => {
    // ── the runtime is workerd, not node ─────────────────────────────────────
    expect(navigator.userAgent).toBe('Cloudflare-Workers')
    expect(typeof caches).toBe('object')

    // ── the bindings are named as the deployed Workers name them ─────────────
    // `SITES` is the R2 bucket `1c deploy` publishes to (public-site's
    // wrangler.toml); `DB` is the D1 database the store port will use. Asserted
    // against the runtime rather than against a config file, so a rename that
    // broke a deployed Worker could not pass here.
    expect(DB).toBeDefined()
    expect(SITES).toBeDefined()

    // ── a real database binding: schema applied, read back, row round-tripped,
    //    primary key enforced by the database rather than by the test ─────────
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

    const definition = JSON.stringify({ pages: ['home.json'], palette: { 'brand-teal': '#0d9488' } })
    await DB.prepare('INSERT INTO sites (slug, definition) VALUES (?, ?)')
      .bind('ac1328', definition)
      .run()

    const row = await DB.prepare('SELECT definition FROM sites WHERE slug = ?')
      .bind('ac1328')
      .first()
    expect(row?.definition).toBe(definition)

    await expect(
      DB.prepare('INSERT INTO sites (slug, definition) VALUES (?, ?)')
        .bind('ac1328', definition)
        .run(),
    ).rejects.toThrow()

    // ── a real object-store binding: size and entity tag computed by the object
    //    store, and stored metadata surviving the round trip ──────────────────
    const key = 'sites/ac1328/index.html'
    const body = '<!doctype html><title>ac1328</title>'

    const put = await SITES.put(key, body, { httpMetadata: { contentType: 'text/html' } })
    // Neither is echoed from the input — R2 computes both itself.
    expect(put?.size).toBe(body.length)
    expect(put?.etag).toMatch(/^[0-9a-f]{32}$/)

    const got = await SITES.get(key)
    expect(got).not.toBeNull()
    expect(await got!.text()).toBe(body)
    expect(got!.httpMetadata?.contentType).toBe('text/html')

    const listed = await SITES.list({ prefix: 'sites/ac1328/' })
    expect(listed.objects.map((o: { key: string }) => o.key)).toContain(key)

    await SITES.delete(key)
    expect(await SITES.get(key)).toBeNull()

    // Cleanup, so a re-run of this file starts from the same state it assumes.
    await DB.prepare('DELETE FROM sites WHERE slug = ?').bind('ac1328').run()
  })
})
