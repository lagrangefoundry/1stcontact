import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { startBuilder, type BuilderHandle } from '../tools/generate/src/cli/builder'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host'
import { cmdNew } from '../tools/generate/src/cli/commands'
import type { L1Node } from '@1stcontact/site-schema'
import { calls, says, scriptedClient } from './support/scripted-model-client'

/**
 * **The turn tells the page when the site moved** (story-a58a0974 — BUG-43).
 *
 * `draft` and `edit` render at request time (REQ-119), so a write reaches the
 * operator's frame only when something reloads it. The palette popup and the
 * segment editor both do; the assistant did not, so its edits sat in the store —
 * correct, and invisible. The turn stream now carries the host's own change
 * signal, derived from the site's draft change counter.
 *
 * WHAT MAKES THIS EVIDENCE. Every case below drives real HTTP against a real
 * `startBuilder`: real session manager, real role assembly, real tool loop, real
 * tool handlers, real `edit.ts` writes against the filesystem store, real SSE.
 * ONE thing is a double — the Anthropic client — because it is the network, and
 * it is the seam the AI library's backend is written to have injected. So the
 * signals asserted here are produced by real writes, and the counter they carry
 * is the counter those writes moved.
 *
 * WHY THE ORDER IS ASSERTED AND NOT JUST THE COUNT. One signal per turn would
 * satisfy "the page updates" and still lose the thing the intent asked for: a
 * request answered by several edits should show the page unfolding as the
 * assistant works rather than jumping to a finished state when it stops talking.
 * That is a property of WHERE the frames sit in the stream, so it is asserted as
 * an order.
 */

/** The address of the page's one text run: root list index, then child index. */
const HEADLINE_PATH = '0.0'
const HEADLINE = 'The old headline.'

/** A page with one addressable text run, so a write has somewhere to land. */
function seedPage(cwd: string, slug: string): void {
  const file = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(file, 'utf8'))
  home.l1.root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'text', text: HEADLINE, axes: { fontSizePx: 32 } }],
  } satisfies L1Node
  home.modules = []
  writeFileSync(file, JSON.stringify(home, null, 2))
}

function headline(cwd: string, slug: string): string {
  const file = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  return JSON.parse(readFileSync(file, 'utf8')).l1.root.children[0].text
}

/** Rename the headline — the one-write turn these cases use. */
const renames = (to: string) =>
  calls('set_l1', {
    page: 'home',
    path: HEADLINE_PATH,
    node: { kind: 'text', text: to, axes: { fontSizePx: 32 } },
  })

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

