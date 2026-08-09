import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew } from '../tools/generate/src/cli/commands'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * REQ-122 — **the AI changes the site through the tool surface**.
 *
 * The workflows under test are the ones the chat panel runs for real:
 *
 * - the AI maps a page it has never seen, reads an address off that map, and
 *   changes the words there — with the draft on disk as the only evidence;
 * - the same works for copy inside a behavior module's slots, because a model
 *   shown only a page's own L1 would report a carousel slide as unchangeable;
 * - a change the validator refuses comes back as something the AI can correct
 *   *within the turn*, and leaves the draft byte-identical.
 *
 * REQ-126 replaced the local declaration format with the framework's Toolbox, so
 * the calls below go through `Toolbox.run` — validate, gate, invoke, mark,
 * record — rather than a handler closure. What that surface *is* (declared
 * schemas, effect classification, provenance, audit) is REQ-126's evidence;
 * what it *does* is here, and it did not change.
 *
 * Nothing here mocks `edit.ts`. The operations ARE those functions, and a test
 * that stubbed them would prove only that this file can call itself.
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
let box: { run: (tool: string, input: Record<string, unknown>) => string }
const SLUG = 'studio'

/** Call a tool the way the model's tool loop does: input in, string out. */
function call(name: string, input: Record<string, unknown> = {}): string {
  return box.run(name, input)
}

/**
 * The same call, parsed. Reads come back wrapped in the provenance markers the
 * model is told about (REQ-126) — site copy is text a third party wrote — so a
 * consumer strips them after being told what they mean.
 */
function callJson<T>(name: string, input: Record<string, unknown> = {}): T {
  const answer = call(name, input)
    .replace(/^<<<untrusted>>>\n/, '')
    .replace(/\n<<<\/untrusted>>>$/, '')
  return JSON.parse(answer) as T
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

beforeEach(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req122-'))
  cmdNew(SLUG, { cwd })
  seedPage(cwd, SLUG)
  box = await createL1Toolbox(SLUG, { cwd })
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

describe('REQ-122 — the AI changes the site through the tool surface', () => {
  it('maps a page it has never seen and changes the words it finds there', () => {
    // The AI's actual opening move: it knows a slug and nothing else.
    const site = callJson<{ pages: { id: string }[] }>('describe_site')
    expect(site.pages.map((p) => p.id)).toContain('home')

    const map = callJson<{ segments: Segment[] }>('describe_page', { page: 'home' })

    // The map is the only place the address comes from — nothing here computes
    // one, because the model cannot either.
    const found = map.segments.find((s) => s.values.text === HEADLINE)
    expect(found).toBeDefined()
    expect(found?.path).toBe(HEADLINE_PATH)

    const result = call('set_copy', {
      page: 'home',
      path: found!.path,
      values: { text: 'A quieter band.' },
    })
    expect(result).toMatch(/Updated text/)

    // The draft on disk is the only evidence that counts.
    const l1 = homeJson().l1 as { root: { children: { children: { text: string }[] }[] } }
    expect(l1.root.children[0].children[0].text).toBe('A quieter band.')
  })

  it('maps copy inside behavior modules, carrying the scope the write path needs', () => {
    const map = callJson<{ segments: Segment[] }>('describe_page', { page: 'home' })

    // A slide and a form intro are editable words on the page. A model shown only
    // the page's own L1 would report them as unchangeable — they are not.
    const slide = map.segments.find((s) => s.values.text === SLIDE_ONE)
    const intro = map.segments.find((s) => s.values.text === FORM_INTRO)
    expect(slide).toMatchObject({ module: 'gallery', slot: 'slide' })
    expect(intro).toMatchObject({ module: 'get-in-touch', slot: 'form' })

    // The scope travels with the address, so handing the map's entry straight
    // back is a valid write — which is the property that makes the map usable.
    call('set_copy', {
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

  it('reports a refused change as something the AI can correct, leaving the draft untouched', () => {
    const before = readFileSync(
      path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', 'home.json'),
      'utf8',
    )

    // An address the model guessed rather than read — the most likely bad call.
    const refusal = call('set_copy', {
      page: 'home',
      path: '9.9.9',
      values: { text: 'nope' },
    })

    // The code AND what to do about it. The second half is what lets the model
    // fix the call in the same turn rather than asking the user, and it comes
    // from the surface's declared error taxonomy rather than from prose here.
    expect(refusal).toContain('NOT_FOUND')
    expect(refusal).toMatch(/Re-read the listing/)

    // A refusal is not a partial write.
    expect(
      readFileSync(path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', 'home.json'), 'utf8'),
    ).toBe(before)
  })

  it('answers a tool failure rather than throwing, so one bad call cannot end the turn', () => {
    // The loop treats a throw as a broken turn. Every failure mode must resolve.
    expect(call('describe_page', { page: 'does-not-exist' })).toContain('NOT_FOUND')
    expect(call('get_config', { key: 'nope.nope' })).toContain('NOT_FOUND')
    expect(call('set_copy', { page: 'home', path: '0.0.0', values: 'not an object' })).toMatch(
      /must be an object/i,
    )
    expect(call('no_such_tool', {})).toMatch(/unknown tool/i)
  })

  it('adds a page, and refuses to add it twice', () => {
    expect(call('add_page', { page: 'contact', title: 'Contact us' })).toMatch(/contact/)

    const pages = callJson<{ pages: { id: string }[] }>('list_pages')
    expect(pages.pages.map((p) => p.id)).toContain('contact')

    expect(call('add_page', { page: 'contact' })).toContain('CONFLICT')
  })
})
