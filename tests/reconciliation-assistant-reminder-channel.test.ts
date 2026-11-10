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
import {
  CONSULTANT_PURPOSE,
  CONSULTANT_ROLE_TEXT,
  PRODUCT_SYSTEM,
} from '../tools/generate/src/cli/ai/roles'
import {
  calls,
  says,
  scriptedClient,
  sentText,
  systemText,
  turnTailText,
  type ModelRequest,
} from './support/scripted-model-client'

/**
 * **The turn's reminder rides the tail of the last user message, not the system
 * field** (story-3cf3d57b — AC-2364 as amended by BUNDLE-44 / BUG-83, Node CLI
 * host). The Worker paths are in `reconciliation-assistant-reminder-channel.workers.test.ts`.
 *
 * The evidence is the request the model double recorded, read in its two halves:
 * the system field (the priming, as one string whichever shape it came in) and the
 * last user message (whichever wire shape its content took). The host is driven
 * through `openSession` / `streamPrompt`; nothing inspects the role.
 *
 * The last user message may be string content or content blocks; the tail is read
 * through `turnTailText`, which flattens either, so the assertions hold whichever
 * shape a turn produced. A plain turn and a tool loop (whose follow-up request ends
 * on `tool_result` blocks) are both driven, and no request of either may carry the
 * reminder in its system field.
 */

const SLUG = 'reminder-channel'
const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')
const TERRITORY = 'Behaviour modules'
const USER_TEXT = 'Hello there, assistant.'
const REMINDER = `You are working on the site "${SLUG}"`

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
  writeFileSync(
    path.join(dir, 'DOC-A.md'),
    `---
id: DOC-A
type: doc
title: Carousel behaviour module
fields:
  system_kb: true
---
# Carousel behaviour module

The carousel rotates slides.
`,
    'utf8',
  )
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
    awarenessDocument(`## ${TERRITORY}\n\nCarousels and forms.\n`, SYSTEM_KB),
    'utf8',
  )
}

let cwd: string
let kbRoot: string
let ai: Record<string, unknown>
let knowledge: unknown

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

/** The wire shape of the last user message's content. */
function tailShape(req: ModelRequest): 'string' | 'blocks' | 'none' {
  const last = req.messages[req.messages.length - 1]
  if (!last || last.role !== 'user') return 'none'
  if (typeof last.content === 'string') return 'string'
  return Array.isArray(last.content) ? 'blocks' : 'none'
}

/** Take one turn whose model replies are scripted; return every request it made. */
async function turn(hostDeps: HostDeps, steps: Parameters<typeof scriptedClient>[0]): Promise<ModelRequest[]> {
  const client = scriptedClient(steps)
  setModelClient(client)
  const opened = await openSession(SLUG, { cwd }, hostDeps)
  expect(opened.ready).toBe(true)
  for await (const _e of streamPrompt(opened.sessionId, USER_TEXT, { cwd }, hostDeps)) void _e
  expect(client.seen.length).toBeGreaterThan(0)
  // Snapshot each request so later mutation of shared arrays cannot rewrite the evidence.
  return client.seen.map((r) => JSON.parse(JSON.stringify(r)) as ModelRequest)
}

/** The channel claim for one request that carries the user's turn. */
function expectReminderAtTail(req: ModelRequest): void {
  const system = systemText(req)
  const tail = turnTailText(req)
  // The priming is in the system field, in order…
  expect(system.indexOf(CONSULTANT_ROLE_TEXT)).toBe(0)
  expect(system).toContain(PRODUCT_SYSTEM)
  // …and the reminder is not.
  expect(system, 'reminder leaked into the system field').not.toContain(REMINDER)
  // The reminder rides the last user message, after the user's own words.
  expect(tail).toContain(USER_TEXT)
  expect(tail, 'reminder missing from the last user message').toContain(REMINDER)
  expect(tail.indexOf(REMINDER)).toBeGreaterThan(tail.indexOf(USER_TEXT))
}

beforeAll(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'ac2364-channel-'))
  cmdNew(SLUG, { cwd })
  kbRoot = mkdtempSync(path.join(tmpdir(), 'ac2364-channel-kb-'))
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

