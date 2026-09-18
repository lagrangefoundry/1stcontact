/**
 * The assistant pane (REQ-122, REQ-127, DOC-28 §7.1).
 *
 * It is the split's SECONDARY, beside the display panel, and it shows ONE
 * conversation: the session it was handed.
 *
 * IT KNOWS NOTHING ABOUT SITES (REQ-127), and that is the whole shape of this
 * file. A session is bound to a site when the origin creates it; by the time one
 * arrives here that binding is settled, so there is no site key to hold, no site to
 * switch, and no way for this pane to be showing a conversation about one site
 * while addressing a turn to another. Switching site is `app.js`'s job: it opens
 * the new session and hands it over.
 *
 * WHAT THAT DELETED. This used to take a site, open the session itself, and carry
 * a `generation` counter — because the open was async, a second switch could
 * start before the first finished, and the token was what stopped a slow answer
 * for an abandoned site from landing in the pane now showing a different one.
 * Receiving an already-open session makes the swap synchronous, and a race that
 * cannot start needs no guard.
 *
 * WHY A SWITCH IS A REMOUNT AND NOT A CLEAR. `mountChat` has `appendMessage` but
 * no way to empty itself, and that turns out to be the right shape rather than a
 * gap to work around: a fresh instance keyed on the conversation also keys the
 * component's own draft persistence per conversation, so a half-typed message
 * survives a trip to another site and back. Reusing one instance would need a
 * clear the component does not offer AND would give every session the same draft.
 * WHAT "the conversation" MEANS is the caller's to say — see `setSession`'s
 * `key`, and [[BUG-69]] for why it is not the session id.
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
 * The host's event kind for "the business's record moved" ([[REQ-251]]). Its
 * meaning is `host-core.ts`'s `BUSINESS_CHANGED`; this is the same string on the
 * client's side of the wire, held equal by the same arrangement `SITE_CHANGED`
 * has.
 */
const BUSINESS_CHANGED = 'business_changed'

/**
 * The host's event kind for "we have just changed the client's domain"
 * ([[REQ-260]]). Its meaning is `host-core.ts`'s `DNS_CHANGED`; this is the same
 * string on the client's side of the wire, held equal by the same arrangement
 * the two above it have.
 *
 * IT IS THE ONE SIGNAL THAT CARRIES A PAYLOAD, and this pane still renders
 * nothing from it: the meta goes to whoever asked for it, and what a card looks
 * like is `dns-history.js`'s. A pane that knew what a DNS change was would be a
 * pane that has to be taught the next kind of change too.
 */
const DNS_CHANGED = 'dns_changed'

/**
 * Pass a turn through, telling the host each time it reports a write (BUG-43,
 * [[REQ-251]]).
 *
 * A WRAPPER AROUND THE STREAM RATHER THAN A SECOND SUBSCRIPTION, because there
 * is only one stream and `mountChat` consumes it. The chat component ignores
 * event kinds it does not know, so `site_changed` could simply have been left in
 * — but then nothing would act on it, and passing on an event whose only purpose
 * is already served is how a panel ends up rendering a blank bubble the day the
 * component learns another kind. It is observed here and stops here.
 *
 * TWO KINDS, ONE READER ([[REQ-251]]). A site conversation produces one of them
 * and a settings conversation the other; this pane is the same component in both
 * places and knows which it is in only by which callback its host handed it. A
 * second wrapper for the second kind would be the same eight lines twice, with
 * the next kind landing in whichever of them its author happened to open.
 *
 * The callback fires DURING the turn, not after it: the write it reports has
 * already landed in the store, so the render it triggers is current, and firing
 * as they arrive is what lets a multi-edit answer show the page unfolding rather
 * than jumping to a finished state when the assistant stops talking.
 *
 * A throwing callback must not take the turn with it. Reloading a frame — or
 * re-reading a record — is the caller's business and its failure is not the
 * conversation's.
 */
