import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
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
 * The shipping gate (BUNDLE-35 / BUG-48): packing the system KB into the
 * application build refuses a corpus its index does not cover, exempts by
 * predicate, stamps at the index's own precision, and is reachable as one
 * release command that runs the build before the pack.
 *
 * One double, and it is the model — `fixtures/kb-stub-model.mjs` through
 * `LAGRANGE_KM_EMBEDDER`. Corpus resolution, both index builds, the bundle read
 * and the module write are the real thing.
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

const WHOLE_SECOND_STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/

async function knowledgeLib(): Promise<{ MANIFEST_FILE: string }> {
  return (await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))) as {
    MANIFEST_FILE: string
  }
}

/** A declaration and corpus, optionally with every file's mtime set off a whole second. */
function writeFixtureCorpus(root: string, fractionalMtimes = false): void {
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
  let i = 0
  for (const [name, text] of Object.entries(CORPUS)) {
    const file = path.join(dir, name)
    writeFileSync(file, text, 'utf8')
    if (fractionalMtimes) {
      // Seconds with a fractional part: 437ms, 438ms… past a whole second.
      const t = 1_790_000_000 + i * 7 + 0.437 + i * 0.001
      utimesSync(file, t, t)
    }
    i += 1
  }
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

/** The map is written after both index passes, as `1c kb build` writes it. */
function writeMap(root: string): void {
  writeFileSync(
    path.join(corpusDir(root), 'awareness.md'),
    awarenessDocument('## Behaviour modules\n\nCarousels and forms. Start at DOC-A.\n', SYSTEM_KB),
    'utf8',
  )
}

async function buildFixtureKb(root: string, fractionalMtimes = false): Promise<void> {
  writeFixtureCorpus(root, fractionalMtimes)
  await indexFixtureKb(root)
  writeMap(root)
}

/** A repo-shaped directory whose `kb/` is the fixture (symlinked, so writes are shared). */
function repoAround(root: string): string {
  const repo = mkdtempSync(path.join(tmpdir(), 'kb-gate-repo-'))
  symlinkSync(root, path.join(repo, 'kb'), 'dir')
  return repo
}

/** The packed module's value, read back from the file the application build wrote. */
function readPackedModule(generated: string): {
  index: Record<string, string>
  chunks: Record<string, string>
  docs: Record<string, { text: string; updated_at: string }>
} {
  const source = readFileSync(path.join(generated, 'kb.js'), 'utf8')
  const line = source.split('\n').find((l) => l.startsWith('export const KB = '))
  expect(line).toBeDefined()
  return JSON.parse(line!.slice('export const KB = '.length))
}

describe('System knowledge base — the shipping gate', () => {
  let root: string

  beforeAll(async () => {
    root = mkdtempSync(path.join(tmpdir(), 'kb-gate-'))
    process.env.LAGRANGE_KM_EMBEDDER = STUB
    await buildFixtureKb(root)
  }, 120_000)

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    rmSync(root, { recursive: true, force: true })
  })

  it('test_UAT_AC2099_packing_refuses_a_document_absent_from_either_manifest_and_writes_nothing', async () => {
    // A coherent bundle agrees and packs.
    const coherent = await kbSkew((await kbBundle(root))!, root)
    expect(coherent.missing).toEqual([])
    expect(coherent.stale).toEqual([])
    expect(kbSkewError(coherent)).toBeNull()

    const repo = repoAround(root)
    const generated = mkdtempSync(path.join(tmpdir(), 'kb-gate-gen-'))
    const added = path.join(corpusDir(root), 'DOC-C.md')
    try {
      const good = await writeKbModule(generated, repo)
      expect(good.built).toBe(true)
      const shipped = readFileSync(path.join(generated, 'kb.js'), 'utf8')
      const shippedTypes = readFileSync(path.join(generated, 'kb.d.ts'), 'utf8')
      expect(shipped).toContain('DOC-A.md')

      // A document written into the corpus after the last index build.
      writeFileSync(
        added,
        '---\nid: DOC-C\ntype: doc\ntitle: The layout vocabulary\n---\n# The layout vocabulary\n\nEvery field of every element kind.\n',
        'utf8',
      )
      const skew = await kbSkew((await kbBundle(root))!, root)
      expect(skew.missing).toEqual(['DOC-C'])
      expect(skew.stale).toEqual([])

      // Refused, not warned: the application build's KB step rejects…
      const refusal = await writeKbModule(generated, repo).then(
        () => null,
        (e: unknown) => e,
      )
      expect(refusal).toBeInstanceOf(KbSkewError)

      // …and the previously shipped module is byte-for-byte as it was.
      expect(readFileSync(path.join(generated, 'kb.js'), 'utf8')).toBe(shipped)
      expect(readFileSync(path.join(generated, 'kb.d.ts'), 'utf8')).toBe(shippedTypes)

      // The error says the halves disagree, names the document under MISSING,
      // and names the repair.
      const message = (refusal as Error).message
      expect(message).toMatch(/corpus and its index disagree/)
      const missingAt = message.indexOf('MISSING')
      expect(missingAt).toBeGreaterThan(-1)
      expect(message.indexOf('DOC-C', missingAt)).toBeGreaterThan(missingAt)
      expect(message).not.toMatch(/STALE/)
      expect(message).toContain('1c kb build')
      expect(message).toContain('bin/kb-release')
    } finally {
      rmSync(added, { force: true })
      rmSync(generated, { recursive: true, force: true })
      rmSync(repo, { recursive: true, force: true })
    }
  }, 120_000)

  it('test_UAT_AC2100_a_document_indexed_under_an_older_version_is_stale_and_refused', async () => {
    const file = path.join(corpusDir(root), 'DOC-A.md')
    const original = readFileSync(file, 'utf8')
    try {
      // The document changes after it was indexed: its file stamp moves past the
      // manifest's.
      writeFileSync(file, original + '\nAutoplay pauses on hover.\n', 'utf8')
      const later = new Date(Date.now() + 60_000)
      utimesSync(file, later, later)

      const bundle = (await kbBundle(root))!
      const skew = await kbSkew(bundle, root)
      expect(skew.stale).toEqual(['DOC-A'])
      expect(skew.missing).toEqual([])

      const refusal = await requireCoherentKb(bundle, root).then(
        () => null,
        (e: unknown) => e,
      )
      expect(refusal).toBeInstanceOf(KbSkewError)
      const message = (refusal as Error).message
      const staleAt = message.indexOf('STALE')
      expect(staleAt).toBeGreaterThan(-1)
      expect(message.indexOf('DOC-A', staleAt)).toBeGreaterThan(staleAt)
      // Listed in its own state, not as missing.
      expect(message).not.toMatch(/MISSING/)

      // Rebuilding the indexes clears the finding.
      await indexFixtureKb(root)
      const rebuilt = await kbSkew((await kbBundle(root))!, root)
      expect(rebuilt.stale).toEqual([])
      expect(rebuilt.missing).toEqual([])
    } finally {
      writeFileSync(file, original, 'utf8')
      await indexFixtureKb(root)
    }
  }, 120_000)

  it('test_UAT_AC2101_the_map_is_exempt_by_predicate_and_named_on_the_report_line', async () => {
    // The map was written after indexing; the check passes and exempts exactly it.
    const skew = await kbSkew((await kbBundle(root))!, root)
    expect(skew.missing).toEqual([])
    expect(skew.stale).toEqual([])
    expect(skew.exempt).toEqual(['awareness'])

    // The application build's own report names it — by id, not a count.
    const repo = repoAround(root)
    const generated = mkdtempSync(path.join(tmpdir(), 'kb-gate-gen-'))
    const added = path.join(corpusDir(root), 'DOC-E.md')
    try {
      const report = await writeKbModule(generated, repo)
      expect(report.exempt).toEqual(['awareness'])
      const line = kbLine(report)
      expect(line).toContain('awareness')
      expect(line).toMatch(/primed not indexed/)

      // A pack with no exemptions adds nothing.
      expect(kbLine({ ...report, exempt: [] })).not.toMatch(/primed not indexed/)

      // An exempt document never appears among a refusal's reasons.
      writeFileSync(
        added,
        '---\nid: DOC-E\ntype: doc\ntitle: Unindexed\n---\n# Unindexed\n\nWritten after the last build.\n',
        'utf8',
      )
      const skewed = await kbSkew((await kbBundle(root))!, root)
      expect(skewed.missing).toEqual(['DOC-E'])
      expect(skewed.exempt).toEqual(['awareness'])
      const message = kbSkewError(skewed)
      expect(message).not.toBeNull()
      expect(message).toContain('DOC-E')
      expect(message).not.toContain('awareness')
    } finally {
      rmSync(added, { force: true })
      rmSync(generated, { recursive: true, force: true })
      rmSync(repo, { recursive: true, force: true })
    }
  }, 120_000)
})

