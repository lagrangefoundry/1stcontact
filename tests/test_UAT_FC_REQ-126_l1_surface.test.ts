import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew } from '../tools/generate/src/cli/commands'
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
import type { L1Node } from '@1stcontact/site-schema'
import { fsOpts } from './support/site-factory'

/**
 * REQ-126 — **the L1 control surface as a declared API** (DOC-30).
 *
 * What is under test is the surface's *shape*, not one more way to edit a page:
 *
 * - the declaration is data, and it validates through the framework's own
 *   standalone validator — which is what makes the startup-failure rule reachable
 *   at author time, in this repository;
 * - the surface declares everything `edit.ts` can do, and the GRANT narrows it, so
 *   an operation can be documented and validated while staying out of a session;
 * - effect classification is enforced, so a read-only session cannot reach a write
 *   whatever the bound API would have done;
 * - arguments are validated BEFORE any value reaches `edit.ts`, which is the
 *   security model and not an optimisation;
 * - site copy re-enters the model's context marked as third-party;
 * - every call is recorded — what ran, against which site, allowed or refused and
 *   by which predicate.
 *
 * Nothing here mocks `edit.ts`, and nothing stubs the Toolbox. The shared
 * artifact store is a PRECONDITION, exactly as it is for the REQ-122 host suite:
 * a stand-in would fork the consumption route these tests exist to cover, so
 * failing to resolve it is an environment failure and reads as one.
 */

const SLUG = 'studio'
const HEADLINE = 'A painted band.'
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

function draftBytes(): string {
  return readFileSync(
    path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', 'home.json'),
    'utf8',
  )
}

