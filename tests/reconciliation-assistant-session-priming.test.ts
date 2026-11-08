import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
  consultantReminder,
  consultantRole,
  LEGACY_ROLE_NAMES,
  primingConfig,
  primingText,
  PRODUCT_ENTRY,
  PURPOSE_ENTRY,
  registerSiteProviders,
  ROLE_ENTRY,
} from '../tools/generate/src/cli/ai/roles'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'
import { modelSaw, says, scriptedClient, type ModelRequest } from './support/scripted-model-client'

/**
 * **The session's priming as configuration** (story-a58a0974 — AC-2374, AC-2375,
 * AC-2107, AC-2109; plan item 3 of BUNDLE-40: REQ-182 + BUG-65).
 *
 * Through the real host core: the real session manager, the real role loaded
 * from `priming.json` through the framework's `rolesFromMapping`, the real
 * reminder channel and the real knowledge bridge over a planted corpus. The
 * model client is the one double — it is the network — and it is also the
 * recorder, so every claim about what a session is told reads the request the
 * model was actually SENT.
 *
 * The former role name is never spelled here; it is read from the compatibility
 * list, so the straggler scan holds this file to the same rule as every other.
 */

const SLUG = 'priming'
const TERRITORY = 'Behaviour modules'
const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')
const AI_DIR = 'tools/generate/src/cli/ai'

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

/**
 * The host's dependencies, wired as `host.ts` wires them, over the planted corpus.
 *
 * `inflate` replaces the landscape provider's answer with an oversize one — the
 * provider registry is the host's, and replacing a binding is what `register` is
 * for — so overflow is driven through the real assembly rather than simulated.
 */
async function deps(opts: { delta?: string | null; inflate?: string } = {}): Promise<HostDeps> {
  const lib = ai as { NullArchive: new () => unknown; memoryJunctions: () => unknown }
  const bridge = await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))
  const { registerCorpusProviders } = await import('../tools/generate/src/cli/ai/roles')
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
      if (opts.inflate !== undefined) {
        const text = opts.inflate
        ;(providers as { register: (n: string, p: unknown) => void }).register(
          bridge.LANDSCAPE_PROVIDER,
          async () => text,
        )
      }
    },
  } as HostDeps
}

/** The system prompt as one string; blocks are consecutive slices of it. */
function systemText(req: ModelRequest): string {
  return typeof req.system === 'string'
    ? req.system
    : req.system.map((block) => block.text ?? '').join('')
}

/** The part of the system block the backend marked as a cached prefix. */
function cachedPrefix(req: ModelRequest): string {
  if (typeof req.system === 'string') return req.system
  return (req.system as { text?: string; cache_control?: unknown }[])
    .filter((b) => b.cache_control)
    .map((b) => b.text ?? '')
    .join('')
}

/**
 * The reminder the model received on this request.
 *
 * It rides the tail of the LAST message (only the last: earlier turns' reminders
 * are history), so it is cut from there, starting at the site line every
 * reminder opens with.
 */
function reminderOf(req: ModelRequest): string {
  const last = req.messages[req.messages.length - 1]?.content
  const tail =
    typeof last === 'string'
      ? last
      : Array.isArray(last)
        ? last.map((b) => (b && typeof b === 'object' && 'text' in b ? String(b.text ?? '') : '')).join('\n')
        : ''
  const start = tail.lastIndexOf('You are working on the site')
  expect(start, 'the reminder opens with the site line').toBeGreaterThanOrEqual(0)
  return tail.slice(start)
}

/** Open a session over `hostDeps` and take one turn per text; return every request. */
async function turns(hostDeps: HostDeps, texts: string[]): Promise<ModelRequest[]> {
  const client = scriptedClient(texts.map(() => says('Noted.')))
  setModelClient(client)
  const opened = await openSession(SLUG, { cwd }, hostDeps)
  expect(opened.ready).toBe(true)
  for (const text of texts) {
    for await (const _e of streamPrompt(opened.sessionId, text, { cwd }, hostDeps)) void _e
  }
  return client.seen
}

