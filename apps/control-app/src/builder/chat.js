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
 * A TURN IS NOT OVER BECAUSE ITS STREAM STOPPED ([[BUG-123]]). The two endings
 * are indistinguishable from in here — a reply that finished and a socket that
 * died both arrive as silence — so when `webui-chat` reports one without its
 * terminal marker, this pane goes back to the origin and asks. That is the only
 * place the difference is known, and it is a question the operator used to have
 * to ask by reloading the page. See {@link chaseLostTurn}.
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
import { sentPrompts } from './sent-prompts.js'
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
 * How long to wait before each attempt at finding out what became of a lost
 * turn, and — by its length — how many attempts there are ([[BUG-123]]).
 *
 * THE FIRST WAIT IS NOT ZERO, and that is the one that matters. The commonest
 * reason a stream stops is that the origin's turn ENDED badly — the isolate went
 * away mid-drain, an enqueue threw — and the record of that ending is written in
 * a `finally` which is still running when the client notices the silence. Asking
 * immediately would read the conversation as it was a moment BEFORE the answer
 * landed, and repaint a turn that is about to be complete as a turn that is not.
 *
 * THEY GROW, because the second and third attempts are for a different failure:
 * an origin that is genuinely unreachable. Asking a struggling origin three
 * times in a second is a way of making sure it stays struggling.
 *
 * THREE, because the pane is standing in front of an operator watching a reply
 * that has stopped. A longer ladder is a longer stall, and beyond a few seconds
 * a sentence saying what happened is worth more than another silent attempt.
 */
const RECOVERY_BACKOFF_MS = [400, 1500, 4000]

/**
 * How many separate losses of ONE conversation's turns are chased before the
 * pane stops chasing ([[BUG-123]]).
 *
 * A SECOND BOUND BECAUSE IT BOUNDS A SECOND THING. {@link RECOVERY_BACKOFF_MS}
 * is how hard one chase tries to reach an origin that is not answering. This is
 * how many times a chase that DID reach it, rejoined, and then lost the rejoined
 * stream too, is allowed to go round again — the ping-pong the ladder above
 * cannot see, because each leg of it looks like a fresh first failure.
 *
 * SPENT PER CONVERSATION AND REFILLED BY A PROMPT. An exhausted budget describes
 * a connection that was failing a minute ago, and the operator pressing Send is
 * them asking for it to be tried again.
 */
const RECOVERY_CHASES = 3

