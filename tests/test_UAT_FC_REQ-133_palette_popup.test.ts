// @vitest-environment jsdom
/**
 * REQ-133 — the palette popup: display, pick and edit the site's colors.
 *
 * REQ-114 gave a site a palette and REQ-137 made an entry one color whose
 * light↔dark family is generated per-use. This is the surface that puts both in
 * front of a person: one popup, opened either to MANAGE the palette or to PICK a
 * color out of it.
 *
 * REAL EVERYTHING EXCEPT THE ORIGIN'S PORT, on the pattern the REQ-132 picker
 * suite established. The site is a real draft on disk, the writes go through the
 * real `1c` entry point and the real builder origin, the popup is the real
 * module, and the shade arithmetic is the renderer's own — imported from the
 * module the render path resolves through, because a second copy of it in a test
 * would prove the test agreed with itself.
 *
 * WHAT THE SUITE IS SHAPED TO CATCH. Three claims are load-bearing and each is
 * asserted at the level it could actually fail:
 *
 *  - **The guards are the ORIGIN's, not the popup's.** Delete-while-referenced
 *    and rename-onto-an-existing-name are posted directly, bypassing the popup
 *    entirely, because a stale tab is exactly the caller the rule exists to
 *    refuse. A test that only clicked a disabled button would pass against a
 *    surface with no guard at all.
 *  - **One walk, one number.** The count the popup shows before a rename and the
 *    number of references the rename rewrites come from the same traversal — so
 *    the site under test carries references at several shades, which is where two
 *    hand-kept walks would disagree.
 *  - **A color change repaints uses at every shade.** Asserted on the RENDERED
 *    bytes, not on the definition: the definition changing is what the store
 *    does, and the page changing is what the operator asked for.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, run, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import { shadeHex } from '../packages/site-schema/src/l1/shade'
import { openPalettePopup } from '../apps/control-app/src/builder/palette-popup.js'
import { colorsAction } from '../apps/control-app/src/builder/toolbar.js'
import { fetchPalette, writePalette } from '../apps/control-app/src/builder/api.js'
import { copyFieldsOf } from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'

/** The palette the fixture site carries. */
const PALETTE = {
  primary: { value: '#2e86a3' },
  text: { value: '#1f2937' },
  surface: { value: '#fffef8' },
  /** Declared and never referenced — the only state a delete is allowed in. */
  spare: { value: '#7b3f61' },
}

/** A shade far enough from zero to move bytes, and not a round number. */
const DARKER = -0.42
const LIGHTER = 0.31

function draftPath(cwd: string, slug: string, ...rest: string[]): string {
  return path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)
}

/**
 * One page whose colors reference `primary` at THREE positions in its family —
 * the entry itself, a darker shade and a lighter one.
 *
 * That spread is the fixture's whole point. A site referencing every entry at
 * shade zero would pass a census that counted only unshaded references, and
 * would pass a rename that rewrote only those; both are exactly the bug the
 * single-walk requirement exists to prevent.
 */
function seedSite(cwd: string, slug: string): void {
  const siteJson = draftPath(cwd, slug, 'site.json')
  const base = JSON.parse(fs.readFileSync(siteJson, 'utf8'))
  base.palette = PALETTE
  fs.writeFileSync(siteJson, JSON.stringify(base, null, 2))

  const homePath = draftPath(cwd, slug, 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    axes: { surfaceFill: { ref: 'surface' } },
    children: [
      { kind: 'text', id: 'a', text: 'Plain primary.', axes: { color: { ref: 'primary' } } },
      {
        kind: 'text',
        id: 'b',
        text: 'Darker primary.',
        axes: { color: { ref: 'primary', shade: DARKER } },
      },
      {
        kind: 'text',
        id: 'c',
        text: 'Lighter primary.',
        axes: { color: { ref: 'primary', shade: LIGHTER } },
      },
      { kind: 'text', id: 'd', text: 'Body copy.', axes: { color: { ref: 'text' } } },
    ],
  }
  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))
}