/** Every `.ts` source module of the assistant host. */
function hostSources(): { file: string; src: string }[] {
  return readdirSync(AI_DIR)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => ({ file: f, src: readFileSync(path.join(AI_DIR, f), 'utf8') }))
}

/** Every prose line the configuration declares: entry texts and templates. */
function configuredProse(): string[] {
  type Raw = { text?: string | string[] }
  const entries = [
    ...primingDocument.priming,
    ...primingDocument.priming_without_corpus,
    ...primingDocument.reminders,
  ] as Raw[]
  const lines: string[] = []
  for (const e of entries) {
    if (e.text === undefined) continue
    for (const line of Array.isArray(e.text) ? e.text : [e.text]) lines.push(line)
  }
  for (const t of Object.values(primingDocument.templates as Record<string, string>)) {
    lines.push(t.split('{')[0])
  }
  // Long lines only: a short heading such as "## How to work" is too generic to
  // be evidence of a copy.
  return lines.map((l) => l.trim()).filter((l) => l.length >= 40)
}

beforeAll(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'story-a58a0974-priming-'))
  cmdNew(SLUG, { cwd })
  kbRoot = mkdtempSync(path.join(tmpdir(), 'story-a58a0974-priming-kb-'))
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

beforeEach(() => resetAiHost())

afterEach(() => setModelClient(null))

// ── AC-2374: one configuration file, validated at start-up ───────────────────

