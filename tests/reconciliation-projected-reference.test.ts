import { afterEach, describe, expect, it } from 'vitest'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  bindKb,
  configPath,
  corpusDir,
  corpusMembership,
  exportCorpus,
  kbStatus,
  projectedDocument,
  resolveEmbedder,
  SHIPPED_SOURCE,
  SYSTEM_KB,
  writeProjections,
} from '../tools/generate/src/cli/kb'
import {
  harvestDeclarations,
  definitionOf,
  isProjected,
  projectBehaviorCatalogue,
  projectControlSurface,
  projectL1Vocabulary,
  projections,
} from '../tools/generate/src/cli/kb-projection'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
// Relative rather than by package specifier, for the reason the REQ-165 suite
// gives: pnpm gives each workspace package its own `node_modules`, so
// `@1stcontact/*` resolves from inside a package and not from `tests/`. The
// modules reached are the same ones the projector imports — the same file id,
// therefore the same instance, which is what lets a test perturb a source and
// watch the next build carry the change.
import { CATALOG } from '../packages/framework/src/modules/catalog'
import * as L1Schema from '../packages/site-schema/src/l1/schema'
import {
  l1BorderSchema,
  l1ImageAxesSchema,
  l1NodeSchema,
  l1PointerAccentSchema,
  l1TextAxesSchema,
} from '../packages/site-schema/src/l1/schema'
import { L1_ENVELOPE } from '../packages/site-schema/src/l1/validate'
import l1Surface from '../tools/generate/src/cli/ai/l1-surface.json'
import instances from '../tools/generate/src/cli/ai/instances.json'

/**
 * STORY-0d7d3aad — **the projected reference**: the product's own facts reach the
 * assistant generated from their source, never authored.
 *
 * Almost every assertion here is made *against the source itself* rather than
 * against an expected string. A snapshot of the catalogue, the schemas or the
 * surface declaration would go stale in precisely the way a projection exists to
 * prevent, and a test that permitted that would be evidence of nothing.
 *
 * The one boundary doubled is the embedding model (`fixtures/kb-stub-model.mjs`).
 * The corpus, the export, the store, the index and the search are real.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

/** The three sources the product declares today, as their document identities. */
const DECLARED_SOURCES = ['REF-behaviors', 'REF-l1', 'REF-surface']

// ── fixtures ─────────────────────────────────────────────────────────────────

const roots: string[] = []

afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true })
})

