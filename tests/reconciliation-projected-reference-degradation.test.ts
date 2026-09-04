import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * STORY-0d7d3aad — a reference degrades to fewer SENTENCES, never to fewer
 * ENTRIES.
 *
 * A reference is structurally derived and prosaically enriched: the structure
 * comes from the source objects themselves (the schemas, the catalogue, the
 * declaration), while the explanatory sentences are harvested from the doc
 * comments in the source FILES. Those files are read off disk by path, so they
 * are the part that can go missing — a file that moves, a comment that is
 * reformatted, a field that is renamed.
 *
 * The only thing doubled here is the filesystem, and only for the two prose
 * sources, and only while `blind` is set. Everything else — the schemas, the
 * envelope, the projector, the corpus writer — is real. That is the point: the
 * structural half has to survive the prose half being unreadable.
 */

const state = vi.hoisted(() => ({ blind: false }))

/** The prose-bearing sources: the two L1 files whose comments carry meanings. */
const PROSE_SOURCES = /packages[/\\]site-schema[/\\]src[/\\]l1[/\\](?:schema|validate)\.ts$/

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  const readFileSync = ((target: unknown, ...rest: unknown[]) => {
    const asPath = typeof target === 'string' ? target : String(target)
    if (state.blind && PROSE_SOURCES.test(asPath)) {
      const error = new Error(`ENOENT: no such file or directory, open '${asPath}'`) as NodeJS.ErrnoException
      error.code = 'ENOENT'
      throw error
    }
    return (actual.readFileSync as (...args: unknown[]) => unknown)(target, ...rest)
  }) as typeof actual.readFileSync
  const patched = { ...actual, readFileSync }
  return { ...patched, default: patched }
})

const { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } = await import(
  'node:fs'
)
const { tmpdir } = await import('node:os')
const path = (await import('node:path')).default
const { configPath, corpusDir, writeProjections, SHIPPED_SOURCE, SYSTEM_KB } = await import(
  '../tools/generate/src/cli/kb'
)
const { isProjected, projections } = await import('../tools/generate/src/cli/kb-projection')

const roots: string[] = []

afterEach(() => {
  state.blind = false
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true })
})

function scratchRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'kb-degraded-'))
  roots.push(root)
  mkdirSync(corpusDir(root), { recursive: true })
  writeFileSync(
    configPath(root),
    JSON.stringify({
      knowledge_bases: {
        [SYSTEM_KB]: {
          description: 'Test system knowledge.',
          corpus: {},
          landscape: 'authored',
          source: SHIPPED_SOURCE,
          weight: 1,
        },
      },
    }),
    'utf8',
  )
  return root
}

/**
 * A document's ENTRIES — every heading, and every bullet stripped of the
 * explanatory sentence a definition contributes.
 *
 * The projector renders a field as ``- `name` — type; required`` and then, when
 * it has prose for it, appends `. <definition>`. So the entry is everything up
 * to that appended sentence, and comparing entries compares exactly what must
 * not be lost: the names, the types, the value sets, the bounds, and whether a
 * field may be omitted.
 */
function entries(body: string): string[] {
  return body
    .split('\n')
    .filter((line) => line.startsWith('#') || /^\s*- /.test(line))
    .map((line) => (line.startsWith('#') ? line : line.replace(/\.\s+[A-Z0-9`].*$/, '')))
}

describe('a reference degrades to fewer sentences, never to fewer entries', () => {
  it('test_UAT_AC1513_unreadable_source_prose_costs_a_sentence_never_an_entry', () => {
    // With the prose present: the reference as it normally reads.
    const enriched = new Map(projections().map((doc) => [doc.id, doc]))
    expect(enriched.size).toBeGreaterThan(0)
    const enrichedL1 = enriched.get('REF-l1')!.body
    // The premise: there really is prose to lose, or this proves nothing.
    expect(entries(enrichedL1).join('\n')).not.toBe(enrichedL1)

    // Now with the prose-bearing sources unreadable. The build must not fail.
    state.blind = true
    const root = scratchRoot()
    const result = writeProjections(root)
    const degraded = new Map(projections().map((doc) => [doc.id, doc]))

    // The whole set is still produced, and still written.
    expect(result.projected).toEqual([...enriched.keys()].sort())
    expect(readdirSync(corpusDir(root)).filter((name) => isProjected(name)).sort()).toEqual(
      [...enriched.keys()].sort().map((id) => `${id}.md`),
    )

    for (const [id, before] of enriched) {
      const after = degraded.get(id)
      expect(after, `${id} was not produced without its prose`).toBeDefined()
      // Every reference still names the full set it names when the prose is
      // present — the same components, element kinds, fields, value sets, bounds
      // and operations. No entry has been dropped.
      expect(entries(after!.body)).toEqual(entries(before.body))
      // And it still says where it came from.
      expect(after!.source).toBe(before.source)
    }

    // Only the enrichment is gone, and nothing has been invented to stand in for
    // a missing definition: every degraded line is a prefix of the enriched one.
    const degradedL1 = degraded.get('REF-l1')!.body
    expect(degradedL1).not.toBe(enrichedL1)
    expect(degradedL1.length).toBeLessThan(enrichedL1.length)
    const beforeLines = enrichedL1.split('\n')
    const afterLines = degradedL1.split('\n')
    expect(afterLines.length).toBe(beforeLines.length)
    afterLines.forEach((line, at) => {
      expect(beforeLines[at].startsWith(line), `invented text at line ${at + 1}: ${line}`).toBe(true)
    })

    // The two references whose sources are not read off disk are untouched.
    for (const id of ['REF-behaviors', 'REF-surface']) {
      expect(degraded.get(id)!.body).toBe(enriched.get(id)!.body)
    }

    // The document on disk carries the degraded reference, frontmatter and all.
    const written = readFileSync(path.join(corpusDir(root), 'REF-l1.md'), 'utf8')
    expect(written).toContain('## The limits every page is held to')
    expect(written).toContain('`maxNodes`')
  })
})
