import { afterEach, describe, expect, it } from 'vitest'
import { get as httpGet } from 'node:http'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { registerReferenceBundleContract } from './support/reference-bundle-contract'
import { syntheticCapture, syntheticMultiState } from './support/reference-fixtures'
import { FakeCaptureDriver } from './support/fake-capture-driver'
import {
  bundleDir,
  bundleDirFor,
  fsReferenceBundle,
  fsReferenceStore,
  ladderScreenshotPath,
} from '../tools/generate/src/store/fs-reference-store'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import {
  ASSETS_PREFIX,
  CAPTURE_MEMBER,
  MULTISTATE_MEMBER,
  RENDERED_MEMBER,
  bundleNameFor,
  pathSlug,
} from '../tools/generate/src/store/reference-store'
import {
  readCapture,
  readForms,
  readHints,
  readL1,
  readMultiState,
  writeMultiState,
} from '../tools/generate/src/cli/capture/bundle'
import { cmdCapturePage } from '../tools/generate/src/cli/capture/capture'
import { reextractFromBundle } from '../tools/generate/src/cli/capture/reextract'
import { cmdRefold } from '../tools/generate/src/cli/repro'
import type {
  BrowserDriver,
  CapturedResponse,
  Viewport,
} from '../tools/generate/src/cli/capture/types'
import type { RawSignals } from '../tools/generate/src/cli/capture/extract'

/**
 * Reconciliation UATs for story-0cb7f25b — *"a capture bundle is addressed
 * through a storage contract, on the laptop or in the cloud"* — node half.
 *
 * WHAT IS HERE AND WHAT IS NEXT DOOR. The backing-agnostic criteria
 * (AC-1768/1769/1770/1771/1774) live in `support/reference-bundle-contract.ts`
 * and are registered below against the two backings node can build; the cloud
 * one registers the SAME module from inside workerd
 * (`reconciliation-reference-bundle-storage.workers.test.ts`). What this file
 * carries on top is everything that is genuinely node's: the operator's tree and
 * the `--ref <dir>` argument (AC-1767), a capture landing whole (AC-1763), the
 * bundle's URL-derived name (AC-1764), `refold` over either backing (AC-1766),
 * and offline re-extraction staying a local-operator verb (AC-1775).
 *
 * THE BROWSER IS THE ONLY THING FAKED, and it is a genuine external boundary: a
 * third party reached over a wire protocol, never the thing under test.
 * Everything between it and the store is the production code path.
 */

const dirs: string[] = []
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true })
})

function tmp(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), prefix))
  dirs.push(d)
  return d
}

/** The fake browser, injected the way the CLI injects the real one. */
const CAPTURE_OPTS = {
  driverFactory: async (): Promise<BrowserDriver> => new FakeCaptureDriver(),
  isEngineAvailable: async (): Promise<boolean> => true,
}

// ── the backing-agnostic contract, over both backings node can hold ──────────

registerReferenceBundleContract({
  name: 'filesystem',
  async makeStore() {
    const cwd = tmp('story-0cb7f25b-fs-')
    return {
      store: fsReferenceStore(cwd),
      // AC-1770's filesystem clause: a loose file at the references root and a
      // bare host directory with no captures under it. Both exist only on a
      // tree, which is why the contract asks for them rather than assuming them.
      async seedNonBundles() {
        const root = path.join(cwd, 'storage', 'references')
        mkdirSync(path.join(root, 'bare.test'), { recursive: true })
        writeFileSync(path.join(root, 'README'), 'not a bundle')
      },
    }
  },
})

registerReferenceBundleContract({
  name: 'memory',
  async makeStore() {
    return { store: memoryReferenceStore() }
  },
})

// ── AC-1763 — a successful capture lands every member ────────────────────────

/**
 * The same fake browser, plus one subresource it saw on the wire — so the
 * bundle's `assets/` prefix carries a mirrored member rather than being asserted
 * empty. The mirror is the one member set whose size the page decides, and a
 * capture with nothing to mirror would leave that clause of AC-1763 unexercised.
 */
const MIRRORED_BYTES = new TextEncoder().encode('HERO-JPEG-BYTES')
class MirroringCaptureDriver extends FakeCaptureDriver {
  responses(): CapturedResponse[] {
    return [
      {
        url: 'http://fixture.test/media/hero.jpg',
        status: 200,
        contentType: 'image/jpeg',
        body: MIRRORED_BYTES,
      },
    ]
  }
}

