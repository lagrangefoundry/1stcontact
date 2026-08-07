import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { run } from '../tools/generate/src/cli'
import { cmdNew, cmdPublish, cmdRender, startBuilder } from '../tools/generate/src/cli'
import type { BuilderHandle } from '../tools/generate/src/cli'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * story-37a3921b — **the write path for a copy edit**: one addressing scheme,
 * one validator, one atomicity rule and one refusal shape, shared between the
 * operator editing in the builder and the AI editing on request.
 *
 * Every UAT here drives a real entry point and reads a real observable:
 *
 * - the **command line** through `run(argv)` — argv in, an `{ok,data}` /
 *   `{ok,error}` envelope and a process exit code out, exactly what an editor
 *   host or an AI tool call gets;
 * - the **builder origin** over HTTP through `startBuilder`, so AC-992's "the
 *   same surface, not a parallel implementation" is asserted about bytes on the
 *   wire rather than about a shared import;
 * - the **bytes on disk** — the draft page document and the rendered channels —
 *   for every claim about what an edit did or did not change.
 *
 * Nothing internal is stubbed. The only fixtures are a throwaway store per test
 * and the seeded page below.
 */

/** A short single-line run: one line of copy, no multi-line control wanted. */
const SHORT_COPY = 'A painted band.'
/** A run far wider than its box — the story's "copy that no longer fits". */
const LONG_COPY =
  'A headline long enough that the box it was authored for cannot hold it, which is accepted: the user gets the words they asked for and tidies the layout afterwards.'
/** Short, but broken across lines — the other trigger for the multi-line control. */
const MULTILINE_COPY = 'Line one.\nLine two.'
/** Copy inside a REPEATED module slot (one subtree per item). */
const SLIDE_ONE = 'The first slide.'
/** Copy inside a SINGLE-subtree module slot. */
const FORM_INTRO = 'Tell us what you are building.'

// Addresses, as the edit render stamps them (`data-l1-path`).
const A_CONTAINER = '0.0' // a painted container — a region with nothing editable
const A_SHORT = '0.0.0'
const A_LONG = '0.0.1'
const A_MULTILINE = '0.0.2'
const A_IMAGE = '0.1'
const A_MODULE = '0.2' // the carousel instance's region in the page's own layout
/** Rooted in the carousel instance's repeated `slide` slot. */
const A_SLIDE = '0'
/** Rooted in the contact form's single-subtree `form` slot. */
const A_FORM_INTRO = '0.0'

const homeJsonPath = (cwd: string, slug: string): string =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')

/**
 * One page carrying every case this surface has to answer for: copy nested
 * inside a painted container, a run wider than its box, a short run broken by a
 * newline, regions with no editable copy at all (an image, a container, a module
 * instance), and copy inside BOTH shapes of behavior-module slot — a repeated
 * one (carousel slides) and a single subtree (the contact form's presentation).
 */
function seedPage(cwd: string, slug: string): void {
  const homePath = homeJsonPath(cwd, slug)
  const home = JSON.parse(readFileSync(homePath, 'utf8'))

  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      // [0.0] a PAINTED container — a region in its own right, with no copy.
      {
        kind: 'container',
        layout: 'stack',
        axes: { surfaceFill: '#101822' },
        children: [
          { kind: 'text', text: SHORT_COPY, axes: { fontSizePx: 32 } }, // [0.0.0]
          { kind: 'text', text: LONG_COPY, axes: { fontSizePx: 18 } }, // [0.0.1]
          { kind: 'text', text: MULTILINE_COPY, axes: { fontSizePx: 18 } }, // [0.0.2]
        ],
      },
      // [0.1] an image — a real region exposing no phase-1 copy.
      { kind: 'image', src: 'assets/hero.jpg', alt: 'A hero image' },
      // [0.2] / [0.3] the seams the two behavior modules mount into.
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

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string; path?: string; hint?: string }
  exitCode: number
  /** Everything the command printed, in order — the human report when not `--json`. */
  output: string
}

/**
 * Drive the real `1c` entry point. `run` reads the working directory from the
 * process, so the test supplies one the way a shell would, and restores it —
 * along with the exit code the command set — before returning.
 */
