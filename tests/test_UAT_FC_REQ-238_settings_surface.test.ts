import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  SETTINGS_DECLARATION,
  SETTINGS_SURFACE,
  SettingsRefusedError,
  settingsInstanceConfig,
  settingsOperations,
  type PublicAddress,
  type SettingsDeps,
} from '../tools/generate/src/cli/ai/settings-core'
import { L1_DECLARATION } from '../tools/generate/src/cli/ai/toolbox-core'

/**
 * REQ-238 — **the hostname as the settings assistant reads and takes it.**
 *
 * *"This ticket declares its own operations and refusals in the settings
 * surface... The prose earns its keep here more than anywhere else on the tab:
 * 'this cannot be changed' has to reach the customer BEFORE they commit, and a
 * refusal has to offer somewhere to go next rather than just say no."*
 *
 * WHY THE DECLARATION IS THE SUBJECT AND NOT A PRIMING DOCUMENT. `roles.ts`
 * states the rule: the tool manual is PROJECTED from the declaration, so a
 * hand-written inventory *"is worse than no inventory because the model believes
 * it"*. Every sentence asserted below is therefore the sentence the model
 * actually receives.
 *
 * THE CLAIMS:
 *
 *  1. TWO OPERATIONS AND NOT ONE. `check` has no side effect and is safe to call
 *     as fast as somebody can type; `claim` is final and is the only one with a
 *     consequence. *"The split is what makes the assistant useful rather than
 *     decorative."*
 *  2. THE PROSE SAYS IT CANNOT BE CHANGED, AT THE MOMENT OF CHOOSING, and shows
 *     the WHOLE HOST rather than a bare label.
 *  3. EVERY REFUSAL OFFERS SOMEWHERE TO GO NEXT, and the assistant is told it is
 *     not the gate — *"the list refuses; the assistant explains the refusal and
 *     helps find an alternative"*.
 *  4. THE OPERATIONS ARE DRIVEN, so the codes the declaration promises are the
 *     codes a refusal actually carries.
 *  5. **THERE IS NO UPDATE PATH ON `host`** anywhere in the shipped source —
 *     the ticket's falsifier, scanned rather than asserted of one module.
 */

const REPO = path.resolve(__dirname, '..')

const OPS = SETTINGS_DECLARATION.operations as Array<{
  op: string
  effect: string
  description: string
  returns?: { shape?: string }
  errors?: string[]
}>
const GROUPS = SETTINGS_DECLARATION.groups as Array<{
  group: string
  effect: string
  description: string
  operations: string[]
}>
const ERRORS = SETTINGS_DECLARATION.errors as Record<string, { message: string }>
const opNamed = (op: string) => OPS.find((o) => o.op === op)!

// ── two operations, and what each of them is ─────────────────────────────────