describe('story-0cb7f25b — AC-1763 a capture lands the whole bundle', () => {
  it('test_UAT_AC1763_capture_lands_every_member_each_readable_as_its_artifact', async () => {
    const cwd = tmp('ac1763-')
    const store = fsReferenceStore(cwd)
    const result = await cmdCapturePage('http://fixture.test/pricing', store, {
      ...CAPTURE_OPTS,
      driverFactory: async () => new MirroringCaptureDriver(),
    })

    const bundle = store.bundle(result.name)
    const members = await bundle.list()

    // Every member the bundle artifact is DEFINED by ([[DOC-13]] §4).
    for (const member of [
      'capture.json',
      'screenshot.full.png',
      'rendered.html',
      'raw.html',
      'multistate.json',
      'l1.json',
      'forms.json',
      'hints.json',
    ]) {
      expect(members, `bundle is missing ${member}`).toContain(member)
    }
    // …plus the persisted ladder: one PNG per sampled width, more than one.
    expect(members.filter((m) => /^screenshot-\d+\.png$/.test(m)).length).toBeGreaterThan(1)

    // Each member reads back as the ARTIFACT that went in, not merely as bytes of
    // the right length.
    const capture = await readCapture(bundle)
    expect(capture.host).toBe('fixture.test')
    expect((await readMultiState(bundle))?.projections.length).toBeGreaterThan(0)
    expect((await readL1(bundle))?.widths.length).toBeGreaterThan(0)
    const forms = await readForms(bundle)
    expect(Array.isArray(forms)).toBe(true)
    const hints = await readHints(bundle)
    expect(hints?.mediaBreakpoints).toEqual([640, 1024])
    expect(Array.isArray(hints?.nodes)).toBe(true)
    expect(hints?.viewport.width).toBeGreaterThan(0)

    // One member per mirrored subresource, under the `assets/` prefix — and it
    // reads back as the bytes that were mirrored, not as a placeholder.
    expect(capture.assets.map((a) => a.localPath)).toEqual([`${ASSETS_PREFIX}hero.jpg`])
    expect(await bundle.list(ASSETS_PREFIX)).toEqual([`${ASSETS_PREFIX}hero.jpg`])
    expect(await bundle.read(`${ASSETS_PREFIX}hero.jpg`)).toEqual(MIRRORED_BYTES)
  })
})

// ── AC-1764 — the name comes from the URL, and re-capture replaces ───────────

describe('story-0cb7f25b — AC-1764 a bundle is named from the captured URL', () => {
  it('test_UAT_AC1764_the_url_names_the_bundle_and_recapturing_replaces_it_in_place', async () => {
    const cwd = tmp('ac1764-')
    const store = fsReferenceStore(cwd)

    // A root path reduces to the segment `index`…
    const root = await cmdCapturePage('http://faelan.com/', store, CAPTURE_OPTS)
    expect(root.name).toBe('faelan.com/index')
    expect(bundleNameFor({ host: 'faelan.com', path: '/' })).toBe('faelan.com/index')

    // …and a nested path reduces to ONE segment, never a nested one, so the name
    // is always `<host>/<path-slug>`.
    const nested = await cmdCapturePage('http://faelan.com/about/team', store, CAPTURE_OPTS)
    expect(nested.name).toBe('faelan.com/about_team')
    expect(pathSlug('/a/b?c=d')).toBe('a_b_c_d')

    // On the operator's tree, that name IS the directory.
    expect(existsSync(bundleDir(cwd, root.name))).toBe(true)
    expect(existsSync(path.join(cwd, 'storage', 'references', 'faelan.com', 'about_team'))).toBe(
      true,
    )
    // Never from a location the caller happened to choose: nothing nested the
    // `/about/team` capture two directories deep.
    expect(existsSync(path.join(cwd, 'storage', 'references', 'faelan.com', 'about'))).toBe(false)

    // Re-capturing the same URL writes to the SAME bundle rather than creating a
    // second one or accumulating alongside the first.
    const again = await cmdCapturePage('http://faelan.com/', store, CAPTURE_OPTS)
    expect(again.name).toBe(root.name)
    expect((await store.list()).filter((n) => n === root.name)).toHaveLength(1)
    expect(await store.list()).toEqual(['faelan.com/about_team', 'faelan.com/index'])

    // The second capture's members are in place, and the generation is
    // distinguished by `capturedAt` inside the record — not by the bundle's name.
    const persisted = await readCapture(store.bundle(root.name))
    expect(persisted.capturedAt).toBe(again.capture.capturedAt)
    expect(again.capture.capturedAt).not.toBe(root.capture.capturedAt)
  })
})

// ── AC-1766 — refold re-derives, over either backing ─────────────────────────

