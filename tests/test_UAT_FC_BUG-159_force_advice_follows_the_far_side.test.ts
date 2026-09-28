import { describe, expect, it } from 'vitest'
import { copyChats, copySite, CLASS_ROUTES } from '../tools/generate/src/cli/copy'

/**
 * BUG-159 — `--force` is advised on the refusal it answers, and on no other.
 *
 * THE BUG, STATED ONCE. A `--chats` copy refused for an address it could not
 * re-derive ([[BUG-137]]) came back with *"Pass --force to replace it anyway"*. No
 * value of `--force` changes that outcome: `writeChats` re-addresses before
 * `payload.force` is consulted at all, so the flag never reaches the decision. The
 * operator was told to answer yes to a question nobody asked, and the one they did
 * ask went unanswered.
 *
 * AND THE FIX IS NOT A SECOND STATUS CODE. Both import routes answer 409 to
 * refusals the flag cannot touch — a business holding two sites, a history carrying
 * an unresolvable address — and the far side ALREADY tells them apart: `/api/import`
 * names `force` in the body of exactly the 409 the flag answers, *"so a caller that
 * is not a person can tell 'refused, and here is the way to mean it' from 'refused'
 * without parsing a sentence"*. This side now reads that declaration instead of
 * re-deciding from the status.
 *
 * THROUGH THE COMMAND'S OWN ENTRY POINTS, with only the transport injected, the
 * shape [[REQ-289]]'s and [[REQ-294]]'s suites use and for their reason: the thing
 * under test is what the operator is told when a POST comes back refused.
 *
 * ITS OWN FAKE AND NOT THOSE SUITES'. Theirs record every call and assert on what
 * went out on the wire; this one needs a single refusal to come back and asserts
 * only on what is reported for it, so it answers the four routes and keeps nothing.
 */

const LOCAL = 'http://local.test'
const CLOUD = 'https://cloud.test'

/** The history the local end exports — one ordinary, re-addressable conversation. */
const HISTORY = {
  business: 'biz_local',
  chats: [
    {
      sessionId: 'site-site_local',
      title: 'Lagrange Foundry — initial website build',
      status: 'open',
      body: '### Decision 1\n\nDrop the carousel.\n',
      fields: { session_id: 'site-site_local', backend: 'claude+site:site_local' },
      comments: [{ kind: 'chat_transcript', body: '- user: too busy\n' }],
    },
  ],
}

/** The site the local end exports. Only its refusal matters, so it is minimal. */
const SITE = { slug: 'lagrange-foundry', pages: [], assets: [], references: [] }

/** A `fetch` answering as two builders, with the destination's import refusing. */
function twoBuilders(refusal: { status: number; body: unknown }) {
  return (async (url: string, init: RequestInit) => {
    const parsed = new URL(url)
    const answer = (status: number, body: unknown) => ({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(JSON.stringify(body)),
    })
    if (parsed.pathname === '/api/businesses') {
      const id = parsed.origin === CLOUD ? 'biz_cloud' : 'biz_local'
      return answer(200, {
        person: null,
        businesses: [{ id, name: 'Lagrange Foundry', selectable: true, lapse: null }],
      })
    }
    if (parsed.pathname.endsWith(CLASS_ROUTES.chats.read)) return answer(200, HISTORY)
    if (parsed.pathname.endsWith('/api/export')) return answer(200, SITE)
    if (init.method === 'POST') return answer(refusal.status, refusal.body)
    return answer(404, { error: `no route ${parsed.pathname}` })
  }) as unknown as typeof fetch
}

const toCloud = { direction: 'to-cloud' as const, local: LOCAL, cloud: CLOUD }

describe('BUG-159 — the advice on a refusal is the far side\'s statement', () => {
  it('test_UAT_FC_BUG-159_a_refusal_force_cannot_answer_does_not_advise_force', async () => {
    // THE OBSERVED REFUSAL, 2026-09-26, quoted from the run this bug was filed on.
    // `--force` cannot reach this decision, so it must not be offered as the answer
    // to it — while the far side's own sentence and the ids it named must still
    // reach the operator, because that is the question they actually have.
    const refused = await copyChats('Lagrange Foundry', {
      ...toCloud,
      fetch: twoBuilders({
        status: 409,
        body: {
          error:
            '9 conversation(s) carry a session id that says it is about a site or a ' +
            'business and then names neither, so there is nothing to re-address them ' +
            'onto. Nothing was written.',
          sessions: ['site-', 'business-'],
        },
      }),
    }).then(
      () => null,
      (err: Error) => err,
    )

    expect(refused).toBeInstanceOf(Error)
    const message = String((refused as Error).message)
    expect(message).toContain("Copy of 'Lagrange Foundry's conversations was refused with 409")
    expect(message).toContain('nothing to re-address them onto')
    expect(message).toContain('site-')
    // THE ADVICE THAT CANNOT HELP IS ABSENT. Not softened, not reworded: a flag
    // that changes nothing about this outcome has no business being named.
    expect(message).not.toContain('--force')
  })

  it('test_UAT_FC_BUG-159_the_refusal_force_can_answer_still_advises_it', async () => {
    // BUG-51's GUARD, UNCHANGED, AND THIS IS WHAT THE FIX MUST NOT COST. The far
    // side is protecting builder-authored changes and has said how many; all this
    // side owes is the flag that says yes. It is offered because the route DECLARED
    // it in the body, which is the only thing that changed about how it is decided.
    const refused = await copySite('Lagrange Foundry', {
      ...toCloud,
      fetch: twoBuilders({
        status: 409,
        body: {
          error:
            "Site 'site_936dd7c92e5e14df694dd9a80433aa4f' has 190 change(s) made in " +
            'the builder. Importing would replace them. Nothing was written.',
          slug: 'lagrange-foundry',
          changes: 190,
          force: 'Re-send with "force": true (bin/copy-to-cloud --force).',
        },
      }),
    }).then(
      () => null,
      (err: Error) => err,
    )

    expect(refused).toBeInstanceOf(Error)
    const message = String((refused as Error).message)
    expect(message).toContain('190 change(s)')
    expect(message).toContain('Pass --force to replace it anyway. Nothing was written.')
  })

  it('test_UAT_FC_BUG-159_a_409_the_far_side_said_nothing_about_advises_nothing', async () => {
    // ABSENT MEANS NO, which is the safe direction for advice. `/api/import` answers
    // 409 to a business holding two sites as well — a refusal `--force` cannot touch
    // either, and one that declares no flag. Advising on the status alone named the
    // flag here too; reading the declaration suppresses it without a second rule.
    const refused = await copySite('Lagrange Foundry', {
      ...toCloud,
      fetch: twoBuilders({
        status: 409,
        body: {
          error:
            "This business holds 2 sites, so 'lagrange-foundry' has no unambiguous " +
            'destination. Nothing was written.',
          slug: 'lagrange-foundry',
          sites: 2,
        },
      }),
    }).then(
      () => null,
      (err: Error) => err,
    )

    expect(String((refused as Error).message)).toContain('holds 2 sites')
    expect(String((refused as Error).message)).not.toContain('--force')
  })
})