describe('REQ-238 — check and claim are two operations, not one', () => {
  it('test_UAT_FC_REQ-238_the_surface_declares_check_and_claim_separately', () => {
    // THE SURFACE IS TWO OPERATIONS, NOT ONE. One taking a `commit` flag would
    // make the difference between looking and living-with-it a boolean.
    expect(opNamed('check_hostname').effect).toBe('read')
    expect(opNamed('claim_hostname').effect).toBe('write')
    expect(opNamed('read_addresses').effect).toBe('read')
  })

  it('test_UAT_FC_REQ-238_the_grant_separates_taking_from_looking', () => {
    // A DEPLOYMENT THAT WANTED AN ASSISTANT WHICH COULD ADVISE ON HOSTNAMES
    // WITHOUT COMMITTING ITS CLIENT TO ONE withholds exactly one group — which is
    // what makes narrowing it later a configuration change rather than a
    // redesign.
    const granted = (settingsInstanceConfig()[SETTINGS_SURFACE] as { groups: string[] }).groups
    expect(granted).toEqual(expect.arrayContaining(['ReadAddresses', 'ClaimHostname']))

    const read = GROUPS.find((g) => g.group === 'ReadAddresses')!
    const write = GROUPS.find((g) => g.group === 'ClaimHostname')!
    expect(read.effect).toBe('read')
    expect(read.operations.sort()).toEqual(['check_hostname', 'read_addresses'])
    expect(write.effect).toBe('write')
    expect(write.operations).toEqual(['claim_hostname'])
    // EVERY GROUP IS EFFECT-HOMOGENEOUS — the framework's validator refuses
    // otherwise, and the two new ones are no exception.
    const effectOf = new Map(OPS.map((o) => [o.op, o.effect]))
    for (const group of GROUPS) {
      for (const op of group.operations) expect(effectOf.get(op)).toBe(group.effect)
    }
  })

  it('test_UAT_FC_REQ-238_the_check_is_declared_as_free_repeatable_and_not_a_promise', () => {
    // *"A customer whose first six choices are gone is exactly who needs help,
    // and the assistant can only help if it can check."* And the model has to
    // know the answer is not a reservation, or it will tell somebody a name is
    // theirs.
    const check = opNamed('check_hostname').description
    expect(check).toMatch(/as often as you like|call it as often/i)
    expect(check).toMatch(/not a promise/i)
    expect(check).toMatch(/holds nothing|reserves nothing|changes nothing/i)
    // AND IT IS TOLD WHAT TO DO WHEN THE RACE IS LOST.
    expect(check).toMatch(/offer/i)
  })

  it('test_UAT_FC_REQ-238_the_hostname_is_declared_on_the_settings_surface_and_no_other', () => {
    // A BUSINESS'S PUBLIC ADDRESS IS NOT A SITE EDIT. Folding it into the site
    // surface would put the two names — what the business is called and where it
    // is reached — behind one vocabulary.
    const l1 = (L1_DECLARATION.operations as Array<{ op: string }>).map((o) => o.op)
    for (const op of ['check_hostname', 'claim_hostname', 'read_addresses']) {
      expect(l1).not.toContain(op)
      expect(OPS.map((o) => o.op)).toContain(op)
    }
  })
})

// ── the prose, which is the part that reaches the customer ───────────────────

