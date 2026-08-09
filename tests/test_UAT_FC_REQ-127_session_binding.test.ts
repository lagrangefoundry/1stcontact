import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { startBuilder, type BuilderHandle } from '../tools/generate/src/cli/builder'
import { resetAiHost, sessionsDir, setModelClient } from '../tools/generate/src/cli/ai/host'
import { cmdNew } from '../tools/generate/src/cli/commands'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * REQ-127 — **the site binding lives in the session**.
 *
 * REQ-126 put the L1 control surface behind a declared API and a configured
 * grant, and left one clause of REQ-127 open: what to do about the site binding,
 * which was a slug closed over at construction. The answer is not to declare it
 * as a scope predicate — that would hand the model a `slug` parameter it must get
 * right on every call, re-opening an error class that does not currently exist.
 * The binding did not need declaring; it needed LOCATING.
 *
 * So: a site becomes a session in exactly one place (`POST /api/ai/session`), and
 * every turn afterwards carries that session id. Above the host — the origin's
 * prompt route, the browser transport, the chat pane — nothing names a site.
 *
 * What is asserted here is the ORIGIN half of that, over real HTTP against a real
 * `startBuilder`: that a turn identifies a conversation and not a site, that the
 * conversation is what carries the site, and that a session id the origin never
 * issued is refused rather than treated as a key into the store. The browser half
 * is `test_UAT_FC_REQ-127_session_panel`.
 *
 * One thing is a double — the Anthropic client — for the reason the REQ-122 host
 * suite gives: it is the network. Every consequence read below (the draft on
 * disk, the transcript, the status code) is produced by the real machinery.
 */

const SLUG = 'studio'
const OTHER = 'annex'
const HEADLINE = 'The old headline.'
const HEADLINE_PATH = '0.0'

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

