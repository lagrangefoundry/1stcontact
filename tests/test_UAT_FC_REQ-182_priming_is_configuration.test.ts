import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
  MAX_PRIMING_CHARS,
  openSession,
  resetAiHost,
  setModelClient,
  streamPrompt,
  type HostDeps,
} from '../tools/generate/src/cli/ai/host-core'
import {
  consultantRole,
  MANUAL_PROVIDER,
  primingConfig,
  primingText,
  PRODUCT_ENTRY,
  PURPOSE_ENTRY,
  registerCorpusProviders,
  registerSiteProviders,
  ROLE_ENTRY,
} from '../tools/generate/src/cli/ai/roles'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'
import {
  says,
  scriptedClient,
  systemText,
  type ModelRequest,
  type ScriptedClient,
} from './support/scripted-model-client'

/**
 * REQ-182 — **the priming and the reminder are configuration, and the boundary
 * is declared**.
 *
 * BUG-63 made the assembly an ordered list of named entries and left every word
 * of it in TypeScript, the list itself built by hand, and no cache boundary
 * anywhere. This asserts the three things that changes:
 *
 *   1. the words are in `priming.json` and reach the model unaltered;
 *   2. the list is LOADED through the framework's own `rolesFromMapping`, so a
 *      malformed entry or an unregistered provider fails at start naming itself;
 *   3. one `{cache_boundary: true}` sits last, which puts the whole priming in
 *      the cached prefix without making anything volatile.
 *
 * THE ASSERTIONS ARE ON WHAT THE MODEL WAS SENT, for the reason BUG-63's file
 * gives at length: a test that inspects the host's own objects passes on a shape
 * the wire never sees. `ScriptedClient.seen[n]` is the request as
 * `ClaudeAPIBackend` built it, cache blocks and all.
 */

const SLUG = 'req182'
const TERRITORY = 'Behaviour modules'
const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

const CORPUS: Record<string, string> = {
  'DOC-A.md':
    '---\nuid: doc-a\nid: DOC-A\ntype: doc\ntitle: Carousels\nfields:\n  system_kb: true\n---\n\n' +
    'Autoplay and interval are behavioural config for the carousel component.\n',
  'DOC-B.md':
    '---\nuid: doc-b\nid: DOC-B\ntype: doc\ntitle: Storage\nfields:\n  system_kb: true\n---\n\n' +
    'Drafts are private until a revision is minted.\n',
}

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
  for (const [name, text] of Object.entries(CORPUS)) {
    writeFileSync(path.join(dir, name), text, 'utf8')
  }
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

let cwd: string
let kbRoot: string
let ai: Record<string, unknown>
let knowledge: unknown

/** How many times the landscape provider actually ran, since the last reset. */
let landscapeReads = 0

/**
 * The host's dependencies, wired as `host.ts` wires them.
 *
 * The landscape provider is re-registered around the bridge's own so the count is
 * of real assembly passes rather than of anything this file simulates — the
 * registry is the host's, and replacing a binding is what `register` is for.
 */
async function deps(opts: { delta?: string | null } = {}): Promise<HostDeps> {
  const lib = ai as { NullArchive: new () => unknown; memoryJunctions: () => unknown }
  const bridge = await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))
  return {
    lib: ai as HostDeps['lib'],
    store: fsSiteStore(ctxOf({ cwd })),
    archive: new lib.NullArchive(),
    junctions: lib.memoryJunctions(),
    apiKey: 'test-key',
    ...(opts.delta !== undefined ? { delta: async () => opts.delta ?? null } : {}),
    extraSurfaces: [
      {
        surface: new bridge.KnowledgeToolbox(knowledge),
        granted: bridge.knowledgeInstanceConfig([SYSTEM_KB]),
      },
    ],
    priming: async (box: unknown, providers: Record<string, Function>) => {
      await registerCorpusProviders(bridge, () => knowledge)(box, providers)
      const inner = (providers as { get: (n: string) => (ctx: unknown) => Promise<string> }).get(
        bridge.LANDSCAPE_PROVIDER,
      )
      ;(providers as { register: (n: string, p: unknown) => void }).register(
        bridge.LANDSCAPE_PROVIDER,
        async (ctx: unknown) => {
          landscapeReads += 1
          return inner(ctx)
        },
      )
    },
  } as HostDeps
}

