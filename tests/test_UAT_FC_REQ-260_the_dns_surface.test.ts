import { describe, expect, it } from 'vitest'
import {
  DNS_DECLARATION,
  DNS_SURFACE,
  dnsInstanceConfig,
  dnsOperations,
  dnsReadOnlyInstanceConfig,
  dnsWriteOperations,
  type DnsChangeView,
  type DnsDeps,
} from '../tools/generate/src/cli/ai/dns-core'
import { L1_DECLARATION } from '../tools/generate/src/cli/ai/toolbox-core'
import { SETTINGS_DECLARATION } from '../tools/generate/src/cli/ai/settings-core'
import { settingsInstanceConfig } from '../tools/generate/src/cli/ai/settings-core'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'

/**
 * [[REQ-260]] — **the `dns` surface: what the assistant may do to a client's
 * domain, and what it may not even propose.**
 *
 * WHAT IS REAL HERE AND WHAT IS NOT. The declaration is the shipped one, checked
 * by the framework's OWN validator with the grant the surface actually carries,
 * and the operations are the production operations. ONE THING IS A DOUBLE —
 * {@link DnsDeps}, the host — which is the division the surface is built on, and
 * the sibling `.workers` suites drive the real one against real D1.
 *
 * THE CLAIMS:
 *
 *  1. THE CLOSED SET IS CLOSED. No operation takes a record type, a record name
 *     and a value; a generic *"set record of type T on name N to value V"* tool
 *     is the ticket's own falsifier and the declaration is where it would appear.
 *  2. THE READ HALF IS SEPARABLE AND CAN SHIP ALONE — the configuration this
 *     ticket says can precede any mutation at all.
 *  3. THE REFUSALS ARE THE HOST'S, RE-CODED AND NOT RE-DECIDED. Every rule lives
 *     behind the port, where it holds for a caller that renders no card.
 *  4. A CHANGE IS ANNOUNCED ONCE, AFTER IT LANDS, AND NEVER WHEN IT IS REFUSED —
 *     which is what makes *"one change is one card"* structural rather than a
 *     habit of whoever writes the prompts.
 *  5. NOTHING ON THIS SURFACE ASKS THE CLIENT TO APPROVE ANYTHING. There is no
 *     operation that proposes, no shape that carries an approval and no error
 *     that means *"waiting for the client"* — a confirmation they cannot
 *     meaningfully perform would only launder our error into their consent.
 */

// ── the doubled host ─────────────────────────────────────────────────────────

const CHANGE: DnsChangeView = {
  id: 'dnc_1234',
  summary: "I'm letting Mailchimp send email as alicesplumbing.com.",
  settlesBy: '2026-09-17T12:20:00.000Z',
  undone: false,
}

function hostOver(over: Partial<DnsDeps> = {}): {
  deps: DnsDeps
  log: { calls: string[] }
} {
  const log = { calls: [] as string[] }
  const deps: DnsDeps = {
    domain: async () => ({ domain: 'alicesplumbing.com', serving: true }),
    reading: async () => ({
      domain: 'alicesplumbing.com',
      web: { host: 'one.example', provider: null },
      mail: { host: 'mx.example', provider: 'Microsoft 365' },
      senders: [],
      signing: [{ selector: 'selector1', provider: 'Microsoft 365', value: 'p=AAA' }],
      live: true,
      takenAt: '2026-09-17T12:00:00.000Z',
    }),
    changes: async () => [CHANGE],
    allowSender: async () => {
      log.calls.push('allowSender')
      return CHANGE
    },
    publishEmailReporting: async () => {
      log.calls.push('publishEmailReporting')
      return CHANGE
    },
    addVerification: async () => {
      log.calls.push('addVerification')
      return CHANGE
    },
    pointSubdomain: async () => {
      log.calls.push('pointSubdomain')
      return CHANGE
    },
    restoreSigningKey: async () => {
      log.calls.push('restoreSigningKey')
      return CHANGE
    },
    ...over,
  }
  return { deps, log }
}

// ── AC10 — the declaration, its groups and its travelling grant ──────────────

