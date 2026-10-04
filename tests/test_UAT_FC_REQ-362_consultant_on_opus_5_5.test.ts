import { describe, expect, it } from 'vitest'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import {
  backendsDocument,
  configureProjectBackends,
  projectBackendModel,
  projectBackendWindow,
} from '../tools/generate/src/cli/ai/backends'
import { ratesFor } from '../tools/generate/src/cli/ai/spend-core'

/**
 * [[REQ-362]] — the consultant runs on Claude Opus 5.5, every backend this
 * project configures can be priced, and the model the meter records for a role
 * is the one that role's backend resolves to.
 */

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const entries = (): Array<[string, { model: string }]> =>
  Object.entries(backendsDocument).filter(([name]) => name !== 'about') as Array<
    [string, { model: string }]
  >

describe('REQ-362 — consultant on Opus 5.5, each role priced at its own backend', () => {
  it('test_UAT_FC_REQ-362_the_consultant_runs_opus_5_5_at_its_published_rates_with_a_resolved_window', async () => {
    const lib = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as Untyped
    configureProjectBackends(lib)

    expect(projectBackendModel(lib)).toBe('claude-opus-5-5')
    expect(ratesFor('claude', 'claude-opus-5-5')).toEqual({
      input: 4,
      output: 20,
      cache_read: 0.2,
      cache_write: 5,
      // [[REQ-378]] — $10 per 1,000 web searches, in the same per-million unit.
      web_search: 10_000,
    })
    // The 1M window resolves — from the framework's table once it knows the
    // model, from the entry's declared `context_window` until then.
    expect(projectBackendWindow(lib, 'claude')).toBe(1_000_000)
  })

  it('test_UAT_FC_REQ-362_every_configured_backend_resolves_to_a_model_prices_json_can_price', async () => {
    const lib = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as Untyped
    configureProjectBackends(lib)

    for (const [name, entry] of entries()) {
      // What the meter records for a role is the backend's own resolved model…
      expect(projectBackendModel(lib, name), name).toBe(entry.model)
      // …and that pair has rates, so no role's turns go unpriced.
      expect(ratesFor(name, entry.model), `prices.json names no rates for ${name}/${entry.model}`).not.toBeNull()
    }
    // The coordinator stays on Haiku.
    expect(projectBackendModel(lib, 'claude_coordinator')).toBe('claude-haiku-4-5')
  })
})
