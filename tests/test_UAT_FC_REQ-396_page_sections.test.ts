/**
 * [[REQ-396]] — **a page stored as a frame plus one unit per section,
 * assembled at render.**
 *
 * THE SUBJECT IS A REAL PAGE. `fixtures/req396-charlies` is Charlie's Plumbing
 * 2's home page exactly as the consultant built it: a root `stack` of twelve
 * id'd sections (`emergency-bar`, `header`, … `quote-form-section`, `footer`)
 * and one contact form whose slot sits inside `quote-form-section`.
 *
 * REAL ENTRY POINTS. Everything goes through the consultant's own toolbox
 * (`createL1Toolbox`, with the grant it ships with) or `1c`, over a sandbox
 * draft on disk — the file adapter, whose stored units are files a test can
 * look at. The render is the real renderer, over `loadSite`, so "renders
 * exactly as before" is a byte comparison of every file it emits. The D1
 * adapter is proven by the workers suite beside this one.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { run } from '../tools/generate/src/cli'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox'
import { loadSite } from '../tools/generate/src/store'
import { renderSiteFiles } from '../tools/generate/src/render/render'

const SLUG = 'charlies'
const FIXTURE = path.join(__dirname, 'fixtures', 'req396-charlies')
const SECTIONS = [
  'emergency-bar',
  'header',
  'hero-section-outer',
  'services-glance',
  'kitchens-bathrooms',
  'process',
  'story',
  'emergencies',
  'reviews',
  'trust-strip',
  'quote-form-section',
  'footer',
]

let cwd: string

interface Box {
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
}

const unwrap = (answer: string): string =>
  answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')

const consultant = (): Promise<Box> => createL1Toolbox(SLUG, { cwd, sandbox: true }) as unknown as Promise<Box>

async function ok<T = Record<string, any>>(box: Box, tool: string, input: Record<string, unknown>): Promise<T> {
  const answer = await box.run(tool, input)
  expect(answer, `${tool} was expected to succeed`).not.toMatch(/^Error:/)
  return JSON.parse(unwrap(answer)) as T
}

async function refused(box: Box, tool: string, input: Record<string, unknown>): Promise<string> {
  const answer = await box.run(tool, input)
  expect(answer, `${tool} was expected to be refused`).toMatch(/^Error:/)
  return answer
}

async function cli(...argv: string[]): Promise<{ ok: boolean; data?: Record<string, any>; error?: { code?: string; message?: string } }> {
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

const pagesDir = (): string => path.join(cwd, 'storage', 'sandbox', SLUG, 'draft', 'pages')
const sectionsDir = (): string => path.join(pagesDir(), 'home.sections')
const readJson = (file: string): Record<string, any> => JSON.parse(readFileSync(file, 'utf8'))

/** Every file the real renderer emits for the draft, by path. */
async function rendered(): Promise<Map<string, string>> {
  const loaded = loadSite({ cwd, root: 'sandbox' }, SLUG, 'draft')
  if (!loaded.ok) throw new Error(`draft did not load: ${JSON.stringify(loaded.errors)}`)
  return (await renderSiteFiles(loaded.value)).files
}

/** Each stored file's bytes, by name under `pages/`. */
function storedFiles(): Map<string, string> {
  const out = new Map<string, string>()
  const walk = (dir: string, rel: string): void => {
    for (const name of readdirSync(dir)) {
      const abs = path.join(dir, name)
      if (statSync(abs).isDirectory()) walk(abs, `${rel}${name}/`)
      else out.set(`${rel}${name}`, readFileSync(abs, 'utf8'))
    }
  }
  walk(pagesDir(), '')
  return out
}

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req396-'))
  cpSync(FIXTURE, path.join(cwd, 'storage', 'sandbox', SLUG, 'draft'), { recursive: true })
})
afterEach(() => rmSync(cwd, { recursive: true, force: true }))

