import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import http from 'node:http'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import { copyReproToDev } from '../tools/generate/src/cli/copy'
import { readSitePayload } from '../tools/generate/src/cli/push'
import {
  assertRights,
  MirroredAssetError,
  readRightsRecord,
} from '../tools/generate/src/store/asset-rights'
import { fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'
import { memorySiteStore } from '../tools/generate/src/store/memory-store'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { ASSETS_PREFIX, RIGHTS_MEMBER } from '../tools/generate/src/store/reference-store'

/**
 * REQ-392 — `bin/copy-repro-to-dev`, and the recorded rights decision that lets a
 * reproduction of a site we own reach the builder.
 *
 * WHAT IS BEING PROVED. A reproduction's draft under
 * `storage/sandbox/<slug>/draft` lands in an existing business in the local
 * builder through `/b/<id>/api/import`, addressed by the business's name or its
 * id — including a business the caller hosts without being a member of, which
 * the membership list alone could not name. And BUG-84's gate, which refuses
 * every mirrored subresource, now reads one more fact: the capture's
 * `rights.json`, written by `1c rights assert`, saying who holds the right, when
 * it was asserted, for which capture, and why. Without one the copy is refused
 * exactly as before.
 *
 * THE REAL COMMAND, OVER REAL HTTP, IN A REAL WORKING TREE. The cases that are
 * the operator's experience spawn `bin/copy-repro-to-dev` and `bin/1c rights`
 * with the working directory set to a temp tree holding a sandbox draft and a
 * capture bundle, against a loopback builder that answers the three routes the
 * command uses and records every request. The rest call the same exported
 * functions with only `fetch` injected — the transport, which is the external
 * boundary here.
 */

const REPO_ROOT = join(__dirname, '..')
const run = promisify(execFile)

/** The captured photograph, byte for byte what `1c repro` mirrors into a draft. */
const PHOTO = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 3, 9, 2, 1, 7, 7])
const BUNDLE = 'faelan.com/index'
const REPRO = 'repro-faelan-com'

/** A working tree holding one reproduction and the capture it came from. */
function workspace(): string {
  const work = mkdtempSync(join(tmpdir(), 'req392-'))
  const write = (rel: string, bytes: string | Uint8Array): void => {
    const file = join(work, rel)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, bytes)
  }
  const draft = `storage/sandbox/${REPRO}/draft`
  write(`${draft}/site.json`, JSON.stringify({ name: 'faelan.com' }))
  write(`${draft}/pages/index.json`, JSON.stringify({ kind: 'page', title: 'Home' }))
  write(`${draft}/assets/hero.jpg`, PHOTO)
  const ref = `storage/references/${BUNDLE}`
  write(`${ref}/capture.json`, JSON.stringify({ host: 'faelan.com', path: '/' }))
  write(`${ref}/${ASSETS_PREFIX}hero.jpg`, PHOTO)
  return work
}

interface Seen {
  method: string
  path: string
  headers: http.IncomingHttpHeaders
  body: Record<string, unknown> | null
}

/**
 * A local builder: one membership, one business reachable only through the
 * platform directory, and an import route that refuses `biz_busy` with BUG-51's
 * 409 unless forced.
 */
function builderAnswer(path: string, method: string, body: Record<string, unknown> | null) {
  if (path === '/api/businesses') {
    return {
      status: 200,
      body: {
        person: null,
        businesses: [
          { id: 'biz_member', name: 'Member Co', selectable: true, lapse: null },
          { id: 'biz_busy', name: 'Busy Co', selectable: true, lapse: null },
        ],
        ownsPlatformBusiness: true,
        entered: null,
      },
    }
  }
  if (path === '/api/admin/sites') {
    // Two sites for the hosted business — the directory is one row per SITE,
    // and the business must still resolve to one target.
    return {
      status: 200,
      body: {
        sites: [
          { site: 'site_a', business: 'biz_hosted', businessName: 'faelan.com' },
          { site: 'site_b', business: 'biz_hosted', businessName: 'faelan.com' },
          { site: 'site_c', business: 'biz_member', businessName: 'Member Co' },
        ],
      },
    }
  }
  const m = /^\/b\/([^/]+)\/api\/import$/.exec(path)
  if (m && method === 'POST' && body) {
    if (m[1] === 'biz_busy' && body.force !== true) {
      return {
        status: 409,
        body: {
          error: `Site '${String(body.slug)}' has 3 change(s) made in the builder. Importing would replace them. Nothing was written.`,
          changes: 3,
          force: 'Re-send with "force": true (bin/copy-to-cloud --force).',
        },
      }
    }
    const pages = Array.isArray(body.pages) ? body.pages.length : 0
    const assets = Array.isArray(body.assets) ? body.assets.length : 0
    return { status: 200, body: { site: `site_of_${m[1]}`, pages, assets, siteJson: true } }
  }
  return { status: 404, body: { error: `no route ${path}` } }
}

