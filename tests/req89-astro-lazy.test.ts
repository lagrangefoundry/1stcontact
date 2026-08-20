/**
 * REQ-89, as REQ-148 left it.
 *
 * REQ-89's claim was that the render path is Astro-*lazy*: a container is
 * constructed only when a page actually mounts a behavior module. REQ-148
 * SUPERSEDES that with the stronger property — no container is constructed for
 * any page, ever, because a behavior module is a plain function of its props and
 * there is no container to construct. The two render assertions below therefore
 * make the same measurement and expect the stronger answer; the lazy branch they
 * used to prove is gone rather than moved.
 *
 * The third assertion is untouched REQ-89: the `1c` launcher must not leak
 * Astro's "Missing pages directory" WARN on a non-rendering command. Its Vite
 * bootstrap is still Astro's — collapsing that to a plain Vite SSR server is
 * REQ-150, deliberately kept out of REQ-148.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { experimental_AstroContainer } from 'astro/container'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { cmdRepro } from '../tools/generate/src/cli/repro'
import { foldToL1 } from '../tools/generate/src/l1'
import { writeL1 } from '../tools/generate/src/cli/capture/bundle'
import type {
  MultiStateCapture,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const HEADLINE = 'Front door heading'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

function textEl(t: string, box: ValueElement['box']): ValueElement {
  return {
    text: t,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 40,
    fontWeight: 600,
    lineHeightPx: 48,
    box,
  }
}

/** A single-run oracle folded to an L1 document — no modules anywhere. */
function l1Oracle(): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `fixture@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: [textEl(HEADLINE, { x: 20, y: 100, width: width - 40, height: 48 })],
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** Repoint the empty starter home page onto real behavior-module instances. */
function seedModules(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  home.modules = [
    {
      id: 'gallery',
      type: 'carousel',
      version: 3,
      config: {},
      slots: { slide: [{ kind: 'text', text: 'A great experience.' }] },
    },
  ]
  // REQ-102 — `1c new` now seeds an L1 document, so a behavior module must name
  // the seam it mounts into (REQ-93). Declare one slot per instance and bind it.
  home.l1.root.children.push(...home.modules.map((m) => ({ kind: 'slot', name: m.id })))
  for (const m of home.modules) m.slot = m.id
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

let cwd: string
beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req89-'))
})
afterEach(() => {
  vi.restoreAllMocks()
  rmSync(cwd, { recursive: true, force: true })
})

describe('REQ-148 — Astro is absent from the render path', () => {
  it('test_UAT_FC_REQ-148_l1_site_renders_without_astro_container', async () => {
    // Import a folded L1 bundle as a raw-L1 home page site.
    const ref = path.join(cwd, 'bundle')
    writeL1(ref, foldToL1(l1Oracle()))
    cmdRepro('gigabyte', { cwd, ref })

    const createSpy = vi.spyOn(experimental_AstroContainer, 'create')
    const { outDir } = await cmdRender('gigabyte', { cwd })

    // The L1 content rendered through the ordinary pipeline …
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).toContain(HEADLINE)
    expect(html).not.toContain('data-fc-type') // no module hook
    // … and NO Astro container was ever constructed for it.
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('test_UAT_FC_REQ-148_module_site_renders_without_astro_container', async () => {
    cmdNew('acme', { cwd })
    seedModules(cwd, 'acme')

    const createSpy = vi.spyOn(experimental_AstroContainer, 'create')
    const { outDir } = await cmdRender('acme', { cwd })

    // A behavior-module page renders (its component CSS is folded into theme.css) …
    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    expect(themeCss).toContain('.carousel__track')
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).toContain('data-fc-type="carousel"')
    // … and NO container was created for it either (REQ-148). This is the
    // assertion that used to read `toHaveBeenCalled()`: the module render no
    // longer goes through Astro at all, which is what lets it run in workerd.
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('test_UAT_FC_REQ-89_cli_boots_no_missing_pages_warning', () => {
    // Drive the real `1c` binary on a non-rendering command; its Astro Vite server
    // boots at setup but must no longer leak the "Missing pages directory" WARN.
    // Run from the repo root — the launcher roots its Astro Vite server at the repo
    // and Astro's `.astro` compile cache is cwd-sensitive, so a foreign cwd is a
    // pre-existing, unrelated failure mode; the operator always invokes `1c` in-repo.
    const bin = path.join(repoRoot, 'tools', 'generate', 'bin', '1c.mjs')
    const res = spawnSync('node', [bin, 'help'], { cwd: repoRoot, encoding: 'utf8' })
    expect(res.status).toBe(0)
    expect(res.stdout).toContain('1c —') // the command actually ran
    expect(res.stderr).not.toContain('Missing pages directory')
  }, 60_000)
})
