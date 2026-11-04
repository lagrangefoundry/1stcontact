import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { mailFrom, MailNotConfiguredError } from '../apps/control-app/src/mail'
import { route, type RouterEnv } from '../apps/control-app/src/router'
import { REDACTED } from '../apps/control-app/src/redact'
import { TemplateRefusedError, renderTemplate } from '../apps/control-app/src/templates'
import type { Ticket } from '../apps/control-app/src/tickets'
import type { TenantSiteStore } from '../tools/generate/src/store/d1r2-store'
import { readWranglerConfig } from './support/wrangler-toml'
import { secretHookHarness } from './support/secret-hook'

/**
 * Reconciliation UATs for story-7d255580 — **outgoing messages** (REQ-196 /
 * REQ-197), the Node half.
 *
 * WHAT RUNS HERE AND WHY. Rendering is a pure function of a ticket and values;
 * the From-address resolution reads only an env; the deploy hook is a bash
 * script driven through the shared `secretHookHarness` (a stubbed `npx
 * wrangler` first on PATH, nothing inherited from the developer's shell); and
 * the router's redaction is exercised through `route()` itself, the same route
 * table the Worker serves. Everything that needs a real D1/R2 store or the
 * workerd `fetch` lives in the `.workers.test.ts` sibling.
 */

const REPO = path.resolve(import.meta.dirname, '..')
const CONTROL_APP = path.join(REPO, 'apps', 'control-app')
const WRANGLER = path.join(CONTROL_APP, 'wrangler.toml')
const FROM_ADDRESS = 'no-reply@1stcontact.io'

const hook = secretHookHarness('bin/deploy.d/secrets/20-resend-api-key', 'RESEND_API_KEY')
afterAll(() => hook.dispose())

/** A `template` ticket as the store hands one back. */
function template(over: {
  uid?: string
  fields?: Record<string, unknown>
  body?: string
}): Ticket {
  return {
    uid: over.uid ?? 'template-story7d25',
    type: 'template',
    title: 'A template',
    status: null,
    human_id: null,
    fields: over.fields ?? { template_key: 'invite', subject: 'Your invitation' },
    links: [],
    body: over.body ?? '',
    version: 1,
    archived: false,
    created_at: '2026-11-04T00:00:00.000Z',
    updated_at: '2026-11-04T00:00:00.000Z',
  }
}

/** Run a render that must refuse, and return the refusal. */
function refusal(run: () => unknown): TemplateRefusedError {
  let caught: unknown
  try {
    run()
  } catch (e) {
    caught = e
  }
  expect(caught, 'the render produced a message instead of refusing').toBeInstanceOf(
    TemplateRefusedError,
  )
  return caught as TemplateRefusedError
}

/** Assert a refusal names everything an operator needs to find and fix it. */
function expectNamed(err: TemplateRefusedError, key: string, uid: string, token: string): void {
  expect(err.templateKey).toBe(key)
  expect(err.templateUid).toBe(uid)
  expect(err.token).toBe(token)
  expect(err.message).toContain(key)
  expect(err.message).toContain(uid)
  expect(err.message).toContain(`{{${token}}}`)
  expect(err.message).toContain('Nothing was sent')
}

