import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  awarenessDocument,
  bindKb,
  configPath,
  corpusDir,
  kbBundle,
  kbSkew,
  kbSkewError,
  KbSkewError,
  requireCoherentKb,
  resolveEmbedder,
  SYSTEM_KB,
} from '../tools/generate/src/cli/kb'
import { kbLine, writeKbModule } from '../tools/generate/src/cli/assets'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'

/**
 * BUG-48 — **a document in the corpus that is not in the index is a shipped lie**.
 *
 * `1c assets` inlines the system KB from two sources that can disagree: the corpus
 * arrives as a DIRECTORY LISTING and the two indexes as BUILD ARTEFACTS. Nothing
 * required them to agree, and in the bundle shipped on 2026-09-01 they did not —
 * three projected references and the awareness map shipped as corpus text and were
 * in neither manifest. Retrieval searches the index, so the consultant carried
 * `REF-l1` in its own bundle for an entire client session, could not return it, and
 * told the operator the knowledge base had no schema reference. Which was true of
 * the corpus it could search and false of the corpus it was holding.
 *
 * THE PIPELINE WAS NEVER BROKEN, which is what makes this worth a suite. `1c kb
 * build` writes the projections and then indexes, in that order, deliberately. The
 * defect is that the order binds only INSIDE that verb — `1c kb export` writes
 * documents and never indexes, and `1c assets` inlines whatever it finds. So what
 * is proven here is not that a pipeline runs but that the SHIPPING step now refuses
 * to ship two halves that disagree, in both the forms that disagreement takes:
 *
 *   1. ABSENT   — a document with no manifest entry at all.
 *   2. STALE    — a document present under a different version, which is the same
 *                 lie in a weaker form: found, and ranked by vectors built from
 *                 text it no longer has.
 *
 * AND THAT THE ONE EXEMPTION IS DERIVED. The awareness map cannot be in the
 * manifests and must not be — it is written after both index passes and carries the
 * kind the corpus predicate skips, so a map does not describe its own description.
 * The check asks the predicate rather than the filename, so the exemption is a
 * property and not a special case, and `1c assets` says out loud what it exempted.
 *
 * ONE DOUBLE, AND IT IS THE MODEL — `fixtures/kb-stub-model.mjs`, through
 * `LAGRANGE_KM_EMBEDDER`, as REQ-123 and REQ-158 do it. Nothing here is about
 * embedding quality; the corpus resolution, both index builds and the bundle read
 * are the real thing.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

const CORPUS: Record<string, string> = {
  'DOC-A.md': `---
id: DOC-A
type: doc
title: Carousel behaviour module
---
# Carousel behaviour module

The carousel rotates slides. Autoplay and interval are behavioural config.
`,
  'DOC-B.md': `---
id: DOC-B
type: doc
title: Storage and revisions
---
# Storage and revisions

Publishing snapshots the draft into a numbered revision and renders the output.
`,
}

/** A KB root with a corpus, a declaration, both indexes and a map — a real build. */
async function buildFixtureKb(root: string): Promise<void> {
  const dir = corpusDir(root)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    configPath(root),
    JSON.stringify({
      knowledge_bases: {
        system: {
          description: 'Test system knowledge.',
          corpus: {},
          landscape: 'authored',
          source: 'shipped',
        },
      },
    }),
    'utf8',
  )
  for (const [name, text] of Object.entries(CORPUS)) {
    writeFileSync(path.join(dir, name), text, 'utf8')
  }
  await indexFixtureKb(root)
  writeFileSync(
    path.join(dir, 'awareness.md'),
    awarenessDocument('## Behaviour modules\n\nCarousels and forms. Start at DOC-A.\n', SYSTEM_KB),
    'utf8',
  )
}

/** Both index passes over whatever the corpus currently holds. */
async function indexFixtureKb(root: string): Promise<void> {
  const dir = corpusDir(root)
  const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
  const { nodeIndexSource } = await import(
    /* @vite-ignore */ sharedModuleUrl('knowledge', './node')
  )
  const binding = await bindKb(root)
  const embedder = await resolveEmbedder()
  await lib.buildIndex(binding.store, binding.kbs, nodeIndexSource(path.join(dir, 'index')), {
    embedder,
    sources: binding.sources,
  })
  await lib.buildChunkIndex(
    binding.store,
    binding.kbs,
    nodeIndexSource(path.join(dir, 'chunks')),
    { embedder, sources: binding.sources },
  )
}

