import { describe, expect, it, vi } from 'vitest'
import {
  capturingMailer,
  InvalidMessageError,
  resendMailer,
  textFrom,
  type Message,
} from '../apps/control-app/src/mail'
import { renderTemplate, SEED_TEMPLATES, TEMPLATE_KEYS } from '../apps/control-app/src/templates'
import type { Ticket } from '../apps/control-app/src/tickets'

/**
 * [[REQ-205]] — **every message carries a plain-text part, and it is derived
 * rather than authored.**
 *
 * WHY THIS EXISTS AT ALL. A real invite from this deployment authenticated — SPF,
 * DKIM and DMARC all passing — and landed in spam. Authentication is not
 * reputation: a filter with no history for a domain falls back to what the
 * message looks like, and an HTML-only mail carrying a button and a bare pasted
 * URL looks like credential phishing. HTML-only is among the most commonly
 * weighted heuristics, and a second part is the largest technical lever
 * available without changing provider.
 *
 * THE FALSIFIER, AND MOST OF THIS FILE: *a text part that reaches a recipient
 * without the link the HTML part carries*. A text alternative that has quietly
 * lost the only route in is worse than none — the recipient whose client prefers
 * text gets a message they cannot act on, and nothing on our side looks wrong.
 * So the invariant is asserted over every template this repository ships rather
 * than over one hand-written example.
 *
 * IN WORKERD BECAUSE THAT IS WHERE IT RUNS, and against a `fetch` double because
 * a test that reached Resend would either fail without a credential or, far
 * worse, succeed with one ([[REQ-196]]).
 */

const MESSAGE: Message = {
  to: 'alice@example.com',
  from: '1st Contact <invite@1stcontact.io>',
  subject: 'Your invitation',
  body: '<p>Alice — your builder is ready.</p>',
}

const CTA = 'https://app.1stcontact.io/sign-in/invite-token-abc?next=%2Fbuilder'

/** A `fetch` that answers as Resend does, and records what it was asked. */
const acceptingFetch = () =>
  vi.fn(async () => new Response(JSON.stringify({ id: 'msg_req205' }), { status: 200 }))

/** The body Resend was handed, as the adapter built it. */
function payloadOf(fetchDouble: ReturnType<typeof acceptingFetch>): Record<string, unknown> {
  const [, init] = fetchDouble.mock.calls[0] as unknown as [string, RequestInit]
  return JSON.parse(init.body as string)
}

/** Every URL an `href` names in a piece of HTML — the thing the text must carry. */
function hrefsIn(html: string): string[] {
  return [...html.matchAll(/href\s*=\s*"([^"]*)"/gi)].map(([, url]) => url.replace(/&amp;/g, '&'))
}

/** A seed template as a ticket, so the shipped renderer can render it. */
function seedTicket(key: (typeof TEMPLATE_KEYS)[number]): Ticket {
  const seed = SEED_TEMPLATES[key]
  return {
    uid: `template-${key}`,
    type: 'template',
    title: seed.title,
    body: seed.body,
    fields: { template_key: key, subject: seed.subject, placeholders: [...seed.placeholders] },
  } as unknown as Ticket
}

