import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { startBuilder, type BuilderHandle } from '../tools/generate/src/cli/builder'
import { resetAiHost, sessionsDir, setModelClient } from '../tools/generate/src/cli/ai/host'
import { cmdNew } from '../tools/generate/src/cli/commands'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * REQ-122 — **the assistant, end to end over the builder origin**.
 *
 * Everything below drives real HTTP against a real `startBuilder` server: real
 * session manager, real role assembly, real tool loop, real tool handlers, real
 * `edit.ts` writes, real SSE. ONE thing is a double — the Anthropic client — and
 * it is the one thing that cannot be otherwise: it is the network, and it is the
 * boundary the AI library's own backend is written to have injected (`client`).
 *
 * That line matters for what this evidence is worth. A test that stubbed the
 * session manager or the tools would prove the routes can call themselves. Here
 * the only thing asserted about the model is what it was SENT and what happens
 * when it answers; every consequence — the draft on disk, the persisted
 * transcript, the events on the wire — is produced by the real machinery.
 */

const SLUG = 'studio'
const OTHER = 'annex'
const HEADLINE = 'The old headline.'
const HEADLINE_PATH = '0.0'

/** A page with one addressable text run, so `set_l1` has somewhere to land. */
function seedPage(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'text', text: HEADLINE, axes: { fontSizePx: 32 } }],
  }
  home.l1.root = root
  home.modules = []
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

function headline(cwd: string, slug: string): string {
  const home = JSON.parse(
    readFileSync(path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json'), 'utf8'),
  )
  return home.l1.root.children[0].text
}

// ── the model double ─────────────────────────────────────────────────────────

interface ModelRequest {
  system: string
  messages: { role: string; content: unknown }[]
  tools: { name: string; description: string; input_schema: Record<string, unknown> }[]
}

/**
 * A client that answers with a scripted sequence of Anthropic messages and
 * records everything it was asked.
 *
 * The recording is half the evidence: what the model is SENT — the assembled
 * priming, the reminder, the tool schemas — is produced by the host and is
 * exactly the thing that silently rots. The last script step repeats, so a loop
 * that runs an extra iteration is a failed assertion rather than a crash.
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

// ── the transport ────────────────────────────────────────────────────────────

interface StreamEvent {
  kind: string
  content?: string
  meta?: Record<string, unknown>
}

/** Post one turn to an open session and collect the SSE frames, parsed. */
async function sendTurn(base: string, sessionId: string, text: string): Promise<StreamEvent[]> {
  const res = await fetch(`${base}api/ai/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, text }),
  })
  expect(res.status).toBe(200)
  expect(res.headers.get('content-type')).toContain('text/event-stream')
  const body = await res.text()
  return body
    .split('\n\n')
    .map((frame) => frame.trim())
    .filter((frame) => frame.startsWith('data:'))
    .map((frame) => JSON.parse(frame.slice(5).trim()) as StreamEvent)
}

/**
 * Open a site's session and run a turn in it — the browser's sequence, in one
 * call (REQ-127).
 *
 * The open is not ceremony to satisfy the origin: it is the ONLY place a site is
 * named, and every turn afterwards carries the id it returned. Doing both here
 * keeps each case reading as "the operator said this to that site" while still
 * exercising the real ordering `app.js` performs.
 */
async function turn(base: string, slug: string, text: string): Promise<StreamEvent[]> {
  const opened = await session(base, slug)
  return sendTurn(base, opened.sessionId, text)
}

async function session(base: string, slug: string) {
  const res = await fetch(`${base}api/ai/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug }),
  })
  expect(res.status).toBe(200)
  return res.json() as Promise<{
    sessionId: string
    turns: { role: string; markdown: string }[]
    ready: boolean
    error?: string
  }>
}

// ── the fixture ──────────────────────────────────────────────────────────────

let cwd: string
let builder: BuilderHandle
let base: string

beforeAll(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req122-host-'))
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
  // The draft is the evidence these cases read, and a turn REALLY writes it —
  // so it is restored per case rather than shared. Sessions go with it: a
  // conversation carried over from the previous case would make "this site has
  // no conversation yet" un-assertable.
  for (const slug of [SLUG, OTHER]) seedPage(cwd, slug)
  rmSync(sessionsDir({ cwd }), { recursive: true, force: true })
  resetAiHost()
})

afterEach(() => {
  setModelClient(null)
})

