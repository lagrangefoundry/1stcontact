import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * **Business Fulfilment: the gate is product fulfilment, not administration**
 * (story-387c9dfe — AC-2158, AC-2159, AC-2160).
 *
 * These are static guards over the builder's server source. The failures they
 * catch are shapes, not exceptions: a third reader of `platform_admin`, a
 * generic `isAdmin`-style predicate, or code that asks whether a business is
 * "the platform's own". Each guard walks the whole tree (generated build output
 * excluded) and is proven against a sample, so it cannot pass by seeing nothing.
 */

const SRC = path.resolve(__dirname, '..', 'apps', 'control-app', 'src')
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

const A_COMMENT_LINE = /^\s*(\*|\/\/|\/\*)/

// ---------------------------------------------------------------------------
// AC-2158 — the flag has exactly two readers.

const FLAG_READERS = new Set(['scope.ts', 'router.ts'])
const A_PROPERTY_READ = /\.\s*platform_admin\b/
const A_DESTRUCTURE = /\{[^{}\n]*\bplatform_admin\b[^{}\n]*\}\s*=/

function readsOfTheFlag(source: string): number[] {
  const found: number[] = []
  source.split('\n').forEach((line, i) => {
    if (A_COMMENT_LINE.test(line)) return
    if (A_PROPERTY_READ.test(line) || A_DESTRUCTURE.test(line)) found.push(i + 1)
  })
  return found
}

// ---------------------------------------------------------------------------
// AC-2159 — no generic administrator predicate.

const A_GENERIC_ADMIN_PREDICATE = /\b(is|require|assert|ensure|check)[A-Za-z]*Admin\b/

function adminPredicateLines(source: string): number[] {
  const found: number[] = []
  source.split('\n').forEach((line, i) => {
    if (A_COMMENT_LINE.test(line)) return
    if (A_GENERIC_ADMIN_PREDICATE.test(line)) found.push(i + 1)
  })
  return found
}

// ---------------------------------------------------------------------------
// AC-2160 — nothing outside the two deployment-identity readers names or tests
// for "the platform's own tenant".

const MAY_ASK = new Set(['identity.ts', 'scope.ts'])
const THE_CONCEPT_NAMED = /\bplatform[_A-Za-z]*(tenant|business|account)\b/i
const THE_CONCEPT_ASKED = /\bis_?platform\b/i
const THE_SLUG_COMPARED =
  /[=!]==?[^\n]*['"`][^'"`\n]*1stcontact[^'"`\n]*['"`]|['"`][^'"`\n]*1stcontact[^'"`\n]*['"`][^\n]*[=!]==?/

/** Blank out comments, preserving line structure so line numbers stay true. */
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

function platformTenantLines(source: string): number[] {
  const found: number[] = []
  withoutComments(source)
    .split('\n')
    .forEach((line, i) => {
      if (THE_CONCEPT_NAMED.test(line) || THE_CONCEPT_ASKED.test(line) || THE_SLUG_COMPARED.test(line)) {
        found.push(i + 1)
      }
    })
  return found
}

function offenders(scan: (source: string) => number[], exempt: Set<string> = new Set()): string[] {
  const found: string[] = []
  for (const file of sourceFiles(SRC)) {
    if (exempt.has(path.basename(file))) continue
    const source = fs.readFileSync(file, 'utf8')
    const lines = source.split('\n')
    for (const line of scan(source)) {
      found.push(`${path.relative(SRC, file)}:${line} — ${lines[line - 1].trim()}`)
    }
  }
  return found
}

describe('Business Fulfilment — the gate is not a generic admin surface', () => {
  it('test_UAT_AC2158_platform_admin_is_read_only_by_scope_entry_and_the_fulfilment_gate', () => {
    // No third reader anywhere in the tree; a violation names file:line.
    expect(
      offenders(readsOfTheFlag, FLAG_READERS),
      'platform_admin gained a third reader outside scope.ts and router.ts',
    ).toEqual([])

    // Both allowed readers still consult it — deleting the gate would fail here.
    for (const name of FLAG_READERS) {
      const source = fs.readFileSync(path.join(SRC, name), 'utf8')
      expect(readsOfTheFlag(source).length, `${name} stopped reading platform_admin`).toBeGreaterThan(0)
    }

    // The guard sees reads and excuses a declaration, SQL and a comment.
    const sample = [
      '  platform_admin: number',
      "    'INSERT INTO users (id, tenant_id, platform_admin) VALUES (?, ?, ?)',",
      ' * `platform_admin` is ambient by design.',
      '  if (admission.user.platform_admin) {',
      '  const { platform_admin } = admission.user',
    ].join('\n')
    expect(readsOfTheFlag(sample)).toEqual([4, 5])
  })

  it('test_UAT_AC2159_no_generic_administrator_predicate_exists', () => {
    expect(
      offenders(adminPredicateLines),
      'an is/require/assert/ensure/check…Admin predicate exists in the builder server source',
    ).toEqual([])

    // The guard catches the predicate shape and excuses the two constants.
    const sample = [
      'export function requireAdmin(admission) {',
      "const ADMIN_ONLY_MESSAGE = 'Not found.'",
      "export const ADMIN_BUSINESSES_PATH = '/api/admin/businesses'",
    ].join('\n')
    expect(adminPredicateLines(sample)).toEqual([1])
  })

  it('test_UAT_AC2160_nothing_outside_the_two_identity_readers_asks_for_the_platform_tenant', () => {
    expect(
      offenders(platformTenantLines, MAY_ASK),
      "something outside identity.ts and scope.ts names or tests for the platform's own tenant",
    ).toEqual([])

    // Each forbidden shape is flagged at its line; allowed forms are excused.
    const sample = [
      'const platformTenant = requirePlatformTenant(env)', // 1 — named
      '// The platform tenant is where accounts live — prose.',
      '/** Doc comment about the platform tenant. */',
      'if (isPlatform(scope.businessId)) return view()', // 4 — asked
      "if (scope.businessId === '1stcontact') return view()", // 5 — compared by slug
      'const tenantId = (env.TENANT_ID ?? "").trim()',
      'const site = await store.forTenant(scope.businessId)',
      "const label = 'app.1stcontact.io'",
      'const is_platform = true', // 9 — asked, snake case
      'const PLATFORM_ACCOUNT = 1', // 10 — named
    ].join('\n')
    expect(platformTenantLines(sample)).toEqual([1, 4, 5, 9, 10])
  })
})
