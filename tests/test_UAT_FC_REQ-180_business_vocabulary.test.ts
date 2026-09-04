import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * REQ-180 §3 — **the tenant is a Business everywhere a person can read it**.
 *
 * WHY THIS IS A SOURCE ASSERTION RATHER THAN A BEHAVIOURAL ONE. The failure it
 * guards against is not an exception and not a wrong answer. It is one screen
 * that says "tenant" — a word describing our data model, in front of someone who
 * came here to run a business — and nothing observable distinguishes that from a
 * working deployment until a customer reads it. The audit passes today: every
 * `tenant` in these two apps is a comment or a query. So the thing worth writing
 * down is not the cleanup, it is the guard, because the string this protects
 * against is the NEXT one, written by someone who did not read §3.
 *
 * IT WALKS THE DIRECTORIES rather than checking a list of files, for the reason
 * [[REQ-168]]'s single-reader UAT does: a list proves that today's occurrences
 * are where they were left and says nothing about the one added next month in a
 * file this test has never heard of, which is the entire risk.
 *
 * THE LINE IS DRAWN AT WHAT USERS SEE, WHICH IS THE WEB APP AND THE SITE. Three
 * exemptions follow from that, and each is a RULE rather than an entry in a list
 * — a list is a thing people append to.
 *
 *   1. SQL. `tenant_id` is a column and stays one: §3 is a label decision, and
 *      the column appears in R2 keys and every store handle, so renaming it buys
 *      a migration for nothing. A query is not a screen.
 *   2. `TENANT_ID` and `wrangler.toml` — configuration vocabulary, addressed to
 *      whoever edits the deployment. This is the one place the word IS the
 *      reader's own, and the sentences carrying it are reachable only when the
 *      app has failed to start.
 *   3. A REGULAR EXPRESSION. `boot-guard.ts` matches against `UnknownTenantError`'s
 *      own text to turn a 503 into an actionable sentence. A matcher must keep
 *      matching what is actually thrown or the hint silently stops appearing —
 *      and a pattern is never rendered. What it RENDERS is a string like any
 *      other and is checked like one.
 *
 * IDENTIFIERS ARE NOT CHECKED AT ALL, which is the same decision from the other
 * side. `tenantId`, `forTenant`, `TenantSiteStore` are internal vocabulary and
 * §3 explicitly keeps them. Only quoted strings are examined, because only a
 * quoted string can reach a screen.
 */

const REPO = path.resolve(__dirname, '..')

/**
 * The two surfaces a user meets: the web app they log into, and the sites it
 * publishes. `tools/` is deliberately out of scope — it is the operator's CLI
 * and the build, neither of which a customer ever runs.
 */
const SURFACES = [
  path.join(REPO, 'apps/control-app/src'),
  path.join(REPO, 'apps/public-site/src'),
]

/** Build output, not authorship — it restates what the sources already say. */
const SKIP_DIRS = new Set(['generated'])

function sourceFiles(dir: string): string[] {
  const found: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) found.push(...sourceFiles(path.join(dir, entry.name)))
      continue
    }
    if (/\.(ts|js|mjs)$/.test(entry.name)) found.push(path.join(dir, entry.name))
  }
  return found
}

/**
 * Blank out comments, preserving every other character position.
 *
 * PRESERVING POSITIONS IS WHY IT REPLACES RATHER THAN DELETES: line numbers stay
 * true, so a failure names the line an author can go and look at. Comments are
 * removed because §3 is about what reaches a screen and prose about tenants is
 * exactly how the decision gets explained — this file's own header would fail a
 * guard that read comments.
 */
function withoutComments(source: string): string {
  let out = ''
  let i = 0
  let quote: string | null = null
  while (i < source.length) {
    const c = source[i]
    const next = source[i + 1]
    if (quote) {
      if (c === '\\') {
        out += c + (next ?? '')
        i += 2
        continue
      }
      if (c === quote) quote = null
      out += c
      i += 1
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      quote = c
      out += c
      i += 1
      continue
    }
    if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') {
        out += ' '
        i += 1
      }
      continue
    }
    if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2)
      const stop = end === -1 ? source.length : end + 2
      for (; i < stop; i += 1) out += source[i] === '\n' ? '\n' : ' '
      continue
    }
    out += c
    i += 1
  }
  return out
}

/** The character offsets that sit inside a quoted string. */
function stringMask(source: string): boolean[] {
  const mask = new Array<boolean>(source.length).fill(false)
  let quote: string | null = null
  for (let i = 0; i < source.length; i += 1) {
    const c = source[i]
    if (quote) {
      if (c === '\\') {
        mask[i] = true
        if (i + 1 < source.length) mask[i + 1] = true
        i += 1
        continue
      }
      if (c === quote) {
        quote = null
        continue
      }
      mask[i] = true
      continue
    }
    if (c === "'" || c === '"' || c === '`') quote = c
  }
  return mask
}