describe('story-0cb7f25b — AC-1766 `1c refold --ref` re-derives from the stored bundle', () => {
  it('test_UAT_AC1766_refold_rewrites_the_derived_members_on_either_backing', async () => {
    const cwd = tmp('ac1766-')
    const onDisk = fsReferenceStore(cwd).bundle('example.test/pricing')
    await writeMultiState(onDisk, syntheticMultiState())
    // `capture.json` is read for the theme's font handles, so a refold needs it.
    await onDisk.write(CAPTURE_MEMBER, new TextEncoder().encode(JSON.stringify(syntheticCapture())))

    // Nothing derived exists yet…
    expect(await readL1(onDisk)).toBeNull()
    const observedBefore = await onDisk.read(MULTISTATE_MEMBER)

    const result = await cmdRefold(onDisk)

    // …afterwards both derived members do, and the verb reports the bundle it
    // refolded by name.
    expect(result.bundle).toBe('example.test/pricing')
    expect(await readL1(onDisk)).not.toBeNull()
    expect(await onDisk.list()).toContain('forms.json')
    // The retained observation is byte-for-byte unchanged: a refold changes what
    // is DERIVED, never what was OBSERVED.
    expect(await onDisk.read(MULTISTATE_MEMBER)).toEqual(observedBefore)

    // The same call against a backing with no filesystem behind it produces the
    // same result — which is the whole claim: the verb does not know which store
    // it was given. (The cloud backing is the third, proved in workerd.)
    const inMemory = memoryReferenceStore().bundle('example.test/pricing')
    await writeMultiState(inMemory, syntheticMultiState())
    await inMemory.write(
      CAPTURE_MEMBER,
      new TextEncoder().encode(JSON.stringify(syntheticCapture())),
    )
    const elsewhere = await cmdRefold(inMemory)
    expect(elsewhere.bundle).toBe(result.bundle)
    expect(elsewhere.nodeCount).toBe(result.nodeCount)
    expect(await readL1(inMemory)).toEqual(await readL1(onDisk))
    expect(await readForms(inMemory)).toEqual(await readForms(onDisk))

    // Reaching the network not at all is what makes this offline: the bundles
    // above were never handed a browser, and both refolds still succeeded.

    // A bundle holding no retained observation — one predating multi-viewport
    // capture — is refused with a message naming the bundle AND the remedy,
    // rather than failing on a parse of a missing member.
    const stale = memoryReferenceStore().bundle('stale.test/index')
    await expect(cmdRefold(stale)).rejects.toThrow(/stale\.test\/index/)
    await expect(cmdRefold(stale)).rejects.toThrow(/re-capture/)
  })
})

// ── AC-1767 — `--ref <dir>` addresses exactly the tree it always did ─────────

describe('story-0cb7f25b — AC-1767 the operator on-disk layout is unchanged', () => {
  it('test_UAT_AC1767_ref_dir_addresses_exactly_the_tree_it_always_did', async () => {
    const cwd = tmp('ac1767-')
    const store = fsReferenceStore(cwd)
    const result = await cmdCapturePage('http://faelan.com/pricing', store, CAPTURE_OPTS)

    // A capture written through the operator's store lands at
    // `storage/references/<host>/<path-slug>/`, with its members as ORDINARY
    // FILES an operator can list and read directly.
    const dir = path.join(cwd, 'storage', 'references', 'faelan.com', 'pricing')
    expect(dir).toBe(bundleDirFor(cwd, result.capture))
    const onDisk = readdirSync(dir)
    for (const file of ['capture.json', 'multistate.json', 'l1.json', 'rendered.html']) {
      expect(onDisk, `${file} is not a file on disk`).toContain(file)
    }
    expect(JSON.parse(readFileSync(path.join(dir, 'capture.json'), 'utf8')).host).toBe('faelan.com')

    // Naming that same directory after `--ref` reads back the IDENTICAL artifact
    // — a directory handle, not a store lookup.
    const named = fsReferenceBundle(dir)
    expect(await readCapture(named)).toEqual(await readCapture(store.bundle(result.name)))
    expect(await readMultiState(named)).toEqual(result.multiState)

    // A bundle directory ANYWHERE ELSE — a scratch copy, a fixture under a temp
    // dir, a bundle checked out beside the repo — is equally addressable, and the
    // bundle is identified by that location.
    const loose = tmp('ac1767-loose-')
    const elsewhere = fsReferenceBundle(loose)
    await writeMultiState(elsewhere, syntheticMultiState())
    expect(elsewhere.name).toBe(loose)
    expect(await readMultiState(fsReferenceBundle(loose))).toEqual(syntheticMultiState())

    // The per-width ladder member keeps its filename inside the directory, so a
    // size-aware diff finds the file it always found.
    expect(ladderScreenshotPath(dir, 768)).toBe(path.join(dir, 'screenshot-768.png'))
    expect(onDisk).toContain('screenshot-768.png')
  })
})

// ── AC-1775 — offline re-extraction: through the contract, still node-only ───

