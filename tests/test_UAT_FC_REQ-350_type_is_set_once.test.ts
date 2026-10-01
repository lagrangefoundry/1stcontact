/**
 * REQ-350 style items 6–10 — type is set once and referred to: named text
 * styles on the site, type a container sets for what it contains, and a run's
 * own value still winning.
 *
 * REAL ENTRY POINTS over a real site: the Gigabyte Alchemy draft from the
 * committed corpus (52 runs, each carrying its own family and size), changed
 * through `1c type …` and the assistant's Toolbox, and judged by the real
 * render path — `cmdRender` writes the draft page a visitor would be served.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cmdRender, run } from '../tools/generate/src/cli'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox'
import { loadSite } from '../tools/generate/src/store'
import type { L1Node } from '../packages/site-schema/src/index'

const CORPUS = path.join(__dirname, 'fixtures', 'l1-corpus', 'storage', 'sites', 'gigabytealchemy', 'draft')

let cwd: string
let seq = 0

function seed(): string {
  const slug = `ga-type-${++seq}`
  fs.cpSync(CORPUS, path.join(cwd, 'storage', 'sandbox', slug, 'draft'), { recursive: true })
  return slug
}
const draft = (slug: string, ...rest: string[]) => path.join(cwd, 'storage', 'sandbox', slug, 'draft', ...rest)
const readJson = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'))

async function cli(...argv: string[]): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: { code?: string; message?: string } }> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const out: string[] = []
  process.chdir(cwd)
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run([...argv, '--sandbox', '--json'])
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
    process.exitCode = 0
  }
  return JSON.parse(out.join('\n'))
}

/** The draft home page exactly as a visitor is served it. */
async function served(slug: string): Promise<string> {
  const { outDir } = await cmdRender(slug, { cwd, sandbox: true, edit: false })
  return fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
}

/** Every run on the loaded (resolved) home page, as the renderer receives it. */
function loadedRuns(slug: string) {
  const loaded = loadSite({ cwd, root: 'sandbox' }, slug, 'draft')
  if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors).slice(0, 500))
  const out: Array<Extract<L1Node, { kind: 'text' }>> = []
  const walk = (n: L1Node): void => {
    if (n.kind === 'text') out.push(n)
    for (const k of n.kind === 'container' ? n.children : n.kind === 'box' ? (n.children ?? []) : []) walk(k)
  }
  walk(loaded.value.site.pages.find((p) => p.id === 'home')!.l1!.root)
  return out
}

type Box = { run: (tool: string, input: Record<string, unknown>) => Promise<unknown> }
/** A tool's answer as text, with the untrusted-content wrapper a read carries taken off. */
const ask = async (box: Box, tool: string, input: Record<string, unknown>): Promise<string> => {
  const out = await box.run(tool, input)
  const text = typeof out === 'string' ? out : JSON.stringify(out)
  return text.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')
}

