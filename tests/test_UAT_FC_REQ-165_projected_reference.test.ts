import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
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
  configPath,
  corpusDir,
  corpusMembership,
  exportCorpus,
  kbStatus,
  writeProjections,
  projectedDocument,
  resolveEmbedder,
  SYSTEM_KB,
  bindKb,
} from '../tools/generate/src/cli/kb'
import {
  isProjected,
  projectBehaviorCatalogue,
  projectControlSurface,
  projectL1Vocabulary,
  projections,
} from '../tools/generate/src/cli/kb-projection'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
// Relative rather than by package specifier: pnpm gives each workspace package
// its own `node_modules`, so `@1stcontact/*` resolves from inside a package and
// not from `tests/`. The modules reached are the same ones the projector imports.
import { CATALOG } from '../packages/framework/src/modules/catalog'
import { l1NodeSchema } from '../packages/site-schema/src/l1/schema'
import l1Surface from '../tools/generate/src/cli/ai/l1-surface.json'

/**
 * REQ-165 — **the projected reference**, end to end.
 *
 * What these establish is not "the generator runs" but the property the feature
 * exists for: that the assistant's account of what the product does is DERIVED
 * from the product, and therefore cannot be stale. So almost every assertion here
 * is made *against the source itself* rather than against an expected string —
 * a snapshot of the catalogue would go stale in exactly the way the projection is
 * built to prevent, and a test that let it would be evidence of nothing.
 *
 * The one boundary doubled is the embedding model (`fixtures/kb-stub-model.mjs`),
 * for the reason the REQ-123 suite gives. The corpus, the export, the store, the
 * index and the search are all real.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

/** The three files a build is expected to leave behind. */
const EXPECTED = ['REF-behaviors.md', 'REF-l1.md', 'REF-surface.md']

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

