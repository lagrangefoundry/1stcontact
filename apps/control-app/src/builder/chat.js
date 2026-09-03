/**
 * The assistant pane (REQ-122, REQ-127, DOC-28 §7.1).
 *
 * It is the split's SECONDARY, beside the display panel, and it shows ONE
 * conversation: the session it was handed.
 *
 * IT KNOWS NOTHING ABOUT SITES (REQ-127), and that is the whole shape of this
 * file. A session is bound to a site when the origin creates it; by the time one
 * arrives here that binding is settled, so there is no slug to hold, no site to
 * switch, and no way for this pane to be showing a conversation about one site
 * while addressing a turn to another. Switching site is `app.js`'s job: it opens
 * the new session and hands it over.
 *
 * WHAT THAT DELETED. This used to take a slug, open the session itself, and carry
 * a `generation` counter — because the open was async, a second switch could
 * start before the first finished, and the token was what stopped a slow answer
 * for an abandoned site from landing in the pane now showing a different one.
 * Receiving an already-open session makes the swap synchronous, and a race that
 * cannot start needs no guard.
 *
 * WHY A SWITCH IS A REMOUNT AND NOT A CLEAR. `mountChat` has `appendMessage` but
 * no way to empty itself, and that turns out to be the right shape rather than a
 * gap to work around: a fresh instance keyed on the session id also keys the
 * component's own draft persistence per conversation, so a half-typed message
 * survives a trip to another site and back. Reusing one instance would need a
 * clear the component does not offer AND would give every session the same draft.
 *
 * THE TRANSCRIPT IS REPLAYED, and that is not decoration. The session remembers
 * the conversation across reloads; if the panel did not, the assistant would
 * answer using context the operator cannot see, which reads as spooky rather than
 * clever.
 *
 * AND IT IS REPLAYED EXACTLY ONCE, which is why the markdown engines are waited
 * for BEFORE a session reaches this pane rather than inside it (BUG-42).
 * `mountChat` renders each message as it is appended and offers no way to redraw
 * one, so a turn painted while the renderer is still loading stays escaped source
 * for the life of the page. The wait therefore belongs where the async already
 * is — `app.js`'s `showSite`, which is opening the session anyway and already
 * carries the generation guard — and this pane keeps the synchronous shape the
 * paragraphs above are about.
 */

import { mountChat } from '@lagrangefoundry/webui-chat'
import { streamChatPrompt, streamChatReattach } from './api.js'
// FOR THE SIDE EFFECT: importing this module starts the markdown engines loading
// (BUG-42), so a pane mounted on its own still gets them. WAITING for them is
// `app.js`'s job, not this file's — see the header on why this pane is synchronous.
import './markdown.js'

/**
 * The host's event kind for "the site moved" (BUG-43). Its meaning is
 * `host-core.ts`'s `SITE_CHANGED`; this is the same string on the client's side
 * of the wire.
 */
const SITE_CHANGED = 'site_changed'

/**
 * Pass a turn through, telling the host each time it reports a write (BUG-43).
 *
 * A WRAPPER AROUND THE STREAM RATHER THAN A SECOND SUBSCRIPTION, because there
 * is only one stream and `mountChat` consumes it. The chat component ignores
 * event kinds it does not know, so `site_changed` could simply have been left in
 * — but then nothing would act on it, and passing on an event whose only purpose
 * is already served is how a panel ends up rendering a blank bubble the day the
 * component learns another kind. It is observed here and stops here.
 *
 * The callback fires DURING the turn, not after it: the write it reports has
 * already landed in the store, so the render it triggers is current, and firing
 * as they arrive is what lets a multi-edit answer show the page unfolding rather
 * than jumping to a finished state when the assistant stops talking.
 *
 * A throwing callback must not take the turn with it. Reloading a frame is the
 * caller's business and its failure is not the conversation's.
 */
async function* watchForWrites(events, onSiteChanged) {
  for await (const event of events) {
    if (event?.kind !== SITE_CHANGED) {
      yield event
      continue
    }
    try {
      onSiteChanged(event.meta ?? {})
    } catch {
      // Deliberately swallowed; see above.
    }
  }
}

/** Per-session instance id — also the key the composer's draft persists under. */
export const CHAT_ID_PREFIX = 'builder-chat:'

/** Shown before the pane has a conversation to display. */
const EMPTY_TEXT = 'Ask for a change to your site.'