/**
 * A repo-shaped directory whose `kb/` is the fixture — what `writeKbModule` walks.
 *
 * A symlink rather than a copy, so a document written into the fixture corpus is
 * the same document the asset build reads. Copying would make the two trees drift
 * for exactly the reason this ticket exists.
 */
function repoAround(root: string): string {
  const repo = mkdtempSync(path.join(tmpdir(), 'bug48-repo-'))
  symlinkSync(root, path.join(repo, 'kb'), 'dir')
  return repo
}

describe('BUG-48 — the corpus and the index are one artefact', () => {
  let root: string

  beforeAll(async () => {
    root = mkdtempSync(path.join(tmpdir(), 'bug48-kb-'))
    process.env.LAGRANGE_KM_EMBEDDER = STUB
    await buildFixtureKb(root)
  }, 120_000)

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    rmSync(root, { recursive: true, force: true })
  })

  it('test_UAT_FC_BUG-48_a_coherent_bundle_passes_and_names_what_it_exempted', async () => {
    const bundle = await kbBundle(root)
    const skew = await kbSkew(bundle!, root)

    // The healthy state: every document the corpus predicate admits is in both
    // manifests, under the same version.
    expect(skew.missing).toEqual([])
    expect(skew.stale).toEqual([])
    expect(kbSkewError(skew)).toBeNull()

    // AND THE MAP IS EXEMPT — reported, not silently dropped. It is written after
    // both index passes and carries the kind `resolveCorpus` skips, so it cannot
    // be in a manifest built before it existed and must not be in one built after:
    // a map that mapped itself would describe its own description. It is not
    // unreachable for being unsearchable — DOC-39 §6 injects it at priming, into
    // every session, on every turn.
    expect(skew.exempt).toEqual(['awareness'])
  })

  it('test_UAT_FC_BUG-48_a_document_the_index_does_not_hold_refuses_the_bundle', async () => {
    // Exactly how this checkout got into the state the ticket describes: a
    // document written into the corpus after the last index build. Nothing is
    // wrong with the file, the export, or the pipeline — and it is unreachable.
    const added = path.join(corpusDir(root), 'DOC-C.md')
    writeFileSync(
      added,
      '---\nid: DOC-C\ntype: doc\ntitle: The layout vocabulary\n---\n# The layout vocabulary\n\nEvery field of every element kind.\n',
      'utf8',
    )
    try {
      const bundle = await kbBundle(root)
      const skew = await kbSkew(bundle!, root)
      expect(skew.missing).toEqual(['DOC-C'])
      expect(skew.stale).toEqual([])

      // REFUSED, NOT WARNED. The failure mode of shipping this is an assistant
      // that reports a subject as one it has nothing on, weeks later, in front of
      // a client — and nobody attributes a bad answer to a stale index. A warning
      // in a build log is read once, by the person who already knows.
      await expect(requireCoherentKb(bundle!, root)).rejects.toBeInstanceOf(KbSkewError)
    } finally {
      rmSync(added, { force: true })
    }
  })

  it('test_UAT_FC_BUG-48_a_document_the_index_holds_under_an_older_version_refuses_too', async () => {
    // THE SAME LIE IN A WEAKER FORM, and the one a presence check cannot see. The
    // document is retrievable, so nothing looks broken; it is simply ranked by
    // vectors built from text it no longer has, and returned saying something
    // else. The manifest keys on exactly the version that detects this, so the
    // test here is upstream's own — any difference at all, not merely an older
    // date.
    const file = path.join(corpusDir(root), 'DOC-A.md')
    const original = readFileSync(file, 'utf8')
    try {
      writeFileSync(file, original + '\nAutoplay pauses on hover.\n', 'utf8')
      const later = new Date(Date.now() + 60_000)
      utimesSync(file, later, later)

      const bundle = await kbBundle(root)
      const skew = await kbSkew(bundle!, root)
      expect(skew.missing).toEqual([])
      expect(skew.stale).toEqual(['DOC-A'])
      await expect(requireCoherentKb(bundle!, root)).rejects.toBeInstanceOf(KbSkewError)

      // And re-indexing is what clears it, rather than anything the check knows
      // about: the repair is the build, which is the point of the message below.
      await indexFixtureKb(root)
      const rebuilt = await kbSkew((await kbBundle(root))!, root)
      expect(rebuilt.stale).toEqual([])
      expect(rebuilt.missing).toEqual([])
    } finally {
      writeFileSync(file, original, 'utf8')
      await indexFixtureKb(root)
    }
  })

  it('test_UAT_FC_BUG-48_the_refusal_names_the_documents_and_the_command_that_fixes_them', () => {
    // "The index is stale" is a diagnosis an operator cannot act on. Which
    // documents, in WHICH of the two states — because the two have different
    // symptoms and an operator who knows only the count learns neither — and the
    // one command that repairs both.
    const message = kbSkewError({
      missing: ['REF-l1', 'REF-surface'],
      stale: ['DOC-17'],
      exempt: ['awareness'],
    })
    expect(message).not.toBeNull()
    expect(message).toContain('REF-l1')
    expect(message).toContain('REF-surface')
    expect(message).toContain('DOC-17')
    expect(message).toMatch(/MISSING/)
    expect(message).toMatch(/STALE/)
    expect(message).toContain('1c kb build')

    // The exemption is not a failure and does not appear among the reasons the
    // build stopped — it would read as one more thing to fix.
    expect(message).not.toContain('awareness')
  })

  it('test_UAT_FC_BUG-48_the_asset_build_refuses_before_it_overwrites_the_shipped_bundle', async () => {
    const repo = repoAround(root)
    const generated = mkdtempSync(path.join(tmpdir(), 'bug48-gen-'))
    const added = path.join(corpusDir(root), 'DOC-D.md')
    try {
      // A coherent build first, so there is a previously shipped bundle to lose.
      const good = await writeKbModule(generated, repo)
      expect(good.built).toBe(true)
      const shipped = readFileSync(path.join(generated, 'kb.js'), 'utf8')
      expect(shipped).toContain('DOC-A.md')

      writeFileSync(
        added,
        '---\nid: DOC-D\ntype: doc\ntitle: Unindexed\n---\n# Unindexed\n\nWritten after the last build.\n',
        'utf8',
      )
      await expect(writeKbModule(generated, repo)).rejects.toBeInstanceOf(KbSkewError)

      // NOTHING WAS WRITTEN. The refusal costs a build and never a shipped one —
      // the module the Worker imports is still the last coherent bundle, so a
      // failed asset build degrades to "yesterday's knowledge" rather than to a
      // Worker whose static import has nothing to resolve.
      expect(readFileSync(path.join(generated, 'kb.js'), 'utf8')).toBe(shipped)
    } finally {
      rmSync(added, { force: true })
      rmSync(generated, { recursive: true, force: true })
      rmSync(repo, { recursive: true, force: true })
    }
  })

  it('test_UAT_FC_BUG-48_the_asset_report_says_which_documents_ship_unsearchable', () => {
    // An exemption nobody can see is indistinguishable from the bug. The names,
    // not a count: a count is a number the operator cannot check, while three
    // words let them see that the map is the only thing shipping unsearchable.
    const line = kbLine({ built: true, documents: 3, bytes: 512 * 1024, exempt: ['awareness'] })
    expect(line).toContain('awareness')
    expect(line).toMatch(/primed not indexed/)

    // And an ordinary build says nothing extra, so the clause keeps meaning
    // something when it appears.
    expect(kbLine({ built: true, documents: 3, bytes: 1024, exempt: [] })).not.toMatch(
      /primed not indexed/,
    )
  })
})

describe('BUG-48 — one command runs the release in order', () => {
  it('test_UAT_FC_BUG-48_the_release_script_builds_before_it_inlines', () => {
    // The ordering `kb build` enforces internally binds nothing outside it, and
    // running the producers without the indexes is exactly how the shipped bundle
    // got into the state this ticket describes. So the order stops being something
    // an operator has to remember between two commands and becomes one command.
    const script = readFileSync('bin/kb-release', 'utf8')
    const build = script.indexOf('1c" kb build')
    const assets = script.indexOf('1c" assets')
    expect(build).toBeGreaterThan(-1)
    expect(assets).toBeGreaterThan(-1)
    expect(build).toBeLessThan(assets)

    // `set -e`, so the inline never runs on top of a failed build — which would
    // reproduce the defect with an extra step.
    expect(script).toMatch(/set -euo pipefail/)
    expect(existsSync('bin/kb-release')).toBe(true)
  })
})
