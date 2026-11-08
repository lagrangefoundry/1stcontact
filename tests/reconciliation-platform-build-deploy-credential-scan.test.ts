/**
 * Reconciliation UAT for story-d5167ced — "Platform Build, Deploy & Smoke: One
 * Path To Ship A Worker, And Proof It Serves".
 *
 * Reconciled from bundle-4164b433 (BUNDLE-39, BUG-59), plan item 3 of 7.
 *
 *   • AC-1342 — the committed-credential scan's ONE exemption: the service-token
 *     identity mapping is exempt from the credential-named-assignment shape only,
 *     the exemption is a named list rather than a suffix, every exempted entry is
 *     held to the `name=address` grammar in the same run (the failure naming the
 *     file and the entry), an empty value passes, and the value-matched shapes
 *     still read the exempted variable.
 *
 * THE BOUNDARY is the scan the suite actually runs over the committed tree
 * (`support/credential-scan`, the single definition site both credential suites
 * read from), applied to the REAL committed deployment configuration and to
 * variants of it. Each variant starts from the real `wrangler.toml` bytes and
 * changes one line, so what is proved is what the scan does to the file that
 * ships, not to a toy string. Credential-looking literals are ASSEMBLED rather
 * than written out, so this file is not its own counter-example.
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { credentialShapesIn, exemptIdentityEntries, isNameAddressPair } from './support/credential-scan'

const REPO = realpathSync(fileURLToPath(new URL('..', import.meta.url)))

const APPS = readdirSync(path.join(REPO, 'apps'))
  .filter((app) => existsSync(path.join(REPO, 'apps', app, 'wrangler.toml')))
  .sort()

const CONTROL_TOML = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')

/**
 * One scan run over a set of named texts, the way the committed-tree scan runs:
 * the exempted entries are held to their grammar AND the shapes are matched, in
 * the same pass. Returns every failure, each naming its file.
 */
function scanRun(files: ReadonlyArray<readonly [rel: string, text: string]>): string[] {
  const failures: string[] = []
  for (const [rel, text] of files) {
    for (const entry of exemptIdentityEntries(text)) {
      if (!isNameAddressPair(entry)) failures.push(`${rel}: exempted entry "${entry}" is not a name=address pair`)
    }
    for (const what of credentialShapesIn(text)) failures.push(`${rel}: ${what}`)
  }
  return failures
}

/** The real control-app configuration with the production mapping line replaced. */
function withProductionMapping(original: string, replacement: string): string {
  const line = /^SERVICE_TOKEN_IDENTITIES = "[^"]+"$/m
  expect(original, 'the committed production mapping line was not found').toMatch(line)
  return original.replace(line, replacement)
}