describe('REQ-238 — the choice is presented as the whole host and as permanent', () => {
  it('test_UAT_FC_REQ-238_the_claim_says_it_cannot_be_changed_before_it_is_made', () => {
    // *"'This cannot be changed' has to reach the customer BEFORE they commit"* —
    // at the moment of choosing rather than afterwards. Asserted on the CLAIM's
    // own description, which is what the model reads when it is about to call it.
    const claim = opNamed('claim_hostname').description
    expect(claim).toMatch(/cannot be changed/i)
    expect(claim).toMatch(/before you do it, not after|before.*not after/i)
    // AND THE WHOLE HOST, SAID IN FULL — a permanent name typed in a hurry is a
    // permanent typo, and a bare label is a name nobody actually read.
    expect(claim).toContain('.1stc.site')
    expect(claim).toMatch(/whole/i)
    // THE SUMMARY CARRIES IT TOO, because a summary manual is what a primed
    // session holds before it ever opens the detail.
    expect(opNamed('claim_hostname').summary).toMatch(/cannot be undone|cannot be changed/i)
  })

  it('test_UAT_FC_REQ-238_the_shapes_carry_the_whole_host_and_never_a_bare_label', () => {
    // THE PRESENTATION REQUIREMENT CARRIED INTO THE WIRE rather than left to
    // whoever renders it: nothing the model is handed is a label it would have to
    // assemble an address from.
    const shapes = SETTINGS_DECLARATION.shapes as Record<string, Record<string, string>>
    expect(Object.keys(shapes.address)).toContain('host')
    expect(Object.keys(shapes.address)).not.toContain('label')
    expect(Object.keys(shapes.check)).toContain('host')
    expect(Object.keys(shapes.check)).not.toContain('label')
    // AND THE APEX TRAVELS WITH THE LIST, so no caller composes it.
    expect(shapes.addresses.apex).toContain('1stc.site')
  })

  it('test_UAT_FC_REQ-238_the_overview_tells_the_two_names_apart_by_lifecycle', () => {
    // THE SINGLE MOST IMPORTANT THING THE SETTINGS ASSISTANT HAS TO UNDERSTAND:
    // the two names sit on one tab and have OPPOSITE lifecycles. A session that
    // cannot say which is which will eventually change the wrong one.
    const overview = SETTINGS_DECLARATION.overview as string
    expect(overview).toMatch(/final/i)
    expect(overview).toMatch(/first-come/i)
    expect(overview).toMatch(/free to change/i)
    expect(overview).toMatch(/which of the two they mean/i)
  })

  it('test_UAT_FC_REQ-238_changing_a_hostname_is_declared_as_absent_and_not_as_pending', () => {
    // NOTHING IS BUILT IN ANTICIPATION OF THE CHANGE PATH, and the declaration
    // must not promise one either: *"do not promise a change, do not imply one is
    // coming, and do not offer to ask."*
    const absences = SETTINGS_DECLARATION.absences as Array<{ name: string; note: string }>
    const changing = absences.find((a) => a.name === 'Changing or releasing a hostname')!
    expect(changing).toBeTruthy()
    expect(changing.note).toMatch(/chosen once and does not change/i)
    expect(changing.note).toMatch(/re-issued/i)
    expect(changing.note).toMatch(/do not promise/i)
    // AND TAKING ONE PUBLISHES NOTHING.
    expect(absences.find((a) => a.name === 'Publishing')!.note).toMatch(/nothing here publishes/i)
  })

  it('test_UAT_FC_REQ-238_the_sequence_reads_first_checks_and_only_then_claims', () => {
    // THE ORDER IS THE ADVICE. Read first, because a business that already has
    // one cannot have another; check as many as it takes; claim only once the
    // whole host has been said back to them.
    const sequences = SETTINGS_DECLARATION.sequences as Array<{ steps: string[]; note: string }>
    const choosing = sequences.find((s) => s.steps.includes('claim_hostname'))!
    expect(choosing.steps).toEqual(['read_addresses', 'check_hostname', 'claim_hostname'])
    expect(choosing.note).toMatch(/permanent/i)
  })
})

// ── the refusals, and who the gate is ────────────────────────────────────────

describe('REQ-238 — the list refuses and the assistant explains', () => {
  it('test_UAT_FC_REQ-238_every_hostname_refusal_offers_somewhere_to_go_next', () => {
    // *"A refusal has to offer somewhere to go next rather than just say no."*
    for (const code of ['HOSTNAME_TAKEN', 'HOSTNAME_RESERVED', 'HOSTNAME_INVALID']) {
      expect(ERRORS[code].message, code).toMatch(/offer|pick|say which|different/i)
    }
    // AND THE ONE THAT HAS NOWHERE TO GO SAYS SO PLAINLY, because a hostname
    // already held cannot be traded in.
    expect(ERRORS.HOSTNAME_ALREADY_HELD.message).toMatch(/cannot be changed/i)
    expect(ERRORS.HOSTNAME_ALREADY_HELD.message).toMatch(/names the one they hold|names/i)
  })

  it('test_UAT_FC_REQ-238_the_assistant_is_told_it_is_not_the_gate', () => {
    // *"It would be judging its own user's request and can be argued out of a
    // refusal."* So the reserved refusal is declared as not negotiable, and the
    // assistant's job is to find an alternative rather than to sympathise.
    expect(ERRORS.HOSTNAME_RESERVED.message).toMatch(/not negotiable/i)
    expect(ERRORS.HOSTNAME_RESERVED.message).toMatch(/do not argue/i)
    // AND NOTHING IS CHOSEN ON THE CUSTOMER'S BEHALF.
    const absences = SETTINGS_DECLARATION.absences as Array<{ name: string; note: string }>
    expect(absences.find((a) => a.name === 'Choosing a hostname for them')!.note).toMatch(
      /your client's decision|cannot be corrected/i,
    )
  })

  it('test_UAT_FC_REQ-238_every_error_an_operation_names_is_declared', () => {
    const declared = Object.keys(ERRORS)
    for (const op of OPS) {
      for (const code of op.errors ?? []) expect(declared, op.op).toContain(code)
    }
  })
})

