/**
 * REQ-207 — **the image describer stops being a second path to a model**.
 *
 * WHAT THIS IS EVIDENCE FOR. `describe.ts` used to reach the Messages API
 * directly to describe an uploaded image, and said in its own source why: this
 * component's session surface was text-only, so an image could not be described
 * through the host the Worker already runs. It named the consolidation point and
 * committed to being deleted when one arrived. REQ-111 put image content on that
 * surface, so this is that deletion — the describer becomes a configured
 * capability reached through the same host as everything else.
 *
 * THE CLAIM IS NOT "IT STILL WORKS", IT IS "IT GOES THROUGH THE HOST". A test
 * that only asserted a description comes back would pass against the SDK call
 * this ticket removes. So the assertions below are about the turn the host
 * actually assembles: one session per image, primed with the image prompt and
 * nothing else, offered no tools, carrying the picture as an image content block
 * and not as prose about one.
 *
 * ONE DOUBLE, AND IT IS THE NETWORK. `scriptedClient` is the seam the AI
 * library's own backend is written to have injected (BUG-39); everything on this
 * side of it — the session manager, the role assembly, the content-block
 * validation, the junction, the archive — is the real thing. The recording half
 * is the evidence that matters: what the model is SENT is produced by the host
 * and is exactly what silently rots.
 *
 * THE SEAM'S SHAPE DID NOT CHANGE, which is why `describe.ts`'s own suites keep
 * driving `DescribeImage` unchanged and keep not reaching the network. That is
 * asserted here too, at the bottom, because "the caller did not have to move" is
 * the property that made this a consolidation rather than a rewrite.
 */

import { describe as suite, expect, it } from 'vitest'
import { sessionImageDescriber, sessionTextDescriber } from '../apps/control-app/src/ai'
import { IMAGE_DIGEST_SYSTEM, describe as describeMaterial } from '../apps/control-app/src/describe'
import { says, scriptedClient, systemText } from './support/scripted-model-client'

/** A one-pixel PNG. Real bytes, because the port validates what it is handed. */
const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
)

/** Every content block of the first (or nth) user message the host sent. */
function sentBlocks(req: { messages: { role: string; content: unknown }[] }): {
  type: string
  [k: string]: unknown
}[] {
  const user = req.messages.find((m) => m.role === 'user')
  return Array.isArray(user?.content)
    ? (user.content as { type: string; [k: string]: unknown }[])
    : []
}