/** The browser's own URL resolution, so the real `api.js` calls reach the real origin. */
function bindFetch(originUrl: string): () => void {
  const real = globalThis.fetch
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    real(typeof input === 'string' ? (new URL(input, originUrl) as URL) : (input as URL), init)) as typeof fetch
  return () => {
    globalThis.fetch = real
  }
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code?: string; message?: string; hint?: string }
  exitCode: number
}

/** Drive the real `1c` entry point — argv in, envelope out. */
async function cli(cwd: string, ...argv: string[]): Promise<CliResult> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const out: string[] = []
  process.chdir(cwd)
  process.exitCode = 0
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run([...argv, '--json'])
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
  }
  const envelope = JSON.parse(out.join('\n')) as Omit<CliResult, 'exitCode'>
  return { ...envelope, exitCode: Number(process.exitCode ?? 0) }
}

/**
 * A URL against the running origin.
 *
 * `builder.url` ends in a slash, so concatenating a rooted path produces
 * `//api/…` — which no route matches, and which 404s in a way that reads as
 * "the route is missing" rather than "the URL is wrong". Resolving is also what
 * the browser does with the relative paths `api.js` sends, so the tests that
 * post directly reach the origin by the identical address as the ones that go
 * through it.
 */
function urlOn(base: string, rel: string): string {
  return new URL(rel, base).toString()
}

/** The rendered draft's bytes — what an operator actually looks at. */
async function renderedDraft(cwd: string, slug: string): Promise<string> {
  const { outDir } = await cmdRender(slug, { cwd, edit: false })
  return fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
}

function readSite(cwd: string, slug: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(draftPath(cwd, slug, 'site.json'), 'utf8'))
}

function readHome(cwd: string, slug: string): string {
  return fs.readFileSync(draftPath(cwd, slug, 'pages', 'home.json'), 'utf8')
}