async function invoke(cwd: string, argv: string[], json: boolean): Promise<CliResult> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const out: string[] = []
  process.chdir(cwd)
  process.exitCode = 0
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run(json ? [...argv, '--json'] : argv)
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
  }
  const exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0
  process.exitCode = 0
  const output = out.join('\n')
  if (!json) return { ok: exitCode === 0, exitCode, output }
  const envelope = JSON.parse(out[out.length - 1]) as Omit<CliResult, 'exitCode' | 'output'>
  return { ...envelope, exitCode, output }
}

/** The machine-readable invocation — the shape an AI or an editor host drives. */
const cli = (cwd: string, ...argv: string[]): Promise<CliResult> => invoke(cwd, argv, true)
/** The same command in its human report mode. */
const cliHuman = (cwd: string, ...argv: string[]): Promise<CliResult> => invoke(cwd, argv, false)

/** Convenience: the argv for a `copy set` with a JSON change map. */
function setArgs(addr: string, values: unknown, scope?: { module: string; slot?: string }): string[] {
  return [
    'copy',
    'set',
    'acme',
    'home',
    addr,
    ...(scope ? ['--module', scope.module] : []),
    ...(scope?.slot ? ['--slot', scope.slot] : []),
    '--values',
    JSON.stringify(values),
  ]
}

/** The draft page document, byte for byte — the thing a failed edit must not touch. */
const draftBytes = (cwd: string): string => readFileSync(homeJsonPath(cwd, 'acme'), 'utf8')

/** A rendered channel's document, straight off disk — no re-render. */
const renderedBytes = (cwd: string, channel: 'edit' | 'draft'): string =>
  readFileSync(path.join(cwd, 'storage', 'dist', 'sites', 'acme', channel, 'index.html'), 'utf8')

/** The current text of the addressed run, read out of the draft definition. */
function draftText(cwd: string, indices: number[]): string {
  const page = JSON.parse(draftBytes(cwd))
  let node = page.l1.root as Record<string, unknown>
  for (const i of indices.slice(1)) node = (node.children as Record<string, unknown>[])[i]
  return node.text as string
}