suite('REQ-207 — the image describer is a session on the AI host', () => {
  it('test_UAT_FC_REQ_207_the_description_comes_back_from_a_session_prompted_with_the_image', async () => {
    const client = scriptedClient([says('A kitchen at dusk\n\nA narrow galley kitchen.')])
    const describe = sessionImageDescriber('sk-not-a-real-key', { client })

    const answer = await describe(PNG, 'image/png')

    expect(answer.text).toContain('galley kitchen')
    // The model id is reported so `description_model` names whoever wrote the
    // body — a re-describe pass selects on it.
    expect(answer.model).toBeTruthy()

    // ONE CALL PER IMAGE. The description is one turn; a tool loop would be two
    // or more, and there is nothing here for it to loop over.
    expect(client.seen).toHaveLength(1)
  })

  it('test_UAT_FC_REQ_207_the_picture_is_sent_as_an_image_block_not_as_prose_about_one', async () => {
    const client = scriptedClient([says('A title\n\nSome description.')])
    await sessionImageDescriber('sk-not-a-real-key', { client })(PNG, 'image/png')

    const blocks = sentBlocks(client.seen[0])
    // THE LOAD-BEARING ASSERTION OF THIS TICKET. A host that could not carry an
    // image would have to send *something* — a filename, a note that an image
    // was omitted — and the description would come back written about nothing.
    // The image block is the whole reason the second path to a model can go.
    const image = blocks.find((b) => b.type === 'image')
    expect(image).toBeTruthy()
    // Base64 of the caller's own bytes, translated by the port into the wire
    // envelope: this is a real picture on the wire, not a placeholder.
    expect(JSON.stringify(image)).toContain('iVBORw0KGgo')

    // THE INSTRUCTION SITS BESIDE IT, after it, exactly as this product sent it
    // before. The prompt that governs the answer is the role's system text; the
    // trailing line is a nudge.
    const text = blocks.filter((b) => b.type === 'text')
    expect(text).toHaveLength(1)
    expect(blocks[blocks.length - 1].type).toBe('text')
  })

  it('test_UAT_FC_REQ_207_the_describer_is_primed_with_the_image_prompt_and_nothing_else', async () => {
    const client = scriptedClient([says('A title\n\nSome description.')])
    await sessionImageDescriber('sk-not-a-real-key', { client })(PNG, 'image/png')

    const system = systemText(client.seen[0])
    // THE PROMPT `describe.ts` OWNS. The two prompts this product sends about
    // material live next to each other, in the file that decides what a
    // description IS — so the role is built from that constant rather than from a
    // second copy of it here. It asks for a title line because a photograph has
    // none of its own to prefer, which is what `describeImageMaterial` splits on.
    expect(system).toContain(IMAGE_DIGEST_SYSTEM)
    // NO CORPUS AND NO MANUAL. The consultant session's priming is the landscape
    // plus the toolbox manual; a describer primed with either would spend a large
    // prompt learning about material it is not being asked about.
    expect(system).not.toMatch(/landscape/i)
    expect(system).not.toMatch(/knowledge base/i)
  })

  it('test_UAT_FC_REQ_207_the_describer_is_offered_no_tools', async () => {
    const client = scriptedClient([says('A title\n\nSome description.')])
    await sessionImageDescriber('sk-not-a-real-key', { client })(PNG, 'image/png')

    // A DESCRIBER WITH A TOOLBOX COULD WRITE TO THE CLIENT'S SITE. Nothing about
    // looking at a photograph calls for that authority, and an authority granted
    // because it was convenient is the one nobody reviews.
    expect(client.seen[0].tools ?? []).toEqual([])
  })

  it('test_UAT_FC_REQ_207_two_images_do_not_share_a_conversation', async () => {
    const client = scriptedClient([says('First\n\nOne.'), says('Second\n\nTwo.')])
    const describe = sessionImageDescriber('sk-not-a-real-key', { client })

    await describe(PNG, 'image/png')
    await describe(PNG, 'image/jpeg')

    expect(client.seen).toHaveLength(2)
    // THE SECOND TURN CARRIES NO TRACE OF THE FIRST. A shared session would
    // replay the first image into the second's context and let it colour the
    // description — wrong in a way nothing downstream could detect. One image
    // block, not two, is the observable form of that.
    expect(sentBlocks(client.seen[1]).filter((b) => b.type === 'image')).toHaveLength(1)
    expect(JSON.stringify(client.seen[1].messages)).not.toContain('First')
  })

  it('test_UAT_FC_REQ_207_a_failing_describer_still_closes_its_session', async () => {
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
        return says('Recovered\n\nA description.')(req)
      },
    ])
    const describe = sessionImageDescriber('sk-not-a-real-key', { client })

    await expect(describe(PNG, 'image/png')).rejects.toThrow(/upstream refused/)
    const answer = await describe(PNG, 'image/png')
    expect(answer.text).toContain('Recovered')
  })

  it('test_UAT_FC_REQ_207_the_image_and_document_describers_do_not_cross_wire', async () => {
    // THE HAZARD A SHARED NAME WOULD CREATE. `registerBackend` is a process-wide
    // idempotent overwrite, so two describers registered under one name means the
    // one built second silently owns the first's backend — and the router builds
    // both per request. The symptom would be a document answered through the
    // image describer's instruction, which nothing downstream could detect.
    const images = scriptedClient([says('Image title\n\nAn image answer.')])
    const documents = scriptedClient([says('A document answer.')])

    const describeImage = sessionImageDescriber('sk-not-a-real-key', { client: images })
    const describeText = sessionTextDescriber('sk-not-a-real-key', { client: documents })

    const document = await describeText('The rye comes from Bennett Mill.')
    const image = await describeImage(PNG, 'image/png')

    expect(document.text).toContain('document answer')
    expect(image.text).toContain('image answer')
    // Each client saw its own call and only its own call.
    expect(images.seen).toHaveLength(1)
    expect(documents.seen).toHaveLength(1)
    // And each was primed with its own instruction.
    expect(systemText(documents.seen[0])).not.toContain(IMAGE_DIGEST_SYSTEM)
    expect(systemText(images.seen[0])).toContain(IMAGE_DIGEST_SYSTEM)
  })

  it('test_UAT_FC_REQ_207_the_DescribeImage_seam_did_not_move', async () => {
    // WHY THIS BELONGS IN THIS SUITE. The consolidation is only cheap if the
    // callers did not have to change: `describe.ts` takes the describer as a seam
    // and `material.ts` and `capture-material.ts` hand one in. Driving the
    // pipeline with the real session describer — not an ad hoc stub — is what
    // proves the new implementation satisfies the old contract, title split and
    // all.
    const client = scriptedClient([says('A kitchen at dusk\n\nA narrow galley kitchen.')])
    const description = await describeMaterial(
      { bytes: PNG, kind: 'image', contentType: 'image/png', filename: 'kitchen.png' },
      { describeImage: sessionImageDescriber('sk-not-a-real-key', { client }) },
    )

    expect(description.status).toBe('ok')
    expect(description.title).toBe('A kitchen at dusk')
    expect(description.body).toContain('narrow galley kitchen')
    // `description_model` names whoever wrote the body, so a re-describe pass has
    // something to select on.
    expect(description.describer).toBeTruthy()
  })
})