describe('REQ-133 the palette popup', () => {
  let cwd: string
  let builder: BuilderHandle
  let unbindFetch: () => void
  /** Every popup opened by a test, closed in `afterEach` so dialogs never stack. */
  let host: HTMLElement

  const transport = { get: fetchPalette, write: writePalette }
  const origin = (rel: string) => urlOn(builder.url, rel)

  const open = (slug: string, extra: Record<string, unknown> = {}) =>
    openPalettePopup({ host, slug, transport, shadeHex, ...extra })

  /** Wait for the popup's first paint — it loads the palette before it draws. */
  async function settled(): Promise<void> {
    for (let i = 0; i < 200; i += 1) {
      if (host.querySelector('.builder-palette__swatch, .builder-palette__empty')) return
      await new Promise((r) => setTimeout(r, 5))
    }
    throw new Error('the popup never painted')
  }

  const swatches = () => [...host.querySelectorAll<HTMLElement>('.builder-palette__swatch')]
  const swatchText = () =>
    swatches().map((s) => ({
      name: s.querySelector('.builder-palette__name')!.textContent,
      count: s.querySelector('.builder-palette__count')!.textContent,
      chip: (s.querySelector('.builder-palette__chip') as HTMLElement).style.background,
    }))

  /** Select an entry the way a person does — through its radio. */
  function select(name: string): void {
    const input = host.querySelector<HTMLInputElement>(`.builder-palette__swatch[data-name="${name}"] input`)!
    input.checked = true
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

  function clickButton(label: string): void {
    const btn = [...host.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent === label,
    )
    if (!btn) throw new Error(`no button labelled "${label}"`)
    btn.click()
  }

  /** Let a posted write land and the popup redraw. */
  async function written(): Promise<void> {
    for (let i = 0; i < 200; i += 1) {
      await new Promise((r) => setTimeout(r, 5))
      const status = host.querySelector<HTMLElement>('.builder-palette__status')
      const error = host.querySelector<HTMLElement>('.builder-modal__error')
      if ((status && !status.hidden) || (error && !error.hidden)) return
    }
    throw new Error('the write never reported')
  }

  const statusText = () => host.querySelector<HTMLElement>('.builder-palette__status')?.textContent ?? ''
  const errorText = () => {
    const el = host.querySelector<HTMLElement>('.builder-modal__error')
    return el && !el.hidden ? (el.textContent ?? '') : ''
  }

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req133-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
    cmdNew('blank', { cwd })
    builder = await startBuilder({ cwd })
    unbindFetch = bindFetch(builder.url)
  }, 240000)

  afterAll(async () => {
    unbindFetch?.()
    await builder?.close()
    fs.rmSync(cwd, { recursive: true, force: true })
  })

  beforeEach(() => {
    document.body.replaceChildren()
    host = document.createElement('div')
    document.body.append(host)
  })

  // ── AC-1, AC-3: what the surface shows ─────────────────────────────────────

  it('test_UAT_FC_REQ_133_shows_every_color_with_what_it_costs_to_change', async () => {
    const answer = open('acme')
    await settled()

    // Every entry, including the unreferenced one — zero is the count the delete
    // rule is entirely about, so it is the one that must be reportable.
    expect(swatchText()).toEqual([
      { name: 'primary', count: 'used 3×', chip: 'rgb(46, 134, 163)' },
      { name: 'spare', count: 'used 0×', chip: 'rgb(123, 63, 97)' },
      { name: 'surface', count: 'used 1×', chip: 'rgb(255, 254, 248)' },
      { name: 'text', count: 'used 1×', chip: 'rgb(31, 41, 55)' },
    ])

    // `primary` is used three times at three different positions in its family.
    // A census that counted only unshaded references would say 1 here, and a
    // rename built on that census would orphan the other two.
    expect(swatchText()[0].count).toBe('used 3×')

    clickButton('Close')
    expect(await answer).toBeNull()
  })

  it('test_UAT_FC_REQ_133_shade_slider_is_continuous_over_the_declared_range', async () => {
    const answer = open('acme')
    await settled()
    // No entry selected, no detail: a slider relative to nothing is meaningless.
    expect(host.querySelector('.builder-palette__shade')).toBeNull()

    select('primary')
    const slider = host.querySelector<HTMLInputElement>('.builder-palette__shade')!
    // The control's range IS REQ-137's axis: a signed scalar on [-1, +1],
    // continuous rather than a set of named stops.
    expect(slider.type).toBe('range')
    expect([slider.min, slider.max]).toEqual(['-1', '1'])
    expect(Number(slider.step)).toBeLessThanOrEqual(0.001)
    expect(slider.value).toBe('0')

    // And it previews through the renderer's own arithmetic, so the swatch is
    // the color the page will paint rather than a second opinion about it.
    slider.value = String(DARKER)
    slider.dispatchEvent(new Event('input', { bubbles: true }))
    const expected = shadeHex(PALETTE.primary.value, DARKER)
    expect(host.querySelector('.builder-palette__readout')!.textContent).toBe(expected)

    clickButton('Close')
    await answer
  })

  // ── AC-2: an empty palette is a state, not a fault ─────────────────────────

  it('test_UAT_FC_REQ_133_an_empty_palette_invites_a_first_color', async () => {
    const answer = open('blank')
    await settled()
    expect(swatches()).toHaveLength(0)
    expect(host.querySelector('.builder-palette__empty')!.textContent).toMatch(/no colors yet/i)
    // The add form is present regardless — on an empty palette it is the whole
    // of the surface, which is what makes "add one" an offer rather than advice.
    expect(host.querySelector('.builder-palette__new-name')).not.toBeNull()

    clickButton('Close')
    expect(await answer).toBeNull()
  })

  // ── AC-4: picking returns a reference, never a hex ─────────────────────────

  it('test_UAT_FC_REQ_133_picking_resolves_to_a_reference_and_cancelling_to_nothing', async () => {
    const picked = open('acme', { mode: 'pick' })
    await settled()
    select('primary')
    const slider = host.querySelector<HTMLInputElement>('.builder-palette__shade')!
    slider.value = String(LIGHTER)
    slider.dispatchEvent(new Event('input', { bubbles: true }))
    clickButton('Use this color')

    // A REFERENCE. Never a hex — the caller writes this into an axis, and a
    // literal there would be a color that stops following its entry.
    expect(await picked).toEqual({ ref: 'primary', shade: LIGHTER })

    // Zero omits the key rather than sending `shade: 0`: they resolve
    // identically, and an absent shade is the reference a literal converts to
    // byte-for-byte.
    const plain = open('acme', { mode: 'pick' })
    await settled()
    select('text')
    clickButton('Use this color')
    expect(await plain).toEqual({ ref: 'text' })

    // Cancelling answers nothing and changes nothing.
    const before = readSite(cwd, 'acme')
    const cancelled = open('acme', { mode: 'pick' })
    await settled()
    select('primary')
    clickButton('Cancel')
    expect(await cancelled).toBeNull()
    expect(readSite(cwd, 'acme')).toEqual(before)
  })

  // ── AC-5: one edit, every use, every shade ────────────────────────────────

  it('test_UAT_FC_REQ_133_changing_a_color_repaints_every_use_at_every_shade', async () => {
    const slug = 'repaint'
    cmdNew(slug, { cwd })
    seedSite(cwd, slug)

    const before = await renderedDraft(cwd, slug)
    for (const shade of [0, DARKER, LIGHTER]) {
      expect(before).toContain(shadeHex(PALETTE.primary.value, shade))
    }

    const answer = open(slug)
    await settled()
    select('primary')
    const hexText = host.querySelector<HTMLInputElement>('.builder-palette__hex-text')!
    hexText.value = '#a33b12'
    hexText.dispatchEvent(new Event('input', { bubbles: true }))
    clickButton('Change color')
    await written()
    expect(statusText()).toMatch(/3 uses repainted/)

    const after = await renderedDraft(cwd, slug)
    // THE WHOLE FAMILY MOVED. The shaded uses are the ones that could have been
    // left behind — under the named-step model they were three unrelated stored
    // hexes, and changing the base left two of them at the old color.
    for (const shade of [0, DARKER, LIGHTER]) {
      expect(after).toContain(shadeHex('#a33b12', shade))
      expect(after).not.toContain(shadeHex(PALETTE.primary.value, shade))
    }
    // And nothing else moved: the other entries paint exactly as they did.
    expect(after).toContain(PALETTE.text.value)

    clickButton('Close')
    await answer
  })

  // ── AC-6: adding ───────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ_133_adding_a_color_makes_it_pickable_and_refuses_a_bad_name', async () => {
    const slug = 'adding'
    cmdNew(slug, { cwd })
    seedSite(cwd, slug)

    const answer = open(slug)
    await settled()
    const name = host.querySelector<HTMLInputElement>('.builder-palette__new-name')!
    const hex = host.querySelector<HTMLInputElement>('.builder-palette__hex')!
    name.value = 'brand-teal'
    hex.value = '#0f766e'
    clickButton('Add color')
    await written()

    // Immediately pickable — the popup redraws from the census the write
    // returned, not from its own guess at what changed.
    expect(swatchText().map((s) => s.name)).toContain('brand-teal')
    expect(swatchText().find((s) => s.name === 'brand-teal')!.count).toBe('used 0×')
    clickButton('Close')
    await answer

    // A duplicate and a malformed name are both refused WITH THE REASON. The
    // popup shows the origin's own words; a paraphrase would drop the hint that
    // says what to do instead.
    const dup = await cli(cwd, 'palette', 'add', slug, 'brand-teal', '#123456')
    expect(dup.ok).toBe(false)
    expect(dup.error?.code).toBe('CONFLICT')
    expect(dup.error?.message).toMatch(/already has a palette color 'brand-teal'/)

    const bad = await cli(cwd, 'palette', 'add', slug, 'Brand Teal', '#123456')
    expect(bad.ok).toBe(false)
    expect(bad.error?.code).toBe('SCHEMA_INVALID')
    expect(bad.error?.hint).toMatch(/kebab-case/i)

    // An 8-digit hex is refused too: alpha is a property of a USE, and an entry
    // carrying it would make one conceptual color occupy N entries.
    const translucent = await cli(cwd, 'palette', 'add', slug, 'ghost', '#12345680')
    expect(translucent.ok).toBe(false)
    expect(translucent.error?.code).toBe('SCHEMA_INVALID')
  })

  // ── AC-7: restricted delete, enforced where it counts ─────────────────────

  it('test_UAT_FC_REQ_133_delete_is_refused_while_anything_uses_it', async () => {
    const slug = 'deleting'
    cmdNew(slug, { cwd })
    seedSite(cwd, slug)

    const answer = open(slug)
    await settled()

    // The unused entry deletes.
    select('spare')
    clickButton('Delete')
    await written()
    expect(statusText()).toMatch(/Deleted spare/)
    expect(swatchText().map((s) => s.name)).not.toContain('spare')

    // A referenced one does not, and the popup says why rather than simply
    // failing — the count IS the explanation.
    select('primary')
    const del = [...host.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent === 'Delete',
    )!
    expect(del.disabled).toBe(true)
    expect(del.parentElement!.querySelector('.builder-palette__note')!.textContent).toMatch(
      /used 3× — ask the assistant/,
    )
    clickButton('Close')
    await answer

    // AND THE GUARD IS THE ORIGIN'S. Posted directly, exactly as a tab left open
    // while the site changed underneath it would post — a disabled button is an
    // explanation, never the rule.
    const stale = await fetch(origin('/api/palette'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, op: 'rm', name: 'primary' }),
    })
    expect(stale.status).toBe(400)
    const body = (await stale.json()) as { code?: string; message?: string }
    expect(body.code).toBe('CONFLICT')
    expect(body.message).toMatch(/used 3 times and cannot be deleted/)

    // Nothing moved, and there is no force flag to move it with.
    expect(Object.keys(readSite(cwd, slug).palette as object)).toContain('primary')
    const forced = await cli(cwd, 'palette', 'rm', slug, 'primary', '--force')
    expect(forced.ok).toBe(false)
  })

  // ── AC-8, AC-10: rename is total ───────────────────────────────────────────

  it('test_UAT_FC_REQ_133_rename_moves_the_key_and_every_reference_in_one_write', async () => {
    const slug = 'renaming'
    cmdNew(slug, { cwd })
    seedSite(cwd, slug)
    const before = await renderedDraft(cwd, slug)

    const answer = open(slug)
    await settled()
    select('primary')

    // THE COUNT THE POPUP SHOWS, read from the surface before the write.
    const renameField = host.querySelector<HTMLInputElement>('.builder-palette__rename')!
    const shown = renameField.parentElement!.querySelector('.builder-palette__note')!.textContent
    expect(shown).toBe('renames 3 uses')

    renameField.value = 'brand'
    clickButton('Rename')
    await written()

    // ...and the count the write reports. Same number because it is the same
    // walk — a site with references at three different shades is where two
    // hand-kept traversals would disagree.
    expect(statusText()).toMatch(/3 references rewritten/)

    // The key moved, and NOTHING is left pointing at the old name — anywhere.
    const site = readSite(cwd, slug)
    expect(Object.keys(site.palette as object)).toContain('brand')
    expect(Object.keys(site.palette as object)).not.toContain('primary')
    expect(readHome(cwd, slug)).not.toMatch(/"ref":\s*"primary"/)
    expect((readHome(cwd, slug).match(/"ref":\s*"brand"/g) ?? []).length).toBe(3)

    // A rename is a rename: the site still validates, and it renders
    // BYTE-IDENTICALLY. Nothing about how it looks was supposed to change.
    expect(await renderedDraft(cwd, slug)).toBe(before)

    // The shades came with it, at exactly the positions they had. Only `ref`
    // moves — a shade is a property of the use and says nothing about which
    // entry it names.
    const home = JSON.parse(readHome(cwd, slug))
    const shades = (home.l1.root.children as { axes?: { color?: { ref: string; shade?: number } } }[])
      .map((c) => c.axes?.color)
      .filter((c) => c?.ref === 'brand')
      .map((c) => c!.shade)
    expect(shades).toEqual([undefined, DARKER, LIGHTER])

    clickButton('Close')
    await answer
  })

  // ── AC-9: rename's refusals ────────────────────────────────────────────────

  it('test_UAT_FC_REQ_133_rename_is_refused_on_a_collision_or_a_bad_name', async () => {
    const slug = 'rename-guard'
    cmdNew(slug, { cwd })
    seedSite(cwd, slug)
    const siteBefore = JSON.stringify(readSite(cwd, slug))
    const homeBefore = readHome(cwd, slug)

    // Onto an existing name — that would MERGE two colors, which has no
    // computable default and so is not a text field's decision.
    const collision = await fetch(origin('/api/palette'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, op: 'rename', name: 'primary', to: 'text' }),
    })
    expect(collision.status).toBe(400)
    expect(((await collision.json()) as { code?: string }).code).toBe('CONFLICT')

    // Onto a name the schema refuses.
    const malformed = await fetch(origin('/api/palette'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, op: 'rename', name: 'primary', to: 'Brand Teal' }),
    })
    expect(malformed.status).toBe(400)
    expect(((await malformed.json()) as { code?: string }).code).toBe('SCHEMA_INVALID')

    // NO PARTIALLY-RENAMED STATE IS REACHABLE. Both halves of a rename are
    // validated before either is written, so a refusal leaves the draft
    // byte-unchanged — the palette AND every page.
    expect(JSON.stringify(readSite(cwd, slug))).toBe(siteBefore)
    expect(readHome(cwd, slug)).toBe(homeBefore)

    // The popup surfaces the refusal in the origin's own words and stays open.
    const answer = open(slug)
    await settled()
    select('primary')
    const field = host.querySelector<HTMLInputElement>('.builder-palette__rename')!
    field.value = 'text'
    clickButton('Rename')
    await written()
    expect(errorText()).toMatch(/already has a palette color 'text'/)
    expect(errorText()).toMatch(/merge two colors/)
    expect(host.querySelector('.builder-palette__list')).not.toBeNull()

    clickButton('Close')
    await answer
  })

  // ── AC-11: one surface, two callers ────────────────────────────────────────

  it('test_UAT_FC_REQ_133_cli_and_api_expose_the_same_four_writes_and_one_read', async () => {
    const slug = 'surface'
    cmdNew(slug, { cwd })
    seedSite(cwd, slug)

    // The CLI read carries the counts.
    const read = await cli(cwd, 'palette', 'get', slug)
    expect(read.ok).toBe(true)
    expect(read.data!.entries).toEqual([
      { name: 'primary', value: '#2e86a3', count: 3 },
      { name: 'spare', value: '#7b3f61', count: 0 },
      { name: 'surface', value: '#fffef8', count: 1 },
      { name: 'text', value: '#1f2937', count: 1 },
    ])

    // All four writes, through the CLI.
    expect((await cli(cwd, 'palette', 'add', slug, 'accent', '#8b5c2a')).ok).toBe(true)
    expect((await cli(cwd, 'palette', 'set', slug, 'accent', '#7a4f24')).ok).toBe(true)
    expect((await cli(cwd, 'palette', 'rename', slug, 'accent', 'highlight')).ok).toBe(true)
    expect((await cli(cwd, 'palette', 'rm', slug, 'highlight')).ok).toBe(true)
    expect(Object.keys(readSite(cwd, slug).palette as object)).toEqual([
      'primary',
      'text',
      'surface',
      'spare',
    ])

    // The route answers with the SAME data — it is a transport over the same
    // functions, not a parallel implementation.
    const viaHttp = await (await fetch(origin(`/api/palette?slug=${slug}`))).json()
    expect(viaHttp).toEqual((await cli(cwd, 'palette', 'get', slug)).data)

    // And it refuses a verb it does not have, rather than failing as a 500.
    const unknown = await fetch(origin('/api/palette'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, op: 'merge', name: 'primary' }),
    })
    expect(unknown.status).toBe(400)
  })

  // ── AC-12: nothing to keep in step ─────────────────────────────────────────

  it('test_UAT_FC_REQ_133_a_write_needs_no_re_render_because_channels_render_on_request', async () => {
    const slug = 'fresh'
    cmdNew(slug, { cwd })
    seedSite(cwd, slug)

    const write = await cli(cwd, 'palette', 'set', slug, 'primary', '#123456')
    expect(write.ok).toBe(true)

    // REQ-119 — `draft` and `edit` are rendered AT REQUEST TIME, so the very
    // next fetch of either carries the new color. The write does not
    // re-render, and it does not have to: there is no artifact left for it to
    // keep in step, which is why AC-12 is this rather than "both channels were
    // re-rendered before the answer".
    for (const channel of ['draft', 'edit']) {
      const html = await (await fetch(origin(`/preview/${slug}/${channel}/`))).text()
      expect(html).toContain(shadeHex('#123456', DARKER))
      expect(html).not.toContain(PALETTE.primary.value)
    }
  })

  // ── AC-13: free hex lives here and only here ──────────────────────────────

  it('test_UAT_FC_REQ_133_no_segment_field_accepts_a_free_hex', async () => {
    // The segment modal's controls come from `copyFieldsOf`, and its descriptor
    // vocabulary has no free-color control in it: every field is a string of
    // words, a bounded number, a bit, or one of a closed option list. So the
    // exposure rule holds by TYPE — inventing a color from a segment is not
    // something the surface can express, rather than something it declines.
    const painted: L1Node = {
      kind: 'text',
      text: 'Painted.',
      axes: { color: { ref: 'primary' }, fontSizePx: 18 },
    }
    const derived = copyFieldsOf(painted, {})
    for (const field of derived.fields) {
      expect(['string', 'integer', 'boolean', 'enum']).toContain(field.type)
      if (field.type === 'enum') expect(Array.isArray(field.enum)).toBe(true)
    }
    // And no value it reports is a hex the operator could have typed.
    for (const value of Object.values(derived.values)) {
      expect(String(value)).not.toMatch(/^#[0-9a-fA-F]{3,8}$/)
    }
  })

  // ── the toolbar's entry point (AC-1's opener) ─────────────────────────────

  it('test_UAT_FC_REQ_133_the_toolbar_action_opens_the_popup_for_the_shown_site', async () => {
    // One more action spec, not a branch: `create` is handed the panel and
    // returns a control, exactly as every other toolbar action does.
    const opened: string[] = []
    const spec = colorsAction((slug: string) => {
      opened.push(slug)
      return Promise.resolve(null)
    })
    expect(spec.id).toBe('colors')

    const button = spec.create({ panel: { getSite: () => 'acme' } })
    expect(button.textContent).toBe('Colors')
    button.click()
    expect(opened).toEqual(['acme'])

    // No site shown, nothing to open — a popup bound to no site could only ask
    // the origin about `undefined`.
    const idle = colorsAction((slug: string) => {
      opened.push(slug)
      return Promise.resolve(null)
    }).create({ panel: { getSite: () => null } })
    idle.click()
    expect(opened).toEqual(['acme'])
  })
})