async function* watchForWrites(events, told) {
  for await (const event of events) {
    // `Map#get` AND NOT AN OBJECT LOOKUP. The key is a string off the wire, and
    // an object index would resolve `constructor` or `toString` to something on
    // `Object.prototype` and then call it — a frame this pane does not recognise
    // must fall through to the component, never into a builtin.
    const tell = told.get(event?.kind)
    if (!tell) {
      yield event
      continue
    }
    try {
      tell(event.meta ?? {})
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
 *   Called each time the turn reports a write to the SITE — see
 *   {@link watchForWrites}.
 * @param {(meta: {at?: number, changes?: number}) => void} [options.onBusinessChanged]
 *   Called each time the turn reports a write to the BUSINESS'S RECORD
 *   ([[REQ-251]]) — its name, or its public address.
 *
 *   ITS HOST RE-READS; THIS PANE DOES NOT REPORT WHAT CHANGED. The signal
 *   carries a count and nothing else, deliberately: the pane beside this
 *   conversation is an ordinary caller of the same routes the assistant is, and
 *   a payload it could render instead would make the assistant the pane's writer
 *   — which is the one arrangement [[REQ-239]]'s "one API, two callers" rules
 *   out.
 * @param {(meta: {change?: string, summary?: string, settles_by?: string}) => void}
 *   [options.onDnsChanged]
 *   Called once per change the turn made to the client's DOMAIN ([[REQ-260]]).
 *
 *   UNLIKE THE TWO ABOVE IT, THE SIGNAL CARRIES THE SENTENCE. Those two report
 *   that something moved and the host re-reads; this one is the CARD — the words
 *   the client is owed at the moment their DNS changes — and a sentence rebuilt
 *   later from a record diff is a sentence nobody wrote. The pane does not render
 *   it: what a card looks like belongs with the history that shows the same
 *   sentence a year later.
 *
 *   IT IS A NOTICE AND NOT A QUESTION. There is no shape here that could carry an
 *   approval back, deliberately — a confirmation the client cannot meaningfully
 *   perform would only launder our error into their consent.
 * @param {(markdown: string) => string} [options.expandPrompt]
 *   REQ-210 — the last thing that happens to a draft before it becomes a turn.
 *
 *   IT IS A SEAM AND NOT A FEATURE OF THIS PANE. Marked Points is the caller
 *   today, expanding each pill into the spatial description that is the
 *   assistant's ONLY channel for it — the marks live in the reader's browser
 *   overlay and are in no render the assistant sees. This pane knows none of
 *   that; it knows that a draft is transformed on the way out, which is the one
 *   thing it has to know for the transformation to be possible at all.
 *
 *   IT RUNS HERE RATHER THAN IN THE COMPOSER, so the bubble the reader watches
 *   appear keeps the short form they typed while the turn carries the long one.
 *   A reloaded transcript replays what the session recorded — the expansion —
 *   which is the honest archive: it is what the assistant was actually told.
 * @param {(src: string, alt: string) => void} [options.onImageClick]
 *   REQ-220 — the reader clicked a picture in the transcript.
 *
 *   A PICTURE IN THE CONVERSATION IS THE SAME PICTURE AS THE ONE IN THE LIBRARY
 *   and must go to the same place. `mountChat` writes each turn's markdown
 *   straight into a message element and publishes no per-node hook, so this is a
 *   DELEGATED listener on the pane's own root: it survives every turn the widget
 *   appends, including the ones replayed from the transcript on reload, without
 *   this file having to be told when a message arrived.
 *
 *   IT REPORTS THE ADDRESS AND NOT A MATERIAL. This pane knows nothing about
 *   sites and it is going to know nothing about the Library either — what it can
 *   honestly say is *the reader clicked this picture*. Deciding whether that URL
 *   names something this product can open is `app.js`'s, which is where every
 *   other "what does this identifier mean" question in the builder already sits.
 */
export function createChatPanel(options = {}) {
  const {
    storage,
    transport = { streamPrompt: streamChatPrompt, streamReattach: streamChatReattach },
    onSiteChanged = () => {},
    onBusinessChanged = () => {},
    onDnsChanged = () => {},
    expandPrompt = (markdown) => markdown,
    onImageClick = null,
  } = options

  /**
   * Which signals this pane acts on, and what it does with each ([[REQ-251]]).
   *
   * BUILT ONCE RATHER THAN PER TURN, and read by both `sendPrompt` and `resume`
   * — so a rejoined turn reports a settings write exactly as a live one does,
   * which is the property BUG-43 had to state separately for the site and would
   * otherwise have to be stated again here.
   */
  const told = new Map([
    [SITE_CHANGED, onSiteChanged],
    [BUSINESS_CHANGED, onBusinessChanged],
    // [[REQ-260]] — THE ONE THAT ARRIVES WITH SOMETHING TO SAY. The handler is
    // given the change; where it puts it is the host's business, and the host
    // puts it in the message the panel has already opened for this turn.
    [DNS_CHANGED, onDnsChanged],
  ])

  const element = document.createElement('div')
  element.className = 'builder-chat'

  // DELEGATED ONCE, AT THE ROOT — see `onImageClick` on why it cannot be bound
  // per message. Bound only when a host asked for it, so a pane mounted without
  // the option behaves exactly as it did before this existed.
  if (onImageClick) {
    element.addEventListener('click', (ev) => {
      const img = ev.target
      if (!img || img.tagName !== 'IMG') return
      // `getAttribute` RATHER THAN `.src`, so the handler is given the address as
      // the turn wrote it. The property resolves against the document and would
      // hand on an absolute URL for a line that said something relative — which
      // is a difference the caller then has to undo.
      onImageClick(img.getAttribute('src') ?? '', img.getAttribute('alt') ?? '')
    })
  }

  let chat = null
  let sessionId = null
  let sessionKey = null

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
   * WHICH CONVERSATION THIS IS, IS NOT THE SESSION ID ([[BUG-69]]). The origin
   * derives an id from the site — `site-<siteKey>` — which since [[REQ-236]] is
   * globally unique, because a site key is 128 random bits. It was NOT: the id
   * came from the slug, slugs were per-business by design, and two businesses
   * could each hold a `site-unnamed` that were two different conversations.
   *
   * This pane cannot see that, and should not have to — it still knows nothing
   * about sites or businesses. It is TOLD, as `key`: the caller's name for the
   * conversation, in the caller's own address space. Everything about identity
   * hangs off it — the no-op below, the remount, and the composer's draft
   * storage — while the wire `sessionId` stays exactly what turns are addressed
   * to. Defaulting `key` to the id is what keeps a host with nothing wider in
   * scope, and every existing caller, unchanged.
   *
   * The failure this was written for: a switch between two businesses whose
   * sites shared a slug re-read the right transcript from the origin and then
   * discarded it, because the id string matched the one already on screen —
   * leaving one business's conversation beside another business's site. REQ-236
   * removes that collision; `key` stays, because this pane still may not be the
   * thing that knows what makes a conversation distinct.
   *
   * @param {{sessionId: string, turns?: {role: string, markdown: string}[],
   *          cursor?: number, live?: boolean,
   *          ready?: boolean, error?: string} | null} session
   * @param {string} [key] identity of the conversation to the caller; defaults
   *   to the session id, which is what it means where nothing wider is in scope.
   */
  function setSession(session, key) {
    const next = session ? (key ?? session.sessionId) : null
    if (next === sessionKey) return
    sessionKey = next
    sessionId = session?.sessionId ?? null

    chat?.destroy()
    chat = null
    element.replaceChildren()
    if (!session) return

    const id = session.sessionId
    chat = mountChat(element, {
      // KEYED ON THE CONVERSATION, NOT THE WIRE ID. This is also the composer's
      // draft key, so a half-typed message stays with the business it was typed
      // under rather than surfacing under another business's same-named site.
      id: `${CHAT_ID_PREFIX}${next}`,
      emptyText: EMPTY_TEXT,
      toolPane: true,
      ...(storage ? { storage } : {}),
      sendPrompt: (text) =>
        watchForWrites(transport.streamPrompt(id, expandPrompt(text)), told),
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
      chat.resume(watchForWrites(transport.streamReattach(id, session.cursor), told), {
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
    /** The id turns are addressed to — the origin's, unchanged ([[BUG-69]]). */
    getSessionId: () => sessionId,
    /** What the pane considers the displayed conversation to be ([[BUG-69]]). */
    getSessionKey: () => sessionKey,
    /** The live panel, or null before a session is set. Tests and the host read it. */
    getChat: () => chat,
    destroy() {
      chat?.destroy()
      chat = null
      sessionId = null
      sessionKey = null
      element.remove()
    },
  }
}
