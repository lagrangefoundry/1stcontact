/**
 * [[REQ-391]] — **alternative looks: a labelled set of a page, chosen in one
 * action.**
 *
 * WHAT THIS FILE PROVES, through the consultant's own toolbox (`createL1Toolbox`,
 * with the grant it ships with) and the real renderer:
 *
 *   - `make_alternatives` makes a SET in one call — each look a full copy of the
 *     target page, carrying metadata (whose look, which set, the client's label
 *     and description) rather than a naming convention;
 *   - a look is never published, and is rendered for the builder's preview;
 *   - the page listing marks a look as a look and never as unreachable.
 *
 * Choosing — "Choose this one", the consultant's `choose_look`, the decision in
 * the plan — is proven by the workers suite beside this one, and the carousel by
 * the builder suite.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdRender, run } from '../tools/generate/src/cli'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox'
import { loadSite } from '../tools/generate/src/store'
import { renderSiteFiles } from '../tools/generate/src/render/render'

const SLUG = 'charlies'

let cwd: string

interface Box {
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
  toolNames: () => string[]
}

const consultant = (): Promise<Box> => createL1Toolbox(SLUG, { cwd, sandbox: true }) as Promise<Box>

const unwrap = (answer: string): string =>
  answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')

async function ok(box: Box, tool: string, input: Record<string, unknown> = {}): Promise<string> {
  const answer = await box.run(tool, input)
  expect(answer, `${tool} was expected to succeed`).not.toMatch(/^Error:/)
  return unwrap(answer)
}

const json = async <T,>(box: Box, tool: string, input: Record<string, unknown> = {}): Promise<T> =>
  JSON.parse(await ok(box, tool, input)) as T

const draftDir = (): string => path.join(cwd, 'storage', 'sandbox', SLUG, 'draft')
const storedPage = (id: string): Record<string, any> =>
  JSON.parse(readFileSync(path.join(draftDir(), 'pages', `${id}.json`), 'utf8'))

/** Give the home page a headline the looks can be told apart by. */
async function headline(box: Box, page: string, text: string): Promise<void> {
  await ok(box, 'set_l1', {
    page,
    path: '0',
    node: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      children: [
        { kind: 'text', id: 'headline', text, axes: { color: '#111111', fontSizePx: 40, fontWeight: 700, lineHeightPx: 48 } },
      ],
    },
  })
}

const THREE_LOOKS = [
  { label: 'Workwear', description: 'Navy and safety orange, the van up top' },
  { label: 'Coastal', description: 'Sea blues and a calm, airy layout' },
  { label: 'Trade', description: 'Dense, bold, the phone number everywhere' },
]

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req391-'))
  cmdNew(SLUG, { cwd, sandbox: true })
})
afterEach(() => rmSync(cwd, { recursive: true, force: true }))

