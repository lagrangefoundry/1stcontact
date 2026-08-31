import { execFileSync } from 'node:child_process'
import {
  accessSync,
  chmodSync,
  constants,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { PreviewRenderer } from '../tools/generate/src/cli'
import { editAssetWrite } from '../tools/generate/src/cli/edit'
import { MIME as SERVE_MIME, startServe } from '../tools/generate/src/cli/serve'
import { MIME as STORE_MIME, contentTypeOf } from '../tools/generate/src/store/content-type'
import { StoreConflictError } from '../tools/generate/src/store/site-store'
import { makeFsSite, makeMemorySite, type SiteFixture } from './support/site-factory'
import {
  RENDER_QUESTIONS,
  STORAGE_QUESTIONS,
  askStorageQuestions,
} from './support/storage-questions'
import { missingFromEnv, readWranglerConfig } from './support/wrangler-toml'

/**
 * Reconciliation UATs for story-fde7370b — "Cloudflare Site Store: Definitions
 * In A Database, Bytes In An Object Store, Scoped To One Account".
 *
 * THIS FILE CARRIES THE FOUR CRITERIA THE HOST RUNTIME OWNS. It imports
 * `node:fs` at module scope, so it could only ever have loaded where a
 * filesystem exists — which is exactly the half of the claim it is here to
 * assert:
 *
 *   AC-1385  one body of storage questions, answered identically by every store
 *   AC-1391  the filesystem store's stated NON-guarantee for a conditional write
 *   AC-1397  one extension, one content type, wherever an asset is served
 *   AC-1398  both deployment halves, and the schema applied before upload
 *
 * The other ten criteria are claims about the cloud store, which exists only
 * inside workerd against real D1 and R2 bindings. They live in the sibling
 * `reconciliation-cloudflare-site-store.workers.test.ts`, and the two files
 * meet at `tests/support/storage-questions.ts` — the ONE question set both run.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..')
const readRepo = (rel: string): string => readFileSync(path.join(REPO, rel), 'utf8')

/** The sibling suite that answers the same questions over the cloud store. */
const WORKERS_SUITE = 'tests/reconciliation-cloudflare-site-store.workers.test.ts'

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"></svg>'

/** A minimal L1 page, so the draft assembles and can be rendered. */
function pageWithPaletteRef(): Record<string, unknown> {
  return {
    id: 'home',
    slug: 'home',
    title: 'Home',
    modules: [],
    l1: {
      widths: [1280],
      background: '#ffffff',
      textColor: '#111827',
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [
          {
            kind: 'text',
            id: 'headline',
            text: 'Hello',
            axes: { color: { ref: 'brand-teal' }, fontSizePx: 32 },
          },
        ],
      },
    },
  }
}

/** The one seed both host-runtime stores materialise. */
function seedWithPalette() {
  return {
    patchSiteJson: { palette: { 'brand-teal': { value: '#0d9488' } } },
    pages: { 'home.json': pageWithPaletteRef() },
  }
}

