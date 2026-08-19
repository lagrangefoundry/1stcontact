import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cmdNew } from '../tools/generate/src/cli/commands'
import { editL1Set } from '../tools/generate/src/cli/edit'
import {
  aiCore,
  auditPath,
  createL1Toolbox,
  fileAuditSink,
  l1Operations,
  nodeOperations,
  L1_DECLARATION,
  L1_INSTANCES,
  L1_SURFACE_VERSION,
} from '../tools/generate/src/cli/ai/toolbox'
import { CARETAKER_ROLE } from '../tools/generate/src/cli/ai/roles'
import type { L1Node } from '@1stcontact/site-schema'
import { fsOpts } from './support/site-factory'

/**
 * **The assistant's declared control surface** (story-93905de4).
 *
 * The contract by which anything acts on a site on someone's behalf: the
 * declaration (`l1-surface.json`), the grant that narrows it (`instances.json`),
 * effect enforcement, argument validation ahead of invocation, refusal as
 * information, provenance marking, the per-call audit trail, and the manual as a
 * projection of the first two rather than a document maintained beside them.
 *
 * Nothing here mocks `edit.ts` and nothing stubs the Toolbox. The shared artifact
 * store is a PRECONDITION — a stand-in would fork the very consumption route
 * these tests exist to cover, so failing to resolve it is an environment failure
 * and reads as one.
 */

/** The shipped declaration, located from this file rather than from the runner's cwd. */
const DECLARATION_FILE = fileURLToPath(
  new URL('../tools/generate/src/cli/ai/l1-surface.json', import.meta.url),
)

const SLUG = 'studio'
const HEADLINE = 'A painted band.'
/** The address the seeded headline sits at: root list index, then child indices. */
const HEADLINE_PATH = '0.0.0'

/** A page with copy nested inside a painted container, so an address has depth. */
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
    ],
  }
  home.l1.root = root
  home.modules = []
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

let cwd: string

function homePath(): string {
  return path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', 'home.json')
}

/** The draft's bytes — the only evidence that an all-or-nothing write is atomic. */
function draftBytes(): string {
  return readFileSync(homePath(), 'utf8')
}

function headline(): string {
  return JSON.parse(draftBytes()).l1.root.children[0].children[0].text
}

interface AuditLine {
  surface: string
  operation: string
  tool: string
  effect: string
  params: Record<string, unknown>
  policy: { decision: string; rule: string | null }
  outcome: { ok: boolean; error: string | null }
}

function auditLines(): AuditLine[] {
  const file = auditPath({ cwd })
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as AuditLine)
}

/**
 * A read's payload with its provenance markers stripped — what a *consumer* does
 * after being told the content is third-party, which is the posture under test.
 */
function unwrap(answer: string): string {
  return answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')
}

interface Toolbox {
  /**
   * `Toolbox.run` awaits what `surface.invoke` returns — REQ-142 made every L1
   * operation async, and the model's tool loop awaits the answer. So does every
   * call below.
   */
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
  toolNames: () => string[]
  manual: () => string
}

/** The builder assistant's Toolbox for the seeded site, audited to disk as the host does. */
function caretaker(): Promise<Toolbox> {
  return createL1Toolbox(SLUG, { cwd }, { audit: fileAuditSink({ cwd }), session: `site-${SLUG}` })
}

interface Operation {
  op: string
  tool: string
  effect: string
  params?: Record<string, { type: string; required?: boolean; description?: string }>
}

const operations = (): Operation[] => L1_DECLARATION.operations as Operation[]

interface Group {
  group: string
  effect: string
  title: string
  operations: string[]
}

const groups = (): Group[] => L1_DECLARATION.groups as Group[]

interface Sequence {
  name: string
  steps: string[]
  note: string
}

const sequences = (): Sequence[] => L1_DECLARATION.sequences as Sequence[]

/** The capability groups this consumer is actually granted, read from the grant. */
const grantedGroups = (): string[] =>
  (L1_INSTANCES.caretaker as { l1: { groups: string[] } }).l1.groups

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'surface-'))
  cmdNew(SLUG, { cwd })
  seedPage(cwd, SLUG)
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