// ── the operations, driven ───────────────────────────────────────────────────

/** A host that answers from memory, so the surface is driven without a database. */
function hostOver(overrides: Partial<SettingsDeps> = {}) {
  const held: PublicAddress[] = []
  const log: { checked: string[]; claimed: string[] } = { checked: [], claimed: [] }
  const deps: SettingsDeps = {
    read: async () => ({ businessId: 'biz_1', name: 'Cole’s Bakery' }),
    rename: async () => {
      throw new Error('not used here')
    },
    addresses: async () => ({ apex: '1stc.site', addresses: [...held] }),
    check: async (label: string) => {
      log.checked.push(label)
      return { host: `${label}.1stc.site`, available: true, refusal: null }
    },
    claim: async (label: string) => {
      log.claimed.push(label)
      const address = { host: `${label}.1stc.site`, kind: 'platform', siteKey: 'site_1' }
      held.push(address)
      return address
    },
    ...overrides,
  }
  return { deps, log, held }
}

describe('REQ-238 — the operations do what the declaration says', () => {
  it('test_UAT_FC_REQ-238_a_check_reaches_the_host_and_writes_nothing', async () => {
    const { deps, log, held } = hostOver()
    const answer = await settingsOperations(deps).check_hostname({ label: 'colesbakery' })
    expect(answer).toEqual({ host: 'colesbakery.1stc.site', available: true, refusal: null })
    expect(log.checked).toEqual(['colesbakery'])
    // A CHECK THAT RESERVED ANYTHING WOULD BE A HOLD ON A FINITE PUBLIC
    // NAMESPACE, obtainable by typing.
    expect(held).toEqual([])
  })

  it('test_UAT_FC_REQ-238_a_claim_does_not_re_check_first', async () => {
    // *"A claim that trusts an earlier check instead of the unique index"* is a
    // falsifier. The claim calls the host once and consults no check at all.
    const { deps, log } = hostOver()
    await settingsOperations(deps).claim_hostname({ label: 'colesbakery' })
    expect(log.claimed).toEqual(['colesbakery'])
    expect(log.checked).toEqual([])
  })

  it('test_UAT_FC_REQ-238_the_hosts_refusals_arrive_as_the_declared_codes', async () => {
    // RE-CODED AND NOT RE-DECIDED. Whether a hostname is free is settled by the
    // deployment's unique index; what this proves is that the sentence the model
    // reads is the declaration's, keyed by the code the call carries.
    const cases: Array<[string, string]> = [
      ['HostnameTakenError', 'HOSTNAME_TAKEN'],
      ['ReservedHostnameError', 'HOSTNAME_RESERVED'],
      ['InvalidHostnameError', 'HOSTNAME_INVALID'],
      ['HostnameAlreadyHeldError', 'HOSTNAME_ALREADY_HELD'],
      ['NoSiteError', 'NO_SITE'],
    ]
    for (const [raised, code] of cases) {
      const { deps } = hostOver({
        claim: async () => {
          const error = new Error('the host decided')
          Object.defineProperty(error, 'name', { value: raised })
          throw error
        },
      })
      const refused = await settingsOperations(deps)
        .claim_hostname({ label: 'x' })
        .catch((e: unknown) => e)
      expect(refused, raised).toBeInstanceOf(SettingsRefusedError)
      expect((refused as SettingsRefusedError).code, raised).toBe(code)
      expect(Object.keys(ERRORS), code).toContain(code)
    }
  })

  it('test_UAT_FC_REQ-238_an_empty_address_list_is_an_answer_and_not_a_refusal', async () => {
    // *"Until a site is published it has no public address and needs none"* — so
    // a business that has not chosen one reads as a business that has not chosen
    // one, not as a fault.
    const { deps } = hostOver()
    expect(await settingsOperations(deps).read_addresses({})).toEqual({
      apex: '1stc.site',
      addresses: [],
    })
  })

  it('test_UAT_FC_REQ-238_a_conversation_with_no_business_behind_it_is_refused', async () => {
    const { deps } = hostOver({ read: async () => null })
    for (const op of ['read_addresses', 'check_hostname', 'claim_hostname']) {
      const refused = await settingsOperations(deps)
        [op]({ label: 'x' })
        .catch((e: unknown) => e)
      expect(refused, op).toBeInstanceOf(SettingsRefusedError)
      expect((refused as SettingsRefusedError).code, op).toBe('NO_BUSINESS')
    }
  })
})

