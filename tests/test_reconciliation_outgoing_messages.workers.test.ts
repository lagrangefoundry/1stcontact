import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import {
  InvalidMessageError,
  MailSendError,
  RESEND_ENDPOINT,
  mailerFor,
  type MailEnv,
  type Message,
} from '../apps/control-app/src/mail'
import {
  productTypePack,
  ticketStoreFor,
  type Ticket,
  type TicketStore,
  type TicketStoreEnv,
} from '../apps/control-app/src/tickets'
import {
  SEED_TEMPLATES,
  TEMPLATE_KEYS,
  TEMPLATE_TYPE,
  ensureTemplates,
  renderTemplate,
  templateFor,
} from '../apps/control-app/src/templates'
import { applySchema } from './support/d1-site-factory'

/**
 * Reconciliation UATs for story-7d255580 — **outgoing messages** (REQ-196 /
 * REQ-197), the workerd half.
 *
 * WHAT MAKES THIS EVIDENCE. The sender is driven through `mailerFor`, the one
 * entry point the Worker uses, with the provider's endpoint replaced by a
 * recording `fetch` double — the only boundary we do not own. Templates are
 * read and written through `ticketStoreFor` against a real D1 database and R2
 * bucket from `db/migrations`, so type validation, newest-wins ordering,
 * seeding and tenancy are all proved against the deployed pack.
 */

const MESSAGE: Message = {
  to: 'alice@example.com',
  from: 'no-reply@1stcontact.io',
  subject: 'A subject',
  body: '<p>A body</p>',
}

const KEY = 're_story7d255580_test_key'

/** A provider double that answers success with `id` and records each request. */
function providerDouble(answer: () => Response = () => Response.json({ id: 'msg_story7d25' })) {
  return vi.fn(async (_url: string, _init: RequestInit) => answer())
}

function storeEnv(): TicketStoreEnv {
  return { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }
}

const storeOf = (businessId: string) => ticketStoreFor(storeEnv(), { businessId })

async function templatesIn(store: TicketStore, key?: string): Promise<Ticket[]> {
  const predicate = key
    ? `type=${TEMPLATE_TYPE} AND fields.template_key=${key}`
    : `type=${TEMPLATE_TYPE}`
  return (await store.query({ predicate, limit: 'all' })).tickets
}

