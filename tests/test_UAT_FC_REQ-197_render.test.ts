import { describe, expect, it } from 'vitest'
import {
  SEED_TEMPLATES,
  TEMPLATE_KEYS,
  TemplateRefusedError,
  renderTemplate,
} from '../apps/control-app/src/templates'
import type { Ticket } from '../apps/control-app/src/tickets'

/**
 * REQ-197 — **the placeholder contract**.
 *
 * WHY THIS RUNS IN NODE AND ITS SIBLING RUNS IN WORKERD. Rendering is a pure
 * function of a ticket and a set of values: it reads no binding, touches no
 * store, and would be proved by nothing extra if it were run inside workerd.
 * What DOES need a real store — that the type validates, that templates come out
 * of the tenant's own store and that one business cannot see another's — is
 * `test_UAT_FC_REQ-197_templates.workers.test.ts`, and it is a separate file for
 * exactly that reason.
 *
 * THE REFUSALS ARE THE SUBJECT OF THE FILE. [[REQ-197]] states the falsifier in
 * the round — "a rendered message containing an unsubstituted token, or a token
 * substituted with an empty string" — so every case below is an attempt to
 * produce one of those two things and an assertion that it was refused instead.
 */

/** A `template` ticket, as the store hands one back. */
function template(over: Partial<Ticket> & { fields?: Record<string, unknown> } = {}): Ticket {
  return {
    uid: 'template-0001',
    type: 'template',
    title: 'Invite email',
    status: null,
    human_id: null,
    fields: { template_key: 'invite', subject: 'Your invitation', placeholders: ['cta_url'] },
    links: [],
    body: '<p>Hello,</p><p><a href="{{cta_url}}">Accept</a></p><p>{{cta_url}}</p>',
    version: 1,
    archived: false,
    created_at: '2026-09-06T00:00:00.000Z',
    updated_at: '2026-09-06T00:00:00.000Z',
    ...over,
  } as Ticket
}

