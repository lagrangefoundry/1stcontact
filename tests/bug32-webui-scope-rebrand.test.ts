/**
 * story-e674c60a / BUG-32 — **the component scope is one name, written once**.
 *
 * AC-960's second half: the scope the shared UI components are published under
 * is part of every reference the workspace makes to a component, so it is
 * subject to the same one-definition rule as every other name the workspace
 * shows. It is declared once, everything that generates a reference composes it
 * from that declaration, and it appears as a literal nowhere else — including a
 * generated artifact checked in beside its generator, and including prose.
 *
 * THESE UATS ARE UNCONDITIONAL BY CONSTRUCTION, and that is the whole point.
 * `WEBUI_INSTALLED` (`tests/support/webui-installed.ts`) is presence-only: it
 * cannot tell "never installed" from "renamed upstream and not renamed here",
 * so a suite that used it as a gate would report a half-completed rename as a
 * clean green run while the workspace shipped an import map nothing can
 * resolve. Mount-behaviour evidence may skip; identity and wiring evidence may
 * not. There is deliberately no `skipIf` in this file.
 *
 * Nothing here is mocked, faked or vendored: the subject is the real consumption
 * route, which is most of this story's risk. (Vitest's `resolve.alias` entries
 * are derived from the same `webuiPackageDir`/`WEBUI_SCOPE` this file asserts
 * over, so they correct WHERE the real store is found from a linked worktree
 * without substituting anything for it — see the Test Architecture Summary.)
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { WEBUI_PACKAGES, WEBUI_SCOPE } from '../tools/generate/src/cli'
// The chrome document is the Worker's since REQ-145 — it composes it from the
// import map `1c assets` derives, rather than resolving packages per request.
import { chromeHtml } from '../apps/control-app/src/chrome'

const REPO = path.resolve(__dirname, '..')

/**
 * Scopes the components were PREVIOUSLY published under.
 *
 * Split-and-joined so this guard is not itself a violation of the rule it
 * enforces — a tree-scanning check that writes its own forbidden literal fails
 * on itself, and would then have to exclude itself, which is exactly the
 * exception that lets the next surface slip through.
 */
const SUPERSEDED_SCOPES = [['@gendev', 'labs'].join('')]

/** The single declaration site. Composing a reference anywhere else is the defect. */
const DECLARATION = 'tools/generate/src/cli/webui.ts'

/**
 * The one permitted exception, and it is bounded: the workspace's own browser
 * source is served to the browser verbatim and can read no build-time value, so
 * it names components directly. Held in step by
 * {@link browser_source_specifiers_are_declared_by_the_generated_document}
 * rather than trusted.
 */
const BROWSER_SOURCE_DIR = 'apps/control-app/src/builder'

/**
 * Declared exclusions from the tracked-tree scan, and why each one is here:
 *
 * - `.xgd/**` — the ticket and workflow store. Its retention of the legacy
 *   namespace is a recorded operator decision (2026-08-05), not an oversight,
 *   and the ticket bodies quote the rename by necessity.
 * - dependency lockfiles — machine-generated resolution graphs, not references
 *   this repository composes.
 */
function excluded(rel: string): boolean {
  return rel.startsWith('.xgd/') || /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/.test(rel)
}

const TEXT_EXT = new Set([
  '.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs', '.jsx',
  '.json', '.html', '.css', '.md', '.yaml', '.yml', '.astro', '.txt', '.svg',
])

/**
 * Every text file the repository TRACKS — not a fixed list of source
 * directories, since the surface that gets forgotten is precisely the one no
 * such list anticipates. (`index.html` at the repo root is the concrete proof:
 * it is under none of the three source roots an earlier version of this guard
 * scanned, and it carries an import map.)
 */
