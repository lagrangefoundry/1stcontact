import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * REQ-180 A1 — **`platform_admin` has two readers, and they mean different
 * things.**
 *
 * WHAT THIS IS FOR. `POST /api/admin/businesses` is gated on the flag, and
 * [[REQ-180]] D2 gave the flag itself as the reason. [[DOC-42]] §7 gives the
 * reason it is actually gated: provisioning a business is 1st Contact filling an
 * order, and it needs privilege because it writes a `tenants` row — not because
 * the caller holds a badge. Stated as two conditions, it is *you are an owner of
 * this business* and *this business's product is businesses*, which select
 * exactly the set the flag selects today.
 *
 * SO THE RISK IS A READING, NOT A BUG. Nothing built is wrong; what is fragile is
 * that the next hand reads the flag as "administrators get extra pages" and
 * builds a generic privileged-surface mechanism to hang them off. That is
 * [[DOC-42]] §7's own falsifier and [[DOC-40]] §2.1 rule 1's named failure mode —
 * capability built platform-only, which one business has today and the next
 * business's will not fit. It produces no exception and no wrong answer; it
 * produces a shape, and the shape is a third reader.
 *
 * SO THE COUNT IS THE ASSERTION, in [[REQ-168]]'s single-reader idiom. Two files
 * may read it, and each is exempt for a DIFFERENT reason — which is the whole
 * point of [[DOC-42]] §10.3's observation that the column bundles two separable
 * capabilities:
 *
 *   - `scope.ts` reads it to enter a business without holding a membership. This
 *     is the genuinely special power, and it is special because 1st Contact
 *     *hosts* the others ([[DOC-42]] §8) — not because of any level, and not
 *     because the holder is an administrator.
 *   - `router.ts` reads it to gate product fulfilment: the one action whose
 *     availability follows from what the 1st Contact business SELLS.
 *
 * Splitting the column is [[REQ-185]]'s and is not owed here. Holding the reader
 * count while it is still one column is what keeps that split cheap.
 */

const SRC = path.resolve(__dirname, '..', 'apps', 'control-app', 'src')

/** The two readers, and the meaning each is exempt for. */
const READERS = new Map([
  ['scope.ts', 'entry into a business without a membership — 1st Contact hosts the others'],
  ['router.ts', 'the product-fulfilment gate — provisioning is 1st Contact filling an order'],
])

/** Build output — the components' bundled source, not this repository's. */
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
 * A READ, distinguished from the two ways the name legitimately appears without
 * one — and the distinction is a rule rather than a list of exempt files.
 *
 *   - `admission.user.platform_admin` is a read: someone is consulting it.
 *   - `platform_admin: number` on an interface is the column's DECLARATION.
 *     `identity.ts` has to spell the shape of the row it selects.
 *   - `platform_admin` inside an `INSERT INTO users (...)` is SQL. A column list
 *     is not a decision about anybody.
 *
 * A property access or a destructure is therefore the shape checked for, because
 * those are the shapes a decision takes. This is the same move the vocabulary
 * guard makes when it examines only quoted strings: name the shape the failure
 * has, not the files it is currently absent from.
 */
const A_PROPERTY_READ = /\.\s*platform_admin\b/
const A_DESTRUCTURE = /\{[^{}\n]*\bplatform_admin\b[^{}\n]*\}\s*=/

/**
 * The generic mechanism itself, caught by name. [[DOC-42]] §7's falsifier is "a
 * generic admin extension mechanism", and the first thing one looks like is a
 * helper that answers *is this caller an administrator* for anyone who asks —
 * at which point the two capabilities above are permanently fused and every
 * later surface inherits the fusion. `ADMIN_ONLY_MESSAGE` and
 * `ADMIN_BUSINESSES_PATH` are a message and a path, not a predicate, and do not
 * match.
 */
const A_GENERIC_ADMIN_HELPER = /\b(is|require|assert|ensure|check)[A-Za-z]*Admin\b/

