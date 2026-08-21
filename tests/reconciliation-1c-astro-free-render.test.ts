/**
 * Reconciliation UATs for story-e15a19ef — "1c CLI: flags parse correctly,
 * propagate into sub-commands, and --json emits a clean scriptable document".
 *
 * Two guarantees reconciled from bundle-cceaba25 (BUNDLE-8), plan item 4,
 * commit 5dc46d0f (REQ-89):
 *
 *   • AC-738 — every `1c` command boots quietly: the bootstrap no longer emits
 *     "Missing pages directory" on *either* stream. REQ-89 achieved that by
 *     gating Astro's logger with the inline Astro config's `logLevel: 'error'`;
 *     REQ-150 replaced the Astro-backed Vite server with a plain one, so the
 *     plugin that scanned for `src/pages` is gone and there is no logger left to
 *     gate. The AC is a claim about the streams, so the assertion is unchanged.
 *   • AC-739 — the render path is Astro-free unless a page needs Astro: the
 *     container is constructed only when a page carries behavior modules.
 *     SUPERSEDED BY REQ-148, which makes the stronger claim true: no page needs
 *     Astro, because a behavior module is a plain function of its props. Part
 *     (c) below therefore expects no container for a MODULE page too — the
 *     measurement is unchanged and the answer is the stronger one.
 *     REQ-150 then removed the `astro` dependency, which removes the container
 *     factory the parts below spied on. They now assert that no container can be
 *     constructed at all (`expectNoAstroContainerToConstruct`) — the same
 *     guarantee, established for every render rather than for the observed one.
 *
 * The sibling stdout/stderr-hygiene criteria (AC-656/657/658/659) and the
 * aligned-crops sandbox routing (AC-720) are covered in
 * `reconciliation-1c-cli-output-hygiene.test.ts` and
 * `reconciliation-1c-aligned-crops-sandbox-routing.test.ts`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { cmdRepro } from '../tools/generate/src/cli/repro'
import { foldToL1 } from '../tools/generate/src/l1'
import { writeL1 } from '../tools/generate/src/cli/capture/bundle'
import type {
  MultiStateCapture,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'
import { expectNoAstroContainerToConstruct } from './support/astro-absent'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const LADDER = [320, 375, 768, 1024, 1280, 1440]
const HEADLINE = 'Front door heading'

/** A single-run oracle folded to an L1 document — pure L1, no modules anywhere. */
function l1Oracle(): MultiStateCapture {
  const el = (width: number): ValueElement => ({
    text: HEADLINE,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 40,
    fontWeight: 600,
    lineHeightPx: 48,
    box: { x: 20, y: 100, width: width - 40, height: 48 },
  })
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `fixture@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: [el(width)],
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** Repoint a starter site's home page onto a real behavior-module instance. */
function seedModules(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  home.modules = [
    {
      id: 'gallery',
      type: 'carousel',
      version: 3,
      // REQ-96 — a behavior module mounts into a NAMED L1 slot (appearance is
      // L1's; `config` carries no aesthetic dial, so no `view` here), so the
      // page's L1 tree must carry the seam the module names.
      slot: 'gallery',
      config: {},
      slots: { slide: [{ kind: 'text', text: 'A great experience.' }] },
    },
  ]
  home.l1.root.children.push({ kind: 'slot', name: 'gallery' })
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

let cwd: string
beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'story-e15a19ef-'))
})
afterEach(() => {
  vi.restoreAllMocks()
  rmSync(cwd, { recursive: true, force: true })
})

// ── AC-738: every 1c command boots quietly, on both streams ──────────────────

describe('story-e15a19ef — the 1c bootstrap is quiet on both streams', () => {
  it('test_UAT_AC738_commands_boot_without_missing_pages_warning', () => {
    // Drive the real `1c` binary as a subprocess so the launcher's Vite bootstrap
    // runs for real. Under Astro that bootstrap scanned the working root for a
    // pages directory before any CLI code loaded, and logged
    // "[WARN] Missing pages directory: src/pages" on every invocation; REQ-150
    // removed the plugin that scanned, so the noise has no source rather than a
    // muted one.
    //
    // Both commands here are non-rendering (they never build a site), which is
    // exactly the case the AC calls out: the warning must be absent because it is
    // gone at its source, not merely diverted between streams.
    //
    // Run from the repo root — the launcher roots its Vite server at the repo;
    // the operator always invokes `1c` in-repo.
    const bin = path.join(repoRoot, 'tools', 'generate', 'bin', '1c.mjs')

    for (const command of ['help', 'list']) {
      const res = spawnSync('node', [bin, command], { cwd: repoRoot, encoding: 'utf8' })

      // The command booted and ran to completion (a failed boot would exit non-zero).
      expect(res.status, command).toBe(0)
      // Its own output came out on stdout …
      expect(res.stdout.trim().length, command).toBeGreaterThan(0)
      // … and the bootstrap warning appears on NEITHER stream.
      expect(res.stdout, command).not.toContain('Missing pages directory')
      expect(res.stderr, command).not.toContain('Missing pages directory')
    }

    // Spot-check that `help` really produced the usage text (not just any bytes),
    // proving the quiet boot did not come at the cost of the command's output.
    const help = spawnSync('node', [bin, 'help'], { cwd: repoRoot, encoding: 'utf8' })
    expect(help.stdout).toContain('1c —')
  }, 120_000)
})

// ── AC-739, as REQ-148 left it: no Astro container is created for ANY page ──

describe('story-e15a19ef — Astro is never engaged by the render (REQ-148)', () => {
  it('test_UAT_AC739_astro_container_never_created_for_any_page', async () => {
    // ── (a) A site whose pages are all L1 reproductions ──────────────────────
    // Fold a capture to L1 and import it as a raw-L1 home page, then render it
    // through the ordinary render entry point with container creation observed.
    const ref = path.join(cwd, 'bundle')
    writeL1(ref, foldToL1(l1Oracle()))
    cmdRepro('l1only', { cwd, ref })

    const l1Out = (await cmdRender('l1only', { cwd })).outDir

    const l1Html = readFileSync(path.join(l1Out, 'index.html'), 'utf8')
    expect(l1Html).toContain(HEADLINE) // the expected page HTML rendered …
    expect(l1Html).not.toContain('data-fc-type') // … carrying no module hooks …
    expectNoAstroContainerToConstruct() // … with no container constructed.

    // ── (b) The empty starter — no pages carry modules either ────────────────
    cmdNew('starter', { cwd })

    const starterOut = (await cmdRender('starter', { cwd })).outDir

    const starterHtml = readFileSync(path.join(starterOut, 'index.html'), 'utf8')
    expect(starterHtml).toContain('<html') // a real document was emitted …
    expect(starterHtml).not.toContain('data-fc-type') // … with no module hooks …
    expectNoAstroContainerToConstruct() // … and no container constructed.

    // ── (c) A site with at least one behavior-module page ────────────────────
    cmdNew('acme', { cwd })
    seedModules(cwd, 'acme')

    const modOut = (await cmdRender('acme', { cwd })).outDir

    // REQ-148 — no container here either. This read `toHaveBeenCalled()` while a
    // behavior module was an Astro component; it is the assertion whose flip IS
    // the ticket, and the reason the same render now runs in workerd.
    expectNoAstroContainerToConstruct()
    // … and the page renders exactly as before: module markup, its theme CSS,
    // and the client script are all present.
    const modHtml = readFileSync(path.join(modOut, 'index.html'), 'utf8')
    expect(modHtml).toContain('data-fc-type="carousel"')
    expect(readFileSync(path.join(modOut, 'theme.css'), 'utf8')).toContain('.carousel__track')
    expect(modHtml).toContain('src="./capabilities.js"')
    expect(existsSync(path.join(modOut, 'capabilities.js'))).toBe(true)
  }, 60_000)
})
