import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew } from '../tools/generate/src/cli/commands'
import {
  openSession,
  resetAiHost,
  sessionsDir,
  setModelClient,
  streamPrompt,
} from '../tools/generate/src/cli/ai/host'
import { calls, says, scriptedClient } from './support/scripted-model-client'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * BUG-39 — **the model double speaks the contract the backend consumes, and it
 * is written down once**.
 *
 * WHAT WENT WRONG. The Anthropic client is the one thing a chat-host suite is
 * allowed to fake, so every such suite carries a transcription of the provider's
 * wire protocol. There were four. The backend moved to `stream: true` and its
 * accumulator started reading the provider's block events; the workerd suite was
 * written afterwards and followed, and three Node suites kept handing back a
 * finished `{content: [...]}` message the accumulator never looks at. Their
 * turns therefore completed having seen no text and no tool call — fifteen
 * assertions failing on the assistant's half of a turn simply not existing.
 *
 * A test that repairs those suites proves they pass today. It does not stop the
 * next protocol change splitting them again, which is the actual defect. So the
 * two cases below are the two halves of "it cannot drift again": the double
 * really is consumed by the real backend, and there is only one of it.
 */

const SLUG = 'contract'
const HEADLINE = 'The old headline.'
const HEADLINE_PATH = '0.0'

let cwd: string

function seedPage(): void {
  const homePath = path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', 'home.json')
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

function headline(): string {
  const home = JSON.parse(
    readFileSync(path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', 'home.json'), 'utf8'),
  )
  return home.l1.root.children[0].text
}

describe('BUG-39 — the shared model double', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'bug39-double-'))
    cmdNew(SLUG, { cwd })
    seedPage()
    rmSync(sessionsDir({ cwd }), { recursive: true, force: true })
    resetAiHost()
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_BUG-39_the_shared_double_is_consumed_by_the_real_backend', async () => {
    // Both halves of what a model can say, through the REAL host — real session
    // manager, real tool loop, real `edit.ts` write. Only the client is a double.
    //
    // This is the assertion the broken suites could not make. Under the
    // pre-streaming shape everything here still RAN: the route answered, the
    // stream framed, a `done` arrived. What was missing is exactly what is
    // asserted — prose that came from the model, and a tool call that reached a
    // handler and changed the site.
    const client = scriptedClient([
      calls('set_l1', {
        page: 'home',
        path: HEADLINE_PATH,
        node: { kind: 'text', text: 'A new headline.', axes: { fontSizePx: 32 } },
      }),
      says('I changed the headline for you.'),
    ])
    setModelClient(client)

    const { sessionId } = await openSession(SLUG, { cwd })
    const events: { kind: string; content: string; meta?: Record<string, unknown> }[] = []
    for await (const event of streamPrompt(sessionId, 'Change the headline', { cwd })) {
      events.push(event)
    }

    // The tool arguments survived the wire's fragmentation: they arrived as
    // `input_json_delta` partial JSON and were parsed at `content_block_stop`,
    // and the site on disk says so.
    expect(headline()).toBe('A new headline.')
    expect(events.find((e) => e.kind === 'tool_activity')?.meta).toMatchObject({
      event: 'tool_call',
      name: 'set_l1',
    })

    // The prose reached the consumer as deltas, and the turn closed once.
    expect(
      events
        .filter((e) => e.kind === 'text')
        .map((e) => e.content)
        .join(''),
    ).toContain('I changed the headline for you.')
    expect(events.filter((e) => e.kind === 'done')).toHaveLength(1)

    // Two model calls, not one — the tool result went back in and was answered,
    // which is the loop the double exists to drive.
    expect(client.seen).toHaveLength(2)
    expect(JSON.stringify(client.seen[1].messages)).toContain('set_l1')
  })

  it('test_UAT_FC_BUG-39_the_wire_protocol_is_transcribed_in_exactly_one_place', async () => {
    // The drift guard. A suite that writes the provider's block events itself is
    // a second copy of a contract that lives upstream, and the next change to it
    // will update whichever copies its author happens to find.
    const dir = path.join(process.cwd(), 'tests')
    const files = readdirSync(dir, { recursive: true })
      .map(String)
      .filter((f) => f.endsWith('.ts'))

    // Assembled rather than written, so this file does not match itself and
    // report a copy that is only the description of the rule.
    const marker = ['content', 'block', 'start'].join('_')
    const transcribers = files.filter((f) =>
      readFileSync(path.join(dir, f), 'utf8').includes(marker),
    )
    expect(transcribers).toEqual(['support/scripted-model-client.ts'])

    // …and nothing has drifted BACK to the pre-streaming shape, which is the
    // specific mistake this bug was: a double that hands the backend a finished
    // message it never reads.
    const preStreaming = files.filter((f) => {
      const source = readFileSync(path.join(dir, f), 'utf8')
      return (
        source.includes('setModelClient') &&
        /content:\s*\[\{\s*type:\s*'(text|tool_use)'/.test(source)
      )
    })
    expect(preStreaming).toEqual([])
  })
})
