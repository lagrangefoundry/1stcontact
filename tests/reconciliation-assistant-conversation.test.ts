import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { startBuilder, type BuilderHandle } from '../tools/generate/src/cli/builder'
import { resetAiHost, sessionsDir, setModelClient } from '../tools/generate/src/cli/ai/host'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox'
import { cmdNew } from '../tools/generate/src/cli/commands'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * **One continuing conversation about one site** (story-a58a0974).
 *
 * Everything below drives real HTTP against a real `startBuilder`: real session
 * manager, real role assembly, real tool loop, real tool handlers, real `edit.ts`
 * writes, real SSE, real on-disk transcripts. ONE thing is a double — the
 * Anthropic client — because it is the network, and it is the boundary the AI
 * library's own backend is written to have injected (`client`). Every consequence
 * asserted here (the draft on disk, the transcript in the workspace, the status
 * code, the frames on the wire) is produced by the real machinery.
 */

const SLUG = 'studio'
const OTHER = 'annex'
const HEADLINE = 'The old headline.'
/** The address of the page's one text run: root list index, then child index. */
const HEADLINE_PATH = '0.0'

/** A page with one addressable text run, so a write has somewhere to land. */
function seedPage(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  home.l1.root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'text', text: HEADLINE, axes: { fontSizePx: 32 } }],
  } satisfies L1Node
  home.modules = []
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

function homePath(cwd: string, slug: string): string {
  return path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
}

function draftBytes(cwd: string, slug: string): string {
  return readFileSync(homePath(cwd, slug), 'utf8')
}

function headline(cwd: string, slug: string): string {
  return JSON.parse(draftBytes(cwd, slug)).l1.root.children[0].text
}

/** Every file under a directory, recursively — used to read the transcript store. */
function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    return statSync(full).isDirectory() ? filesUnder(full) : [full]
  })
}

// ── the model double ─────────────────────────────────────────────────────────

interface ModelRequest {
  system: string
  messages: { role: string; content: unknown }[]
  tools: { name: string; description: string; input_schema: Record<string, unknown> }[]
}

/**
 * A client that answers with a scripted sequence and records what it was asked.
 *
 * The recording is half the evidence: what the model is SENT — the assembled
 * priming, the reminder, the tool schemas — is produced by the host. The last
 * script step repeats, so a loop running an extra iteration is a failed
 * assertion rather than a crash.
 */
function scriptedClient(steps: Array<(req: ModelRequest) => unknown>) {
  const seen: ModelRequest[] = []
  let index = 0
  return {
    seen,
    messages: {
      create: async (req: ModelRequest) => {
        seen.push(req)
        const step = steps[Math.min(index, steps.length - 1)]
        index += 1
        return step(req)
      },
    },
  }
}

const says = (text: string) => () => ({ content: [{ type: 'text', text }] })
const calls = (name: string, input: Record<string, unknown>) => () => ({
  content: [{ type: 'tool_use', id: `call-${name}`, name, input }],
})

/** Rename the headline, then say so — the site-changing turn these cases use. */
const renames = (to: string) => [
  calls('set_l1', {
    page: 'home',
    path: HEADLINE_PATH,
    node: { kind: 'text', text: to, axes: { fontSizePx: 32 } },
  }),
  says(`Done — the headline now reads "${to}".`),
]

// ── the transport ────────────────────────────────────────────────────────────

interface StreamEvent {
  kind: string
  content?: string
  meta?: Record<string, unknown>
}

function frames(body: string): StreamEvent[] {
  return body
    .split('\n\n')
    .map((frame) => frame.trim())
    .filter((frame) => frame.startsWith('data:'))
    .map((frame) => JSON.parse(frame.slice(5).trim()) as StreamEvent)
}

