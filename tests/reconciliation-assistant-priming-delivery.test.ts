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
import { CONSULTANT_PURPOSE, CONSULTANT_SYSTEM } from '../tools/generate/src/cli/ai/roles'
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
    const preamble = at(CONSULTANT_SYSTEM)
    const landscape = at('# What exists')
    const territory = at(TERRITORY)
    const purpose = at(CONSULTANT_PURPOSE)
    const mechanism = at('# How to search')

    // ALL FOUR ARE THERE, verbatim where the text is ours. The whole preamble
    // rather than a word from it: a dropped `system` key would leave nothing,
    // and a truncated one would leave a word.
    expect(preamble, 'consultant system prompt missing from what the model was sent').toBe(0)
    expect(landscape).toBeGreaterThan(0)
    expect(territory).toBeGreaterThan(landscape)
    expect(purpose).toBeGreaterThan(0)
    expect(mechanism).toBeGreaterThan(0)

    // …AND IN THAT ORDER: system prompt, landscape, purpose, mechanism.
    expect(preamble).toBeLessThan(landscape)
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
    expect(bareSystem.indexOf(CONSULTANT_SYSTEM)).toBe(0)
    const manual = bareSystem.search(/set_l1/)
    expect(manual).toBeGreaterThan(CONSULTANT_SYSTEM.length - 1)
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