/** The same builder, as an injected `fetch`. */
function fakeBuilder() {
  const seen: Seen[] = []
  const impl = (async (url: string, init: RequestInit) => {
    const u = new URL(url)
    const body = typeof init.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : null
    const method = init.method ?? 'GET'
    seen.push({ method, path: u.pathname, headers: init.headers as http.IncomingHttpHeaders, body })
    const a = builderAnswer(u.pathname, method, body)
    return {
      ok: a.status >= 200 && a.status < 300,
      status: a.status,
      text: () => Promise.resolve(JSON.stringify(a.body)),
    }
  }) as unknown as typeof fetch
  return { impl, seen }
}

const posts = (seen: Seen[]): Seen[] => seen.filter((s) => s.method === 'POST')

describe('REQ-392 — the operator script, end to end', () => {
  let server: http.Server
  let origin = ''
  const seen: Seen[] = []
  const work: string[] = []

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const chunks: Buffer[] = []
      req.on('data', (c: Buffer) => chunks.push(c))
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : null
        const path = new URL(req.url ?? '/', 'http://127.0.0.1').pathname
        seen.push({ method: req.method ?? 'GET', path, headers: req.headers, body })
        const a = builderAnswer(path, req.method ?? 'GET', body)
        res.statusCode = a.status
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(a.body))
      })
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const addr = server.address()
    origin = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`
  })

  afterAll(() => {
    server.close()
    for (const w of work) rmSync(w, { recursive: true, force: true })
  })

  const fresh = (): string => {
    const w = workspace()
    work.push(w)
    seen.length = 0
    return w
  }
  const env = { ...process.env, LOCAL_ACCESS_CLIENT_ID: '', LOCAL_ACCESS_CLIENT_SECRET: '' }

  it('test_UAT_FC_REQ-392_a_mirrored_repro_is_refused_without_a_rights_record_and_nothing_is_posted', async () => {
    // BUG-84's rule, unchanged for a capture that carries no record: the repro's
    // only picture is byte-for-byte a mirrored subresource, so the copy is
    // refused before anything is sent — and the refusal says how to RECORD the
    // decision, never how to get past it.
    const cwd = fresh()
    const failure = await run(
      join(REPO_ROOT, 'bin/copy-repro-to-dev'),
      ['--origin', origin, REPRO, 'faelan.com'],
      { cwd, env },
    ).catch((err: { stderr?: string; stdout?: string }) => err)

    const said = `${(failure as { stderr?: string }).stderr ?? ''}${(failure as { stdout?: string }).stdout ?? ''}`
    expect(said).toContain('republish')
    expect(said).toContain(`${BUNDLE}/assets/hero.jpg`)
    expect(said).toContain(`1c rights assert ${BUNDLE}`)
    expect(posts(seen)).toEqual([])
  }, 120000)

  it('test_UAT_FC_REQ-392_rights_assert_records_who_when_which_bundle_and_why_and_show_reads_it_back', async () => {
    // The decision is a file on the capture, readable afterwards by anybody:
    // who asserted it, when, for which bundle, and on what grounds.
    const cwd = fresh()
    const before = Date.now()
    const { stdout } = await run(
      join(REPO_ROOT, 'bin/1c'),
      ['rights', 'assert', BUNDLE, '--basis', "the operator's son's own site", '--by', 'op@example.test', '--json'],
      { cwd, env },
    )
    const written = JSON.parse(stdout).data as Record<string, unknown>
    const onDisk = JSON.parse(
      readFileSync(join(cwd, 'storage/references', BUNDLE, RIGHTS_MEMBER), 'utf8'),
    ) as Record<string, unknown>
    expect(onDisk).toEqual(written)
    expect(onDisk).toMatchObject({
      republishable: true,
      bundle: BUNDLE,
      assertedBy: 'op@example.test',
      basis: "the operator's son's own site",
    })
    expect(Date.parse(String(onDisk.assertedAt))).toBeGreaterThanOrEqual(before - 1000)

    const shown = await run(join(REPO_ROOT, 'bin/1c'), ['rights', 'show', BUNDLE, '--json'], { cwd, env })
    expect(JSON.parse(shown.stdout).data).toEqual([onDisk])

    // A recorded decision is not silently rewritten.
    await expect(
      run(join(REPO_ROOT, 'bin/1c'), ['rights', 'assert', BUNDLE, '--basis', 'again'], { cwd, env }),
    ).rejects.toThrow(/already carries a rights record/)
  }, 120000)

  it('test_UAT_FC_REQ-392_with_a_rights_record_the_repro_lands_by_name_in_a_business_only_the_directory_knows', async () => {
    // The reported case: the operator hosts `faelan.com` without being a member
    // of it, so the membership list cannot name it; the platform directory can.
    // With the capture's rights recorded, the draft lands — pages, site.json and
    // the mirrored picture — at that business's own import route, under the
    // simulator's pair, and nothing is published.
    const cwd = fresh()
    await assertRights(fsReferenceStore(cwd).bundle(BUNDLE), {
      by: 'op@example.test',
      basis: "the operator's son's own site",
    })

    const { stdout } = await run(
      join(REPO_ROOT, 'bin/copy-repro-to-dev'),
      ['--origin', origin, REPRO, 'faelan.com'],
      { cwd, env },
    )

    const [post] = posts(seen)
    expect(posts(seen)).toHaveLength(1)
    expect(post?.path).toBe('/b/biz_hosted/api/import')
    expect(post?.headers['cf-access-client-id']).toBe('local-dev.access')
    expect(post?.headers['cf-access-client-secret']).toBe('local-dev-secret')
    expect(post?.body?.siteJson).toEqual({ name: 'faelan.com' })
    expect(post?.body?.pages).toEqual([{ name: 'index.json', page: { kind: 'page', title: 'Home' } }])
    expect(post?.body?.assets).toEqual([
      { name: 'hero.jpg', base64: Buffer.from(PHOTO).toString('base64') },
    ])
    expect(post?.body && 'force' in post.body).toBe(false)

    expect(stdout).toContain("'faelan.com' (biz_hosted)")
    expect(stdout).toContain('pages   1 (index.json)')
    expect(stdout).toContain('assets  1')
    expect(stdout).toContain('nothing was published')
  }, 120000)
})

describe('REQ-392 — resolving the business, and what the import answers', () => {
  const work: string[] = []
  afterAll(() => {
    for (const w of work) rmSync(w, { recursive: true, force: true })
  })
  /** A workspace whose capture's rights are recorded, so the gate is not what is under test. */
  async function owned(): Promise<string> {
    const w = workspace()
    work.push(w)
    await assertRights(fsReferenceStore(w).bundle(BUNDLE), { by: 'op@example.test', basis: 'ours' })
    return w
  }

  it('test_UAT_FC_REQ-392_a_business_named_by_its_id_lands_at_that_id', async () => {
    const cwd = await owned()
    const { impl, seen } = fakeBuilder()
    const result = await copyReproToDev(REPRO, 'biz_member', { cwd, origin: 'http://sim.test', fetch: impl })

    expect(posts(seen).map((s) => s.path)).toEqual(['/b/biz_member/api/import'])
    expect(result.to).toEqual({ id: 'biz_member', name: 'Member Co' })
    expect(result.pages).toEqual(['index.json'])
    expect(result.assets).toEqual(['hero.jpg'])
    expect(result.landed).toEqual({ site: 'site_of_biz_member', pages: 1, assets: 1, siteJson: true })
  })

  it('test_UAT_FC_REQ-392_a_business_that_does_not_exist_is_refused_naming_what_does_and_nothing_is_posted', async () => {
    // Never created, and the refusal lists every business the side offers —
    // the memberships AND the directory — because that is the useful half.
    const cwd = await owned()
    const { impl, seen } = fakeBuilder()
    const failure = await copyReproToDev(REPRO, 'No Such Co', {
      cwd,
      origin: 'http://sim.test',
      fetch: impl,
    }).catch((err: unknown) => err as Error)

    expect(failure).toBeInstanceOf(Error)
    expect(failure.message).toContain("No business called 'No Such Co'")
    expect(failure.message).toContain('never creates')
    expect(failure.message).toContain("'Member Co'")
    expect(failure.message).toContain("'faelan.com'")
    expect(posts(seen)).toEqual([])
  })

  it('test_UAT_FC_REQ-392_a_business_holding_builder_changes_is_refused_with_force_as_the_answer', async () => {
    const cwd = await owned()
    const refused = fakeBuilder()
    const failure = await copyReproToDev(REPRO, 'Busy Co', {
      cwd,
      origin: 'http://sim.test',
      fetch: refused.impl,
    }).catch((err: unknown) => err as Error)
    expect(failure.message).toContain('409')
    expect(failure.message).toContain('3 change(s) made in the builder')
    expect(failure.message).toContain('Pass --force to replace it anyway')

    const forced = fakeBuilder()
    const result = await copyReproToDev(REPRO, 'Busy Co', {
      cwd,
      origin: 'http://sim.test',
      force: true,
      fetch: forced.impl,
    })
    expect(posts(forced.seen)[0]?.body?.force).toBe(true)
    expect(result.landed.pages).toBe(1)
  })
})

describe('REQ-392 — what counts as a rights record', () => {
  /** A site whose only asset is the captured photograph. */
  function draft() {
    const store = memorySiteStore()
    store.seed('demo', { siteJson: { name: 'demo' }, pages: { index: { kind: 'page' } }, assets: { 'hero.jpg': PHOTO } })
    return store
  }
  async function capture(name: string, rights?: unknown) {
    const references = memoryReferenceStore()
    const bundle = references.bundle(name)
    await bundle.write('capture.json', new TextEncoder().encode('{}'))
    await bundle.write(`${ASSETS_PREFIX}hero.jpg`, PHOTO)
    if (rights !== undefined) {
      const text = typeof rights === 'string' ? rights : JSON.stringify(rights)
      await bundle.write(RIGHTS_MEMBER, new TextEncoder().encode(text))
    }
    return references
  }
  const VALID = {
    republishable: true,
    bundle: BUNDLE,
    assertedBy: 'op@example.test',
    assertedAt: '2026-10-07T18:00:00.000Z',
    basis: 'ours',
  }

  it('test_UAT_FC_REQ-392_a_valid_record_lets_the_captures_bytes_through_the_shared_gate', async () => {
    const payload = await readSitePayload(draft(), await capture(BUNDLE, VALID), 'demo')
    expect(payload.assets.map((a) => a.name)).toEqual(['hero.jpg'])
  })

  it('test_UAT_FC_REQ-392_a_malformed_or_misaddressed_record_counts_as_none', async () => {
    // Doubt on a rights gate resolves to "refused": unreadable JSON, a record
    // copied from another capture, `republishable` not literally true, or a
    // record that does not say who, when and why.
    for (const bad of [
      '{not json',
      { ...VALID, bundle: 'someone-else.com/index' },
      { ...VALID, republishable: 'yes' },
      { ...VALID, assertedBy: '' },
      { ...VALID, basis: '   ' },
      { republishable: true, bundle: BUNDLE },
    ]) {
      const references = await capture(BUNDLE, bad)
      expect(await readRightsRecord(references.bundle(BUNDLE))).toBeNull()
      await expect(readSitePayload(draft(), references, 'demo')).rejects.toBeInstanceOf(MirroredAssetError)
    }
  })

  it('test_UAT_FC_REQ-392_bytes_also_held_by_an_unrecorded_capture_are_still_refused', async () => {
    // One owned capture proves nothing about another that holds the same bytes.
    const references = await capture(BUNDLE, VALID)
    const other = references.bundle('elsewhere.com/index')
    await other.write('capture.json', new TextEncoder().encode('{}'))
    await other.write(`${ASSETS_PREFIX}copy.jpg`, PHOTO)

    const failure = await readSitePayload(draft(), references, 'demo').catch((e: unknown) => e)
    expect(failure).toBeInstanceOf(MirroredAssetError)
    expect((failure as MirroredAssetError).bundle).toBe('elsewhere.com/index')
  })

  it('test_UAT_FC_REQ-392_a_record_cannot_be_asserted_on_a_capture_that_does_not_exist', async () => {
    const w = mkdtempSync(join(tmpdir(), 'req392-none-'))
    try {
      await expect(
        assertRights(fsReferenceStore(w).bundle('nowhere.com/index'), { by: 'op', basis: 'ours' }),
      ).rejects.toThrow(/No capture called 'nowhere.com\/index'/)
      expect(existsSync(join(w, 'storage/references/nowhere.com'))).toBe(false)
    } finally {
      rmSync(w, { recursive: true, force: true })
    }
  })
})