describe('REQ-197 — rendering substitutes, or it refuses', () => {
  it('UAT_FC_REQ-197 it substitutes every declared token, in the body and in the subject', () => {
    // The happy path, and the only one that produces a message at all. Both
    // halves are asserted because a renderer that filled the body and left the
    // subject alone would pass a body-only test and mail "Your invitation to
    // {{business}}" to a stranger.
    const rendered = renderTemplate(
      template({
        fields: {
          template_key: 'invite',
          subject: 'Your invitation, {{name}}',
          placeholders: ['cta_url', 'name'],
        },
        body: '<p>Hello {{name}},</p><p><a href="{{cta_url}}">Accept</a></p><p>{{cta_url}}</p>',
      }),
      { cta_url: 'https://app.1stcontact.io/i/abc123', name: 'Alice' },
    )

    expect(rendered.subject).toBe('Your invitation, Alice')
    expect(rendered.body).toContain('Hello Alice,')
    // EVERY occurrence, not the first: the button and the pasteable fallback are
    // the same token twice, and a renderer that replaced one would produce the
    // dead-link mail this whole contract exists to prevent.
    expect(rendered.body.match(/https:\/\/app\.1stcontact\.io\/i\/abc123/g)).toHaveLength(2)
    expect(rendered.body).not.toContain('{{')
    // The record REQ-198 writes has to be able to name the exact copy that was
    // sent, which is a ticket and not a key.
    expect(rendered.templateKey).toBe('invite')
    expect(rendered.templateUid).toBe('template-0001')
  })

  it('UAT_FC_REQ-197 a declared token with no value refuses, and the refusal names the template and the token', () => {
    // The concrete failure REQ-197 describes: an invite whose {{cta_url}} never
    // got substituted is a mail with a dead button that reaches the recipient
    // looking entirely normal.
    let caught: unknown
    try {
      renderTemplate(template(), {})
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(TemplateRefusedError)
    const err = caught as TemplateRefusedError
    expect(err.templateKey).toBe('invite')
    expect(err.token).toBe('cta_url')
    // Named in the message too, not only on the object — the operator reads the
    // string, and "a placeholder is missing" would send them through three
    // templates looking for which one.
    expect(err.message).toContain('invite')
    expect(err.message).toContain('{{cta_url}}')
    expect(err.message).toContain('template-0001')
  })

  it('UAT_FC_REQ-197 an empty value is a missing value', () => {
    // Substituting "" produces exactly the mail the refusal exists to prevent —
    // a button whose href is nothing — while reporting success, which is worse
    // than either honest outcome. Whitespace counts as empty for the same reason.
    expect(() => renderTemplate(template(), { cta_url: '' })).toThrow(TemplateRefusedError)
    expect(() => renderTemplate(template(), { cta_url: '   ' })).toThrow(TemplateRefusedError)
  })

  it('UAT_FC_REQ-197 a declared token absent from the body refuses', () => {
    // The declaration and the copy have come apart: the template promises to
    // carry a link and no longer does, so the one thing the message exists to
    // deliver is missing. Having a value for it does not make it sendable.
    let caught: unknown
    try {
      renderTemplate(
        template({ body: '<p>Hello,</p><p>Someone will be in touch.</p>' }),
        { cta_url: 'https://app.1stcontact.io/i/abc123' },
      )
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(TemplateRefusedError)
    expect((caught as TemplateRefusedError).token).toBe('cta_url')
    expect((caught as TemplateRefusedError).message).toContain('does not appear in its body')
  })

  it('UAT_FC_REQ-197 a token left in the copy but never declared still refuses', () => {
    // The falsifier stated in the round is about the RENDERED MESSAGE, not about
    // the declaration — so a token somebody added to the copy and forgot to
    // declare has to be caught by the same gate. Nothing goes out with a hole in
    // it, however the hole got there.
    expect(() =>
      renderTemplate(
        template({ body: '<p>Hello {{first_name}},</p><p><a href="{{cta_url}}">Accept</a></p><p>{{cta_url}}</p>' }),
        { cta_url: 'https://app.1stcontact.io/i/abc123' },
      ),
    ).toThrow(TemplateRefusedError)
  })

  it('UAT_FC_REQ-197 a template that declares nothing renders as written', () => {
    // `placeholders` is not required, and a template with no tokens is an
    // ordinary template — a notice that says the same thing to everybody.
    const rendered = renderTemplate(
      template({
        fields: { template_key: 'lapsed', subject: 'Your access has ended' },
        body: '<p>Your access has ended.</p>',
      }),
    )
    expect(rendered.body).toBe('<p>Your access has ended.</p>')
    expect(rendered.subject).toBe('Your access has ended')
  })
})

describe('REQ-197 — the three templates, and what the invite has to say', () => {
  it('UAT_FC_REQ-197 there are exactly three templates: invite, signin and lapsed', () => {
    expect([...TEMPLATE_KEYS]).toEqual(['invite', 'signin', 'lapsed'])
    expect(Object.keys(SEED_TEMPLATES).sort()).toEqual(['invite', 'lapsed', 'signin'])
    // Each is complete enough to send the moment it is seeded: a subject, a
    // body, and a declaration that its own body satisfies.
    for (const key of TEMPLATE_KEYS) {
      const seed = SEED_TEMPLATES[key]
      expect(seed.subject.trim()).not.toBe('')
      expect(seed.body.trim()).not.toBe('')
      for (const token of seed.placeholders) expect(seed.body).toContain(`{{${token}}}`)
    }
  })

  it('UAT_FC_REQ-197 the invite carries a welcome, a button, and the URL again as pasteable text', () => {
    // REQ-197 states all three parts explicitly, "because the copy is content
    // and content is what gets forgotten".
    const body = SEED_TEMPLATES.invite.body

    // 1 — a welcome message.
    expect(body).toMatch(/Hello/i)
    expect(body).toMatch(/invited/i)

    // 2 — the call to action AS A BUTTON. An anchor at the link, styled as a
    // block rather than left as inline text: that styling is the whole
    // difference between a button and a sentence with an underline in it.
    const anchor = body.match(/<a\s[^>]*href="\{\{cta_url\}\}"[^>]*>/)
    expect(anchor).not.toBeNull()
    expect(anchor?.[0]).toContain('display:inline-block')

    // 3 — the same URL again, in full, OUTSIDE any anchor, with wording telling
    // the reader why it is there. This is the part that is not decoration: a
    // meaningful share of clients strip or mangle styled anchors, and the button
    // is the only route in, so without this those recipients are lost silently.
    const outsideAnchors = body.replace(/<a\s[\s\S]*?<\/a>/g, '')
    expect(outsideAnchors).toContain('{{cta_url}}')
    expect(outsideAnchors).toMatch(/does not work/i)
    expect(outsideAnchors).toMatch(/paste/i)

    // And it renders to a real address in both places, which is the claim the
    // fallback actually makes.
    const rendered = renderTemplate(
      {
        uid: 'template-seed',
        type: 'template',
        title: SEED_TEMPLATES.invite.title,
        status: null,
        human_id: null,
        fields: {
          template_key: 'invite',
          subject: SEED_TEMPLATES.invite.subject,
          placeholders: [...SEED_TEMPLATES.invite.placeholders],
        },
        links: [],
        body,
        version: 1,
        archived: false,
        created_at: '2026-09-06T00:00:00.000Z',
        updated_at: '2026-09-06T00:00:00.000Z',
      } as Ticket,
      { cta_url: 'https://app.1stcontact.io/i/abc123' },
    )
    expect(rendered.body.match(/https:\/\/app\.1stcontact\.io\/i\/abc123/g)?.length).toBeGreaterThanOrEqual(2)
    expect(rendered.body.replace(/<a\s[\s\S]*?<\/a>/g, '')).toContain(
      'https://app.1stcontact.io/i/abc123',
    )
  })

  it('UAT_FC_REQ-197 the seed copy names no business, so it is not our mail in a customer\'s name', () => {
    // The same seed is written into whichever business asks for one. Naming 1st
    // Contact in it would put our name in a plumber's mail to their own
    // customers — [[DOC-40]] §2.1 rule 1's failure mode reached from the copy
    // side rather than the code side.
    for (const key of TEMPLATE_KEYS) {
      expect(SEED_TEMPLATES[key].body).not.toMatch(/1st ?Contact/i)
      expect(SEED_TEMPLATES[key].subject).not.toMatch(/1st ?Contact/i)
    }
  })
})