describe('REQ-165 — the projected reference reaches the corpus', () => {
  let root: string
  let first: ReturnType<typeof writeProjections>
  let second: ReturnType<typeof writeProjections>
  let exported: ReturnType<typeof exportCorpus>
  let stampBefore: number
  let stampAfter: number

  /**
   * One scenario — export, disturb, re-export — asserted from several angles,
   * for the reason the REQ-123 export suite gives: reading the ticket store is
   * the export's whole cost, and one call per assertion would spend minutes
   * proving several things about the same two runs.
   */
  beforeAll(() => {
    root = mkdtempSync(path.join(tmpdir(), 'kb-projected-'))
    mkdirSync(corpusDir(root), { recursive: true })
    writeFileSync(
      configPath(root),
      JSON.stringify({
        knowledge_bases: {
          [SYSTEM_KB]: {
            description: 'Test system knowledge.',
            corpus: { type: ['doc'], 'fields.system_kb': true },
            landscape: 'authored',
            source: 'shipped',
          },
        },
      }),
      'utf8',
    )

    first = writeProjections(root)
    stampBefore = statSync(path.join(corpusDir(root), 'REF-l1.md')).mtimeMs

    // A document whose ticket has been withdrawn since the last build — the
    // ticket export's sweep target — and a projection that is no longer
    // produced, which is the other producer's. Each must take its own and leave
    // the other's alone.
    writeFileSync(
      path.join(corpusDir(root), 'DOC-GONE.md'),
      '---\nid: DOC-GONE\ntype: doc\ntitle: Withdrawn\n---\n# Withdrawn\n',
    )
    writeFileSync(
      path.join(corpusDir(root), 'REF-gone.md'),
      '---\nid: REF-gone\ntype: doc\ntitle: Withdrawn projection\n---\n# Gone\n',
    )

    second = writeProjections(root)
    exported = exportCorpus(root)
    stampAfter = statSync(path.join(corpusDir(root), 'REF-l1.md')).mtimeMs
  }, 300_000)

  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it('test_UAT_FC_REQ-165_the_build_writes_a_projection_for_every_source', () => {
    // The three sources REQ-165 names, each landing in the corpus beside the
    // exported documents. Asserted as the whole set rather than one member: a
    // projection that silently stopped being written is exactly the failure that
    // leaves the assistant articulate about design and unable to say what a
    // module is.
    expect(first.projected).toEqual(['REF-behaviors', 'REF-l1', 'REF-surface'])
    for (const file of EXPECTED) {
      expect(readdirSync(corpusDir(root))).toContain(file)
    }
    expect(kbStatus(root).projected).toBe(EXPECTED.length)
  })

  it('test_UAT_FC_REQ-165_a_projection_declares_itself_a_member_of_the_knowledge_base', () => {
    // A projection has no ticket, so nothing else can assert its membership: if
    // the file does not satisfy the declared corpus predicate it is written,
    // indexed and never searched. `doc_kind` says which kind of document it is
    // (DOC-39 §3.3); `projected` and `source` say where to go to change it.
    for (const file of EXPECTED) {
      const fields = frontmatter(readFileSync(path.join(corpusDir(root), file), 'utf8'))
      expect(fields.type).toBe('doc')
      expect(fields.system_kb).toBe('true')
      expect(fields.doc_kind).toBe('system_kb')
      expect(fields.projected).toBe('true')
      expect(fields.source).toBeTruthy()
    }
  })

  it('test_UAT_FC_REQ-165_each_producer_sweeps_its_own_namespace_and_leaves_the_others_alone', () => {
    // Two producers write into one directory, and each must delete what IT no
    // longer produces without touching what the other does. Get this wrong in
    // either direction and the corpus rots: a spared stale file stays searchable
    // and confidently wrong forever, and a swept live one leaves the assistant
    // silently missing a third of what it knows.
    expect(second.removed).toEqual(['REF-gone.md'])
    expect(exported.removed).toEqual(['DOC-GONE.md'])
    const onDisk = readdirSync(corpusDir(root))
    for (const file of EXPECTED) expect(onDisk).toContain(file)
    expect(onDisk).not.toContain('REF-gone.md')
    expect(onDisk).not.toContain('DOC-GONE.md')
  })

  it('test_UAT_FC_165_an_unchanged_projection_keeps_its_file_stamp', () => {
    // `DocDirStore` derives `updated_at` from the file stamp and the index keys
    // its incremental manifest on it, so rewriting an identical projection every
    // build would re-embed it every build, at cost, while telling the ranker it
    // had just changed.
    expect(stampAfter).toBe(stampBefore)
  })

  it('test_UAT_FC_REQ-165_membership_is_read_from_the_declaration_rather_than_hardcoded', () => {
    // The predicate a KB declares is the one a projection has to satisfy, and it
    // is going to change (DOC-39 §3.3 retires `system_kb` for `doc_kind`). A
    // projection that hardcoded today's predicate would silently drop out of the
    // KB the day it moved — which is the one failure a generated document is
    // supposed to be incapable of.
    const scratch = mkdtempSync(path.join(tmpdir(), 'kb-predicate-'))
    try {
      mkdirSync(corpusDir(scratch), { recursive: true })
      writeFileSync(
        configPath(scratch),
        JSON.stringify({
          knowledge_bases: {
            [SYSTEM_KB]: {
              description: 'A KB that decides membership differently.',
              corpus: { type: ['reference'], 'fields.in_the_kb': true },
              landscape: 'authored',
              source: 'shipped',
            },
          },
        }),
        'utf8',
      )

      const membership = corpusMembership(scratch)
      expect(membership).toEqual({ type: 'reference', fields: { in_the_kb: true } })

      const fields = frontmatter(projectedDocument(projectBehaviorCatalogue(), membership))
      expect(fields.type).toBe('reference')
      expect(fields.in_the_kb).toBe('true')
      expect(fields.system_kb).toBeUndefined()
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  })

  it('test_UAT_FC_REQ-165_asking_what_a_component_supports_returns_the_projection', async () => {
    // The acceptance criterion, through the real retrieval path: an assistant
    // that does not know a projection exists, asking in words for a fact only
    // the catalogue holds, is handed the projection. Nothing here mentions a
    // filename — that is the whole point of the KB.
    process.env.LAGRANGE_KM_EMBEDDER = STUB
    try {
      const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
      const { nodeIndexSource } = await import(
        /* @vite-ignore */ sharedModuleUrl('knowledge', './node')
      )
      const binding = await bindKb(root)
      const embedder = await resolveEmbedder()
      const source = nodeIndexSource(path.join(corpusDir(root), 'chunks'))
      await lib.buildChunkIndex(binding.store, binding.kbs, source, {
        embedder,
        sources: binding.sources,
      })

      // Chunk search, because that is the path a question like this actually
      // takes: a reference document is far too coarse a unit to hand back, and
      // what the assistant needs is the passage that answers the question.
      const hits = await lib.searchChunks('does the carousel component support autoplay', {
        source,
        store: binding.store,
        kbs: binding.kbs,
        kb: SYSTEM_KB,
        topK: 3,
        embedder,
        sources: binding.sources,
      })

      // The claim is that the projection ANSWERS the question — the passage
      // handed back is the one carrying the setting — not that it outranks
      // everything. Rank is deliberately not asserted: the stub is a bag-of-words
      // embedder, which favours short passages over long ones in a way no real
      // model does, and pinning an ordering to that artefact would be evidence
      // about the double rather than about the corpus.
      const behaviors = hits.find((hit: { uid: string }) => hit.uid === 'REF-behaviors')
      expect(behaviors).toBeDefined()
      const passage = behaviors.chunks[0].text_snippet as string
      expect(passage).toContain('carousel')
      expect(passage).toContain('autoplay')
    } finally {
      delete process.env.LAGRANGE_KM_EMBEDDER
    }
  }, 120_000)
})

describe('REQ-165 — a projection is derived from its source', () => {
  it('test_UAT_FC_REQ-165_every_component_in_the_catalogue_is_described_with_its_settings', () => {
    // Exhaustive against the live catalogue, in both directions: every component
    // and every setting it accepts appears, and the closed value sets are the
    // ones the catalogue declares. Changing a component's config here changes
    // this document on the next build, with nothing edited by hand — which is
    // the property, stated as a test rather than as a hope.
    const { body } = projectBehaviorCatalogue()
    expect(CATALOG.length).toBeGreaterThan(0)
    for (const meta of CATALOG) {
      expect(body).toContain(`## ${meta.id}`)
      expect(body).toContain(`The \`${meta.id}\` component, version ${meta.version}.`)
      for (const [field, spec] of Object.entries(meta.config)) {
        expect(body).toContain(`\`${field}\``)
        for (const value of spec.values ?? []) expect(body).toContain(`\`${value}\``)
      }
      for (const slot of Object.keys(meta.slots)) expect(body).toContain(`\`${slot}\``)
      for (const obligation of meta.conformance.obligations) {
        expect(body).toContain(`\`${obligation}\``)
      }
    }
  })

  it('test_UAT_FC_REQ-165_a_component_the_catalogue_does_not_have_is_not_described', () => {
    // The other half of derivation, and the one a snapshot cannot give: the
    // document says what the catalogue says and nothing more. A projection that
    // could name a component the framework does not ship would be inventing
    // capability, which is worse for an assistant than saying nothing.
    const { body } = projectBehaviorCatalogue()
    const headings = [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1])
    expect(headings.sort()).toEqual(CATALOG.map((m) => m.id).sort())
  })

  it('test_UAT_FC_REQ-165_the_layout_projection_names_every_element_kind_and_its_value_sets', () => {
    // Read off the schema union rather than listed here, so a new element kind
    // is covered by this test the moment it is declared.
    const { body } = projectL1Vocabulary()
    const union = (l1NodeSchema as unknown as { def: { getter: () => { def: { options: unknown[] } } } })
      .def.getter()
      .def.options
    const kinds = union
      .map((option) => {
        const inner = (option as { def: Record<string, unknown> }).def
        const shape = (inner.type === 'lazy'
          ? (inner.getter as () => { def: { shape: Record<string, unknown> } })().def.shape
          : (inner.shape as Record<string, unknown>)) as Record<string, unknown>
        const literal = (shape.kind as { def: { values: unknown[] } }).def.values
        return String(literal[0])
      })
    expect(kinds.length).toBeGreaterThan(3)
    for (const kind of kinds) expect(body).toContain(`### \`${kind}\``)

    // A closed value set is most of what an axis means, so the document carries
    // the values rather than the type name alone.
    expect(body).toContain('`left` | `center` | `right` | `justify`')
    expect(body).toContain('## The limits every page is held to')
    expect(body).toContain('`maxNodes`')
  })

  it('test_UAT_FC_REQ-165_a_definition_does_not_leak_out_of_the_shape_it_was_written_for', () => {
    // `color` is documented once, on the pointer-accent shape, and appears
    // undocumented on a dozen others. A flat field→definition map would file
    // "the colour the texture is redrawn in" against a border's colour and read
    // as authoritative — a confidently wrong sentence in a generated reference,
    // which is the one thing it must never contain.
    const { body } = projectL1Vocabulary()
    const border = body.slice(body.indexOf('### border'))
    const untilNext = border.slice(0, border.indexOf('\n### ', 1))
    expect(untilNext).toContain('`color`')
    expect(untilNext).not.toContain('redrawn')
  })

  it('test_UAT_FC_REQ-165_no_projection_sends_the_assistant_to_an_internal_ticket', () => {
    // DOC-39 §3.1 keeps the engineering record out of this corpus. The schemas'
    // own comments are full of it, so a definition that cannot be stated without
    // pointing at a ticket is dropped rather than carried across.
    for (const doc of projections()) {
      expect(doc.body).not.toMatch(/\b(?:REQ|BUG|EPIC)-\d+/)
    }
  })

  it('test_UAT_FC_REQ-165_the_surface_projection_describes_every_declared_operation', () => {
    // Exhaustive against the declaration `toolbox-core.ts` binds and the manual
    // is projected from, so an operation added, renamed or withdrawn moves this
    // document without anybody remembering to.
    const declaration = l1Surface as {
      operations: Array<{ op: string; tool?: string }>
      groups: Array<{ title?: string; group: string }>
      errors: Record<string, unknown>
      absences: Array<{ name: string }>
    }
    const { body } = projectControlSurface()
    for (const op of declaration.operations) {
      expect(body).toContain(`\`${op.tool ?? op.op}\``)
    }
    for (const group of declaration.groups) {
      expect(body).toContain(`### ${group.title ?? group.group}`)
    }
    for (const code of Object.keys(declaration.errors)) expect(body).toContain(`\`${code}\``)
    // The absences are the load-bearing half: an assistant that does not know a
    // thing is deliberately impossible spends the conversation trying to route
    // around it and apologising.
    for (const absence of declaration.absences) expect(body).toContain(absence.name)
  })

  it('test_UAT_FC_REQ-165_a_projection_says_where_its_facts_came_from', () => {
    // Retrieval returns passages, and a passage carries no frontmatter. A reader
    // handed a chunk mid-conversation still has to be able to say where the fact
    // came from — and an operator who wants to change one has to be told that
    // editing the document is not how.
    for (const doc of projections()) {
      expect(isProjected(`${doc.id}.md`)).toBe(true)
      const rendered = projectedDocument(doc, { type: 'doc', fields: {} })
      expect(rendered).toContain(`Generated from ${doc.source}`)
      expect(rendered).toContain('Do not edit')
    }
  })
})