describe('REQ-122 — a turn changes the site', () => {
  it('test_UAT_FC_REQ-122_a_turn_that_calls_a_tool_changes_the_draft_and_streams_what_it_did', async () => {
    const client = scriptedClient([
      calls('set_l1', {
        page: 'home',
        path: HEADLINE_PATH,
        node: { kind: 'text', text: 'A new headline.', axes: { fontSizePx: 32 } },
      }),
      says('I changed the headline for you.'),
    ])
    setModelClient(client)

    const events = await turn(base, SLUG, 'Change the headline to "A new headline."')

    // The DRAFT is the evidence — not the stream. The tool ran the real
    // `editL1Set`, so the site on disk says what the user asked for.
    expect(headline(cwd, SLUG)).toBe('A new headline.')

    // …and the stream carries the tool activity the panel shows, then the prose,
    // then exactly one terminal `done`.
    const tool = events.find((e) => e.kind === 'tool_activity')
    expect(tool?.meta).toMatchObject({ event: 'tool_call', name: 'set_l1' })
    expect(events.filter((e) => e.kind === 'text').map((e) => e.content).join('')).toContain(
      'I changed the headline for you.',
    )
    expect(events.filter((e) => e.kind === 'done')).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-122_a_refused_call_comes_back_correctable_and_leaves_the_draft_alone', async () => {
    const client = scriptedClient([
      // An address that resolves to nothing — the mistake a model actually makes.
      calls('set_l1', { page: 'home', path: '9.9', node: { kind: 'text', text: 'Nowhere.' } }),
      says('Sorry — I could not find that.'),
    ])
    setModelClient(client)

    const events = await turn(base, SLUG, 'Change something that is not there')

    // Untouched: `editL1Set` refuses before it writes a byte.
    expect(headline(cwd, SLUG)).toBe(HEADLINE)

    // The refusal reaches the model as something it can act on within the turn —
    // a code and a stated correction, not "request failed".
    //
    // SINCE REQ-126 the per-call `path` and `hint` no longer reach the model: the
    // Toolbox renders the DECLARED meaning of the error class instead, so what
    // arrives is the taxonomy's sentence rather than the offending address. That
    // is a loss of specificity this project did not choose and has raised
    // upstream; the correctability the criterion is about — a named code plus
    // what to do next — still holds, and is what is asserted.
    const refusal = String(
      (events.find((e) => e.kind === 'tool_activity')?.meta as { output?: string })?.output,
    )
    expect(refusal).toContain('NOT_FOUND')
    expect(refusal).toMatch(/does not exist/i)
    expect(refusal).toMatch(/re-read/i)

    // And it was handed back into the SAME turn, not surfaced as an error.
    const second = client.seen[1]
    expect(JSON.stringify(second.messages)).toContain('NOT_FOUND')
  })
})

describe('REQ-122 — one session per site', () => {
  it('test_UAT_FC_REQ-122_the_conversation_persists_and_is_replayed_from_the_store', async () => {
    setModelClient(scriptedClient([says('Hello — what would you like to change?')]))
    await turn(base, SLUG, 'Hi there')

    // A fresh host — as after a restart — still finds the conversation, because
    // the session id is DERIVED from the slug rather than held in memory.
    resetAiHost()
    const opened = await session(base, SLUG)
    expect(opened.ready).toBe(true)
    expect(opened.turns.map((t) => t.role)).toEqual(['user', 'assistant'])
    expect(opened.turns[0].markdown).toBe('Hi there')
    expect(opened.turns[1].markdown).toContain('what would you like to change?')
  })

  it('test_UAT_FC_REQ-122_two_sites_are_two_conversations_over_two_tool_surfaces', async () => {
    setModelClient(
      scriptedClient([
        calls('set_l1', {
          page: 'home',
          path: HEADLINE_PATH,
          node: { kind: 'text', text: 'Annex news.' },
        }),
        says('Done.'),
      ]),
    )
    await turn(base, OTHER, 'Retitle the page')

    // The tools are bound to the site the turn named — and to no other. The model
    // never sent a slug, so it could not have got this wrong.
    expect(headline(cwd, OTHER)).toBe('Annex news.')
    expect(headline(cwd, SLUG)).toBe(HEADLINE)

    // Two conversations, not one: the other site's session is empty and its id
    // is its own.
    const annex = await session(base, OTHER)
    const studio = await session(base, SLUG)
    expect(annex.sessionId).not.toBe(studio.sessionId)
    expect(annex.turns).toHaveLength(2)
    expect(studio.turns).toHaveLength(0)
  })
})

