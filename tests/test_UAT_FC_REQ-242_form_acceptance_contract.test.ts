import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, run } from '../tools/generate/src/cli'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { FORM_ACCEPTANCE_KEYS } from '../packages/framework/src/modules/contact-form/fields'
import { contactFormPreset } from '../packages/framework/src/l2/contact-form'
import {
  ACCEPTANCE_KEYS,
  NEWSLETTER,
  PRIVACY_POLICY_ACCEPTED,
  T_AND_C_ACCEPTED,
  WHITEPAPERS,
  isAcceptanceKey,
  needsDocument,
} from '../apps/control-app/src/builder/acceptances.js'
import { FORM_SUBMITTED } from '../apps/control-app/src/builder/contact-events.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

/**
 * [[REQ-242]] — **what a capture form's contract refuses, and what an old event
 * still renders as.**
 *
 * THE COMPANION TO THE WORKERS FILE. That one proves what a submission WRITES;
 * this one proves what can never be written, which is a different kind of claim
 * and needs a different boundary. §3's whole argument is that the refusal must be
 * a property of the MODULE rather than a flag defaulted off — *"removing the
 * ability to misconfigure beats documenting the correct setting"* — so the
 * evidence has to be an attempt that fails, at the surface an author actually
 * uses.
 *
 * SO THE ATTEMPTS GO THROUGH `1c` AND NOT THROUGH THE VALIDATOR. The refusal is
 * only worth anything if it reaches the author, and the written surface of a
 * refusal is the CLI's `{ok:false,error}` envelope. A test calling
 * `validateBehaviorConfig` directly would prove the rule exists without proving
 * anything reaches the person breaking it.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a form configurable with `t_and_c_accepted`* — one config edit from
 *     granting membership off a page a stranger can post to;
 *   - *an implied acceptance accepted without wording* — an unevidenceable
 *     consent, written as though it meant something;
 *   - *a refusal that names a list position instead of the acceptance* — the
 *     author was declaring a key and not an index;
 *   - *the module's permitted set drifting from the registry* — three strings the
 *     framework cannot import, so nothing but a check at the seam keeps them
 *     honest;
 *   - *an event carrying the old `consent[]` shape failing to render* — history is
 *     immutable, so those rows exist forever and a timeline that stumbles on one
 *     is worse than one that ignores the extras.
 */

if (!WEBUI_INSTALLED) console.warn(`REQ-242 timeline case skipped: ${WEBUI_SKIP_REASON}`)

const SLUG = 'studio'

let cwd: string

const pagePath = (page = 'home'): string =>
  path.join(cwd, 'storage', 'sandbox', SLUG, 'draft', 'pages', `${page}.json`)
const readPage = (page = 'home'): Record<string, any> =>
  JSON.parse(readFileSync(pagePath(page), 'utf8'))

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string; path?: string; hint?: string }
}

/** Drive the real `1c` entry point — argv in, envelope out. */
async function cli(...argv: string[]): Promise<CliResult> {
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
  process.exitCode = 0
  return JSON.parse(out[out.length - 1]) as CliResult
}

/** A mounting seam, which the scaffold has none of. */
function seedSlot(name = 'signup-form'): void {
  const page = readPage()
  page.l1.root.children.push({ kind: 'slot', name, behavior: 'contact-form' })
  writeFileSync(pagePath(), JSON.stringify(page, null, 2))
}

const EMAIL_FIELD = {
  name: 'email',
  label: 'Email address',
  type: 'email',
  required: true,
}

/** `1c module add`, with `config` as the surface takes it. */
const addForm = (config: Record<string, unknown>): Promise<CliResult> =>
  cli('module', 'add', SLUG, 'home', 'signup', 'contact-form', '--slot', 'signup-form',
    '--config', JSON.stringify(config))