describe('story-37a3921b — the copy-edit write path', () => {
  let cwd: string

  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'story-37a3921b-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  // ── reading a region ───────────────────────────────────────────────────────

  it('test_UAT_AC980_a_copy_region_exposes_one_plain_string_field_holding_the_draft_words', async () => {
    // AC-980 — one field, plain-string, human label, the run's exact text. The
    // multi-line control is requested for a run that would not fit a single-line
    // one (long OR broken by a newline) and not otherwise.
    const short = await cli(cwd, 'copy', 'get', 'acme', 'home', A_SHORT)
    expect(short.ok).toBe(true)
    expect(short.data!.fields).toEqual([{ name: 'text', label: 'Text', type: 'string' }])
    // Character-for-character what stands in the draft, not a rendering of it.
    expect((short.data!.values as Record<string, string>).text).toBe(draftText(cwd, [0, 0, 0]))
    expect((short.data!.values as Record<string, string>).text).toBe(SHORT_COPY)

    for (const [addr, copy] of [
      [A_LONG, LONG_COPY],
      [A_MULTILINE, MULTILINE_COPY],
    ] as const) {
      const got = await cli(cwd, 'copy', 'get', 'acme', 'home', addr)
      expect(got.ok, addr).toBe(true)
      expect(got.data!.fields, addr).toEqual([
        { name: 'text', label: 'Text', type: 'string', widget: 'textarea' },
      ])
      expect((got.data!.values as Record<string, string>).text, addr).toBe(copy)
    }
  })

  it('test_UAT_AC981_a_region_with_nothing_editable_succeeds_with_an_empty_field_list', async () => {
    // AC-981 — "there is nothing to edit here" is a property of the region,
    // answered once, not a failure every caller has to special-case.
    //
    // WHICH regions those are is the derivation's to decide, not the caller's: a
    // painted container and a behavior-module instance expose nothing in phase 1.
    // An image is NOT one of them — it exposes which image goes there and its alt
    // text (REQ-118) — which is why it appears below as a contrast, not here.
    for (const addr of [A_CONTAINER, A_MODULE]) {
      const got = await cli(cwd, 'copy', 'get', 'acme', 'home', addr)
      expect(got.ok, addr).toBe(true)
      expect(got.exitCode, addr).toBe(0)
      expect(got.data!.fields, addr).toEqual([])
      expect(got.error, addr).toBeUndefined()

      // And it SAYS so, rather than reporting an absence the host has to read
      // as an error.
      const human = await cliHuman(cwd, 'copy', 'get', 'acme', 'home', addr)
      expect(human.exitCode, addr).toBe(0)
      expect(human.output, addr).toContain('no editable copy')
    }

    // The contrast that makes the empty list meaningful: read the same way, on
    // the same page, a copy region returns exactly one field...
    const copy = await cli(cwd, 'copy', 'get', 'acme', 'home', A_SHORT)
    expect((copy.data!.fields as unknown[]).length).toBe(1)

    // ...and an image region returns exactly two — which image goes there, and
    // its alt text. An empty list is therefore an answer about THAT region, not
    // the surface's standing answer for anything that is not copy.
    const image = await cli(cwd, 'copy', 'get', 'acme', 'home', A_IMAGE)
    expect(image.ok).toBe(true)
    const imageFields = image.data!.fields as Array<{
      name: string
      type: string
      enum?: string[]
    }>
    expect(imageFields.map((f) => f.name)).toEqual(['src', 'alt'])
    expect(imageFields.map((f) => f.type)).toEqual(['enum', 'string'])
    // The picker always offers the handle the node points at now, so a user who
    // opens the form to change only the alt text cannot swap the image by saving.
    expect(imageFields[0].enum).toContain('assets/hero.jpg')
    expect(image.data!.values).toEqual({ src: 'assets/hero.jpg', alt: 'A hero image' })
  })

  // ── writing ────────────────────────────────────────────────────────────────

  it('test_UAT_AC982_saving_new_words_updates_the_draft_and_re_renders_the_page', async () => {
    // AC-982 — the loop closes inside one operation: the draft holds the new
    // words and the rendered page shows them, with no further manual step.
    const saved = await cli(cwd, ...setArgs(A_SHORT, { text: 'A repainted band.' }))
    expect(saved.ok).toBe(true)
    // It reports WHAT changed and WHERE the re-render landed.
    expect(saved.data!.changed).toEqual(['text'])
    expect(typeof saved.data!.rendered).toBe('string')

    expect(draftText(cwd, [0, 0, 0])).toBe('A repainted band.')
    const html = readFileSync(path.join(String(saved.data!.rendered), 'index.html'), 'utf8')
    expect(html).toContain('A repainted band.')
    expect(html).not.toContain(SHORT_COPY)

    // Re-submitting the value it already holds succeeds and says so explicitly,
    // rather than manufacturing a change.
    const again = await cli(cwd, ...setArgs(A_SHORT, { text: 'A repainted band.' }))
    expect(again.ok).toBe(true)
    expect(again.exitCode).toBe(0)
    expect(again.data!.changed).toEqual([])
    const humanAgain = await cliHuman(cwd, ...setArgs(A_SHORT, { text: 'A repainted band.' }))
    expect(humanAgain.output).toContain('No change')
  })

  it('test_UAT_AC983_a_change_map_is_applied_whole_or_not_at_all', async () => {
    // AC-983 — one save is one change. A published base gives `status` something
    // to diff against, so "how many files did this save move?" has an answer.
    await cmdPublish('acme', { cwd, message: 'base' })
    expect((await cli(cwd, 'status', 'acme')).data!.modified).toEqual([])

    // First entry valid, second not. Neither may land.
    const mixed = await cli(
      cwd,
      ...setArgs(A_SHORT, { text: 'Applied?', headline: 'Also applied?' }),
    )
    expect(mixed.ok).toBe(false)
    expect(draftText(cwd, [0, 0, 0])).toBe(SHORT_COPY)
    const afterFail = await cli(cwd, 'status', 'acme')
    expect(afterFail.data!.modified).toEqual([])
    expect(afterFail.data!.added).toEqual([])
    expect(afterFail.data!.removed).toEqual([])

    // A well-formed map moves exactly one page document.
    const ok = await cli(cwd, ...setArgs(A_SHORT, { text: 'Applied.' }))
    expect(ok.ok).toBe(true)
    const after = await cli(cwd, 'status', 'acme')
    expect(after.data!.modified).toEqual(['pages/home.json'])
    expect(after.data!.added).toEqual([])
    expect(after.data!.removed).toEqual([])
  })

  it('test_UAT_AC984_a_rejected_edit_leaves_the_draft_and_the_render_byte_identical', async () => {
    // AC-984 — the guarantee that makes "show the error and carry on" safe: the
    // page the operator is looking at is still accurate.
    await cmdRender('acme', { cwd, edit: true })
    const draftBefore = draftBytes(cwd)
    const renderBefore = renderedBytes(cwd, 'edit')

    const rejections: Array<[string, string[]]> = [
      // An address that resolves to no region.
      ['unaddressable', setArgs('0.9.9', { text: 'x' })],
      // An address that is not an address at all.
      ['malformed', setArgs('nought.point.nought', { text: 'x' })],
      // A value that is not text.
      ['unacceptable value', setArgs(A_SHORT, { text: 42 })],
      // A field the region does not expose.
      ['unknown field', setArgs(A_SHORT, { headline: 'x' })],
    ]
    for (const [label, argv] of rejections) {
      const result = await cli(cwd, ...argv)
      expect(result.ok, label).toBe(false)
      // Byte-for-byte, read straight off disk — no re-render happened either.
      expect(draftBytes(cwd), label).toBe(draftBefore)
      expect(renderedBytes(cwd, 'edit'), label).toBe(renderBefore)
    }

    // The fourth class: a definition that fails validation. The violation is
    // itself a write, so the snapshot is taken after it.
    const page = JSON.parse(draftBytes(cwd))
    page.l1.root.children[0].children[1].axes.fontSizePx = 9999
    writeFileSync(homeJsonPath(cwd, 'acme'), JSON.stringify(page, null, 2))
    const draftBroken = draftBytes(cwd)
    const renderBroken = renderedBytes(cwd, 'edit')

    const invalid = await cli(cwd, ...setArgs(A_SHORT, { text: 'Never lands.' }))
    expect(invalid.ok).toBe(false)
    expect(draftBytes(cwd)).toBe(draftBroken)
    expect(renderedBytes(cwd, 'edit')).toBe(renderBroken)
  })

  // ── refusing ───────────────────────────────────────────────────────────────

  it('test_UAT_AC985_a_refusal_carries_a_code_a_path_and_a_hint_with_a_failing_exit_status', async () => {
    // AC-985 — a refusal is structured, not prose: a caller branches on it.
    const rejected = await cli(cwd, ...setArgs(A_SHORT, { text: 42 }))
    expect(rejected.ok).toBe(false)
    expect(rejected.error!.code).toBeTruthy()
    expect(rejected.error!.code).toBe('SCHEMA_INVALID')
    // The path identifies the offending region AND field, not just "somewhere".
    expect(rejected.error!.path).toContain(A_SHORT)
    expect(rejected.error!.path).toContain('text')
    // The hint names the concrete next action.
    expect(rejected.error!.hint).toBeTruthy()
    expect(rejected.error!.hint).toContain('copy get')
    expect(rejected.exitCode).not.toBe(0)
    expect(rejected.exitCode).toBe(2)

    // And the success side of the same contract.
    const ok = await cli(cwd, ...setArgs(A_SHORT, { text: 'Accepted.' }))
    expect(ok.ok).toBe(true)
    expect(ok.error).toBeUndefined()
    expect(ok.data).toBeTruthy()
    expect(ok.exitCode).toBe(0)
  })

  it('test_UAT_AC986_a_copy_edit_is_validated_over_the_whole_resulting_definition', async () => {
    // AC-986 — asserted by CONSEQUENCE, not by inspection: break a part of the
    // page the edit does not touch, past what only whole-definition validation
    // sees, and the copy edit refuses for exactly the reason another structured
    // edit on the same site does. 9999px clears the schema's shape check and
    // fails the L1 envelope's range, so only `validateL1` over the document
    // catches it.
    const page = JSON.parse(draftBytes(cwd))
    page.l1.root.children[0].children[1].axes.fontSizePx = 9999
    writeFileSync(homeJsonPath(cwd, 'acme'), JSON.stringify(page, null, 2))
    const before = draftBytes(cwd)

    // The edit touches [0.0.0]; the violation is at [0.0.1].
    const copy = await cli(cwd, ...setArgs(A_SHORT, { text: 'Untouched by this attempt.' }))
    const other = await cli(cwd, 'config', 'set', 'acme', 'displayName', 'Acme')

    for (const [label, result] of [
      ['copy set', copy],
      ['config set', other],
    ] as const) {
      expect(result.ok, label).toBe(false)
      expect(result.error!.message, label).toContain('fontSizePx')
    }
    // The same validator, so the same fault — code, message and path alike.
    expect(copy.error!.code).toBe(other.error!.code)
    expect(copy.error!.message).toBe(other.error!.message)
    expect(copy.error!.path).toBe(other.error!.path)

    expect(draftBytes(cwd)).toBe(before)
  })

  it('test_UAT_AC987_a_malformed_address_is_refused_outright_and_never_coerced', async () => {
    // AC-987 — reading an address is untrusted input. A malformed one must fail
    // closed: coercing or truncating it would write the right words into the
    // wrong place.
    const before = draftBytes(cwd)
    // Not `-1`: a leading dash is a flag to any argv parser, so it never reaches
    // the address rule and would prove nothing about it.
    const malformed = ['nought', '0.x', '0..1', '0.', '.0', 'one.two', '0,0', '1e1', '0.-1']

    for (const addr of malformed) {
      const read = await cli(cwd, 'copy', 'get', 'acme', 'home', addr)
      expect(read.ok, `get ${addr}`).toBe(false)
      expect(read.exitCode, `get ${addr}`).not.toBe(0)
      // Refused, not resolved: no region's fields or values came back.
      expect(read.data, `get ${addr}`).toBeUndefined()
      // The fault names the address it refused.
      expect(read.error!.code, `get ${addr}`).toBe('SCHEMA_INVALID')
      expect(read.error!.path, `get ${addr}`).toBe(addr)
      expect(read.error!.message, `get ${addr}`).toContain(addr)

      const write = await cli(cwd, ...setArgs(addr, { text: 'never' }))
      expect(write.ok, `set ${addr}`).toBe(false)
      expect(draftBytes(cwd), `set ${addr}`).toBe(before)
    }

    // An empty address is refused too — it is simply refused before the address
    // rule sees it, as a missing argument rather than a malformed one.
    const empty = await cli(cwd, 'copy', 'get', 'acme', 'home', '')
    expect(empty.ok).toBe(false)
    expect(empty.exitCode).not.toBe(0)

    // Well-formed, but names no region in this page: not-found, with the hint
    // that says addresses belong to a rendering and should be re-read.
    for (const addr of ['9', '0.9.9', '0.0.0.0']) {
      const beyond = await cli(cwd, 'copy', 'get', 'acme', 'home', addr)
      expect(beyond.ok, addr).toBe(false)
      expect(beyond.error!.code, addr).toBe('NOT_FOUND')
      expect(beyond.error!.hint, addr).toMatch(/re-read|render/i)
      expect(beyond.data, addr).toBeUndefined()
    }
    expect(draftBytes(cwd)).toBe(before)
  })

  it('test_UAT_AC988_an_unknown_field_or_a_non_text_value_is_refused_not_ignored', async () => {
    // AC-988 — every entry is checked before any is applied. A map naming a
    // field this region does not expose means the caller resolved against a
    // different region than it is writing to, so dropping it silently would
    // land a partial edit.
    const before = draftBytes(cwd)

    const unknown = await cli(cwd, ...setArgs(A_SHORT, { headline: 'Not a field here.' }))
    expect(unknown.ok).toBe(false)
    // The offending field is NAMED, so the caller can tell what it got wrong.
    expect(unknown.error!.message).toContain('headline')
    expect(unknown.error!.path).toContain('headline')
    expect(draftBytes(cwd)).toBe(before)

    // A value that is not text — a number, a list, an object, and the two other
    // JSON scalars that are not strings.
    for (const value of [42, [], {}, true, null] as unknown[]) {
      const label = JSON.stringify(value)
      const bad = await cli(cwd, ...setArgs(A_SHORT, { text: value }))
      expect(bad.ok, label).toBe(false)
      expect(bad.error!.code, label).toBe('SCHEMA_INVALID')
      expect(draftBytes(cwd), label).toBe(before)
    }

    // The region's words survived every attempt, intact.
    expect(draftText(cwd, [0, 0, 0])).toBe(SHORT_COPY)
    const still = await cli(cwd, 'copy', 'get', 'acme', 'home', A_SHORT)
    expect((still.data!.values as Record<string, string>).text).toBe(SHORT_COPY)
  })

  // ── module slots ───────────────────────────────────────────────────────────

  it('test_UAT_AC989_copy_in_a_module_slot_reads_and_writes_through_the_same_operation', async () => {
    // AC-989 — the same operations, scoped by instance and slot, for BOTH slot
    // shapes: a repeated slot holding one subtree per item (carousel slides) and
    // a single-subtree slot (the contact form's presentation).
    const cases = [
      { addr: A_SLIDE, module: 'gallery', slot: 'slide', was: SLIDE_ONE, now: 'The only slide.' },
      {
        addr: A_FORM_INTRO,
        module: 'get-in-touch',
        slot: 'form',
        was: FORM_INTRO,
        now: 'Say hello.',
      },
    ]

    for (const c of cases) {
      const got = await cli(
        cwd,
        'copy',
        'get',
        'acme',
        'home',
        c.addr,
        '--module',
        c.module,
        '--slot',
        c.slot,
      )
      expect(got.ok, c.module).toBe(true)
      expect(got.data!.values, c.module).toEqual({ text: c.was })

      const saved = await cli(cwd, ...setArgs(c.addr, { text: c.now }, c))
      expect(saved.ok, c.module).toBe(true)
      const html = readFileSync(path.join(String(saved.data!.rendered), 'index.html'), 'utf8')
      expect(html, c.module).toContain(c.now)
      expect(html, c.module).not.toContain(c.was)
    }

    // Instance-rooted and page-rooted addresses reuse the same short forms, so
    // an address rooted in an instance that names no slot is ambiguous — and is
    // refused rather than guessed at.
    const noSlot = await cli(cwd, 'copy', 'get', 'acme', 'home', A_SLIDE, '--module', 'gallery')
    expect(noSlot.ok).toBe(false)
    expect(noSlot.error!.code).toBe('SCHEMA_INVALID')
    expect(noSlot.error!.message).toMatch(/slot/i)
  })

  // ── the shape of the surface ───────────────────────────────────────────────

  it('test_UAT_AC990_copy_longer_than_its_box_reads_back_in_full', async () => {
    // AC-990 — overflowing copy is accepted, and the guard is that the user can
    // always see what they typed: the whole string comes back, and the control
    // able to display it is requested.
    const overflowing = `${LONG_COPY} And then it got longer still, well past anything the authored box was ever going to hold.`
    const saved = await cli(cwd, ...setArgs(A_LONG, { text: overflowing }))
    expect(saved.ok).toBe(true)

    const reopened = await cli(cwd, 'copy', 'get', 'acme', 'home', A_LONG)
    const value = (reopened.data!.values as Record<string, string>).text
    // The ENTIRE string — not truncated, elided or clipped.
    expect(value).toBe(overflowing)
    expect(value.length).toBe(overflowing.length)
    expect(reopened.data!.fields).toEqual([
      { name: 'text', label: 'Text', type: 'string', widget: 'textarea' },
    ])
  })

  it('test_UAT_AC991_markup_saved_as_text_stays_literal_and_every_field_is_plain_text_or_a_closed_list', async () => {
    // AC-991 — "there is no raw-editing mode" is a property of the surface's
    // SHAPE: there are exactly two kinds of control it can offer, a plain-text
    // one and a closed-list one, and neither can carry code.
    const { outDir } = await cmdRender('acme', { cwd, edit: true })
    const beforeDoc = new JSDOM(readFileSync(path.join(outDir, 'index.html'), 'utf8')).window
      .document
    const scriptsBefore = beforeDoc.querySelectorAll('script').length
    const stylesBefore = beforeDoc.querySelectorAll('style').length

    const payload = '<script>alert(1)</script><style>*{display:none}</style><b>bold?</b>'
    const saved = await cli(cwd, ...setArgs(A_SHORT, { text: payload }))
    expect(saved.ok).toBe(true)

    const doc = new JSDOM(readFileSync(path.join(String(saved.data!.rendered), 'index.html'), 'utf8'))
      .window.document
    // The region's LITERAL words: one leaf element whose text is the payload.
    const el = [...doc.querySelectorAll('*')].find(
      (n) => n.children.length === 0 && n.textContent === payload,
    )
    expect(el, 'the payload renders as one region\'s text').toBeTruthy()
    expect(el!.getAttribute('data-l1-segment')).toBe('copy')

    // It created no element and applied no style.
    expect(doc.querySelectorAll('script').length).toBe(scriptsBefore)
    expect(doc.querySelectorAll('style').length).toBe(stylesBefore)
    expect([...doc.querySelectorAll('script')].some((s) => s.textContent?.includes('alert(1)'))).toBe(
      false,
    )
    expect(
      [...doc.querySelectorAll('style')].some((s) => s.textContent?.includes('*{display:none}')),
    ).toBe(false)
    expect(doc.querySelector('b')).toBeNull()

    // The SAME guarantee for the surface's other plain-text field: an image's
    // alt text (REQ-118). It leaves the renderer as an ATTRIBUTE rather than as
    // a run of words, so it is a different escape path and earns its own
    // evidence rather than inheriting the one above.
    const altSaved = await cli(cwd, ...setArgs(A_IMAGE, { alt: payload }))
    expect(altSaved.ok).toBe(true)
    const altDoc = new JSDOM(
      readFileSync(path.join(String(altSaved.data!.rendered), 'index.html'), 'utf8'),
    ).window.document
    const img = altDoc.querySelector(`img[data-l1-path="${A_IMAGE}"]`)
    expect(img, 'the image region renders').toBeTruthy()
    // The literal string, whole — the markup is the alt text, not markup.
    expect(img!.getAttribute('alt')).toBe(payload)
    expect(altDoc.querySelectorAll('script').length).toBe(scriptsBefore)
    expect(altDoc.querySelectorAll('style').length).toBe(stylesBefore)
    expect(altDoc.querySelector('b')).toBeNull()

    // And no descriptor this surface emits could have carried markup as code in
    // the first place: read EVERY region the render stamps, and every offered
    // field is either a plain-text field or a closed list of values the surface
    // itself supplied.
    const pageRooted = [...doc.querySelectorAll('[data-l1-path]')]
      .filter((n) => n.closest('[data-fc-module]') === null)
      .map((n) => n.getAttribute('data-l1-path')!)
    expect(pageRooted.length).toBeGreaterThan(0)

    const reads = [
      ...pageRooted.map((addr) => ['copy', 'get', 'acme', 'home', addr]),
      ['copy', 'get', 'acme', 'home', A_SLIDE, '--module', 'gallery', '--slot', 'slide'],
      ['copy', 'get', 'acme', 'home', A_FORM_INTRO, '--module', 'get-in-touch', '--slot', 'form'],
    ]
    let fieldsSeen = 0
    let closedListsSeen = 0
    for (const argv of reads) {
      const got = await cli(cwd, ...argv)
      expect(got.ok, argv.join(' ')).toBe(true)
      for (const field of got.data!.fields as Array<{ type: string; enum?: unknown }>) {
        // Two shapes, and no third — no freeform mode, no rich-text control, no
        // escape hatch that would let markup through as code.
        expect(['string', 'enum'], argv.join(' ')).toContain(field.type)
        if (field.type === 'enum') {
          // A closed list is only NARROWER than a string if the caller is told
          // what it may return, so the options travel with the descriptor. A
          // list-typed field with no list would be a free string wearing a
          // narrower label.
          expect(Array.isArray(field.enum), argv.join(' ')).toBe(true)
          const options = field.enum as unknown[]
          expect(options.length, argv.join(' ')).toBeGreaterThan(0)
          for (const option of options) expect(typeof option, argv.join(' ')).toBe('string')
          closedListsSeen += 1
        }
        fieldsSeen += 1
      }
    }
    // The sweep actually saw fields of BOTH shapes — an all-empty page would
    // prove nothing, and an all-string one would never enter the branch above.
    expect(fieldsSeen).toBeGreaterThan(0)
    expect(closedListsSeen).toBeGreaterThan(0)
  })
})