/**
 * Mount the pane.
 *
 * @param {object} [options]
 * @param {Storage} [options.storage]   per-instance draft persistence
 * @param {object}  [options.transport] `{streamPrompt, streamReattach}` — injected
 *   by tests. A transport with no `streamReattach` simply never rejoins, which
 *   is what keeps every existing caller working unchanged.
 * @param {(meta: {at?: number, changes?: number}) => void} [options.onSiteChanged]
 *   Called each time the turn reports a write — see {@link watchForWrites}.
 */
export function createChatPanel(options = {}) {
  const {
    storage,
    transport = { streamPrompt: streamChatPrompt, streamReattach: streamChatReattach },
    onSiteChanged = () => {},
  } = options

  const element = document.createElement('div')
  element.className = 'builder-chat'

  let chat = null
  let sessionId = null

  /** Say something in the panel's own voice — a failure, or why it is frozen. */
  function note(text) {
    chat?.appendMessage('assistant', `_${text}_`)
  }

  /**
   * Show a conversation.
   *
   * Takes an OPEN session — `{sessionId, turns, ready, error}`, exactly what
   * `/api/ai/session` answers with — rather than something to go and open. That
   * is what makes this synchronous, and synchronous is what removes the race: the
   * pane cannot be part-way through adopting one conversation when it is handed
   * the next.
   *
   * `null` empties the pane, for a host with no site selected.
   *
   * `live` and `cursor` are what make a reload during a turn survivable
   * (BUG-46): `live` says a turn is still being written, and `cursor` is where
   * the transcript stopped, so the rejoin resumes at exactly the offset the
   * paint reached. They are consumed together or not at all.
   *
   * @param {{sessionId: string, turns?: {role: string, markdown: string}[],
   *          cursor?: number, live?: boolean,
   *          ready?: boolean, error?: string} | null} session
   */
  function setSession(session) {
    const next = session?.sessionId ?? null
    if (next === sessionId) return
    sessionId = next

    chat?.destroy()
    chat = null
    element.replaceChildren()
    if (!session) return

    const id = session.sessionId
    chat = mountChat(element, {
      id: `${CHAT_ID_PREFIX}${id}`,
      emptyText: EMPTY_TEXT,
      toolPane: true,
      ...(storage ? { storage } : {}),
      sendPrompt: (text) => watchForWrites(transport.streamPrompt(id, text), onSiteChanged),
    })

    // A TURN STILL IN FLIGHT IS PAINTED BY `resume`, NOT BY `appendMessage`
    // (BUG-46). When the origin says a turn is open, the transcript's last
    // assistant turn is the half of a reply that had been written when this page
    // loaded — it is not a finished message, and appending it as one would leave
    // the operator looking at a reply that stopped mid-sentence. It seeds the
    // resumed bubble instead, so the half already said and the half still coming
    // are ONE message rather than two.
    const turns = session.turns ?? []
    const resuming = session.live === true && typeof transport.streamReattach === 'function'
    const seed = resuming && turns.at(-1)?.role === 'assistant' ? turns.at(-1) : null
    for (const turn of seed ? turns.slice(0, -1) : turns) {
      chat.appendMessage(turn.role, turn.markdown)
    }
    // `ready` is independent of the transcript: a builder with no API key still
    // has every earlier conversation, and the operator is owed both the history
    // and the reason it is frozen.
    if (session.ready === false) note(session.error || 'The assistant is not available.')
    if (!resuming) return

    // NOT AWAITED, and this function stays synchronous. `resume` runs for as
    // long as the turn does, and the argument in this file's header — that a
    // synchronous swap is what removes the race — is exactly as true here: the
    // pane must be able to be handed the next conversation without waiting for
    // this one's turn to end. A rejoin is fire-and-forget for the same reason
    // `mountChat` drives `sendPrompt` without the caller awaiting it.
    //
    // THROUGH `watchForWrites`, because a resumed turn writes to the site just
    // like a live one does. Its `site_changed` signals are the operator's only
    // notice that the preview moved (BUG-43) — dropping them here would make a
    // reloaded page the one place edits happen invisibly, which is the failure
    // that had them reloading in the first place.
    Promise.resolve(
      chat.resume(watchForWrites(transport.streamReattach(id, session.cursor), onSiteChanged), {
        markdown: seed?.markdown ?? '',
      }),
    ).catch(() => {
      // A rejoin that fails costs the live tail and nothing else: the transcript
      // is painted, the turn is unaffected — `watch` is a reader — and it lands
      // in the archive either way. Reporting it would be telling the operator
      // about a request they did not make.
    })
  }

  return {
    element,
    setSession,
    getSessionId: () => sessionId,
    /** The live panel, or null before a session is set. Tests and the host read it. */
    getChat: () => chat,
    destroy() {
      chat?.destroy()
      chat = null
      sessionId = null
      element.remove()
    },
  }
}
