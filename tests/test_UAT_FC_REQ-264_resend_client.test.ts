import { describe, expect, it } from 'vitest'
import {
  ResendApiError,
  ResendNotPermittedError,
  resendFor,
} from '../apps/control-app/src/resend'

/**
 * [[REQ-264]] — **a refused credential is a statement about the deployment, and
 * the idempotency fallback is not an answer.**
 *
 * TWO DEFECTS, AND THE SECOND IS WHY THE FIRST WAS UNREADABLE. Attaching a
 * domain failed with *"Resend refused GET /domains (401). This API key is
 * restricted to only send emails"* — a listing failure, on a verb the operator
 * had not invoked. What actually happened is that `POST /domains` 401'd,
 * `createDomain` treated ANY 4xx as *"Resend already holds this domain"*,
 * entered its idempotency fallback, and the fallback's own `GET /domains` failed
 * with the same 401 — and THAT second error is the one that surfaced. The
 * original was discarded.
 *
 * SO BOTH HALVES ARE PINNED HERE: the fallback is entered only on the statuses
 * that mean *already exists*, and where the fallback fails the ORIGINAL refusal
 * is what the caller gets.
 *
 * WHAT MAKES THIS EVIDENCE. The shipped client, driven with a `fetch` double. A
 * suite holding a real key would not fail against the real API — it would
 * succeed, and register test domains on the account this product sends from.
 */

const KEY = 'do-not-print-me'

/** A `fetch` double answering by `METHOD path`, recording what was asked. */
function resend(table: Record<string, { status: number; body?: unknown }>) {
  const asked: string[] = []
  const fetchImpl = (async (url: string | URL, options: RequestInit = {}) => {
    const path = String(url).replace('https://api.resend.com', '')
    const key = `${options.method ?? 'GET'} ${path}`
    asked.push(key)
    const hit = table[key]
    if (hit === undefined) throw new Error(`no double for ${key}`)
    return new Response(JSON.stringify(hit.body ?? {}), {
      status: hit.status,
      headers: { 'content-type': 'application/json' },
    })
  }) as unknown as typeof fetch
  return { asked, client: resendFor({ RESEND_API_KEY: KEY }, fetchImpl)! }
}

const RESTRICTED = { message: 'This API key is restricted to only send emails' }