describe('REQ-242 — what a capture form cannot be configured to do', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req242-contract-'))
    cmdNew(SLUG, { cwd, sandbox: true })
    seedSlot()
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  /**
   * AC-6 — no configuration of a capture form can set a type 1 acceptance or
   * produce a member. Asserted by attempting it, from both directions a form can
   * set an acceptance at all.
   */
  it('test_UAT_FC_REQ-242_a_form_cannot_be_configured_to_accept_a_document', async () => {
    for (const document of [T_AND_C_ACCEPTED, PRIVACY_POLICY_ACCEPTED]) {
      // (a) Explicitly, by naming a box after it.
      const box = await addForm({
        fields: [EMAIL_FIELD, { name: 'agree', label: 'I agree', type: 'checkbox', acceptance: document }],
      })
      expect(box.ok).toBe(false)
      expect(box.error!.code).toBe('SCHEMA_INVALID')
      // THE REFUSAL SAYS WHAT IS ALLOWED. A closed set whose message does not
      // name its members is a refusal an author can only get past by guessing.
      for (const permitted of FORM_ACCEPTANCE_KEYS) {
        expect(box.error!.message).toContain(permitted)
      }

      // (b) Implicitly, by declaring the press asserts it — which is the shape
      // that would be most tempting, because it needs no visitor action at all.
      const implied = await addForm({
        fields: [EMAIL_FIELD],
        accepts: [{ key: document, wording: 'By sending this you accept the terms.' }],
      })
      expect(implied.ok).toBe(false)
      expect(implied.error!.code).toBe('SCHEMA_INVALID')
    }

    // Nothing was written by any of it: a form that cannot be configured is not
    // a form that is configured badly.
    expect(readPage().modules ?? []).toHaveLength(0)
  })

  /**
   * AC-6, the other half — the refusal is a property of the contract and not of
   * one command, so a form that is already on the page cannot be RECONFIGURED
   * into it either.
   */
  it('test_UAT_FC_REQ-242_a_live_form_cannot_be_reconfigured_to_accept_a_document', async () => {
    const added = await addForm({ fields: [EMAIL_FIELD], accepts: [{ key: NEWSLETTER, wording: 'Join the list.' }] })
    expect(added.ok).toBe(true)

    const refused = await cli('module', 'set', SLUG, 'home', 'signup', '--config',
      JSON.stringify({ accepts: [{ key: T_AND_C_ACCEPTED, wording: 'You accept the terms.' }] }))
    expect(refused.ok).toBe(false)
    expect(refused.error!.code).toBe('SCHEMA_INVALID')
    // The instance is byte-unchanged: a refused configure leaves the draft alone.
    expect(readPage().modules[0].config.accepts).toEqual([
      { key: NEWSLETTER, wording: 'Join the list.' },
    ])
  })

  /**
   * AC-4 — an implied acceptance declared without wording is refused, and the
   * failure names the KEY.
   *
   * BOTH SHAPES OF ABSENT. Omitted entirely and supplied blank are the same
   * fault — *"pressing the button means you accepted"* is untrue either way — so
   * a contract that caught one and not the other would have a hole exactly where
   * an author's half-finished edit sits.
   */
  it('test_UAT_FC_REQ-242_an_implied_acceptance_with_no_wording_is_refused_by_key', async () => {
    for (const entry of [{ key: NEWSLETTER }, { key: NEWSLETTER, wording: '   ' }]) {
      const refused = await addForm({ fields: [EMAIL_FIELD], accepts: [entry] })
      expect(refused.ok).toBe(false)
      expect(refused.error!.code).toBe('SCHEMA_INVALID')
      // NAMED BY WHAT IT IS, not by where it sat. An author declaring three
      // acceptances does not think of the second one as `accepts[1]`.
      expect(refused.error!.message).toContain(`accepts[${NEWSLETTER}].wording`)
      expect(refused.error!.message).not.toContain('accepts[0]')
    }
    expect(readPage().modules ?? []).toHaveLength(0)
  })

  /**
   * A well-formed pair is accepted, and the vetted default presentation PUTS THE
   * WORDING ON THE PAGE.
   *
   * WHY THIS IS AN ASSERTION AND NOT A DETAIL. §2's claim is conditional:
   * *"pressing the button means you accepted the terms" is only true if the page
   * said so beside the button*. The wording is stored rather than rendered — the
   * seam a `visible` field label already sits on — so a preset that did not emit
   * it would produce, from configuration alone, a form recording a consent
   * nobody was shown.
   */
  it('test_UAT_FC_REQ-242_a_declared_acceptance_is_accepted_and_appears_on_the_page', async () => {
    const wording = 'By sending this you are asking us for the papers.'
    const added = await addForm({
      fields: [EMAIL_FIELD],
      accepts: [{ key: WHITEPAPERS, wording }],
    })
    expect(added.ok).toBe(true)

    const instance = readPage().modules[0]
    expect(instance.config.accepts).toEqual([{ key: WHITEPAPERS, wording }])

    // The words are in the authored subtree — ordinary L1, so the author can move
    // or restyle them, which is why the assertion is on the text and not on a
    // position.
    const texts: string[] = []
    const walk = (node: any): void => {
      if (typeof node?.text === 'string') texts.push(node.text)
      for (const child of node?.children ?? []) walk(child)
    }
    walk(instance.slots.form)
    expect(texts).toContain(wording)
  })

  /**
   * The preset renders no phantom line when nothing is declared — the common
   * case, and the one a naive `accepts ?? ['']` would spoil.
   */
  it('test_UAT_FC_REQ-242_a_form_that_asserts_nothing_gains_no_wording_line', () => {
    const plain = contactFormPreset([{ name: 'email', label: 'Email', type: 'email' }])
    const withOne = contactFormPreset(
      [{ name: 'email', label: 'Email', type: 'email' }],
      {},
      ['Pressing send asks us for the papers.'],
    )
    expect((withOne as any).children).toHaveLength((plain as any).children.length + 1)
  })
})