describe('REQ-260 AC10 — the surface declares a closed set and narrows by grant', () => {
  it('test_UAT_FC_REQ-260_the_declaration_validates_with_its_travelling_grant', async () => {
    // Through the framework's OWN validator, alongside the surfaces this project
    // already composes into the same conversation — so a group renamed in the
    // declaration becomes a resolution failure here rather than a session that
    // silently grants nothing.
    const { validateData } = await aiCore()
    const report = validateData([L1_DECLARATION, SETTINGS_DECLARATION, DNS_DECLARATION], {
      settings_assistant: { ...settingsInstanceConfig(), ...dnsInstanceConfig() },
    })
    expect(report.problems).toEqual([])
    expect(report.surfaces.sort()).toEqual(['dns', 'l1', 'settings'])
  })

  it('test_UAT_FC_REQ-260_the_diagnostic_half_can_ship_on_its_own', async () => {
    // THE ASYMMETRY RUNS THE HELPFUL WAY. The tools that let the assistant
    // DIAGNOSE a client's DNS problem are the ones with the most support value
    // and the least risk, and they can be granted with no mutation at all.
    const { validateData } = await aiCore()
    const report = validateData([DNS_DECLARATION], { reader: dnsReadOnlyInstanceConfig() })
    expect(report.problems).toEqual([])
    expect(dnsReadOnlyInstanceConfig()[DNS_SURFACE]).toEqual({ groups: ['ReadDns'] })
  })

  it('test_UAT_FC_REQ-260_there_is_no_generic_set_a_record_operation', () => {
    const ops = DNS_DECLARATION.operations as {
      op: string
      effect: string
      params: Record<string, { type: string }>
    }[]
    // THE FALSIFIER, STATED AS A TEST. A generic setter is recognisable by its
    // parameters: something naming a record TYPE, alongside a free name and a
    // free value. No operation here takes one, and the closed set is the whole of
    // what may be changed.
    for (const op of ops) {
      for (const name of Object.keys(op.params)) {
        expect(['type', 'record', 'record_type', 'rrtype', 'content', 'ttl']).not.toContain(name)
      }
    }
    // AND THE SET ITSELF IS THE ONE THE TICKET ENUMERATES.
    expect(ops.map((o) => o.op).sort()).toEqual([
      'add_verification_code',
      'allow_sender',
      'point_subdomain',
      'publish_email_reporting',
      'read_dns_changes',
      'read_domain',
      'read_domain_dns',
      'restore_signing_key',
    ])
    expect([...dnsWriteOperations()].sort()).toEqual([
      'add_verification_code',
      'allow_sender',
      'point_subdomain',
      'publish_email_reporting',
      'restore_signing_key',
    ])
  })

  it('test_UAT_FC_REQ-260_every_group_is_effect_homogeneous_and_each_write_is_its_own', () => {
    const groups = DNS_DECLARATION.groups as {
      group: string
      effect: string
      operations: string[]
    }[]
    const ops = DNS_DECLARATION.operations as { op: string; effect: string }[]
    const effectOf = new Map(ops.map((o) => [o.op, o.effect]))
    for (const group of groups) {
      for (const op of group.operations) expect(effectOf.get(op)).toBe(group.effect)
    }
    // FIVE WRITE GROUPS FOR FIVE WRITES, because they are five different
    // decisions about somebody's mail — and a deployment that wants the repair
    // without the authorisation can express exactly that.
    const writes = groups.filter((g) => g.effect === 'write')
    expect(writes).toHaveLength(5)
    for (const group of writes) expect(group.operations).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-260_nothing_on_this_surface_asks_the_client_to_approve', () => {
    const wire = JSON.stringify(DNS_DECLARATION).toLowerCase()
    // THE CARD IS A NOTICE AND NOT A GATE, and the declaration is where a
    // propose-then-apply shape would first appear: an operation named for it, a
    // shape carrying a decision, or an error meaning *"waiting for the client"*.
    for (const shape of ['propose_', 'confirm_', 'approve_', 'pending_approval', 'awaiting']) {
      expect(wire).not.toContain(shape)
    }
    const errors = Object.keys(DNS_DECLARATION.errors as Record<string, unknown>)
    expect(errors).not.toContain('NOT_APPROVED')
    // AND IT SAYS SO IN WORDS, because the model is the one that would otherwise
    // invent the question.
    expect(wire).toContain('not a confirmation')
  })
})

// ── AC11 — refusals are translated, not re-decided ───────────────────────────

