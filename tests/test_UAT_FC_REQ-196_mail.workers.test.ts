import { describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import {
  capturingMailer,
  InvalidMessageError,
  mailerFor,
  mailFrom,
  MailNotConfiguredError,
  MailSendError,
  RESEND_ENDPOINT,
  resendMailer,
  type MailEnv,
  type Message,
} from '../apps/control-app/src/mail'

/**
 * [[REQ-196]] — **the sender exists, and the thing the tests run cannot send.**
 *
 * IN WORKERD BECAUSE THAT IS WHERE IT RUNS. The adapter is an HTTPS call built
 * out of `fetch`, `Response` and `crypto` as the Workers runtime supplies them; a
 * Node-project proof of the same code would be a proof about a different
 * runtime's globals.
 *
 * NO TEST HERE CAN REACH RESEND, and that is asserted rather than asserted-by-
 * convention: every send goes through a `fetch` double this file hands in, and
 * the one test that exercises the LOCAL adapter proves the double was never
 * called at all. The falsifier [[REQ-196]] names is *a code path where running
 * the tests can send mail*; the last test in this file is aimed straight at it.
 */

const MESSAGE: Message = {
  to: 'alice@example.com',
  from: 'no-reply@1stcontact.io',
  subject: 'Your 1st Contact invitation',
  body: 'Alice — your builder is ready.',
}

/** A `fetch` that answers as Resend does, and records what it was asked. */
function acceptingFetch(id = 'msg_0123456789') {
  return vi.fn(async () => new Response(JSON.stringify({ id }), { status: 200 }))
}

describe('REQ-196 — a sendEmail port, with Resend behind it', () => {
  it('test_UAT_FC_REQ-196_resend_adapter_sends_and_returns_the_provider_message_id', async () => {
    // The whole contract of the deployed adapter, against a double: the address
    // it posts to, the credential it presents, the shape it sends, and the id it
    // reads back. `providerId` is the one field REQ-198 joins a later delivery or
    // bounce event on, so returning it is not optional and is asserted here.
    const fetchDouble = acceptingFetch('msg_deadbeef')
    const send = resendMailer('re_test_key', fetchDouble as unknown as typeof fetch)

    const sent = await send(MESSAGE)

    expect(sent.providerId).toBe('msg_deadbeef')
    expect(fetchDouble).toHaveBeenCalledTimes(1)
    const [url, init] = fetchDouble.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(RESEND_ENDPOINT)
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer re_test_key')
    expect(JSON.parse(init.body as string)).toEqual({
      from: 'no-reply@1stcontact.io',
      to: ['alice@example.com'],
      subject: 'Your 1st Contact invitation',
      // `html` IS THE BODY AS AUTHORED ([[REQ-199]]) — the templates put the
      // call to action in an anchor, and text alone would deliver the markup for
      // the recipient to read. `text` IS DERIVED FROM IT and is not a second
      // authored field ([[REQ-205]]); this body is prose, so the two agree
      // exactly.
      html: 'Alice — your builder is ready.',
      text: 'Alice — your builder is ready.',
    })
  })

  it('test_UAT_FC_REQ-196_a_refused_send_is_reported_to_the_caller', async () => {
    // "A send failure is reported to the caller rather than swallowed." An
    // operator who presses invite and is shown a success while the provider
    // refused the message is exactly the silence this ticket exists to remove —
    // so the status and the provider's own words come back with the error.
    const fetchDouble = vi.fn(
      async () => new Response('{"message":"domain is not verified"}', { status: 403 }),
    )
    const send = resendMailer('re_test_key', fetchDouble as unknown as typeof fetch)

    await expect(send(MESSAGE)).rejects.toBeInstanceOf(MailSendError)
    await expect(send(MESSAGE)).rejects.toThrow(/403/)
    await expect(send(MESSAGE)).rejects.toThrow(/domain is not verified/)
  })

  it('test_UAT_FC_REQ-196_an_accepted_send_with_no_message_id_is_a_failure', async () => {
    // Accepted-with-no-id is a success nothing can record. REQ-198 has no other
    // way to join a bounce back to what we sent, so this fails here rather than
    // leaving a hole that first shows up the day a message bounces.
    const fetchDouble = vi.fn(async () => new Response('{}', { status: 200 }))
    const send = resendMailer('re_test_key', fetchDouble as unknown as typeof fetch)

    await expect(send(MESSAGE)).rejects.toBeInstanceOf(MailSendError)
    await expect(send(MESSAGE)).rejects.toThrow(/no message id/)
  })

  it('test_UAT_FC_REQ-196_the_local_adapter_records_and_performs_no_network_call', async () => {
    // The local adapter is what development and the suite get. It records, it
    // returns a `local_`-prefixed id so the record path has the same shape it has
    // in production, and it delivers nothing.
    const mailer = capturingMailer()

    const sent = await mailer.send(MESSAGE)

    expect(sent.providerId).toMatch(/^local_[0-9a-f]{32}$/)
    expect(mailer.sent).toEqual([MESSAGE])
  })

  it('test_UAT_FC_REQ-196_both_adapters_refuse_the_same_unsendable_message', async () => {
    // The two adapters agree on what a message IS, deliberately. If the local one
    // accepted what the provider rejects, the suite would prove nothing about
    // whether a message is sendable — every fixture would pass and the first real
    // send would be the first check.
    const local = capturingMailer()
    const remote = resendMailer('re_test_key', acceptingFetch() as unknown as typeof fetch)
    const headless = { ...MESSAGE, subject: '   ' }

    await expect(local.send(headless)).rejects.toBeInstanceOf(InvalidMessageError)
    await expect(remote(headless)).rejects.toBeInstanceOf(InvalidMessageError)
    expect(local.sent).toEqual([])
  })

  it('test_UAT_FC_REQ-196_the_from_address_is_configuration_and_absent_is_a_refusal', () => {
    // The From address is configuration rather than a literal at a call site, and
    // there is no default: a fallback would be a second, undeclared sending
    // address appearing exactly when the configured one went missing, and mail
    // from an address nobody registered is binned — indistinguishable from mail
    // that was never sent.
    expect(mailFrom({ MAIL_FROM: 'no-reply@1stcontact.io' })).toBe('no-reply@1stcontact.io')
    expect(() => mailFrom({})).toThrow(MailNotConfiguredError)
    expect(() => mailFrom({ MAIL_FROM: '  ' })).toThrow(MailNotConfiguredError)
  })

  it('test_UAT_FC_REQ-196_the_credential_is_the_only_thing_that_selects_a_real_send', async () => {
    // No mode var, no NODE_ENV, no "is this a test" predicate — every one of
    // those is a thing that can be set wrongly, and the cost of setting one
    // wrongly is a fixture mailing somebody on the beta list. An env with a key
    // sends; an env without one records, and never touches the network it was
    // handed.
    const withKey = acceptingFetch('msg_real')
    const withoutKey = acceptingFetch('msg_never')

    const sentByProvider = await mailerFor(
      { RESEND_API_KEY: 're_test_key' },
      { fetch: withKey as unknown as typeof fetch },
    )(MESSAGE)
    const recordedLocally = await mailerFor(
      {},
      { fetch: withoutKey as unknown as typeof fetch },
    )(MESSAGE)

    expect(sentByProvider.providerId).toBe('msg_real')
    expect(withKey).toHaveBeenCalledTimes(1)
    expect(recordedLocally.providerId).toMatch(/^local_/)
    expect(withoutKey).not.toHaveBeenCalled()
  })

  it('test_UAT_FC_REQ-196_this_test_runtime_holds_no_mail_credential', async () => {
    // The falsifier, stated as a test. The suite's own runtime carries no Resend
    // key, so `mailerFor` on it cannot return the adapter that sends — which is
    // what makes "no test can reach a real provider" a property of the
    // environment rather than a habit every future test author has to keep.
    const runtime = env as unknown as MailEnv
    expect(runtime.RESEND_API_KEY).toBeUndefined()

    const sent = await mailerFor(runtime)(MESSAGE)
    expect(sent.providerId).toMatch(/^local_/)
  })
})