/** A real loopback GET. `node:http` directly, so no proxy env var intercepts it. */
function fetchPath(origin: string, p: string): Promise<{ status: number; body: string }> {
  const url = new URL(p, origin)
  return new Promise((resolve, reject) => {
    httpGet({ hostname: url.hostname, port: url.port, path: url.pathname + url.search }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c) => chunks.push(c as Buffer))
      res.on('end', () =>
        resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') }),
      )
    }).on('error', reject)
  })
}

const FLAT_SIGNALS: RawSignals = {
  viewport: { width: 1280, height: 800 },
  bands: [],
  colorUsage: [],
  fontFaces: [],
  typeScale: [],
  spacingScalePx: [],
  containerMaxWidthPx: 720,
  images: [],
}

/**
 * A fake browser seam that, on navigate, performs the fetches a real browser
 * would: the document, then each root-relative subresource the served document
 * names. What it records is exactly what a browser could load offline — which is
 * how "a real navigation actually happened" becomes an assertion rather than an
 * assumption.
 */
class NavigatingDriver implements BrowserDriver {
  origin?: string
  document?: { status: number; body: string }
  readonly subresources = new Map<string, { status: number; body: string }>()
  async navigate(url: string): Promise<void> {
    this.origin = new URL(url).origin
    this.document = await fetchPath(this.origin, '/')
    const REFS = /(?:href|src)\s*=\s*["']?(\/[^\s"'>]+)|url\(\s*["']?(\/[^\s"')]+)/g
    for (const m of this.document.body.matchAll(REFS)) {
      const ref = m[1] ?? m[2]
      if (ref) this.subresources.set(ref, await fetchPath(this.origin, ref))
    }
  }
  async screenshot(): Promise<Uint8Array> {
    return new Uint8Array()
  }
  async query<T>(): Promise<T> {
    return FLAT_SIGNALS as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return this.document?.body ?? ''
  }
  async close(): Promise<void> {}
  shotViewport?: Viewport
}

describe('story-0cb7f25b — AC-1775 offline re-extraction is fed by the bundle, and stays local', () => {
  it('test_UAT_AC1775_reextraction_reads_the_stored_bundle_and_still_really_navigates', async () => {
    const FONT_URL = 'https://fonts.gstatic.invalid/s/alchemy/v1/alchemy.woff2'
    const FONT_BYTES = 'MIRRORED-FONT-BYTES'

    // A bundle whose bytes were NEVER on disk. This is the assertion that
    // re-extraction is fed by members rather than by scanning a directory: there
    // is no directory to scan.
    const store = memoryReferenceStore()
    const bundle = store.bundle('offline.test/index')
    await bundle.write(
      RENDERED_MEMBER,
      new TextEncoder().encode(
        `<!doctype html><html><head><style>@font-face{font-family:Alchemy;` +
          `src:url(${FONT_URL}) format('woff2')}</style></head>` +
          `<body><h1 style="font-family:Alchemy">Mirrored</h1></body></html>`,
      ),
    )
    await bundle.write(
      `${ASSETS_PREFIX}alchemy.woff2`,
      new TextEncoder().encode(FONT_BYTES),
    )

    let driver!: NavigatingDriver
    const result = await reextractFromBundle(bundle, {
      driverFactory: async () => {
        driver = new NavigatingDriver()
        return driver
      },
    })

    // It ran to completion against the stored bundle, with the live site never
    // re-hit: the only origin the browser was ever pointed at is loopback.
    expect(result.capture.host).toBe('127.0.0.1')
    expect(driver.origin).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)

    // And it was a REAL NAVIGATION of the mirrored page, not a `setContent`
    // shell: the document came back over HTTP, rewritten to point at the
    // bundle's own mirror…
    expect(driver.document?.status).toBe(200)
    expect(driver.document?.body).toContain('/alchemy.woff2')
    expect(driver.document?.body).not.toContain(FONT_URL)
    // …and that rewritten path actually served the bytes the bundle holds, which
    // is the half only a real navigation can show.
    const font = driver.subresources.get('/alchemy.woff2')
    expect(font?.status).toBe(200)
    expect(font?.body).toBe(FONT_BYTES)

    // The verb is not offered inside the serverless runtime, and the reason is
    // the navigation above rather than an unfinished port. Asserted against the
    // import graph, because that is what makes the module loadable in a Worker or
    // not: the filesystem dependency is gone (its members come from the store),
    // and `node:http` — the loopback server the browser navigates to — stays. A
    // later change cannot quietly "finish the port" by dropping the navigation
    // without failing here.
    const src = readFileSync(
      path.join(__dirname, '..', 'tools', 'generate', 'src', 'cli', 'capture', 'reextract.ts'),
      'utf8',
    )
    expect(src).not.toMatch(/from\s+'node:fs'/)
    expect(src).toMatch(/from\s+'node:http'/)
  })
})
