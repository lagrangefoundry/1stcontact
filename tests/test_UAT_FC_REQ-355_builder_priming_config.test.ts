import { describe, expect, it } from 'vitest'
import {
  BUILDER_LANDSCAPE_PROVIDER,
  BUILDER_MECHANISM_PROVIDER,
  BUILDER_ROLE,
  BUILDER_ROLE_ENTRY,
  builderPrimingConfig,
  builderRole,
  primingConfig,
  registerBuilderProviders,
  registerSiteProviders,
} from '../tools/generate/src/cli/ai/roles'
import { L1_INSTANCES } from '../tools/generate/src/cli/ai/toolbox-core'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'

/** The AI library is untyped JavaScript; the boundary is here, as it is in the host. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

type Entry = { name?: string; provider?: string; text?: string; cache_boundary?: boolean }

/**
 * [[REQ-355]] — the builder's two declared orders, as documents.
 *
 * The sibling `.workers` suite proves what a worker is actually sent; this is
 * what the configuration IS before any worker opens — and in particular that the
 * with-reference order cannot drift from the order a deployment with no KB still
 * ships, and that nothing about the consultant moved.
 */

const WITH = builderPrimingConfig({}, true).priming as Entry[]
const WITHOUT = builderPrimingConfig({}, false).priming as Entry[]

/** A registry holding everything the builder names except the reference pair. */
function baseProviders(lib: Untyped): Untyped {
  const providers = new lib.PrimingProviders()
  registerBuilderProviders(providers, { box: { manual: async () => '## Your tools' } })
  registerSiteProviders(providers, {
    slug: 'req355-fixture',
    box: { manual: async () => '## Your tools' },
    signal: () => undefined,
    digest: async () => null,
  })
  return providers
}

describe('REQ-355 — the builder has a second order, and only the builder does', () => {
  it('test_UAT_FC_REQ-355_the_role_text_is_the_same_in_both_orders', () => {
    // BEHAVIOUR 1. With or without the reference it is the same builder: the
    // role text is spelled in both lists and must stay one text.
    const role = (list: Entry[]) => list.find((entry) => entry.name === BUILDER_ROLE_ENTRY)
    expect(role(WITH)?.text).toBeTruthy()
    expect(role(WITH)?.text).toBe(role(WITHOUT)?.text)
  })

  it('test_UAT_FC_REQ-355_the_reference_order_names_the_builders_own_providers_and_the_rule', () => {
    const providers = WITH.map((entry) => entry.provider).filter(Boolean)
    // BEHAVIOUR 2 — search with its priming: the map and the mechanism, under the
    // builder's own names rather than the consultant's `km.*`, which map the
    // client's corpus as well as ours.
    expect(providers).toContain(BUILDER_LANDSCAPE_PROVIDER)
    expect(providers).toContain(BUILDER_MECHANISM_PROVIDER)
    expect(providers).not.toContain('km.landscape')
    expect(providers).not.toContain('km.mechanism')
    // BEHAVIOUR 3 — the rule, as a static entry between the map and the mechanism.
    const names = WITH.map((entry) => entry.name)
    const rule = names.indexOf('builder-reference')
    expect(rule).toBeGreaterThan(names.indexOf('builder-km-landscape'))
    expect(rule).toBeLessThan(names.indexOf('builder-km-mechanism'))
    expect(String(WITH[rule].text)).toMatch(/look it up/i)
    expect(String(WITH[rule].text)).toMatch(/must be one you found/i)
    // AND THE NO-KB ORDER IS UNTOUCHED: none of the above appears in it.
    expect(WITHOUT.map((entry) => entry.provider)).not.toContain(BUILDER_LANDSCAPE_PROVIDER)
    expect(WITHOUT.map((entry) => entry.name)).not.toContain('builder-reference')
  })

  it('test_UAT_FC_REQ-355_the_reference_order_loads_only_with_its_providers_bound', async () => {
    const lib = await aiCore()
    const grant = L1_INSTANCES[BUILDER_ROLE] as Record<string, unknown>
    // Search without priming is the same failure as no search, and the reverse:
    // a role that names the reference pair with nobody bound to it refuses to load.
    expect(() => builderRole(lib, baseProviders(lib), grant, true)).toThrow()
    // With them bound it loads — and the no-reference role loads without them.
    const bound = baseProviders(lib)
    bound.register(BUILDER_LANDSCAPE_PROVIDER, async () => null)
    bound.register(BUILDER_MECHANISM_PROVIDER, async () => null)
    expect(builderRole(lib, bound, grant, true)).toBeTruthy()
    expect(builderRole(lib, baseProviders(lib), grant, false)).toBeTruthy()
  })

  it('test_UAT_FC_REQ-355_nothing_changes_for_the_consultant', () => {
    // BEHAVIOUR 6. Neither of the consultant's declared orders mentions the
    // builder's reference entries, and both are still the lists that shipped.
    for (const withCorpus of [true, false]) {
      const list = primingConfig(withCorpus).priming as Entry[]
      const providers = list.map((entry) => entry.provider)
      expect(providers).not.toContain(BUILDER_LANDSCAPE_PROVIDER)
      expect(providers).not.toContain(BUILDER_MECHANISM_PROVIDER)
      expect(list.map((entry) => entry.name)).not.toContain('builder-reference')
    }
    expect(primingConfig(true).priming).toHaveLength((primingDocument.priming as unknown[]).length)
  })
})