describe('REQ-122 — what the model is told', () => {
  it('test_UAT_FC_REQ-122_the_model_is_primed_with_the_generated_manual_and_bound_to_this_site', async () => {
    const client = scriptedClient([says('Understood.')])
    setModelClient(client)
    await turn(base, SLUG, 'What can you do?')

    const { system, tools } = client.seen[0]

    // The priming carries the GENERATED manual, not a hand-written inventory —
    // so it cannot fall behind the tools it describes. Its headings are the
    // Toolbox's projection since REQ-126, which is why they are asserted by what
    // they say rather than by a literal this project chose.
    expect(system).toContain('# The site you look after')
    expect(system).toContain('## What you can do')
    expect(system).toContain('describe_page')
    // …including what deliberately has no tool, so the assistant can answer for
    // it rather than discover it by failing.
    expect(system).toContain('## Not available')

    // The per-turn reminder names the site, and rides the system channel rather
    // than the transcript.
    expect(system).toContain(`the site "${SLUG}"`)

    // The tool schemas the model receives are the declared ones, and no tool
    // takes a site: naming another site is not a mistake it can make.
    const names = tools.map((t) => t.name)
    expect(names).toContain('set_l1')
    expect(names).toContain('describe_page')
    for (const spec of tools) {
      expect(Object.keys(spec.input_schema.properties as object)).not.toContain('slug')
    }

    // No filesystem tool is offered. The forbidden list is enforced by absence
    // (DOC-8 §5.2), and this is what absence looks like from the model's side.
    for (const forbidden of ['Read', 'Write', 'Glob', 'Grep']) {
      expect(names).not.toContain(forbidden)
    }
  })

  it('test_UAT_FC_REQ-122_an_enum_reaches_the_model_as_a_sentence_it_can_act_on', async () => {
    const client = scriptedClient([says('Understood.')])
    setModelClient(client)
    await turn(base, SLUG, 'hello')

    // Every parameter description the model receives is COMPOSED — the declared
    // text plus whatever the schema constrains — so the two can never disagree
    // (DOC-8 §5.3). Assert the composition ran, on a real declared parameter.
    const setL1 = client.seen[0].tools.find((t) => t.name === 'set_l1')!
    const props = setL1.input_schema.properties as Record<string, { description: string }>
    expect(props.page.description).toBeTruthy()
    // The declared summary and the declared usage note arrive as one composed
    // description. Both halves are asserted, because a projection that dropped
    // either would still be truthy.
    expect(setL1.description).toContain('Replace one element')
    expect(setL1.description).toContain('read the element first')
  })
})

describe('REQ-122 — when the assistant cannot run', () => {
  it('test_UAT_FC_REQ-122_a_missing_api_key_is_explained_without_losing_the_conversation', async () => {
    // A real conversation first, through the injected client…
    setModelClient(scriptedClient([says('Noted.')]))
    await turn(base, SLUG, 'Remember this')

    // …then a host with no client and no key, which is a builder started without
    // ANTHROPIC_API_KEY.
    const key = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    setModelClient(null)
    try {
      const opened = await session(base, SLUG)

      // The failure is reported — and the history is NOT collateral damage.
      expect(opened.ready).toBe(false)
      expect(opened.error).toContain('ANTHROPIC_API_KEY')
      expect(opened.turns).toHaveLength(2)

      // The same answer from the capability route, so the panel can say so at
      // mount without opening a session at all.
      const status = await fetch(`${base}api/ai/roles`).then((r) => r.json())
      expect(status.ready).toBe(false)
      expect(status.roles).toContain('caretaker')
    } finally {
      if (key !== undefined) process.env.ANTHROPIC_API_KEY = key
    }
  })

  it('test_UAT_FC_REQ-122_a_failure_mid_turn_arrives_in_the_stream_rather_than_stopping_it', async () => {
    setModelClient({
      messages: {
        create: async () => {
          throw new Error('the model is unreachable')
        },
      },
    })

    const events = await turn(base, SLUG, 'anything')

    // The headers went out long before the model could fail, so a status code is
    // not available to say so. The panel is released by the terminal `done`, and
    // told why in prose it can render.
    expect(events.filter((e) => e.kind === 'done')).toHaveLength(1)
    expect(events.map((e) => e.content).join('')).toContain('the model is unreachable')
  })
})
