// @vitest-environment jsdom
/**
 * REQ-180 §1 and D1 — **the reason reaches the person, and the portal does not
 * get built in the builder**.
 *
 * WHAT MAKES THIS EVIDENCE. The account surface is mounted from the SHIPPED
 * `business.js` into a real DOM and read back out of the document, so what is
 * asserted is what an operator would see. `openAccountSurface` needs nothing
 * from the shared `webui-*` components — it composes `modal.js`, which is ours —
 * so these cases run everywhere rather than skipping where the components are
 * absent, which matters for a claim about a sentence a customer reads.
 *
 * TWO CLAIMS, AND THE SECOND ONE IS AN ABSENCE:
 *
 *   1. A LAPSED BUSINESS IS EXPLAINED WHERE THERE IS ROOM TO EXPLAIN IT. The
 *      switcher marks; this states why. A reason computed on the server and
 *      never rendered is not a reason, so the server-side UATs are only half the
 *      acceptance and this is the other half.
 *   2. NO PLAN, BILLING OR INVOICE VIEW EXISTS AS A BUILDER ROUTE. That is
 *      [[REQ-180]] D1 — the account surface is the customer portal of the 1st
 *      Contact site, rendered through the site pipeline, and building any of it
 *      here would be the named failure mode of [[DOC-40]] §2.1 rule 1. A
 *      decision recorded only in prose is one the next person re-opens by
 *      accident; this is the form that stops them.
 */

import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  lapseSentence,
  openAccountSurface,
} from '../apps/control-app/src/builder/business.js'
import {
  BUSINESS_LAPSED_SUFFIX,
  BUSINESS_LAPSE_SENTENCES,
} from '../apps/control-app/src/builder/config.js'

const REPO = path.resolve(__dirname, '..')
const SRC = path.join(REPO, 'apps/control-app/src')

let host: HTMLElement

beforeEach(() => {
  document.body.innerHTML = ''
  host = document.createElement('div')
  document.body.append(host)
})

/** Every rendered business row, as `[label, reason]`. */
function rows(): Array<[string, string | null]> {
  return [...document.querySelectorAll('.builder-account__business')].map((row) => [
    row.querySelector('.builder-account__business-name')!.textContent!,
    row.querySelector('.builder-account__business-lapse')?.textContent ?? null,
  ])
}

describe('REQ-180 — the account surface states why access ended', () => {
  it('test_UAT_FC_REQ-180_a_lapsed_business_is_explained_and_a_live_one_is_not', async () => {
    // The pairing, on screen. The live business must acquire no second line: a
    // sentence about access being fine, on every row of the ordinary case, is
    // how a list stops being readable.
    openAccountSurface({
      host,
      account: { name: 'Sam', email: 'sam@example.test' },
      businesses: [
        { id: 'acct_live', name: 'Salon', selectable: true, lapse: null },
        {
          id: 'acct_dead',
          name: 'Studio',
          selectable: false,
          lapse: { reason: 'expired', endedAt: '2026-08-01T09:30:00.000Z' },
        },
      ],
      selected: 'acct_live',
    })

    expect(rows()).toEqual([
      ['Salon', null],
      [`Studio${BUSINESS_LAPSED_SUFFIX}`, 'Access ended on 2026-08-01.'],
    ])
  })

  it('test_UAT_FC_REQ-180_two_businesses_lapsed_differently_each_say_their_own_reason', async () => {
    // Why the reason goes beside the business rather than into a banner over the
    // list. An account operating three businesses can have two of them lapsed for
    // different reasons, and a single message would have to pick one and be
    // wrong about the other — to the one person who owns both.
    openAccountSurface({
      host,
      account: { name: null, email: 'sam@example.test' },
      businesses: [
        { id: 'a', name: 'Salon', selectable: false, lapse: { reason: 'revoked', endedAt: null } },
        {
          id: 'b',
          name: 'Studio',
          selectable: false,
          lapse: { reason: 'expired', endedAt: '2026-08-01T00:00:00.000Z' },
        },
      ],
    })

    expect(rows().map(([, reason]) => reason)).toEqual([
      BUSINESS_LAPSE_SENTENCES.revoked,
      'Access ended on 2026-08-01.',
    ])
  })

  it('test_UAT_FC_REQ-180_every_reason_the_wire_can_carry_has_a_sentence', async () => {
    // The four the server can produce, each mapped to something a person can act
    // on. Two are settled by paying and two by talking to us, which is the whole
    // point of distinguishing them — so the assertion is that they are FOUR
    // distinct sentences and not one message with four keys pointing at it.
    const sentences = ['expired', 'revoked', 'not_yet', 'never_granted'].map((reason) =>
      lapseSentence({ reason, endedAt: null }),
    )
    expect(sentences.every((s) => typeof s === 'string' && s.length > 0)).toBe(true)
    expect(new Set(sentences).size).toBe(4)
  })

  it('test_UAT_FC_REQ-180_an_unknown_or_missing_reason_degrades_to_the_marking', async () => {
    // A Worker ahead of the client it is serving is an ordinary state during a
    // deploy, and a client older than the Worker meets a reason it has never
    // heard of. Both must degrade to LESS information — the business is still
    // marked unavailable — and never to the word `undefined` on a screen.
    expect(lapseSentence(null)).toBeNull()
    expect(lapseSentence(undefined)).toBeNull()
    expect(lapseSentence({})).toBeNull()
    expect(lapseSentence({ reason: 'something_new', endedAt: null })).toBeNull()

    openAccountSurface({
      host,
      account: { name: 'Sam', email: 'sam@example.test' },
      // `selectable: false` with no `lapse` at all — exactly what a Worker
      // predating this ticket sends.
      businesses: [{ id: 'a', name: 'Studio', selectable: false }],
    })

    expect(rows()).toEqual([[`Studio${BUSINESS_LAPSED_SUFFIX}`, null]])
  })

  it('test_UAT_FC_REQ-180_a_date_less_expiry_still_says_access_ended', async () => {
    // `endedAt` is nullable on the wire, and the sentence must not collapse into
    // nothing when it is absent — "your access ended" without the date is still
    // the news, and silence is not.
    expect(lapseSentence({ reason: 'expired', endedAt: null })).toBe(
      BUSINESS_LAPSE_SENTENCES.expired,
    )
  })
})