function readsOfTheFlag(source: string): number[] {
  const found: number[] = []
  source.split('\n').forEach((line, i) => {
    // A line that is entirely a comment is prose about the flag, and every one
    // of these files needs to explain why it does or does not consult it.
    if (/^\s*(\*|\/\/)/.test(line)) return
    if (A_PROPERTY_READ.test(line) || A_DESTRUCTURE.test(line)) found.push(i + 1)
  })
  return found
}

describe('REQ-180 A1 — the fulfilment gate is not a generic admin surface', () => {
  it('test_UAT_FC_REQ-180_platform_admin_is_read_in_exactly_two_places', () => {
    const offenders: string[] = []
    for (const file of sourceFiles(SRC)) {
      if (READERS.has(path.basename(file))) continue
      const source = fs.readFileSync(file, 'utf8')
      const lines = source.split('\n')
      for (const line of readsOfTheFlag(source)) {
        offenders.push(`${path.relative(SRC, file)}:${line} — ${lines[line - 1].trim()}`)
      }
    }

    expect(
      offenders,
      'platform_admin gained a third reader. The flag carries two separable ' +
        'capabilities (DOC-42 §10.3) and a third read is how they fuse into a ' +
        'generic privileged surface — DOC-40 §2.1 rule 1\'s failure mode. Gate on ' +
        'what the business sells, or on ownership, not on the badge.',
    ).toEqual([])
  })

  /**
   * The other half of the same claim. A guard that only checked for absence
   * would keep passing if the gate were deleted outright, at which point
   * provisioning is open to anyone admitted and nothing here says so.
   */
  it('test_UAT_FC_REQ-180_both_readers_still_consult_it_for_their_own_reason', () => {
    for (const [name] of READERS) {
      const source = fs.readFileSync(path.join(SRC, name), 'utf8')
      expect(readsOfTheFlag(source).length, `${name} stopped reading platform_admin`).toBeGreaterThan(0)
    }
  })

  it('test_UAT_FC_REQ-180_no_generic_admin_predicate_exists', () => {
    const offenders: string[] = []
    for (const file of sourceFiles(SRC)) {
      const lines = fs.readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (/^\s*(\*|\/\/)/.test(line)) return
        if (A_GENERIC_ADMIN_HELPER.test(line)) {
          offenders.push(`${path.relative(SRC, file)}:${i + 1} — ${line.trim()}`)
        }
      })
    }

    expect(
      offenders,
      'a predicate answering "is this caller an administrator" exists. DOC-42 §7: ' +
        'one business has these controls today and the next business\'s will not ' +
        'fit the same shape, so there is nothing for a generic mechanism to be ' +
        'generic over.',
    ).toEqual([])
  })

  it('test_UAT_FC_REQ-180_the_gate_guard_can_actually_see_a_violation', () => {
    // Four exemptions and a hand-rolled scanner sit between this guard and the
    // source, so it is shown each shape it must excuse and each it must catch.
    const sample = [
      '  platform_admin: number', // the column's declaration — not a read
      "    'INSERT INTO users (id, tenant_id, platform_admin) VALUES (?, ?, ?)',", // SQL
      ' * `platform_admin` is ambient by design — prose, and not a read.',
      '  if (admission.user.platform_admin) {', // 4 — a read
      '  const { platform_admin } = admission.user', // 5 — a read
    ].join('\n')

    expect(readsOfTheFlag(sample)).toEqual([4, 5])
    expect(A_GENERIC_ADMIN_HELPER.test('export function requireAdmin(admission) {')).toBe(true)
    expect(A_GENERIC_ADMIN_HELPER.test('const ADMIN_ONLY_MESSAGE = "Not found."')).toBe(false)
    expect(A_GENERIC_ADMIN_HELPER.test("const ADMIN_BUSINESSES_PATH = '/api/admin/businesses'")).toBe(false)
  })
})