function headline(cwd: string, slug: string): string {
  const home = JSON.parse(
    readFileSync(path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json'), 'utf8'),
  )
  return home.l1.root.children[0].text
}

interface ModelRequest {
  system: string
  messages: { role: string; content: unknown }[]
  tools: { name: string; description: string; input_schema: Record<string, unknown> }[]
}

/** A client that answers with a scripted sequence and records what it was asked. */
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

/** Rename the headline — the one write these cases use as evidence. */
const renames = (to: string) => [
  calls('set_l1', { page: 'home', path: HEADLINE_PATH, node: { kind: 'text', text: to } }),
  says(`Done — the headline now reads "${to}".`),
]

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

/** POST a turn body verbatim, so a case can send the WRONG shape on purpose. */
function post(base: string, route: string, body: unknown): Promise<Response> {
  return fetch(`${base}api/ai/${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function openFor(base: string, slug: string): Promise<string> {
  const res = await post(base, 'session', { slug })
  expect(res.status).toBe(200)
  return ((await res.json()) as { sessionId: string }).sessionId
}

let cwd: string
let builder: BuilderHandle
let base: string

beforeAll(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req127-host-'))
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
  for (const slug of [SLUG, OTHER]) seedPage(cwd, slug)
  rmSync(sessionsDir({ cwd }), { recursive: true, force: true })
  resetAiHost()
})

afterEach(() => {
  setModelClient(null)
})

// ── a turn names a conversation, not a site ──────────────────────────────────

describe('REQ-127 — a turn identifies a session', () => {
  it('test_UAT_FC_REQ-127_a_turn_carries_a_session_id_and_reaches_the_site_it_was_opened_for', async () => {
    setModelClient(scriptedClient(renames('A new headline.')))

    // The ONLY place a site is named. Everything after this is a conversation.
    const sessionId = await openFor(base, SLUG)

    const res = await post(base, 'prompt', { sessionId, text: 'Change the headline' })
    expect(res.status).toBe(200)
    const events = frames(await res.text())

    // The write landed on studio — carried by the session, because the request
    // body contained no site and the model has no `slug` parameter to supply.
    expect(headline(cwd, SLUG)).toBe('A new headline.')
    expect(headline(cwd, OTHER)).toBe(HEADLINE)
    expect(events.at(-1)?.kind).toBe('done')
    expect(events.some((e) => e.kind === 'tool_activity')).toBe(true)
  })

  it('test_UAT_FC_REQ-127_naming_a_site_instead_of_a_session_is_not_accepted', async () => {
    setModelClient(scriptedClient([says('should never run')]))
    // Prove the site EXISTS and has a session, so the refusal below is about the
    // shape of the request and not about an unknown site.
    await openFor(base, SLUG)

    const res = await post(base, 'prompt', { slug: SLUG, text: 'Change the headline' })

    // A slug is no longer identification. Refused before anything is streamed —
    // there is no conversation named by this request to stream into.
    expect(res.status).toBe(400)
    expect(((await res.json()) as { error: string }).error).toContain('sessionId')
    expect(headline(cwd, SLUG)).toBe(HEADLINE)
  })
})

// ── an id the origin never issued ────────────────────────────────────────────

describe('REQ-127 — a session id is resolved, not trusted', () => {
  it('test_UAT_FC_REQ-127_an_unissued_session_id_is_refused_rather_than_opened', async () => {
    setModelClient(scriptedClient(renames('Should not happen.')))

    // The id a client would GUESS: it is exactly what `sessionIdFor` derives, and
    // under the old design it was recomputed from the slug on every turn. The
    // point of the registry is that being derivable is not the same as being
    // issued.
    const res = await post(base, 'prompt', { sessionId: `site-${SLUG}`, text: 'Change it' })

    expect(res.status).toBe(404)
    expect(((await res.json()) as { error: string }).error).toContain(`site-${SLUG}`)

    // Nothing was created and nothing was written: an unissued id is not a key
    // into the session store.
    expect(headline(cwd, SLUG)).toBe(HEADLINE)
    expect(existsSync(sessionsDir({ cwd }))).toBe(false)
  })

  it('test_UAT_FC_REQ-127_an_invented_session_id_starts_no_conversation', async () => {
    setModelClient(scriptedClient([says('should never run')]))

    const res = await post(base, 'prompt', { sessionId: '../../etc/passwd', text: 'hello' })

    // The refusal is the same one an unknown id gets. There is no separate
    // sanitising step to get wrong, because the id is never used to name
    // anything — it is looked up, and a miss is a miss.
    expect(res.status).toBe(404)
    expect(existsSync(sessionsDir({ cwd }))).toBe(false)
  })

  it('test_UAT_FC_REQ-127_a_refused_turn_is_a_status_code_and_not_an_apology_in_the_chat', async () => {
    setModelClient(scriptedClient([says('should never run')]))

    const res = await post(base, 'prompt', { sessionId: 'site-nowhere', text: 'hello' })

    // A protocol error in the caller must not arrive dressed as the assistant
    // having tried and failed — that would put a fabricated apology in the
    // operator's transcript. It is JSON with a code, not an event stream.
    expect(res.status).toBe(404)
    expect(res.headers.get('content-type')).toContain('application/json')
    expect(res.headers.get('content-type')).not.toContain('event-stream')
  })
})

// ── two sites remain two conversations ───────────────────────────────────────

describe('REQ-127 — the binding survives where it used to be re-asserted', () => {
  it('test_UAT_FC_REQ-127_each_site_session_writes_only_its_own_site', async () => {
    setModelClient(scriptedClient(renames('Studio headline.')))
    const studio = await openFor(base, SLUG)
    const annex = await openFor(base, OTHER)

    // Two ids, held at once, and the only thing distinguishing the turns.
    expect(studio).not.toBe(annex)

    expect((await post(base, 'prompt', { sessionId: studio, text: 'Rename it' })).status).toBe(200)
    expect(headline(cwd, SLUG)).toBe('Studio headline.')
    expect(headline(cwd, OTHER)).toBe(HEADLINE)

    setModelClient(scriptedClient(renames('Annex headline.')))
    expect((await post(base, 'prompt', { sessionId: annex, text: 'Rename it' })).status).toBe(200)
    expect(headline(cwd, OTHER)).toBe('Annex headline.')
    expect(headline(cwd, SLUG)).toBe('Studio headline.')
  })

  it('test_UAT_FC_REQ-127_reopening_a_site_returns_the_same_conversation', async () => {
    setModelClient(scriptedClient([says('Noted.')]))
    const first = await openFor(base, SLUG)
    await post(base, 'prompt', { sessionId: first, text: 'Remember this' })

    // Re-opening is what the browser does on a reload or a site switch back. It
    // must answer with the SAME conversation — the id is derived from the site,
    // so there is no index to keep in step and nothing to lose.
    const again = await post(base, 'session', { slug: SLUG })
    const opened = (await again.json()) as {
      sessionId: string
      turns: { role: string; markdown: string }[]
    }
    expect(opened.sessionId).toBe(first)
    expect(opened.turns.map((t) => t.markdown)).toContain('Remember this')
  })
})