describe('REQ-391 — a set of looks is made in one call', () => {
  it('test_UAT_FC_REQ-391_creating_a_set_yields_labelled_copies_of_the_page', async () => {
    const box = await consultant()
    expect(box.toolNames()).toContain('make_alternatives')
    await headline(box, 'home', 'Charlie’s Plumbing')

    const answer = await box.run('make_alternatives', { page: 'home', looks: THREE_LOOKS })
    expect(answer).not.toMatch(/^Error:/)
    // The answer hands the consultant the link that opens the set.
    expect(answer).toContain('(#looks=home-looks)')

    const listed = await json<{ pages: { id: string; alternative?: Record<string, unknown> }[] }>(box, 'list_pages')
    const looks = listed.pages
      .filter((p) => p.alternative)
      .sort((a, b) => Number(a.alternative!.order) - Number(b.alternative!.order))
    // In the order the consultant gave them, which is the carousel's order.
    expect(looks.map((p) => p.alternative)).toEqual([
      { of: 'home', set: 'home-looks', order: 0, label: 'Workwear', description: 'Navy and safety orange, the van up top' },
      { of: 'home', set: 'home-looks', order: 1, label: 'Coastal', description: 'Sea blues and a calm, airy layout' },
      { of: 'home', set: 'home-looks', order: 2, label: 'Trade', description: 'Dense, bold, the phone number everywhere' },
    ])
    // Each look is the page, content and all, under its own identity.
    const home = storedPage('home')
    for (const { id } of looks) {
      const look = storedPage(id)
      expect(look.l1).toEqual(home.l1)
      expect(look.modules).toEqual(home.modules)
    }
    // The real page is untouched and is not a look.
    expect(listed.pages.find((p) => p.id === 'home')?.alternative).toBeUndefined()
  })

  it('test_UAT_FC_REQ-391_a_look_is_listed_as_a_look_and_never_as_unreachable', async () => {
    const box = await consultant()
    await ok(box, 'make_alternatives', { page: 'home', looks: THREE_LOOKS.slice(0, 2) })

    // The human-readable listing, as `1c page list` prints it.
    const origCwd = process.cwd()
    const logs: string[] = []
    const origLog = console.log
    process.chdir(cwd)
    console.log = (...a: unknown[]) => logs.push(a.map(String).join(' '))
    try {
      await run(['page', 'list', SLUG])
    } finally {
      console.log = origLog
      process.chdir(origCwd)
    }
    const human = logs.join('\n')
    expect(human).toContain(`look "Workwear" for 'home' in set 'home-looks'`)
    expect(human).toContain(`look "Coastal" for 'home' in set 'home-looks'`)
    // A look is not a stranded page, and is never described as one.
    expect(human).not.toContain('unreachable')
  })

  it('test_UAT_FC_REQ-391_an_existing_page_joins_a_set_and_a_set_can_grow', async () => {
    const box = await consultant()
    // A look built the old way: an ordinary page nobody links to.
    await ok(box, 'copy_page', { from: 'home', page: 'workwear', title: 'Workwear' })
    await ok(box, 'make_alternatives', { page: 'home', set: 'charlie', looks: [{ label: 'Workwear', page: 'workwear' }] })
    await ok(box, 'make_alternatives', { page: 'home', set: 'charlie', looks: [{ label: 'Coastal' }] })
    expect(storedPage('workwear').alternative).toEqual({ of: 'home', set: 'charlie', label: 'Workwear', order: 0 })
    expect(storedPage('home-coastal').alternative).toEqual({ of: 'home', set: 'charlie', label: 'Coastal', order: 1 })
    // A set belongs to one page.
    await ok(box, 'add_page', { page: 'about', title: 'About' })
    const clash = await box.run('make_alternatives', { page: 'about', set: 'charlie', looks: [{ label: 'X' }] })
    expect(clash).toMatch(/^Error:/)
    expect(clash).toContain("holds looks for 'home'")
  })
})

describe('REQ-391 — a look is never published', () => {
  it('test_UAT_FC_REQ-391_looks_are_rendered_for_the_preview_and_never_for_the_public_site', async () => {
    const box = await consultant()
    await ok(box, 'make_alternatives', { page: 'home', looks: THREE_LOOKS })

    await cmdRender(SLUG, { cwd, sandbox: true })
    const out = path.join(cwd, 'storage', 'dist', 'sandbox', SLUG, 'draft')
    expect(readdirSync(out).filter((f) => f.endsWith('.html')).sort()).toEqual(['home.html', 'index.html'])

    const loaded = loadSite({ cwd, root: 'sandbox' }, SLUG, 'draft')
    if (!loaded.ok) throw new Error('the draft did not load')
    const preview = await renderSiteFiles(loaded.value, { unpublishedPages: true })
    expect([...preview.files.keys()].filter((f) => f.endsWith('.html')).sort()).toEqual([
      'home-coastal.html',
      'home-trade.html',
      'home-workwear.html',
      'home.html',
      'index.html',
    ])
  })
})
