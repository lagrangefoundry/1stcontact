import { beforeAll, describe, expect, it } from 'vitest'
import { sessionIdFor, siteBackendName } from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import {
  business,
  chatsHeldBy,
  commentOfKind,
  exportChats,
  headerOf,
  importChats,
  seedChat,
  sessionFile,
  TOOL_TRANSCRIPT,
  TRANSCRIPT,
  TURNS,
  turnsOf,
} from './support/chat-history'

/**
 * BUG-159 — a delegate worker session crosses, and the whole payload no longer
 * hangs on it.
 *
 * THE BUG, STATED ONCE. `bin/copy-to-cloud --chats` could not carry the Lagrange
 * Foundry history at all. Nine delegate worker sessions were refused as
 * unaddressable, and because the refusal is whole-payload the one real consultant
 * conversation went with them — so the second half of the runbook had no way to
 * complete. The refusal was answering two questions at once with opposite answers:
 * an id carrying a SOURCE store's address that cannot be re-derived ([[BUG-137]]),
 * which must stay refused, and an id carrying NO store address at all, which has
 * nothing to re-address and nothing that becomes false on arrival.
 *
 * WHY THESE SESSIONS ARE WORTH CARRYING RATHER THAN DROPPING AT EXPORT. They are
 * the builder's actual work on a delegated build. [[REQ-294]] exists because the
 * site travelled to production and the reasoning that produced it did not; losing
 * the worker logs silently is a smaller version of the same defect.
 *
 * SO THE ASSERTIONS ARE ABOUT WHAT THE DESTINATION CAN ASK FOR, [[BUG-137]]'s
 * suite's own standard: a worker session must be reachable in the destination by
 * the very id it had in the source, and everything about it that was never the
 * source's must be untouched.
 *
 * AND THE WORKER IDS ARE THE ONES THE MACHINERY REALLY MINTS —
 * `worker-<role>-<n>-<random>`, from the 2026-09-26 run this was observed on. The
 * site and business ids are minted by the product's own derivers rather than
 * spelled here, for the reason [[BUG-137]]'s suite gives.
 */

/** A worker session id, as `delegation_toolbox.js` mints one per delegation. */
const WORKER_ONE = 'worker-builder-1-3bje6q'
const WORKER_TWO = 'worker-builder-2-qen037'

/** A worker's backend, as the delegation machinery registers it: `<backend>#<sid>`. */
const workerBackend = (sid: string): string => `claude_builder#${sid}`

/**
 * The consultant's tool record naming the worker it spawned — quoted from the
 * store this bug was observed against, so what crosses is what really sits there.
 */
const DELEGATE_CALL =
  '<!-- xgd-tool name="Delegate" -->\n' +
  '{"backend":"claude_builder","role":"builder","session":"worker-builder-2-qen037"}\n'

/** The three conversations a delegated build leaves behind, in one source store. */
async function seedDelegatedBuild(scope: { businessId: string }, site: string): Promise<void> {
  await seedChat(scope, sessionIdFor(site), {
    backend: siteBackendName(site),
    tool: DELEGATE_CALL,
  })
  for (const sid of [WORKER_ONE, WORKER_TWO]) {
    await seedChat(scope, sid, {
      backend: workerBackend(sid),
      role: 'builder',
      ledger: `### Decision 1\n\nThe hero grid, by ${sid}.\n`,
      tool: `<!-- xgd-tool name="write_element" -->\n{"by":"${sid}"}\n`,
    })
  }
}

