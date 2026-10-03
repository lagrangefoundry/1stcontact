import { describe, expect, it } from 'vitest'
import * as SiteSchema from '../packages/site-schema/src/index'
import {
  BUILDER_ROLE,
  BUILDER_VOCABULARY_PROVIDER,
  builderPrimingConfig,
  builderRole,
  coordinatorPrimingConfig,
  primingConfig,
  registerBuilderProviders,
  registerSiteProviders,
  settingsPrimingConfig,
} from '../tools/generate/src/cli/ai/roles'
import {
  builderVocabulary,
  def,
  elementKinds,
  namedSchemas,
  objectShape,
  reachableShapes,
  reachableValueSets,
  readableName,
  unwrap,
} from '../tools/generate/src/cli/ai/l1-vocabulary-core'
import { projectL1Vocabulary } from '../tools/generate/src/cli/kb-projection'
import { L1_INSTANCES } from '../tools/generate/src/cli/ai/toolbox-core'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'

/** The AI library is untyped JavaScript; the boundary is here, as it is in the host. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

type Entry = { name?: string; provider?: string; cache_boundary?: boolean }

/**
 * [[BUG-182]] — **the builder is primed with the page vocabulary**.
 *
 * The originating failure: a worker on a blank page spent a third of its 50-call
 * budget searching the platform reference for field names, and ran out before it
 * built what the brief asked for. These cases hold the configuration and the
 * rendered vocabulary; the sibling `.workers` suite holds what a real worker is
 * actually sent.
 *
 * THE EXPECTATIONS ARE DERIVED FROM THE SCHEMA, never listed, so a kind or shape
 * added to `@1stcontact/site-schema` tomorrow is expected here the same day.
 */

const VOCABULARY = builderVocabulary()

describe('BUG-182 — the builder is primed with the page vocabulary', () => {
  it('test_UAT_FC_BUG-182_the_vocabulary_names_every_kind_key_and_shape_the_schema_has', () => {
    const named = namedSchemas()
    const kinds = elementKinds(named)
    expect(kinds.length).toBeGreaterThan(0)
    for (const { kind } of kinds) expect(VOCABULARY).toContain(`- \`${kind}\`: `)

    const page = objectShape(SiteSchema.l1DocumentSchema, new Map()) ?? {}
    for (const key of Object.keys(page)) expect(VOCABULARY).toContain(`\`${key}\` (`)

    // Every shape the kinds and the page reach, with its own fields — a shape
    // named but not described would send the worker back to the reference.
    const seeds = [
      ...Object.values(page),
      ...kinds.flatMap(({ shape }) => Object.values(shape)),
    ]
    const shapes = reachableShapes(seeds, named)
    expect(shapes.length).toBeGreaterThan(20)
    for (const { name, shape } of shapes) {
      const line = VOCABULARY.split('\n').find((l) => l.startsWith(`- **${readableName(name)}**: `))
      expect(line, readableName(name)).toBeTruthy()
      for (const field of Object.keys(shape)) expect(line).toContain(`\`${field}\` (`)
    }

    // Every NAMED value set a type uses is spelled out — `layout mode` is not
    // left for the worker to guess — and an enum's values are the validator's own.
    const sets = reachableValueSets(seeds, named)
    for (const { name } of sets) expect(VOCABULARY).toContain(`- **${readableName(name)}**: `)
    const layout = sets.find(({ name }) => readableName(name) === 'layout mode')
    expect(layout).toBeTruthy()
    const modes = def(unwrap(SiteSchema.l1LayoutModeSchema, new Map())).entries as Record<string, unknown>
    for (const mode of Object.keys(modes)) expect(layout!.accepts).toContain(`\`${mode}\``)
    expect(VOCABULARY).not.toMatch(/: lazy$/m)
  })

  it('test_UAT_FC_BUG-182_the_vocabulary_is_condensed_rather_than_the_whole_reference', () => {
    const reference = projectL1Vocabulary().body
    // CONDENSED: no per-field prose, shared fields once — well under half the size.
    expect(VOCABULARY.length).toBeLessThan(reference.length / 2)
    // Shared fields are stated once, not once per kind.
    expect(VOCABULARY.match(/`paintOrder` \(/g)?.length).toBe(1)
    expect(VOCABULARY).toContain('Every kind takes: ')
    // Required fields are marked.
    expect(VOCABULARY).toMatch(/`src` \(text; required\)/)
  })

  it('test_UAT_FC_BUG-182_the_entry_is_in_the_cached_prefix_of_both_builder_orders_and_no_other_role', () => {
    for (const withCorpus of [true, false]) {
      const list = builderPrimingConfig({}, withCorpus).priming as Entry[]
      const at = list.findIndex((entry) => entry.provider === BUILDER_VOCABULARY_PROVIDER)
      const boundary = list.findIndex((entry) => entry.cache_boundary)
      expect(at).toBeGreaterThan(-1)
      expect(at).toBeLessThan(boundary)
    }
    const others = [
      ...(primingConfig(true).priming as Entry[]),
      ...(primingConfig(false).priming as Entry[]),
      ...(primingConfig(true).reminders as Entry[]),
      ...(settingsPrimingConfig().priming as Entry[]),
      ...(coordinatorPrimingConfig().priming as Entry[]),
    ]
    expect(others.map((entry) => entry.provider)).not.toContain(BUILDER_VOCABULARY_PROVIDER)
  })

  it('test_UAT_FC_BUG-182_the_provider_renders_the_vocabulary_under_its_heading', async () => {
    const lib = await aiCore()
    const providers: Untyped = new lib.PrimingProviders()
    registerBuilderProviders(providers, { box: { manual: async () => '## Your tools' } })
    registerSiteProviders(providers, {
      slug: 'bug182-fixture',
      box: { manual: async () => '## Your tools' },
      signal: () => undefined,
      digest: async () => null,
    })
    // The role loads with the name bound — a role naming an unbound provider refuses.
    const grant = L1_INSTANCES[BUILDER_ROLE] as Record<string, unknown>
    expect(builderRole(lib, providers, grant, false)).toBeTruthy()

    const rendered = String(await providers.get(BUILDER_VOCABULARY_PROVIDER)())
    expect(rendered.startsWith('## The page vocabulary')).toBe(true)
    expect(rendered).toContain(VOCABULARY)
    expect(rendered).not.toContain('{vocabulary}')
  })
})