describe('story-7d255580 — rendering', () => {
  it('test_UAT_AC2284_render_substitutes_every_token_in_subject_and_body_and_names_the_ticket', () => {
    const rendered = renderTemplate(
      template({
        uid: 'template-ac2284',
        fields: {
          template_key: 'invite',
          subject: 'Welcome, {{name}}',
          // Both declaration spellings are accepted.
          placeholders: ['cta_url', '{{name}}'],
        },
        body:
          '<p>Hello {{ name }},</p>' +
          '<p><a href="{{cta_url}}">Accept</a></p>' +
          '<p>{{cta_url}}</p>',
      }),
      { cta_url: 'https://app.example/i/ac2284', name: 'Alice' },
    )

    expect(rendered.subject).toBe('Welcome, Alice')
    expect(rendered.body).toBe(
      '<p>Hello Alice,</p>' +
        '<p><a href="https://app.example/i/ac2284">Accept</a></p>' +
        '<p>https://app.example/i/ac2284</p>',
    )
    expect(rendered.subject).not.toContain('{{')
    expect(rendered.body).not.toContain('{{')
    expect(rendered.templateKey).toBe('invite')
    expect(rendered.templateUid).toBe('template-ac2284')

    // A template that declares nothing and contains no token renders verbatim.
    const plain = renderTemplate(
      template({
        uid: 'template-ac2284-plain',
        fields: { template_key: 'lapsed', subject: 'Your access has ended' },
        body: '<p>Your access has ended.</p>',
      }),
    )
    expect(plain.subject).toBe('Your access has ended')
    expect(plain.body).toBe('<p>Your access has ended.</p>')
    expect(plain.templateKey).toBe('lapsed')
    expect(plain.templateUid).toBe('template-ac2284-plain')
  })

  it('test_UAT_AC2285_render_refuses_on_absent_declared_token_empty_value_or_leftover_token', () => {
    const uid = 'template-ac2285'
    const url = 'https://app.example/i/ac2285'

    // (1) Declared, absent from the body — appearing only in the subject does
    // not count.
    const absent = refusal(() =>
      renderTemplate(
        template({
          uid,
          fields: { template_key: 'signin', subject: 'Go to {{cta_url}}', placeholders: ['cta_url'] },
          body: '<p>Someone will be in touch.</p>',
        }),
        { cta_url: url },
      ),
    )
    expectNamed(absent, 'signin', uid, 'cta_url')

    // (2) Declared and used, but given no / null / empty / whitespace value.
    const declared = template({
      uid,
      fields: { template_key: 'invite', subject: 'Your invitation', placeholders: ['cta_url'] },
      body: '<p><a href="{{cta_url}}">Accept</a></p><p>{{cta_url}}</p>',
    })
    for (const values of [{}, { cta_url: null }, { cta_url: '' }, { cta_url: '   ' }]) {
      expectNamed(
        refusal(() => renderTemplate(declared, values)),
        'invite',
        uid,
        'cta_url',
      )
    }

    // (3) A token used in the copy and never declared, in the body …
    const leftoverBody = refusal(() =>
      renderTemplate(
        template({
          uid,
          fields: { template_key: 'invite', subject: 'Your invitation', placeholders: ['cta_url'] },
          body: '<p>Hello {{name}},</p><p><a href="{{cta_url}}">Accept</a></p><p>{{cta_url}}</p>',
        }),
        { cta_url: url },
      ),
    )
    expectNamed(leftoverBody, 'invite', uid, 'name')

    // … and separately in the subject.
    const leftoverSubject = refusal(() =>
      renderTemplate(
        template({
          uid,
          fields: { template_key: 'lapsed', subject: 'Goodbye, {{name}}', placeholders: ['cta_url'] },
          body: '<p><a href="{{cta_url}}">Open</a></p><p>{{cta_url}}</p>',
        }),
        { cta_url: url },
      ),
    )
    expectNamed(leftoverSubject, 'lapsed', uid, 'name')
  })
})

