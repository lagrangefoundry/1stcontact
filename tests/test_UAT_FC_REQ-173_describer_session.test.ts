/**
 * REQ-173 — **the digest is written by a lightweight session, not a second SDK path**.
 *
 * WHY THIS IS A CLAIM AND NOT AN IMPLEMENTATION DETAIL. `describe.ts` already
 * reaches the Messages API directly for images, and says at length why that is
 * accepted: the AI host's Worker surface carries no image content block, so a
 * photograph genuinely cannot be described through the host this Worker already
 * runs. A document digest has no such excuse — it is text in and text out — so
 * taking the same shortcut would turn a stated, temporary exception into the way
 * this codebase talks to a model. It goes through the session factory instead.
 *
 * WHAT A "LIGHTWEIGHT" SESSION IS, and each half is asserted below:
 *
 *   - **No tools.** A describer given a toolbox could write to the client's site.
 *   - **No corpus and no priming.** The document is the whole context.
 *   - **A `NullArchive`.** The load-bearing one: `TicketSessionArchive` homes a
 *     session in a `chat` ticket, so an archiving describer would create one chat
 *     ticket per upload — members of the very corpus this ticket is cleaning up.
 *   - **A session per document, closed after it.** Two documents share no
 *     context; carrying one into the other's turn would let the first colour the
 *     second's description, which is a failure with no symptom.
 *
 * ONE DOUBLE, AND IT IS THE NETWORK. `scriptedClient` is the seam the AI
 * library's own backend is written to have injected (BUG-39), and everything on
 * this side of it — the session manager, the role assembly, the junction, the
 * archive — is the real thing. The recording half is the evidence that matters:
 * what the model is SENT is produced by the host and is exactly what silently
 * rots.
 */

import { describe as suite, expect, it } from 'vitest'
import { sessionTextDescriber } from '../apps/control-app/src/ai'
import { DOCUMENT_DIGEST_SYSTEM } from '../apps/control-app/src/describe'
import { says, scriptedClient } from './support/scripted-model-client'

suite('REQ-173 — the document describer is a session on the AI host', () => {
  it('test_UAT_FC_REQ_173_the_digest_comes_back_from_a_session_prompted_with_the_document', async () => {
    const client = scriptedClient([says('A bakery supplier handbook from 2023.')])
    const describe = sessionTextDescriber('sk-not-a-real-key', { client })

    const answer = await describe('The stoneground rye comes from Bennett Mill.')

    expect(answer.text).toContain('supplier handbook')
    // The model id is reported so `description_model` names whoever wrote the
    // body — a re-describe pass selects on it.
    expect(answer.model).toBeTruthy()

    // ONE CALL PER DOCUMENT. The digest is one turn; a tool loop would be two or
    // more, and there is nothing here for it to loop over.
    expect(client.seen).toHaveLength(1)
    // THE DOCUMENT IS WHAT WAS SENT, verbatim, as the user turn.
    expect(JSON.stringify(client.seen[0].messages)).toContain('Bennett Mill')
  })

  it('test_UAT_FC_REQ_173_the_describer_is_primed_with_the_digest_prompt_and_nothing_else', async () => {
    const client = scriptedClient([says('A note.')])
    await sessionTextDescriber('sk-not-a-real-key', { client })('Some text.')

    const system = client.seen[0].system
    // THE PROMPT `describe.ts` OWNS. The two prompts this product sends about
    // material live next to each other, in the file that decides what a
    // description IS — so the role is built from that constant rather than from a
    // second copy of it here.
    expect(system).toContain(DOCUMENT_DIGEST_SYSTEM)
    // NO CORPUS AND NO MANUAL. The consultant session's priming is the landscape
    // plus the toolbox manual; a describer primed with either would spend a large
    // prompt learning about material it is not being asked about.
    expect(system).not.toMatch(/landscape/i)
    expect(system).not.toMatch(/knowledge base/i)
  })

  it('test_UAT_FC_REQ_173_the_describer_is_offered_no_tools', async () => {
    const client = scriptedClient([says('A note.')])
    await sessionTextDescriber('sk-not-a-real-key', { client })('Some text.')

    // A DESCRIBER WITH A TOOLBOX COULD WRITE TO THE CLIENT'S SITE. Nothing about
    // summarising a document calls for that authority, and an authority granted
    // because it was convenient is the one nobody reviews.
    expect(client.seen[0].tools ?? []).toEqual([])
  })

  it('test_UAT_FC_REQ_173_two_documents_do_not_share_a_conversation', async () => {
    const client = scriptedClient([says('First.'), says('Second.')])
    const describe = sessionTextDescriber('sk-not-a-real-key', { client })

    await describe('The rye comes from Bennett Mill.')
    await describe('The oats come from Calder Farm.')

    expect(client.seen).toHaveLength(2)
    // THE SECOND TURN CARRIES NO TRACE OF THE FIRST. A shared session would
    // replay the first document into the second's context and let it colour the
    // description — wrong in a way nothing downstream could detect.
    const second = JSON.stringify(client.seen[1].messages)
    expect(second).toContain('Calder Farm')
    expect(second).not.toContain('Bennett Mill')
    expect(second).not.toContain('First.')
  })

  it('test_UAT_FC_REQ_173_a_failing_describer_still_closes_its_session', async () => {
    // ALWAYS, INCLUDING ON THE FAILING PATH. The junction is in memory and the
    // isolate outlives the request, so a session left open per failed
    // description is a leak that only shows up under load. Proved by the next
    // description working: a manager that had leaked the failed session would be
    // resuming it rather than creating a fresh one, and the id collision is the
    // symptom that never surfaces on its own.
    let calls = 0
    const client = scriptedClient([
      (req) => {
        calls += 1
        if (calls === 1) throw new Error('upstream refused')
        return says('Recovered.')(req)
      },
    ])
    const describe = sessionTextDescriber('sk-not-a-real-key', { client })

    await expect(describe('First document.')).rejects.toThrow(/upstream refused/)
    const answer = await describe('Second document.')
    expect(answer.text).toContain('Recovered')
  })
})