describe('REQ-242 — the module\'s permitted keys, and the history it replaces', () => {
  /**
   * The seam check the framework cannot make with an import.
   *
   * WHY IT IS A TEST AND NOT AN IMPORT. The registry lives in `control-app`
   * because it has to be readable from a browser panel, and
   * `packages/framework` is upstream of every app — so the module's permitted
   * set is three strings the contract states for itself. What stops them
   * drifting is this, plus the receiver asking the registry before it writes.
   */
  it('test_UAT_FC_REQ-242_the_forms_permitted_keys_are_declared_and_settable', () => {
    for (const key of FORM_ACCEPTANCE_KEYS) {
      // Declared: a key nothing declares is a write nobody designed.
      expect(isAcceptanceKey(key)).toBe(true)
      // And never a document: that is §3's refusal, checked against the only
      // module that knows which keys are documents.
      expect(needsDocument(key)).toBe(false)
    }
    // The omission is deliberate and total: every document key the registry
    // declares is absent from the form's set, so a key added there later cannot
    // become form-settable by accident.
    const documents = ACCEPTANCE_KEYS.filter((key: string) => needsDocument(key))
    expect(documents.length).toBeGreaterThan(0)
    for (const document of documents) {
      expect(FORM_ACCEPTANCE_KEYS as readonly string[]).not.toContain(document)
    }
  })

  /** Both places a key can be named on a form offer exactly the permitted set. */
  it('test_UAT_FC_REQ-242_both_ways_of_naming_an_acceptance_offer_the_same_set', () => {
    const fields = contactFormMeta.config.fields
    expect(fields.itemSchema.acceptance.values).toEqual(FORM_ACCEPTANCE_KEYS)
    expect(contactFormMeta.config.accepts.itemSchema.key.values).toEqual(FORM_ACCEPTANCE_KEYS)
    // The wording is required by the CONTRACT, which is what makes AC-4's
    // refusal the contract's rather than a receiver's reading.
    expect(contactFormMeta.config.accepts.itemSchema.wording.required).toBe(true)
  })

  /**
   * AC-8 — an event written before this ticket, carrying the old `consent[]`
   * shape, still renders on a contact's timeline.
   *
   * WHY IT CANNOT BREAK AND IS ASSERTED ANYWAY. `contact_events` is immutable by
   * trigger, so those rows exist for as long as the business does, and §4 chose
   * to read them rather than migrate them. What makes that safe is that a
   * timeline renders from `kind` and never from `detail` — a property worth
   * PINNING, because the next person tempted to project a detail field into the
   * line would break every historical row at once.
   */
  it.skipIf(!WEBUI_INSTALLED)('test_UAT_FC_REQ-242_an_event_carrying_the_old_consent_blob_still_renders', async () => {
    // THE REAL TIMELINE PROJECTION, reached the way the pane suites reach the
    // builder's browser sources: `people.js` imports the installed components at
    // module scope, so it is loaded on demand and the case reports a visible skip
    // where they are absent rather than failing for a reason unrelated to it.
    const { describeEvent } = await import('../apps/control-app/src/builder/people.js')
    const legacy = {
      kind: FORM_SUBMITTED,
      occurredAt: '2026-09-01T10:00:00.000Z',
      recordedAt: '2026-09-01T10:00:00.000Z',
      detail: {
        site: 'sit_legacy',
        page: 'home.json',
        form: 'signup',
        submitLabel: 'Send',
        consent: [{ field: 'list', wording: 'Email me about new papers', answer: true }],
      },
    }
    const said = describeEvent(legacy)
    expect(said.label).toBe('Submitted a form')
    expect(said.when).toBeTruthy()

    // The same line for the same kind, with no detail at all — which is the
    // property: the blob is neither required nor consulted.
    expect(describeEvent({ ...legacy, detail: {} }).label).toBe(said.label)
  })
})