/** Open a session and take `texts.length` turns; hand back every request made. */
async function turns(hostDeps: HostDeps, texts: string[]): Promise<ScriptedClient> {
  const client = scriptedClient(texts.map(() => says('Noted.')))
  setModelClient(client)
  const opened = await openSession(SLUG, { cwd }, hostDeps)
  expect(opened.ready).toBe(true)
  for (const text of texts) {
    for await (const _e of streamPrompt(opened.sessionId, text, { cwd }, hostDeps)) void _e
  }
  return client
}

/** The blocks the request carried, normalised to the array form. */
function blocks(req: ModelRequest): { text: string; cache_control?: unknown }[] {
  return typeof req.system === 'string' ? [{ text: req.system }] : req.system
}

/** The part of the system block the backend marked as a cached prefix. */
function cachedPrefix(req: ModelRequest): string {
  return blocks(req)
    .filter((b) => b.cache_control)
    .map((b) => b.text)
    .join('')
}

/** The reminder is everything past the priming, so the tail block holds it. */
function reminderOf(req: ModelRequest): string {
  const all = systemText(req)
  return all.slice(cachedPrefix(req).length)
}

beforeAll(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req182-'))
  cmdNew(SLUG, { cwd })
  kbRoot = mkdtempSync(path.join(tmpdir(), 'req182-kb-'))
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
  landscapeReads = 0
})

afterEach(() => setModelClient(null))