/** D1 stamps `created_at` to the millisecond, so "newest" needs a real gap. */
const tick = () => new Promise((r) => setTimeout(r, 5))

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('story-7d255580 — the sender', () => {
  it('test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id', async () => {
    const provider = providerDouble(() => Response.json({ id: 'msg_ac2275' }))

    const sent = await mailerFor(
      { RESEND_API_KEY: KEY },
      { fetch: provider as unknown as typeof fetch },
    )(MESSAGE)

    expect(sent).toEqual({ providerId: 'msg_ac2275' })
    expect(provider).toHaveBeenCalledTimes(1)
    const [url, init] = provider.mock.calls[0]
    expect(url).toBe(RESEND_ENDPOINT)
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).authorization).toBe(`Bearer ${KEY}`)
    const payload = JSON.parse(init.body as string) as Record<string, unknown>
    expect(payload.from).toBe(MESSAGE.from)
    expect(payload.to).toEqual([MESSAGE.to])
    expect(payload.subject).toBe(MESSAGE.subject)
  })

  it('test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids', async () => {
    const injected = providerDouble()
    const globalFetch = vi.spyOn(globalThis, 'fetch')
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const first = { ...MESSAGE, to: 'first@example.com', subject: 'First' }
    const second = { ...MESSAGE, to: 'second@example.com', subject: 'Second' }
    const ids: string[] = []
    for (const blank of [{}, { RESEND_API_KEY: '   ' }] as MailEnv[]) {
      const send = mailerFor(blank, { fetch: injected as unknown as typeof fetch })
      ids.push((await send(first)).providerId, (await send(second)).providerId)
    }

    // Nothing left the building, by either route.
    expect(injected).not.toHaveBeenCalled()
    expect(globalFetch).not.toHaveBeenCalled()
    for (const id of ids) expect(id).toMatch(/^local_.+$/)
    expect(new Set(ids).size).toBe(ids.length)

    // One console line per message, naming recipient and subject, in send order.
    const lines = log.mock.calls.map((c) => String(c[0]))
    expect(lines).toHaveLength(4)
    expect(lines[0]).toMatch(/not sent/)
    expect(lines[0]).toContain('first@example.com')
    expect(lines[0]).toContain('First')
    expect(lines[1]).toContain('second@example.com')
    expect(lines[1]).toContain('Second')

    // The suite's own runtime carries no credential …
    const runtime = env as unknown as MailEnv
    expect((runtime.RESEND_API_KEY ?? '').trim()).toBe('')
    expect((await mailerFor(runtime)(MESSAGE)).providerId).toMatch(/^local_/)

    // … and the credential, and nothing else, switches the same send to the provider.
    const provider = providerDouble(() => Response.json({ id: 'msg_ac2276' }))
    const switched = await mailerFor(
      { ...runtime, RESEND_API_KEY: KEY },
      { fetch: provider as unknown as typeof fetch },
    )(MESSAGE)
    expect(switched.providerId).toBe('msg_ac2276')
    expect(provider).toHaveBeenCalledTimes(1)
  })

  it('test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields', async () => {
    const variants: Array<{ message: Message; names: string[] }> = [
      { message: { ...MESSAGE, to: '  ' }, names: ['to'] },
      { message: { ...MESSAGE, from: '' }, names: ['from'] },
      { message: { ...MESSAGE, subject: '   ' }, names: ['subject'] },
      { message: { ...MESSAGE, to: '', from: ' ', subject: '' }, names: ['to', 'from', 'subject'] },
      { message: { ...MESSAGE, body: '' }, names: ['body'] },
    ]
    const provider = providerDouble()
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const credentialed = mailerFor({ RESEND_API_KEY: KEY }, { fetch: provider as unknown as typeof fetch })
    const uncredentialed = mailerFor({})

    for (const { message, names } of variants) {
      for (const send of [credentialed, uncredentialed]) {
        let caught: unknown
        try {
          await send(message)
        } catch (e) {
          caught = e
        }
        expect(caught).toBeInstanceOf(InvalidMessageError)
        for (const name of names) expect((caught as Error).message).toContain(name)
      }
    }

    // Refused before any delivery or capture.
    expect(provider).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
  })

  it('test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors', async () => {
    const sendWith = (fetchImpl: unknown) =>
      mailerFor({ RESEND_API_KEY: KEY }, { fetch: fetchImpl as typeof fetch })(MESSAGE)
    const failure = async (p: Promise<unknown>): Promise<MailSendError> => {
      let caught: unknown
      try {
        await p
      } catch (e) {
        caught = e
      }
      expect(caught).toBeInstanceOf(MailSendError)
      return caught as MailSendError
    }

    // (a) Unreachable.
    const unreachable = await failure(
      sendWith(
        vi.fn(async () => {
          throw new Error('connect ECONNREFUSED ac2278')
        }),
      ),
    )
    expect(unreachable.message).toMatch(/could not be reached/)
    expect(unreachable.message).toContain('connect ECONNREFUSED ac2278')

    // (b) Non-success status, detail truncated to at most 300 characters.
    const longBody = `{"message":"${'x'.repeat(1000)}"}`
    const refused = await failure(sendWith(vi.fn(async () => new Response(longBody, { status: 422 }))))
    expect(refused.status).toBe(422)
    expect(refused.message).toContain('422')
    const marker = '(422). '
    const detail = refused.message.slice(refused.message.indexOf(marker) + marker.length)
    expect(detail.length).toBeGreaterThan(0)
    expect(detail.length).toBeLessThanOrEqual(300)
    expect(longBody.startsWith(detail)).toBe(true)

    // (c) Accepted with no usable message id.
    for (const body of ['{}', '{"id":12345}', 'not json']) {
      const noId = await failure(sendWith(vi.fn(async () => new Response(body, { status: 200 }))))
      expect(noId.message).toMatch(/no message id/)
    }
  })

  it('test_UAT_AC2281_message_body_reaches_the_provider_as_html', async () => {
    const store = await storeOf('story7d25-ac2281')
    const invite = await templateFor(store, 'invite')
    const url = 'https://app.example/i/ac2281'
    const rendered = renderTemplate(invite, { cta_url: url })

    const provider = providerDouble(() => Response.json({ id: 'msg_ac2281' }))
    await mailerFor({ RESEND_API_KEY: KEY }, { fetch: provider as unknown as typeof fetch })({
      to: 'invitee@example.com',
      from: 'no-reply@1stcontact.io',
      subject: rendered.subject,
      body: rendered.body,
    })

    expect(provider).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(provider.mock.calls[0][1].body as string) as Record<string, unknown>
    // The provider's HTML body field carries the rendered body, button and all.
    expect(payload.html).toBe(rendered.body)
    expect(String(payload.html)).toMatch(new RegExp(`<a\\s[^>]*href="${url.replace(/[./]/g, '\\$&')}"`))
    // One part: no plain-text alternative is submitted beside it.
    expect(payload.text).toBeUndefined()
  })
})

