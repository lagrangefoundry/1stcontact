import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { productTypePack, ticketStoreFor, type TicketStoreEnv } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import {
  SEED_TEMPLATES,
  TEMPLATE_KEYS,
  TEMPLATE_TYPE,
  TemplateRefusedError,
  ensureTemplates,
  renderTemplate,
  templateFor,
} from '../apps/control-app/src/templates'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-197 — **templates are tenant tickets**, proved against a real store.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd, through the
 * same `ticketStoreFor` the Worker calls, against a real D1 database whose
 * tables come from `db/migrations`. So what is proved is that the type validates
 * in the deployed pack and that a template genuinely comes out of the business
 * that owns it — neither of which a fake store could tell us anything about.
 *
 * THE TENANCY CASE IS THE POINT OF THE FILE. [[REQ-197]] rests its whole design
 * on templates living in the tenant's own store: that is what gives a customer
 * their own templates for their own contacts with no second code path. A claim
 * of that shape is worth exactly as much as the test that two businesses cannot
 * see each other's, so that case is here rather than asserted in a comment.
 */

const TENANT_A = 'req197-a'
const TENANT_B = 'req197-b'

const scopeOf = (businessId: string): Scope => ({ businessId })

function storeEnv(): TicketStoreEnv {
  return { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }
}

/** D1 stamps `created_at` to the millisecond, so "newest" needs a real gap. */
const tick = () => new Promise((r) => setTimeout(r, 5))

beforeAll(async () => {
  await applySchema()
})

describe('REQ-197 — the type', () => {
  it('UAT_FC_REQ-197 `template` is a registered type and a template round-trips through the store', async () => {
    // Registration in the pack is what the acceptance asks for, and it is not a
    // claim about a literal in a file: an unregistered type is REFUSED by the
    // store, so a create that lands is the registration.
    expect(productTypePack().has(TEMPLATE_TYPE)).toBe(true)

    const store = await ticketStoreFor(storeEnv(), scopeOf(TENANT_A))
    const { ticket } = await store.create({
      type: TEMPLATE_TYPE,
      title: 'Invite email',
      fields: { template_key: 'invite', subject: 'Come in', placeholders: ['cta_url'] },
      body: '<p><a href="{{cta_url}}">Accept</a></p><p>{{cta_url}}</p>',
    })

    const fresh = await ticketStoreFor(storeEnv(), scopeOf(TENANT_A))
    const { ticket: read } = await fresh.get({ uid: ticket.uid })
    expect(read.type).toBe(TEMPLATE_TYPE)
    expect(read.fields.template_key).toBe('invite')
    expect(read.fields.subject).toBe('Come in')
    expect(read.fields.placeholders).toEqual(['cta_url'])
    expect(read.body).toContain('{{cta_url}}')
  })

  it('UAT_FC_REQ-197 a template without a key, a subject or a body is refused', async () => {
    // The three fields the sender cannot do without. A template missing any of
    // them is not a template that fails at send time — it never gets written.
    const store = await ticketStoreFor(storeEnv(), scopeOf(TENANT_A))
    const good = { template_key: 'signin', subject: 'Sign in', placeholders: [] }

    await expect(
      store.create({ type: TEMPLATE_TYPE, title: 'No key', fields: { subject: 'Hi' }, body: 'x' }),
    ).rejects.toThrow()
    await expect(
      store.create({
        type: TEMPLATE_TYPE,
        title: 'No subject',
        fields: { template_key: 'signin' },
        body: 'x',
      }),
    ).rejects.toThrow()
    await expect(
      store.create({ type: TEMPLATE_TYPE, title: 'No body', fields: good, body: '' }),
    ).rejects.toThrow()
    // And the key is a closed vocabulary — an authoring typo is refused at the
    // write rather than discovered by a lookup that finds nothing.
    await expect(
      store.create({
        type: TEMPLATE_TYPE,
        title: 'Wrong key',
        fields: { ...good, template_key: 'sign-in' },
        body: 'x',
      }),
    ).rejects.toThrow()
  })
})