describe('the assistant control surface — declared once, granted narrowly, checked, recorded', () => {
  it('test_UAT_AC1071_declaration_and_grant_check_clean_before_anything_runs', async () => {
    // The declaration and the grant are data, so the pair can be checked against
    // the declaration FORMAT at author time — before any session exists. Run
    // through the framework's own standalone validator rather than a local
    // re-reading of the format, because that is what makes the startup-failure
    // rule reachable in this repository at all.
    const { validateData } = await aiCore()

    const report = validateData([L1_DECLARATION], L1_INSTANCES)

    expect(report.problems).toEqual([])
    expect(report.ok).toBe(true)
    expect(report.surfaces).toEqual(['l1'])
    expect(report.roles).toContain(CARETAKER_ROLE)
  })

  it('test_UAT_AC1072_surface_states_its_own_version_distinct_from_the_format_version', () => {
    // Two versions that do not mean the same thing. `version` is the declaration
    // FORMAT's; a priming document, a customer-facing description or a
    // third-party consumer still needs to say which SURFACE it was written
    // against, so the surface declares its own alongside it.
    expect(L1_DECLARATION.version).toBe(1)

    expect(Number.isInteger(L1_SURFACE_VERSION)).toBe(true)
    expect(L1_SURFACE_VERSION).toBeGreaterThan(0)

    // Read FROM the declaration rather than hard-coded beside it: the shipped
    // JSON on disk is the source, so the two cannot drift apart.
    const onDisk = JSON.parse(readFileSync(DECLARATION_FILE, 'utf8')) as {
      version: number
      surface_version: number
    }
    expect(L1_SURFACE_VERSION).toBe(onDisk.surface_version)
    expect(onDisk.surface_version).not.toBe(onDisk.version)
  })

  it('test_UAT_AC1073_everything_callable_is_declared_and_the_write_set_is_closed', () => {
    // Everything callable is declared and everything declared is callable. A
    // declared operation with no method is a startup failure; a method with no
    // declaration is a capability nothing documents, validates or audits.
    const declared = operations()
      .map((o) => o.op)
      .sort()
    //
    // COMPOSED FROM BOTH HALVES since REQ-146: `l1Operations` is the
    // runtime-agnostic core and `nodeOperations` supplies the two that need a
    // disk (`add_asset` reads a file the operator names, `publish` snapshots a
    // tree). Node's surface is their union, and the union is what the
    // declaration describes — checking the core alone asserts a declared
    // operation is unimplemented, which is the opposite of the invariant.
    const acOpts = fsOpts(cwd)
    const callable = Object.keys({
      ...l1Operations(SLUG, acOpts),
      ...nodeOperations(SLUG, acOpts),
    }).sort()
    expect(callable).toEqual(declared)

    // Every operation that can change the site belongs to exactly one capability
    // group, and that group's declared effect is `write` — so a new way to change
    // a site cannot appear without being declared, classified and granted.
    const writes = operations()
      .filter((o) => o.effect === 'write')
      .map((o) => o.tool)
    for (const tool of writes) {
      const owning = groups().filter((g) => g.operations.includes(tool))
      expect(owning.map((g) => g.group), tool).toHaveLength(1)
      expect(owning[0].effect, tool).toBe('write')
    }

    // And the enumerated write set itself, so an unlisted new write fails here.
    //
    // REQ-133 added the four palette writes, in `ManagePalette` so they can be
    // granted or withheld as one. They widen the surface less than the count
    // suggests — `set_config` could already reach a palette by merge — and two
    // of them are things merge cannot express at all: removing a key and moving
    // one. Both of those carry guards stated in terms of references, which is
    // why they are operations rather than a broader `set_config`.
    expect([...writes].sort()).toEqual([
      'add_asset',
      'add_component',
      'add_page',
      'add_palette_color',
      'configure_component',
      'publish',
      'remove_asset',
      'remove_component',
      'remove_page',
      'remove_palette_color',
      'rename_palette_color',
      'set_config',
      'set_l1',
      'set_palette_color',
      'update_page',
      'write_image',
    ])

    // The reading half is classified and grouped on the same terms.
    for (const op of operations().filter((o) => o.effect === 'read')) {
      const owning = groups().filter((g) => g.operations.includes(op.tool))
      expect(owning.map((g) => g.group), op.tool).toHaveLength(1)
      expect(owning[0].effect, op.tool).toBe('read')
    }
  })

  it('test_UAT_AC1074_declared_operations_can_be_withheld_from_a_consumer', async () => {
    // Asset management and publishing ARE part of the API — declared, documented
    // and schema-checked, reachable by a differently-configured consumer.
    const declared = operations().map((o) => o.tool)
    expect(declared).toEqual(expect.arrayContaining(['add_asset', 'remove_asset', 'publish']))

    const box = await caretaker()
    const offered = box.toolNames()

    // ...and are not offered to the builder's assistant, which is the point: the
    // surface declares, the grant selects.
    expect(offered).toEqual(expect.arrayContaining(['describe_page', 'set_l1', 'add_page']))
    expect(offered).not.toContain('add_asset')
    expect(offered).not.toContain('remove_asset')
    expect(offered).not.toContain('publish')

    // A consumer is never TOLD about a capability it does not have, so it cannot
    // propose one or probe for it. The manual offers an operation as
    // `- **tool** — summary` under its group's `### title`, so both forms must be
    // absent for a group that was not granted. Both the withheld groups and their
    // operations are derived from the declaration and the grant rather than
    // written out here, so re-wording a title upstream cannot leave this
    // assertion silently satisfied.
    const manual = box.manual()
    const granted = grantedGroups()
    const withheld = groups().filter((g) => !granted.includes(g.group))
    expect(withheld.map((g) => g.group)).toEqual(
      expect.arrayContaining(['ManageAssets', 'Publish']),
    )
    for (const group of withheld) {
      expect(manual, group.group).not.toContain(`### ${group.title}`)
      for (const tool of group.operations) expect(manual, tool).not.toContain(`**${tool}**`)
    }

    // Calling one anyway is refused as a CAPABILITY decision and recorded as one,
    // rather than vanishing into "no such tool" with nothing to audit.
    const before = draftBytes()
    const answer = await box.run('add_asset', { file: '/etc/hosts', as: 'hosts.png' })

    expect(answer).toMatch(/not enabled/i)
    expect(draftBytes()).toBe(before)

    const record = auditLines().at(-1)!
    expect(record.policy).toEqual({ decision: 'refuse', rule: 'capability' })
    expect(record.operation).toBe('add_asset')
  })

  it('test_UAT_AC1075_a_read_only_grant_cannot_reach_a_write', async () => {
    // Effect is declared per operation and gated INDEPENDENTLY of what is
    // offered, so a consumer given only reading cannot reach a change however the
    // operations happen to be implemented.
    const box: Toolbox = await createL1Toolbox(
      SLUG,
      { cwd },
      { config: { l1: { groups: ['ReadSite'] } }, audit: fileAuditSink({ cwd }) },
    )

    expect(box.toolNames()).toContain('describe_page')
    expect(box.toolNames()).not.toContain('set_l1')
    expect(box.manual()).not.toMatch(/set_l1/)

    const before = draftBytes()
    const answer = await box.run('set_l1', {
      page: 'home',
      path: HEADLINE_PATH,
      node: { kind: 'text', text: 'nope' },
    })

    expect(answer).toMatch(/not enabled|no write access/i)
    expect(draftBytes()).toBe(before)
    expect(headline()).toBe(HEADLINE)
  })

  it('test_UAT_AC1076_arguments_are_checked_before_any_value_reaches_the_site', async () => {
    const box = await caretaker()
    const before = draftBytes()

    // One schema check, run BEFORE invocation — the security model, not an
    // optimisation. Each fault is named specifically enough to correct.
    const wrongType = await box.run('set_l1', {
      page: 'home',
      path: HEADLINE_PATH,
      node: 'not an object',
    })
    const missing = await box.run('set_l1', { page: 'home', node: { kind: 'text', text: 'x' } })
    const undeclared = await box.run('describe_page', { page: 'home', colour: 'red' })

    expect(wrongType).toMatch(/must be an object/i)
    expect(missing).toMatch(/requires parameter 'path'/)
    expect(undeclared).toMatch(/does not accept parameter/i)

    // Nothing was written and — the part that matters — nothing was invoked:
    // every one of these was decided on the DECLARATION, not reported back from
    // the site's write path.
    expect(draftBytes()).toBe(before)
    const lines = auditLines()
    expect(lines).toHaveLength(3)
    for (const record of lines) {
      expect(record.policy).toEqual({ decision: 'refuse', rule: 'schema' })
    }
  })

  it('test_UAT_AC1077_a_refusal_names_its_code_and_that_codes_published_meaning', async () => {
    const box = await caretaker()
    const before = draftBytes()

    // An address composed rather than read — the likeliest well-formed bad call.
    const refusal = await box.run('set_l1', {
      page: 'home',
      path: '9.9.9',
      node: { kind: 'text', text: 'nope' },
    })

    // The code AND what to do about it, taken from the surface's own declared
    // taxonomy rather than from prose here — the second half is what lets a
    // consumer correct the call instead of treating a refusal as a dead end.
    const taxonomy = L1_DECLARATION.errors as Record<string, { message: string }>
    expect(refusal).toContain('NOT_FOUND')
    expect(refusal).toContain(taxonomy.NOT_FOUND.message)
    expect(taxonomy.NOT_FOUND.message).toMatch(/Re-read the listing/)

    // A refusal is never a partial write.
    expect(draftBytes()).toBe(before)
  })

  it('test_UAT_AC1078_reads_are_marked_third_party_and_write_confirmations_are_not', async () => {
    const { UNTRUSTED_OPEN, UNTRUSTED_CLOSE } = await aiCore()
    const box = await caretaker()

    // Everything a read returns is somebody else's words — page copy, a title, a
    // setting — so it comes back wrapped, opened and closed around the payload.
    const read = await box.run('describe_page', { page: 'home' })
    expect(read.startsWith(UNTRUSTED_OPEN)).toBe(true)
    expect(read.trimEnd().endsWith(UNTRUSTED_CLOSE)).toBe(true)
    expect(read).toContain(HEADLINE)

    // A write's confirmation is the surface's own words about the caller's own
    // change; marking it would only teach a consumer to ignore the markers.
    const written = await box.run('set_l1', {
      page: 'home',
      path: HEADLINE_PATH,
      node: { kind: 'text', text: 'Something else.' },
    })
    expect(written).not.toContain(UNTRUSTED_OPEN)
    expect(written).not.toContain(UNTRUSTED_CLOSE)

    // What the marking MEANS is stated once, rather than left to be inferred.
    const manual = box.manual()
    expect(manual).toContain(UNTRUSTED_OPEN)
    expect(manual).toMatch(/third part/i)
  })

  it('test_UAT_AC1079_every_call_against_the_site_is_recorded', async () => {
    const box = await caretaker()

    await box.run('describe_page', { page: 'home' })
    await box.run('set_l1', {
      page: 'home',
      path: HEADLINE_PATH,
      node: { kind: 'text', text: 'Recorded.' },
    })
    await box.run('set_l1', { page: 'home', path: '9.9.9', node: { kind: 'text', text: 'refused' } })

    // One record per call, whatever the outcome.
    const lines = auditLines()
    expect(lines).toHaveLength(3)

    const [read, write, failed] = lines

    // Which surface, which operation, which effect.
    expect(read).toMatchObject({ surface: 'l1', operation: 'describe_page', effect: 'read' })

    // The write records its effect, the arguments it carried, and an allow
    // decision with no refusing rule.
    expect(write).toMatchObject({ surface: 'l1', operation: 'set_l1', effect: 'write' })
    expect(write.params).toMatchObject({ page: 'home', path: HEADLINE_PATH })
    expect(write.policy).toEqual({ decision: 'allow', rule: null })
    expect(write.outcome.ok).toBe(true)

    // An allowed call that then fails is recorded as BOTH — allowed by policy,
    // unsuccessful in outcome, with the failure's code. That is what makes the
    // log usable for reconstructing what was actually done to a site.
    expect(failed).toMatchObject({ operation: 'set_l1', effect: 'write' })
    expect(failed.policy.decision).toBe('allow')
    expect(failed.outcome.ok).toBe(false)
    expect(failed.outcome.error).toContain('NOT_FOUND')
  })

  it('test_UAT_AC1080_the_manual_is_a_projection_of_the_declaration_and_the_grant', async () => {
    const box = await caretaker()
    const manual = box.manual()

    // Every operation actually offered is named there — the manual cannot fall
    // behind the grant, because it is generated from it.
    for (const tool of box.toolNames()) expect(manual).toContain(tool)

    // The addressing rule reaches the consumer THROUGH the projection. Take the
    // overview's own addressing paragraph — identified by the wording, not by
    // position — and require the manual to carry it, so the rule cannot come from
    // a preamble written beside the manual while the declaration's own says
    // something else.
    const addressing = (L1_DECLARATION.overview as string)
      .split('\n\n')
      .filter((para) => /re-read/i.test(para))
    expect(addressing).toHaveLength(1)
    expect(addressing[0]).toMatch(/regenerat/i)
    expect(manual).toContain(addressing[0])
    expect(manual).toMatch(/re-read/i)
    expect(manual).toMatch(/regenerat/i)

    // The declared absences by name, so a capability that is deliberately
    // impossible comes back as an ANSWER rather than a rejected attempt.
    expect(manual).toContain('Not available')
    for (const absence of L1_DECLARATION.absences as { name: string }[]) {
      expect(manual).toContain(absence.name)
    }
    expect(manual).toMatch(/HTML, CSS or JavaScript/)

    // The error taxonomy reaches the consumer as MEANINGS, not bare codes.
    const taxonomy = L1_DECLARATION.errors as Record<string, { message: string }>
    expect(manual).toContain('NOT_FOUND')
    expect(manual).toContain(taxonomy.NOT_FOUND.message)
  })

  it('test_UAT_AC1081_the_addressing_rule_is_stated_once_and_every_address_is_typed', () => {
    // The cross-cutting rule lives in exactly two places that both apply
    // everywhere: the address parameter TYPE, so every operation taking an
    // address inherits it, and the overview, so it is said once.
    const types = L1_DECLARATION.param_types as Record<string, { description: string }>
    expect(types.l1_address.description).toMatch(/re-read/i)
    expect(types.l1_address.description).toMatch(/regenerat/i)
    expect(L1_DECLARATION.overview).toMatch(/re-read/i)

    // The operations that address a place ON A PAGE are exactly those that carry
    // the page-tree scope pair — identified structurally, not by the type under
    // test, so this cannot pass by tautology.
    const addressing = operations().filter((o) => o.params?.module && o.params?.slot)
    expect(addressing.map((o) => o.op).sort()).toEqual(['get_l1', 'set_l1'])

    // Each takes the address as the declared TYPE rather than a bare string that
    // would have to restate the rule.
    for (const op of addressing) {
      expect(op.params!.path.type, op.op).toBe('l1_address')
      expect(op.params!.path.description, op.op).toBeUndefined()
    }
  })

  it('test_UAT_AC1082_a_change_through_the_surface_lands_via_the_one_write_path', async () => {
    const box = await caretaker()

    // Read the page's map and take an address from it — nothing here composes
    // one, because a consumer cannot either.
    const map = JSON.parse(unwrap(await box.run('describe_page', { page: 'home' }))) as {
      segments: { path: string; label: string }[]
    }
    const found = map.segments.find((s) => s.label === HEADLINE)
    expect(found?.path).toBe(HEADLINE_PATH)

    const replacement = { kind: 'text', text: 'A quieter band.', axes: { fontSizePx: 32 } }
    const before = draftBytes()
    const answer = await box.run('set_l1', { page: 'home', path: found!.path, node: replacement })

    // The declared change report: what changed, and a line in plain words.
    const change = JSON.parse(answer) as { changed: string[]; message: string }
    expect(change.changed).toContain(HEADLINE_PATH)
    expect(change.message).toMatch(/Replaced/)

    // The draft on disk is the only evidence that counts.
    expect(headline()).toBe('A quieter band.')
    const viaSurface = draftBytes()

    // No additional write route exists. Rewind the draft and make the SAME change
    // through `edit.ts` directly — the single validated, all-or-nothing,
    // re-rendering write that `1c` and the click-to-edit modal reach — and the
    // resulting draft is byte-for-byte what the surface produced. The surface is
    // a third caller of that write and contributes nothing of its own to it.
    writeFileSync(homePath(), before)
    expect(headline()).toBe(HEADLINE)

    await editL1Set(SLUG, 'home', HEADLINE_PATH, replacement, fsOpts(cwd))

    expect(draftBytes()).toBe(viaSurface)
  })

  it('test_UAT_AC1142_worked_sequences_are_declared_data_and_none_names_an_ungranted_operation', async () => {
    // Read the sequences from the DECLARATION itself rather than through the
    // format check — an empty list satisfies `validateData` unchanged, so the
    // format check cannot witness that the sequences are there at all.
    const list = sequences()
    expect(list.length).toBeGreaterThan(0)

    // Each names itself, orders at least two steps, and carries the note saying
    // why that order is the order.
    const declared = operations().map((o) => o.tool)
    for (const seq of list) {
      expect(typeof seq.name).toBe('string')
      expect(seq.name.length, JSON.stringify(seq)).toBeGreaterThan(0)
      expect(seq.steps.length, seq.name).toBeGreaterThanOrEqual(2)
      expect(seq.note.length, seq.name).toBeGreaterThan(0)

      // A sequence cannot name an operation the surface does not have, because it
      // is part of the same declaration.
      for (const step of seq.steps) expect(declared, `${seq.name} → ${step}`).toContain(step)
    }

    // An element is read before it is replaced — a replacement is the whole
    // element, so anything not read is what would be lost — and the address it is
    // replaced at is read from the page's map first.
    const readThenWrite = list.filter(
      (s) => s.steps.includes('get_l1') && s.steps.includes('set_l1'),
    )
    expect(readThenWrite.length).toBeGreaterThanOrEqual(2)
    for (const seq of readThenWrite) {
      expect(seq.steps.indexOf('get_l1'), seq.name).toBeLessThan(seq.steps.indexOf('set_l1'))
      expect(seq.steps.indexOf('describe_page'), seq.name).toBeLessThan(seq.steps.indexOf('get_l1'))
    }

    const change = readThenWrite.find((s) => /change/i.test(s.name))
    expect(change, list.map((s) => s.name).join(' | ')).toBeDefined()
    expect(change!.note).toMatch(/whole/i)

    // Adding or taking away goes the same read-then-write way, and names no
    // insert or delete operation — because none is declared to name.
    const addRemove = readThenWrite.find((s) => /\badd/i.test(s.name))
    expect(addRemove, list.map((s) => s.name).join(' | ')).toBeDefined()
    expect(declared.filter((tool) => /insert|delete/i.test(tool))).toEqual([])
    expect(addRemove!.steps.filter((step) => /insert|delete/i.test(step))).toEqual([])
    expect(addRemove!.note).toMatch(/insert|delete/i)

    // And no sequence put in front of a consumer names an operation that consumer
    // was not granted. Publishing is today's instance: "Publish deliberately"
    // names `publish`, whose group the builder's assistant does not hold, so a
    // manual that projected the sequences unfiltered would be teaching it a
    // procedure it cannot carry out.
    const box = await caretaker()
    const offered = box.toolNames()
    const manual = box.manual()

    const ungranted = list.filter((s) => s.steps.some((step) => !offered.includes(step)))
    expect(ungranted.map((s) => s.name)).toContain('Publish deliberately')
    for (const seq of ungranted) {
      expect(manual, seq.name).not.toContain(seq.name)
      expect(manual, seq.name).not.toContain(seq.note)
    }
    for (const seq of list.filter((s) => manual.includes(s.name))) {
      for (const step of seq.steps) expect(offered, `${seq.name} → ${step}`).toContain(step)
    }
  })
})