describe('story-7d255580 — templates in the business store', () => {
  it('test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes', async () => {
    const pack = productTypePack()
    expect(pack.has(TEMPLATE_TYPE)).toBe(true)
    const schema = pack.schema(TEMPLATE_TYPE) as {
      fields: Record<string, { type?: string; enum?: string[]; required?: boolean }>
      body: { required?: boolean; non_empty?: boolean }
    }
    expect(schema.fields.template_key).toMatchObject({
      type: 'enum',
      enum: ['invite', 'signin', 'lapsed'],
      required: true,
    })
    expect(schema.fields.subject).toMatchObject({ type: 'string', required: true })
    expect(schema.fields.placeholders?.type).toBe('list')
    expect(schema.fields.placeholders?.required ?? false).toBe(false)
    expect(schema.body).toMatchObject({ required: true, non_empty: true })

    const store = await storeOf('story7d25-ac2282')
    const body = '<p><a href="{{cta_url}}">Go</a></p><p>{{cta_url}}</p>'

    const { ticket: withPlaceholders } = await store.create({
      type: TEMPLATE_TYPE,
      title: 'With placeholders',
      fields: { template_key: 'invite', subject: 'Hi', placeholders: ['cta_url'] },
      body,
    })
    const { ticket: without } = await store.create({
      type: TEMPLATE_TYPE,
      title: 'Without placeholders',
      fields: { template_key: 'lapsed', subject: 'Bye' },
      body: '<p>Your access has ended.</p>',
    })
    expect(withPlaceholders.fields.placeholders).toEqual(['cta_url'])
    expect(without.fields.template_key).toBe('lapsed')
    const before = (await templatesIn(store)).length
    expect(before).toBe(2)

    const invalid = [
      { title: 'No key', fields: { subject: 'Hi' }, body },
      { title: 'Wrong key', fields: { template_key: 'sign-in', subject: 'Hi' }, body },
      { title: 'No subject', fields: { template_key: 'signin' }, body },
      { title: 'Empty body', fields: { template_key: 'signin', subject: 'Hi' }, body: '' },
    ]
    for (const attempt of invalid) {
      await expect(store.create({ type: TEMPLATE_TYPE, ...attempt }), attempt.title).rejects.toThrow()
    }
    expect((await templatesIn(store)).length).toBe(before)
  })

  it('test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business', async () => {
    const store = await storeOf('story7d25-ac2283')

    // Fresh store: lookup seeds, a second lookup creates nothing.
    const seeded = await templateFor(store, 'invite')
    expect(seeded.fields.template_key).toBe('invite')
    expect(seeded.fields.subject).toBe(SEED_TEMPLATES.invite.subject)
    expect(seeded.body).toBe(SEED_TEMPLATES.invite.body)
    expect(await templatesIn(store)).toHaveLength(1)
    expect((await templateFor(store, 'invite')).uid).toBe(seeded.uid)
    expect(await templatesIn(store)).toHaveLength(1)

    // Newest wins; the older one stays stored.
    await tick()
    const { ticket: newer } = await store.create({
      type: TEMPLATE_TYPE,
      title: 'Invite (rewritten)',
      fields: { template_key: 'invite', subject: 'Rewritten', placeholders: ['cta_url'] },
      body: '<p><a href="{{cta_url}}">In</a></p><p>{{cta_url}}</p>',
    })
    expect((await templateFor(store, 'invite')).uid).toBe(newer.uid)
    expect((await store.get({ uid: seeded.uid })).ticket.uid).toBe(seeded.uid)

    // ensureTemplates seeds only the absent keys.
    const all = await ensureTemplates(store)
    expect(all.map((t) => t.fields.template_key)).toEqual([...TEMPLATE_KEYS])
    expect(all[0].uid).toBe(newer.uid)
    expect(await templatesIn(store)).toHaveLength(4)

    // Archiving every signin template re-seeds it on the next lookup.
    const signins = await templatesIn(store, 'signin')
    const archivable = store as unknown as { archive(a: { uid: string }): Promise<unknown> }
    for (const t of signins) await archivable.archive({ uid: t.uid })
    const reseeded = await templateFor(store, 'signin')
    expect(signins.map((t) => t.uid)).not.toContain(reseeded.uid)
    expect(reseeded.body).toBe(SEED_TEMPLATES.signin.body)

    // Another business never sees these.
    const other = await storeOf('story7d25-ac2283-other')
    const otherInvite = await templateFor(other, 'invite')
    const mine = new Set((await templatesIn(store)).map((t) => t.uid))
    for (const uid of [seeded.uid, newer.uid, reseeded.uid]) mine.add(uid)
    expect(mine.has(otherInvite.uid)).toBe(false)
    for (const t of await templatesIn(other)) expect(mine.has(t.uid)).toBe(false)
  })

  it('test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url', async () => {
    const store = await storeOf('story7d25-ac2286')
    const seeded = await ensureTemplates(store)
    expect(seeded.map((t) => t.fields.template_key)).toEqual(['invite', 'signin', 'lapsed'])

    for (const t of seeded) {
      const subject = String(t.fields.subject)
      expect(subject.trim()).not.toBe('')
      expect(t.fields.placeholders).toEqual(['cta_url'])

      // The only token in the copy is cta_url — no business-name token.
      const tokens = new Set(
        [...`${subject}\n${t.body}`.matchAll(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g)].map((m) => m[1]),
      )
      expect([...tokens]).toEqual(['cta_url'])
      expect(t.body).not.toMatch(/1st ?Contact/i)
      expect(subject).not.toMatch(/1st ?Contact/i)

      // A styled button at the link …
      const anchor = t.body.match(/<a\s[^>]*href="\{\{cta_url\}\}"[^>]*>/)
      expect(anchor, `${t.fields.template_key} has no button`).not.toBeNull()
      expect(anchor![0]).toMatch(/style="[^"]+"/)

      // … followed by the same URL as visible text, with copy-and-paste wording.
      const anchorEnd = t.body.indexOf('</a>', t.body.indexOf(anchor![0]))
      const after = t.body.slice(anchorEnd)
      expect(after).toContain('{{cta_url}}')
      expect(after).toMatch(/copy/i)
      expect(after).toMatch(/paste/i)
      expect(after).toMatch(/browser/i)
      expect(after).toMatch(/does not work/i)

      const url = 'https://app.example/i/ac2286'
      const rendered = renderTemplate(t, { cta_url: url })
      expect(rendered.body).not.toContain('{{')
      expect(rendered.body.split(url).length - 1).toBe(2)
    }

    const invite = seeded[0]
    const opening = invite.body.slice(0, invite.body.indexOf('<a '))
    expect(opening).toMatch(/invited/i)
  })
})
