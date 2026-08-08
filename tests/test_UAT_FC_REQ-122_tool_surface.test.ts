import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew } from '../tools/generate/src/cli/commands'
import {
  composeDescription,
  renderManual,
  toolSpec,
  toolSpecs,
  type ToolDeclaration,
} from '../tools/generate/src/cli/ai/declare'
import { BUILDER_ABSENT, builderToolSurface } from '../tools/generate/src/cli/ai/tools'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * REQ-122 — **the builder's AI tool surface**, declared once and rendered twice.
 *
 * The workflows under test are the ones the chat panel will run for real:
 *
 * - the AI maps a page it has never seen, reads an address off that map, and
 *   changes the words there — with the draft on disk as the only evidence;
 * - a change the validator refuses comes back as something the AI can correct
 *   *within the turn*, and leaves the draft byte-identical;
 * - the surface documents itself, so what primes the model cannot fall behind
 *   the tools it describes.
 *
 * Nothing here mocks `edit.ts`. The tools ARE those functions, and a test that
 * stubbed them would prove only that this file can call itself.
 */

const HEADLINE = 'A painted band.'
const SLIDE_ONE = 'The first slide.'
const FORM_INTRO = 'Tell us what you are building.'

/** The address `set_copy` is expected to reach the headline at. */
const HEADLINE_PATH = '0.0.0'

/**
 * One page carrying the cases the map has to survive: nested copy inside a
 * painted container, a segment with no copy of its own, and copy inside both
 * flavours of behavior-module slot — a repeated one (carousel slides) and a
 * single-subtree one (the contact form).
 */
function seedPage(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))

  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      {
        kind: 'container',
        layout: 'stack',
        axes: { surfaceFill: '#101822' },
        children: [{ kind: 'text', text: HEADLINE, axes: { fontSizePx: 32 } }],
      },
      { kind: 'image', src: 'assets/hero.jpg', alt: 'A hero image' },
      { kind: 'slot', name: 'gallery' },
      { kind: 'slot', name: 'get-in-touch' },
    ],
  }

  home.l1.root = root
  home.modules = [
    {
      id: 'gallery',
      type: 'carousel',
      version: 3,
      slot: 'gallery',
      config: {},
      slots: { slide: [{ kind: 'text', text: SLIDE_ONE }] },
    },
    {
      id: 'get-in-touch',
      type: 'contact-form',
      version: 4,
      slot: 'get-in-touch',
      config: {
        action: 'https://example.com/submit',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
      },
      slots: {
        form: {
          kind: 'container',
          layout: 'stack',
          children: [
            { kind: 'text', text: FORM_INTRO },
            { kind: 'control', control: 'email' },
            { kind: 'control', control: 'submit' },
          ],
        },
      },
    },
  ]
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

let cwd: string
const SLUG = 'studio'

/** Call a tool by name the way the model's tool loop does: input in, string out. */
async function call(name: string, input: Record<string, unknown> = {}): Promise<string> {
  const decl = builderToolSurface(SLUG, { cwd }).tools.find((t) => t.name === name)
  if (!decl) throw new Error(`no tool named ${name}`)
  return String(await decl.handler(input))
}

/** The same call, parsed — for the read tools, which answer with JSON. */
async function callJson(name: string, input: Record<string, unknown> = {}): Promise<never> {
  return JSON.parse(await call(name, input))
}

interface Segment {
  path: string
  kind: string
  module?: string
  slot?: string
  values: Record<string, string>
}