describe('AC-2364 — the Node host carries the reminder at the tail of the last user message', () => {
  it('test_UAT_AC2364_node_host_reminder_rides_last_user_message_tail_not_system_field', async () => {
    const shapes = new Set<string>()

    for (const withKnowledge of [true, false]) {
      resetAiHost()
      // A plain turn: the request ends on the user's own message.
      const [plain] = await turn(await deps(withKnowledge), [says('Noted.')])
      expectReminderAtTail(plain)
      shapes.add(tailShape(plain))
      if (withKnowledge) {
        const system = systemText(plain)
        const landscape = system.indexOf('# What exists')
        const purpose = system.indexOf(CONSULTANT_PURPOSE)
        const mechanism = system.indexOf('# How to search')
        expect(landscape).toBeGreaterThan(system.indexOf(PRODUCT_SYSTEM))
        expect(purpose).toBeGreaterThan(landscape)
        expect(mechanism).toBeGreaterThan(purpose)
      } else {
        expect(systemText(plain)).not.toContain('# What exists')
        expect(systemText(plain)).not.toContain('# How to search')
      }

      // A tool loop: the follow-up request ends on a user message of content
      // blocks (the tool result). Whatever it carries, the system field never
      // carries the reminder on any request of the turn.
      resetAiHost()
      const loop = await turn(await deps(withKnowledge), [calls('list_pages', {}), says('Done.')])
      expect(loop.length).toBeGreaterThanOrEqual(2)
      expectReminderAtTail(loop[0])
      for (const req of loop) {
        shapes.add(tailShape(req))
        expect(systemText(req)).not.toContain(REMINDER)
        // Where the tail is content blocks, every text block reads cleanly.
        if (tailShape(req) === 'blocks') {
          const last = req.messages[req.messages.length - 1].content as { type: string }[]
          expect(last.length).toBeGreaterThan(0)
        }
      }
      // The reminder reached the model on this turn through the tail channel.
      expect(loop.some((req) => turnTailText(req).includes(REMINDER))).toBe(true)
    }

    // Every request ended on a user message in one of the two wire shapes, and the
    // assertions above held for whichever it was (the host currently sends blocks).
    expect(shapes.has('none'), `tail shapes seen: ${[...shapes].join(', ')}`).toBe(false)
    expect(shapes.size, `tail shapes seen: ${[...shapes].join(', ')}`).toBeGreaterThan(0)
  })

  /**
   * THE READER THE CHANNEL CLAIM IS ASSERTED THROUGH (BUG-83). Both wire shapes
   * are production — a message a cache marker touched is a list of blocks, one no
   * marker touched is the string it always was — and a reader that handled one of
   * them would report the other as empty, which every negative assertion above
   * would read as "the reminder did not fire". So the reader is pinned here, in
   * both shapes, against requests built in exactly those shapes: the reminder is
   * found at the tail of the LAST user message only, it is not in the system
   * field, a quiet turn reads as absent, and a request ending on no user message
   * reads as empty rather than throwing.
   */
  it('test_UAT_AC2364_the_tail_is_read_in_both_wire_shapes_and_a_quiet_turn_reads_as_absent', () => {
    const PRIMING = '# The site you look after\n\nYou look after one website.'
    const SAID = 'make the heading bigger'
    const TAIL = 'You are working on the site "studio". Every tool you have acts on that site and no other.'

    const plain = (tail: string): ModelRequest => ({
      system: PRIMING,
      messages: [
        { role: 'user', content: 'an earlier turn' },
        { role: 'assistant', content: 'an earlier answer' },
        { role: 'user', content: `${SAID}\n\n${tail}` },
      ],
      tools: [],
    })
    const blocks = (tail: string): ModelRequest => ({
      system: [
        { type: 'text', text: PRIMING, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: '' },
      ],
      messages: [
        { role: 'user', content: [{ type: 'text', text: 'an earlier turn' }] },
        { role: 'assistant', content: [{ type: 'text', text: 'an earlier answer' }] },
        {
          role: 'user',
          content: [
            { type: 'text', text: SAID, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: tail },
          ],
        },
      ],
      tools: [],
    })

    for (const req of [plain(TAIL), blocks(TAIL)]) {
      // Found at the tail of the LAST user message, and not any earlier one.
      expect(turnTailText(req)).toContain(TAIL)
      expect(turnTailText(req)).not.toContain('an earlier turn')
      // Not in the system field, which holds the priming in either shape.
      expect(systemText(req)).toContain(PRIMING)
      expect(systemText(req)).not.toContain(TAIL)
      // Everything sent is read across both channels.
      expect(sentText(req)).toContain(TAIL)
      expect(sentText(req)).toContain(PRIMING)
    }

    // A turn that really carries nothing says so through the same reader.
    for (const quiet of [plain(''), blocks('')]) {
      expect(sentText(quiet)).not.toContain('acts on that site and no other')
      expect(sentText(quiet)).toContain(SAID)
    }

    // A request with no trailing user message reads as empty, not as a throw.
    const noUser: ModelRequest = {
      system: PRIMING,
      messages: [{ role: 'assistant', content: 'still talking' }],
      tools: [],
    }
    expect(turnTailText(noUser)).toBe('')
    expect(sentText(noUser)).toBe(PRIMING)
  })
})