describe('System knowledge base — one release command', () => {
  it('test_UAT_AC2102_the_release_command_builds_before_it_packs_and_refuses_unknown_arguments', () => {
    const script = readFileSync('bin/kb-release', 'utf8')

    // Exists and is executable.
    expect(statSync('bin/kb-release').mode & 0o111).not.toBe(0)

    // The knowledge-base build runs before the asset build, then the status report.
    const build = script.indexOf('1c" kb build')
    const assets = script.indexOf('1c" assets')
    const status = script.lastIndexOf('1c" kb status')
    expect(build).toBeGreaterThan(-1)
    expect(assets).toBeGreaterThan(build)
    expect(status).toBeGreaterThan(assets)

    // Fail-fast: exit on error, unset variable and pipeline failure.
    expect(script).toMatch(/^set -euo pipefail$/m)

    // An unknown argument is refused with a failing exit and builds nothing.
    const unknown = spawnSync('bash', ['bin/kb-release', '--not-a-form'], { encoding: 'utf8' })
    expect(unknown.status).not.toBe(0)
    expect(unknown.stderr).toContain("unknown argument '--not-a-form'")
    expect(unknown.stdout).not.toMatch(/Build the knowledge base/)

    // --help prints usage and succeeds.
    const help = spawnSync('bash', ['bin/kb-release', '--help'], { encoding: 'utf8' })
    expect(help.status).toBe(0)
    expect(help.stdout).toContain('--status')
    expect(help.stdout).not.toMatch(/Build the knowledge base/)
  })
})