// ── the falsifier: no update path on host ────────────────────────────────────

describe('REQ-238 — there is no update path on site_domains.host', () => {
  it('test_UAT_FC_REQ-238_no_code_anywhere_updates_the_host_in_place', () => {
    // THE FALSIFIER, NAMED DIRECTLY: *"any path that updates
    // `site_domains.host` in place."* Not a guarded one, not an operator-only
    // one. Scanned over the shipped source rather than asserted of one module,
    // because the claim is about the PRODUCT having no such path — a second
    // writer added elsewhere is exactly what this exists to catch.
    //
    // A STATEMENT THAT WRITES `host`, AND NOT ONE THAT MENTIONS IT. The one
    // `UPDATE site_domains` the product has sets `status`, which is revocation —
    // the row keeps the value it was created with, which is also why a revoked
    // host can never be re-issued.
    const offenders: string[] = []
    const skip = new Set(['node_modules', 'dist', '.wrangler', 'generated', 'fonts'])
    const walk = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          if (skip.has(entry.name)) continue
          walk(path.join(dir, entry.name))
          continue
        }
        if (!/\.(ts|js|sql)$/.test(entry.name)) continue
        const full = path.join(dir, entry.name)
        const src = fs.readFileSync(full, 'utf8')
        for (const statement of src.match(/UPDATE\s+site_domains[\s\S]{0,200}/gi) ?? []) {
          if (/\bSET\b[\s\S]{0,120}?\bhost\s*=/i.test(statement)) {
            offenders.push(path.relative(REPO, full))
          }
        }
      }
    }
    for (const root of ['apps', 'tools', 'packages', 'db']) walk(path.join(REPO, root))
    expect(offenders).toEqual([])
  })

  it('test_UAT_FC_REQ-238_the_scan_would_notice_one', () => {
    // THE SCAN ABOVE IS ONLY EVIDENCE IF IT CAN FAIL. This is the statement it is
    // looking for, checked against the same two patterns, so an absent-because-
    // broken regex cannot read as an absent-because-true result.
    const planted = "await env.DB.prepare(\"UPDATE site_domains SET host = ? WHERE id = ?\")"
    const found = (planted.match(/UPDATE\s+site_domains[\s\S]{0,200}/gi) ?? []).filter((s) =>
      /\bSET\b[\s\S]{0,120}?\bhost\s*=/i.test(s),
    )
    expect(found).toHaveLength(1)
    // AND THAT IT DOES NOT FIRE ON THE REVOCATION THE PRODUCT DOES HAVE.
    const revoke = "UPDATE site_domains SET status = 'revoked' WHERE id = ?"
    expect(
      (revoke.match(/UPDATE\s+site_domains[\s\S]{0,200}/gi) ?? []).filter((s) =>
        /\bSET\b[\s\S]{0,120}?\bhost\s*=/i.test(s),
      ),
    ).toHaveLength(0)
  })
})
