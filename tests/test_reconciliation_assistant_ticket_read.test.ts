import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { startBuilder, type BuilderHandle } from '../tools/generate/src/cli/builder'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host'
import { cmdNew } from '../tools/generate/src/cli/commands'
import type { L1Node } from '@1stcontact/site-schema'
import * as ticketBridge from '../apps/control-app/src/generated/ai-ticketing.js'
import { calls, says, scriptedClient, type ModelRequest } from './support/scripted-model-client'

/**
 * story-a58a0974 — AC-2587, the command-line half: **where there is no ticket
 * store (`1c`), no ticket surface is offered and the session works normally.**
 * (The deployed-host half is in `test_reconciliation_assistant_ticket_read.workers.test.ts`.)
 *
 * Real `startBuilder` origin, real host, real tool loop and real `edit.ts`
 * writes; the Anthropic client is the one double. The ticket tool names are read
 * off the shipped ticket surface's own declaration, so a renamed operation cannot
 * make this pass by no longer being looked for.
 */

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const bridge = ticketBridge as unknown as Untyped
const TICKET_TOOLS: string[] = (bridge.DECLARATION as { operations: { tool: string }[] }).operations.map(
  (o) => o.tool,
)

const SLUG = 'ac2587-cli'
const HEADLINE = 'The old headline.'

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

interface StreamEvent {
  kind: string
  content?: string
  meta?: Record<string, unknown>
}

async function open(base: string, slug: string) {
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

async function sendTurn(base: string, sessionId: string, text: string): Promise<StreamEvent[]> {
  const res = await fetch(`${base}api/ai/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, text }),
  })
  expect(res.status).toBe(200)
  return (await res.text())
    .split('\n\n')
    .map((frame) => frame.trim())
    .filter((frame) => frame.startsWith('data:'))
    .map((frame) => JSON.parse(frame.slice(5).trim()) as StreamEvent)
}

function systemOf(req: ModelRequest): string {
  const s = req.system
  return typeof s === 'string' ? s : s.map((block) => block.text ?? '').join('\n')
}

let cwd: string
let builder: BuilderHandle

beforeAll(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'ac2587-cli-'))
  cmdNew(SLUG, { cwd })
  seedPage(cwd, SLUG)
  resetAiHost()
  builder = await startBuilder({ cwd })
}, 180000)

afterAll(async () => {
  await builder.close()
  rmSync(cwd, { recursive: true, force: true })
})

afterEach(() => {
  setModelClient(null)
})

describe('AC-2587 — no ticket store, no ticket surface', () => {
  it('test_UAT_AC2587_cli_host_offers_no_ticket_tool_and_still_opens_replays_and_edits_the_site', async () => {
    expect(TICKET_TOOLS.length).toBeGreaterThan(0)

    // The model client is the network double; with it injected the host is runnable.
    const client = scriptedClient([
      calls('set_l1', {
        page: 'home',
        path: '0.0',
        node: { kind: 'text', text: 'A new headline.', axes: { fontSizePx: 32 } },
      }),
      says('I changed the headline.'),
    ])
    setModelClient(client)

    const opened = await open(builder.url, SLUG)
    expect(opened.ready, opened.error).toBe(true)
    expect(opened.turns).toEqual([])

    const events = await sendTurn(builder.url, opened.sessionId, 'Change the headline to "A new headline."')

    // THE TURN RAN AND EDITED THE SITE, exactly as without a ticket surface in question.
    expect(events.filter((e) => e.kind === 'done')).toHaveLength(1)
    expect(headline(cwd, SLUG)).toBe('A new headline.')

    // NO TICKET OPERATION among the offered tools, read or write…
    const offered = client.seen[0].tools.map((t) => t.name)
    expect(offered).toContain('set_l1')
    for (const tool of TICKET_TOOLS) expect(offered).not.toContain(tool)
    // …nor in the tool guide the session was primed with.
    const primed = systemOf(client.seen[0])
    for (const tool of TICKET_TOOLS) expect(primed).not.toContain(tool)

    // THE CONVERSATION REPLAYS on reopen.
    setModelClient(scriptedClient([says('unused')]))
    const again = await open(builder.url, SLUG)
    expect(again.ready, again.error).toBe(true)
    expect(again.sessionId).toBe(opened.sessionId)
    expect(again.turns.map((t) => t.role)).toEqual(['user', 'assistant'])
    expect(again.turns[0].markdown).toContain('A new headline.')
  })
})
