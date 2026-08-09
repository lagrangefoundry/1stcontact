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
 */

import { loadSanitizer, mountChat } from '@lagrangefoundry/webui-chat'
import { loadMarked } from '@lagrangefoundry/webui-markdown'
import { streamChatPrompt } from './api.js'

/** Per-session instance id — also the key the composer's draft persists under. */
export const CHAT_ID_PREFIX = 'builder-chat:'

/** Shown before the pane has a conversation to display. */
const EMPTY_TEXT = 'Ask for a change to your site.'

/**
 * Mount the pane.
 *
 * @param {object} [options]
 * @param {Storage} [options.storage]   per-instance draft persistence
 * @param {object}  [options.transport] `{streamPrompt}` — injected by tests
 */
export function createChatPanel(options = {}) {
  const { storage, transport = { streamPrompt: streamChatPrompt } } = options

  // Both engines load from a CDN behind their components' seams, and both are
  // designed to degrade: without them the panel renders escaped markdown rather
  // than nothing. So a rejection here is swallowed — offline is a worse-looking
  // panel, not a broken one.
  loadMarked().catch(() => {})
  loadSanitizer().catch(() => {})

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
   * @param {{sessionId: string, turns?: {role: string, markdown: string}[],
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
      sendPrompt: (text) => transport.streamPrompt(id, text),
    })

    for (const turn of session.turns ?? []) chat.appendMessage(turn.role, turn.markdown)
    // `ready` is independent of the transcript: a builder with no API key still
    // has every earlier conversation, and the operator is owed both the history
    // and the reason it is frozen.
    if (session.ready === false) note(session.error || 'The assistant is not available.')
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
