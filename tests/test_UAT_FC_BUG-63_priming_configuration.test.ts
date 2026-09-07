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
  CONSULTANT_PURPOSE,
  openSession,
  resetAiHost,
  setModelClient,
  streamPrompt,
  type HostDeps,
} from '../tools/generate/src/cli/ai/host-core'
import {
  CONSULTANT_ROLE,
  kmPrimingEntries,
} from '../tools/generate/src/cli/ai/roles'
import {
  says,
  scriptedClient,
  systemText,
  type ScriptedClient,
} from './support/scripted-model-client'

/**
 * BUG-63 — **the session is primed again, through configuration**.
 *
 * WHAT BROKE AND WHY THIS FILE EXISTS. The framework moved priming to DOC-22's
 * three tiers: a `Role` is `priming` / `reminders` — ordered lists of named
 * entries, each static text or a registered provider — and is FROZEN. The
 * fields this project was passing (`system`, `source`, `reminder`) no longer
 * exist. Because the object is frozen over a fixed key set they were not
 * rejected, they were DROPPED, so the visible half of the upgrade (a deleted
 * `KnowledgeDocs` failing the Worker build) could have been "fixed" in two lines
 * into a host that booted happily and sent the model no system prompt, no
 * purpose and no landscape.
 *
 * SO THE ASSERTION IS ON WHAT THE MODEL WAS SENT, never on the host having
 * constructed something. `ScriptedClient.seen[n].system` is the assembled
 * priming exactly as `ClaudeAPIBackend` puts it on the wire — real registry,
 * real product and role tiers, real providers, real assembly. A test that
 * inspected the `Role` would have passed on the broken shape too, which is the
 * whole lesson of this bug.
 *
 * ONE DOUBLE, and it is the one every chat-host suite here doubles: the
 * Anthropic client, because it is the network.
 */

const SLUG = 'studio'
const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

/** Two documents and a map — enough for a landscape with territories in it. */
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
  'DOC-B.md': `---
id: DOC-B
type: doc
title: Storage and revisions
fields:
  system_kb: true
---
# Storage and revisions

Publishing snapshots the draft into a numbered revision and renders the output.
`,
}

const BODY_A = 'Autoplay and interval are behavioural config'
const TERRITORY = 'Behaviour modules'

/** The same fixture KB `test_UAT_FC_REQ-123_session_knowledge` builds. */
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
    awarenessDocument(
      `## ${TERRITORY}\n\nCarousels and forms. Start at DOC-A.\n\n` +
        '## Storage\n\nDrafts, revisions and publishing. Start at DOC-B.\n',
      SYSTEM_KB,
    ),
    'utf8',
  )
}

let cwd: string
let kbRoot: string
let ai: Record<string, unknown>
let knowledge: unknown

/**
 * The host's dependencies, with or without a corpus.
 *
 * ASSEMBLED THE WAY `host.ts` ASSEMBLES THEM, and the priming seam is literally
 * the one it uses — {@link kmPrimingEntries} — rather than a re-statement of it
 * here. A test that spelled the three entries itself would assert that this file
 * can build a priming document, which is not the claim.
 */
async function deps(opts: { withKnowledge: boolean; delta?: string | null }): Promise<HostDeps> {
  const lib = ai as { NullArchive: new () => unknown; memoryJunctions: () => unknown }
  const base: HostDeps = {
    lib: ai as HostDeps['lib'],
    store: fsSiteStore(ctxOf({ cwd })),
    archive: new lib.NullArchive(),
    junctions: lib.memoryJunctions(),
    apiKey: 'test-key',
    ...(opts.delta !== undefined ? { delta: async () => opts.delta ?? null } : {}),
  }
  if (!opts.withKnowledge) return base
  const bridge = await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))
  return {
    ...base,
    extraSurfaces: [
      {
        surface: new bridge.KnowledgeToolbox(knowledge),
        granted: bridge.knowledgeInstanceConfig([SYSTEM_KB]),
      },
    ],
    priming: kmPrimingEntries(ai, bridge, () => knowledge, CONSULTANT_PURPOSE),
  }
}

