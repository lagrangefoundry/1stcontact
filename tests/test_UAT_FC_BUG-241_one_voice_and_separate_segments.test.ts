import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { fsSiteStore } from '../tools/generate/src/store'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import {
  openSession,
  resetAiHost,
  setModelClient,
  streamPrompt,
  type HostDeps,
} from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { continuationCue, layoutContinuationCue } from '../tools/generate/src/cli/ai/roles'
import priming from '../tools/generate/src/cli/ai/priming.json'
import {
  calls,
  says,
  scriptedClient,
  systemText,
  turnTailText,
  type ModelStep,
} from './support/scripted-model-client'

/**
 * BUG-241 — the client hears one person, in one voice, with every segment of a
 * reply starting its own paragraph.
 *
 * THROUGH THE REAL HOST, as the other chat-host suites are: `openSession` /
 * `streamPrompt`, the real manager, tool loop and `ClaudeAPIBackend`. Only the
 * Anthropic client is scripted, because it is the network.
 */

let cwd: string
let ai: Record<string, unknown>

const CALLS = backendsDocument.claude.max_iterations
const BOLD = '**Are you happy to call colours and lettering done, or does anything still feel off?**'

function deps(): HostDeps {
  const lib = ai as { NullArchive: new () => unknown; memoryJunctions: () => unknown }
  return {
    lib: ai as HostDeps['lib'],
    store: fsSiteStore(ctxOf({ cwd })),
    archive: new lib.NullArchive(),
    junctions: lib.memoryJunctions(),
    audit: null,
    apiKey: 'test-key-not-a-real-one',
  }
}

/** Prose and then a tool call, in ONE model message — the live shape of "I'll check, then…". */
const saysThenCalls =
  (text: string, name: string, input: Record<string, unknown>): ModelStep =>
  (req) => [
    ...says(text)(req),
    ...calls(name, input)(req).map((e) => ({ ...e, index: 1 })),
  ]

/** One client message, drained: the text the client's live bubble accumulates. */
async function message(host: HostDeps, sessionId: string, text: string): Promise<string> {
  let prose = ''
  for await (const event of streamPrompt(sessionId, text, { cwd }, host)) {
    if (event.kind === 'text') prose += event.content
  }
  return prose
}

beforeAll(async () => {
  ai = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as Record<string, unknown>
  cwd = mkdtempSync(path.join(tmpdir(), 'bug241-'))
}, 180000)

afterAll(() => {
  rmSync(cwd, { recursive: true, force: true })
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
})

let sites = 0
async function freshSession(host: HostDeps): Promise<{ slug: string; sessionId: string }> {
  const slug = `bug241-${++sites}`
  cmdNew(slug, { cwd })
  return { slug, sessionId: (await openSession(slug, { cwd }, host)).sessionId }
}

describe('BUG-241 — separate segments, one voice', () => {
  it('test_UAT_FC_BUG-241_prose_after_a_tool_call_starts_a_new_paragraph_live_and_on_reload', async () => {
    setModelClient(
      scriptedClient([saysThenCalls(BOLD, 'list_pages', {}), says('Bob, I checked the page on a computer and a phone.')]),
    )
    const host = deps()
    const { slug, sessionId } = await freshSession(host)
    const live = await message(host, sessionId, 'How are the colours?')

    // THE CLOSING `**` IS FOLLOWED BY A BLANK LINE, never by a letter.
    expect(live).toContain(`${BOLD}\n\nBob, I checked`)
    expect(live).not.toContain('?**Bob')

    // AND THE TRANSCRIPT A RELOAD REPLAYS SAYS THE SAME.
    const reopened = await openSession(slug, { cwd }, host)
    const replay = reopened.turns.filter((t) => t.role === 'assistant').map((t) => t.markdown).join('\n\n')
    expect(replay).toContain(`${BOLD}\n\nBob, I checked`)
  }, 120000)

  it('test_UAT_FC_BUG-241_a_round_the_host_continues_starts_a_new_paragraph_in_the_same_bubble', async () => {
    let n = 0
    setModelClient(
      scriptedClient([() => (n++ < CALLS ? calls('list_pages', {}) : says('Done: every page checks out.'))({} as never)]),
    )
    const host = deps()
    const { sessionId } = await freshSession(host)
    const live = await message(host, sessionId, 'Build my first draft.')

    // The first round ends on its narration; the continuation's first words open a paragraph.
    expect(live).toContain('Carrying on from here.')
    expect(live).toMatch(/Carrying on from here\.\n\nDone: every page checks out\./)
  }, 180000)

  it('test_UAT_FC_BUG-241_the_consultant_is_told_what_its_client_hears_and_how_bc_works', async () => {
    const client = scriptedClient([says('Hello.')])
    setModelClient(client)
    const host = deps()
    const { sessionId } = await freshSession(host)
    await message(host, sessionId, 'Hello.')
    const system = systemText(client.seen[0])
    const tail = turnTailText(client.seen[0])

    // THE VOCABULARY TABLE.
    expect(system).toContain('## What your client hears')
    expect(system).toContain('To your client you are one person doing all the work.')
    expect(system).toContain('| "a builder is adding…", "the worker…" | "I\'m adding…" |')
    expect(system).toContain('| "the layout check found…" | "I checked the page on a computer and a phone, and…" |')
    expect(system).toContain('"something on our side isn\'t working yet; we\'re fixing it"')
    expect(system).toContain('ReportBug')
    expect(system).toContain('"Colours & fonts", "Finishing touches"')
    // BOTH `bc` RULES: answering out of character, and opening a note only once bc was used.
    expect(system).toContain('## Out of character: bc')
    expect(system).toContain('begins with `bc:`, or with `bc` as its first word')
    expect(system).toContain('In a conversation where `bc` has not\nbeen used, you never do this.')

    // THE OLD ONE-LINER IS GONE; THE SHORT REMINDER POINTS AT THE SECTION.
    expect(tail).not.toContain('Do not name framework concepts')
    expect(tail).toContain('One person to the client, naming none of our machinery: “What your client hears”.')
    expect(JSON.stringify(priming.reminders)).not.toContain('no-framework-vocabulary')
  }, 120000)

  it('test_UAT_FC_BUG-241_host_cues_are_guidance_and_do_not_teach_internal_words', () => {
    const cues = [continuationCue(), layoutContinuationCue(['home: the hero heading overflows at phone width.'])]
    for (const cue of cues) {
      expect(cue).toContain('guidance for you, not words for them')
      expect(cue).not.toMatch(/\ba builder\b|\bthe layout check\b|\btalker\b|BUG-\d+/i)
    }
    expect(cues[1]).toContain('the build you started')
    expect(cues[1]).toContain('checking the page on a computer and a phone')
  })
})
