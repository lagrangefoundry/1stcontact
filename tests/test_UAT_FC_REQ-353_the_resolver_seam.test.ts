import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import {
  DelegationConfigError,
  configureDelegation,
  delegationDocument,
  delegationFor,
  delegationForScope,
} from '../tools/generate/src/cli/ai/delegation'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'

/**
 * [[REQ-353]] — **the seam a business's answer travels on**, decided by documents
 * rather than by a turn.
 *
 * THE HALF OF THE TICKET THAT IS ABOUT THE MECHANISM. The sibling `.workers`
 * suite drives two real businesses through the real Worker and the real database
 * and proves what reaches a model; the jsdom suite drives the tab. What is
 * settled HERE is the property the other two rest on and neither can isolate:
 * that a per-business value is a PARAMETER validated like the bundled document,
 * that an absent one changes nothing, and that nothing about it is a global.
 *
 * THE CONDITIONS THESE CASES SETTLE:
 *
 *   - **a host with no resolver reads the bundled document** — condition 8's
 *     mechanism, and the reason the `1c` CLI's behaviour is untouched;
 *   - **`null` from a resolver is *inherit*, not *off*** — which is what makes a
 *     business nobody has touched indistinguishable from today;
 *   - **a stored value is validated the way the bundled document is**, refused by
 *     name at the point the host is built — condition 7;
 *   - **the refusal names the business as well as the key**, because a deployment
 *     reading *`enabled` must be true or false* with no idea whose row produced it
 *     has to go looking;
 *   - **an unreadable answer is a refusal and not an inherit**, so a database
 *     nobody can reach cannot silently serve this deployment's arrangement to a
 *     business that turned it off;
 *   - **and the resolver is never `configureDelegation`** — the trap [[EPIC-22]]
 *     names, because a module-level global mutated per request while a manager
 *     cache is keyed per store-and-site is how one business comes to be served
 *     another's setting.
 *
 * NOTHING ABOUT THE DOCUMENT IS RESTATED. Every expectation is read back out of
 * `delegation.json` and `backends.json`, so an edit to a document moves a case
 * rather than an edit to a constant holding a copy of it.
 */

const REPO = path.resolve(__dirname, '..')

/** A resolver that answers with whatever a case hands it. */
const answering = (business: string, document: unknown | null) => ({
  business,
  read: async () => document,
})

afterEach(() => {
  configureDelegation(null)
})

describe('REQ-353 — a host with no resolver reads the bundled document', () => {
  it('test_UAT_FC_REQ-353_no_resolver_is_exactly_the_deployments_own_answer', async () => {
    // CONDITION 8's MECHANISM. The `1c` CLI passes no resolver, so what it gets
    // has to be — not merely resemble — what it got before this ticket existed.
    // `delegationFor` is the call the host made and is still the call it makes
    // when nothing is resolved, so comparing the two IS the claim.
    expect(await delegationForScope([BUILDER_ROLE])).toEqual(delegationFor([BUILDER_ROLE]))
    expect((await delegationForScope([BUILDER_ROLE])).enabled).toBe(delegationDocument.enabled)
  })

  it('test_UAT_FC_REQ-353_an_installed_document_still_decides_when_no_resolver_answers', async () => {
    // THE TWO MECHANISMS COMPOSE RATHER THAN ONE SHADOWING THE OTHER. A
    // deployment — or a suite — that installs its own document still decides what
    // this host's position is; a resolver decides whether one business departs
    // from it. A `delegationForScope` that reached past an installed document
    // would make every existing suite's `configureDelegation` a no-op on the one
    // path that builds a host.
    configureDelegation({ ...delegationDocument, enabled: false })
    expect((await delegationForScope([BUILDER_ROLE])).enabled).toBe(false)
    expect(await delegationForScope([BUILDER_ROLE])).toEqual(delegationFor([BUILDER_ROLE]))
  })

  it('test_UAT_FC_REQ-353_a_resolver_answering_null_inherits_rather_than_turning_it_off', async () => {
    // WHAT MAKES AN UNTOUCHED BUSINESS INDISTINGUISHABLE FROM TODAY. `null` is
    // the answer a business that has never been asked produces, and it is the
    // ordinary case — so it must resolve to the deployment's document and not to
    // `enabled: false`, which would turn delegation off for every business on the
    // day the migration ran.
    const resolved = await delegationForScope([BUILDER_ROLE], answering('biz_untouched', null))
    expect(resolved).toEqual(delegationFor([BUILDER_ROLE]))
  })

  it('test_UAT_FC_REQ-353_the_resolver_installs_nothing_and_the_next_host_is_unaffected', async () => {
    // [[EPIC-22]]'s NAMED TRAP, asserted rather than trusted. If a per-business
    // answer were reached through `configureDelegation` it would be a
    // module-level global, and the business resolved SECOND in one isolate would
    // inherit the first one's setting. So: resolve one business off, then resolve
    // with no resolver at all, and the deployment's own answer must be untouched.
    const off = await delegationForScope(
      [BUILDER_ROLE],
      answering('biz_off', { ...delegationDocument, enabled: false }),
    )
    expect(off.enabled).toBe(false)
    expect((await delegationForScope([BUILDER_ROLE])).enabled).toBe(delegationDocument.enabled)
  })
})

