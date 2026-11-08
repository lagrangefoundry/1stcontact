import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { mailFrom, MailNotConfiguredError, resendMailer } from '../apps/control-app/src/mail'
import { readWranglerConfig } from './support/wrangler-toml'

/**
 * Reconciliation UAT for story-7d255580 — **the fallback sending address**
 * (REQ-205 upgrade of REQ-196), the Node half.
 *
 * `MAIL_FROM` is what a template that names no address of its own sends from.
 * It is deployment configuration read from the control app's real
 * `wrangler.toml`, resolved by the shipped `mailFrom`, and carried verbatim by
 * the shipped provider adapter — driven here against a recording `fetch`
 * double, the one boundary we do not own.
 */

const REPO = path.resolve(import.meta.dirname, '..')
const WRANGLER = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')
const FALLBACK_FROM = '1st Contact <no-reply@1stcontact.io>'

describe('story-7d255580 — the fallback sending address', () => {
  it('test_UAT_AC2279_mail_from_is_the_named_fallback_in_both_sections_and_absent_refuses', async () => {
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
    expect(values).toEqual({ vars: FALLBACK_FROM, 'env.production.vars': FALLBACK_FROM })
    // RFC 5322 display-name form: a name, then the address in angle brackets.
    expect(FALLBACK_FROM).toMatch(/^[^<>]+ <[^<>@\s]+@[^<>@\s]+>$/)

    // A configured value is returned trimmed and otherwise unchanged.
    expect(mailFrom({ MAIL_FROM: `  ${FALLBACK_FROM}  ` })).toBe(FALLBACK_FROM)

    // Absent or blank refuses, naming the setting — never a default address.
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

    // The display-name form reaches the provider exactly as configured.
    const provider = vi.fn(async (_url: string, _init: RequestInit) =>
      Response.json({ id: 'msg_ac2279' }),
    )
    await resendMailer('re_story7d255580_ac2279', provider as unknown as typeof fetch)({
      to: 'alice@example.com',
      from: mailFrom({ MAIL_FROM: FALLBACK_FROM }),
      subject: 'Sign in',
      body: '<p>Sign in.</p>',
    })
    expect(provider).toHaveBeenCalledTimes(1)
    const sent = JSON.parse(provider.mock.calls[0][1].body as string) as { from: string }
    expect(sent.from).toBe(FALLBACK_FROM)
  })
})