describe('the session’s words are read from one configuration file, validated at start-up', () => {
  it('test_UAT_AC2374_priming_and_reminders_come_from_priming_json_and_malformed_entries_fail_naming_themselves', async () => {
    // NO PROSE IN SOURCE. No configured line appears as text in any host module.
    const prose = configuredProse()
    expect(prose.length).toBeGreaterThan(20)
    for (const { file, src } of hostSources()) {
      for (const line of prose) {
        expect(src.includes(line), `${file} restates configured prose: ${line}`).toBe(false)
      }
    }

    // PROSE AUTHORED AS LINES reaches the model joined, as its paragraphs.
    const declaredRole = primingDocument.priming.find(
      (e) => 'name' in e && e.name === ROLE_ENTRY,
    ) as { text: unknown }
    expect(Array.isArray(declaredRole.text)).toBe(true)
    const joined = (declaredRole.text as string[]).join('\n')
    expect(joined).toContain('\n\n')
    const seen = await turns(await deps({ delta: null }), ['Hello'])
    expect(systemText(seen[0])).toContain(joined)

    // RUNTIME VALUES FILL TEMPLATES: the site line names this site, and nothing
    // the model received carries an unfilled `{placeholder}`.
    const reminder = reminderOf(seen[0])
    expect(reminder.startsWith(`You are working on the site "${SLUG}".`)).toBe(true)
    expect(modelSaw(seen[0])).not.toMatch(/\{(slug|changes|plural|at)\}/)
    const changed = consultantReminder(SLUG, { at: 7, changes: 3 })
    expect(changed).toContain('3 changes')
    expect(changed).toContain('since: 7')
    expect(changed).not.toMatch(/\{\w+\}/)

    // THE MODEL RECEIVES EXACTLY THE DECLARED TEXT. Every static entry of the
    // selected order reaches the model verbatim and in declared order, and every
    // static reminder line reaches it verbatim: the words the model reads are the
    // words the configuration file declares.
    const system = systemText(seen[0])
    const declared = (primingConfig(true).priming as { name?: string; text?: unknown }[]).filter(
      (e): e is { name: string; text: string } => typeof e.text === 'string',
    )
    expect(declared.map((e) => e.name)).toEqual([ROLE_ENTRY, PRODUCT_ENTRY, PURPOSE_ENTRY])
    let previous = -1
    for (const entry of declared) {
      const at = system.indexOf(entry.text)
      expect(at, `${entry.name} reaches the model verbatim, after the entry before it`).toBeGreaterThan(
        previous,
      )
      previous = at
    }
    const declaredReminders = (primingConfig(true).reminders as { text?: unknown }[])
      .map((e) => e.text)
      .filter((t): t is string => typeof t === 'string')
    expect(declaredReminders.length).toBeGreaterThan(0)
    for (const line of declaredReminders) expect(reminder).toContain(line)

    // VALIDATED AT START-UP through the framework's loader, naming the entry.
    const lib = ai as {
      rolesFromMapping: (m: unknown, o: unknown) => unknown
      PrimingProviders: new () => { register: (n: string, p: unknown) => void }
    }
    const providers = new lib.PrimingProviders()
    providers.register('real.provider', async () => 'x')
    const load = (priming: unknown[], reminders: unknown[] = []) => () =>
      lib.rolesFromMapping({ roles: { consultant: { priming, reminders } } }, { providers })
    const refused = (fn: () => unknown): Error => {
      try {
        fn()
      } catch (err) {
        return err as Error
      }
      throw new Error('configuration was accepted')
    }
    const cases: { shape: string; fn: () => unknown; names: RegExp }[] = [
      {
        shape: 'both text and provider',
        fn: load([{ name: 'bad', text: 'x', provider: 'real.provider' }]),
        names: /"bad"/,
      },
      { shape: 'neither text nor provider', fn: load([{ name: 'bad' }]), names: /"bad"/ },
      {
        shape: 'a marker carrying other keys',
        fn: load([{ name: 'bad', cache_boundary: true, text: 'x' }]),
        // A marker has no name of its own; it is named by its place in the list.
        names: /'priming'\[0\]/,
      },
      {
        shape: 'a second marker in one list',
        fn: load([
          { name: 'one', text: 'a' },
          { cache_boundary: true },
          { name: 'two', text: 'b' },
          { cache_boundary: true },
        ]),
        names: /second 'cache_boundary' at \[3\]/,
      },
      {
        shape: 'a marker in the reminders',
        fn: load([{ name: 'one', text: 'a' }], [{ cache_boundary: true }]),
        names: /'reminders'\[0\]/,
      },
      {
        shape: 'an unregistered provider',
        fn: load([{ name: 'ghost', provider: 'nobody.registered' }]),
        names: /"ghost"|nobody\.registered/,
      },
    ]
    for (const c of cases) {
      const err = refused(c.fn)
      expect(err.name, c.shape).toBe('PrimingConfigError')
      expect(err.message, c.shape).toMatch(c.names)
    }

    // TWO DECLARED ORDERS. The corpus-free one loads with only the providers
    // every session registers; the corpus order does not, naming what is missing.
    const siteOnly = new lib.PrimingProviders()
    registerSiteProviders(siteOnly, {
      slug: SLUG,
      box: { manual: () => 'MANUAL' },
      signal: () => undefined,
    })
    expect(() => consultantRole(ai, siteOnly, false)).not.toThrow()
    const missing = refused(() => consultantRole(ai, siteOnly, true))
    expect(missing.name).toBe('PrimingConfigError')
    expect(missing.message).toMatch(/km-landscape|km\.landscape/)
  }, 180_000)

  it('test_UAT_AC2374_opening_a_session_whose_order_names_an_unregistered_provider_fails_naming_the_entry_and_asks_the_model_nothing', async () => {
    // THROUGH THE HOST, not the loader. The host is given a corpus seam (so it
    // selects the order WITH a knowledge base) that registers nothing, so the
    // selected order names `km.landscape` and nobody registered it. The library
    // is the real one; its loader is wrapped only so the test can see the error
    // it raised, because `openSession` reports the message, not the object.
    const real = ai as { rolesFromMapping: (m: unknown, o: unknown) => unknown }
    const raised: Error[] = []
    const lib = {
      ...ai,
      rolesFromMapping: (mapping: unknown, options: unknown) => {
        try {
          return real.rolesFromMapping(mapping, options)
        } catch (err) {
          raised.push(err as Error)
          throw err
        }
      },
    }
    const unbound = {
      ...(await deps({ delta: null })),
      lib: lib as HostDeps['lib'],
      priming: async () => {},
    } as HostDeps
    const client = scriptedClient([says('Should never be asked.')])
    setModelClient(client)

    const opened = await openSession(SLUG, { cwd }, unbound)

    // The session is not built, and says why: a priming configuration error
    // naming the entry whose provider is missing.
    expect(opened.ready).toBe(false)
    expect(raised).toHaveLength(1)
    expect(raised[0].name).toBe('PrimingConfigError')
    expect(raised[0].message).toMatch(/"km-landscape"/)
    expect(opened.error).toBe(raised[0].message)

    // A turn on it is refused too, and no request ever reached the model.
    let refused: unknown
    try {
      for await (const _e of streamPrompt(opened.sessionId, 'Hello', { cwd }, unbound)) void _e
    } catch (err) {
      refused = err
    }
    expect(refused).toBeInstanceOf(Error)
    expect(client.seen).toHaveLength(0)
  }, 180_000)
})