describe('REQ-353 — a stored value is validated the way the bundled document is', () => {
  it('test_UAT_FC_REQ-353_a_malformed_stored_value_is_refused_naming_the_business_and_the_key', async () => {
    // CONDITION 7. The column carries an affinity rather than a type, so a row
    // written by hand can hold a word; the reader passes anything that is not the
    // boolean straight through to the validator rather than coercing it, and this
    // is where that lands. The message has to carry BOTH halves — whose row, and
    // which key — because a deployment reading `'enabled' must be true or false`
    // with neither would have to go looking through every business it serves.
    const refused = delegationForScope(
      [BUILDER_ROLE],
      answering('biz_bad', { ...delegationDocument, enabled: 'maybe' }),
    )
    await expect(refused).rejects.toThrow(DelegationConfigError)
    await expect(refused).rejects.toThrow(/biz_bad/)
    await expect(refused).rejects.toThrow(/enabled/)
  })

  it('test_UAT_FC_REQ-353_a_stored_document_earns_every_refusal_the_bundled_one_earns', async () => {
    // THE POINT OF ROUTING A STORED VALUE THROUGH A DOCUMENT AT ALL: it is not a
    // second, weaker validation path. A worker bound to a backend
    // `backends.json` does not declare is refused here exactly as it is at
    // start-up — naming the role, the backend and now the business — rather than
    // at the first delegation in a customer's conversation.
    const declared = Object.keys(backendsDocument).filter((key) => key !== 'about')
    const undeclared = 'claude_not_declared'
    expect(declared).not.toContain(undeclared)

    const refused = delegationForScope(
      [BUILDER_ROLE],
      answering('biz_wire', {
        ...delegationDocument,
        workers: { [BUILDER_ROLE]: { backend: undeclared } },
      }),
    )
    await expect(refused).rejects.toThrow(/biz_wire/)
    await expect(refused).rejects.toThrow(new RegExp(undeclared))

    // …and a role this host cannot build is the second half of the same check,
    // which is the host's knowledge rather than the document's.
    const unknownRole = delegationForScope(
      [BUILDER_ROLE],
      answering('biz_role', {
        ...delegationDocument,
        workers: { copywriter: { backend: declared[0] } },
      }),
    )
    await expect(unknownRole).rejects.toThrow(/biz_role/)
    await expect(unknownRole).rejects.toThrow(/copywriter/)
  })

  it('test_UAT_FC_REQ-353_an_unreadable_answer_is_a_refusal_and_never_a_silent_inherit', async () => {
    // THE ONE FAILURE MODE A SWITCH USED AS A ROLLBACK MAY NOT HAVE. Treating a
    // database nobody can reach as *no opinion* would serve this deployment's
    // arrangement — delegation ON, at $0.54 an element write against $0.046 — to a
    // business that had turned it off, and nothing anywhere would say so.
    const refused = delegationForScope([BUILDER_ROLE], {
      business: 'biz_unreachable',
      read: async () => {
        throw new Error('D1_ERROR: no such table')
      },
    })
    await expect(refused).rejects.toThrow(DelegationConfigError)
    await expect(refused).rejects.toThrow(/biz_unreachable/)
    // The underlying failure is carried rather than swallowed: an operator reading
    // only this has to be able to tell a missing table from a malformed value.
    await expect(refused).rejects.toThrow(/no such table/)
  })
})

describe('REQ-353 — the 1c CLI is untouched', () => {
  it('test_UAT_FC_REQ-353_the_node_host_assembles_no_delegation_resolver', () => {
    // CONDITION 8, at the one altitude where it is a property of this repository
    // rather than of a function: the CLI's host does not assemble the seam at all,
    // so `deps.delegation` is absent and the bundled document is what it reads.
    // That is this repository's ordinary shape for a capability a host has not got
    // — `fidelity: null` on a laptop with no Playwright, no ticket store, no
    // renderer — and not two hosts disagreeing about one value.
    //
    // READ OFF THE SHIPPED FILE, because the claim is about what that file does
    // not do. A behavioural assertion cannot distinguish "passes no resolver" from
    // "passes one that happens to answer null today", and the second of those is
    // the state that would quietly grow a database dependency into the CLI.
    const host = fs.readFileSync(
      path.join(REPO, 'tools/generate/src/cli/ai/host.ts'),
      'utf8',
    )
    expect(host).not.toContain('delegation')
    expect(host).not.toContain('DelegationResolver')
  })
})