/**
 * Mount the pane.
 *
 * @param {object} [options]
 * @param {Storage} [options.storage]   per-instance draft persistence, and the
 *   submissions no transcript has accounted for yet ([[BUG-122]]) — one store,
 *   because the second is what the first stops holding at the moment of submit
 * @param {object}  [options.transport] `{streamPrompt, streamReattach}` — injected
 *   by tests. A transport with no `streamReattach` simply never rejoins, which
 *   is what keeps every existing caller working unchanged.
 * @param {() => Promise<object>} [options.reopen]
 *   RE-READ THIS CONVERSATION, answering the same shape {@link setSession} takes
 *   ([[BUG-123]]). Called when a turn's stream stops without ending the turn, to
 *   find out from the origin what actually became of it.
 *
 *   IT IS THE HOST'S HALF AND NOT THIS PANE'S TRANSPORT, on exactly the split
 *   (REQ-127) that put `openSession` in `app.js` in the first place: opening a
 *   conversation names a SITE, or the business scope, and this pane knows
 *   neither — it knows a session id, which `/api/ai/session` does not take.
 *   Running a turn is the pane's because only the pane knows when one started;
 *   asking what became of one is the host's for the same reason the first open
 *   was.
 *
 *   A HOST THAT PASSES NONE keeps every behaviour it had. It simply cannot be
 *   told what became of a lost turn — and the panel says so in the conversation
 *   rather than stalling silently, which is the half of this that is an
 *   improvement even with no seam wired.
 * @param {(ms: number) => Promise<void>} [options.wait] how a recovery pauses
 *   between attempts ([[BUG-123]]). A seam for tests only: real time is the
 *   default, and a suite that had to spend {@link RECOVERY_BACKOFF_MS} of it per
 *   assertion would be a suite nobody runs.
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
    reopen = null,
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
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

  /**
   * Whether a lost turn is currently being chased, and how many times this
   * conversation has chased one ([[BUG-123]]).
   *
   * TWO VALUES AND NOT ONE, because they bound different things. `chasing` stops
   * two chases running at once — a recovery that loses its own stream fires
   * `onTurnLost` again, and a second chase started underneath the first would
   * ask the origin twice and hand two tails to one bubble. `chases` is the
   * budget: each loss costs one, and an origin that keeps dropping the turn runs
   * out rather than being asked forever.
   */
  let chasing = false
  let chases = 0

  /** Say something in the panel's own voice — a failure, or why it is frozen. */
  function note(text) {
    chat?.appendMessage('assistant', `_${text}_`)
  }

  /**
   * A turn of this conversation that did not finish ([[BUG-121]]).
   *
   * THE FAILURE THIS IS FOR. The operator typed a long message, watched a reply
   * begin, and went to look at something else. Nothing about that turn reached the
   * transcript — not the reply, not their own words — so the conversation they came
   * back to was byte-identical to the one they left, and the honest reading of that
   * screen is that the assistant ignored them.
   *
   * TWO CASES, AND THE ORIGIN HAS ALREADY DECIDED WHICH — see `host-core.ts`'s
   * `InterruptedTurn`. `recorded` false means this text is in no transcript and
   * this is the only copy of it; true means the turn's records did land and what is
   * painted above is a fragment of a reply rather than a short one.
   *
   * THE WORDS GO BACK IN THE COMPOSER, not just on the screen. What the operator
   * lost that they could not reconstruct is the PROMPT — a long one, typed once —
   * so painting it as history and leaving them to re-type it would answer the
   * smaller half of the complaint. One keystroke from re-sent is the point.
   *
   * AND ONLY INTO AN EMPTY COMPOSER. `mountChat` restores its own per-conversation
   * draft, and a draft is something the operator typed more recently than this;
   * overwriting it to hand back an older message would lose the newer one. When
   * there is a draft the message is still on screen to copy from.
   */
  function paintInterrupted(interrupted) {
    if (!interrupted || !chat) return
    if (interrupted.recorded) {
      // The prompt and the fragment are both above already. What is missing is
      // the fact that the reply stopped rather than ended.
      note('That turn was interrupted — the reply above is not all of it. Ask again to pick it up.')
      return
    }
    chat.appendMessage('user', interrupted.text)
    note(
      'That turn was interrupted and nothing of it was recorded — not even your message, ' +
        'until now. It is back in the box below, ready to send again.',
    )
    // NOT AWAITED, like the rejoin below it: the composer's rich editor loads
    // asynchronously and this function is part of a synchronous swap. A failure
    // costs the restore and nothing else — the text is painted either way.
    Promise.resolve(chat.inputReady)
      .then(() => {
        if ((chat?.getInputMarkdown() ?? '').trim() === '') chat?.setInputMarkdown(interrupted.text)
      })
      .catch(() => {})
  }

  /**
   * Hand back everything this browser submitted that no transcript accounts for
   * ([[BUG-122]]).
   *
   * THE HALF `paintInterrupted` CANNOT REACH. The origin's record is written
   * before the model is called, so it covers every turn the origin got to start;
   * what is left over is a submission it never heard of — a request that failed
   * in the network or was refused, a turn whose record a later turn replaced, or
   * a message the panel QUEUED, which this builder has no transport for and
   * therefore drops. In all of them the composer has already deleted the draft,
   * so the only surviving copy is the one {@link sentPrompts} kept.
   *
   * THE SAME TWO MOVES, FOR THE SAME REASON. The words go on screen, as the
   * operator's, so the conversation accounts for the gap rather than denying it;
   * and the most recent goes back in the box, because what cannot be
   * reconstructed is the typing. Painted oldest first, so the thread reads in the
   * order it was written.
   *
   * ONLY INTO AN EMPTY COMPOSER, and forgotten only once it is in one. A draft is
   * something the operator typed more recently, so overwriting it would turn a
   * rescue into a second loss; and the restored text is then held by the
   * composer's OWN draft persistence, which is durable across the next reload —
   * which is what makes dropping our copy at that moment safe rather than merely
   * tidy. An entry that could not be restored is kept, and offered again.
   */
  function paintUnsent(entries, sent) {
    if (entries.length === 0 || !chat) return
    for (const entry of entries) chat.appendMessage('user', entry.text)
    note(
      entries.length === 1
        ? 'That message is in no transcript — nothing of the turn it was sent to survived, ' +
            'not even your words, until now. It is back in the box below, ready to send again.'
        : `Those ${entries.length} messages are in no transcript — nothing of the turns they ` +
            'were sent to survived, not even your words, until now. The last of them is back ' +
            'in the box below.',
    )
    const latest = entries.at(-1)
    // NOT AWAITED, exactly as above: the composer's rich editor loads
    // asynchronously and this runs inside a synchronous swap.
    Promise.resolve(chat.inputReady)
      .then(() => {
        if ((chat?.getInputMarkdown() ?? '').trim() !== '') return
        chat.setInputMarkdown(latest.text)
        sent.forget(latest)
      })
      .catch(() => {})
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
   * `interrupted` is the turn that did not finish ([[BUG-121]]) — see
   * {@link paintInterrupted}, which is where the two cases are told apart.
   *
   * @param {{sessionId: string, turns?: {role: string, markdown: string}[],
   *          cursor?: number, live?: boolean,
   *          ready?: boolean, error?: string,
   *          interrupted?: {text: string, at: string, recorded: boolean}} | null} session
   * @param {string} [key] identity of the conversation to the caller; defaults
   *   to the session id, which is what it means where nothing wider is in scope.
   */
  function setSession(session, key) {
    const next = session ? (key ?? session.sessionId) : null
    if (next === sessionKey) return
    sessionKey = next
    sessionId = session?.sessionId ?? null
    // A NEW CONVERSATION GETS THE WHOLE BUDGET ([[BUG-123]]). The chases a
    // previous conversation spent are a fact about that conversation's origin,
    // not about this one's.
    chases = 0
    paint(session)
  }

  /**
   * Draw a conversation into a freshly-mounted panel.
   *
   * SPLIT OUT OF {@link setSession} RATHER THAN COPIED ([[BUG-123]]), because a
   * turn whose stream died has to be REDRAWN from a transcript the origin has
   * just re-read — and a second painting path is how the rejoin, the unsent
   * rescue and the interrupted notice come to disagree about what a conversation
   * looks like. The caller decides WHICH conversation is on screen; this decides
   * what is on it.
   *
   * IT IS A REMOUNT, which is this file's answer to "repaint" everywhere else
   * (see the header): `mountChat` renders each message as it is appended and
   * offers no way to empty itself. A remount is also why a redraw costs the
   * operator nothing they typed — the composer persists its draft under the
   * panel id on every keystroke, and the id is the conversation's, unchanged.
   */
  function paint(session) {
    chat?.destroy()
    chat = null
    element.replaceChildren()
    if (!session) return

    const next = sessionKey
    const id = session.sessionId
    // KEYED LIKE THE DRAFT IT TAKES OVER FROM ([[BUG-122]]) — the conversation,
    // not the wire id, so a submission that never landed comes back under the
    // business it was written for.
    const sent = sentPrompts(storage, next)
    chat = mountChat(element, {
      // KEYED ON THE CONVERSATION, NOT THE WIRE ID. This is also the composer's
      // draft key, so a half-typed message stays with the business it was typed
      // under rather than surfacing under another business's same-named site.
      id: `${CHAT_ID_PREFIX}${next}`,
      emptyText: EMPTY_TEXT,
      toolPane: true,
      ...(storage ? { storage } : {}),
      sendPrompt: (text) => {
        const wire = expandPrompt(text)
        // BEFORE THE REQUEST EXISTS ([[BUG-122]]). The composer deleted its draft
        // a moment ago, on submit; this is the copy that outlives a fetch which
        // never resolves, and it has to be written before anything can fail.
        sent.remember(text, wire)
        // A TURN THE OPERATOR STARTED IS A FRESH BUDGET ([[BUG-123]]). The
        // chases spent on an earlier turn describe an origin that was
        // unreachable then; a new prompt is the operator asking again, and
        // answering it with an exhausted budget would make one bad minute
        // permanent for the life of the page.
        chases = 0
        return watchForWrites(transport.streamPrompt(id, wire), told)
      },
      // THE STREAM STOPPED WITHOUT ENDING THE TURN ([[BUG-123]]). `webui-chat`
      // has kept the bubble, marked it, and declined to offer a resend, because
      // from where it stands the turn's fate is UNKNOWN. This pane is the half
      // that can find out — it has an origin to ask.
      onTurnLost: (lost) => void chaseLostTurn(lost),
      // THE OTHER TWO SUBMIT INTENTS ([[BUG-122]]). `webui-chat` routes a submit
      // made WHILE THE ASSISTANT IS STREAMING to its queue, and this pane passes
      // no queue transport — so that text is echoed as pending and then dropped,
      // with the draft already gone. Remembering it is the whole of what this
      // pane can honestly do about that today: the words are recoverable on the
      // next load even though the turn never ran.
      onQueue: (text) => sent.remember(text, expandPrompt(text)),
      onInterject: (text) => sent.remember(text, expandPrompt(text)),
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
    paintInterrupted(session.interrupted)
    // AFTER IT, AND RECONCILED AGAINST THE SAME TWO THINGS ([[BUG-122]]): the
    // transcript just painted, and the record the origin is already handing back.
    // A submission either of them accounts for is dropped rather than repeated.
    paintUnsent(sent.reconcile(turns, session.interrupted), sent)
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
      //
      // AND SINCE [[BUG-123]] IT OFTEN COSTS NOTHING AT ALL: a tail that stops
      // without ending the turn reaches `onTurnLost`, and the chase started
      // there asks the origin and either rejoins again or repaints. This catch
      // is now only for a `streamReattach` that rejects before yielding
      // anything, which the widget never sees and therefore never reports.
    })
  }

  /**
   * Go and find out what became of a turn whose stream stopped ([[BUG-123]]).
   *
   * THE FAILURE THIS IS FOR. A reply was arriving and then it was not. The
   * socket died, the tab slept, an intermediary reaped an idle connection — and
   * until now the panel simply stopped painting, with no sign that anything was
   * wrong beyond a reply that trails off mid-sentence. The operator's only move
   * was to reload, which is itself destructive ([[BUG-122]]) and is how they came
   * to lose a long prompt. This is the pane doing by itself the thing they were
   * reloading to do.
   *
   * IT IS THE MISSING HALF OF [[BUG-46]], NOT A SECOND MECHANISM. That ticket
   * taught the pane to rejoin a turn AT MOUNT, from the `live` + `cursor` a
   * freshly-opened session hands out. Everything it needs is already here; what
   * was absent is anybody asking a SECOND time. So this asks — through the same
   * `reopen`, into the same `paint`, onto the same `streamReattach`.
   *
   * WHY THE ORIGIN IS ASKED RATHER THAN ASSUMED. The two endings look identical
   * from here: a stream that stopped because the turn finished and one that
   * stopped because the connection did produce the same silence. Only the origin
   * knows which, and it already answers the question — `/api/ai/session` returns
   * `live`, and has since [[BUG-46]].
   *
   * WHAT IT DOES WITH EACH ANSWER.
   *
   *   - `live` — the turn is still being written. Rejoin from the cursor and
   *     hand the tail to `resume`, which ADOPTS the lost bubble: the half
   *     already painted and the half still coming are one message, wearing no
   *     notice, rather than a reply broken across two with an apology between
   *     them.
   *   - not `live` — the turn is over, and the transcript in hand is the honest
   *     account of it. Repaint from that. A text-offset partition is NOT
   *     available as an alternative: the cursor is a junction offset, not a byte
   *     offset into the reply, so there is no way to say "the reply from here
   *     on" — which is why the whole conversation is redrawn rather than the
   *     bubble patched.
   *
   * AND IT SAYS NOTHING ON THE WAY PAST. A repaint that succeeded needs no
   * narration: either the reply is now whole, or the origin's own `interrupted`
   * notice is in the transcript being painted ([[BUG-121]]) and says the true
   * thing — *the reply above is not all of it* — better than a second sentence
   * from here would. The panel speaks only when it has genuinely failed, which
   * is the one outcome the operator cannot see for themselves.
   *
   * BOUNDED, because the origin may be the thing that is broken. A few attempts,
   * spaced, and then a sentence in the conversation rather than a pane that
   * retries forever behind a reply that stopped.
   */
  async function chaseLostTurn(lost) {
    if (chasing || !chat) return
    if (typeof reopen !== 'function') {
      // A HOST THAT SUPPLIED NO SEAM CANNOT BE RECOVERED FOR, and saying so is
      // better than the silence this ticket exists to end. Only this pane's own
      // hosts pass `reopen`; a caller that predates it behaves exactly as it did
      // before, minus the stall being unexplained.
      note('The connection to that reply was lost. Reload the builder to see where the turn got to.')
      return
    }
    if (chases >= RECOVERY_CHASES) {
      note(
        'The connection to that reply keeps dropping and the conversation could not be ' +
          're-read. Reload the builder to see where the turn got to.',
      )
      return
    }
    chases += 1
    chasing = true
    // CAPTURED, NOT READ LATER — the same guard `setSession` is built around and
    // `app.js` spells out as a generation token. Every await below is a window in
    // which the operator can switch site, and an answer for the conversation they
    // left must not be painted into the one they are looking at.
    const key = sessionKey

    /**
     * Whether the answer about to arrive is still about what is on screen.
     *
     * TWO WAYS TO BE TOO LATE, and both are ordinary. The operator can switch
     * site, which swaps the conversation out from under an in-flight re-read;
     * and — because [[BUG-58]] RELEASES THE COMPOSER on a lost turn rather than
     * holding it — they can simply send the next prompt while this is still
     * asking. The second is the more dangerous: a repaint would destroy the
     * bubble of a turn that is streaming right now, and a rejoin would be
     * `resume` silently declining behind a turn already in flight. Either way
     * the operator has moved on, and recovery of the turn they left is no longer
     * something they are waiting for.
     */
    const overtaken = () => sessionKey !== key || !chat || chat.isStreaming()

    try {
      let failure = null
      for (const pause of RECOVERY_BACKOFF_MS) {
        await wait(pause)
        if (overtaken()) return
        let session
        try {
          session = await reopen()
        } catch (err) {
          // KEPT AND RETRIED. One refusal is a bad moment, not an answer; the
          // last one is what the operator is told about if every attempt fails.
          failure = err
          continue
        }
        if (overtaken()) return
        // THE ORIGIN'S OWN ID WINS. It is derived from the site and has been
        // stable across every re-open so far, but the value a reattach is
        // addressed to belongs to the conversation the origin just described, not
        // to this pane's memory of an earlier answer.
        const id = session?.sessionId ?? sessionId
        sessionId = id
        if (session?.live === true && typeof transport.streamReattach === 'function') {
          // RELEASED BEFORE THE REJOIN, not after. `resume` runs for as long as
          // the turn does, and a tail that dies too loses the turn again — which
          // has to be able to start the next chase rather than finding the door
          // held by the one that set it up.
          chasing = false
          Promise.resolve(
            chat.resume(watchForWrites(transport.streamReattach(id, session.cursor), told), {
              // THE PANEL'S OWN PARTIAL, not the transcript's. What `resume`
              // continues is the bubble on screen, and the origin's fold stops at
              // the cursor the tail is about to resume FROM — so seeding from the
              // transcript would repaint text the tail is not going to resend and
              // drop everything painted after the fold.
              markdown: lost?.markdown ?? '',
            }),
          ).catch(() => {
            // The loss is reported through `onTurnLost`, which is where the next
            // chase starts. Nothing to add here.
          })
          return
        }
        // OVER. The transcript just read is what the turn amounted to.
        paint(session)
        return
      }
      note(
        'The connection to that reply was lost and the conversation could not be re-read' +
          `${failure?.message ? ` (${failure.message})` : ''}. ` +
          'Reload the builder to see where the turn got to.',
      )
    } finally {
      chasing = false
    }
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