/** Take one turn and hand back what the model was sent. */
async function turn(
  hostDeps: HostDeps,
  text = 'Hello',
): Promise<{ client: ScriptedClient; system: string }> {
  const client = scriptedClient([says('Noted.')])
  setModelClient(client)
  const opened = await openSession(SLUG, { cwd }, hostDeps)
  expect(opened.ready).toBe(true)
  for await (const _event of streamPrompt(opened.sessionId, text, { cwd }, hostDeps)) void _event
  return { client, system: systemText(client.seen[0]) }
}

beforeAll(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'bug63-priming-'))
  cmdNew(SLUG, { cwd })

  kbRoot = mkdtempSync(path.join(tmpdir(), 'bug63-kb-'))
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
  // A manager caches its registry, its product tier and its role, so a case that
  // wants a differently-wired host must not inherit the previous one's.
  resetAiHost()
})

afterEach(() => {
  setModelClient(null)
})

describe('BUG-63 — the assembled priming is the document it always was', () => {
  it('test_UAT_FC_BUG-63_priming_carries_the_system_text_the_landscape_the_purpose_then_the_mechanism', async () => {
    const { system } = await turn(await deps({ withKnowledge: true }))

    // 1. THE PREAMBLE IS THERE AT ALL. This is the assertion the old shape had
    //    no equivalent of, and it is the one that would have caught the silent
    //    half of this bug: `system:` was being dropped by a frozen constructor.
    expect(system).toContain('consultant')

    // 2. THE MAP, with a territory and the document it routes to.
    expect(system).toContain(TERRITORY)
    expect(system).toContain('DOC-A')

    // 3. …AND NOT THE DOCUMENTS. The property the whole design rests on: a
    //    corpus can grow without the primed context growing with it, because
    //    what is primed is a map and the means to pull the rest.
    expect(system).not.toContain(BODY_A)

    // 4. THE PURPOSE, which is what gives "pick the territories that bear on
    //    your purpose" something to bite on.
    expect(system).toContain(CONSULTANT_PURPOSE)

    // 5. THE MECHANISM IS THE MANUAL, so the corpus is reached through THIS
    //    session's actual grant rather than a sentence written by hand about
    //    what it might have. `KnowledgeSearch` is granted here; `publish` is
    //    not granted to the consultant and must not be describable.
    expect(system).toMatch(/KnowledgeSearch/)

    // 6. AND THE ORDER, which is the load-bearing part: the last thing read is
    //    the first thing done. Preamble, map, purpose, mechanism.
    const at = (needle: string): number => system.indexOf(needle)
    expect(at('consultant')).toBeLessThan(at(TERRITORY))
    expect(at(TERRITORY)).toBeLessThan(at(CONSULTANT_PURPOSE))
    expect(at(CONSULTANT_PURPOSE)).toBeLessThan(at('KnowledgeSearch'))
  })

  it('test_UAT_FC_BUG-63_a_host_with_no_knowledge_base_primes_with_the_system_text_and_the_manual', async () => {
    // An operator who has never run `1c kb build` gets an assistant that knows
    // its tools and not the design documents — which is the assistant this host
    // had before there was a KB at all — rather than one that fails to start.
    const { system } = await turn(await deps({ withKnowledge: false }))

    expect(system).toContain('consultant')
    // The manual is delivered on its own, so the session still knows how to act.
    expect(system).toMatch(/set_l1/)
    // …and names no KM section, because there is nothing to name. A landscape
    // for a corpus that does not exist is an instruction to use a tool the
    // session was never granted.
    expect(system).not.toContain(TERRITORY)
    expect(system).not.toMatch(/KnowledgeSearch/)
  })
})