/** A scratch KB root with a declaration, torn down after the test that made it. */
function scratchRoot(corpus: Record<string, unknown> = {}): string {
  const root = mkdtempSync(path.join(tmpdir(), 'kb-projected-'))
  roots.push(root)
  mkdirSync(corpusDir(root), { recursive: true })
  writeFileSync(
    configPath(root),
    JSON.stringify({
      knowledge_bases: {
        [SYSTEM_KB]: {
          description: 'Test system knowledge.',
          corpus,
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

/** An authored corpus document, of the kind a person writes and a ticket exports. */
function plantAuthored(root: string, id: string, body: string): string {
  const file = path.join(corpusDir(root), `${id}.md`)
  writeFileSync(
    file,
    `---\nid: ${id}\ntype: doc\ntitle: ${id}\nfields:\n  doc_kind: system_kb\n---\n\n${body}\n`,
    'utf8',
  )
  return file
}

/** A corpus document's frontmatter, as `DocDirStore` would read it. */
function frontmatter(text: string): Record<string, string> {
  const end = text.indexOf('\n---', 4)
  const fields: Record<string, string> = {}
  for (const line of text.slice(4, end).split('\n')) {
    const at = line.indexOf(':')
    if (at === -1) continue
    fields[line.slice(0, at).trim()] = line.slice(at + 1).trim()
  }
  return fields
}

/** Nanosecond mtime — millisecond resolution is too coarse for two fast builds. */
function stampOf(file: string): bigint {
  return statSync(file, { bigint: true }).mtimeNs
}

/**
 * The body under one heading, up to the next heading of the same or shallower
 * level. Assertions about scoping are only meaningful when they are made inside
 * a section rather than across the whole document.
 */
function section(body: string, heading: string): string {
  const at = body.indexOf(`\n${heading}\n`)
  expect(at, `no section ${heading}`).toBeGreaterThanOrEqual(0)
  const depth = (heading.match(/^#+/) ?? ['#'])[0].length
  const rest = body.slice(at + heading.length + 2)
  const end = rest.search(new RegExp(`\\n#{1,${depth}} `))
  return end === -1 ? rest : rest.slice(0, end)
}

/** The bullet a named entry is rendered on, or `''`. */
function bulletFor(text: string, name: string): string {
  return (
    text
      .split('\n')
      .find((line) => new RegExp(`^\\s*- \`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\`[ ;—]`).test(line)) ?? ''
  )
}

// ── Zod introspection, mirroring what the projector reads ────────────────────

type Def = Record<string, unknown>
const zdef = (schema: unknown): Def => ((schema as { def?: Def } | null)?.def ?? {}) as Def

/** Peel the wrappers that carry no vocabulary of their own. */
function unwrapAll(schema: unknown): unknown {
  let current = schema
  for (let hop = 0; hop < 12; hop += 1) {
    const d = zdef(current)
    if (d.type === 'optional' || d.type === 'nullable' || d.type === 'readonly' || d.type === 'default') {
      current = d.innerType
    } else if (d.type === 'lazy' && typeof d.getter === 'function') {
      current = (d.getter as () => unknown)()
    } else if (d.type === 'pipe') {
      current = d.in
    } else return current
  }
  return current
}

function shapeOf(schema: unknown): Record<string, unknown> | null {
  const inner = unwrapAll(schema)
  const d = zdef(inner)
  return d.type === 'object' ? ((d.shape ?? {}) as Record<string, unknown>) : null
}

/** Whether the projector would mark a field omittable — its exact rule. */
function omittable(schema: unknown): boolean {
  const kind = zdef(schema).type
  return kind === 'optional' || kind === 'default'
}

/** Every element kind the node union permits, with the shape it accepts. */
function elementKinds(): Array<{ kind: string; shape: Record<string, unknown> }> {
  const options = (zdef(unwrapAll(l1NodeSchema)).options ?? []) as unknown[]
  const kinds: Array<{ kind: string; shape: Record<string, unknown> }> = []
  for (const option of options) {
    const shape = shapeOf(option)
    if (!shape) continue
    const values = (zdef(unwrapAll(shape.kind)).values ?? []) as unknown[]
    if (values.length) kinds.push({ kind: String(values[0]), shape })
  }
  return kinds
}

/** The closed value set a field declares, read off the schema itself. */
function enumValues(objectSchema: unknown, field: string): string[] {
  const shape = shapeOf(objectSchema) ?? {}
  const inner = unwrapAll(shape[field])
  return Object.keys((zdef(inner).entries ?? {}) as Record<string, unknown>)
}

/**
 * Every value a shape's own closed sets permit — the whole inline vocabulary it
 * is rendered with.
 *
 * Only fields that resolve to an ANONYMOUS enum, because those are precisely the
 * ones the projector spells out in place; a field that resolves to a named shape
 * (`blendMode` → `blend mode`) is rendered as that shape's name and its values
 * live in the shape's own section. Comparing one field against one field is not
 * enough either: `none` is permitted by `textTransform` and by `objectFit` both,
 * and is therefore no evidence of pooling in either direction.
 */
const NAMED_SHAPES = new Set<unknown>(
  Object.entries(L1Schema as Record<string, unknown>)
    .filter(([key, value]) => key.startsWith('l1') && key.endsWith('Schema') && typeof value === 'object' && value !== null)
    .map(([, value]) => value),
)

function inlineVocabulary(objectSchema: unknown): Set<string> {
  const values = new Set<string>()
  for (const [field, schema] of Object.entries(shapeOf(objectSchema) ?? {})) {
    if (NAMED_SHAPES.has(unwrapAll(schema))) continue
    for (const value of enumValues(objectSchema, field)) values.add(value)
  }
  return values
}

/** The projector's own rendering of a numeric bound. */
function renderRange(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) return `${min}–${max}`
  if (min !== undefined) return `at least ${min}`
  if (max !== undefined) return `at most ${max}`
  return ''
}

// ── the surface declaration, read as data ────────────────────────────────────

interface SurfaceOp {
  op: string
  tool?: string
  params?: Record<string, { type?: string; required?: boolean }>
  returns?: { shape?: string }
  errors?: string[]
}
interface Surface {
  operations: SurfaceOp[]
  groups: Array<{ group: string; title?: string; operations?: string[] }>
  sequences: Array<{ name: string }>
  param_types: Record<string, unknown>
  shapes: Record<string, unknown>
  errors: Record<string, unknown>
  absences: Array<{ name: string }>
}
const surface = l1Surface as unknown as Surface

/**
 * Run `body` with one extra operation in the declared surface, then take it out
 * again. The declaration is a module singleton shared with the projector — which
 * is exactly the point (a change to the source reaches the next build) — so the
 * perturbation has to be undone whatever happens.
 */
function withExtraOperation<T>(op: SurfaceOp, body: () => T): T {
  surface.operations.push(op)
  try {
    return body()
  } finally {
    const at = surface.operations.indexOf(op)
    if (at !== -1) surface.operations.splice(at, 1)
  }
}

// ── the corpus: production, membership, sweeps, stamps ───────────────────────

describe('the projected reference reaches the corpus', () => {
  it('test_UAT_AC1502_every_declared_source_produces_a_reference_named_in_the_report', () => {
    // The set is complete or the build is not: a source that produced no
    // reference is a source the assistant will be silently unable to answer
    // about. Asserted as a SET rather than by sampling one member.
    const root = scratchRoot()
    const first = writeProjections(root)

    const declared = projections().map((doc) => doc.id).sort()
    expect(declared).toEqual(DECLARED_SOURCES)
    expect(first.projected).toEqual(declared)

    const onDisk = readdirSync(corpusDir(root)).filter((name) => isProjected(name)).sort()
    expect(onDisk).toEqual(declared.map((id) => `${id}.md`))
    expect(kbStatus(root).projected).toBe(declared.length)

    // The command's report NAMES each generated document rather than counting
    // it: a projection has no ticket, so an operator who cannot find `REF-l1`
    // in the ticket store has to be told it was produced, not sent looking.
    const report = `projected: ${first.projected.join(', ')}`
    for (const id of declared) expect(report).toContain(id)
    expect(report).not.toMatch(/^projected: \d+$/)

    // Produced from nothing rather than found: remove the directory entirely
    // and the whole set comes back.
    rmSync(corpusDir(root), { recursive: true, force: true })
    expect(existsSync(corpusDir(root))).toBe(false)
    const second = writeProjections(root)
    expect(second.projected).toEqual(declared)
    expect(readdirSync(corpusDir(root)).filter((n) => isProjected(n)).sort()).toEqual(
      declared.map((id) => `${id}.md`),
    )
  })

  it('test_UAT_AC1503_a_generated_reference_is_searchable_and_asserts_its_own_membership', async () => {
    // Nothing else can assert a generated document's membership on its behalf —
    // it has no originating ticket — so it says so itself, and is then indexed,
    // chunked and retrieved on exactly the same terms as a document a person
    // wrote. Nothing below names a filename: that is the whole point of a KB.
    const root = scratchRoot()
    plantAuthored(
      root,
      'DOC-AUTHORED',
      '# Restraint\n\nHierarchy is made by contrast, not by decoration.\n',
    )
    writeProjections(root)

    for (const file of DECLARED_SOURCES.map((id) => `${id}.md`)) {
      const fields = frontmatter(readFileSync(path.join(corpusDir(root), file), 'utf8'))
      // Membership as the declaration currently states it, plus the two facts
      // that make a generated document accountable: that it was generated, and
      // where its facts came from.
      expect(fields.type).toBe(corpusMembership(root).type)
      expect(fields.doc_kind).toBe('system_kb')
      expect(fields.projected).toBe('true')
      expect(fields.source).toBeTruthy()
    }

    process.env.LAGRANGE_KM_EMBEDDER = STUB
    try {
      const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
      const { nodeIndexSource } = await import(
        /* @vite-ignore */ sharedModuleUrl('knowledge', './node')
      )
      const binding = await bindKb(root)
      const embedder = await resolveEmbedder()
      const chunks = nodeIndexSource(path.join(corpusDir(root), 'chunks'))
      await lib.buildChunkIndex(binding.store, binding.kbs, chunks, {
        embedder,
        sources: binding.sources,
      })

      // Chunk search, because that is the path a question like this takes: a
      // reference document is far too coarse a unit to hand back, and what the
      // assistant needs is the passage that answers the question.
      const hits = await lib.searchChunks('does the carousel component support autoplay', {
        indexes: { [SHIPPED_SOURCE]: chunks },
        store: binding.store,
        kbs: binding.kbs,
        kb: SYSTEM_KB,
        topK: 3,
        embedder,
        sources: binding.sources,
      })

      // The claim is that the generated document ANSWERS a question asked in
      // ordinary words — not that it outranks everything. Rank is deliberately
      // not asserted: the stub is a bag-of-words embedder whose preferences are
      // an artefact of the double rather than a fact about the corpus.
      const behaviors = hits.find((hit: { uid: string }) => hit.uid === 'REF-behaviors')
      expect(behaviors, 'the generated reference was not among the results').toBeDefined()
      const passage = behaviors.chunks[0].text_snippet as string
      expect(passage).toContain('carousel')
      expect(passage).toContain('autoplay')
    } finally {
      delete process.env.LAGRANGE_KM_EMBEDDER
    }
  }, 300_000)

  it('test_UAT_AC1504_a_change_to_a_source_reaches_its_reference_on_the_next_build', () => {
    // The whole reason a reference is generated rather than written: there is no
    // state in which a reference and its source disagree that survives a build,
    // and nothing in the corpus is edited by hand to keep them together.
    const root = scratchRoot()
    const authored = plantAuthored(root, 'DOC-AUTHORED', '# Untouched\n\nBy any build.\n')
    writeProjections(root)

    const refSurface = path.join(corpusDir(root), 'REF-surface.md')
    const before = readFileSync(refSurface, 'utf8')
    const authoredBefore = readFileSync(authored, 'utf8')
    const authoredStamp = stampOf(authored)
    expect(before).not.toContain('reticulate_splines')

    const added = withExtraOperation(
      {
        op: 'reticulate_splines',
        tool: 'reticulate_splines',
        params: { page: { type: 'page_id', required: true } },
        returns: { shape: 'site' },
        errors: ['NOT_FOUND'],
      },
      () => {
        writeProjections(root)
        return readFileSync(refSurface, 'utf8')
      },
    )

    // The added operation is carried, with what it takes and what it returns —
    // rendered from the declaration, not copied from anywhere.
    expect(added).toContain('#### `reticulate_splines`')
    expect(added).toContain('`page` — page_id — required')
    expect(added).toContain('Returns: `site`.')
    expect(added).not.toBe(before)

    // And no authored document was touched to make it so.
    expect(readFileSync(authored, 'utf8')).toBe(authoredBefore)
    expect(stampOf(authored)).toBe(authoredStamp)

    // Withdrawing the change withdraws it from the reference too, on the next
    // build and with nothing edited: the disagreement cannot survive either way.
    writeProjections(root)
    expect(readFileSync(refSurface, 'utf8')).toBe(before)
  })

  it('test_UAT_AC1505_membership_is_taken_from_the_declaration_whatever_it_requires', () => {
    // A generated document that asserted a fixed, remembered membership rule
    // would fall out of the KB — written, indexed and never searched — on the
    // day the rule moved. That day has already come once.
    const moved = scratchRoot({ type: ['reference'], 'fields.in_the_kb': true })
    expect(corpusMembership(moved)).toEqual({ type: 'reference', fields: { in_the_kb: true } })
    writeProjections(moved)
    for (const id of DECLARED_SOURCES) {
      const fields = frontmatter(readFileSync(path.join(corpusDir(moved), `${id}.md`), 'utf8'))
      expect(fields.type).toBe('reference')
      expect(fields.in_the_kb).toBe('true')
      // None of the previous rule's markers.
      expect(fields.system_kb).toBeUndefined()
    }

    // A declaration that restricts nothing: the references are still produced,
    // and are still members of it.
    const open = scratchRoot({})
    expect(corpusMembership(open)).toEqual({ type: 'doc', fields: {} })
    const result = writeProjections(open)
    expect(result.projected).toEqual([...DECLARED_SOURCES])
    for (const id of DECLARED_SOURCES) {
      const fields = frontmatter(readFileSync(path.join(corpusDir(open), `${id}.md`), 'utf8'))
      expect(fields.type).toBe('doc')
      expect(fields.in_the_kb).toBeUndefined()
      expect(fields.projected).toBe('true')
    }

    // The predicate is read per build, not remembered from the first one: the
    // rendering follows the declaration it is given.
    const rendered = frontmatter(
      projectedDocument(projectBehaviorCatalogue(), corpusMembership(moved)),
    )
    expect(rendered.type).toBe('reference')
    expect(rendered.in_the_kb).toBe('true')
  })

  it('test_UAT_AC1506_each_producer_removes_only_its_own_stale_documents_in_either_order', () => {
    // Getting this wrong rots the corpus in either direction: a stale document
    // spared by both sweeps stays searchable and confidently wrong forever, and
    // a live document swept by the wrong producer leaves the assistant silently
    // missing part of what it knows.
    const stale = (root: string) => {
      // A document whose originating ticket no longer exists…
      writeFileSync(
        path.join(corpusDir(root), 'DOC-GONE.md'),
        '---\nid: DOC-GONE\ntype: doc\ntitle: Withdrawn\n---\n# Withdrawn\n',
        'utf8',
      )
      // …and a generated reference that is no longer produced.
      writeFileSync(
        path.join(corpusDir(root), 'REF-gone.md'),
        '---\nid: REF-gone\ntype: doc\ntitle: Withdrawn projection\n---\n# Gone\n',
        'utf8',
      )
    }

    // Order one: the ticket export first.
    const exportFirst = scratchRoot()
    stale(exportFirst)
    const exportedA = exportCorpus(exportFirst)
    const projectedA = writeProjections(exportFirst)

    // Order two: the generator first.
    const projectFirst = scratchRoot()
    stale(projectFirst)
    const projectedB = writeProjections(projectFirst)
    const exportedB = exportCorpus(projectFirst)

    for (const exported of [exportedA, exportedB]) {
      expect(exported.removed).toEqual(['DOC-GONE.md'])
      expect(exported.removed).not.toContain('REF-gone.md')
    }
    for (const projected of [projectedA, projectedB]) {
      expect(projected.removed).toEqual(['REF-gone.md'])
      expect(projected.projected).toEqual([...DECLARED_SOURCES])
    }

    for (const [root, exported] of [
      [exportFirst, exportedA],
      [projectFirst, exportedB],
    ] as const) {
      const onDisk = readdirSync(corpusDir(root))
      expect(onDisk).not.toContain('DOC-GONE.md')
      expect(onDisk).not.toContain('REF-gone.md')
      // Every live document of BOTH kinds survives, whichever order they ran in.
      for (const id of DECLARED_SOURCES) expect(onDisk).toContain(`${id}.md`)
      expect(exported.docs.length).toBeGreaterThan(0)
      for (const doc of exported.docs) expect(onDisk).toContain(`${doc.id}.md`)
    }
  }, 120_000)

  it('test_UAT_AC1507_an_unchanged_reference_keeps_its_last_changed_time', () => {
    // The index re-embeds a document when its last-changed time moves. A build
    // that rewrote every reference identically would re-embed the whole set on
    // every build, at cost, while telling the ranker that every fact in it had
    // just changed.
    const root = scratchRoot()
    writeProjections(root)
    const file = (id: string) => path.join(corpusDir(root), `${id}.md`)
    const before = new Map(DECLARED_SOURCES.map((id) => [id, stampOf(file(id))]))

    // A second build with every source unchanged moves nothing.
    writeProjections(root)
    for (const id of DECLARED_SOURCES) expect(stampOf(file(id))).toBe(before.get(id))

    // A third build with ONE source changed moves that reference and no other.
    withExtraOperation(
      { op: 'reticulate_splines', tool: 'reticulate_splines', returns: { shape: 'site' } },
      () => writeProjections(root),
    )
    expect(stampOf(file('REF-surface'))).not.toBe(before.get('REF-surface'))
    expect(stampOf(file('REF-behaviors'))).toBe(before.get('REF-behaviors'))
    expect(stampOf(file('REF-l1'))).toBe(before.get('REF-l1'))
  })
})

// ── the documents: derived from their sources, and nothing else ──────────────

describe('a generated reference is derived from one source and invents nothing', () => {
  it('test_UAT_AC1508_the_components_reference_describes_exactly_the_catalogue', () => {
    // Exhaustive against the live catalogue, in BOTH directions. A projection
    // that could name a component the framework does not ship would be inventing
    // capability, which is worse for an assistant than saying nothing.
    const { body } = projectBehaviorCatalogue()
    expect(CATALOG.length).toBeGreaterThan(0)

    const headings = [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1]).sort()
    expect(headings).toEqual(CATALOG.map((meta) => meta.id).sort())

    for (const meta of CATALOG) {
      const own = section(body, `## ${meta.id}`)
      expect(own).toContain(`The \`${meta.id}\` component, version ${meta.version}.`)

      for (const [name, spec] of Object.entries(meta.config)) {
        const line = bulletFor(own, name)
        expect(line, `${meta.id}.${name} is not described`).not.toBe('')
        expect(line).toContain(spec.type)
        for (const value of spec.values ?? []) expect(line).toContain(`\`${value}\``)
        const bound = renderRange(spec.min, spec.max)
        if (bound) expect(line).toContain(bound)
        const items = renderRange(spec.minItems, spec.maxItems)
        if (items) expect(line).toContain(`${items} item(s)`)
        if (spec.default !== undefined) {
          expect(line).toContain(`default \`${String(spec.default)}\``)
        }
        expect(line).toContain(spec.required ? 'required' : 'optional')
        for (const nested of Object.keys(spec.itemSchema ?? {})) {
          expect(own).toContain(`\`${nested}\``)
        }
      }

      // The parts of a page it holds, and what it is obliged to satisfy.
      for (const [name, spec] of Object.entries(meta.slots)) {
        const line = bulletFor(own, name)
        expect(line, `${meta.id} slot ${name} is not described`).not.toBe('')
        expect(line).toContain(spec.required ? 'required' : 'optional')
      }
      for (const obligation of meta.conformance.obligations) {
        expect(own).toContain(`\`${obligation}\``)
      }
    }

    // A plausible component the catalogue does not hold appears nowhere.
    expect(body).not.toContain('pricing-table')
  })

  it('test_UAT_AC1509_the_layout_reference_names_every_element_kind_its_values_and_the_limits', () => {
    // The value sets and bounds a reader is told about are the ones the page
    // vocabulary actually enforces — the failure this prevents is a document
    // offering a value the vocabulary stopped accepting three releases ago.
    const { body } = projectL1Vocabulary()
    const kinds = elementKinds()
    expect(kinds.length).toBeGreaterThan(3)

    for (const { kind, shape } of kinds) {
      const own = section(body, `### \`${kind}\``)
      for (const [field, schema] of Object.entries(shape)) {
        if (field === 'kind') continue
        const line = bulletFor(own, field)
        expect(line, `${kind}.${field} is not described`).not.toBe('')
        // Whether it may be omitted, exactly as the schema declares it.
        if (omittable(schema)) expect(line).not.toContain('; required')
        else expect(line).toContain('; required')
      }
    }

    // A closed value set: the set the schema holds, and nothing outside it.
    const styles = enumValues(l1BorderSchema, 'style')
    expect(styles.length).toBeGreaterThan(1)
    const border = section(body, '### border')
    expect(border).toContain(styles.map((v) => `\`${v}\``).join(' | '))
    expect(border).not.toContain('`groove`')

    // A bounded number: the bound stated is the one enforced.
    const limits = section(body, '## The limits every page is held to')
    expect(limits).toContain('A page outside these is refused whole; nothing is clamped silently.')
    for (const [key, value] of Object.entries(L1_ENVELOPE)) {
      const line = bulletFor(limits, key)
      expect(line, `envelope ${key} is not stated`).not.toBe('')
      const expected =
        value !== null && typeof value === 'object'
          ? renderRange((value as { min?: number }).min, (value as { max?: number }).max)
          : String(value)
      expect(line).toContain(expected)
    }

    // A shape several kinds share is described ONCE and referred to by name.
    const shared = body.split('\n').filter((line) => line === '### padding').length
    expect(shared).toBe(1)
    const users = kinds.filter(({ kind }) => section(body, `### \`${kind}\``).includes('`padding` — padding'))
    expect(users.length).toBeGreaterThan(1)
  })

  it('test_UAT_AC1510_a_definition_and_a_value_set_are_scoped_to_the_shape_written_for', () => {
    // `color` is documented once, on the pointer-accent shape, and appears
    // undocumented on a dozen others. A flat field→definition map would file
    // "the colour the texture is redrawn in" against a border's colour and read
    // as authoritative — a confidently wrong sentence in a generated reference,
    // which is the one thing it must never contain.
    const { body } = projectL1Vocabulary()
    const declarations = harvestDeclarations(
      readFileSync('packages/site-schema/src/l1/schema.ts', 'utf8'),
    )
    const meaning = definitionOf(declarations, 'l1PointerAccentSchema', 'color')
    expect(meaning, 'the source no longer documents pointerAccent.color').toBeTruthy()
    expect(definitionOf(declarations, 'l1BorderSchema', 'color')).toBeUndefined()

    // Both shapes carry a `color`; only the one it was written for carries the
    // sentence.
    const accent = section(body, '### pointer accent')
    const border = section(body, '### border')
    expect(bulletFor(accent, 'color')).toContain(meaning!)
    expect(bulletFor(border, 'color')).not.toBe('')
    expect(bulletFor(border, 'color')).not.toContain(meaning!)
    expect(border).not.toContain(meaning!)
    // Both shapes really are in the vocabulary and really do share the name.
    expect(shapeOf(l1PointerAccentSchema)).toHaveProperty('color')
    expect(shapeOf(l1BorderSchema)).toHaveProperty('color')

    // Value sets are scoped the same way rather than pooled into one vocabulary
    // that would claim every shape accepts every value.
    const textVocabulary = inlineVocabulary(l1TextAxesSchema)
    const imageVocabulary = inlineVocabulary(l1ImageAxesSchema)
    const textOnly = [...textVocabulary].filter((v) => !imageVocabulary.has(v))
    const imageOnly = [...imageVocabulary].filter((v) => !textVocabulary.has(v))
    expect(textOnly.length).toBeGreaterThan(0)
    expect(imageOnly.length).toBeGreaterThan(0)

    const textAxes = section(body, '### text axes')
    const imageAxes = section(body, '### image axes')
    // Each kind's sets are stated against that kind…
    for (const value of textVocabulary) expect(textAxes).toContain(`\`${value}\``)
    for (const value of imageVocabulary) expect(imageAxes).toContain(`\`${value}\``)
    // …and a value one kind does not accept is not offered against it.
    for (const value of textOnly) expect(imageAxes).not.toContain(`\`${value}\``)
    for (const value of imageOnly) expect(textAxes).not.toContain(`\`${value}\``)
  })

  it('test_UAT_AC1511_the_control_surface_reference_describes_the_whole_declared_surface', () => {
    // A reference answers "what can this product do", which is a question about
    // the SURFACE. The manual a session is primed with is the other rendering:
    // one role's grant, in the second person, as instructions.
    const { body } = projectControlSurface()
    const declared = surface.operations.map((op) => op.tool ?? op.op).sort()
    const described = [...body.matchAll(/^#### `(.+?)`$/gm)].map((m) => m[1]).sort()
    // Both directions: nothing described that is not declared, nothing declared
    // left out.
    expect(described).toEqual(declared)

    for (const group of surface.groups) expect(body).toContain(`### ${group.title ?? group.group}`)
    for (const sequence of surface.sequences) expect(body).toContain(sequence.name)
    for (const name of Object.keys(surface.param_types)) expect(body).toContain(`\`${name}\``)
    for (const name of Object.keys(surface.shapes)) expect(body).toContain(`### \`${name}\``)
    for (const code of Object.keys(surface.errors)) expect(body).toContain(`\`${code}\``)

    // One operation, in full: what it takes, what it returns, how it refuses.
    const sample = surface.operations.find((op) => Object.keys(op.params ?? {}).length > 0)!
    const own = section(body, `#### \`${sample.tool ?? sample.op}\``)
    for (const [name, spec] of Object.entries(sample.params ?? {})) {
      const line = bulletFor(own, name)
      expect(line, `${sample.op}.${name} is not described`).not.toBe('')
      if (spec.type) expect(line).toContain(spec.type)
      expect(line).toContain(spec.required ? 'required' : 'optional')
    }
    if (sample.returns?.shape) expect(own).toContain(`Returns: \`${sample.returns.shape}\`.`)
    if (sample.errors?.length) {
      for (const code of sample.errors) expect(own).toContain(`\`${code}\``)
      expect(own).toContain('Can refuse with:')
    }

    // An operation granted to NO role is described all the same. `Publish` is
    // withheld from the caretaker, so its operations appear in no manual — and
    // must still appear here.
    const granted = new Set(
      Object.values(instances as Record<string, { l1?: { groups?: string[] } }>).flatMap(
        (role) => role.l1?.groups ?? [],
      ),
    )
    const ungranted = surface.groups.filter((group) => !granted.has(group.group))
    expect(ungranted.length, 'no group is withheld, so the claim cannot be tested').toBeGreaterThan(0)
    for (const group of ungranted) {
      for (const name of group.operations ?? []) {
        const op = surface.operations.find((candidate) => candidate.op === name)!
        expect(body).toContain(`#### \`${op.tool ?? op.op}\``)
      }
    }

    // What the declaration records as deliberately impossible is stated as a
    // decision rather than omitted: an assistant that does not know a thing is
    // impossible spends the conversation trying to route around it.
    expect(body).toContain('## What is deliberately not possible')
    expect(body).toContain('Each of these is a decision, not a gap')
    for (const absence of surface.absences) expect(body).toContain(absence.name)

    // An operation belonging to no group is described rather than dropped.
    const loose = withExtraOperation(
      { op: 'reticulate_splines', tool: 'reticulate_splines', returns: { shape: 'site' } },
      () => projectControlSurface().body,
    )
    expect(loose).toContain('### Not in any group')
    expect(loose).toContain('#### `reticulate_splines`')
  })

  it('test_UAT_AC1512_each_reference_names_its_source_and_points_nowhere_internal', () => {
    // Retrieval returns passages, and a passage carries no frontmatter. A reader
    // handed a chunk mid-conversation still has to be able to say where the fact
    // came from — and must never be sent to an internal record it cannot open
    // and would be the wrong reader for.
    const membership = corpusMembership(scratchRoot())
    for (const doc of projections()) {
      expect(isProjected(`${doc.id}.md`)).toBe(true)
      expect(doc.source).toBeTruthy()

      const rendered = projectedDocument(doc, membership)
      // In the READABLE TEXT, not only the metadata: everything after the
      // frontmatter block.
      const readable = rendered.slice(rendered.indexOf('\n---', 4) + 4)
      expect(readable).toContain(`Generated from ${doc.source}`)
      expect(readable).toContain('Do not edit')
      expect(readable).toContain('rebuilt from its')
      expect(readable).toContain('an edit here is lost')

      // No internal ticket or engineering record ANYWHERE — text or metadata —
      // including inside definitions lifted from sources whose own prose is full
      // of them.
      expect(rendered).not.toMatch(/\b(?:REQ|BUG|DOC|EPIC)-\d+/i)
    }
  })
})