describe('REQ-396 — decompose and recompose', () => {
  it('test_UAT_FC_REQ-396_decomposing_charlies_home_page_stores_twelve_sections_and_renders_byte_identically', async () => {
    const before = await rendered()
    const box = await consultant()

    const answer = await ok(box, 'decompose_page', { page: 'home' })
    expect(answer.changed.sections).toEqual(SECTIONS)
    expect(answer.changed.files).toEqual(['home.json', ...SECTIONS.map((id) => `home.json#${id}`)])

    // Stored: a frame, plus one file per section keyed by id.
    const frame = readJson(path.join(pagesDir(), 'home.json'))
    expect(frame.sections).toEqual(SECTIONS)
    expect(frame.l1.root.children).toEqual([])
    expect(frame.l1.widths).toBeDefined()
    expect(frame.modules).toEqual([{ id: 'quote_form', section: 'quote-form-section' }])
    expect(readdirSync(sectionsDir()).sort()).toEqual(SECTIONS.map((id) => `${id}.json`).sort())
    const formSection = readJson(path.join(sectionsDir(), 'quote-form-section.json'))
    expect(formSection.node.id).toBe('quote-form-section')
    expect(formSection.modules.map((m: { id: string }) => m.id)).toEqual(['quote_form'])

    // Assembled at render: every emitted file is byte-identical.
    const after = await rendered()
    expect([...after.keys()]).toEqual([...before.keys()])
    for (const [file, bytes] of before) expect(after.get(file), file).toBe(bytes)

    // And the page reads back as the page it was.
    const original = readJson(path.join(FIXTURE, 'pages', 'home.json'))
    const got = await ok(box, 'describe_page', { page: 'home' })
    expect(got.sections).toEqual(SECTIONS)
    expect((await cli('page', 'get', SLUG, 'home')).data?.page).toEqual(original)
  })

  it('test_UAT_FC_REQ-396_recompose_joins_the_page_back_into_one_file_unchanged', async () => {
    const original = readJson(path.join(FIXTURE, 'pages', 'home.json'))
    const before = await rendered()
    expect((await cli('page', 'decompose', SLUG, 'home')).data?.sections).toEqual(SECTIONS)
    const box = await consultant()
    await ok(box, 'set_l1', {
      page: 'home',
      section: 'story',
      path: '0',
      node: { ...(await ok(box, 'get_l1', { page: 'home', section: 'story', path: '0' })).node },
    })

    const joined = await cli('page', 'recompose', SLUG, 'home')
    expect(joined.ok).toBe(true)
    expect(joined.data?.files).toEqual(['home.json'])
    expect(existsSync(sectionsDir())).toBe(false)
    expect(readJson(path.join(pagesDir(), 'home.json'))).toEqual(original)
    const after = await rendered()
    for (const [file, bytes] of before) expect(after.get(file), file).toBe(bytes)
    // A page that is not stored as sections takes no section.
    expect(await refused(box, 'get_l1', { page: 'home', section: 'story', path: '0' })).toMatch(/not stored as sections/)
  })

  it('test_UAT_FC_REQ-396_a_page_whose_root_is_not_a_flow_stack_is_refused_and_keeps_working', async () => {
    const box = await consultant()
    // Make the root a row: its parts now sit side by side rather than as
    // sections one below another.
    const root = (await ok(box, 'get_l1', { page: 'home', path: '0' })).node
    await ok(box, 'set_l1', { page: 'home', path: '0', node: { ...root, layout: 'row' } })

    const refusal = await refused(box, 'decompose_page', { page: 'home' })
    expect(refusal).toMatch(/root is not a stack/)
    expect(existsSync(sectionsDir())).toBe(false)
    expect(readJson(path.join(pagesDir(), 'home.json')).sections).toBeUndefined()

    // And it keeps working, whole, exactly as before.
    const story = await ok(box, 'get_l1', { page: 'home', path: '0.6' })
    expect(story.node.id).toBe('story')
    await ok(box, 'set_l1', { page: 'home', path: '0.6', node: story.node })

    // A section placed by position is refused too, naming it.
    await ok(box, 'set_l1', { page: 'home', path: '0', node: root })
    const placed = { ...story.node, geometry: { keyframes: [{ at: 375, x: 0, y: 0, width: 375 }] } }
    await ok(box, 'set_l1', { page: 'home', path: '0.6', node: placed })
    expect(await refused(box, 'decompose_page', { page: 'home' })).toMatch(/section 'story' is placed by position/)
  })

  it('test_UAT_FC_REQ-396_a_new_page_can_be_created_already_decomposed', async () => {
    const box = await consultant()
    const added = await ok(box, 'add_page', { page: 'about', sections: true })
    expect(added.changed.sections).toEqual(['placeholder'])
    const frame = readJson(path.join(pagesDir(), 'about.json'))
    expect(frame.sections).toEqual(['placeholder'])
    expect(existsSync(path.join(pagesDir(), 'about.sections', 'placeholder.json'))).toBe(true)
    const node = (await ok(box, 'get_l1', { page: 'about', section: 'placeholder', path: '0' })).node
    expect(node.kind).toBe('text')
  })
})

