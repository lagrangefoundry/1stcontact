import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { fsSiteStore } from '../tools/generate/src/store'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import {
  awarenessDocument,
  bindKb,
  configPath,
  corpusDir,
  openKnowledgeRuntime,
  resolveEmbedder,
  SYSTEM_KB,
} from '../tools/generate/src/cli/kb'
import {
  openSession,
  resetAiHost,
  setModelClient,
  streamPrompt,
  type HostDeps,
} from '../tools/generate/src/cli/ai/host-core'
import { knowledgeDeps } from '../tools/generate/src/cli/ai/host'
// The preamble is two configured entries since REQ-182 — the role text first,
// the product text after it — read here from `priming.json` itself.
import {
  CONSULTANT_PURPOSE,
  CONSULTANT_ROLE_TEXT,
  PRODUCT_SYSTEM,
} from '../tools/generate/src/cli/ai/roles'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'
import {
  modelSaw,
  says,
  scriptedClient,
  type ModelRequest,
} from './support/scripted-model-client'

/**
 * **Every host actually sends the model its priming** (story-3cf3d57b — AC-2364,
 * the Node CLI host). The Worker paths are in
 * `reconciliation-assistant-priming-delivery.workers.test.ts`.
 *
 * WHAT IS EVIDENCE HERE. The system prompt the model double was handed, exactly as
 * the library's backend puts it on the wire. The criterion exists because a role
 * whose configuration keys were silently dropped still built and booted while it
 * sent the model nothing. So nothing here inspects the role: the host is driven
 * through `openSession` / `streamPrompt` and only the recorded request is read.
 *
 * ONE DOUBLE: the Anthropic client, because it is the network. The embedder is the
 * fixture stub `1c kb build` accepts through `LAGRANGE_KM_EMBEDDER`, which is the
 * knowledge component's declared model seam.
 */

const SLUG = 'priming'
const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

const TERRITORY = 'Behaviour modules'

const CORPUS: Record<string, string> = {
  'DOC-A.md': `---
id: DOC-A
type: doc
title: Carousel behaviour module
fields:
  system_kb: true
---
# Carousel behaviour module

The carousel rotates slides. Autoplay and interval are behavioural config.
`,
}

/** A system knowledge base built by the component's own builders. */
async function buildFixtureKb(root: string): Promise<void> {
  const dir = corpusDir(root)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    configPath(root),
    JSON.stringify({
      knowledge_bases: {
        system: {
          description: 'Test system knowledge.',
          corpus: { type: ['doc'], 'fields.system_kb': true },
          landscape: 'authored',
          source: 'shipped',
        },
      },
    }),
    'utf8',
  )
  for (const [name, text] of Object.entries(CORPUS)) writeFileSync(path.join(dir, name), text, 'utf8')

  const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
  const { nodeIndexSource } = await import(/* @vite-ignore */ sharedModuleUrl('knowledge', './node'))
  const binding = await bindKb(root)
  const embedder = await resolveEmbedder()
  await lib.buildIndex(binding.store, binding.kbs, nodeIndexSource(path.join(dir, 'index')), {
    embedder,
    sources: binding.sources,
  })
  await lib.buildChunkIndex(binding.store, binding.kbs, nodeIndexSource(path.join(dir, 'chunks')), {
    embedder,
    sources: binding.sources,
  })
  writeFileSync(
    path.join(dir, 'awareness.md'),
    awarenessDocument(`## ${TERRITORY}\n\nCarousels and forms. Start at DOC-A.\n`, SYSTEM_KB),
    'utf8',
  )
}

/**
 * The system prompt as the model reads it.
 *
 * The backend sends either one string or cache-split `{type: 'text'}` blocks
 * that are consecutive slices of that same string. Joining the blocks restores
 * the reading order, so every order assertion below holds for either shape. The
 * shape is returned too, so a block that is not text fails the test instead of
 * being skipped.
 */
