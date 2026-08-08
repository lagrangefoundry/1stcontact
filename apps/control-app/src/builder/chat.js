/**
 * The assistant pane (REQ-122, DOC-28 §7.1).
 *
 * It is the split's SECONDARY, beside the display panel, and it is bound to
 * whatever site the panel is showing: switching site switches conversation.
 *
 * WHY A SWITCH IS A REMOUNT AND NOT A CLEAR. `mountChat` has `appendMessage` but
 * no way to empty itself, and that turns out to be the right shape rather than a
 * gap to work around: a fresh instance keyed on the slug also keys the
 * component's own draft persistence per site, so a half-typed message survives a
 * trip to another site and back. Reusing one instance would need a clear the
 * component does not offer AND would give every site the same draft.
 *
 * THE TRANSCRIPT IS REPLAYED, and that is not decoration. The session remembers
 * the conversation across reloads; if the panel did not, the assistant would
 * answer using context the operator cannot see, which reads as spooky rather than
 * clever.
 */

import { loadSanitizer, mountChat } from '@lagrangefoundry/webui-chat'
import { loadMarked } from '@lagrangefoundry/webui-markdown'
import { openChatSession, streamChatPrompt } from './api.js'

/** Per-site instance id — also the key the composer's draft persists under. */
export const CHAT_ID_PREFIX = 'builder-chat:'

/** Shown while the site's conversation is being opened. */
const EMPTY_TEXT = 'Ask for a change to your site.'

/**
 * Mount the pane.
 *
 * @param {object} [options]
 * @param {Storage} [options.storage]   per-instance draft persistence
 * @param {object}  [options.transport] `{openSession, streamPrompt}` — injected by tests
 */
export function createChatPanel(options = {}) {
  const {
    storage,
    transport = { openSession: openChatSession, streamPrompt: streamChatPrompt },
  } = options

  // Both engines load from a CDN behind their components' seams, and both are
  // designed to degrade: without them the panel renders escaped markdown rather
  // than nothing. So a rejection here is swallowed — offline is a worse-looking
  // panel, not a broken one.
  loadMarked().catch(() => {})
  loadSanitizer().catch(() => {})

  const element = document.createElement('div')
  element.className = 'builder-chat'

  let chat = null
  let site = null
  /**
   * Which site switch is current. A switch is async (it opens the session), so a
   * second switch can start before the first finishes; the token is what stops a
   * slow answer for the site the operator has already left from landing in the
   * panel now showing a different one.
   */
  let generation = 0

  /** Say something in the panel's own voice — a failure, or why it is frozen. */
  function note(text) {
    chat?.appendMessage('assistant', `_${text}_`)
  }

  async function setSite(next) {
    if (next === site) return
    site = next
    const mine = ++generation

    chat?.destroy()
    chat = null
    element.replaceChildren()
    if (!site) return

    // Mounted BEFORE the session is opened, so the pane is never blank while a
    // request is in flight, and so a failure has somewhere to be reported.
    const slug = site
    chat = mountChat(element, {
      id: `${CHAT_ID_PREFIX}${slug}`,
      emptyText: EMPTY_TEXT,
      toolPane: true,
      ...(storage ? { storage } : {}),
      sendPrompt: (text) => transport.streamPrompt(slug, text),
    })

    try {
      const session = await transport.openSession(slug)
      if (mine !== generation) return
      for (const turn of session.turns ?? []) chat.appendMessage(turn.role, turn.markdown)
      if (session.ready === false) note(session.error || 'The assistant is not available.')
    } catch (err) {
      if (mine !== generation) return
      note(`The assistant could not be reached: ${err.message}`)
    }
  }

  return {
    element,
    setSite,
    getSite: () => site,
    /** The live panel, or null before a site is set. Tests and the host read it. */
    getChat: () => chat,
    destroy() {
      generation += 1
      chat?.destroy()
      chat = null
      element.remove()
    },
  }
}