describe('REQ-396 — section-scoped reads and writes', () => {
  it('test_UAT_FC_REQ-396_writing_one_section_leaves_every_other_sections_addresses_and_file_unchanged', async () => {
    const box = await consultant()
    await ok(box, 'decompose_page', { page: 'home' })

    // Read section A (the hero) by section-relative addresses, from a map
    // scoped to it.
    const heroMap = await ok(box, 'describe_page', { page: 'home', section: 'hero-section-outer' })
    expect(heroMap.segments[0].path).toBe('0')
    const heroAddresses = heroMap.segments.map((s: { path: string }) => s.path)
    const heroBefore = await Promise.all(
      heroAddresses.map(async (p: string) => (await ok(box, 'get_l1', { page: 'home', section: 'hero-section-outer', path: p })).node),
    )
    const filesBefore = storedFiles()

    // Write section B (the story) by its id: replace its first child with a
    // new element, so its own child count and addresses change.
    const story = (await ok(box, 'get_l1', { page: 'home', section: 'story', path: '0' })).node
    const extra = { kind: 'text', id: 'story-kicker', text: 'Since 1987', axes: { color: '#111111', fontSizePx: 14, lineHeightPx: 20 } }
    const written = await ok(box, 'set_l1', {
      page: 'home',
      section: 'story',
      path: '0',
      node: { ...story, children: [extra, ...story.children] },
    })
    expect(written.message).toMatch(/section 'story'/)

    // Only the story's file changed; the frame and every other section are
    // byte-identical.
    const filesAfter = storedFiles()
    for (const [name, bytes] of filesBefore) {
      if (name === 'home.sections/story.json') expect(filesAfter.get(name)).not.toBe(bytes)
      else expect(filesAfter.get(name), name).toBe(bytes)
    }

    // Section A's previously read addresses still resolve to the same nodes.
    for (const [i, p] of heroAddresses.entries()) {
      const again = (await ok(box, 'get_l1', { page: 'home', section: 'hero-section-outer', path: p })).node
      expect(again, p).toEqual(heroBefore[i])
    }
    // The story's own new child is where it was put.
    expect((await ok(box, 'get_l1', { page: 'home', section: 'story', path: '0.0' })).node.id).toBe('story-kicker')
  })

  it('test_UAT_FC_REQ-396_a_section_write_creating_a_duplicate_id_is_refused', async () => {
    const box = await consultant()
    await ok(box, 'decompose_page', { page: 'home' })
    const filesBefore = storedFiles()
    const story = (await ok(box, 'get_l1', { page: 'home', section: 'story', path: '0' })).node
    // `header` is already the id of another section.
    const clash = { kind: 'text', id: 'header', text: 'Clash', axes: { color: '#111111', fontSizePx: 14, lineHeightPx: 20 } }
    const refusal = await refused(box, 'set_l1', {
      page: 'home',
      section: 'story',
      path: '0',
      node: { ...story, children: [clash, ...story.children] },
    })
    expect(refusal).toMatch(/header/)
    expect(storedFiles()).toEqual(filesBefore)
  })

  it('test_UAT_FC_REQ-396_a_section_write_cannot_change_the_frame_or_another_section', async () => {
    const box = await consultant()
    await ok(box, 'decompose_page', { page: 'home' })
    const filesBefore = storedFiles()

    // Renaming the section through a write scoped to it would change the
    // frame's list of sections.
    const story = (await ok(box, 'get_l1', { page: 'home', section: 'story', path: '0' })).node
    const renamed = await refused(box, 'set_l1', { page: 'home', section: 'story', path: '0', node: { ...story, id: 'our-story' } })
    expect(renamed).toMatch(/list of sections/)

    // The contact form's slot sits in `quote-form-section`, so the form belongs
    // to that section: a write scoped to `story` cannot reach it.
    const form = (await ok(box, 'get_l1', { page: 'home', section: 'story', module: 'quote_form', slot: 'form', path: '0' })).node
    const reached = await refused(box, 'set_l1', {
      page: 'home',
      section: 'story',
      module: 'quote_form',
      slot: 'form',
      path: '0',
      node: { ...form, gapPx: 3 },
    })
    expect(reached).toMatch(/may change only that section.*section 'quote-form-section'/)
    // Scoped to the section that hosts it, the same write lands.
    await ok(box, 'set_l1', { page: 'home', section: 'quote-form-section', module: 'quote_form', slot: 'form', path: '0', node: { ...form, gapPx: 3 } })
    const filesMid = storedFiles()
    for (const [name, bytes] of filesBefore) {
      if (name === 'home.sections/quote-form-section.json') expect(filesMid.get(name)).not.toBe(bytes)
      else expect(filesMid.get(name), name).toBe(bytes)
    }

    // A frame key changed without `section` writes the frame and no section.
    await ok(box, 'set_page_style', { page: 'home', style: { background: '#fefefe' } })
    const filesAfter = storedFiles()
    expect(filesAfter.get('home.json')).not.toBe(filesMid.get('home.json'))
    for (const id of SECTIONS) expect(filesAfter.get(`home.sections/${id}.json`), id).toBe(filesMid.get(`home.sections/${id}.json`))
  })

  it('test_UAT_FC_REQ-396_an_unscoped_write_to_a_decomposed_page_rewrites_only_the_section_it_changed', async () => {
    const box = await consultant()
    await ok(box, 'decompose_page', { page: 'home' })
    const filesBefore = storedFiles()
    // Without `section` the page is addressed whole, as always: the footer is 0.11.
    const footer = (await ok(box, 'get_l1', { page: 'home', path: '0.11' })).node
    expect(footer.id).toBe('footer')
    await ok(box, 'set_l1', { page: 'home', path: '0.11', node: { ...footer, gapPx: 7 } })
    const filesAfter = storedFiles()
    for (const [name, bytes] of filesBefore) {
      if (name === 'home.sections/footer.json') expect(filesAfter.get(name)).not.toBe(bytes)
      else expect(filesAfter.get(name), name).toBe(bytes)
    }
  })

  it('test_UAT_FC_REQ-396_an_undecomposed_page_behaves_exactly_as_before', async () => {
    const box = await consultant()
    const map = await ok(box, 'describe_page', { page: 'home' })
    expect(map.sections).toBeUndefined()
    const footer = (await ok(box, 'get_l1', { page: 'home', path: '0.11' })).node
    const answer = await ok(box, 'set_l1', { page: 'home', path: '0.11', node: { ...footer, gapPx: 7 } })
    expect(answer.changed).toEqual(['0.11'])
    expect(readdirSync(pagesDir())).toEqual(['home.json'])
    const stored = readJson(path.join(pagesDir(), 'home.json'))
    expect(stored.sections).toBeUndefined()
    expect(stored.l1.root.children[11].gapPx).toBe(7)
    expect(await refused(box, 'describe_page', { page: 'home', section: 'footer' })).toMatch(/not stored as sections/)
  })
})