function systemText(req: ModelRequest): { text: string; shape: 'string' | 'blocks' } {
  if (typeof req.system === 'string') return { text: req.system, shape: 'string' }
  expect(Array.isArray(req.system)).toBe(true)
  for (const block of req.system) {
    expect(block.type).toBe('text')
    expect(typeof block.text).toBe('string')
  }
  return { text: req.system.map((b) => b.text ?? '').join(''), shape: 'blocks' }
}

let cwd: string
let kbRoot: string
let ai: Record<string, unknown>
let knowledge: unknown

/** The host's dependencies, assembled the way `host.ts` assembles them. */
async function deps(withKnowledge: boolean): Promise<HostDeps> {
  const lib = ai as { NullArchive: new () => unknown; memoryJunctions: () => unknown }
  const base: HostDeps = {
    lib: ai as HostDeps['lib'],
    store: fsSiteStore(ctxOf({ cwd })),
    archive: new lib.NullArchive(),
    junctions: lib.memoryJunctions(),
    apiKey: 'test-key',
  }
  return withKnowledge ? { ...base, ...(await knowledgeDeps(knowledge)) } : base
}

/** Open a conversation, take one turn, return the one request the model saw. */
async function turn(hostDeps: HostDeps): Promise<ModelRequest> {
  const client = scriptedClient([says('Noted.')])
  setModelClient(client)
  const opened = await openSession(SLUG, { cwd }, hostDeps)
  // NOT REFUSED, NOT FAILED TO START — in both the built and unbuilt case.
  expect(opened.ready).toBe(true)
  const spoken: string[] = []
  for await (const event of streamPrompt(opened.sessionId, 'Hello', { cwd }, hostDeps)) {
    const e = event as { kind?: string; content?: string }
    if (e.kind === 'text') spoken.push(e.content ?? '')
  }
  expect(spoken.join('')).toBe('Noted.')
  expect(client.seen).toHaveLength(1)
  return client.seen[0]
}

beforeAll(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'ac2364-priming-'))
  cmdNew(SLUG, { cwd })
  kbRoot = mkdtempSync(path.join(tmpdir(), 'ac2364-kb-'))
  process.env.LAGRANGE_KM_EMBEDDER = STUB
  await buildFixtureKb(kbRoot)
  knowledge = await openKnowledgeRuntime(kbRoot)
  ai = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as Record<string, unknown>
}, 180_000)

afterAll(() => {
  delete process.env.LAGRANGE_KM_EMBEDDER
  rmSync(cwd, { recursive: true, force: true })
  rmSync(kbRoot, { recursive: true, force: true })
})

beforeEach(() => {
  resetAiHost()
})

afterEach(() => {
  setModelClient(null)
})