describe('REQ-197 — three templates, in the business that owns them', () => {
  it('UAT_FC_REQ-197 a business that has never had templates is given all three, once', async () => {
    const store = await ticketStoreFor(storeEnv(), scopeOf(TENANT_B))
    const seeded = await ensureTemplates(store)
    expect(seeded.map((t) => t.fields.template_key).sort()).toEqual([
      'invite',
      'lapsed',
      'signin',
    ])

    // SEED-IF-ABSENT, not seed-unconditionally: a second pass must not leave the
    // business with six templates, three of which quietly outrank the copy
    // somebody wrote.
    const again = await ensureTemplates(store)
    expect(again.map((t) => t.uid).sort()).toEqual(seeded.map((t) => t.uid).sort())

    const { tickets } = await store.query({ predicate: `type=${TEMPLATE_TYPE}`, limit: 'all' })
    expect(tickets).toHaveLength(3)
  })

  it('UAT_FC_REQ-197 a customer business holds its own templates, and cannot see another business\'s', async () => {
    // The claim [[REQ-197]]'s design rests on, and it is asserted from both
    // sides: B's own three exist, and none of them is A's. There is no
    // platform-only branch anywhere in this path — TENANT_B reaches the same
    // code TENANT_A does.
    const a = await ticketStoreFor(storeEnv(), scopeOf(TENANT_A))
    const b = await ticketStoreFor(storeEnv(), scopeOf(TENANT_B))
    await ensureTemplates(a)
    await ensureTemplates(b)

    const aInvite = await templateFor(a, 'invite')
    const bInvite = await templateFor(b, 'invite')
    expect(bInvite.uid).not.toBe(aInvite.uid)
    await expect(b.get({ uid: aInvite.uid })).rejects.toThrow()

    // And editing one business's copy leaves the other's alone — which is what
    // "their own templates" has to mean to be worth anything.
    await b.update({
      uid: bInvite.uid,
      patch: { body: '<p>Alice’s Plumbing welcomes you.</p><p><a href="{{cta_url}}">In</a></p><p>{{cta_url}}</p>' },
    })
    expect((await templateFor(b, 'invite')).body).toContain('Plumbing')
    expect((await templateFor(a, 'invite')).body).not.toContain('Plumbing')
  })

  it('UAT_FC_REQ-197 replacing a template is writing a new ticket, and the old one survives', async () => {
    // [[REQ-197]]: the sender looks up by `template_key` and not by uid, so the
    // newest ticket carrying the key is the one that sends — and the ticket
    // [[REQ-198]]'s records already point at is still there to be read.
    const store = await ticketStoreFor(storeEnv(), scopeOf('req197-replace'))
    const first = await templateFor(store, 'invite')
    await tick()
    const { ticket: second } = await store.create({
      type: TEMPLATE_TYPE,
      title: 'Invite email (rewritten)',
      fields: { template_key: 'invite', subject: 'A new subject', placeholders: ['cta_url'] },
      body: '<p>Rewritten.</p><p><a href="{{cta_url}}">Accept</a></p><p>{{cta_url}}</p>',
    })

    const inForce = await templateFor(store, 'invite')
    expect(inForce.uid).toBe(second.uid)
    expect(inForce.fields.subject).toBe('A new subject')

    const { ticket: old } = await store.get({ uid: first.uid })
    expect(old.uid).toBe(first.uid)
    expect(old.body).toBe(SEED_TEMPLATES.invite.body)
  })
})

describe('REQ-197 — end to end, from the store to a refusal', () => {
  it('UAT_FC_REQ-197 a seeded template renders a real message, and refuses without the link', async () => {
    const store = await ticketStoreFor(storeEnv(), scopeOf('req197-render'))
    for (const key of TEMPLATE_KEYS) {
      const template = await templateFor(store, key)
      const rendered = renderTemplate(template, { cta_url: 'https://app.1stcontact.io/i/xyz' })
      expect(rendered.body).toContain('https://app.1stcontact.io/i/xyz')
      expect(rendered.body).not.toContain('{{')
      expect(rendered.templateUid).toBe(template.uid)

      // The refusal, through the real ticket rather than a fixture: nothing is
      // rendered, so nothing can be sent.
      expect(() => renderTemplate(template, {})).toThrow(TemplateRefusedError)
    }
  })

  it('UAT_FC_REQ-197 copy edited on the ticket is what gets rendered, with no deploy', async () => {
    // The reason a message body is a ticket at all: the operator changes the
    // words and the next message says them.
    const store = await ticketStoreFor(storeEnv(), scopeOf('req197-edit'))
    const template = await templateFor(store, 'signin')
    await store.update({
      uid: template.uid,
      patch: {
        fields: { subject: 'Your link is ready' },
        body: '<p>Rewritten by the operator.</p><p><a href="{{cta_url}}">Sign in</a></p><p>{{cta_url}}</p>',
      },
    })

    const rendered = renderTemplate(await templateFor(store, 'signin'), {
      cta_url: 'https://app.1stcontact.io/s/abc',
    })
    expect(rendered.subject).toBe('Your link is ready')
    expect(rendered.body).toContain('Rewritten by the operator.')
  })
})
