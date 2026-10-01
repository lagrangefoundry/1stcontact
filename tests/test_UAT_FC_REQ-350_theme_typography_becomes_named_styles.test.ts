/**
 * REQ-350 decision D3 — one answer for type. The theme's `typography` group is
 * retired: its families become named text styles, the site's default style
 * replaces the page shell's `body`/`h1–h4` font rules, and the `--font-family-*`
 * properties a legacy consumer reads are generated from the styles.
 *
 * The subject is a site stored the old way — the Gigabyte Alchemy draft in the
 * committed corpus still carries `theme.typography` — loaded, rendered and
 * written through the real entry points.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, run } from '../tools/generate/src/cli'
import { loadSite } from '../tools/generate/src/store'
import type { L1Node } from '../packages/site-schema/src/index'

const CORPUS = path.join(__dirname, 'fixtures', 'l1-corpus', 'storage', 'sites', 'gigabytealchemy', 'draft')
const SYSTEM = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'

let cwd: string
let seq = 0

function seed(): string {
  const slug = `ga-theme-${++seq}`
  fs.cpSync(CORPUS, path.join(cwd, 'storage', 'sandbox', slug, 'draft'), { recursive: true })
  return slug
}
const draft = (slug: string, ...rest: string[]) => path.join(cwd, 'storage', 'sandbox', slug, 'draft', ...rest)
const readJson = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'))
const writeJson = (file: string, v: unknown) => fs.writeFileSync(file, `${JSON.stringify(v, null, 2)}\n`)

function load(slug: string) {
  const loaded = loadSite({ cwd, root: 'sandbox' }, slug, 'draft')
  if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors).slice(0, 500))
  return loaded.value.site
}

async function served(slug: string): Promise<{ html: string; theme: string }> {
  const { outDir } = await cmdRender(slug, { cwd, sandbox: true, edit: false })
  return {
    html: fs.readFileSync(path.join(outDir, 'index.html'), 'utf8'),
    theme: fs.readFileSync(path.join(outDir, 'theme.css'), 'utf8'),
  }
}

async function cli(...argv: string[]): Promise<{ ok: boolean }> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const out: string[] = []
  process.chdir(cwd)
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run([...argv, '--sandbox', '--json'])
  } finally {
    console.log = prevLog
    process.chdir(prevCwd)
    process.exitCode = 0
  }
  return JSON.parse(out.join('\n'))
}

describe('REQ-350 D3 — the theme’s typography becomes named text styles', () => {
  beforeAll(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req350-theme-'))
  })
  afterAll(() => {
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-350_a_stored_theme_typography_loads_as_named_styles', async () => {
    const slug = seed()
    expect(readJson(draft(slug, 'site.json')).theme.typography.family.body).toBe(SYSTEM)

    const site = load(slug)
    expect((site.theme as Record<string, unknown>).typography).toBeUndefined()
    expect(site.textStyles).toEqual({ body: { fontFamily: SYSTEM }, heading: { fontFamily: SYSTEM } })
    expect(site.textDefault).toBe('body')

    const { html, theme } = await served(slug)
    // No page-shell font rule any more: type has one source.
    expect(html).not.toContain('var(--font-family-body)')
    expect(html).not.toContain('var(--font-family-heading)')
    // The family properties a legacy consumer reads are generated from the styles…
    expect(theme).toContain('--font-family-body: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;')
    expect(theme).not.toContain('--font-size-')
    // …and the form's inputs, which set no type of their own and used to take the
    // shell's body face, take it from the default style instead — the same face.
    expect(html).toMatch(/font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif/)
  })

  it('test_UAT_FC_REQ-350_a_heading_that_relied_on_the_heading_family_keeps_it', async () => {
    const slug = seed()
    // The theme gives headings a face of their own, and one heading on the page
    // names no family — it painted in the heading face through the shell's rule.
    const site = readJson(draft(slug, 'site.json'))
    site.theme.typography.family.heading = 'Georgia, serif'
    writeJson(draft(slug, 'site.json'), site)
    const page = readJson(draft(slug, 'pages', 'home.json'))
    const heading = page.l1.root.children[19]
    delete heading.axes.fontFamily
    heading.heading = { level: 2 }
    writeJson(draft(slug, 'pages', 'home.json'), page)

    const loaded = load(slug)
    const runs: Array<Extract<L1Node, { kind: 'text' }>> = []
    const walk = (n: L1Node): void => {
      if (n.kind === 'text') runs.push(n)
      for (const k of n.kind === 'container' ? n.children : n.kind === 'box' ? (n.children ?? []) : []) walk(k)
    }
    walk(loaded.pages.find((p) => p.id === 'home')!.l1!.root)
    expect(runs.find((r) => r.text === 'A Different Approach')!.axes!.fontFamily).toBe('Georgia, serif')
    // A run that names its own family is untouched.
    expect(runs.find((r) => r.text === 'Our Mission')!.axes!.fontFamily).not.toBe('Georgia, serif')
  })

  it('test_UAT_FC_REQ-350_the_first_write_persists_the_new_shape', async () => {
    const slug = seed()
    const out = await cli('palette', 'add', slug, 'spare', '#123456')
    expect(out.ok).toBe(true)
    const site = readJson(draft(slug, 'site.json'))
    expect(site.theme.typography).toBeUndefined()
    expect(site.textStyles.body).toEqual({ fontFamily: SYSTEM })
    expect(site.textDefault).toBe('body')
  })

  it('test_UAT_FC_REQ-350_a_new_site_starts_with_named_styles', () => {
    cmdNew('fresh', { cwd, sandbox: true })
    const site = readJson(draft('fresh', 'site.json'))
    expect(site.theme.typography).toBeUndefined()
    expect(Object.keys(site.textStyles).sort()).toEqual(['body', 'heading'])
    expect(site.textDefault).toBe('body')
  })
})
