import { afterEach, beforeAll, afterAll, describe, expect, it } from 'vitest'
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
import primingDocument from '../tools/generate/src/cli/ai/priming.json'
import {
  says,
  scriptedClient,
  systemText,
  turnTailText,
  type ModelRequest,
} from './support/scripted-model-client'

/**
 * REQ-283 — **the other half: a host with nowhere to keep a record**.
 *
 * THE RULE THIS PROTECTS is the one the whole ticket turns on: *"a session must
 * still never be told about a capability it was not granted, so the tier and the
 * grant land together or not at all."* The Worker suite asserts they landed
 * together. This asserts the other direction, which is the one that rots quietly:
 * the `1c` CLI archives to a FILE, has no ticket store, passes no ledger, and must
 * therefore be told none of it and offered none of it.
 *
 * THAT IS NOT A DEGRADED MODE, it is an honest capability difference. There is
 * nowhere on a laptop for a `chat` ticket to go, so there is no standing note, no
 * engagement ledger, and no session a ticket could name. The consultant edits
 * sites exactly as it did before this ticket.
 *
 * WHY THIS RUNS THROUGH THE REAL HOST rather than over the providers directly.
 * The claim is about what reaches the MODEL, and the adopted product tier renders
 * per entry through the real assembly — so a test that called a provider would
 * prove a function returns `null` and say nothing about whether the session was
 * told. `openSession` / `streamPrompt` with a scripted client is the same bargain
 * every other chat-host suite strikes, minus the HTTP.
 */

let cwd: string
let ai: Record<string, unknown>

const SLUG = 'req283'

/**
 * The host as `1c` wires it: a filesystem store, a null archive, an in-memory
 * junction, and — the point of the case — **no ledger**.
 */
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

/** One turn, and what the model was sent for it. */
async function turn(text: string): Promise<ModelRequest> {
  const client = scriptedClient([says('Right you are.')])
  setModelClient(client)
  const opened = await openSession(SLUG, { cwd }, deps())
  expect(opened.ready).toBe(true)
  for await (const _event of streamPrompt(opened.sessionId, text, { cwd }, deps())) {
    // Drained rather than collected: the evidence is the request, not the reply.
  }
  expect(client.seen.length).toBeGreaterThan(0)
  return client.seen[0]
}

/** Everything the model was told — priming, reminder and seed. */
const told = (req: ModelRequest): string => `${systemText(req)}\n${turnTailText(req)}`

beforeAll(async () => {
  ai = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as Record<string, unknown>
  cwd = mkdtempSync(path.join(tmpdir(), 'req283-'))
  cmdNew(SLUG, { cwd })
}, 180000)

afterAll(() => {
  rmSync(cwd, { recursive: true, force: true })
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
})

describe('REQ-283 — a host with no record is told none of it', () => {
  it('test_UAT_FC_REQ-283_the_product_tier_is_adopted_and_renders_nothing_here', async () => {
    // ADOPTED WHOLE AND GATED BY THE PROVIDERS, not by a branch. The shipped
    // mapping is loaded on both hosts — so there is one tier, not one per
    // runtime — and every entry in it renders `null` when the fact it states is
    // not true of this session. A tier that had to be conditionally loaded would
    // put the decision in two places and let them disagree.
    const read = told(await turn('Hello.'))

    // No pointer at a transcript: this session is homed in no ticket, so there
    // is nothing to address by turn id.
    expect(read).not.toContain('Reaching the rest of this conversation')
    // No record, because there is nowhere to keep one.
    expect(read).not.toContain('Your record of this engagement')
    // And no note about a tool transcript, which is declined on every host.
    expect(read).not.toContain('recorded separately from the conversation')
  })

  it('test_UAT_FC_REQ-283_it_is_not_nudged_to_keep_a_record_it_cannot_write', async () => {
    // THE NUDGE IS WHAT MAKES THE RECORD GET WRITTEN, so it is bound to the same
    // question the record is: with no ledger the reminder entry renders `null`
    // and the framework drops the entry and its separator with it. A session told
    // every turn to keep a note it has no verb for would be the exact failure this
    // ticket's rule names.
    const reminder = turnTailText(await turn('Hello.'))

    expect(reminder).not.toContain('Keep your record current as you work')
    // The reminders it DOES get are unchanged, so this is an absence rather than
    // a broken tier.
    expect(reminder).toContain('Do not name framework concepts to your client')
  })

  it('test_UAT_FC_REQ-283_it_is_offered_neither_the_record_nor_the_reads_on_itself', async () => {
    // BOTH SURFACES ARE COMPOSED ON THE SAME QUESTION. The agent surface
    // addresses a session by the ticket that homes it, and a file archive homes
    // nothing — so a composed one would answer `no_addressing` to every call.
    // `createL1Toolbox` narrows a grant away where its surface was never
    // composed, which is what lets this host start an assistant that edits sites
    // perfectly well.
    const offered = (await turn('Hello.')).tools.map((t) => t.name)

    expect(offered).not.toContain('set_standing_note')
    expect(offered).not.toContain('record_decision')
    expect(offered).not.toContain('AgentHistory')
    expect(offered).not.toContain('AgentPriming')
    // It still has the surface it was always given.
    expect(offered).toContain('list_pages')
  })

  it('test_UAT_FC_REQ-283_the_reminder_tier_names_the_trigger_for_both_hosts', async () => {
    // ONE DECLARED ORDER, NOT ONE PER RUNTIME. The entry is in the shared
    // reminder tier and the provider is registered on every host — rendering
    // nothing where there is no record — because a second reminder list would be
    // a second place for the two hosts' prose to drift, which is precisely what
    // `priming.json` exists to prevent.
    const names = (primingDocument.reminders as Array<{ name?: string; provider?: string }>).map(
      (entry) => entry.provider,
    )
    expect(names).toContain('memory.trigger')
  })
})