describe('story-7d255580 — the sending configuration', () => {
  it('test_UAT_AC2279_from_address_is_configured_on_both_sides_and_absent_refuses', () => {
    const config = readWranglerConfig(WRANGLER)
    expect(config.topLevel.vars).toContain('MAIL_FROM')
    expect(config.envs.production?.vars ?? []).toContain('MAIL_FROM')

    // The value in each section, read section by section.
    const values: Record<string, string> = {}
    let section = ''
    for (const raw of readFileSync(WRANGLER, 'utf8').split('\n')) {
      const line = raw.replace(/(^|\s)#.*$/, '').trim()
      const header = /^\[\[?([^\]]+)\]\]?$/.exec(line)
      if (header) {
        section = header[1].trim()
        continue
      }
      const m = /^MAIL_FROM\s*=\s*"(.*)"$/.exec(line)
      if (m) values[section] = m[1]
    }
    expect(values).toEqual({ vars: FROM_ADDRESS, 'env.production.vars': FROM_ADDRESS })

    // Resolution: configured is returned trimmed; absent or blank refuses and
    // names the setting — no fallback address.
    expect(mailFrom({ MAIL_FROM: `  ${FROM_ADDRESS}  ` })).toBe(FROM_ADDRESS)
    for (const env of [{}, { MAIL_FROM: '   ' }]) {
      let caught: unknown
      try {
        mailFrom(env)
      } catch (e) {
        caught = e
      }
      expect(caught).toBeInstanceOf(MailNotConfiguredError)
      expect((caught as Error).message).toContain('MAIL_FROM')
    }
  })

  it('test_UAT_AC2280_mail_credential_is_uncommitted_redacted_and_resolved_by_the_deploy_hook', async () => {
    // (1) No committed file outside the test tree assigns the credential a value.
    const listed = spawnSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' })
    expect(listed.status).toBe(0)
    const assignment = /RESEND_API_KEY\s*[=:]\s*["']?re_[A-Za-z0-9_]{8,}/
    const offenders: string[] = []
    for (const file of listed.stdout.split('\n')) {
      if (file === '' || file.startsWith('tests/') || file.startsWith('.xgd/')) continue
      const abs = path.join(REPO, file)
      if (!existsSync(abs) || statSync(abs).size > 2_000_000) continue
      if (assignment.test(readFileSync(abs, 'utf8'))) offenders.push(file)
    }
    expect(offenders).toEqual([])

    // (2) The router shows no credential value, exactly as for the model key.
    const KEY = 're_story7d255580_not_a_real_key_0123456789'
    const env = {
      TENANT_ID: 'story7d255580',
      RESEND_API_KEY: KEY,
      ASSETS: { fetch: async () => new Response('asset') },
    } as unknown as RouterEnv
    const response = await route(
      new Request('https://app.test/api/sites'),
      env,
      { businessId: 'story7d255580' },
      {
        store: async () =>
          ({
            slugs: async () => {
              throw new Error(`upstream refused (authorization: Bearer ${KEY})`)
            },
          }) as unknown as TenantSiteStore,
      },
    )
    const shown = await response.text()
    expect(response.status).toBe(500)
    expect(shown).toContain('upstream refused')
    expect(shown).not.toContain(KEY)
    expect(shown).toContain(REDACTED)

    // (3) The deploy hook's three-way resolution.
    const value = 're_story7d255580_supplied'
    const supplied = hook.run({ value, stored: [] })
    expect(supplied.code).toBe(0)
    expect(supplied.pushed).toBe(value)
    expect(supplied.out).not.toContain(value)

    const storedOnly = hook.run({ stored: ['RESEND_API_KEY'] })
    expect(storedOnly.code).toBe(0)
    expect(storedOnly.pushed).toBeNull()
    expect(storedOnly.out).toMatch(/already on/)

    const neither = hook.run({ stored: [] })
    expect(neither.code).toBe(0)
    expect(neither.pushed).toBeNull()
    expect(neither.out).toMatch(/RESEND_API_KEY/)
    expect(neither.out).toMatch(/delivers none of them/)

    const unreadable = hook.run({ listFails: true })
    expect(unreadable.code).toBe(0)
    expect(unreadable.pushed).toBeNull()
    expect(unreadable.out).toMatch(/could not be read/)

    // (4) Nothing at all for any other app.
    const other = hook.run({ app: 'public-site', value, stored: [] })
    expect(other.code).toBe(0)
    expect(other.pushed).toBeNull()
    expect(other.out.trim()).toBe('')

    // The operator runbook beside the control app.
    const runbook = readFileSync(path.join(CONTROL_APP, 'MAIL.md'), 'utf8')
    expect(runbook).toMatch(/Why a provider/i)
    for (const record of ['SPF', 'DKIM', 'DMARC']) expect(runbook).toContain(record)
  })
})