/** POST a body verbatim, so a case can send the WRONG shape on purpose. */
function post(base: string, route: string, body: unknown): Promise<Response> {
  return fetch(`${base}api/ai/${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

interface OpenedSession {
  sessionId: string
  turns: { role: string; markdown: string }[]
  ready: boolean
  error?: string
}

/** Open a site's conversation — the ONLY call that names a site. */
async function open(base: string, slug: string): Promise<OpenedSession> {
  const res = await post(base, 'session', { slug })
  expect(res.status).toBe(200)
  return (await res.json()) as OpenedSession
}

/** Run one turn in an open conversation and collect the SSE frames, parsed. */
async function turn(base: string, sessionId: string, text: string): Promise<StreamEvent[]> {
  const res = await post(base, 'prompt', { sessionId, text })
  expect(res.status).toBe(200)
  expect(res.headers.get('content-type')).toContain('text/event-stream')
  return frames(await res.text())
}

/** Open a site's conversation and speak in it — the browser's sequence. */
async function speak(base: string, slug: string, text: string): Promise<StreamEvent[]> {
  const opened = await open(base, slug)
  return turn(base, opened.sessionId, text)
}

// ── the fixture ──────────────────────────────────────────────────────────────

let cwd: string
let builder: BuilderHandle
let base: string

beforeAll(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'story-a58a0974-'))
  for (const slug of [SLUG, OTHER]) {
    cmdNew(slug, { cwd })
    seedPage(cwd, slug)
  }
  builder = await startBuilder({ cwd })
  base = builder.url
}, 180000)

afterAll(async () => {
  await builder.close()
  rmSync(cwd, { recursive: true, force: true })
})

beforeEach(() => {
  // The draft is the evidence these cases read, and a turn REALLY writes it — so
  // it is restored per case. Conversations go with it: one carried over from the
  // previous case would make "this site has no conversation yet" un-assertable.
  for (const slug of [SLUG, OTHER]) seedPage(cwd, slug)
  rmSync(sessionsDir({ cwd }), { recursive: true, force: true })
  resetAiHost()
})

afterEach(() => {
  setModelClient(null)
})

// ── asking what the assistant is ─────────────────────────────────────────────

describe('the assistant answers for itself before any conversation exists', () => {
  it('test_UAT_AC1051_capability_answer_names_the_role_and_readiness_without_a_conversation', async () => {
    setModelClient(scriptedClient([says('Hello — what would you like to change?')]))

    const res = await fetch(`${base}api/ai/roles`)
    expect(res.status).toBe(200)
    const status = (await res.json()) as { roles: string[]; ready: boolean; error?: string }

    // One role on offer, named — and the answer says a turn can be run, with no
    // reason attached because there is nothing to explain.
    expect(status.roles).toEqual(['caretaker'])
    expect(status.ready).toBe(true)
    expect(status.error).toBeUndefined()

    // Asking cost nothing: no site was named and no conversation was opened.
    expect(existsSync(sessionsDir({ cwd }))).toBe(false)

    // The answer is about the ASSISTANT, not about any conversation — so opening
    // one and speaking in it, which really does write a transcript, leaves the
    // answer identical. Without this the invariance is only ever exercised in the
    // not-ready state (AC-1060), never while the assistant can actually run.
    await speak(base, SLUG, 'Hi there')
    expect(existsSync(sessionsDir({ cwd }))).toBe(true)

    const after = await fetch(`${base}api/ai/roles`)
    expect(after.status).toBe(200)
    const afterStatus = (await after.json()) as typeof status

    // Compared over the three fields the criterion names — the role on offer,
    // whether a turn can be run, and the reason when it cannot. `backends` is
    // deliberately excluded: `aiStatus` forwards it from the AI library's GLOBAL
    // backend registry (`host.ts:407`), and taking a turn WRITES to that registry
    // — `build()` registers `claude+site:studio` (`host.ts:231`; the comment at
    // `host.ts:26-29` explains why the names are per-site). Invariance of that
    // registry is neither claimed by this AC nor guaranteed by the design, so
    // asserting it would be testing the library rather than this behaviour.
    expect(afterStatus.roles).toEqual(['caretaker'])
    expect(afterStatus.ready).toBe(true)
    expect(afterStatus.error).toBeUndefined()
  })
})

// ── opening a conversation ───────────────────────────────────────────────────

describe('naming a site opens that site’s conversation', () => {
  it('test_UAT_AC1052_opening_answers_with_an_identifier_the_turns_so_far_and_readiness', async () => {
    setModelClient(scriptedClient([says('Hello — what would you like to change?')]))

    // A site that has never been used: an empty conversation is normal, not an
    // error, so the answer is a 200 carrying an id and no turns.
    const first = await open(base, SLUG)
    expect(first.sessionId).toBeTruthy()
    expect(first.turns).toEqual([])
    expect(first.ready).toBe(true)
    expect(first.error).toBeUndefined()

    await turn(base, first.sessionId, 'Hi there')

    // Re-opening is what the browser does on a reload or a switch back: the SAME
    // conversation, both turns, in order, each attributed to who spoke it.
    const again = await open(base, SLUG)
    expect(again.sessionId).toBe(first.sessionId)
    expect(again.ready).toBe(true)
    expect(again.turns.map((t) => t.role)).toEqual(['user', 'assistant'])
    expect(again.turns[0].markdown).toBe('Hi there')
    expect(again.turns[1].markdown).toContain('what would you like to change?')
  })
})

// ── a turn is addressed to a conversation ────────────────────────────────────

describe('a turn is addressed to a conversation, never to a site', () => {
  it('test_UAT_AC1053_naming_a_site_or_omitting_a_value_is_refused_as_malformed', async () => {
    const client = scriptedClient([says('should never run')])
    setModelClient(client)

    // The site EXISTS and has a conversation, so every refusal below is about the
    // shape of the request and not about an unknown site.
    const opened = await open(base, SLUG)
    const before = draftBytes(cwd, SLUG)

    const malformed: Array<{ body: unknown; missing: string[]; supplied: string[] }> = [
      // A site instead of the conversation — the request the old design accepted.
      {
        body: { slug: SLUG, text: 'Change the headline' },
        missing: ['sessionId'],
        supplied: ['text'],
      },
      { body: { text: 'Change the headline' }, missing: ['sessionId'], supplied: ['text'] },
      { body: { sessionId: opened.sessionId }, missing: ['text'], supplied: ['sessionId'] },
      { body: {}, missing: ['sessionId', 'text'], supplied: [] },
    ]

    for (const { body, missing, supplied } of malformed) {
      const res = await post(base, 'prompt', body)
      expect(res.status).toBe(400)
      expect(res.headers.get('content-type')).toContain('application/json')
      const error = ((await res.json()) as { error: string }).error
      // The refusal has to IDENTIFY the omission, so each case reads both ways:
      // the value left out is named, and a value that WAS supplied is not. A
      // constant naming both would satisfy the first check while saying nothing
      // about which one the caller actually missed.
      for (const name of missing) expect(error).toContain(name)
      for (const name of supplied) expect(error).not.toContain(name)
    }

    // Refused before any turn began: nothing was sent to the model, the draft is
    // byte-identical, and the conversation was neither started nor extended.
    expect(client.seen).toHaveLength(0)
    expect(draftBytes(cwd, SLUG)).toBe(before)
    expect((await open(base, SLUG)).turns).toEqual([])
  })

  it('test_UAT_AC1054_a_site_changing_turn_streams_its_activity_and_leaves_the_change_in_the_draft', async () => {
    setModelClient(scriptedClient(renames('A new headline.')))

    const events = await speak(base, SLUG, 'Change the headline to "A new headline."')

    // The DRAFT is the evidence, not the stream: the tool ran the real
    // `editL1Set`, so the site on disk says what the operator asked for.
    expect(headline(cwd, SLUG)).toBe('A new headline.')

    // …and the stream said what it did, in the order it happened, ending in
    // exactly one completion that releases the caller.
    const activity = events.find((e) => e.kind === 'tool_activity')
    expect(activity?.meta).toMatchObject({ event: 'tool_call', name: 'set_l1' })
    expect(
      events
        .filter((e) => e.kind === 'text')
        .map((e) => e.content)
        .join(''),
    ).toContain('A new headline.')
    expect(events.filter((e) => e.kind === 'done')).toHaveLength(1)
    expect(events.at(-1)?.kind).toBe('done')
  })

  /**
   * AC-1055 — **an identifier is answered only when it names a site this account
   * holds**, and the lookup is against storage rather than against anything a
   * process remembers.
   *
   * WHAT THIS USED TO ASSERT, AND WHY IT IS THE OPPOSITE NOW (BUG-38). The
   * origin used to answer only for identifiers a `minted` map in the serving
   * process had recorded issuing. That map was the only thing standing between an
   * arbitrary client string and the session store, so it read as a security
   * property — but the process that mints (`/api/ai/session`) and the process
   * that resolves (`/api/ai/prompt`) are two requests, and in workerd they are
   * not the same isolate. Deployed, EVERY turn met an empty map and was told the
   * conversation was no longer open. The authority check survives, made against
   * storage instead of memory: the id is resolved to a slug and answered only if
   * this account's store actually holds that site. So the derivable form now
   * RESOLVES — it is the only thing a client carries between opening a
   * conversation and speaking in it, and refusing it refused every turn — while
   * every identifier that names no site here is still refused, and refused for a
   * reason no isolate's memory can change.
   *
   * THE REFUSALS COME FIRST. They are the cases that must leave nothing behind,
   * and the one case that resolves really does write a transcript and a draft.
   */
  it('test_UAT_AC1055_an_identifier_is_answered_only_when_it_names_a_site_this_account_holds', async () => {
    const client = scriptedClient(renames('Should not happen.'))
    setModelClient(client)

    // A SECOND ACCOUNT: its own workspace, holding its own site and not this
    // one. It is what makes "scoped to the account" checkable rather than
    // "scoped to the name" — the same identifier goes to both below.
    const otherCwd = mkdtempSync(path.join(tmpdir(), 'story-a58a0974-elsewhere-'))
    cmdNew(OTHER, { cwd: otherCwd })
    const elsewhere = await startBuilder({ cwd: otherCwd })

    try {
      const refused: Array<{ id: string; why: string }> = [
        // Fabricated: nothing about it resembles an identifier this origin makes.
        { id: 'conversation-42', why: 'a fabricated identifier' },
        // Well-formed, and names a site that has never existed.
        { id: 'site-ghost', why: 'names a site that does not exist' },
        // No derivable site name at all — the bare site name, unprefixed…
        { id: SLUG, why: 'unprefixed, so no site name is derivable' },
        // …and the prefix with nothing after it, which would otherwise derive the
        // empty slug and ask the store about it.
        { id: 'site-', why: 'the prefix with nothing after it' },
        // Path traversal, bare and behind the prefix. There is no separate
        // sanitising step to get wrong: the identifier is looked up, and a miss
        // is a miss.
        { id: '../../etc/passwd', why: 'path traversal, unprefixed' },
        { id: 'site-../../etc/passwd', why: 'path traversal behind the prefix' },
      ]

      for (const { id, why } of refused) {
        const res = await post(base, 'prompt', { sessionId: id, text: 'Change the headline' })
        expect(res.status, why).toBe(404)
        // A plain refusal, not an event stream: a protocol error must not arrive
        // dressed as the assistant having tried and failed.
        expect(res.headers.get('content-type'), why).toContain('application/json')
        expect(res.headers.get('content-type'), why).not.toContain('event-stream')
        expect(((await res.json()) as { error: string }).error, why).toBeTruthy()
      }

      // ── THE ACCOUNT-SCOPED REFUSAL ─────────────────────────────────────────
      // The identifier the origin derives for a site THIS workspace holds,
      // submitted to a workspace that does not hold it. Same string, different
      // account: refused there. Resolution is against the account's own storage,
      // not against a name that happens to look right anywhere it is presented.
      const foreign = await post(elsewhere.url, 'prompt', {
        sessionId: `site-${SLUG}`,
        text: 'Change the headline',
      })
      expect(foreign.status).toBe(404)
      expect(foreign.headers.get('content-type')).toContain('application/json')
      expect(foreign.headers.get('content-type')).not.toContain('event-stream')
      expect(((await foreign.json()) as { error: string }).error).toBeTruthy()

      // After every refusal above: no conversation was created on either account,
      // nothing was sent to the model, no transcript storage appeared, and no
      // site was written.
      expect(client.seen).toHaveLength(0)
      expect(existsSync(sessionsDir({ cwd }))).toBe(false)
      expect(existsSync(sessionsDir({ cwd: otherCwd }))).toBe(false)
      expect(headline(cwd, SLUG)).toBe(HEADLINE)
      expect(headline(cwd, OTHER)).toBe(HEADLINE)

      // ── AND THE ONE THAT RESOLVES ──────────────────────────────────────────
      // The same identifier, on the account that holds the site, submitted
      // WITHOUT opening a conversation first — which is exactly what a client
      // holding an id across a reload, or across a replaced process, does. It
      // resolves and the turn is answered.
      const answering = scriptedClient(renames('A new headline.'))
      setModelClient(answering)

      const answered = await post(base, 'prompt', {
        sessionId: `site-${SLUG}`,
        text: 'Change the headline to "A new headline."',
      })

      // A stream, not the plain not-found answer every case above got: this is
      // the one observation that separates "resolved" from "refused".
      expect(answered.status).toBe(200)
      expect(answered.headers.get('content-type')).toContain('text/event-stream')
      expect(answered.headers.get('content-type')).not.toContain('application/json')
      const events = frames(await answered.text())
      expect(events.filter((e) => e.kind === 'done')).toHaveLength(1)

      // …and the turn really RAN: the identifier was resolved to this site and
      // the assistant was asked about it. Asserted on what the model was SENT
      // rather than on what it replied — the reply, and the change it leaves in
      // the draft, are AC-1054's subject. Making this criterion depend on them
      // would make a resolution failure and a model failure indistinguishable,
      // which is the one thing it exists to tell apart.
      expect(answering.seen.length).toBeGreaterThan(0)
      expect(JSON.stringify(answering.seen[0])).toContain(SLUG)

      // …and it is the SAME identifier the origin hands out when asked, so the
      // case above is the one a real client is in and not a lucky string.
      expect((await open(base, SLUG)).sessionId).toBe(`site-${SLUG}`)

      // Answering it reached only this account: the other's site is untouched
      // and it still has no conversation.
      expect(headline(cwd, OTHER)).toBe(HEADLINE)
      expect(existsSync(sessionsDir({ cwd: otherCwd }))).toBe(false)
    } finally {
      await elsewhere.close()
      rmSync(otherCwd, { recursive: true, force: true })
    }
  }, 180000)
})

// ── two sites are two conversations ──────────────────────────────────────────

describe('two sites are two conversations', () => {
  it('test_UAT_AC1056_each_conversation_changes_only_its_own_site_and_holds_only_its_own_turns', async () => {
    setModelClient(scriptedClient(renames('Studio headline.')))
    const studio = await open(base, SLUG)
    const annex = await open(base, OTHER)

    // Two conversations, held at once, and the only thing distinguishing the
    // turns below — neither request names a site.
    expect(studio.sessionId).not.toBe(annex.sessionId)

    await turn(base, studio.sessionId, 'Rename the studio headline')
    expect(headline(cwd, SLUG)).toBe('Studio headline.')
    expect(headline(cwd, OTHER)).toBe(HEADLINE)

    setModelClient(scriptedClient(renames('Annex headline.')))
    await turn(base, annex.sessionId, 'Rename the annex headline')
    expect(headline(cwd, OTHER)).toBe('Annex headline.')
    expect(headline(cwd, SLUG)).toBe('Studio headline.')

    // Each transcript holds its own exchange and nothing of the other's.
    const studioAgain = await open(base, SLUG)
    const annexAgain = await open(base, OTHER)
    expect(studioAgain.sessionId).toBe(studio.sessionId)
    expect(annexAgain.sessionId).toBe(annex.sessionId)
    expect(studioAgain.turns.map((t) => t.markdown).join('\n')).toContain('studio headline')
    expect(studioAgain.turns.map((t) => t.markdown).join('\n')).not.toContain('annex headline')
    expect(annexAgain.turns.map((t) => t.markdown).join('\n')).toContain('annex headline')
    expect(annexAgain.turns.map((t) => t.markdown).join('\n')).not.toContain('studio headline')
  })
})

// ── continuity ───────────────────────────────────────────────────────────────

describe('the conversation is stored with the workspace', () => {
  it('test_UAT_AC1057_turns_persist_under_the_workspace_and_are_replayed_after_a_restart', async () => {
    setModelClient(scriptedClient([says('Noted — I will remember that.')]))
    await speak(base, SLUG, 'Remember this')

    // It lives beside the store it is about — a workspace directory, not a
    // machine-wide home path shared across checkouts.
    const store = sessionsDir({ cwd })
    expect(store.startsWith(cwd)).toBe(true)
    expect(existsSync(store)).toBe(true)
    const stored = filesUnder(store).map((file) => readFileSync(file, 'utf8'))
    expect(stored.join('\n')).toContain('Remember this')

    // A restart: every cached manager and issued id is gone. The conversation is
    // not, because it was never only in memory.
    resetAiHost()
    const replayed = await open(base, SLUG)
    expect(replayed.ready).toBe(true)
    expect(replayed.turns.map((t) => t.role)).toEqual(['user', 'assistant'])
    expect(replayed.turns[0].markdown).toBe('Remember this')
    expect(replayed.turns[1].markdown).toContain('I will remember that.')

    // …and that store is where it lived: remove it and the same site opens on an
    // empty conversation.
    rmSync(store, { recursive: true, force: true })
    resetAiHost()
    const emptied = await open(base, SLUG)
    expect(emptied.sessionId).toBe(replayed.sessionId)
    expect(emptied.turns).toEqual([])
  })
})

// ── what the assistant is offered and told ───────────────────────────────────

describe('what the assistant is offered', () => {
  it('test_UAT_AC1058_only_granted_site_operations_are_offered_none_touching_files_or_naming_a_site', async () => {
    const client = scriptedClient([says('Understood.')])
    setModelClient(client)
    await speak(base, SLUG, 'What can you do?')

    const { system, tools } = client.seen[0]
    const names = tools.map((t) => t.name)

    // Exactly the operations its grant allows — the same projection the surface
    // makes for this role, not a second list that could drift from it.
    const granted = Object.keys(
      (await createL1Toolbox(SLUG, { cwd })).schemas() as Record<string, unknown>,
    )
    expect(names.slice().sort()).toEqual(granted.slice().sort())

    // Site-changing and site-reading operations are there…
    expect(names).toContain('set_l1')
    expect(names).toContain('describe_page')

    // …and nothing that reads, writes or searches files. The forbidden list is
    // enforced by absence, and this is what absence looks like from the model's
    // side.
    for (const forbidden of ['Read', 'Write', 'Glob', 'Grep']) {
      expect(names).not.toContain(forbidden)
    }
    expect(names.filter((n) => /file|glob|grep|shell|bash/i.test(n))).toEqual([])

    // No operation takes a site, so acting on another site is not a mistake
    // available to it.
    for (const spec of tools) {
      expect(Object.keys(spec.input_schema.properties as object)).not.toContain('slug')
    }

    // Its priming names the site under work, describes what it can do — from the
    // generated manual, so it cannot fall behind the operations it describes —
    // and states what deliberately has no operation.
    expect(system).toContain(`the site "${SLUG}"`)
    expect(system).toContain('## What you can do')
    expect(system).toContain('describe_page')
    expect(system).toContain('## Not available')
  })
})

// ── honest failure ───────────────────────────────────────────────────────────

describe('a failure is reported honestly', () => {
  it('test_UAT_AC1059_a_refused_operation_returns_a_named_refusal_into_the_same_turn', async () => {
    const client = scriptedClient([
      // An address that resolves to nothing — the mistake a model actually makes.
      calls('set_l1', { page: 'home', path: '9.9', node: { kind: 'text', text: 'Nowhere.' } }),
      says('Sorry — I could not find that, so I have left the page as it was.'),
    ])
    setModelClient(client)
    const before = draftBytes(cwd, SLUG)

    const events = await speak(base, SLUG, 'Change something that is not there')

    // A refused operation writes nothing: `editL1Set` refuses before a byte.
    expect(draftBytes(cwd, SLUG)).toBe(before)

    // The refusal names its failure class and states what to do instead, so the
    // assistant can correct itself rather than ask the operator.
    const refusal = String(
      (events.find((e) => e.kind === 'tool_activity')?.meta as { output?: string })?.output,
    )
    expect(refusal).toContain('NOT_FOUND')
    expect(refusal).toMatch(/re-read/i)

    // …and it was handed back into the SAME turn, which then continued to a
    // single completion rather than ending on the refusal.
    expect(JSON.stringify(client.seen[1].messages)).toContain('NOT_FOUND')
    expect(events.filter((e) => e.kind === 'done')).toHaveLength(1)
  })

  it('test_UAT_AC1060_a_missing_credential_is_explained_without_losing_the_conversation', async () => {
    // A real conversation first, through the injected client…
    setModelClient(scriptedClient([says('Noted.')]))
    await speak(base, SLUG, 'Remember this')

    // …then the origin restarts with no client and no key — a builder started
    // without ANTHROPIC_API_KEY.
    const key = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    setModelClient(null)
    resetAiHost()
    try {
      const opened = await open(base, SLUG)

      // The failure is reported, in words written for an operator — and the
      // history is not collateral damage.
      expect(opened.ready).toBe(false)
      expect(opened.error).toContain('ANTHROPIC_API_KEY')
      expect(opened.error).toMatch(/assistant is not switched on/i)
      expect(opened.turns.map((t) => t.markdown)).toContain('Remember this')
      expect(opened.turns).toHaveLength(2)

      // The capability answer says the same thing for the same reason, so a
      // caller can say so before opening anything — while still naming the role.
      const status = (await fetch(`${base}api/ai/roles`).then((r) => r.json())) as {
        roles: string[]
        ready: boolean
        error?: string
      }
      expect(status.ready).toBe(false)
      expect(status.roles).toContain('caretaker')
      expect(status.error).toContain('ANTHROPIC_API_KEY')
    } finally {
      if (key !== undefined) process.env.ANTHROPIC_API_KEY = key
    }
  })

  it('test_UAT_AC1061_a_failure_after_streaming_begins_arrives_in_the_stream_before_one_completion', async () => {
    setModelClient({
      messages: {
        create: async () => {
          throw new Error('the model is unreachable')
        },
      },
    })

    const opened = await open(base, SLUG)
    const res = await post(base, 'prompt', { sessionId: opened.sessionId, text: 'anything' })

    // A refusal status is no longer available — the answer is a well-formed
    // stream, not a truncated one.
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    const events = frames(await res.text())

    // The failure is named in readable prose inside the stream, and the caller is
    // released by exactly one terminal completion. A turn never simply stops.
    expect(
      events
        .filter((e) => e.kind === 'text')
        .map((e) => e.content)
        .join(''),
    ).toContain('the model is unreachable')
    expect(events.filter((e) => e.kind === 'done')).toHaveLength(1)
    expect(events.at(-1)?.kind).toBe('done')
  })
})