describe('REQ-396 — frame operations', () => {
  it('test_UAT_FC_REQ-396_sections_are_added_moved_and_removed_as_frame_writes', async () => {
    const box = await consultant()
    await ok(box, 'decompose_page', { page: 'home' })

    const band = { kind: 'container', id: 'offer', layout: 'stack', children: [] }
    const added = await ok(box, 'add_section', { page: 'home', node: band, before: 'footer' })
    expect(added.changed.sections.slice(-2)).toEqual(['offer', 'footer'])
    expect(existsSync(path.join(sectionsDir(), 'offer.json'))).toBe(true)
    expect(await refused(box, 'add_section', { page: 'home', node: band })).toMatch(/already has a section 'offer'/)

    // A section placed by position is refused as a section.
    const placed = { ...band, id: 'floating', geometry: { keyframes: [{ at: 375, x: 0, y: 0, width: 375 }] } }
    expect(await refused(box, 'add_section', { page: 'home', node: placed })).toMatch(/placed by position/)

    const storyBefore = readFileSync(path.join(sectionsDir(), 'story.json'), 'utf8')
    const moved = await cli('section', 'move', SLUG, 'home', 'story', '--before', 'header')
    expect(moved.data?.sections.slice(0, 3)).toEqual(['emergency-bar', 'story', 'header'])
    // Moving rewrites the frame, not the section.
    expect(readFileSync(path.join(sectionsDir(), 'story.json'), 'utf8')).toBe(storyBefore)

    // Removing the section that hosts the form removes the form with it.
    const removed = await ok(box, 'remove_section', { page: 'home', section: 'quote-form-section' })
    expect(removed.changed.sections).not.toContain('quote-form-section')
    expect(removed.message).toMatch(/quote_form/)
    expect(existsSync(path.join(sectionsDir(), 'quote-form-section.json'))).toBe(false)
    const page = (await cli('page', 'get', SLUG, 'home')).data?.page
    expect(page.modules).toEqual([])
    expect(page.l1.root.children.map((c: { id: string }) => c.id)).toEqual(readJson(path.join(pagesDir(), 'home.json')).sections)
  })
})
