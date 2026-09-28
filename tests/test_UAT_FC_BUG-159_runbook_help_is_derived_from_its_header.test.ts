import { afterAll, describe, expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

/**
 * BUG-159 — the copy runbooks' `--help` is their header, read to where it ends.
 *
 * WHY THIS IS HERE. Editing `bin/copy-to-cloud`'s header to describe what BUG-159
 * changed truncated its own `--help`: the text was emitted by `sed -n '2,132p'`, a
 * line count that was exact until the moment it was not. The script still exited 0
 * and still printed most of its help, and what fell off the end was the
 * `--print-token` trap — the one line that stops an operator setting the CLOUD
 * credential for the LOCAL end ([[BUG-134]]). A silent truncation on a number
 * nobody thinks to update.
 *
 * SO THE CLAIM IS ABOUT THE MECHANISM, AND PROVING IT NEEDS THE HEADER TO GROW.
 * [[BUG-134]]'s suite already asserts which variables and which ends the help
 * names, and it went on passing for as long as the count happened to be right — so
 * asserting today's output proves nothing a magic number would not also satisfy.
 * Each case below runs the script's own `--help` against a copy of it with ONE
 * extra header line, which is exactly the edit that broke this, and requires the
 * whole header out the other side.
 *
 * ON A COPY, in a temp directory, because the thing under test is how the script
 * reads ITSELF — `--help` answers from `BASH_SOURCE` and exits before anything
 * resolves the repository, so a copy is the real entry point for this question and
 * the checkout is left alone.
 *
 * BOTH SCRIPTS, because they are a matched pair everywhere else and had the same
 * number in the same place.
 */

const REPO_ROOT = join(__dirname, '..')
const run = promisify(execFile)
const work = mkdtempSync(join(tmpdir(), 'bug159-help-'))

afterAll(() => rmSync(work, { recursive: true, force: true }))

/** Every leading `#` line after the shebang, unprefixed — what `--help` owes. */
function headerOf(source: string): string[] {
  const out: string[] = []
  for (const line of source.split('\n').slice(1)) {
    if (!line.startsWith('#')) break
    out.push(line.replace(/^# ?/, ''))
  }
  return out
}

/** The same script with one more header line, laid down where it can be run. */
function withAnExtraHeaderLine(source: string, name: string, added: string): string {
  const lines = source.split('\n')
  lines.splice(2, 0, `# ${added}`)
  const path = join(work, name)
  writeFileSync(path, lines.join('\n'))
  chmodSync(path, 0o755)
  return path
}

describe('BUG-159 — --help is the whole header, not a line range', () => {
  for (const script of ['copy-to-cloud', 'copy-from-cloud']) {
    it(`test_UAT_FC_BUG-159_${script.replace(/-/g, '_')}_help_survives_a_longer_header`, async () => {
      const source = readFileSync(join(REPO_ROOT, 'bin', script), 'utf8')

      // AS IT STANDS, the help is the header exactly — no missing line, no stray one.
      const { stdout } = await run(join(REPO_ROOT, 'bin', script), ['--help'], {
        cwd: REPO_ROOT,
      })
      const header = headerOf(source)
      // A HEADER WORTH ASSERTING ON: these runbooks explain themselves at length, and
      // a comparison against a handful of lines would pass for the wrong reason.
      expect(header.length).toBeGreaterThan(40)
      expect(stdout).toBe(`${header.join('\n')}\n`)

      // AND AFTER THE EDIT THAT BROKE IT. One more header line, and the help is one
      // line longer at the front with nothing lost from the back. A line range drops
      // the last line here, silently, exit code 0.
      const added = 'BUG-159 probe: this line is part of the help too.'
      const grown = withAnExtraHeaderLine(source, script, added)
      const after = await run(grown, ['--help'], { cwd: REPO_ROOT })
      expect(after.stdout).toBe(`${headerOf(readFileSync(grown, 'utf8')).join('\n')}\n`)
      expect(after.stdout).toContain(added)
      // THE LAST LINE IS STILL THE LAST LINE, named rather than left to the
      // comparison above, because truncation is what this is about.
      expect(after.stdout.trimEnd().split('\n').at(-1)).toBe(header.at(-1))
    }, 60000)
  }
})
