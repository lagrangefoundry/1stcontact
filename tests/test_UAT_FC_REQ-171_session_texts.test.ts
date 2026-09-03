import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew } from '../tools/generate/src/cli/commands'
import { aiCore, L1_DECLARATION, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
// THE CORE, NOT THE NODE WRAPPER. `ai/toolbox.ts` composes its own surfaces from
// what a `1c` process has and takes no `extraSurfaces`; the core is the seam
// `host-core.ts` builds every session through, and composing a surface is what
// is under test here.
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { ctxOf } from '../tools/generate/src/cli/commands'
import { fsSiteStore } from '../tools/generate/src/store'
import {
  CONSULTANT_ROLE_TEXT,
  CONSULTANT_SYSTEM,
  LEGACY_ROLE_NAMES,
  PRODUCT_SYSTEM,
  consultantReminder,
} from '../tools/generate/src/cli/ai/roles'
import { CONSULTANT_PURPOSE } from '../tools/generate/src/cli/ai/host-core'
import {
  LEDGER_DECLARATION,
  ledgerInstanceConfig,
  ledgerSurfaceFor,
  renderEntry,
} from '../tools/generate/src/cli/ai/ledger-core'
import type { LedgerDeps, LedgerState } from '../tools/generate/src/cli/ai/ledger-core'

/**
 * REQ-171 — **the session's three texts**, and the record that outlives them.
 *
 * The governing rule is that nothing duplicative or irrelevant reaches the
 * context, and the texts are split by WHAT CHANGES THEM:
 *
 * - product level, role-independent — what the product is, what the tools are
 *   for, how to reach the knowledge system;
 * - role level — who this role is, and which documents it must read;
 * - the reminder — a handful of lines, and only what decays.
 *
 * What is under test is that split holding, plus the two things that fall out of
 * it: priming carries a SUMMARY of the surface rather than its reference, and
 * the engagement's decisions are written somewhere they survive the conversation.
 */

const SLUG = 'studio'
let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req171-'))
  cmdNew(SLUG, { cwd })
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

async function toolbox(
  extraSurfaces: Array<{ surface: unknown; granted?: Record<string, unknown> }> = [],
) {
  const opts = { cwd }
  const store = fsSiteStore(ctxOf(opts))
  return createL1Toolbox(SLUG, opts, {
    session: `site-${SLUG}`,
    lib: await aiCore(),
    store,
    extraOps: nodeOperations(SLUG, { ...opts, store } as never),
    extraSurfaces: extraSurfaces as never,
  })
}

// ── priming carries the summary, not the reference ───────────────────────────

describe('REQ-171 — the priming carries a summary guide, not a reference work', () => {
  it('test_UAT_FC_REQ-171_the_summary_is_a_fraction_of_the_full_manual', async () => {
    const box = await toolbox()
    const full = box.manual()
    const summary = box.manual({ level: 'summary' })

    // The ticket's claim is that the reference is the overwhelming majority of
    // what priming carried. A summary that saved a little would not be worth a
    // second render level, so the bar is stated as a ratio and not as a byte
    // count that drifts every time the surface grows.
    expect(summary.length).toBeLessThan(full.length / 2)
  })

  it('test_UAT_FC_REQ-171_the_summary_keeps_what_you_choose_with', async () => {
    const summary = (await toolbox()).manual({ level: 'summary' })

    // What a summary is FOR: which capabilities exist, and what each is for.
    // Group titles are the client-facing altitude the declaration already
    // carries, and every tool is still named — you cannot choose a tool that
    // was not listed.
    expect(summary).toContain('Looking at the site')
    expect(summary).toContain('Changing the site')
    expect(summary).toContain('describe_page')
  })

  it('test_UAT_FC_REQ-171_the_summary_drops_what_you_only_need_to_call_with', async () => {
    const box = await toolbox()
    const full = box.manual()
    const summary = box.manual({ level: 'summary' })

    // Parameter tables, return shapes and error taxonomies are what a model
    // needs at the moment of a call and never before it. They are in the full
    // manual, and `describe_tools` is how they are reached — so dropping them
    // from priming loses nothing except the tokens.
    expect(full).toContain('(string, required)')
    expect(summary).not.toContain('(string, required)')
    expect(full).toContain('Fails with')
    expect(summary).not.toContain('Fails with')
  })

  it('test_UAT_FC_REQ-171_the_session_can_fetch_a_tools_full_entry', async () => {
    // A summary with no route to the detail moves the failure rather than
    // fixing it. The route travels with the manual it completes, so it is here
    // without either host wiring it.
    expect((await toolbox()).toolNames()).toContain('DescribeTools')
  })

  it('test_UAT_FC_REQ-171_every_capability_group_says_what_it_is_for', () => {
    // Under the full manual a group with no description is invisible, because
    // the operations beneath it carry their own prose. Under a summary the
    // group IS the prose, so a missing description renders a bare title and the
    // model is left guessing what the group is for.
    const groups = (L1_DECLARATION as unknown as { groups: Array<Record<string, string>> }).groups
    const silent = groups.filter((g) => !g.description || g.description.trim() === '')
    expect(silent.map((g) => g.group)).toEqual([])
  })
})

// ── the three texts ──────────────────────────────────────────────────────────

describe('REQ-171 — product material is written once, for every role', () => {
  it('test_UAT_FC_REQ-171_the_product_text_names_no_role', () => {
    // The point of the split: standing up the ongoing tier's second role
    // (DOC-33 §10) must cost a role text and nothing else. A product text that
    // says "consultant" is a product text that has to be copied and then
    // maintained twice.
    expect(PRODUCT_SYSTEM).not.toMatch(/consultant/i)
    // And no retired one either — read from the exported list rather than
    // written out, both so this stays true if the list grows and so REQ-174's
    // scan for stragglers does not find one here.
    for (const retired of LEGACY_ROLE_NAMES) {
      expect(PRODUCT_SYSTEM).not.toMatch(new RegExp(retired, 'i'))
    }

    // And it does carry the facts that are true whoever is reading.
    expect(PRODUCT_SYSTEM).toContain('only through your tools')
    expect(PRODUCT_SYSTEM).toContain('refused whole')
  })

  it('test_UAT_FC_REQ-171_the_system_prompt_is_the_role_then_the_product', () => {
    expect(CONSULTANT_SYSTEM).toContain(CONSULTANT_ROLE_TEXT)
    expect(CONSULTANT_SYSTEM).toContain(PRODUCT_SYSTEM)
    // Role first. The first thing a model reads about itself sets the register
    // for everything after it.
    expect(CONSULTANT_SYSTEM.indexOf(CONSULTANT_ROLE_TEXT)).toBeLessThan(
      CONSULTANT_SYSTEM.indexOf(PRODUCT_SYSTEM),
    )
    expect(CONSULTANT_SYSTEM.startsWith('You are a design consultant')).toBe(true)
  })

  it('test_UAT_FC_REQ-171_nothing_is_stated_in_two_places', () => {
    // The reminder rides every request, so anything it restates is paid for on
    // every turn. It points at the method rather than carrying it.
    const reminder = consultantReminder(SLUG)
    expect(reminder).toContain('DOC-33')
    expect(reminder.length).toBeLessThan(600)
    // The playbook itself is corpus material (DOC-33 §12) and appears in none
    // of the hand-written texts.
    for (const text of [PRODUCT_SYSTEM, CONSULTANT_ROLE_TEXT, reminder]) {
      expect(text).not.toMatch(/stage \d/i)
    }
  })
})

describe('REQ-171 — the role text is the role, derived from DOC-33 and DOC-35', () => {
  it('test_UAT_FC_REQ-171_fluency_is_detected_not_assumed', () => {
    // DOC-35 §9.4: confusion is silent and fluency is loud, so the register is
    // a dial that starts careful and escalates. The flat assumption it replaces
    // is wrong for a substantial part of the known population (§5.3) and
    // patronising in a way fluent people do not forgive (§9.3).
    expect(CONSULTANT_ROLE_TEXT).not.toContain('They are not technical')
    expect(CONSULTANT_ROLE_TEXT).toMatch(/Confusion is\s+silent and fluency is loud/)
  })

  it('test_UAT_FC_REQ-171_a_real_decision_gets_options_not_iterations', () => {
    // DOC-33 §7.1. Refining one proposal walks toward the model's default,
    // which is the templated look the product exists to escape. The rule the
    // retired role's text carried — "make the smallest change" — survives only
    // for adjustment-level work, and says so.
    expect(CONSULTANT_ROLE_TEXT).toMatch(/two or three options that differ in kind/)
    expect(CONSULTANT_ROLE_TEXT).toMatch(/Adjustments are different/)
    expect(consultantReminder(SLUG)).toMatch(/differ in kind rather than refining one/)
  })
})

describe('REQ-171 — the purpose is short and names what to read', () => {
  it('test_UAT_FC_REQ-171_the_purpose_names_the_documents_this_role_must_read', () => {
    // The trigger KM renders straight after this section says "pick the
    // territories above that bear on your purpose". A purpose naming no
    // territory gives that instruction nothing to bite on.
    for (const doc of ['DOC-33', 'DOC-35', 'DOC-31']) {
      expect(CONSULTANT_PURPOSE).toContain(doc)
    }
    // Named by subject as well as by id, because retrieval matches on words.
    expect(CONSULTANT_PURPOSE).toContain('consultation playbook')
  })

  it('test_UAT_FC_REQ-171_the_purpose_names_both_corpora', () => {
    // It framed only the system's own documents while there was one KB.
    // REQ-159 gave the session the client's, and a purpose describing half the
    // landscape sends the agent looking in half of it.
    expect(CONSULTANT_PURPOSE).toMatch(/corpus your client brings/)
    expect(CONSULTANT_PURPOSE.length).toBeLessThan(900)
  })
})

// ── the engagement record ────────────────────────────────────────────────────

/** A ledger that records what it was asked to do, and nothing else. */
function fakeLedger(): LedgerDeps & { written: string[]; names: string[] } {
  const written: string[] = []
  const names: string[] = []
  return {
    written,
    names,
    async append(render: (index: number) => string): Promise<LedgerState> {
      written.push(render(written.length + 1))
      return { entries: written.length, title: names[names.length - 1] ?? 'session-id' }
    },
    async rename(name: string): Promise<LedgerState> {
      names.push(name)
      return { entries: written.length, title: name }
    },
  }
}

describe('REQ-171 — what was decided is written down', () => {
  it('test_UAT_FC_REQ-171_the_ledger_is_absent_where_there_is_nowhere_to_write', async () => {
    // The `1c` CLI archives to a file and has no ticket store. It gets a
    // consultant that cannot record decisions, rather than one that fails to
    // start or one whose tool errors on first use.
    expect((await toolbox()).toolNames()).not.toContain('record_decision')
  })

  it('test_UAT_FC_REQ-171_the_ledger_arrives_with_its_own_grant', async () => {
    // The grant travels with the surface: what a session may do to its own
    // record is a property of the surface, not a per-role entry that could
    // drift away from it.
    const lib = await aiCore()
    const box = await toolbox([
      { surface: await ledgerSurfaceFor(lib, fakeLedger()), granted: ledgerInstanceConfig() },
    ])
    expect(box.toolNames()).toContain('record_decision')
    expect(box.toolNames()).toContain('name_engagement')
  })

  it('test_UAT_FC_REQ-171_a_decision_is_recorded_with_its_reasoning', async () => {
    const lib = await aiCore()
    const ledger = fakeLedger()
    const box = await toolbox([
      { surface: await ledgerSurfaceFor(lib, ledger), granted: ledgerInstanceConfig() },
    ])

    await box.run('record_decision', {
      decision: 'The Bristol furniture restorer site leads with the workshop photograph.',
      because: 'The craft is the product, and a stock hero image says nothing about it.',
      rejected: 'A text-first hero, which read as a consultancy rather than a workshop.',
    })

    const entry = ledger.written[0]
    // The rejected alternative is not decoration. Without it a later session
    // cannot tell a deliberate choice from an accident, and will re-propose
    // exactly what was already ruled out.
    expect(entry).toContain('workshop photograph')
    expect(entry).toContain('**Why:**')
    expect(entry).toContain('**Considered and rejected:**')
  })

  it('test_UAT_FC_REQ-171_entries_are_numbered_so_a_chunk_is_a_decision', () => {
    // The body is indexed as prose and chunked by the knowledge component. A
    // heading per decision is what makes a chunk correspond to a decision
    // rather than to a byte offset — and the heading is a label, not the
    // decision text, so a reader scanning the record has something to scan.
    const first = renderEntry(1, { decision: 'Palette is oxblood and bone.', because: 'It is the leather.' })
    expect(first.startsWith('### Decision 1')).toBe(true)
    expect(first).not.toContain('Open — expected')

    const open = renderEntry(2, { decision: 'Two pages, for now.', because: 'The copy is not written.', open: true })
    expect(open.startsWith('### Decision 2')).toBe(true)
    // Marked only when open: a status line under every entry is a status line
    // that gets skimmed under the one entry where it matters.
    expect(open).toContain('Open — expected to be revisited.')
  })

  it('test_UAT_FC_REQ-171_the_engagement_is_named_once_the_business_is_known', async () => {
    const lib = await aiCore()
    const ledger = fakeLedger()
    const box = await toolbox([
      { surface: await ledgerSurfaceFor(lib, ledger), granted: ledgerInstanceConfig() },
    ])

    // A conversation starts named after itself — an identifier, meaning nothing
    // to anyone scanning a list of engagements, and matching no search.
    await box.run('name_engagement', { name: 'Website for a Bristol furniture restorer' })
    expect(ledger.names).toEqual(['Website for a Bristol furniture restorer'])
  })

  it('test_UAT_FC_REQ-171_the_ledger_never_reaches_the_site', () => {
    // A third surface for the reason fidelity is a second: `l1-surface.json` is
    // the documented way to change a site, and nothing here changes one.
    const decl = LEDGER_DECLARATION as unknown as { surface: string; operations: Array<{ op: string }> }
    expect(decl.surface).toBe('ledger')
    expect(decl.operations.map((o) => o.op).sort()).toEqual(['name_engagement', 'record_decision'])
  })
})
