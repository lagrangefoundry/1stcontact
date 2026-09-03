import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * REQ-168 — **`TENANT_ID` has one reader, and a new one cannot appear quietly.**
 *
 * WHY THIS IS A SOURCE ASSERTION RATHER THAN A BEHAVIOURAL ONE. The failure it
 * guards against is not an exception and not a wrong answer to a question anyone
 * asked. It is a reader left behind: one opener still taking the business from
 * the deployment variable while every other read moved onto the caller's
 * identity, quietly serving the platform's own data into a customer's session.
 * Nothing observable distinguishes that from a working deployment until someone
 * looks at the wrong data — which is why the ticket asks for the reader count
 * itself to be the assertion.
 *
 * IT WALKS THE DIRECTORY rather than checking a list of files. A list would prove
 * that today's six mentions are where they were left and would say nothing about
 * the seventh, added next month in a file this test has never heard of — and the
 * seventh is the entire risk. An earlier draft of the ticket counted four reads
 * and missed `tickets.ts`, which is the one that scopes chat transcripts,
 * uploaded material and the project corpus; a hand-maintained list is how that
 * kind of miss survives.
 */

const SRC = path.join(__dirname, '..', 'apps', 'control-app', 'src')

/**
 * The two files that may name it, and what each is allowed to mean by it.
 *
 * `scope.ts` reads it on the one request path that has no identity to resolve
 * from — unconfigured local dev — and `identity.ts` reads it as the PLATFORM's
 * own business, where `users` rows for builder users live. Those are the two
 * legitimate meanings the variable has left, and they are different meanings,
 * which is why the exemption is per file rather than a single blanket.
 */
const ALLOWED = new Set(['scope.ts', 'identity.ts'])

/**
 * `boot-guard.ts` matches the STRING inside an error body to turn a 503 into a
 * sentence an operator can act on. It never reads the binding, and a regex over
 * a message is not a scope decision — so it is named here explicitly rather than
 * left to a looser pattern that would also have excused a real read.
 */
const MENTIONS_WITHOUT_READING = new Set(['boot-guard.ts'])

function sourceFiles(dir: string): string[] {
  const found: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    // `generated/` is build output — the components' own bundled source, not
    // this repository's. Asserting over it would be asserting over upstream.
    if (entry.isDirectory()) {
      if (entry.name !== 'generated') found.push(...sourceFiles(full))
      continue
    }
    if (entry.name.endsWith('.ts')) found.push(full)
  }
  return found
}

describe('REQ-168 — one reader of TENANT_ID', () => {
  it('test_UAT_FC_REQ-168_tenant_id_is_read_only_by_the_resolver_and_identity', () => {
    const offenders: string[] = []
    for (const file of sourceFiles(SRC)) {
      const name = path.basename(file)
      if (ALLOWED.has(name) || MENTIONS_WITHOUT_READING.has(name)) continue
      const source = fs.readFileSync(file, 'utf8')
      // `env.TENANT_ID`, `TENANT_ID?:` on an env interface, or a destructure —
      // every shape a READ takes. Prose in a comment is not one of them, so the
      // comments recording why the variable moved do not trip this.
      const lines = source.split('\n')
      lines.forEach((line, i) => {
        const code = line.replace(/^\s*(\*|\/\/).*$/, '')
        if (/\bTENANT_ID\b\s*[?:.]|\benv\.TENANT_ID\b/.test(code)) {
          offenders.push(`${path.relative(SRC, file)}:${i + 1}: ${line.trim()}`)
        }
      })
    }

    expect(
      offenders,
      'TENANT_ID gained a reader outside scope.ts/identity.ts. That is REQ-168\'s ' +
        'exact failure mode: one site left behind, serving the platform business\'s ' +
        'data into a customer\'s session. Take the business from the resolved Scope.',
    ).toEqual([])
  })

  /**
   * The other half of the same claim, and it has to be asserted separately: a
   * suite that only checked for absence would keep passing if the resolver
   * stopped reading it too, at which point unconfigured local dev has no scope
   * at all and every workers suite fails somewhere less obvious.
   */
  it('test_UAT_FC_REQ-168_the_resolver_still_reads_it_for_the_branch_with_no_identity', () => {
    const resolver = fs.readFileSync(path.join(SRC, 'scope.ts'), 'utf8')
    expect(resolver).toMatch(/env\.TENANT_ID/)
  })
})