describe('REQ-264 — the client tells a refusal from a failure', () => {
  it('test_UAT_FC_REQ-264_a_401_is_a_refused_credential_and_carries_our_words_not_the_providers', async () => {
    const { client } = resend({ 'POST /domains': { status: 401, body: RESTRICTED } })
    const err = await client.createDomain('alicesplumbing.com').catch((e: unknown) => e)

    expect(err).toBeInstanceOf(ResendNotPermittedError)
    // A SUBCLASS, so every caller that has always caught `ResendApiError` still
    // catches it — the difference is available to the ones that ask for it.
    expect(err).toBeInstanceOf(ResendApiError)

    // THE MESSAGE IS OURS. *"This API key is restricted to only send emails"* is
    // a sentence about our configuration, and it was being shown to somebody who
    // has no configuration.
    const said = (err as Error).message
    expect(said).not.toMatch(/API key/i)
    expect(said).not.toMatch(/Resend/)
    expect(said).toMatch(/cannot set a domain up for sending/)
    // AND THE PROVIDER'S SENTENCE IS KEPT WHERE AN OPERATOR CAN READ IT.
    expect((err as ResendNotPermittedError).detail).toBe(RESTRICTED.message)
    expect((err as ResendNotPermittedError).status).toBe(401)
  })

  it('test_UAT_FC_REQ-264_a_403_is_the_same_refusal_as_a_401', async () => {
    const { client } = resend({ 'GET /domains': { status: 403, body: RESTRICTED } })
    await expect(client.canManageDomains()).resolves.toBe(false)
  })

  it('test_UAT_FC_REQ-264_a_401_never_enters_the_idempotency_fallback', async () => {
    // THE FALLBACK EXISTS FOR ONE CASE — Resend already holds this domain — and
    // a credential refusal is not it. Entering it spends a request to learn
    // nothing and then answers with the wrong error.
    const { asked, client } = resend({ 'POST /domains': { status: 401, body: RESTRICTED } })
    await client.createDomain('alicesplumbing.com').catch(() => {})
    expect(asked).toEqual(['POST /domains'])
  })

  it('test_UAT_FC_REQ-264_a_duplicate_still_resolves_through_the_fallback', async () => {
    // AND THE FALLBACK STILL WORKS FOR WHAT IT IS FOR. A release whose Resend
    // delete failed, or an attach retried after a record write went wrong,
    // leaves a registration we put there; refusing on that would strand a
    // customer permanently.
    const domain = 'alicesplumbing.com'
    const { asked, client } = resend({
      'POST /domains': { status: 422, body: { message: 'domain already exists' } },
      'GET /domains': { status: 200, body: { data: [{ id: 'rsd-1', name: domain }] } },
      'GET /domains/rsd-1': {
        status: 200,
        body: {
          id: 'rsd-1',
          name: domain,
          status: 'pending',
          records: [{ type: 'TXT', name: 'send', value: 'v=spf1' }],
        },
      },
    })
    const made = await client.createDomain(domain)
    expect(made.id).toBe('rsd-1')
    // THE LIST ANSWERS WITHOUT RECORDS, so the registration is re-read by id — a
    // caller handed a domain with no records publishes nothing and waits forever.
    expect(made.records[0]?.name).toBe(`send.${domain}`)
    expect(asked).toEqual(['POST /domains', 'GET /domains', 'GET /domains/rsd-1'])
  })

  it('test_UAT_FC_REQ-264_where_the_fallback_fails_the_original_refusal_is_reported', async () => {
    // THE SECOND DEFECT. The fallback is a guess this module makes; the caller
    // asked for a registration, and the reason they did not get one is the
    // ORIGINAL refusal — not whatever went wrong while we were checking a hunch.
    const { client } = resend({
      'POST /domains': { status: 422, body: { message: 'validation failed on the name' } },
      'GET /domains': { status: 500, body: { message: 'Resend is having a bad day' } },
    })
    const err = await client.createDomain('alicesplumbing.com').catch((e: unknown) => e)
    expect((err as Error).message).toMatch(/POST \/domains \(422\)/)
    expect((err as Error).message).toMatch(/validation failed on the name/)
    expect((err as Error).message).not.toMatch(/bad day/)
  })

  it('test_UAT_FC_REQ-264_can_manage_domains_is_the_call_the_attach_makes', async () => {
    const full = resend({ 'GET /domains': { status: 200, body: { data: [] } } })
    await expect(full.client.canManageDomains()).resolves.toBe(true)
    expect(full.asked).toEqual(['GET /domains'])

    // A PROVIDER THAT COULD NOT BE REACHED IS NOT A CREDENTIAL THAT LACKS A
    // PERMISSION. Hiding the toggle over a transient would take a working
    // capability away from a customer who had no way to tell why.
    const down = resendFor({ RESEND_API_KEY: KEY }, (async () => {
      throw new Error('the network went away')
    }) as unknown as typeof fetch)!
    await expect(down.canManageDomains()).resolves.toBe(true)
  })

  it('test_UAT_FC_REQ-264_a_404_on_read_is_still_not_a_refusal', async () => {
    // THE DISTINCTION THAT WAS ALREADY THERE MUST SURVIVE. A domain deleted at
    // Resend by somebody else is an answer; a key without permission is not, and
    // the two must never arrive as the same thing.
    const { client } = resend({ 'GET /domains/rsd-9': { status: 404, body: {} } })
    await expect(client.readDomain('rsd-9')).resolves.toBeNull()

    const refused = resend({ 'GET /domains/rsd-9': { status: 403, body: RESTRICTED } })
    await expect(refused.client.readDomain('rsd-9')).rejects.toBeInstanceOf(
      ResendNotPermittedError,
    )
  })
})