describe('BUG-63 — the per-turn reminder is a provider, not a mutated role', () => {
  it('test_UAT_FC_BUG-63_the_reminder_reaches_the_model_on_every_turn', async () => {
    const hostDeps = await deps({ withKnowledge: false })
    const client = scriptedClient([says('One.'), says('Two.')])
    setModelClient(client)
    const opened = await openSession(SLUG, { cwd }, hostDeps)

    for await (const _e of streamPrompt(opened.sessionId, 'First', { cwd }, hostDeps)) void _e
    for await (const _e of streamPrompt(opened.sessionId, 'Second', { cwd }, hostDeps)) void _e

    // BOTH turns carry it. The reminder rides the system channel every turn
    // precisely so the habits cannot decay over a long conversation, and the
    // host mutating a frozen role would have thrown on the first one.
    for (const req of client.seen) {
      expect(systemText(req)).toContain(`You are working on the site "${SLUG}"`)
      expect(systemText(req)).toContain('Prefer making the change over describing')
    }
    expect(client.seen.length).toBeGreaterThanOrEqual(2)
  })

  it('test_UAT_FC_BUG-63_the_change_signal_and_the_corpus_delta_appear_only_when_there_is_something_to_report', async () => {
    const quiet = await turn(await deps({ withKnowledge: false, delta: null }))
    // Nothing arrived and nothing moved, so neither line is there. A reminder
    // that says "nothing happened" every turn is one that gets skimmed on the
    // turn something did.
    expect(systemText(quiet)).not.toMatch(/Call list_changes/)
    expect(systemText(quiet)).not.toContain('Two new documents')

    resetAiHost()
    const loud = await turn(await deps({ withKnowledge: false, delta: 'Two new documents arrived.' }))
    expect(systemText(loud)).toContain('Two new documents arrived.')
  })

  it('test_UAT_FC_BUG-63_the_host_mutates_no_role', async () => {
    // The shape this migration replaced reached into the role object and wrote
    // `role.reminder` at the top of every turn. A `Role` is frozen now, so that
    // assignment is a `TypeError` rather than a stale reminder — this asserts
    // the upstream property the host is now written against, so a regression
    // that reintroduces the mutation fails here with a reason rather than
    // somewhere downstream with a stack trace.
    const lib = ai as { Role: new (opts: Record<string, unknown>) => Record<string, unknown> }
    const role = new lib.Role({ name: CONSULTANT_ROLE })
    expect(Object.isFrozen(role)).toBe(true)
    expect(() => {
      ;(role as { reminder?: string }).reminder = 'anything'
    }).toThrow()
  })
})

describe('BUG-63 — what the migration must not have broken', () => {
  // THE LEGACY ROLE ALIAS IS NOT RE-TESTED HERE, deliberately.
  //
  // This migration rebuilds the role registry, and the alias that lets a session
  // archived under the old name reopen lives in it — so it is genuinely at risk.
  // But REQ-174 already drives that end to end: it rewrites a stored transcript
  // header to the legacy name and reopens the session through the real host,
  // which is stronger evidence than anything this file could add, and it passes
  // against this change. A second UAT over the same path would be a duplicate,
  // and worse than a duplicate — the scan in that same suite allows exactly one
  // file to carry the old word, so restating it here would make this file a
  // straggler of the rename it is checking.

  it('test_UAT_FC_BUG-63_the_generated_bridge_shim_names_the_km_providers_and_not_the_deleted_class', async () => {
    // `1c assets` writes this shim from an explicit export list, and that it is
    // explicit is what made the upstream deletion a build failure at the shim
    // rather than `undefined is not a function` inside a turn. The list must now
    // name what replaced it.
    const shim = readFileSync(
      path.resolve('apps/control-app/src/generated/ai-knowledge.d.ts'),
      'utf8',
    )
    expect(shim).toContain('LANDSCAPE_PROVIDER')
    expect(shim).toContain('MECHANISM_PROVIDER')
    expect(shim).toContain('registerKmProviders')
    expect(shim).not.toContain('KnowledgeDocs')

    // And the bridge really exports them — the shim is a re-export, so a name in
    // it that upstream does not have is a build failure waiting for a deploy.
    const bridge = (await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))) as Record<
      string,
      unknown
    >
    expect(typeof bridge.registerKmProviders).toBe('function')
    expect(bridge.KnowledgeDocs).toBeUndefined()
  })
})