describe('REQ-180 D1 — the portal is not built in the builder', () => {
  /**
   * A SOURCE ASSERTION, because the failure is a surface that exists rather than
   * a wrong answer to a question anyone asked. Nothing observable distinguishes
   * "we have not built the billing page yet" from "we built it in the wrong
   * place" until the portal is built a second time by someone reverse-engineering
   * what this one decided — which is [[DOC-40]] §2.1's named failure mode, and it
   * is invisible to every behavioural test that could be written.
   */
  const ROUTES = fs.readFileSync(path.join(SRC, 'router.ts'), 'utf8')

  it('test_UAT_FC_REQ-180_no_plan_or_billing_or_invoice_route_exists_in_the_builder', () => {
    // Route paths only. The words are free to appear in prose explaining why they
    // are not routes — this very file's comments do — and a grep over the whole
    // source would forbid the explanation along with the thing.
    const paths = [...ROUTES.matchAll(/['"`](\/api\/[^'"`]*)['"`]/g)].map((m) => m[1])
    for (const route of paths) {
      expect(route, `${route} is a builder route naming a portal capability`).not.toMatch(
        /invoice|billing|plan|payment|subscription/i,
      )
    }
  })

  it('test_UAT_FC_REQ-180_the_account_surface_shows_only_facts_about_the_session', () => {
    // What the dialog may ever hold, stated as a boundary rather than as a
    // to-do: who is signed in, and which businesses that identity reaches. Both
    // are facts about the SESSION, which is the one thing a portal rendered on
    // another origin cannot state — and everything else about an account belongs
    // to the portal.
    openAccountSurface({
      host,
      account: { name: 'Sam', email: 'sam@example.test' },
      businesses: [{ id: 'a', name: 'Salon', selectable: true, lapse: null }],
    })

    const shown = document.body.textContent!.toLowerCase()
    for (const word of ['invoice', 'billing', 'plan', 'payment', 'subscription', 'card']) {
      expect(shown, `the account surface renders "${word}"`).not.toContain(word)
    }
  })

  it('test_UAT_FC_REQ-180_the_account_surface_offers_no_way_to_add_a_business', () => {
    // D2, on the client side. Adding a business is an operator action while we
    // are pre-billing, so there is no control for it anywhere in the product —
    // and the surface the ticket originally proposed putting it on is the one
    // place worth asserting that about.
    openAccountSurface({
      host,
      account: { name: 'Sam', email: 'sam@example.test' },
      businesses: [{ id: 'a', name: 'Salon', selectable: true, lapse: null }],
    })

    const controls = [...document.querySelectorAll('button, input, a[href]')].map((el) =>
      (el.textContent ?? '').trim().toLowerCase(),
    )
    expect(controls.some((label) => label.includes('add') || label.includes('new'))).toBe(false)
  })
})