// ── AC-2375: entries drop whole; the budget is declared and loud ─────────────

describe('a conditional entry drops with its separator, and the priming is bounded', () => {
  it('test_UAT_AC2375_quiet_entries_drop_whole_and_priming_is_capped_at_60000_naming_the_overflowing_entry', async () => {
    // THE BUDGET IS DECLARED, NOT THE FRAMEWORK'S 200,000 DEFAULT.
    expect(MAX_PRIMING_CHARS).toBe(60_000)

    // A REAL SESSION PRIMES WELL UNDER IT, with headroom for the landscape.
    const seen = await turns(await deps({ delta: null }), ['Hello'])
    const priming = cachedPrefix(seen[0])
    expect(priming).toContain(TERRITORY)
    expect(priming.length).toBeLessThan(MAX_PRIMING_CHARS / 2)

    // A QUIET TURN: both conditional entries answered nothing and are gone whole.
    const reminder = reminderOf(seen[0])
    expect(reminder).not.toMatch(/changed this site/)
    expect(reminder).not.toMatch(/list_changes/)
    expect(reminder).not.toMatch(/\{\w+\}/)
    expect(reminder).not.toMatch(/\n\n\n/)
    expect(reminder).toBe(reminder.replace(/\s+$/, ''))
    expect(reminder.endsWith(primingText('method'))).toBe(true)
    // Exactly the four standing paragraphs remain: site + three static lines.
    expect(reminder.split('\n\n')).toHaveLength(4)

    // OVERFLOW IS LOUD: an entry pushed past the cap stops the session naming
    // that entry, and no turn runs on a truncated priming.
    resetAiHost()
    const inflated = await deps({ delta: null, inflate: 'x'.repeat(MAX_PRIMING_CHARS + 1) })
    const client = scriptedClient([says('Should never be asked.')])
    setModelClient(client)
    let failure: unknown
    const events: unknown[] = []
    try {
      const opened = await openSession(SLUG, { cwd }, inflated)
      for await (const e of streamPrompt(opened.sessionId, 'Hello', { cwd }, inflated)) events.push(e)
    } catch (err) {
      failure = err
    }
    const said = failure instanceof Error ? failure.message : JSON.stringify(events)
    expect(said).toMatch(/km-landscape/)
    expect(said).toMatch(/60,?000/)
    expect(client.seen).toHaveLength(0)
  }, 180_000)
})

// ── AC-2107: empty product tier; every piece of material in exactly one place ─