describe('REQ-350 — type is set once and referred to', () => {
  beforeAll(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req350-type-'))
  })
  afterAll(() => {
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-350_assigning_named_styles_changes_the_description_not_the_page', async () => {
    const slug = seed()
    const before = await served(slug)
    const runsBefore = readJson(draft(slug, 'pages', 'home.json')).l1.root.children.filter(
      (n: { kind: string; axes?: { fontFamily?: string } }) => n.kind === 'text' && n.axes?.fontFamily,
    ).length
    expect(runsBefore).toBeGreaterThan(40)

    const out = await cli('type', 'assign', slug)
    expect(out.ok, JSON.stringify(out.error)).toBe(true)

    const site = readJson(draft(slug, 'site.json'))
    // Exact groups only, named by what they are. This site's theme declared a
    // body and a heading family, which arrive as `body` (the default every page
    // starts from) and `heading`; the runs' own groups are named by size, since
    // this page records no heading levels.
    expect(site.textDefault).toBe('body')
    expect(Object.keys(site.textStyles)).toEqual(expect.arrayContaining(['body', 'heading']))
    const runStyles = Object.keys(site.textStyles).filter((n) => n !== 'body' && n !== 'heading')
    expect(runStyles.length).toBeGreaterThan(5)
    for (const name of runStyles) expect(name).toMatch(/^text-\d+(-[b-z])?$/)
    // No run on the page carries its own family any more: each names a style,
    // inherits one from the container it sits in, or takes the default.
    const home = readJson(draft(slug, 'pages', 'home.json'))
    const literal: string[] = []
    const walk = (n: { kind: string; axes?: Record<string, unknown>; children?: unknown[] }) => {
      if ((n.kind === 'text' || n.kind === 'control') && n.axes?.fontFamily) literal.push(n.kind)
      for (const k of (n.children ?? []) as (typeof n)[]) walk(k)
    }
    walk(home.l1.root)
    expect(literal).toEqual([])

    // And the page a visitor is served is the same page, byte for byte.
    expect(await served(slug)).toBe(before)
  })

  it('test_UAT_FC_REQ-350_changing_a_style_once_changes_every_run_that_uses_it', async () => {
    const slug = seed()
    await cli('type', 'assign', slug)
    const box = (await createL1Toolbox(slug, { cwd, sandbox: true })) as unknown as Box

    // The style most runs use, and exactly which runs those are.
    const styles = JSON.parse(await ask(box, 'get_text_styles', {}))
    const most = styles.entries
      .filter((e: { default: boolean }) => !e.default)
      .sort((a: { uses: unknown[] }, b: { uses: unknown[] }) => b.uses.length - a.uses.length)[0]
    expect(most.uses.length).toBeGreaterThan(10)
    const users = new Set(most.uses.map((u: { path: string }) => u.path))

    // One write: its family becomes Georgia.
    const answer = JSON.parse(
      await ask(box, 'set_text_style', { name: most.name, style: { ...most.style, fontFamily: 'Georgia, serif' } }),
    )
    expect(answer.changed.count).toBe(most.uses.length)

    // Every run that names it now paints Georgia, and no other run does.
    const home = readJson(draft(slug, 'pages', 'home.json'))
    const loaded = loadedRuns(slug)
    const byText = new Map(loaded.map((r) => [JSON.stringify(r.text), r.axes?.fontFamily]))
    home.l1.root.children.forEach((n: { kind: string; text?: unknown }, i: number) => {
      if (n.kind !== 'text') return
      const family = byText.get(JSON.stringify(n.text))
      if (users.has(`0.${i}`)) expect(family, String(n.text)).toBe('Georgia, serif')
    })
    expect(loaded.filter((r) => r.axes?.fontFamily === 'Georgia, serif').length).toBe(most.uses.length)
    expect(await served(slug)).toMatch(/font-family: Georgia, serif/)
  })

  it('test_UAT_FC_REQ-350_a_container_value_is_inherited_and_a_local_value_wins', async () => {
    const slug = seed()
    await cli('type', 'assign', slug)
    // Group "A Different Approach" so it has a container to set type on.
    await cli('structure', 'group', slug, 'home', '0.1', '0.19', '0.20', '0.21', '0.22', '--id', 'approach')
    const box = (await createL1Toolbox(slug, { cwd, sandbox: true })) as unknown as Box
    const section = JSON.parse(await ask(box, 'get_l1', { page: 'home', path: '0.1' })).node
    // The section sets a weight for what it holds. The first paragraph stops
    // naming a style of its own, so it takes what its containers give it; the
    // second keeps its style and sets its own weight over it.
    section.type = { ...(section.type ?? {}), fontWeight: 300 }
    const { textStyle: _dropped, ...ownAxes } = section.children[2].axes ?? {}
    section.children[2].axes = ownAxes
    section.children[3].axes = { ...(section.children[3].axes ?? {}), fontWeight: 600 }
    const written = await ask(box, 'set_l1', { page: 'home', path: '0.1', node: section })
    expect(written).not.toContain('SCHEMA_INVALID')

    const weights = (prefix: string) => loadedRuns(slug).find((r) => typeof r.text === 'string' && r.text.startsWith(prefix))!.axes!.fontWeight
    expect(weights('Most apps are designed')).toBe(300)
    expect(weights('Through privacy-first AI')).toBe(600)
    // A run outside the section is untouched by it.
    expect(weights('Our work is guided')).not.toBe(300)
    // A run's own style is nearer than its container's value: the heading's
    // style sets 700, and that is what it keeps.
    expect(weights('A Different Approach')).toBe(700)
  })

  it('test_UAT_FC_REQ-350_a_style_is_typed_and_validated_like_any_other_value', async () => {
    const slug = seed()
    await cli('type', 'assign', slug)
    const box = (await createL1Toolbox(slug, { cwd, sandbox: true })) as unknown as Box
    const before = fs.readFileSync(draft(slug, 'site.json'), 'utf8')

    // A size that is not a number, an axis a style does not have, raw CSS, a size out of range.
    for (const style of [
      { fontSizePx: '18px' },
      { color: '#ff0000' },
      { css: 'font: 18px/1 serif; background: url(javascript:alert(1))' },
      { fontSizePx: 9000 },
    ]) {
      const refusal = await ask(box, 'add_text_style', { name: 'odd', style })
      expect(refusal, `${JSON.stringify(style)} → ${refusal}`).toContain('SCHEMA_INVALID')
    }
    // A family the site does not serve and that names no generic fallback is
    // refused on a style exactly as on a run: here, on the style most runs use.
    const used = JSON.parse(await ask(box, 'get_text_styles', {})).entries.sort(
      (a: { uses: unknown[] }, b: { uses: unknown[] }) => b.uses.length - a.uses.length,
    )[0]
    const unserved = await ask(box, 'set_text_style', { name: used.name, style: { ...used.style, fontFamily: 'Nonesuch' } })
    expect(unserved).toContain('SCHEMA_INVALID')
    expect(fs.readFileSync(draft(slug, 'site.json'), 'utf8')).toBe(before)

    // A run naming a style the site does not declare is refused like a dangling colour.
    const heading = JSON.parse(await ask(box, 'get_l1', { page: 'home', path: '0.15' })).node
    const dangling = await ask(box, 'set_l1', {
      page: 'home',
      path: '0.15',
      node: { ...heading, axes: { ...heading.axes, textStyle: 'nowhere' } },
    })
    expect(dangling).toContain('SCHEMA_INVALID')
  })

  it('test_UAT_FC_REQ-350_the_assistant_sees_where_each_style_is_used_and_renames_with_it', async () => {
    const slug = seed()
    await cli('type', 'assign', slug)
    const box = (await createL1Toolbox(slug, { cwd, sandbox: true })) as unknown as Box
    const read = JSON.parse(await ask(box, 'get_text_styles', {}))
    // The most used style after `body` — which, being the default, no element names.
    const h2 = read.entries.filter((e: { name: string }) => e.name !== 'body').sort((a: { uses: unknown[] }, b: { uses: unknown[] }) => b.uses.length - a.uses.length)[0]
    expect(h2.uses.length).toBeGreaterThan(0)
    for (const use of h2.uses) {
      expect(use.page).toBe('home')
      expect(use.path).toMatch(/^0(\.\d+)+$/)
      // The address it names really is an element naming the style.
      const node = JSON.parse(await ask(box, 'get_l1', { page: 'home', path: use.path })).node
      expect(node.axes?.textStyle ?? node.type?.style).toBe(h2.name)
    }

    // Renaming moves every use with it, and a style in use cannot be removed.
    await ask(box, 'rename_text_style', { name: h2.name, to: 'section-title' })
    const renamed = JSON.parse(await ask(box, 'get_text_styles', {}))
    expect(renamed.entries.find((e: { name: string }) => e.name === 'section-title').uses).toHaveLength(h2.uses.length)
    expect(await ask(box, 'remove_text_style', { name: 'section-title' })).toContain('CONFLICT')
  })
})