describe('REQ-260 AC11 — the host decides, the surface re-codes', () => {
  it('test_UAT_FC_REQ-260_each_hosts_refusal_arrives_as_the_declared_code', async () => {
    const declared = Object.keys(DNS_DECLARATION.errors as Record<string, unknown>)
    const cases: { raised: { name: string; code?: string }; code: string }[] = [
      { raised: { name: 'DnsRefusedError', code: 'PRIVILEGED_NAME' }, code: 'PRIVILEGED_NAME' },
      { raised: { name: 'DnsRefusedError', code: 'DMARC_EXISTS' }, code: 'DMARC_EXISTS' },
      { raised: { name: 'SpfConflictError' }, code: 'SPF_CONFLICT' },
      { raised: { name: 'CloudflareApiError' }, code: 'DNS_UNAVAILABLE' },
      { raised: { name: 'ResolverUnreachableError' }, code: 'DNS_UNAVAILABLE' },
      { raised: { name: 'UnknownDomainError' }, code: 'NO_DOMAIN' },
    ]
    for (const entry of cases) {
      const { deps } = hostOver({
        allowSender: async () => {
          throw Object.assign(new Error('the host refused'), entry.raised)
        },
      })
      const ops = dnsOperations(deps)
      await expect(
        ops.allow_sender({ include: 'servers.mcsv.net', who: 'Mailchimp' }),
      ).rejects.toMatchObject({ code: entry.code })
      // EVERY CODE IT CAN PRODUCE IS ONE THE DECLARATION CARRIES A SENTENCE FOR,
      // which is what makes the model read the declaration's words rather than a
      // raw message from a module it cannot see.
      expect(declared).toContain(entry.code)
    }
  })

  it('test_UAT_FC_REQ-260_a_business_with_no_domain_is_refused_before_anything_is_attempted', async () => {
    const { deps, log } = hostOver({ domain: async () => null })
    const ops = dnsOperations(deps)
    await expect(
      ops.allow_sender({ include: 'servers.mcsv.net', who: 'Mailchimp' }),
    ).rejects.toMatchObject({ code: 'NO_DOMAIN' })
    expect(log.calls).toEqual([])
    // AND READING THE HISTORY IS STILL AN ORDINARY ANSWER, because a client with
    // no domain asking what has been changed is owed *"nothing"* rather than an
    // error.
    expect(await ops.read_dns_changes({})).toEqual({
      changes: [
        {
          change: CHANGE.id,
          summary: CHANGE.summary,
          settles_by: CHANGE.settlesBy,
          undone: false,
        },
      ],
    })
  })
})

// ── AC12 — the card is announced once, after the change ──────────────────────

describe('REQ-260 AC12 — one change is one card', () => {
  it('test_UAT_FC_REQ-260_a_change_is_announced_once_and_after_it_landed', async () => {
    const announced: DnsChangeView[] = []
    const order: string[] = []
    const { deps } = hostOver({
      allowSender: async () => {
        order.push('changed')
        return CHANGE
      },
    })
    const ops = dnsOperations(deps, (change) => {
      order.push('announced')
      announced.push(change)
    })

    await ops.allow_sender({ include: 'servers.mcsv.net', who: 'Mailchimp' })
    await ops.publish_email_reporting({})

    // AFTER THE AWAIT, so nothing can announce a change that was refused; once
    // per call, so six changes are six cards rather than one silent cascade.
    expect(order).toEqual(['changed', 'announced', 'announced'])
    expect(announced).toHaveLength(2)
    expect(announced[0].summary).toBe(CHANGE.summary)
  })

  it('test_UAT_FC_REQ-260_a_refused_change_announces_nothing', async () => {
    const announced: DnsChangeView[] = []
    const { deps } = hostOver({
      addVerification: async () => {
        throw Object.assign(new Error('nope'), {
          name: 'DnsRefusedError',
          code: 'PRIVILEGED_NAME',
        })
      },
    })
    const ops = dnsOperations(deps, (change) => announced.push(change))
    await expect(
      ops.add_verification_code({ value: 'anything', who: 'Google' }),
    ).rejects.toMatchObject({ code: 'PRIVILEGED_NAME' })
    // A CARD FOR A CHANGE THAT DID NOT HAPPEN IS WORSE THAN NO CARD: it offers an
    // undo for something there is nothing to undo.
    expect(announced).toEqual([])
  })

  it('test_UAT_FC_REQ-260_reading_announces_nothing_at_all', async () => {
    const announced: DnsChangeView[] = []
    const { deps } = hostOver()
    const ops = dnsOperations(deps, (change) => announced.push(change))
    await ops.read_domain({})
    await ops.read_domain_dns({})
    await ops.read_dns_changes({})
    expect(announced).toEqual([])
  })

  it('test_UAT_FC_REQ-260_the_reading_reaches_the_model_without_the_signing_values', async () => {
    const { deps } = hostOver()
    const reading = (await dnsOperations(deps).read_domain_dns({})) as {
      signing: Record<string, unknown>[]
    }
    // WHOSE THE KEY IS, NOT WHAT IT SAYS. The selector and the provider are what
    // a diagnosis is made of; the key material is a page of base64 that would
    // spend the context window and could be read out to a client by mistake.
    expect(reading.signing).toEqual([{ selector: 'selector1', provider: 'Microsoft 365' }])
  })
})