describe('REQ-182 — the words are configuration, not code', () => {
  it('test_UAT_FC_REQ-182_no_priming_prose_is_a_typescript_constant', () => {
    // THE PROPERTY IS ABOUT THE SOURCE, so the source is what is read. A long
    // string literal in either of these modules is prose that a change to the
    // assistant's words would have to recompile — which is exactly the thing this
    // ticket removes, and it would otherwise creep straight back.
    const LONGEST_STRUCTURAL_STRING = 200
    for (const file of ['roles.ts', 'host-core.ts']) {
      const src = readFileSync(path.join('tools/generate/src/cli/ai', file), 'utf8')
      const literals = src.match(/`[^`]*`|'(?:[^'\\\n]|\\.)*'/g) ?? []
      const prose = literals.filter((lit) => lit.length > LONGEST_STRUCTURAL_STRING)
      expect(prose, `${file} still carries prose as a string literal`).toEqual([])
    }
    // And the words are in the file that ships instead.
    expect(primingText(ROLE_ENTRY)).toContain('You are a design consultant')
    expect(primingText(PRODUCT_ENTRY)).toContain('only through your tools')
  })

  it('test_UAT_FC_REQ-182_prose_authored_as_lines_reaches_the_model_as_paragraphs', async () => {
    // The file authors long prose as a list of lines, because JSON has no block
    // scalar and one escaped 4,000-character line is not a thing anyone edits.
    const declared = primingDocument.priming.find((e) => 'name' in e && e.name === ROLE_ENTRY)
    expect(Array.isArray((declared as { text?: unknown }).text)).toBe(true)

    // What reaches the model is the joined text, paragraph breaks intact — not a
    // list, not a re-flowed single line.
    const client = await turns(await deps(), ['Hello'])
    const system = systemText(client.seen[0])
    expect(system).toContain(primingText(ROLE_ENTRY))
    expect(primingText(ROLE_ENTRY)).toContain('\n\n')
  })

  it('test_UAT_FC_REQ-182_an_entry_that_declares_both_or_names_nothing_fails_at_load', async () => {
    const lib = ai as { rolesFromMapping: (m: unknown, o: unknown) => unknown }
    const load = (priming: unknown[]): void => {
      lib.rolesFromMapping({ roles: { consultant: { priming } } }, { providers: undefined })
    }
    // Both halves — the entry names itself in the message, which is the whole
    // reason to go through the loader rather than construct `Entry` by hand.
    expect(() => load([{ name: 'bad', text: 'x', provider: 'y' }])).toThrow(/"bad"/)
    // A provider nobody registered. A typo in the file is a start-up failure, not
    // a section silently missing from a live turn.
    expect(() => load([{ name: 'ghost', provider: 'nobody.registered' }])).toThrow(
      /nobody\.registered/,
    )
  })
})

describe('REQ-182 — the cache boundary is declared, and it is last', () => {
  it('test_UAT_FC_REQ-182_the_whole_priming_is_one_cached_prefix', async () => {
    const client = await turns(await deps(), ['Hello'])
    const prefix = cachedPrefix(client.seen[0])

    // Every entry is inside the marked prefix — including the two providers.
    // Without the marker the framework's computed rule ends the prefix at the
    // FIRST provider, which here is the third of five entries, so the landscape,
    // the purpose and the whole projected manual were re-sent uncached every turn.
    expect(prefix).toContain(primingText(ROLE_ENTRY))
    expect(prefix).toContain(primingText(PRODUCT_ENTRY))
    expect(prefix).toContain(TERRITORY)
    expect(prefix).toContain(primingText(PURPOSE_ENTRY))
    expect(prefix).toContain('KnowledgeSearch')

    // The reminder is NOT in it: it is rebuilt every turn, and a cached prefix
    // that included it would be invalidated by its own contents.
    expect(prefix).not.toContain('Every tool you have acts on that site')
  })

  it('test_UAT_FC_REQ-182_exactly_one_boundary_is_declared_and_it_is_last', () => {
    for (const list of [primingDocument.priming, primingDocument.priming_without_corpus]) {
      const markers = list.filter((e) => 'cache_boundary' in e)
      expect(markers).toHaveLength(1)
      expect(list[list.length - 1]).toEqual({ cache_boundary: true })
    }
    // Reminders are re-sent every turn, so there is no prefix there for a
    // boundary to end — the framework rejects one, and none is declared.
    expect(primingDocument.reminders.some((e) => 'cache_boundary' in e)).toBe(false)
  })

  it('test_UAT_FC_REQ-182_the_landscape_is_read_once_a_session_not_once_a_turn', async () => {
    // The marker's second job (DOC-22 Amendment V): entries before it are
    // assembled once and re-delivered. All of them are before it, so a KM read
    // happens per session and not per turn — three turns, one read.
    await turns(await deps(), ['One', 'Two', 'Three'])
    expect(landscapeReads).toBe(1)
  })
})

describe('REQ-182 — a signal that has nothing to say says nothing', () => {
  it('test_UAT_FC_REQ-182_a_quiet_turn_carries_neither_signal_and_no_residue', async () => {
    const client = await turns(await deps({ delta: null }), ['Hello'])
    const reminder = reminderOf(client.seen[0])

    // The standing reminder is there…
    expect(reminder).toContain('Every tool you have acts on that site and no other')
    expect(reminder).toContain('differ in kind rather than refining one')
    // …and neither signal is, in any form.
    expect(reminder).not.toMatch(/changed this site/)
    expect(reminder).not.toMatch(/list_changes with since/)
    // No residue: a dropped entry takes its separator with it, so no blank
    // section and no doubled separator is left where it would have been.
    expect(reminder).not.toMatch(/\n\n\n/)
    expect(reminder.trimEnd()).toBe(reminder.replace(/\s+$/, ''))
  })

  it('test_UAT_FC_REQ-182_a_turn_with_both_signals_carries_both_with_the_delta_last', async () => {
    const DELTA = 'New in your knowledge base: DOC-C, "Brand palette".'
    const hostDeps = await deps({ delta: DELTA })
    const client = scriptedClient([says('First.'), says('Second.')])
    setModelClient(client)
    const opened = await openSession(SLUG, { cwd }, hostDeps)
    for await (const _e of streamPrompt(opened.sessionId, 'One', { cwd }, hostDeps)) void _e

    // A change lands between the turns, exactly as a client edit would: the
    // signal is a comparison of the store's counter across the turn boundary.
    await hostDeps.store.appendChange(SLUG, { kind: 'edit' } as never)
    for await (const _e of streamPrompt(opened.sessionId, 'Two', { cwd }, hostDeps)) void _e

    const reminder = reminderOf(client.seen[1])
    expect(reminder).toMatch(/changed this site since your last turn/)
    expect(reminder).toContain('list_changes with since:')
    expect(reminder).toContain(DELTA)
    // The delta is declared last and stays last: it is the most volatile thing
    // in the reminder, and volatile content goes after stable content.
    expect(reminder.indexOf('list_changes with since:')).toBeLessThan(reminder.indexOf(DELTA))
    expect(reminder.trimEnd().endsWith(DELTA)).toBe(true)
  })
})

describe('REQ-182 — the budget is declared, and the session is told of nothing it lacks', () => {
  it('test_UAT_FC_REQ-182_the_assembled_priming_fits_the_declared_cap_with_headroom', async () => {
    const client = await turns(await deps(), ['Hello'])
    const priming = cachedPrefix(client.seen[0])
    expect(priming.length).toBeLessThan(MAX_PRIMING_CHARS)
    // Headroom is the point of choosing the number: the landscape grows with the
    // client's knowledge base, and a cap with no room is a cap that fires on a
    // working configuration.
    expect(priming.length * 2).toBeLessThan(MAX_PRIMING_CHARS)
  })

  it('test_UAT_FC_REQ-182_a_priming_over_the_cap_fails_loudly_naming_the_entry', async () => {
    const lib = ai as {
      assemble: (p: unknown, r: unknown, c: unknown, o: unknown) => Promise<string>
      ProductConfig: new () => unknown
      PrimingProviders: new () => Record<string, Function>
      SessionContext: new (o: unknown) => unknown
    }
    const bridge = await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))
    const providers = new lib.PrimingProviders()
    const box = { manual: () => 'MANUAL' }
    await registerCorpusProviders(bridge, () => knowledge)(box, providers)
    registerSiteProviders(providers, { slug: SLUG, box, signal: () => undefined })

    await expect(
      lib.assemble(
        new lib.ProductConfig(),
        consultantRole(ai, providers, true),
        new lib.SessionContext({ role: 'consultant', backend: 'test' }),
        { providers, maxPrimingChars: 100 },
      ),
    ).rejects.toThrow(new RegExp(`"${ROLE_ENTRY}"`))
  })

  it('test_UAT_FC_REQ-182_the_session_is_told_of_no_transcript_it_cannot_read', async () => {
    // The framework ships a product tier naming `session.transcript_pointer`,
    // which tells a session its turns are addressable by id. This host grants no
    // operation that reads them, so the entry would be a hand-written claim about
    // a tool that does not exist — the one thing the projected manual exists to
    // prevent. The product tier is left empty deliberately, and this is what
    // "deliberately" has to mean to be worth anything.
    const client = await turns(await deps(), ['Hello'])
    const system = systemText(client.seen[0])
    expect(system).not.toMatch(/Reaching the rest of this conversation/)
    expect(system).not.toMatch(/turn id/i)
    expect(system).not.toMatch(/Your summary of this session/)
    // Nor is it handed the other two entries that tier ships: a note about a
    // tool transcript it does not keep, and a summary it does not write.
    expect(system).not.toMatch(/recorded separately from the conversation/)
    expect(system).not.toMatch(/Keep your summary current as you work/)
    // The manual it IS given describes the grant it actually has.
    expect(system).toContain('KnowledgeSearch')
  })
})

/** The manual provider is named by the corpus-free order, and must stay bound. */
describe('REQ-182 — a host with no corpus loads the other declared order', () => {
  it('test_UAT_FC_REQ-182_the_corpus_free_order_names_only_registered_providers', () => {
    const names = (primingConfig(false).priming as { provider?: string }[])
      .map((e) => e.provider)
      .filter((p): p is string => typeof p === 'string')
    expect(names).toEqual([MANUAL_PROVIDER])
  })
})