describe('System knowledge base — stamp precision', () => {
  let root: string

  beforeAll(async () => {
    root = mkdtempSync(path.join(tmpdir(), 'kb-gate-stamp-'))
    process.env.LAGRANGE_KM_EMBEDDER = STUB
    await buildFixtureKb(root, true)
  }, 120_000)

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    rmSync(root, { recursive: true, force: true })
  })

  it('test_UAT_AC2103_packed_stamps_match_the_manifests_at_whole_second_precision', async () => {
    // Vacuity guard: the fixture's file times really are off a whole second.
    for (const name of Object.keys(CORPUS)) {
      expect(statSync(path.join(corpusDir(root), name)).mtimeMs % 1000).not.toBe(0)
    }

    const repo = repoAround(root)
    const generated = mkdtempSync(path.join(tmpdir(), 'kb-gate-gen-'))
    try {
      const report = await writeKbModule(generated, repo)
      expect(report.built).toBe(true)
      const packed = readPackedModule(generated)

      const { MANIFEST_FILE } = await knowledgeLib()
      const docManifest = JSON.parse(packed.index[MANIFEST_FILE]) as Record<string, string>
      const chunkManifest = JSON.parse(packed.chunks[MANIFEST_FILE]) as Record<string, string>

      for (const name of Object.keys(CORPUS)) {
        const uid = name.slice(0, -'.md'.length)
        const stamp = packed.docs[name].updated_at
        expect(stamp).toMatch(WHOLE_SECOND_STAMP)
        expect(stamp).not.toMatch(/\.\d+Z$/)
        expect(docManifest[uid]).toBe(stamp)
        expect(chunkManifest[uid]).toBe(stamp)
      }

      // And the agreement check sees nothing stale on this up-to-date build.
      const skew = await kbSkew((await kbBundle(root))!, root)
      expect(skew.stale).toEqual([])
      expect(skew.missing).toEqual([])
    } finally {
      rmSync(generated, { recursive: true, force: true })
      rmSync(repo, { recursive: true, force: true })
    }
  }, 120_000)
})