describe('story-fde7370b — the cloud site store, from the host runtime', () => {
  const open: SiteFixture[] = []
  const track = (f: SiteFixture): SiteFixture => {
    open.push(f)
    return f
  }
  const temps: string[] = []
  const tempDir = (prefix: string): string => {
    const dir = mkdtempSync(path.join(tmpdir(), prefix))
    temps.push(dir)
    return dir
  }
  const closers: Array<() => void> = []

  afterEach(() => {
    for (const close of closers.splice(0)) close()
    for (const f of open.splice(0)) f.dispose()
    for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  // ── AC-1385 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1385_every_storage_question_answers_identically_over_all_three_stores', async () => {
    // The two stores this runtime can hold, built from the IDENTICAL seed — the
    // operator's own filesystem tree, and the filesystem-free one.
    const fs = track(makeFsSite({ slug: 'triplet', ...seedWithPalette() }))
    const memory = track(makeMemorySite({ slug: 'triplet', ...seedWithPalette() }))
    expect(memory.cwd).toBeNull()
    expect(fs.cwd).not.toBeNull()

    // One body of assertions, asked of each. Not two similar-looking bodies that
    // agree today: the same function, applied twice.
    const fromFs = await askStorageQuestions(fs.store, fs.slug)
    const fromMemory = await askStorageQuestions(memory.store, memory.slug)
    expect(fromMemory).toEqual(fromFs)

    // The set covers every question the criterion names, so a store cannot pass
    // by being asked less than the surface asks it.
    expect([...STORAGE_QUESTIONS].sort()).toEqual(
      [
        'appendChange',
        'changesSince',
        'counter',
        'hasDraft',
        'listAssets',
        'loadDraft',
        'readAsset',
        'readPages',
        'readSiteJson',
        'version',
        'write',
      ].sort(),
    )
    expect(Object.keys(fromFs).sort()).toEqual([...STORAGE_QUESTIONS].sort())
    // Every question actually produced an answer, rather than being present as a
    // key nothing filled in.
    for (const question of STORAGE_QUESTIONS) {
      expect(fromFs[question], question).toBeDefined()
    }
    // And the answers are not vacuously equal: the site really was driven.
    expect((fromFs.write as { pages: string[] }).pages).toEqual(['about.json', 'home.json'])
    expect((fromFs.appendChange as number[])).toEqual([1, 2])
    expect((fromFs.version as { movedOnWrite: boolean }).movedOnWrite).toBe(true)

    // THE THIRD STORE. It cannot be reached from here — the cloud store exists
    // only inside workerd, against real bindings — so what is asserted here is
    // that the third leg runs the SAME function rather than a second copy of the
    // suite that quietly fell behind. A question added above is therefore asked
    // of the cloud store too, or that suite stops compiling.
    const workers = readRepo(WORKERS_SUITE)
    expect(workers).toContain(`from './support/storage-questions'`)
    expect(workers).toContain('askStorageQuestions')
    expect(readRepo('tests/support/storage-questions.ts')).toContain(
      'export async function askStorageQuestions',
    )

    // THE DECLARED EXCEPTION. The two questions that RENDER the draft are
    // excluded on purpose, not missing: they are named in the shared module, and
    // they are answered here, by both filesystem-hosted stores.
    expect([...RENDER_QUESTIONS]).toEqual(['renderDraftPage', 'renderDraftAsset'])
    for (const question of RENDER_QUESTIONS) {
      expect(STORAGE_QUESTIONS as readonly string[]).not.toContain(question)
    }
    for (const site of [fs, memory]) {
      const preview = new PreviewRenderer(site.store)
      const page = await preview.file(site.slug, 'draft', '/')
      expect(page?.kind).toBe('text')
      expect((page as { body: string }).body).toContain('<html')

      await editAssetWrite(site.slug, 'wordmark', SVG, site.opts)
      const asset = await preview.file(site.slug, 'draft', '/assets/wordmark.svg')
      expect(asset).toMatchObject({ kind: 'bytes', contentType: 'image/svg+xml' })
    }
  })

  // ── AC-1391 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1391_the_filesystem_store_applies_a_version_carrying_write_unconditionally', async () => {
    const { slug, store } = track(makeFsSite(seedWithPalette()))

    // Read the version, then let something unrelated land so the reading is
    // stale — the exact sequence that refuses against the transactional store.
    const stale = await store.version(slug)
    expect(stale).toBeTypeOf('number')
    await store.write(slug, {
      pages: [
        { name: 'other.json', page: { id: 'other', slug: 'other', title: 'Other', modules: [] } },
      ],
    })
    expect(await store.version(slug)).not.toBe(stale)

    // The change carries the stale version. It LANDS: this store cannot make the
    // check and the write one indivisible act, so it reports no guarantee rather
    // than a guarantee that does not hold.
    await expect(
      store.write(slug, {
        pages: [
          {
            name: 'home.json',
            page: { ...pageWithPaletteRef(), title: 'Landed anyway' },
          },
        ],
        expect: stale!,
      }),
    ).resolves.toBeUndefined()

    const home = (await store.readPages(slug)).find((p) => p.name === 'home.json')
    expect((home!.page as { title: string }).title).toBe('Landed anyway')

    // Not a conflict, and not a read-then-write comparison of its own: a version
    // this site could never have held is applied just as unconditionally. A
    // store that quietly compared would refuse this one.
    await expect(
      store.write(slug, {
        siteJson: { ...(await store.readSiteJson(slug))!, marker: 'fabricated expectation' },
        expect: 987654321,
      }),
    ).resolves.toBeUndefined()
    expect(await store.readSiteJson(slug)).toMatchObject({ marker: 'fabricated expectation' })

    // Positively stated, which is what a caller relies on: against this store a
    // change always lands, so nothing it can do raises the conflict type at all.
    // The other half of the contrast — the same sequence refusing against the
    // transactional store — is asserted by AC-1389 in the sibling workers suite,
    // which is where a real D1 database exists; the difference between the two
    // stores is therefore observed on both sides rather than assumed on either.
    let raised: unknown = null
    try {
      await store.write(slug, { expect: 1 })
    } catch (err) {
      raised = err
    }
    expect(raised).toBeNull()
    expect(raised).not.toBeInstanceOf(StoreConflictError)
    expect(readRepo(WORKERS_SUITE)).toContain('StoreConflictError')
  })

  // ── AC-1397 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1397_one_extension_yields_one_content_type_wherever_an_asset_is_served', async () => {
    // ONE TABLE, not two that agree today. `serve.ts` re-exports the store's own
    // map rather than keeping a second: same object, so there is nothing to
    // drift.
    expect(SERVE_MIME).toBe(STORE_MIME)

    const cwd = tempDir('ac1397-')
    const handle = await startServe('typed', { cwd, source: 'draft' })
    closers.push(() => handle.server.close())

    // Every extension the product recognises, plus one nothing renders and one
    // with no extension at all.
    const known = Object.keys(STORE_MIME)
    expect(known.length).toBeGreaterThan(0)
    const names = [
      ...known.map((ext) => `sample${ext}`),
      'invented.zzzz',
      'no-extension-at-all',
    ]

    mkdirSync(handle.rootDir, { recursive: true })
    for (const name of names) writeFileSync(path.join(handle.rootDir, name), 'x', 'utf8')

    for (const name of names) {
      const response = await fetch(new URL(name, handle.url))
      expect(response.status, name).toBe(200)
      // The operator's own file server, and the label the cloud store puts on a
      // stored object, are the same answer — including the character-set
      // qualifier where the table carries one.
      expect(response.headers.get('content-type'), name).toBe(contentTypeOf(name))
    }

    // Spot-pinned so the equality above cannot be satisfied by two paths that
    // are both wrong in the same way.
    expect(contentTypeOf('sample.html')).toBe('text/html; charset=utf-8')
    expect(contentTypeOf('sample.svg')).toBe('image/svg+xml')
    expect(contentTypeOf('sample.png')).toBe('image/png')

    // An extension nothing renders is labelled generic binary rather than
    // guessed at — an image-shaped hole must not be allowed to become a
    // scripting one. A name with no extension is the same answer.
    expect(contentTypeOf('invented.zzzz')).toBe('application/octet-stream')
    expect(contentTypeOf('no-extension-at-all')).toBe('application/octet-stream')
    for (const name of ['invented.zzzz', 'no-extension-at-all']) {
      const response = await fetch(new URL(name, handle.url))
      expect(response.headers.get('content-type'), name).toBe('application/octet-stream')
    }
  })

  // ── AC-1398 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1398_both_deployment_halves_declare_the_store_and_the_schema_precedes_upload', () => {
    const appDir = path.join(REPO, 'apps', 'control-app')
    const wranglerFile = path.join(appDir, 'wrangler.toml')
    const toml = readFileSync(wranglerFile, 'utf8')
    const config = readWranglerConfig(wranglerFile)

    // Both halves declare BOTH bindings. A named environment inherits neither
    // vars nor bindings, and the failure mode of forgetting is not a clean
    // message — the Worker sees `env.DB === undefined` and throws inside a store
    // call, at request time, on real traffic.
    expect(config.topLevel.bindings).toContain('d1_databases:DB')
    expect(config.topLevel.bindings).toContain('r2_buckets:SITES')
    expect(config.envs.production).toBeDefined()
    expect(config.envs.production.bindings).toContain('d1_databases:DB')
    expect(config.envs.production.bindings).toContain('r2_buckets:SITES')
    expect(missingFromEnv(config, 'production').bindings).toEqual([])

    // …and the two halves name the SAME database and the SAME bucket. Not a
    // duplicate of the two checks above: both would pass with production
    // pointing at a different database.
    const ids = [...toml.matchAll(/database_id\s*=\s*"([0-9a-f-]{36})"/g)].map((m) => m[1])
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(1)
    const databases = [...toml.matchAll(/database_name\s*=\s*"([^"]+)"/g)].map((m) => m[1])
    expect(databases).toEqual(['1stcontact', '1stcontact'])
    const buckets = [...toml.matchAll(/bucket_name\s*=\s*"([^"]+)"/g)].map((m) => m[1])
    expect(buckets).toHaveLength(2)
    expect(new Set(buckets).size).toBe(1)

    // The declaration states where the schema lives, and that location holds it.
    // A correct path to an empty directory applies zero migrations and reports
    // success.
    const declared = /migrations_dir\s*=\s*"([^"]+)"/.exec(toml)
    expect(declared, 'control-app declares migrations_dir').not.toBeNull()
    const migrations = path.resolve(appDir, declared![1])
    expect(migrations).toBe(path.join(REPO, 'db', 'migrations'))
    expect(readdirSync(migrations).filter((f) => f.endsWith('.sql')).length).toBeGreaterThan(0)

    // The schema step runs BEFORE the upload, and a non-zero result aborts it.
    const deploy = readRepo('bin/deploy')
    expect(deploy).toContain('set -euo pipefail')
    expect(deploy.indexOf('run_hooks migrate')).toBeGreaterThan(-1)
    expect(deploy.indexOf('run_hooks migrate')).toBeLessThan(
      deploy.indexOf('cmd=(npx wrangler deploy'),
    )

    // GENUINELY RUNNABLE, not merely present: `bin/deploy` runs executable files
    // and ignores the rest, so a hook committed without the bit is a hook that
    // never runs — the deploy goes green having migrated nothing.
    const hook = path.join(REPO, 'bin', 'deploy.d', 'migrate', '10-d1-site-store')
    expect(() => accessSync(hook, constants.X_OK)).not.toThrow()

    // ── the hook, executed ───────────────────────────────────────────────────
    //
    // `npx` is stubbed — Cloudflare is the one true external boundary here, and
    // reaching it would make this test a network test. Everything else is the
    // real script: the real bash, the real gating, the real argument list.
    const shim = tempDir('ac1398-bin-')
    const log = path.join(shim, 'npx.log')
    const npx = path.join(shim, 'npx')
    writeFileSync(npx, '#!/usr/bin/env bash\nprintf \'%s\\n\' "$*" >> "$NPX_LOG"\nexit "${NPX_EXIT:-0}"\n')
    chmodSync(npx, 0o755)

    const runHook = (
      overrides: Record<string, string>,
    ): { status: number; stdout: string; stderr: string; invoked: string } => {
      rmSync(log, { force: true })
      const env = {
        ...process.env,
        PATH: `${shim}${path.delimiter}${process.env.PATH ?? ''}`,
        NPX_LOG: log,
        DEPLOY_APP: 'control-app',
        DEPLOY_APP_DIR: appDir,
        DEPLOY_ENV: 'production',
        DEPLOY_WORKER_NAME: '1stcontact-control-app',
        DEPLOY_DRY_RUN: '0',
        DEPLOY_REPO_ROOT: REPO,
        ...overrides,
      }
      let status = 0
      let stdout = ''
      let stderr = ''
      try {
        stdout = execFileSync(hook, [], { env, encoding: 'utf8', stdio: 'pipe' })
      } catch (err) {
        const failure = err as { status?: number; stdout?: string; stderr?: string }
        status = failure.status ?? 1
        stdout = failure.stdout ?? ''
        stderr = failure.stderr ?? ''
      }
      let invoked = ''
      try {
        invoked = readFileSync(log, 'utf8')
      } catch {
        invoked = ''
      }
      return { status, stdout, stderr, invoked }
    }

    // The real thing: the schema is applied to the REMOTE database, for this
    // environment.
    const applied = runHook({})
    expect(applied.status).toBe(0)
    expect(applied.invoked).toContain(
      'wrangler d1 migrations apply 1stcontact --env production --remote',
    )

    // A REHEARSAL CHANGES NOTHING. It reports what it would apply and confirms it
    // can reach the remote database — so a missing binding, a wrong database
    // name or an expired credential is caught here rather than by the real
    // thing.
    const rehearsed = runHook({ DEPLOY_DRY_RUN: '1' })
    expect(rehearsed.status).toBe(0)
    expect(rehearsed.stdout).toMatch(/would apply D1 migrations/)
    expect(rehearsed.invoked).toContain(
      'wrangler d1 migrations list 1stcontact --env production --remote',
    )
    expect(rehearsed.invoked).not.toContain('migrations apply')

    // …and a rehearsal that CANNOT reach the database fails the rehearsal,
    // which is the whole reason it reaches at all.
    const unreachable = runHook({ DEPLOY_DRY_RUN: '1', NPX_EXIT: '1' })
    expect(unreachable.status).not.toBe(0)
    expect(unreachable.stderr).toMatch(/could not list migrations/)

    // The step applies only to the application that owns the schema — the one
    // whose configuration declares where the migrations live. Hooks are run for
    // every app, so each gates on its own; against one that declares no
    // migrations it exits without doing anything rather than failing there.
    const other = runHook({ DEPLOY_APP: 'public-site' })
    expect(other.status).toBe(0)
    expect(other.invoked).toBe('')
    expect(other.stdout).toBe('')
    // Read as an assignment, not as a substring: public-site's config *mentions*
    // `migrations_dir` in a comment explaining why it deliberately has none, and
    // a substring match would read that as a declaration.
    const owners = readdirSync(path.join(REPO, 'apps')).filter((app) =>
      readFileSync(path.join(REPO, 'apps', app, 'wrangler.toml'), 'utf8')
        .split('\n')
        .some((line) => /^\s*migrations_dir\s*=/.test(line)),
    )
    expect(owners).toEqual(['control-app'])
  })
})