describe('the Node CLI host sends the model the whole priming', () => {
  it('test_UAT_AC2364_the_node_host_sends_system_prompt_landscape_purpose_mechanism_and_reminder', async () => {
    // ── With a built knowledge base ─────────────────────────────────────────
    const built = await turn(await deps(true))
    const { text: system } = systemText(built)

    const at = (needle: string): number => system.indexOf(needle)
    const preamble = at(CONSULTANT_ROLE_TEXT)
    const product = at(PRODUCT_SYSTEM)
    const landscape = at('# What exists')
    const territory = at(TERRITORY)
    const purpose = at(CONSULTANT_PURPOSE)
    const mechanism = at('# How to search')

    // ALL FOUR ARE THERE, verbatim where the text is ours. The whole preamble
    // rather than a word from it: a dropped `system` key would leave nothing,
    // and a truncated one would leave a word.
    expect(preamble, 'consultant role text missing from what the model was sent').toBe(0)
    expect(product, 'product system text missing from what the model was sent').toBeGreaterThanOrEqual(
      CONSULTANT_ROLE_TEXT.length,
    )
    expect(landscape).toBeGreaterThan(0)
    expect(territory).toBeGreaterThan(landscape)
    expect(purpose).toBeGreaterThan(0)
    expect(mechanism).toBeGreaterThan(0)

    // …AND IN THAT ORDER: system prompt, landscape, purpose, mechanism.
    expect(product).toBeLessThan(landscape)
    expect(territory).toBeLessThan(purpose)
    expect(landscape).toBeLessThan(purpose)
    expect(purpose).toBeLessThan(mechanism)
    // The mechanism carries this session's manual.
    expect(system.slice(mechanism)).toMatch(/KnowledgeSearch/)

    // THE TURN'S REMINDER reaches the model and names the site.
    expect(modelSaw(built)).toContain(`You are working on the site "${SLUG}"`)

    // ── With no knowledge base built ────────────────────────────────────────
    resetAiHost()
    const bare = await turn(await deps(false))
    const { text: bareSystem } = systemText(bare)

    // The system prompt first, then the tool manual, so the session still knows
    // how to act…
    expect(bareSystem.indexOf(CONSULTANT_ROLE_TEXT)).toBe(0)
    const bareProduct = bareSystem.indexOf(PRODUCT_SYSTEM)
    expect(bareProduct).toBeGreaterThanOrEqual(CONSULTANT_ROLE_TEXT.length)
    const manual = bareSystem.search(/set_l1/)
    expect(manual).toBeGreaterThanOrEqual(bareProduct + PRODUCT_SYSTEM.length)
    // …and neither a landscape nor a how-to-search section, because there is no
    // corpus to describe or reach.
    expect(bareSystem).not.toContain('# What exists')
    expect(bareSystem).not.toContain('# How to search')
    expect(bareSystem).not.toContain(TERRITORY)
    expect(bareSystem).not.toMatch(/KnowledgeSearch/)

    // The reminder still goes out on every turn.
    expect(modelSaw(bare)).toContain(`You are working on the site "${SLUG}"`)
  })
})

// ── AC-2376: one declared cache boundary, last ───────────────────────────────

/** The system blocks as sent, normalised to the array form. */
function systemBlocks(req: ModelRequest): { text: string; cache_control?: unknown }[] {
  return typeof req.system === 'string'
    ? [{ text: req.system }]
    : (req.system as { text?: string; cache_control?: unknown }[]).map((b) => ({
        ...b,
        text: b.text ?? '',
      }))
}

/**
 * The cached prefix: every block up to and including the LAST one carrying a
 * cache breakpoint. A breakpoint caches everything before it, so this is the
 * span the backend will not re-send uncached next turn.
 */
function cachedPrefixOf(req: ModelRequest): string {
  const blocks = systemBlocks(req)
  let last = -1
  blocks.forEach((b, i) => {
    if (b.cache_control) last = i
  })
  return blocks
    .slice(0, last + 1)
    .map((b) => b.text)
    .join('')
}

/** Provider calls, counted at the registry the host itself assembles from. */
const providerReads: Record<string, number> = {}

/**
 * The knowledge-bearing deps, with the landscape and mechanism providers
 * re-registered around their real bindings so every assembly pass is counted.
 * The registry is the host's own; replacing a binding is what `register` is for.
 */
async function countingDeps(): Promise<HostDeps> {
  const hostDeps = await deps(true)
  const bridge = (await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))) as {
    LANDSCAPE_PROVIDER: string
    MECHANISM_PROVIDER: string
  }
  const register = hostDeps.priming
  expect(register, 'knowledge deps register no priming providers').toBeTruthy()
  return {
    ...hostDeps,
    priming: async (box: unknown, providers: unknown) => {
      await register!(box, providers)
      const registry = providers as {
        get: (n: string) => (ctx: unknown) => Promise<string>
        register: (n: string, p: unknown) => void
      }
      for (const name of [bridge.LANDSCAPE_PROVIDER, bridge.MECHANISM_PROVIDER]) {
        const inner = registry.get(name)
        registry.register(name, async (ctx: unknown) => {
          providerReads[name] = (providerReads[name] ?? 0) + 1
          return inner(ctx)
        })
      }
    },
  } as HostDeps
}