describe('story-d5167ced — the credential scan exempts the identity mapping, and only from the name shape', () => {
  it('test_UAT_AC1342_identity_mapping_is_exempt_from_the_name_shape_only_held_to_name_address_and_listed_by_name', () => {
    const original = readFileSync(CONTROL_TOML, 'utf8')
    const rel = path.relative(REPO, CONTROL_TOML)

    // ── the committed tree passes, mapping included ─────────────────────────
    // Every Worker's deployment configuration is clean as committed …
    const committed = APPS.map((app) => {
      const file = path.join(REPO, 'apps', app, 'wrangler.toml')
      return [path.relative(REPO, file), readFileSync(file, 'utf8')] as const
    })
    expect(scanRun(committed)).toEqual([])

    // … and that is the exemption doing its work, not an absence of anything
    // to exempt: the production mapping is a real `name=address` entry for the
    // publish token, read by the scan as an exempted entry.
    const entries = exemptIdentityEntries(original)
    const publish = entries.filter((e) => e.trim().startsWith('1stcontact-publish='))
    expect(publish.length, 'the production identity mapping was not read as an exempted entry').toBe(1)
    expect(isNameAddressPair(publish[0])).toBe(true)

    // The same assignment WITHOUT the exemption would be reported by the
    // name-matched shape — so the clean result above is the exemption, proved.
    const productionLine = original.match(/^SERVICE_TOKEN_IDENTITIES = "[^"]+"$/m)![0]
    expect(credentialShapesIn(productionLine.replace('SERVICE_TOKEN_IDENTITIES', 'SERVICE_TOKEN_MAPPING'))).toEqual([
      'a credential-named assignment carrying a literal value',
    ])

    // ── an empty value has no entries and passes ────────────────────────────
    expect(original).toMatch(/^SERVICE_TOKEN_IDENTITIES = ""$/m)
    expect(exemptIdentityEntries('SERVICE_TOKEN_IDENTITIES = ""')).toEqual([])
    expect(scanRun([[rel, withProductionMapping(original, 'SERVICE_TOKEN_IDENTITIES = ""')]])).toEqual([])

    // ── several well-formed pairs pass ──────────────────────────────────────
    expect(
      scanRun([
        [rel, withProductionMapping(original, 'SERVICE_TOKEN_IDENTITIES = "ci.bot=ops@example.com,nightly_2=dev@mail.example.org"')],
      ]),
    ).toEqual([])

    // ── an exempted entry that is not a name=address pair fails the same run,
    //    naming the file and the entry ────────────────────────────────────────
    const notPairs = [
      'abcdefghijklmnopqrstuvwxyz0123456789', // a bare token-shaped value
      'ci-bot=not-an-address', // no @
      'ci-bot=ops@localhost', // no dotted domain
      'ci bot=ops@example.com', // whitespace inside the name
      '=ops@example.com', // no name
    ]
    for (const bad of notPairs) {
      const text = withProductionMapping(original, `SERVICE_TOKEN_IDENTITIES = "ci.bot=ops@example.com,${bad}"`)
      const failures = scanRun([[rel, text]])
      expect(failures, `"${bad}" passed as a name=address entry`).toHaveLength(1)
      expect(failures[0]).toContain(rel)
      expect(failures[0]).toContain(`"${bad}"`)
      // The well-formed sibling is not the one blamed.
      expect(failures[0]).not.toContain('"ci.bot=ops@example.com"')
    }

    // ── the value-matched shapes are NOT exempted ───────────────────────────
    const providerKey = ['sk', 'ant', 'api'].join('-') + '03-' + 'x'.repeat(24)
    const smuggledKey = scanRun([[rel, withProductionMapping(original, `SERVICE_TOKEN_IDENTITIES = "ci-bot=${providerKey}"`)]])
    expect(smuggledKey.some((f) => f === `${rel}: a provider-prefixed API key`)).toBe(true)
    // Even an entry that is otherwise a well-formed pair cannot launder a key.
    const pairWithKey = `SERVICE_TOKEN_IDENTITIES = "ci-bot=ops@example.com"\n# ${providerKey}`
    expect(credentialShapesIn(pairWithKey)).toContain('a provider-prefixed API key')
    const privateKey = '-----BEGIN ' + 'RSA PRIVATE KEY' + '-----'
    expect(credentialShapesIn(`SERVICE_TOKEN_IDENTITIES = "${privateKey}"`)).toContain('a private-key block')

    // ── the exemption is a named list, not a suffix ─────────────────────────
    // An unlisted `*_IDENTITIES` var carrying a credential-named literal is
    // still reported by the name-matched shape, and its entries are not even
    // read as exempted ones — it cannot opt itself out by taking the suffix.
    const literal = 'q'.repeat(20)
    for (const unlisted of ['DEPLOY_TOKEN_IDENTITIES', 'API_SECRET_IDENTITIES']) {
      const text = withProductionMapping(original, `${unlisted} = "${literal}"`)
      expect(exemptIdentityEntries(text), `${unlisted} was treated as exempt`).toEqual([])
      expect(scanRun([[rel, text]])).toEqual([`${rel}: a credential-named assignment carrying a literal value`])
    }
  })
})