describe('BUG-159 — a delegate worker session is carried rather than refused', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_FC_BUG-159_a_delegate_worker_session_lands_under_the_id_it_already_had', async () => {
    // THE RUNBOOK, END TO END: a source business holding a consultant conversation
    // and the two worker sessions hanging off it, exported and imported into a
    // destination whose site key is a different string. Before this fix the import
    // answered 409 and wrote nothing at all.
    const from = await business('bug159-from', true)
    await seedDelegatedBuild(from.scope, from.site)
    const exported = await exportChats(from.scope)
    expect(exported.status).toBe(200)
    expect(exported.body.chats).toHaveLength(3)

    const to = await business('bug159-to', true)
    expect(to.site).not.toBe(from.site)
    const landed = await importChats(to.scope, exported.body)
    expect(landed.status).toBe(200)
    expect(landed.body).toMatchObject({ created: 3, replaced: 0, kept: 0 })

    // ALL THREE ARE REACHABLE, AND TWO OF THEM UNDER THE SOURCE'S OWN IDS. The
    // consultant conversation is re-addressed onto the destination's site key
    // ([[BUG-137]]); the workers are not, because there is nothing in
    // `worker-builder-1-3bje6q` that was ever true only in the store it came from.
    const held = await chatsHeldBy(to.scope)
    expect(held.map((h) => String(h.ticket.fields.session_id))).toEqual([
      sessionIdFor(to.site),
      WORKER_ONE,
      WORKER_TWO,
    ])

    const worker = held.find((h) => h.ticket.fields.session_id === WORKER_TWO)
    expect(worker).toBeDefined()
    const row = (worker as NonNullable<typeof worker>).ticket
    // THE BACKEND NAME IS LEFT ALONE, and that is the fix and not an omission from
    // it. A worker's registry name is `<configured backend>#<worker session id>` —
    // it embeds the one id that travels unchanged and nothing local to a store — so
    // re-deriving it from the destination's site would have named a different
    // conversation's backend.
    expect(row.fields.backend).toBe(workerBackend(WORKER_TWO))
    // AND THE LEDGER IS THE SOURCE'S, byte for byte.
    expect(row.body).toBe(`### Decision 1\n\nThe hero grid, by ${WORKER_TWO}.\n`)

    const comments = (worker as NonNullable<typeof worker>).comments
    const transcript = commentOfKind(comments, TRANSCRIPT)
    expect(transcript).toBeDefined()
    const header = headerOf(String((transcript as NonNullable<typeof transcript>).body))
    expect(header.id).toBe(WORKER_TWO)
    expect(header.backend).toBe(workerBackend(WORKER_TWO))
    expect(header.role).toBe('builder')
    // THE TWO HEADER FIELDS THAT ARE STILL THE DESTINATION'S. `chat_ticket_uid`
    // names the ticket this session is homed on, which is a row minted here;
    // `backend_ref` names a conversation on a host that was RUNNING, and the
    // destination was running nothing. Neither is a statement about what produced
    // the record, so neither is carried.
    expect(header.chat_ticket_uid).toBe(row.uid)
    expect(header.backend_ref).toBe('')
    // AND THE TURNS BENEATH THE HEADER ARE THE RECORD, untouched.
    expect(turnsOf(String((transcript as NonNullable<typeof transcript>).body))).toBe(TURNS)
    // THE WORKER'S TOOL RECORD CROSSES AS BYTES. It is a record of what happened
    // rather than a statement about where it lives.
    expect(String(commentOfKind(comments, TOOL_TRANSCRIPT)?.body)).toContain(WORKER_TWO)

    // AND THE CONSULTANT CONVERSATION IS STILL RE-ADDRESSED, which is the half of
    // this that must not regress: its own tool record naming the worker it spawned
    // is what ties the two together on the far side.
    const consultant = held[0]
    expect(consultant.ticket.fields.backend).toBe(siteBackendName(to.site))
    expect(headerOf(String(commentOfKind(consultant.comments, TRANSCRIPT)?.body)).id).toBe(
      sessionIdFor(to.site),
    )
    expect(String(commentOfKind(consultant.comments, TOOL_TRANSCRIPT)?.body)).toContain(WORKER_TWO)
  })

  it('test_UAT_FC_BUG-159_a_second_copy_of_a_worker_session_duplicates_no_turn', async () => {
    // MATCHED BY THE ID IT ARRIVED WITH, LIKE ANY OTHER CONVERSATION. A session
    // carried verbatim is only safe if the far side can find it again, and the
    // proof of that is a re-run that adds nothing: a worker session landed under a
    // made-up id would be landed again on every copy.
    const from = await business('bug159-rerun-from', true)
    await seedDelegatedBuild(from.scope, from.site)
    const exported = await exportChats(from.scope)

    const to = await business('bug159-rerun-to', true)
    expect((await importChats(to.scope, exported.body)).body).toMatchObject({ created: 3 })
    const first = await chatsHeldBy(to.scope)

    const again = await importChats(to.scope, exported.body)
    expect(again.status).toBe(200)
    // KEPT, NOT REPLACED AND NOT CREATED: the destination already holds a
    // conversation at each of these three ids, and none of them is a placeholder.
    expect(again.body).toMatchObject({ created: 0, replaced: 0, kept: 3, comments: 0 })

    const second = await chatsHeldBy(to.scope)
    expect(second.map((h) => h.ticket.uid)).toEqual(first.map((h) => h.ticket.uid))
    expect(second.map((h) => h.comments.length)).toEqual(first.map((h) => h.comments.length))
    expect(second.map((h) => h.ticket.body)).toEqual(first.map((h) => h.ticket.body))
  })

  it('test_UAT_FC_BUG-159_an_unaddressable_conversation_still_refuses_the_whole_payload', async () => {
    // THE GRANULARITY STAYS, and this is the boundary of the fix rather than an
    // accident left in it. A history carrying an address this destination cannot
    // re-derive must leave it exactly as it was — a partial import addressed to
    // nothing is [[BUG-137]] itself — so one such conversation still refuses the
    // set. What has changed is which conversations are in that class: a worker
    // session no longer is, so the case that made this granularity hurt is gone.
    const from = await business('bug159-refuse-from', true)
    await seedDelegatedBuild(from.scope, from.site)
    const exported = await exportChats(from.scope)

    // AN ID THAT CLAIMS ONE OF THE TWO ADDRESSES AND THEN NAMES NEITHER — minted
    // by the product's own deriver from nothing, so it points at a site that cannot
    // be resolved anywhere.
    const stated = sessionIdFor('')
    const to = await business('bug159-refuse-to', true)
    const refused = await importChats(to.scope, {
      ...exported.body,
      chats: [
        ...exported.body.chats,
        {
          sessionId: stated,
          title: stated,
          status: 'open',
          body: '### Decision 1\n\nAddressed to nothing.\n',
          fields: { session_id: stated, backend: siteBackendName('') },
          comments: [{ kind: TRANSCRIPT, body: sessionFile({ id: stated }) }],
        },
      ],
    })
    expect(refused.status).toBe(409)
    // NAMING ONLY THE CONVERSATION IT IS ABOUT. The worker sessions are not in this
    // list, because they are not what is wrong with the payload.
    expect(refused.body.sessions).toEqual([stated])
    expect(String(refused.body.error)).toMatch(/Nothing was written/)
    // AND NOTHING WAS WRITTEN — including the two worker sessions the same payload
    // carried, which is what "whole payload" means.
    expect(await chatsHeldBy(to.scope)).toHaveLength(0)
  })
})