function homeJson(): Record<string, unknown> {
  return JSON.parse(
    readFileSync(path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', 'home.json'), 'utf8'),
  )
}

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req122-'))
  cmdNew(SLUG, { cwd })
  seedPage(cwd, SLUG)
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

describe('REQ-122 — the AI changes the site through the tool surface', () => {
  it('maps a page it has never seen and changes the words it finds there', async () => {
    // The AI's actual opening move: it knows a slug and nothing else.
    const site = (await callJson('describe_site')) as unknown as {
      pages: { id: string }[]
    }
    expect(site.pages.map((p) => p.id)).toContain('home')

    const map = (await callJson('describe_page', { page: 'home' })) as unknown as {
      segments: Segment[]
    }

    // The map is the only place the address comes from — nothing here computes
    // one, because the model cannot either.
    const headline = map.segments.find((s) => s.values.text === HEADLINE)
    expect(headline).toBeDefined()
    expect(headline?.path).toBe(HEADLINE_PATH)

    const result = await call('set_copy', {
      page: 'home',
      path: headline!.path,
      values: { text: 'A quieter band.' },
    })
    expect(result).toMatch(/Updated text/)

    // The draft on disk is the only evidence that counts.
    const l1 = homeJson().l1 as { root: { children: { children: { text: string }[] }[] } }
    expect(l1.root.children[0].children[0].text).toBe('A quieter band.')
  })

  it('maps copy inside behavior modules, carrying the scope the write path needs', async () => {
    const map = (await callJson('describe_page', { page: 'home' })) as unknown as {
      segments: Segment[]
    }

    // A slide and a form intro are editable words on the page. A model shown only
    // the page's own L1 would report them as unchangeable — they are not.
    const slide = map.segments.find((s) => s.values.text === SLIDE_ONE)
    const intro = map.segments.find((s) => s.values.text === FORM_INTRO)
    expect(slide).toMatchObject({ module: 'gallery', slot: 'slide' })
    expect(intro).toMatchObject({ module: 'get-in-touch', slot: 'form' })

    // The scope travels with the address, so handing the map's entry straight
    // back is a valid write — which is the property that makes the map usable.
    await call('set_copy', {
      page: 'home',
      path: slide!.path,
      module: slide!.module,
      slot: slide!.slot,
      values: { text: 'Our newest work.' },
    })

    const modules = homeJson().modules as { id: string; slots: { slide: { text: string }[] } }[]
    const gallery = modules.find((m) => m.id === 'gallery')
    expect(gallery?.slots.slide[0].text).toBe('Our newest work.')
  })

  it('reports a refused change as something the AI can correct, leaving the draft untouched', async () => {
    const before = readFileSync(
      path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', 'home.json'),
      'utf8',
    )

    // An address the model guessed rather than read — the most likely bad call.
    const refusal = await call('set_copy', {
      page: 'home',
      path: '9.9.9',
      values: { text: 'nope' },
    })

    // The code, the offending path and the hint all survive to the model: that is
    // what lets it fix the call in the same turn rather than asking the user.
    expect(refusal).toContain('NOT_FOUND')
    expect(refusal).toContain('9.9.9')
    expect(refusal).toContain('hint:')

    // A refusal is not a partial write.
    expect(
      readFileSync(path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', 'home.json'), 'utf8'),
    ).toBe(before)
  })

  it('answers a tool failure rather than throwing, so one bad call cannot end the turn', async () => {
    // The loop treats a throw as a broken turn. Every failure mode must resolve.
    await expect(call('describe_page', { page: 'does-not-exist' })).resolves.toContain('NOT_FOUND')
    await expect(call('get_config', { key: 'nope.nope' })).resolves.toContain('NOT_FOUND')
    await expect(call('set_copy', { page: 'home', path: '0.0.0', values: 'not an object' }))
      .resolves.toContain('SCHEMA_INVALID')
  })

  it('adds a page, and refuses to add it twice', async () => {
    expect(await call('add_page', { page: 'contact', title: 'Contact us' })).toMatch(/contact/)

    const pages = (await callJson('list_pages')) as unknown as { pages: { id: string }[] }
    expect(pages.pages.map((p) => p.id)).toContain('contact')

    expect(await call('add_page', { page: 'contact' })).toContain('CONFLICT')
  })
})

describe('REQ-122 — one declaration, two renderings', () => {
  const surface = () => builderToolSurface(SLUG, { cwd })

  it('spells an enum into the description from the schema, so the two cannot drift', () => {
    // The drift DOC-8 §5.3 invites: an enum written once in the schema and again
    // in prose. Here the prose is DERIVED, so there is no second copy to fall out
    // of step when a value is added.
    const spec = toolSpec({
      name: 'set_shape',
      summary: 'Set the shape.',
      category: 'test',
      params: { shape: { type: 'string', description: 'The shape.', enum: ['square', 'circle'] } },
      required: ['shape'],
      handler: () => 'ok',
    })

    expect(spec.inputSchema.properties.shape.enum).toEqual(['square', 'circle'])
    expect(spec.inputSchema.properties.shape.description).toBe(
      'The shape. One of: square or circle.',
    )
  })

  it('tells the model what a tool needs first, and that it writes', () => {
    const decl = surface().tools.find((t) => t.name === 'set_copy')!
    const description = composeDescription(decl)

    expect(description).toContain('Changes the site.')
    // Without this the model invents addresses, which is the failure mode the
    // whole read-then-write shape exists to prevent.
    expect(description).toContain('describe_page')
    expect(description).toContain('NOT_FOUND')
  })

  it('refuses a declaration that requires a parameter it never declared', () => {
    // A startup failure with a name attached, rather than a mid-turn tool error
    // the model would try to correct and could not.
    const broken: ToolDeclaration = {
      name: 'broken',
      summary: 'Broken.',
      category: 'test',
      params: {},
      required: ['page'],
      handler: () => 'ok',
    }
    expect(() => toolSpec(broken)).toThrow(/requires parameter 'page'/)
  })

  it('every declared example is a call its own tool would accept', () => {
    // Documentation that the test suite verifies. An example that drifted from
    // its schema would teach the model a call shape the tool then refuses.
    for (const decl of surface().tools) {
      for (const example of decl.examples ?? []) {
        for (const name of decl.required) {
          expect(Object.keys(example.input), `${decl.name} example`).toContain(name)
        }
        for (const key of Object.keys(example.input)) {
          expect(Object.keys(decl.params), `${decl.name} example`).toContain(key)
        }
      }
    }
  })

  it('produces every tool exactly once, with a schema the model can satisfy', () => {
    const specs = toolSpecs(surface())
    expect(new Set(specs.map((s) => s.name)).size).toBe(specs.length)
    for (const spec of specs) {
      expect(spec.description.length).toBeGreaterThan(0)
      for (const required of spec.inputSchema.required) {
        expect(Object.keys(spec.inputSchema.properties)).toContain(required)
      }
    }
  })
})

describe('REQ-122 — the surface documents itself', () => {
  it('generates a manual naming every tool it offers', () => {
    const surface = builderToolSurface(SLUG, { cwd })
    const manual = renderManual(surface)

    // Generated from the declarations, so a tool added without a doc written for
    // it is impossible rather than merely discouraged.
    for (const decl of surface.tools) expect(manual).toContain(decl.name)
    expect(manual).toContain('When a tool refuses')
    expect(manual).toContain('SCHEMA_INVALID')
  })

  it('declares what it deliberately cannot do, and what to say instead', () => {
    const manual = renderManual(builderToolSurface(SLUG, { cwd }))

    // DOC-8 §5.2 enforces the forbidden list by ABSENCE, which is right for
    // enforcement and useless as guidance — absence teaches the model nothing.
    // Declaring it turns a security property into an answer it can give.
    expect(manual).toContain('What there is no tool for')
    for (const entry of BUILDER_ABSENT) expect(manual).toContain(entry.ask)

    // The two the model would otherwise burn a turn discovering.
    expect(manual).toMatch(/HTML, CSS or JavaScript/)
    expect(manual).toMatch(/colour, size, spacing/)
  })

  it('offers no tool that could write markup, styles or source', () => {
    // The forbidden list, tested as what it actually is: the absence of tools.
    const names = builderToolSurface(SLUG, { cwd }).tools.map((t) => t.name)
    for (const forbidden of ['write_file', 'set_css', 'set_html', 'eval', 'run', 'set_style']) {
      expect(names).not.toContain(forbidden)
    }
  })
})