describe('REQ-205 — the derived text part', () => {
  it('test_UAT_FC_REQ-205_a_sent_message_carries_both_an_html_part_and_a_text_part', async () => {
    // The acceptance in its plainest form, asserted on what was handed to the
    // provider rather than on the source: two parts leave the building, and only
    // one of them was written. `html` is the body verbatim — nothing about the
    // authored part changes — and `text` is its derivation, with no markup left
    // in it for a recipient to read.
    const fetchDouble = acceptingFetch()

    await resendMailer('re_test_key', fetchDouble as unknown as typeof fetch)(MESSAGE)

    const payload = payloadOf(fetchDouble)
    expect(payload.html).toBe(MESSAGE.body)
    expect(payload.text).toBe('Alice — your builder is ready.')
    expect(String(payload.text)).not.toMatch(/<[a-z/]/i)
  })

  it('test_UAT_FC_REQ-205_every_url_in_an_href_appears_in_the_text_part', async () => {
    // THE FALSIFIER, over every template this repository ships rather than over
    // one example — the invite's button is the only route in, and a text part
    // that dropped it would produce a beta user who cannot get in and does not
    // know why. Rendered through the shipped renderer so the URL under test is
    // the one a real send would carry.
    for (const key of TEMPLATE_KEYS) {
      // EVERY TOKEN THE TEMPLATE DECLARES, not just the link. [[REQ-223]]'s
      // asset template declares a second one, and supplying only the first
      // would test that the OTHER templates keep their links rather than that
      // each template does.
      const values: Record<string, string> = { cta_url: CTA }
      for (const token of SEED_TEMPLATES[key].placeholders) {
        values[token] ??= `a value for ${token}`
      }
      const rendered = renderTemplate(seedTicket(key), values)
      const text = textFrom(rendered.body)
      const hrefs = hrefsIn(rendered.body)

      expect(hrefs.length, `the ${key} template carries no link to lose`).toBeGreaterThan(0)
      for (const href of hrefs) {
        expect(text, `the ${key} template's text part lost ${href}`).toContain(href)
      }
    }
  })

  it('test_UAT_FC_REQ-205_an_anchor_renders_as_its_words_and_its_address', () => {
    // The words say what the link is for and the address is the part that can be
    // pasted, so both are kept — a text part carrying `Accept your invitation`
    // and no URL is exactly the message with no way to act on it.
    const text = textFrom(`<p><a href="${CTA}" style="color:#fff">Accept your invitation</a></p>`)

    expect(text).toBe(`Accept your invitation <${CTA}>`)
  })

  it('test_UAT_FC_REQ-205_an_anchor_whose_words_are_its_address_renders_once', () => {
    // Every template carries the call to action as a button AND the same URL
    // again as pasteable text, which is right in HTML and reads as a stutter in
    // plain text.
    expect(textFrom(`<p><a href="${CTA}">${CTA}</a></p>`)).toBe(CTA)
  })

  it('test_UAT_FC_REQ-205_the_text_reads_as_the_page_reads_rather_than_as_the_file_looks', () => {
    // Block boundaries are the breaks that mean something; the newlines a
    // template body is wrapped with mean nothing in HTML and must not survive as
    // ragged lines. Entities are decoded, and markup that is ABOUT the message
    // rather than part of it does not become text.
    const text = textFrom(
      [
        '<style>p{color:red}</style>',
        '<p>Hello,</p>',
        '<p>You have been invited &mdash; everything is ready,',
        'and there is no password to choose.</p>',
        '<div>Line one<br>Line two</div>',
      ].join('\n'),
    )

    expect(text).toBe(
      [
        'Hello,',
        '',
        'You have been invited — everything is ready, and there is no password to choose.',
        '',
        'Line one',
        '',
        'Line two',
      ].join('\n'),
    )
  })

  it('test_UAT_FC_REQ-205_a_body_with_no_derivable_text_is_refused_before_any_network_call', async () => {
    // Deriving nothing from a non-empty body means the derivation failed on
    // something it did not understand, and sending an empty text part is the
    // failure the part exists to prevent. It is refused in the check BOTH
    // adapters share, so the suite cannot pass a message the provider would be
    // handed with a hole in it — and the refusal arrives before the provider is
    // reached at all.
    const fetchDouble = acceptingFetch()
    const remote = resendMailer('re_test_key', fetchDouble as unknown as typeof fetch)
    const local = capturingMailer()
    const wordless = { ...MESSAGE, body: '<style>p{color:red}</style><img src="hero.png">' }

    await expect(remote(wordless)).rejects.toBeInstanceOf(InvalidMessageError)
    await expect(local.send(wordless)).rejects.toBeInstanceOf(InvalidMessageError)
    expect(fetchDouble, 'the provider was reached with an underivable body').not.toHaveBeenCalled()
    expect(local.sent).toEqual([])
  })

  it('test_UAT_FC_REQ-205_both_adapters_still_agree_on_what_a_sendable_message_is', async () => {
    // The two adapters agree by construction, and the derivation happens for
    // both ([[REQ-196]]). If the local one accepted a body the provider's
    // adapter refuses, the suite would prove nothing about whether a message is
    // sendable and the first real send would be the first check.
    const fetchDouble = acceptingFetch()
    const remote = resendMailer('re_test_key', fetchDouble as unknown as typeof fetch)
    const local = capturingMailer()

    await expect(local.send(MESSAGE)).resolves.toBeTruthy()
    await expect(remote(MESSAGE)).resolves.toBeTruthy()
    expect(payloadOf(fetchDouble).text).toBe(textFrom(MESSAGE.body))
  })
})