const SQL = /\b(SELECT|INSERT|UPDATE|DELETE|FROM|JOIN|WHERE|VALUES|SET|CREATE TABLE|ORDER BY)\b/
const CONFIG = /TENANT_ID|wrangler\.toml/
/** `tenant` occurring inside a regular expression on this line — a matcher. */
const IN_A_PATTERN = /\/[^/\n]*tenant[^/\n]*\/[a-z]*/i
/**
 * A string holding a bare identifier is a SYMBOL, not a sentence.
 *
 * The fourth exemption, and it is the third one from the other side. `tenant_id`
 * as a column name and `'TenantNotConfiguredError'` as an error's `name` are
 * identifiers that JavaScript happens to spell with quotes — the language gives
 * an `Error` no other way to carry its own type. §3 keeps identifiers, so
 * quoting one cannot be what makes it a violation. No whitespace is the test,
 * because the moment a string acquires a space it is prose addressed to somebody.
 */
const AN_IDENTIFIER = /^[A-Za-z0-9_$.\-/]+$/

/** The quoted literal containing `index`, read off the mask that found it. */
function literalAround(source: string, mask: boolean[], index: number): string {
  let from = index
  while (from > 0 && mask[from - 1]) from -= 1
  let to = index
  while (to + 1 < source.length && mask[to + 1]) to += 1
  return source.slice(from, to + 1)
}

/**
 * The one-line numbers of every string in `source` that says "tenant" to a
 * person. ONE FUNCTION, used both to walk the tree and to prove itself against
 * the sample below — a self-check over a re-implementation of the rules would
 * prove the copy.
 */
function offendingLines(source: string): number[] {
  const stripped = withoutComments(source)
  const mask = stringMask(stripped)
  const found: number[] = []
  let offset = 0
  for (const [index, line] of stripped.split('\n').entries()) {
    const start = offset
    offset += line.length + 1
    if (!/tenant/i.test(line)) continue
    if (SQL.test(line) || CONFIG.test(line) || IN_A_PATTERN.test(line)) continue
    // Only a quoted one. An identifier is internal vocabulary and stays.
    const at = line.search(/tenant/i)
    if (at === -1 || !mask[start + at]) continue
    if (AN_IDENTIFIER.test(literalAround(stripped, mask, start + at))) continue
    found.push(index + 1)
  }
  return found
}

function offences(): string[] {
  const found: string[] = []
  for (const dir of SURFACES) {
    for (const file of sourceFiles(dir)) {
      const source = fs.readFileSync(file, 'utf8')
      const lines = source.split('\n')
      for (const line of offendingLines(source)) {
        found.push(`${path.relative(REPO, file)}:${line} — ${lines[line - 1].trim()}`)
      }
    }
  }
  return found
}

describe('REQ-180 §3 — the vocabulary a person reads is Business', () => {
  it('test_UAT_FC_REQ-180_no_user_visible_string_in_the_web_app_or_the_site_says_tenant', () => {
    expect(
      offences(),
      'a string a user can read says "tenant"; §3 says the word never reaches a screen',
    ).toEqual([])
  })

  it('test_UAT_FC_REQ-180_the_guard_can_actually_see_a_violation', () => {
    // A guard that passes because it looks at nothing is worse than no guard,
    // and this one has four exemptions and a hand-rolled scanner between it and
    // the source. So it is shown two strings it must reject, comments it must
    // ignore, and each exemption in the form it is meant to excuse.
    const sample = [
      "const label = 'Your tenant has expired'", // 1 — an offence
      '// The tenant is the boundary — prose, and invisible to a user.',
      '/** Doc comment about a tenant. */',
      "  'SELECT id FROM tenants WHERE id = ?',", // SQL
      "throw new Error('TENANT_ID is not configured, so this tenant is unknown.')", // config
      "if (/no tenant/i.test(api)) { return 'nothing here' }", // a matcher
      'const tenantId = scope.businessId', // an identifier, unquoted
      "readonly name = 'TenantNotConfiguredError'", // an identifier, quoted
      'const column = `tenant_id`', // the column §3 explicitly keeps
      'who.textContent = `This tenant is closed`', // 10 — an offence in a template
    ].join('\n')

    expect(offendingLines(sample)).toEqual([1, 10])
  })

  it('test_UAT_FC_REQ-180_tenant_id_is_untouched_in_the_schema', () => {
    // The other half of §3, and the half that costs money to get wrong. This is
    // a LABEL decision: `tenant_id` appears in R2 keys and in every store handle,
    // so renaming the column to match a word on a screen buys a migration for
    // nothing. The guard above would be satisfied by a rename; this is what says
    // a rename is not what was asked for.
    const migrations = path.join(REPO, 'db/migrations')
    const sql = fs
      .readdirSync(migrations)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => fs.readFileSync(path.join(migrations, f), 'utf8'))
      .join('\n')

    expect(sql).toMatch(/CREATE TABLE[\s\S]*?tenants/i)
    expect(sql).toMatch(/tenant_id/)
    // And nothing renamed it out from under the keys.
    expect(sql).not.toMatch(/business_id/i)
  })
})