function trackedTextFiles(): string[] {
  const out = execFileSync('git', ['ls-files', '-z'], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  return out
    .split('\0')
    .filter(Boolean)
    .filter((rel) => TEXT_EXT.has(path.extname(rel)))
    .filter((rel) => !excluded(rel))
}

/** Raw `git grep` hits, over the working tree when `treeish` is null. */
function grepHits(needle: string, treeish: string | null): Array<{ file: string; line: number }> {
  const args = ['grep', '-I', '-n', '--no-color', '-F', '-e', needle]
  if (treeish) args.push(treeish)
  let out: string
  try {
    out = execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  } catch (e) {
    // `git grep` exits 1 for "no matches", which is not an error here.
    const err = e as { status?: number; stdout?: string }
    if (err.status !== 1) throw e
    out = err.stdout ?? ''
  }
  const hits: Array<{ file: string; line: number }> = []
  for (const raw of out.split('\n').filter(Boolean)) {
    const body = treeish ? raw.slice(treeish.length + 1) : raw
    const sep = body.indexOf(':')
    hits.push({
      file: body.slice(0, sep),
      line: Number(body.slice(sep + 1, body.indexOf(':', sep + 1))),
    })
  }
  return hits
}

/**
 * Where `needle` occurs across the WHOLE tracked tree, as `path:line`.
 *
 * A sparse checkout materialises only a fraction of the tracked files (this
 * develop worktree: ~429 of ~2350), so a scan that reads the disk silently
 * skips four files in five — and would report a clean tree while the forgotten
 * surface sits unmaterialised. That is the same silent green this whole suite
 * exists to prevent, one level down.
 *
 * So: for a file the checkout HAS materialised the working tree is
 * authoritative, since it may carry uncommitted edits; for one it has not,
 * `HEAD` is the only content there is.
 */
function trackedHits(needle: string): string[] {
  const scannable = new Set(trackedTextFiles())
  const present = (rel: string) => fs.existsSync(path.join(REPO, rel))
  const hits: string[] = []
  for (const h of grepHits(needle, null)) {
    if (scannable.has(h.file) && present(h.file)) hits.push(`${h.file}:${h.line}`)
  }
  for (const h of grepHits(needle, 'HEAD')) {
    if (scannable.has(h.file) && !present(h.file)) hits.push(`${h.file}:${h.line}`)
  }
  return hits.sort()
}

function read(rel: string): string {
  return fs.readFileSync(path.join(REPO, rel), 'utf8')
}

/** The `.js` files making up the declared browser-source exception. */
function browserSourceFiles(): string[] {
  return fs
    .readdirSync(path.join(REPO, BROWSER_SOURCE_DIR))
    .filter((f) => f.endsWith('.js'))
    .map((f) => `${BROWSER_SOURCE_DIR}/${f}`)
}

/** Every bare component specifier the browser source imports, with its file. */
function browserSourceSpecifiers(): Array<{ file: string; spec: string }> {
  const hits: Array<{ file: string; spec: string }> = []
  for (const rel of browserSourceFiles()) {
    for (const m of read(rel).matchAll(/from\s*['"](@[^'"/]+\/webui-[^'"]*)['"]/g)) {
      hits.push({ file: rel, spec: m[1] })
    }
  }
  return hits
}

/** The import map of a freshly produced workspace document. */
function importMapOf(html: string): Record<string, string> {
  const m = /<script type="importmap">(.*?)<\/script>/s.exec(html)
  expect(m, 'the workspace document declares an import map').toBeTruthy()
  return (JSON.parse(m![1]) as { imports: Record<string, string> }).imports
}

describe('story-e674c60a component scope: one name, written once', () => {
  it('test_UAT_AC960_component_scope_is_written_in_exactly_one_place', () => {
    const files = trackedTextFiles()
    expect(files.length, 'the tracked-file enumeration is empty — the scan proves nothing').toBeGreaterThan(0)
    // The enumeration must reach BEYOND the source roots a hardcoded list would
    // have named. `index.html` — a generated artifact checked in beside its
    // generator — was the concrete proof that a three-root scan was wrong: it
    // sat under none of them and carried an import map. It has since been
    // deleted (nothing read it; a committed copy of the generator's output is
    // itself a second definition site), so this asserts the property directly
    // rather than naming one file that happened to have it.
    const SOURCE_ROOTS = ['tools/', 'apps/', 'packages/']
    expect(
      files.filter((rel) => !SOURCE_ROOTS.some((r) => rel.startsWith(r))).length,
      'the enumeration reaches no further than the source roots a hardcoded list would name',
    ).toBeGreaterThan(0)

    // (a) No tracked file names a scope the components were previously
    //     published under. Anywhere: source, a generated artifact checked in
    //     beside its generator, or prose such as a comment.
    for (const superseded of SUPERSEDED_SCOPES) {
      expect(
        trackedHits(superseded),
        'a superseded component scope survives in tracked files',
      ).toEqual([])
    }

    // (b) The scope IN USE is written only in its single declaration and in the
    //     declared browser-source exception. A second constant, a restatement
    //     in a test, or a checked-in generated artifact all land here.
    const permitted = new Set([DECLARATION, ...browserSourceFiles()])
    const writers = [...new Set(trackedHits(WEBUI_SCOPE).map((h) => h.slice(0, h.lastIndexOf(':'))))]
    expect(
      writers.filter((rel) => !permitted.has(rel)),
      'the scope in use is restated outside its declaration and the declared browser-source exception',
    ).toEqual([])
    expect(writers, 'the declaration itself must write the scope').toContain(DECLARATION)

    // (c) …and the declaring location holds exactly ONE such literal, so
    //     neither its prose nor a second constant can restate it. This is what
    //     forbids a `LEGACY_SCOPE` export or a fallback resolution path.
    const quoted = read(DECLARATION).match(/(['"`])@[a-z][a-z0-9-]*\1/g) ?? []
    expect(quoted, `${DECLARATION} must contain exactly one quoted scope literal`).toEqual([
      `'${WEBUI_SCOPE}'`,
    ])
  })

  it('test_UAT_AC960_browser_source_specifiers_are_declared_by_the_generated_document', () => {
    // The bounded exception is held in step rather than trusted: a browser
    // source and a generator that disagree cannot both be satisfied. This
    // coupling fails ONLY at runtime in a browser — no build, type check or
    // other test observes it — so this is its only evidence.
    const specs = browserSourceSpecifiers()
    expect(specs.length, 'the browser source names no component — the check is vacuous').toBeGreaterThan(0)

    for (const { file, spec } of specs) {
      expect(
        spec.startsWith(`${WEBUI_SCOPE}/`),
        `${file} imports ${spec}, which is not under the scope in use`,
      ).toBe(true)
    }

    // Against the document produced NOW, never a copy committed to the repo.
    const imports = importMapOf(chromeHtml())
    for (const { file, spec } of specs) {
      expect(
        Object.keys(imports),
        `${file} imports ${spec}, which the generated workspace document does not declare`,
      ).toContain(spec)
    }

    // Every component the workspace consumes is reachable from the map, so the
    // check above cannot pass by the browser source naming a shrinking subset.
    for (const name of WEBUI_PACKAGES) {
      expect(Object.keys(imports), `no reference for ${name}`).toContain(`${WEBUI_SCOPE}/${name}`)
    }
  })
})