function post(base: string, route: string, body: unknown): Promise<Response> {
  return fetch(`${base}api/ai/${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** Open a site's conversation — the ONLY call that names a site. */
async function open(base: string, slug: string): Promise<string> {
  const res = await post(base, 'session', { slug })
  expect(res.status).toBe(200)
  const opened = (await res.json()) as { sessionId: string; ready: boolean }
  expect(opened.ready).toBe(true)
  return opened.sessionId
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
  return turn(base, await open(base, slug), text)
}

function signals(events: StreamEvent[]): StreamEvent[] {
  return events.filter((event) => event.kind === 'site_changed')
}

// ── the fixture ──────────────────────────────────────────────────────────────

// A slug per case, created fresh, so the draft change counter each case reads
// starts where a new site's does and the absolute values below mean something.
const SLUGS = {
  ac1054: 'signal-one-write',
  ac1817: 'signal-unfolds',
  ac1817Quiet: 'signal-read-only',
  ac1817Silent: 'signal-no-tools',
  ac1818: 'signal-not-a-tool',
  ac1818Quiet: 'signal-claimed-not-made',
} as const

let cwd: string
let builder: BuilderHandle
let base: string

beforeAll(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'bug43-site-changed-'))
  for (const slug of Object.values(SLUGS)) {
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

afterEach(() => {
  setModelClient(null)
  resetAiHost()
})

// ── what a turn streams ──────────────────────────────────────────────────────

describe('a turn that changes the site says so where the change happened', () => {
  /**
   * AC-1054 — the enumeration of what a turn carries, with the change signal now
   * among it. The draft, not the stream, is what the change IS; the signal only
   * says that the draft moved, and says it where the move happened rather than in
   * a summary once the assistant has stopped talking.
   */
  it('test_UAT_AC1054_a_site_changing_turn_streams_activity_a_signal_its_words_and_one_completion', async () => {
    const slug = SLUGS.ac1054
    setModelClient(
      scriptedClient([renames('A new headline.'), says('Done — the headline now reads that.')]),
    )

    const events = await speak(base, slug, 'Change the headline to "A new headline."')

    // The DRAFT is the evidence: the tool ran the real `editL1Set`, so the site
    // on disk says what the operator asked for.
    expect(headline(cwd, slug)).toBe('A new headline.')

    // …and the stream said what it did, in the order it happened: the activity
    // naming the operation, the signal that the draft moved, the assistant's own
    // words, and exactly one completion that releases the caller.
    expect(events.map((event) => event.kind)).toEqual([
      'tool_activity',
      'site_changed',
      'text',
      'done',
    ])
    expect(events[0].meta).toMatchObject({ event: 'tool_call', name: 'set_l1' })
    expect(
      events
        .filter((event) => event.kind === 'text')
        .map((event) => event.content)
        .join(''),
    ).toContain('headline')
    expect(events.filter((event) => event.kind === 'done')).toHaveLength(1)
    expect(events.at(-1)?.kind).toBe('done')
  })

  /**
   * AC-1817 — per-write placement, which is the whole of what BUG-43 asked for.
   * Three turns, because the criterion is three claims: several edits produce
   * several signals spaced where they happened; a turn whose operations move
   * nothing produces none; a turn with no operation at all produces none.
   */
  it('test_UAT_AC1817_each_write_is_announced_where_it_happened_and_a_turn_that_moves_nothing_is_silent', async () => {
    const slug = SLUGS.ac1817

    // Two writes in one turn — the case a per-turn signal would collapse.
    setModelClient(
      scriptedClient([
        calls('add_page', { page: 'services', title: 'Services' }),
        calls('add_page', { page: 'contact', title: 'Contact' }),
        says('I added both pages.'),
      ]),
    )

    const events = await speak(base, slug, 'Add a services page and a contact page.')

    // THE ORDER IS THE ASSERTION. Each write is announced straight after the
    // activity that caused it and before whatever the assistant does next, so a
    // pane acting on the signal unfolds the page twice rather than once at the end.
    expect(events.map((event) => event.kind)).toEqual([
      'tool_activity',
      'site_changed',
      'tool_activity',
      'site_changed',
      'text',
      'done',
    ])

    // Each carries the draft's count as it stood at that moment, and how many
    // changes have landed since the previous signal in this same turn — which is
    // what makes the signal a fact about the store rather than a note from the
    // model.
    expect(signals(events).map((event) => event.meta)).toEqual([
      { at: 1, changes: 1 },
      { at: 2, changes: 1 },
    ])

    // What a signal announces is real at the moment it is announced: both pages
    // render out of the draft, so anything re-fetched on the strength of the
    // signal is the site the operator was told about.
    for (const [page, title] of [
      ['services', 'Services'],
      ['contact', 'Contact'],
    ]) {
      const rendered = await fetch(`${base}preview/${slug}/draft/${page}`)
      expect(rendered.status).toBe(200)
      expect(await rendered.text()).toContain(`<title>${title}`)
    }

    // A turn answered from a READ tool: there is activity, and no signal — the
    // operator is looking at a page that has not moved, and reloading it would
    // throw away their scroll position to show them identical bytes.
    setModelClient(scriptedClient([calls('list_pages', {}), says('You have one page: home.')]))
    const readOnly = await speak(base, SLUGS.ac1817Quiet, 'What pages do I have?')
    expect(readOnly.some((event) => event.kind === 'tool_activity')).toBe(true)
    expect(signals(readOnly)).toEqual([])

    // And a turn in which the assistant only speaks: its text and the completion,
    // nothing else. The counter is re-read only after tool activity, so a
    // conversational turn pays nothing for a signal it could not produce.
    setModelClient(scriptedClient([says('Hello — what would you like to change?')]))
    const spoken = await speak(base, SLUGS.ac1817Silent, 'Hello')
    expect(spoken.map((event) => event.kind)).toEqual(['text', 'done'])
  })

  /**
   * AC-1818 — the signal is the HOST's, not a capability the model may skip.
   *
   * A declared operation was the available alternative and was rejected: a tool
   * is something the model can decline to call, and the turns it would decline it
   * on are the long ones — exactly the turns where watching the page unfold
   * matters most. So the property is asserted from both sides: a write is
   * announced by an assistant that never mentions it, and an assistant that
   * claims a change its operations never made announces nothing.
   */
  it('test_UAT_AC1818_the_signal_is_the_hosts_own_and_no_offered_operation_can_make_or_fake_one', async () => {
    const slug = SLUGS.ac1818

    // A turn that writes and then says nothing whatever about having done so.
    const client = scriptedClient([renames('Quietly changed.'), says('Anything else?')])
    setModelClient(client)

    const events = await speak(base, slug, 'Change the headline to "Quietly changed."')

    // Nothing in the conversation announces the change…
    const spoken = events
      .filter((event) => event.kind === 'text')
      .map((event) => event.content)
      .join('')
    expect(spoken).toBe('Anything else?')

    // …and the signal is carried anyway, because it follows the draft's counter.
    expect(headline(cwd, slug)).toBe('Quietly changed.')
    expect(signals(events).map((event) => event.meta)).toEqual([{ at: 1, changes: 1 }])

    // None of the operations the conversation offered can produce it: there is no
    // operation that announces a change, refreshes a view or reloads anything, so
    // the assistant has nothing to call, skip, or call falsely.
    const offered = client.seen[0].tools.map((tool) => tool.name)
    expect(offered.length).toBeGreaterThan(0)
    expect(offered).toContain('set_l1')
    expect(offered).not.toContain('site_changed')
    const announcing = offered.filter((name) =>
      /reload|refresh|announce|notify|signal|changed/i.test(name),
    )
    expect(announcing).toEqual([])

    // The other side of the same property: an assistant that SAYS it changed
    // something while its operations wrote nothing produces no signal, because
    // the signal follows the count and not the conversation.
    const quiet = SLUGS.ac1818Quiet
    setModelClient(scriptedClient([says('I have updated the headline for you.')]))
    const claimed = await speak(base, quiet, 'Change the headline')

    expect(
      claimed
        .filter((event) => event.kind === 'text')
        .map((event) => event.content)
        .join(''),
    ).toContain('updated the headline')
    expect(signals(claimed)).toEqual([])
    expect(headline(cwd, quiet)).toBe(HEADLINE)
  })
})