// ── the same surface over the builder's origin ───────────────────────────────

describe('story-37a3921b — the copy-edit write path over the builder origin', () => {
  let cwd: string
  let builder: BuilderHandle

  beforeAll(async () => {
    cwd = mkdtempSync(path.join(tmpdir(), 'story-37a3921b-origin-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
    await cmdRender('acme', { cwd, edit: true })
    await cmdRender('acme', { cwd })
    builder = await startBuilder({ cwd })
  }, 120000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) rmSync(cwd, { recursive: true, force: true })
  })

  const api = (p: string, init?: RequestInit) => fetch(new URL(p, builder.url), init)
  const post = (body: unknown) =>
    api('/api/copy', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

  it('test_UAT_AC992_the_origin_is_the_same_surface_faulting_and_re_rendering_alike', async () => {
    // AC-992 — the origin is a thin transport over the same operations, so what
    // it answers matches the command line exactly.
    const read = await api(`/api/copy?slug=acme&page=home&path=${A_SHORT}`)
    expect(read.status).toBe(200)
    const readBody = (await read.json()) as Record<string, unknown>
    const fromCli = await cli(cwd, 'copy', 'get', 'acme', 'home', A_SHORT)
    expect(readBody.fields).toEqual(fromCli.data!.fields)
    expect(readBody.values).toEqual(fromCli.data!.values)
    expect(readBody.values).toEqual({ text: SHORT_COPY })

    // A rejected edit is the USER's fault, not the server's: a client-fault
    // status carrying the validator's own code, path and hint — not a generic
    // 500 that throws away the message naming the field.
    const draftBefore = draftBytes(cwd)
    const bad = await post({ slug: 'acme', page: 'home', path: A_SHORT, values: { text: 42 } })
    expect(bad.status).toBeGreaterThanOrEqual(400)
    expect(bad.status).toBeLessThan(500)
    const badBody = (await bad.json()) as Record<string, unknown>
    const cliRefusal = await cli(cwd, ...setArgs(A_SHORT, { text: 42 }))
    expect(cliRefusal.ok).toBe(false)
    expect(badBody.code).toBe(cliRefusal.error!.code)
    expect(badBody.path).toBe(cliRefusal.error!.path)
    expect(badBody.hint).toBe(cliRefusal.error!.hint)
    expect(badBody.message).toBe(cliRefusal.error!.message)
    expect(draftBytes(cwd)).toBe(draftBefore)

    // A successful save re-renders BOTH ways of viewing the page before it
    // reports success — an edit changes the page, not one rendering of it.
    const words = 'Saved through the origin.'
    const good = await post({ slug: 'acme', page: 'home', path: A_SHORT, values: { text: words } })
    expect(good.status).toBe(200)
    expect(((await good.json()) as Record<string, unknown>).changed).toEqual(['text'])

    for (const channel of ['edit', 'draft'] as const) {
      expect(renderedBytes(cwd, channel), channel).toContain(words)
      expect(renderedBytes(cwd, channel), channel).not.toContain(SHORT_COPY)
    }
  })
})
