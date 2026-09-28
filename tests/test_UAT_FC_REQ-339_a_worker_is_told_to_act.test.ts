import { describe, expect, it } from 'vitest'
import {
  BUILDER_ROLE,
  CONSULTANT_ROLE,
  LEGACY_ROLE_NAMES,
  SESSION_MEMORY_PROVIDER,
  registerMemoryProviders,
} from '../tools/generate/src/cli/ai/roles'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'

/** The AI library is untyped JavaScript; the boundary is here, as it is in the host. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * [[REQ-339]] — **the half decided by a document and a predicate**.
 *
 * DOC-60 §F1 measured a worker that opened its first turn with *"Thank you for
 * the standing note. I see I'm in the middle of a multi-section spacing task"*
 * and then restated its whole state at the head of every turn after it — 14
 * times in one worker, 34 in another — at a measured 14,421 output tokens for
 * five element writes. Two causes, one in each half of the priming:
 *
 *   1. the ledger is resolved per SITE and the provider registry is shared by
 *      every role assembled on that site, so the product tier's `session.summary`
 *      handed a worker the consultant's standing note and decisions;
 *   2. the worker's reminder tier held two entries, both providers, and no
 *      instruction about how to spend a turn — where the consultant's tier has
 *      had one all along.
 *
 * THIS SUITE IS THE CHEAP HALF: the predicate called directly, and the reminder
 * tier read out of `priming.json`. The sibling `.workers` suite drives a real
 * delegation through the real route and proves what actually reaches the wire,
 * which is the claim that matters; this one localises a break to the provider or
 * to the document without booting workerd.
 *
 * NOTHING ABOUT THE WORDS IS RESTATED HERE. What the assertions compare against
 * is read back out of `priming.json`, so an edit to the document is what moves a
 * case rather than an edit to a constant holding a copy of it.
 */

/** One reminder entry as the document writes it. */
interface RawEntry {
  name?: string
  text?: string | string[]
  provider?: string
}

const builderReminders = primingDocument.builder_reminders as RawEntry[]
const consultantReminders = primingDocument.reminders as RawEntry[]

/** The static text of a named entry in one declared order, joined as it ships. */
function lineOf(entries: RawEntry[], name: string): string {
  const found = entries.find((entry) => entry.name === name)
  expect(found, `no entry named ${name}`).toBeDefined()
  const { text } = found as RawEntry
  return Array.isArray(text) ? text.join('\n') : String(text)
}

/**
 * A registry holding only what this suite exercises, with a record behind it.
 *
 * REGISTERED THE WAY THE HOST REGISTERS IT — one source, one registry, every role
 * assembled from it — because that IS the defect. A test that bound a second
 * registry per role would be proving a shape this host does not have.
 */
function registryWithARecord(): {
  seed: (role: string) => Promise<string | null>
  reads: number
} {
  const bound = new Map<string, (ctx: Untyped) => Promise<string | null>>()
  const providers = {
    register: (name: string, provider: (ctx: Untyped) => Promise<string | null>) => {
      bound.set(name, provider)
    },
    get: (name: string) => bound.get(name),
  }
  const state = { reads: 0 }
  registerMemoryProviders(providers as Untyped, {
    record: async () => {
      state.reads += 1
      return {
        note: 'Building a one-page site for a Bristol furniture restorer.',
        decisions: ['The accent colour across the site is oxblood.'],
      }
    },
  })
  const seed = bound.get(SESSION_MEMORY_PROVIDER)!
  return {
    seed: (role: string) => seed({ sessionId: 's', role }),
    get reads() {
      return state.reads
    },
  }
}