describe('AC-2376 — the whole priming sits before one cache boundary declared at its end', () => {
  it('test_UAT_AC2376_each_priming_order_declares_exactly_one_boundary_and_it_is_last', () => {
    // Both declared orders: with a knowledge base and without one.
    for (const list of [primingDocument.priming, primingDocument.priming_without_corpus]) {
      const markers = (list as object[]).filter((e) => 'cache_boundary' in e)
      expect(markers).toHaveLength(1)
      expect(list[list.length - 1]).toEqual({ cache_boundary: true })
    }
    // The reminders are re-sent every turn; there is no prefix for them to end.
    expect((primingDocument.reminders as object[]).some((e) => 'cache_boundary' in e)).toBe(false)
  })

  it('test_UAT_AC2376_with_a_knowledge_base_the_whole_priming_is_one_cached_prefix', async () => {
    const req = await turn(await deps(true))
    const { text: system } = systemText(req)
    const prefix = cachedPrefixOf(req)

    // The last cache offset equals the length of the assembled priming: nothing
    // in it is re-sent uncached. Without the declared marker the framework's
    // computed rule would end the prefix at the first provider (the landscape).
    expect(prefix.length).toBeGreaterThan(0)
    expect(prefix).toBe(system)

    // Every entry of the corpus-bearing order is inside it.
    expect(prefix).toContain(CONSULTANT_ROLE_TEXT)
    expect(prefix).toContain(PRODUCT_SYSTEM)
    expect(prefix).toContain(TERRITORY)
    expect(prefix).toContain(CONSULTANT_PURPOSE)
    expect(prefix).toContain('# How to search')
    expect(prefix).toMatch(/KnowledgeSearch/)

    // The per-turn reminder is not in it: it reaches the model past the prefix.
    expect(modelSaw(req)).toContain(`You are working on the site "${SLUG}"`)
    expect(prefix).not.toContain(`You are working on the site "${SLUG}"`)
  })

  it('test_UAT_AC2376_without_a_knowledge_base_the_whole_priming_is_one_cached_prefix', async () => {
    const req = await turn(await deps(false))
    const { text: system } = systemText(req)
    const prefix = cachedPrefixOf(req)

    expect(prefix.length).toBeGreaterThan(0)
    expect(prefix).toBe(system)
    // Role text, product text and the manual — all cached.
    expect(prefix.indexOf(CONSULTANT_ROLE_TEXT)).toBe(0)
    expect(prefix).toContain(PRODUCT_SYSTEM)
    expect(prefix).toMatch(/set_l1/)
    expect(prefix).not.toContain(`You are working on the site "${SLUG}"`)
  })

  it('test_UAT_AC2376_the_boundary_renders_nothing', async () => {
    // The marker is a position, not text: no trace of it in either order.
    for (const withKnowledge of [true, false]) {
      resetAiHost()
      const { text: system } = systemText(await turn(await deps(withKnowledge)))
      expect(system).not.toMatch(/cache[_ ]?boundary/i)
      expect(system).not.toContain('{"cache_boundary"')
    }
  })

  it('test_UAT_AC2376_landscape_and_manual_are_assembled_once_a_session_not_once_a_turn', async () => {
    for (const key of Object.keys(providerReads)) delete providerReads[key]
    const hostDeps = await countingDeps()
    const client = scriptedClient(['One', 'Two', 'Three'].map(() => says('Noted.')))
    setModelClient(client)
    const opened = await openSession(SLUG, { cwd }, hostDeps)
    expect(opened.ready).toBe(true)
    for (const text of ['One', 'Two', 'Three']) {
      for await (const _e of streamPrompt(opened.sessionId, text, { cwd }, hostDeps)) void _e
    }
    expect(client.seen).toHaveLength(3)

    // Three turns, one read each: everything before the marker is assembled once
    // and re-delivered, so neither the landscape nor the manual is volatile.
    const reads = Object.values(providerReads)
    expect(reads).toHaveLength(2)
    expect(reads).toEqual([1, 1])

    // And the priming each turn carried is the same bytes, wholly cached.
    const first = systemText(client.seen[0]).text
    for (const req of client.seen) {
      expect(systemText(req).text).toBe(first)
      expect(cachedPrefixOf(req)).toBe(first)
    }
  })
})
