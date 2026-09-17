import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * [[REQ-266]] §6 — **`forget()` is the only code that deletes a revision row,
 * and a second deleter cannot appear quietly.**
 *
 * WHY THIS IS A SOURCE ASSERTION RATHER THAN A TRIGGER. The companion half of
 * this ticket forbids `UPDATE` on `site_revisions` outright, in the schema,
 * because rewriting a published fact has no legitimate form. `DELETE` is not
 * like that: erasure is a person's right over their own data ([[DOC-37]]) and it
 * has to reach these rows, so the cascade from `sites` must keep working and a
 * `DELETE` trigger would have to model teardown rather than forbid it.
 *
 * WHICH LEAVES EXACTLY ONE THING TO GUARANTEE: that teardown is the ONLY
 * deleter. Today it is — `forget()` is the single statement in the product that
 * removes a revision row, and it has no caller anywhere in the product either
 * ([[EPIC-17]] §4a). The risk is the second one, added next year in a file this
 * test has never heard of, to clean something up. Nothing observable
 * distinguishes that from a working deployment until somebody asks for a
 * revision that used to exist, which is why the ticket asks for the deleter
 * count itself to be the assertion.
 *
 * THE IDIOM IS [[REQ-168]]'s, deliberately reused rather than reinvented: walk
 * the directories, allow the file that is supposed to say it, and fail on every
 * other mention. A hand-maintained list of files would prove that today's one
 * deleter is where it was left and would say nothing about the second.
 */

const REPO = path.join(__dirname, '..')

/**
 * The one module that may delete a revision row, and what it is allowed to mean.
 *
 * `d1r2-store.ts` holds `forget()` — a business dropping a site entirely, which
 * takes the site's drafts, assets, journal, revisions and its reservations with
 * it. That is teardown, and teardown is the legitimate delete.
 */
const ALLOWED = new Set(['d1r2-store.ts'])

/** Every `.ts` file of the product, excluding build output and tests. */
function sourceFiles(dir: string): string[] {
  const found: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      // `generated/` is the components' own bundled source, not this
      // repository's — asserting over it would be asserting over upstream.
      if (entry.name !== 'generated' && entry.name !== 'node_modules') {
        found.push(...sourceFiles(full))
      }
      continue
    }
    if (entry.name.endsWith('.ts')) found.push(full)
  }
  return found
}

describe('REQ-266 §6 — one deleter of site_revisions', () => {
  it('test_UAT_FC_REQ-266_only_forget_deletes_a_revision', () => {
    const offenders: string[] = []
    for (const root of ['apps', 'tools', 'packages']) {
      for (const file of sourceFiles(path.join(REPO, root))) {
        if (ALLOWED.has(path.basename(file))) continue
        fs.readFileSync(file, 'utf8')
          .split('\n')
          .forEach((line, i) => {
            // The statement, not the words. Prose naming the table — and this
            // file's own reasoning is full of it — is stripped before the match,
            // exactly as REQ-168 strips a comment before looking for a read.
            const code = line.replace(/^\s*(\*|\/\/).*$/, '')
            if (/DELETE\s+FROM\s+site_revisions\b/i.test(code)) {
              offenders.push(`${path.relative(REPO, file)}:${i + 1}: ${line.trim()}`)
            }
          })
      }
    }

    expect(
      offenders,
      'site_revisions gained a deleter outside forget(). A published revision is ' +
        'immutable (REQ-266) and the ONLY legitimate removal is a site being torn ' +
        'down. If this is erasure, route it through forget(); if it is cleanup, it ' +
        'is rewriting history.',
    ).toEqual([])
  })

  /**
   * The other half, and it has to be asserted separately: a suite that only
   * checked for absence would keep passing if `forget()` stopped deleting them
   * too — at which point dropping a site leaves its published revisions behind,
   * which is the "we deleted them but kept the history" mistake the baseline
   * schema warns about in so many words.
   */
  it('test_UAT_FC_REQ-266_forget_still_deletes_the_revisions_and_their_claims', () => {
    const store = fs.readFileSync(
      path.join(REPO, 'tools', 'generate', 'src', 'store', 'd1r2-store.ts'),
      'utf8',
    )
    expect(store).toMatch(/DELETE FROM site_revisions WHERE site_id = \?/)
    expect(store).toMatch(/DELETE FROM site_revision_claims WHERE site_id = \?/)
  })
})