function headline(): string {
  const home = JSON.parse(draftBytes())
  return home.l1.root.children[0].children[0].text
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
 * A read's payload, with its provenance markers stripped.
 *
 * The markers are not noise to be worked around — they are the point of the read
 * (see the provenance UAT). Stripping them here is what a *consumer* does after
 * being told the content is third-party, which is exactly the posture under test.
 */
function unwrap(answer: string): string {
  return answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')
}

/** The caretaker's Toolbox for the seeded site, audited to disk like the real host. */
function caretaker(): Promise<{
  /**
   * `Toolbox.run` awaits what `surface.invoke` returns — REQ-142 made every L1
   * operation async, and the model's tool loop awaits the answer. So does every
   * call below.
   */
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
  toolNames: () => string[]
  manual: () => string
}> {
  return createL1Toolbox(SLUG, { cwd }, { audit: fileAuditSink({ cwd }), session: `site-${SLUG}` })
}

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req126-'))
  cmdNew(SLUG, { cwd })
  seedPage(cwd, SLUG)
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

// ── the declaration is data ──────────────────────────────────────────────────

describe('REQ-126 — the surface is declared as data', () => {
  it('test_UAT_FC_REQ_126_declaration_validates_at_author_time', async () => {
    // The check DOC-30 puts in CI, run through the framework's OWN validator
    // rather than a local re-reading of the format. A declaration that fails here
    // would otherwise fail at session construction, on an operator's machine,
    // with a turn already in flight.
    const { validateData } = await aiCore()
    const report = validateData([L1_DECLARATION], L1_INSTANCES)

    expect(report.problems).toEqual([])
    expect(report.ok).toBe(true)
    expect(report.surfaces).toEqual(['l1'])
    expect(report.roles).toContain('caretaker')
  })

  it('test_UAT_FC_REQ_126_surface_carries_its_own_version', () => {
    // DOC-20's `version` is the declaration FORMAT's. A priming document or a
    // third-party consumer still needs to say which SURFACE it was written
    // against, so the surface declares its own alongside it.
    expect(L1_DECLARATION.version).toBe(1)
    expect(Number.isInteger(L1_SURFACE_VERSION)).toBe(true)
    expect(L1_SURFACE_VERSION).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ_126_every_declared_operation_is_implemented_and_no_more', () => {
    // The correspondence the whole design rests on. A declared operation with no
    // method is a startup failure; a method with no declaration is a capability
    // nothing documents, validates or audits. Checked without the framework, so
    // drift is caught even where the shared store is absent.
    //
    // COMPOSED FROM BOTH HALVES since REQ-146. `l1Operations` is the
    // runtime-agnostic core and `nodeOperations` supplies the two that need a
    // disk (`add_asset` reads a file the operator names, `publish` snapshots a
    // tree). Node's surface is their union, and it is the union the declaration
    // describes — checking the core alone would assert that a declared
    // operation is unimplemented, which is the opposite of the invariant.
    const declared = (L1_DECLARATION.operations as { op: string }[]).map((o) => o.op).sort()
    const opts = fsOpts(cwd)
    const implemented = Object.keys({
      ...l1Operations(SLUG, opts),
      ...nodeOperations(SLUG, opts),
    }).sort()
    expect(implemented).toEqual(declared)
  })

  it('test_UAT_FC_REQ_126_addressing_contract_is_stated_once', () => {
    // R4. The correspondence between the address a listing hands out and the
    // address a write resolves is a property of the code; that it is TOLD to the
    // model is a property of the declaration, and it belongs in two places only —
    // the parameter type, so every operation taking an address inherits it, and
    // the overview, so the cross-cutting rule is stated once.
    const types = L1_DECLARATION.param_types as Record<string, { description: string }>
    expect(types.l1_address.description).toMatch(/re-read|regenerat/i)
    expect(L1_DECLARATION.overview).toMatch(/re-read/i)

    // Every parameter that carries an address is typed as one, rather than as a
    // bare string that would have to restate the rule.
    for (const op of L1_DECLARATION.operations as {
      op: string
      params?: Record<string, { type: string }>
    }[]) {
      if (op.params?.path && op.op !== 'add_page' && op.op !== 'update_page') {
        expect(op.params.path.type, op.op).toBe('l1_address')
      }
    }
  })
})

// ── the whole API is declared; the grant narrows it ──────────────────────────

describe('REQ-126 — the surface declares the whole API and the grant narrows it', () => {
  it('test_UAT_FC_REQ_126_declares_operations_the_chat_is_not_granted', async () => {
    const declared = (L1_DECLARATION.operations as { tool: string }[]).map((o) => o.tool)
    // Asset management and publishing are part of the API — documented, schema-
    // checked, and reachable by a differently-configured session.
    expect(declared).toEqual(expect.arrayContaining(['add_asset', 'remove_asset', 'publish']))

    const box = await caretaker()
    const offered = box.toolNames()

    // ...and are not offered to the builder chat, which is the point: the surface
    // declares, the grant selects. Before REQ-126 the only way to leave an
    // operation out of a session was to leave it undeclared.
    expect(offered).toEqual(expect.arrayContaining(['describe_page', 'set_l1', 'add_page']))
    expect(offered).not.toContain('add_asset')
    expect(offered).not.toContain('remove_asset')
    expect(offered).not.toContain('publish')

    // A session is never told about a capability it does not have, so it cannot
    // propose one, apologise for one, or probe for it. The manual offers an
    // operation as `- **tool** — summary`, so that is what must be absent; the
    // overview still explains what publishing IS, because a caretaker that did
    // not understand draft-versus-public would be worse, not safer.
    const manual = box.manual()
    expect(manual).not.toContain('**add_asset**')
    expect(manual).not.toContain('**remove_asset**')
    expect(manual).not.toContain('**publish**')
    expect(manual).not.toContain('Managing images and fonts')
  })

  it('test_UAT_FC_REQ_126_ungranted_operation_is_refused_and_recorded', async () => {
    const box = await caretaker()
    const before = draftBytes()

    const answer = await box.run('add_asset', { file: '/etc/hosts', as: 'hosts.png' })

    expect(answer).toMatch(/not enabled/i)
    expect(draftBytes()).toBe(before)

    // Refused as a CAPABILITY decision and recorded as one — rather than
    // disappearing into "no such tool" with nothing to audit.
    const record = auditLines().at(-1)!
    expect(record.policy).toEqual({ decision: 'refuse', rule: 'capability' })
    expect(record.operation).toBe('add_asset')
  })

  it('test_UAT_FC_REQ_126_read_only_session_cannot_reach_a_write', async () => {
    // Effect is declared per operation and enforced independently of the enabled
    // set, so a read-only session cannot reach a write whatever the bound API
    // would have done.
    const box = await createL1Toolbox(
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
})

// ── validate, then gate, then invoke ─────────────────────────────────────────

describe('REQ-126 — arguments are validated before anything reaches edit.ts', () => {
  it('test_UAT_FC_REQ_126_bad_arguments_never_reach_the_write_path', async () => {
    const box = await caretaker()
    const before = draftBytes()

    // Each of these used to be a hand-rolled check inside its own handler. They
    // are now one schema check that runs before invocation.
    const wrongType = await box.run('set_l1', {
      page: 'home',
      path: HEADLINE_PATH,
      node: 'not an object',
    })
    const missing = await box.run('set_l1', { page: 'home', node: { kind: 'text', text: 'x' } })
    const unknown = await box.run('describe_page', { page: 'home', colour: 'red' })

    expect(wrongType).toMatch(/must be an object/i)
    expect(missing).toMatch(/requires parameter 'path'/)
    expect(unknown).toMatch(/does not accept parameter/i)

    // Nothing was written, and — the part that matters — nothing was invoked:
    // every one of these was refused on the schema, not by `edit.ts`.
    expect(draftBytes()).toBe(before)
    for (const record of auditLines()) {
      expect(record.policy).toEqual({ decision: 'refuse', rule: 'schema' })
    }
  })

  it('test_UAT_FC_REQ_126_a_refusal_names_the_declared_meaning_and_writes_nothing', async () => {
    const box = await caretaker()
    const before = draftBytes()

    // An address the model composed rather than read — the likeliest bad call.
    const refusal = await box.run('set_l1', {
      page: 'home',
      path: '9.9.9',
      node: { kind: 'text', text: 'nope' },
    })

    // The code AND what to do about it, because the code alone does not carry
    // the second and the model would treat a refusal as a dead end.
    expect(refusal).toContain('NOT_FOUND')
    expect(refusal).toMatch(/Re-read the listing/)

    // A refusal is not a partial write.
    expect(draftBytes()).toBe(before)
  })
})

// ── the loop that actually edits ─────────────────────────────────────────────

describe('REQ-126 — the declared surface still drives the one write path', () => {
  it('test_UAT_FC_REQ_126_map_then_write_lands_on_the_draft', async () => {
    const box = await caretaker()

    const map = JSON.parse(unwrap(await box.run('describe_page', { page: 'home' }))) as {
      segments: { path: string; label: string }[]
    }
    const found = map.segments.find((s) => s.label === HEADLINE)

    // The address comes from the map and nowhere else — nothing here composes
    // one, because the model cannot either.
    expect(found?.path).toBe(HEADLINE_PATH)

    const answer = await box.run('set_l1', {
      page: 'home',
      path: found!.path,
      node: { kind: 'text', text: 'A quieter band.', axes: { fontSizePx: 32 } },
    })

    // The declared return shape: what changed, plus a line in plain words.
    const change = JSON.parse(answer) as { changed: string[]; message: string }
    expect(change.changed).toContain(HEADLINE_PATH)
    expect(change.message).toMatch(/Replaced/)

    // The draft on disk is the only evidence that counts, and it was written by
    // `edit.ts` — the same function `1c copy set` and the edit modal reach.
    expect(headline()).toBe('A quieter band.')
  })

  it('test_UAT_FC_REQ_126_site_content_comes_back_marked_as_third_party', async () => {
    const { UNTRUSTED_OPEN, UNTRUSTED_CLOSE } = await aiCore()
    const box = await caretaker()

    // Every read on this surface returns text somebody else wrote: page copy, a
    // page title, a config value. `inproc` would default all of it TRUSTED, which
    // is wrong for a product whose whole job is editing other people's prose.
    const read = await box.run('describe_page', { page: 'home' })
    expect(read.startsWith(UNTRUSTED_OPEN)).toBe(true)
    expect(read.trimEnd().endsWith(UNTRUSTED_CLOSE)).toBe(true)
    expect(read).toContain(HEADLINE)

    // A write's confirmation is the surface's own words about the model's own
    // change, so marking it would only train the model to ignore the markers.
    const written = await box.run('set_l1', {
      page: 'home',
      path: HEADLINE_PATH,
      node: { kind: 'text', text: 'Something else.' },
    })
    expect(written).not.toContain(UNTRUSTED_OPEN)

    // The model is told what the markers mean, once, rather than left to infer it.
    expect(box.manual()).toContain(UNTRUSTED_OPEN)
  })

  it('test_UAT_FC_REQ_126_every_call_against_the_site_is_recorded', async () => {
    const box = await caretaker()
    await box.run('describe_page', { page: 'home' })
    await box.run('set_l1', { page: 'home', path: HEADLINE_PATH, node: { kind: 'text', text: 'Recorded.' } })
    await box.run('set_l1', { page: 'home', path: '9.9.9', node: { kind: 'text', text: 'refused' } })

    const lines = auditLines()
    expect(lines).toHaveLength(3)

    // Which operation, against which surface, with which arguments, allowed or
    // refused — DOC-20 S6's "minimum needed to operate an AI that edits
    // customer-facing sites". Nothing recorded any of it before REQ-126.
    const [read, write, failed] = lines
    expect(read).toMatchObject({ surface: 'l1', operation: 'describe_page', effect: 'read' })
    expect(write).toMatchObject({ operation: 'set_l1', effect: 'write' })
    expect(write.params).toMatchObject({ page: 'home', path: HEADLINE_PATH })
    expect(write.policy).toEqual({ decision: 'allow', rule: null })

    // A host-side failure is allowed by policy and still fails — and both halves
    // are on the record, which is what makes the log usable for anything.
    expect(failed.policy.decision).toBe('allow')
    expect(failed.outcome.ok).toBe(false)
    expect(failed.outcome.error).toContain('NOT_FOUND')
  })
})

// ── the manual is a projection, not a document ───────────────────────────────

describe('REQ-126 — the surface documents itself', () => {
  it('test_UAT_FC_REQ_126_manual_names_every_offered_operation_and_its_absences', async () => {
    const box = await caretaker()
    const manual = box.manual()

    for (const tool of box.toolNames()) expect(manual).toContain(tool)

    // Declared absences turn a security property enforced by absence into an
    // answer the model can give, instead of a turn spent proposing CSS.
    expect(manual).toContain('Not available')
    for (const absence of L1_DECLARATION.absences as { name: string }[]) {
      expect(manual).toContain(absence.name)
    }
    expect(manual).toMatch(/HTML, CSS or JavaScript/)

    // The error taxonomy reaches the model as meanings, not bare codes.
    expect(manual).toContain('NOT_FOUND')
    expect(manual).toMatch(/Re-read the listing/)
  })

  it('test_UAT_FC_REQ_126_offers_no_operation_that_could_write_markup_or_source', async () => {
    // The forbidden list, tested as what it actually is: the absence of an
    // operation. There is no schema through which markup could arrive.
    const box = await caretaker()
    const offered = box.toolNames()
    for (const forbidden of ['write_file', 'set_css', 'set_html', 'eval', 'run', 'set_style']) {
      expect(offered).not.toContain(forbidden)
    }

    // And the stronger form: the set of operations that can change anything is
    // closed and enumerated. A new write cannot appear without being declared,
    // classified `write`, and placed in a group somebody has to grant.
    const writes = (L1_DECLARATION.operations as { tool: string; effect: string }[])
      .filter((o) => o.effect === 'write')
      .map((o) => o.tool)
      .sort()
    //
    // REQ-130 added four, and this list is the reason that was a deliberate act
    // rather than a diff nobody read: `write_image` in particular is the first
    // operation whose bytes the model composes, and it is in `DrawImages` so it
    // can be withheld on its own.
    //
    // REQ-133 added the four palette writes, in `ManagePalette` so they can be
    // withheld together. They widen the surface less than the count suggests:
    // `set_config` could already reach a palette by merge, and two of the four
    // are things merge cannot express at all (removing a key, moving one) —
    // which is why they arrive with guards attached rather than as a broader
    // version of a write that already existed.
    expect(writes).toEqual([
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
  })
})