describe('REQ-339 — the record is delivered to the role that keeps it', () => {
  it('test_UAT_FC_REQ-339_the_record_entry_renders_nothing_for_a_worker', async () => {
    // BEHAVIOUR 1. The same silence a host with no ledger already gets, reached
    // the same way: the provider answers `null`, which the framework's loader
    // drops along with the entry's separator. There is no second tier, no second
    // registry and no branch in the host — one binding, told which role it is
    // rendering for.
    const registry = registryWithARecord()
    expect(await registry.seed(BUILDER_ROLE)).toBeNull()
  })

  it('test_UAT_FC_REQ-339_a_worker_costs_the_record_not_even_a_read', async () => {
    // THE DECISION IS TAKEN BEFORE THE STORE IS TOUCHED, which is worth pinning
    // rather than leaving to chance: the ledger is a ticket read, it is on the
    // path of every worker this deployment opens, and a version of the fix that
    // fetched the record and then discarded it would be indistinguishable in the
    // prompt and measurably worse per delegation.
    const registry = registryWithARecord()
    await registry.seed(BUILDER_ROLE)
    expect(registry.reads).toBe(0)
  })

  it('test_UAT_FC_REQ-339_the_consultant_still_gets_its_standing_note_and_its_decisions', async () => {
    // BEHAVIOUR 3, AND THE REGRESSION THE FIX COULD HAVE INTRODUCED. Delivering
    // the record every turn is what stopped the consultant re-deriving settled
    // state ([[REQ-283]]), so a gate that caught the consultant too would trade
    // one expensive session for another.
    const registry = registryWithARecord()
    const rendered = await registry.seed(CONSULTANT_ROLE)

    expect(rendered).toContain('Building a one-page site for a Bristol furniture restorer.')
    expect(rendered).toContain('The accent colour across the site is oxblood.')
    expect(registry.reads).toBe(1)
  })

  it('test_UAT_FC_REQ-339_a_conversation_resumed_under_a_legacy_role_name_keeps_its_record', async () => {
    // THE ONE WAY AN ALLOW-LIST COULD HAVE BEEN WRONG. A legacy name is an extra
    // KEY onto the same consultant role object, and the name is durable in two
    // places a rename cannot reach — the archived transcript's header and the
    // junction's `session_start`. A conversation older than the rename resumes
    // under its stored name, and dropping its record there would be this bug
    // again with the sides swapped.
    const registry = registryWithARecord()
    for (const legacy of LEGACY_ROLE_NAMES) {
      expect(await registry.seed(legacy)).toContain('the site is oxblood')
    }
  })
})

describe("REQ-339 — the worker's reminder tier tells it to act", () => {
  it('test_UAT_FC_REQ-339_the_worker_is_told_to_act_in_the_consultants_own_words', () => {
    // BEHAVIOUR 2, first half. Substantially the consultant's words because it is
    // LITERALLY the consultant's line: the same sentence, spelled again in this
    // role's own declared order rather than reached across from another's, which
    // is how the settings role already carries its copy.
    expect(lineOf(builderReminders, 'act-rather-than-narrate')).toBe(
      lineOf(consultantReminders, 'act-rather-than-narrate'),
    )
  })

  it('test_UAT_FC_REQ-339_the_worker_is_told_not_to_restate_what_it_has_finished', () => {
    // BEHAVIOUR 2, second half — the part only a worker needs, and the one aimed
    // squarely at what was measured. The consultant narrates to a client who is
    // reading; a worker narrates to nobody, because its turns are never shown to
    // the consultant and its report at the end is the entire of what is.
    const line = lineOf(builderReminders, 'no-status-narration')

    expect(line).toMatch(/restate/i)
    expect(line).toMatch(/report/i)
    // It is the WORKER'S line and nobody else's: the consultant does have a
    // reader, so telling it the same thing would be wrong rather than redundant.
    expect(consultantReminders.some((entry) => entry.name === 'no-status-narration')).toBe(false)
  })

  it('test_UAT_FC_REQ-339_the_site_and_the_page_are_still_delivered_to_the_worker', () => {
    // BEHAVIOUR 4. These are facts about the SITE rather than about the
    // consultant's conversation, and a worker that had to discover them by
    // reading would pay more than the record ever cost it. Nothing about the
    // tier's shape moved: the two providers are still there, still volatile, and
    // the two additions are static so they cannot spoil a cacheable prefix.
    const providers = builderReminders.map((entry) => entry.provider).filter(Boolean)

    expect(providers).toEqual(['site.line', 'site.digest'])
  })

  it('test_UAT_FC_REQ-339_the_worker_is_still_not_nudged_to_keep_a_record_it_cannot_write', () => {
    // THE OTHER DIRECTION OF THE SAME RULE, pinned because the reminder tier is
    // what this ticket edits. `memory-trigger` tells a session to rewrite its
    // standing note and record its decisions; both verbs are on the ledger
    // surface, which `instances.json` grants to the consultant alone. A worker
    // told to keep a record it has no verb for is a worker that will ask for one.
    const named = builderReminders.map((entry) => entry.name)

    expect(named).not.toContain('memory-trigger')
    expect(consultantReminders.map((entry) => entry.name)).toContain('memory-trigger')
  })
})