describe('the product tier is empty and each text lives in one place', () => {
  it('test_UAT_AC2107_product_tier_is_empty_and_role_then_product_text_open_the_priming_with_no_restatement', async () => {
    // NO PRODUCT TIER is declared: the configuration has role entries only.
    for (const withCorpus of [true, false]) {
      const config = primingConfig(withCorpus)
      expect(Object.keys(config).sort()).toEqual(['priming', 'reminders'])
    }

    const seen = await turns(await deps({ delta: null }), ['Hello'])
    const system = systemText(seen[0])

    // None of the framework's product entries reached the model.
    expect(system).not.toMatch(/addressable/i)
    expect(system).not.toMatch(/turn id/i)

    // ROLE TEXT FIRST, PRODUCT TEXT VERBATIM AFTER IT.
    const role = primingText(ROLE_ENTRY)
    const product = primingText(PRODUCT_ENTRY)
    const purpose = primingText(PURPOSE_ENTRY)
    expect(system.trimStart().startsWith(role)).toBe(true)
    expect(system.indexOf(product)).toBeGreaterThan(system.indexOf(role))

    // THE PRODUCT TEXT CARRIES THE PRODUCT FACTS AND NAMES NO ROLE.
    expect(product).toContain('only through your tools')
    expect(product).toContain('refused whole')
    expect(product).not.toMatch(/consultant/i)
    for (const retired of LEGACY_ROLE_NAMES) expect(product).not.toMatch(new RegExp(retired, 'i'))

    // THE PURPOSE SITS BETWEEN THE MAP AND THE MANUAL, naming both corpora.
    expect(system.indexOf(TERRITORY)).toBeLessThan(system.indexOf(purpose))
    expect(system.indexOf(purpose)).toBeLessThan(system.indexOf('KnowledgeSearch'))
    expect(purpose).toMatch(/advise/)
    expect(purpose).toMatch(/corpus your client brings/)

    // NO PRODUCT SENTENCE RESTATED in the role text, the purpose or the reminder.
    const reminder = reminderOf(seen[0])
    const flat = (s: string) => s.replace(/\s+/g, ' ')
    const sentences = flat(product)
      .split(/(?<=[.:])\s+/)
      .map((s) => s.replace(/^#+\s*[^.]*?(?=[A-Z])/, '').trim())
      .filter((s) => s.length > 30)
    expect(sentences.length).toBeGreaterThan(5)
    for (const sentence of sentences) {
      for (const other of [role, purpose, reminder]) expect(flat(other), sentence).not.toContain(sentence)
    }

    // THE METHOD IS IN THE CORPUS, pointed to and never staged in these texts.
    for (const text of [product, role, purpose, reminder]) expect(text).not.toMatch(/stage \d/i)
  }, 180_000)
})

// ── AC-2109: the reminder is six configured entries, signals dropped when quiet ─

describe('the per-turn reminder is assembled from its configured entries', () => {
  it('test_UAT_AC2109_reminder_renders_six_ordered_entries_and_drops_each_signal_when_absent', async () => {
    // SIX ENTRIES, IN THIS ORDER.
    expect(primingDocument.reminders.map((e) => (e as { name: string }).name)).toEqual([
      'site',
      'no-framework-vocabulary',
      'act-rather-than-narrate',
      'method',
      'change-signal',
      'corpus-delta',
    ])

    const DELTA = 'New in your client’s material since you were last told: "Winter menu".'
    const hostDeps = await deps({ delta: null })
    const client = scriptedClient([says('First.'), says('Second.'), says('Third.')])
    setModelClient(client)
    const opened = await openSession(SLUG, { cwd }, hostDeps)
    const run = async (text: string, d: HostDeps) => {
      for await (const _e of streamPrompt(opened.sessionId, text, { cwd }, d)) void _e
    }

    // A QUIET TURN: the site, the knowledge-base pointer, nothing else.
    await run('Hello', hostDeps)
    const quiet = reminderOf(client.seen[0])
    expect(quiet).toBe(consultantReminder(SLUG))
    expect(quiet).toContain(`"${SLUG}"`)
    expect(quiet).toMatch(/acts on that site and no other/)
    expect(quiet).toMatch(/differ in kind rather than refining one/)
    expect(quiet).toMatch(/knowledge base/)
    expect(quiet).not.toMatch(/DOC-\d+/)
    expect(quiet).not.toMatch(/stage \d/i)
    expect(quiet.length).toBeLessThan(600)
    expect(quiet).not.toMatch(/changed this site|list_changes/)
    expect(quiet).not.toMatch(/\{\w+\}/)
    expect(quiet).toBe(quiet.replace(/\s+$/, ''))
    const paragraphs = quiet.split('\n\n')
    expect(paragraphs[0]).toMatch(/^You are working on the site/)
    expect(paragraphs.slice(1)).toEqual([
      primingText('no-framework-vocabulary'),
      primingText('act-rather-than-narrate'),
      primingText('method'),
    ])

    // THE CLIENT CHANGES THE SITE: the change paragraph reports count and cursor.
    await hostDeps.store.appendChange(SLUG, { kind: 'edit' } as never)
    await run('Again', hostDeps)
    const changed = reminderOf(client.seen[1])
    expect(changed).toMatch(/changed this site since your last turn — 1 change\./)
    const at = Number(/list_changes with since: (\d+)/.exec(changed)![1])
    expect(Number.isFinite(at)).toBe(true)
    expect(changed).toBe(consultantReminder(SLUG, { at, changes: 1 }))
    expect(changed.split('\n\n')).toHaveLength(5)

    // BOTH SIGNALS: a change and a corpus delta, the delta last.
    const withDelta = { ...hostDeps, delta: async () => DELTA } as HostDeps
    await hostDeps.store.appendChange(SLUG, { kind: 'edit' } as never)
    await run('Once more', withDelta)
    const both = reminderOf(client.seen[2])
    expect(both).toMatch(/1 change\./)
    expect(both).toContain(DELTA)
    expect(both.indexOf('list_changes with since:')).toBeLessThan(both.indexOf(DELTA))
    expect(both.endsWith(DELTA)).toBe(true)
    expect(both.split('\n\n')).toHaveLength(6)

    // A DELTA ALONE: the delta is the last paragraph, with no change line.
    const deltaOnly = consultantReminder(SLUG, undefined, DELTA)
    expect(deltaOnly.endsWith(`\n\n${DELTA}`)).toBe(true)
    expect(deltaOnly).not.toMatch(/list_changes/)
  }, 180_000)
})

// ── AC-2374: a placeholder with no value is left exactly as written ──────────
//
// LAST IN THE FILE ON PURPOSE. It loads a fresh copy of `roles.ts` over a
// configuration file whose templates carry a mistyped slot, which needs the
// module registry reset; nothing after it may depend on the instances the
// earlier tests share.

describe('a template slot with no value reaches the prompt as itself', () => {
  it('test_UAT_AC2374_a_placeholder_with_no_value_is_left_exactly_as_written', async () => {
    const shipped = primingDocument.templates
    const siteTemplate = `${shipped['site-line']} Mistyped: {slgu}.`
    const changeTemplate = `${shipped['change-signal']} Cursor: {cursor}.`
    vi.resetModules()
    vi.doMock('../tools/generate/src/cli/ai/priming.json', async (importOriginal) => {
      const actual = await importOriginal<{ default: typeof primingDocument }>()
      return {
        ...actual,
        default: {
          ...actual.default,
          templates: {
            ...actual.default.templates,
            'site-line': siteTemplate,
            'change-signal': changeTemplate,
          },
        },
      }
    })
    try {
      const fresh = await import('../tools/generate/src/cli/ai/roles')

      // The slot with a value is filled; the one with none is left verbatim,
      // braces and all, rather than blanked.
      const line = fresh.siteLine(SLUG)
      expect(line).toBe(siteTemplate.replace('{slug}', SLUG))
      expect(line).toContain('Mistyped: {slgu}.')
      expect(line).not.toContain('{slug}')

      const signal = fresh.changeSignal({ since: { at: 7, changes: 3 } })
      expect(signal).toContain('3 changes')
      expect(signal).toContain('since: 7')
      expect(signal).toContain('Cursor: {cursor}.')
      expect(signal).not.toMatch(/\{(changes|plural|at)\}/)

      // And that is what the turn's reminder carries.
      const reminder = fresh.consultantReminder(SLUG, { at: 7, changes: 3 })
      expect(reminder.startsWith(line)).toBe(true)
      expect(reminder).toContain(signal!)
    } finally {
      vi.doUnmock('../tools/generate/src/cli/ai/priming.json')
      vi.resetModules()
    }
  })
})
