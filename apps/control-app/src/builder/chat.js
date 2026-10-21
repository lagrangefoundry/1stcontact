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
import {
  CHAT_MAX_SUBMISSION_CHARS,
  CHAT_NEWS_WAITING,
  CHAT_OVER_LONG_MESSAGE,
  CHAT_START,
  CHAT_START_FAILED,
} from './config.js'
import {
  interposeChatMessage,
  openChatConversation,
  reportAbsorbed,
  stopChat,
  streamChatCue,
  streamChatPrompt,
  streamChatReattach,
} from './api.js'
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
 * `host-core.ts`'s `PLAN_CHANGED` ([[REQ-364]]): an agent wrote the site's plan, so
 * the plan panel re-reads it.
 */
const PLAN_CHANGED = 'plan_changed'

/**
 * `show-core.ts`'s `SHOW_CLIENT` ([[REQ-413]]): the consultant switched the
 * client's view. `meta.href` is the target's `#show=…` link. Delivered live and
 * never recorded, so a reloaded transcript shows the line and does not switch.
 */
const SHOW_CLIENT = 'show_client'

/**
 * Not a wire kind: the key {@link watchForWrites} tells when a turn's `done` frame
 * passes ([[REQ-364]]). The frame itself still goes on to the component.
 */
const TURN_ENDED = Symbol('turn_ended')

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
 * The host's event kind for a round's status ([[REQ-360]], [[REQ-416]]). Its
 * meaning is `progress-core.ts`'s `PROGRESS`; this is the same string on the
 * client's side of the wire. `webui-chat`'s status widget (lagrange-framework
 * REQ-209) draws it — "The consultant is building …", the time and Stop building
 * — and reads its fields off the frame itself, so {@link talkDesk} lifts them out
 * of `meta`.
 */
const PROGRESS = 'progress'

/**
 * `progress-core.ts`'s `TALKER` ([[REQ-416]]): a talker round's records, carried on
 * the stream of the work it was opened beside. `meta.event` is `start`, `text` or
 * `done`.
 */
const TALKER = 'talker'

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
    if (event?.kind === 'done') {
      try {
        told.get(TURN_ENDED)?.()
      } catch {
        // Deliberately swallowed; see above.
      }
    }
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

/**
 * [[REQ-416]] — the client's messages to the talker, and the replies to them.
 *
 * WHILE THE CONSULTANT WORKS, A MESSAGE IS ANSWERED BESIDE THE WORK
 * (lagrange-framework REQ-210). `webui-chat`'s composer sends it through
 * `sendPrompt`, which hands it here: the origin keeps it (`/api/ai/interpose`),
 * the isolate running the work opens a talker for it, and the talker's reply comes
 * back on THAT turn's stream — the only place it can, because the talker lives
 * where the work does. {@link wrap} takes the reply off the work's stream and
 * {@link talk} streams it into the message's bubble.
 *
 * A MESSAGE THE WORK ENDED BEFORE TAKING is not lost: when no stream of work is
 * left open it runs as the next prompt, naming its id so the origin retires it,
 * and that turn streams into the same bubble.
 *
 * `onBusy` is told when the first stream of work opens and the last one closes,
 * which is what animates the plan panel's current stage.
 *
 * [[BUG-245]] — ONE VOICE, ONE THING AT A TIME. Once the consultant has gone to
 * work (its first `progress`), what it says while the client has unsent text in
 * the box (`typing`) — or while a talker reply is being written — is not shown at
 * all: it is the work's news, and the consultant's next reply carries it, after
 * answering what the client said. `onAbsorbed` is told the round and the words.
 * Otherwise the result shows as it arrives, as it always did.
 */
function talkDesk({ transport, onBusy, told, typing = () => false, onCued = () => {}, onAbsorbed = () => {} }) {
  /** Streams of work open in this panel: each one may carry a talker's reply. */
  let open = 0
  /** [[BUG-240]] — the host-cued talker replies arriving, by round: their text so far. */
  const cued = new Map()
  /** [[BUG-245]] — talker rounds being written now, by turn id. */
  const talking = new Set()
  /** Messages sent to the talker, each waiting for its reply. */
  const waiting = []
  /** [[BUG-224]] — messages the origin already holds, by text, adopted rather than re-sent. */
  let adopted = new Map()

  const wake = (entry) => {
    const next = entry.wake
    entry.wake = null
    next?.()
  }
  const busy = (on) => {
    try {
      onBusy(on)
    } catch {
      // The plan panel's spinner is not the turn's business.
    }
  }
  /** The waiting message a talker frame answers: by id, else the first by its words. */
  function entryFor(meta) {
    if (meta.message_id) {
      const byId = waiting.find((e) => e.id === meta.message_id)
      if (byId) return byId
    }
    if (meta.turn_id) {
      const byTurn = waiting.find((e) => e.turnId === meta.turn_id)
      if (byTurn) return byTurn
    }
    if (meta.event !== 'start') return null
    const said = String(meta.said ?? '').trim()
    return waiting.find((e) => e.turnId === '' && e.wire.trim() === said) ?? null
  }
  /**
   * [[BUG-240]] — A REPLY THE HOST CUED answers the client's message the work
   * started from, which already has its bubble, so it is drawn as the
   * consultant's next message once it is whole. One that passed, or said
   * nothing, is not drawn at all.
   */
  function routeCued(event, meta) {
    const turnId = String(meta.turn_id ?? '')
    if (meta.event === 'start') cued.set(turnId, '')
    else if (meta.event === 'text') cued.set(turnId, (cued.get(turnId) ?? '') + (event.content ?? ''))
    else if (meta.event === 'done') {
      const said = cued.get(turnId) ?? ''
      cued.delete(turnId)
      if (meta.passed !== true && said.trim() !== '') {
        try {
          onCued(said)
        } catch {
          // A reply drawn wrong is not the work's business.
        }
      }
    }
  }
  function route(event) {
    const meta = event.meta ?? {}
    const turnId = String(meta.turn_id ?? '')
    if (meta.event === 'start') talking.add(turnId)
    else if (meta.event === 'done') talking.delete(turnId)
    if (meta.cued === true || cued.has(turnId)) {
      routeCued(event, meta)
      return
    }
    const entry = entryFor(meta)
    if (!entry) return
    if (meta.event === 'start') {
      entry.turnId = String(meta.turn_id ?? '')
      entry.frames.push({ kind: 'turn_start', turn_id: entry.turnId })
    } else if (meta.event === 'text') {
      entry.frames.push({ kind: 'text', content: event.content ?? '' })
    } else if (meta.event === 'done') {
      entry.frames.push({ kind: 'done', meta: { status: meta.status } })
    }
    wake(entry)
  }

  /**
   * A stream of work, with the talker's frames taken off it and the status
   * widget's fields lifted out of `meta`. Its own `done` is held until the stream
   * really ends, because a talker reply can still arrive after the work's result.
   */
  function wrap(events) {
    // COUNTED WHEN WRAPPED, not when first read: a message adopted on a reload is
    // handed to the talker in the same tick the rejoin is set up, before its
    // stream has been pulled once.
    open += 1
    if (open === 1) busy(true)
    return unwrapped(events)
  }
  async function* unwrapped(events) {
    let done = null
    // [[BUG-245]] — the round at work, its words the client was not shown, and the
    // text after its last tool call while a talker had the client (REQ-210's
    // forked result), which is decided on when the round ends.
    let working = false
    let turnId = ''
    let absorbing = false
    const withheld = []
    let tail = ''
    const elsewhere = () => typing() || talking.size > 0 || cued.size > 0
    try {
      for await (const event of events) {
        if (event?.kind === TALKER) {
          route(event)
          continue
        }
        if (event?.kind === PROGRESS) {
          working = true
          turnId ||= String(event.meta?.turn_id ?? '')
          yield { ...event, ...(event.meta ?? {}) }
          continue
        }
        if (event?.kind === 'done') {
          done = event
          continue
        }
        if (event?.kind === TOOL_ACTIVITY) tail = ''
        if (event?.kind === 'text' && (event.forked || event.meta?.forked)) {
          tail += event.content ?? ''
          continue
        }
        if (event?.kind === 'text' && working && (absorbing || elsewhere())) {
          // ONCE ABSORBING, THE REST OF THE ROUND IS TOO: news is never cut in half.
          absorbing = true
          withheld.push(event.content ?? '')
          continue
        }
        yield event
      }
      // THE FORKED RESULT, at the round's end: news if the client is writing or a
      // talker is, else shown — `webui-chat` draws it as a bubble of its own.
      if (tail.trim() !== '') {
        if (absorbing || elsewhere()) withheld.push(tail)
        else yield { kind: 'text', content: tail, meta: { forked: true } }
      }
      const news = withheld.join('').trim()
      if (news !== '') {
        try {
          onAbsorbed(turnId, news)
        } catch {
          // Telling the origin is not the turn's business.
        }
      }
    } finally {
      open -= 1
      if (open === 0) {
        busy(false)
        for (const entry of waiting) if (entry.turnId === '') wake(entry)
      }
    }
    if (done) yield done
  }

  /**
   * One message to the talker, as the stream of its reply. `wire` is what is sent;
   * the reply is drawn by `webui-chat` into the bubble under the message.
   */
  async function* talk(sessionId, text, wire, promptView) {
    const entry = { id: '', wire, turnId: '', frames: [], wake: null }
    waiting.push(entry)
    try {
      const held = adopted.get(text.trim())
      if (held !== undefined) adopted.delete(text.trim())
      entry.id = held ?? (await transport.interpose(sessionId, wire))
      for (;;) {
        while (entry.frames.length > 0) {
          const frame = entry.frames.shift()
          yield frame
          if (frame.kind === 'done') return
        }
        if (entry.turnId === '' && open === 0) {
          // NOTHING LEFT TO OPEN A TALKER: the next prompt, naming the message.
          for await (const event of watchForWrites(
            wrap(transport.streamPrompt(sessionId, wire, promptView(), [entry.id])),
            told,
          )) {
            yield event
          }
          return
        }
        await new Promise((resolve) => {
          entry.wake = resolve
        })
      }
    } finally {
      waiting.splice(waiting.indexOf(entry), 1)
    }
  }

  return {
    wrap,
    talk,
    /** Whether a stream of work is open, so a message now goes to the talker. */
    isOpen: () => open > 0,
    /** [[BUG-224]] — the messages the origin is holding, for a fresh paint. */
    adopt(messages) {
      adopted = new Map(messages.map((m) => [m.text.trim(), m.id]))
    },
  }
}

/** `webui-chat`'s frame kind for a tool call; a forked result is the text after the last one. */
const TOOL_ACTIVITY = 'tool_activity'

/** [[BUG-245]] — how often a waiting cue looks again for a free panel. */
const CUE_WAIT_MS = 500

/** Per-session instance id — also the key the composer's draft persists under. */
export const CHAT_ID_PREFIX = 'builder-chat:'

/** Shown before the pane has a conversation to display. */
const EMPTY_TEXT = 'Ask for a change to your site.'

/** [[REQ-403]] — the start screen of a brand-new conversation, and its button. */
export const START_CLASS = 'builder-chat-start'

/**
 * [[REQ-403]] — how the introduction is typed out: this many words at a time,
 * this many milliseconds apart. Fast enough that a minute's reading appears in a
 * few seconds; slow enough to read as the consultant writing.
 */
const TYPE_WORDS = 3
const TYPE_MS = 40

/** The introduction as stream frames, a few words at a time ([[REQ-403]]). */
async function* typedOut(markdown, wait) {
  const words = String(markdown).split(/(?<=\s)/)
  for (let i = 0; i < words.length; i += TYPE_WORDS) {
    yield { kind: 'text', content: words.slice(i, i + TYPE_WORDS).join('') }
    await wait(TYPE_MS)
  }
  yield { kind: 'done', meta: { status: 'complete' } }
}

/** A group chat with nothing said in it yet ([[REQ-357]]). */
const ROOM_EMPTY_TEXT = 'Say what you would like — the consultant and the coordinator are both here.'

/** What a contribution the room recorded about a participant carries ([[REQ-357]]). */
const ROOM_NOTE = 'Recorded by the room — not something this participant said.'

/** Said when the client writes while an exchange is still running ([[REQ-357]]). */
const ROOM_BUSY_TEXT =
  'The room is still talking. Your message is back in the box — send it when they finish, or press Stop.'

/** The kinds an exchange's stream carries that this pane reads ([[REQ-357]]). */
const ROOM_POST = 'room_post'
/** A member's round ended — its private session has a new turn stored ([[BUG-177]]). */
const MEMBER_DONE = 'member_done'

/**
 * An exchange's events, as the frames `webui-chat`'s follow mode draws
 * ([[REQ-357]]).
 *
 * A room post opens an attributed turn; the exchange's own end closes the last
 * one. A member's own events — what it streams while deliberating, its round's
 * end — are dropped: they are its private session, not the room. Text that
 * belongs to no member (a refusal, an error) is passed through, so it is said in
 * the conversation rather than lost.
 *
 * `onActivity` is told when a member's round ends and when the exchange ends
 * ([[BUG-177]]) — the two moments a member's private session has something new
 * stored. Told BEFORE the `done` frame is yielded, because a reader may stop
 * pulling at `done`.
 */
export async function* roomFrames(events, onActivity = () => {}) {
  const tell = () => {
    try {
      onActivity()
    } catch {
      // The host's reaction cannot break the conversation.
    }
  }
  for await (const event of events) {
    if (event?.kind === ROOM_POST) {
      const meta = event.meta ?? {}
      yield {
        kind: 'turn_start',
        role: meta.role === 'user' ? 'user' : 'assistant',
        content: event.content ?? '',
        speaker: meta.speaker ?? '',
        ...(meta.ts ? { ts: meta.ts } : {}),
        ...(meta.turn_id ? { turn_id: meta.turn_id } : {}),
        ...(meta.passed ? { passed: true } : {}),
      }
      continue
    }
    if (event?.meta?.member) {
      if (event.kind === MEMBER_DONE) tell()
      continue
    }
    if (event?.kind === 'done') {
      tell()
      yield { kind: 'done', status: event.meta?.status ?? 'complete' }
      continue
    }
    yield event
  }
}

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
 * @param {() => void} [options.onRoomActivity]
 *   [[BUG-177]] — in a group chat, a member's round ended or the exchange did.
 *   The pane draws only the room; what each member said privately is the host's
 *   to show (the Debug tab), and this is when it has changed.
 * @param {() => void} [options.onPlanChanged]
 *   [[REQ-364]] — an agent wrote the site's plan during the turn.
 * @param {() => void} [options.onTurnEnd]
 *   [[REQ-364]] — a turn (or a room's exchange) ended.
 * @param {(meta: {href: string, label: string}) => void} [options.onShow]
 *   [[REQ-413]] — the consultant switched the client's view during the turn.
 * @param {(busy: boolean) => void} [options.onBusy]
 *   [[REQ-390]] — the consultant started working, or stopped ([[REQ-416]]: the
 *   first stream of work opened, or the last one closed).
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
 * @param {() => ({width: number, height?: number, mode: string} | null)} [options.promptView]
 *   [[REQ-388]] — the width the client is viewing the draft at, read at the
 *   moment of each submission and sent with it. A seam for the same reason
 *   `expandPrompt` is one: this pane knows nothing about the preview beside it,
 *   only that a turn carries what the host says it carries.
 * @param {(href: string, link: HTMLAnchorElement) => boolean} [options.onLinkClick]
 *   [[REQ-391]] — the reader clicked a link in the transcript. The host answers
 *   true when it handled the link itself (a set of looks to open in the
 *   preview), and the browser does not follow it. [[REQ-413]] — given the link
 *   too, so the host can say beside it when what it names is no longer there.
 * @param {object} [options.attachments]
 *   [[REQ-414]] — the composer's attachment tray (`attachments.js`). Bound above
 *   the composer on every paint, so its chips go with the next message; and its
 *   attachment lines are drawn as chips inside the client's bubbles. Absent, the
 *   pane has no attachments — the settings conversation's case.
 * @param {HTMLElement} [options.statusContainer]
 *   [[BUG-244]] — where the status widget (what the consultant is doing, the
 *   elapsed time, Stop building) is drawn: lagrange-framework REQ-214's
 *   `statusContainer`. Absent, it sits above the composer.
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
    transport = {
      streamPrompt: streamChatPrompt,
      streamReattach: streamChatReattach,
      openConversation: openChatConversation,
      stop: stopChat,
      interpose: interposeChatMessage,
      absorbed: reportAbsorbed,
      cue: streamChatCue,
    },
    onSiteChanged = () => {},
    onBusinessChanged = () => {},
    onDnsChanged = () => {},
    onRoomActivity = () => {},
    onPlanChanged = () => {},
    onTurnEnd = () => {},
    onShow = () => {},
    onBusy = () => {},
    expandPrompt = (markdown) => markdown,
    promptView = () => null,
    onImageClick = null,
    onLinkClick = null,
    attachments = null,
    statusContainer = null,
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
    // [[REQ-364]] — the plan panel's two moments: an agent wrote the plan, and a
    // turn ended.
    [PLAN_CHANGED, onPlanChanged],
    [TURN_ENDED, onTurnEnd],
    // [[REQ-413]] — the consultant put something in front of the client.
    [SHOW_CLIENT, onShow],
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

  // [[REQ-391]] — the same delegation, for a link the host may want to act on
  // itself rather than follow: it answers true when it has, and the browser's
  // own navigation is then cancelled.
  if (onLinkClick) {
    element.addEventListener('click', (ev) => {
      const link = ev.target?.closest?.('a[href]')
      if (!link) return
      if (onLinkClick(link.getAttribute('href') ?? '', link)) ev.preventDefault()
    })
  }

  let chat = null
  let sessionId = null
  let sessionKey = null
  // [[REQ-414]] — the tray sits above whichever composer is mounted, and the
  // client's bubbles show what was attached, under the pane's own root so a
  // remount is covered as well as the first paint.
  let unbindAttachments = null
  const undecorate = attachments?.decorate(element) ?? null

  /**
   * [[BUG-245]] — THE WORK'S NEWS WAITS QUIETLY, NOT AS A MESSAGE. A result that
   * arrived while the client was writing is not drawn; this line says the work is
   * done, beside the progress banner where the status widget was, until the
   * client's next message — whose reply carries the news.
   */
  const news = document.createElement('div')
  news.className = 'builder-chat-news'
  news.setAttribute('role', 'status')
  news.textContent = CHAT_NEWS_WAITING
  news.hidden = true
  const showNews = (on) => {
    news.hidden = !on
    if (on && !news.isConnected) {
      if (statusContainer) statusContainer.append(news)
      else element.querySelector('.chat-widget-input-bar')?.before(news)
    }
  }

  /** [[REQ-416]] — the talker's messages and replies; see {@link talkDesk}. */
  // [[BUG-240]] — and a reply the host cued, drawn as the consultant's next message.
  const desk = talkDesk({
    transport,
    onBusy,
    told,
    // [[BUG-245]] — the client is mid-answer: there is unsent text in the box.
    typing: () => (chat?.getInputMarkdown?.() ?? '').trim() !== '',
    onCued: (markdown) => chat?.appendMessage('assistant', markdown, at(new Date().toISOString())),
    onAbsorbed: (turnId, text) => {
      showNews(true)
      if (sessionId) void Promise.resolve(transport.absorbed?.(sessionId, turnId, text)).catch(() => {})
    },
  })

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
   * The turn metadata for a recorded moment, or nothing at all ([[BUG-138]]).
   *
   * WHY EVERY STAMPED CALL GOES THROUGH ONE FUNCTION. `appendMessage`'s third
   * argument is an open envelope, and the difference between passing `undefined`
   * and passing `{ ts: undefined }` is the difference between "this turn has no
   * moment" and "this turn has a moment, which is nothing" — the first renders as
   * the panel always did, the second is a metadata object the component now has
   * to carry and disbelieve. Deciding that once, here, is what keeps the four
   * call sites below from each deciding it differently.
   *
   * THE PANEL'S CLOCK IS NEVER THE ANSWER HERE. Every caller has a moment the
   * record itself keeps: the transcript's `ts`, the interrupted record's `at`, the
   * sent-prompt entry's `at`. Substituting `now` for a missing one would date
   * history by the reload, which is the defect rather than a fallback for it —
   * so an absent moment stays absent.
   */
  function at(ts) {
    return typeof ts === 'string' && ts !== '' ? { ts } : undefined
  }

  /**
   * What the origin's ledger says became of the last turn ([[REQ-306]]).
   *
   * THE SENTENCE THIS REPLACES was *the connection to this reply was lost*, and
   * it was not true. The connection was fine; the turn died — the isolate
   * running it was killed mid-stream, so the reply simply stopped arriving and
   * neither the error frame nor the audit was ever written. Told the connection
   * had dropped, a customer reloads, retries and blames their network, which is
   * the one remedy that cannot possibly work.
   *
   * IT NAMES NO ISOLATE AND NO MEMORY LIMIT. What the customer needs is that the
   * failure was ours, that it is recorded, and what to do next. How the platform
   * broke is the operator's console's business and not theirs.
   *
   * IT QUOTES THE TURN'S ID, which is the one piece of machinery worth handing
   * over: it is the key of the row an operator can look the incident up by, so a
   * customer who says *it failed again, turn_9f…* has done the whole of the
   * triage that previously required reading a platform tail.
   *
   * `error` READS DIFFERENTLY FROM `lost`, because they are different facts. An
   * errored turn told the stream why and closed properly; only a panel that
   * reloaded after it missed the message, so the message is what it is owed. A
   * lost turn has no why — nothing survived to write one — and pretending
   * otherwise would be inventing a cause.
   */
  function failureNotice(failed) {
    // [[BUG-249]] — A CLIENT IS NEVER HANDED MACHINERY. The origin sends a turn's id
    // and cause only where diagnostics are on (the dev server); without them this is
    // the whole of what a customer reads.
    if (!failed?.turn) return GENTLE_FAILURE
    const reference = ` (${failed.turn})`
    if (failed.state === 'stalled') {
      return `That turn stopped making progress and the host ended it${reference}${
        failed.detail ? `: ${failed.detail}` : '.'
      }`
    }
    if (failed?.state === 'error') {
      return `That turn failed before it finished${reference}${
        failed.detail ? `: ${failed.detail}` : '.'
      }`
    }
    return (
      `That turn stopped before it finished — the connection held, the reply did not${reference}. ` +
      'It was our failure, it has been recorded, and asking again is worth a try.'
    )
  }

  /** [[BUG-249]] — what a customer reads about a turn that did not finish. */
  const GENTLE_FAILURE = "That reply was cut short — sorry. Ask again and I'll pick it up."

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
  function paintInterrupted(interrupted, failed) {
    if (!chat) return
    // A DEATH WITH NO PENDING RECORD IS STILL A DEATH ([[REQ-306]]). The record
    // of the client's words is written by the turn itself, just before the model
    // is called; a turn killed before it reached that line leaves the ledger's
    // row and nothing else. Saying nothing here is how the original incident
    // looked from the customer's side.
    if (!interrupted) {
      if (failed) note(failureNotice(failed))
      return
    }
    if (interrupted.recorded) {
      // The prompt and the fragment are both above already. What is missing is
      // the fact that the reply stopped rather than ended.
      // [[BUG-249]] — the detailed note only where the origin sent one (dev).
      note(
        failed?.turn
          ? failureNotice(failed) + ' The reply above is not all of it; ask again to pick it up.'
          : 'That turn was interrupted — the reply above is not all of it. Ask again to pick it up.',
      )
      return
    }
    // STAMPED WITH WHEN IT WAS SENT, NOT WHEN IT WAS PAINTED ([[BUG-138]]). The
    // record was written as the turn opened and has carried `at` ever since; the
    // moment this bubble reaches the screen is a reload, possibly days later, and
    // dating their words by it would put the operator's message after the
    // conversation it was part of.
    chat.appendMessage('user', interrupted.text, at(interrupted.at))
    note(
      (failed?.turn ? failureNotice(failed) + ' ' : 'That turn was interrupted and ') +
        'nothing of it was recorded — not even your message, until now. ' +
        'It is back in the box below, ready to send again.',
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
   * a message the panel QUEUED and held in a page that was then reloaded. In
   * all of them the composer has already deleted the draft,
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
    // EACH WITH ITS OWN SUBMIT MOMENT ([[BUG-138]]), which `sentPrompts` has kept
    // on every entry since it started keeping them. These are the messages most
    // likely to be days old — they survive precisely because no transcript
    // accounts for them — so the clock is furthest from right here.
    for (const entry of entries) chat.appendMessage('user', entry.text, at(entry.at))
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
    // [[REQ-414]] — chips waiting for one conversation do not go with another's
    // next message. Their Library items stay; only the attachment is dropped.
    if (sessionKey !== null) attachments?.clear()
    sessionKey = next
    sessionId = session?.sessionId ?? null
    // A NEW CONVERSATION GETS THE WHOLE BUDGET ([[BUG-123]]). The chases a
    // previous conversation spent are a fact about that conversation's origin,
    // not about this one's.
    chases = 0
    cuePending = null
    paint(session)
  }

  /**
   * [[BUG-245]] — say something in the conversation as the client: a comp card's
   * note, sent from the board. It goes exactly where a typed message would — the
   * talker while the consultant works, else a turn of its own.
   */
  function say(text) {
    if (!chat || !text) return
    showNews(false)
    if (chat.isBusy()) chat.talk(text)
    else void chat.send(text)
  }

  /**
   * [[BUG-245]] — a turn on the host's cue: the consultant speaks without the client
   * having written (the comp board finished on a Skip). Drawn as the consultant's
   * message alone. While a turn runs it waits for the panel to be free; the origin
   * refuses it, silently, once the consultant has been told some other way.
   */
  let cuePending = null
  function cue(kind) {
    if (!chat || !sessionId || typeof transport.cue !== 'function') return
    const mine = (cuePending = { kind, key: sessionKey })
    const run = () => {
      if (cuePending !== mine || !chat || sessionKey !== mine.key) return
      if (chat.isBusy()) {
        setTimeout(run, CUE_WAIT_MS)
        return
      }
      cuePending = null
      void chat.resume(watchForWrites(desk.wrap(transport.cue(sessionId, kind, promptView())), told), { markdown: '' })
    }
    run()
  }

  /**
   * A brand-new conversation: one button, and nothing else ([[REQ-403]]).
   *
   * NO COMPOSER AND NO TRANSCRIPT, because there is nothing to reply to yet. The
   * press records the consultant's introduction on the origin — stock text, no
   * model call — and only then is the conversation mounted, the introduction
   * typed into it, and the text box shown once it has finished: the client's
   * first message is a reply to it, and the model sees it that way.
   *
   * A REFUSED PRESS RE-READS rather than retrying: 409 means the conversation was
   * started elsewhere (another tab), and the transcript is the answer. Anything
   * else puts the button back with a sentence.
   */
  function paintStart(session) {
    const key = sessionKey
    const box = document.createElement('div')
    box.className = START_CLASS
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `${START_CLASS}__button`
    button.textContent = CHAT_START
    const status = document.createElement('p')
    status.className = `${START_CLASS}__status`
    status.setAttribute('role', 'status')
    box.append(button, status)
    element.append(box)
    button.addEventListener('click', async () => {
      button.disabled = true
      status.textContent = ''
      let turn
      try {
        turn = await transport.openConversation(session.sessionId)
      } catch {
        if (key !== sessionKey) return
        const again = reopen ? await reopen().catch(() => null) : null
        if (key !== sessionKey) return
        if (again && again.opening !== true) {
          paint(again)
          return
        }
        button.disabled = false
        status.textContent = CHAT_START_FAILED
        return
      }
      if (key !== sessionKey) return
      paint({ ...session, opening: false, turns: [], live: false })
      void typeIntroduction(turn)
    })
  }

  /**
   * Type the introduction into the freshly-mounted conversation, the text box
   * hidden until it has finished ([[REQ-403]]).
   */
  async function typeIntroduction(turn) {
    const mounted = chat
    if (!mounted) return
    const composer = () => element.querySelector('.chat-widget-input-bar')
    element.classList.add(`${START_CLASS}--typing`)
    try {
      await mounted.resume(typedOut(turn?.markdown ?? '', wait), { markdown: '', meta: at(turn?.ts) })
    } catch {
      // A typing failure costs the animation, never the turn: it is on the origin.
    } finally {
      if (chat === mounted) {
        element.classList.remove(`${START_CLASS}--typing`)
        composer()?.querySelector('textarea, [contenteditable]')?.focus?.()
      }
    }
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
    showNews(false)
    unbindAttachments?.()
    unbindAttachments = null
    chat?.destroy()
    chat = null
    element.replaceChildren()
    element.classList.remove(`${START_CLASS}--typing`)
    if (!session) return
    if (session.group) {
      paintRoom(session)
      return
    }
    if (session.opening === true && session.ready !== false && typeof transport.openConversation === 'function') {
      paintStart(session)
      return
    }

    const next = sessionKey
    const id = session.sessionId
    // KEYED LIKE THE DRAFT IT TAKES OVER FROM ([[BUG-122]]) — the conversation,
    // not the wire id, so a submission that never landed comes back under the
    // business it was written for.
    const sent = sentPrompts(storage, next)
    // WHAT THE ORIGIN IS HOLDING FOR THIS CONVERSATION ([[BUG-224]]): messages
    // sent while a turn ran that no turn has taken yet — this page's own, from
    // before a reload or a repaint, or another tab's. They are already kept, so
    // they are handed back to the panel ADOPTED: `onInterpose` answers their id
    // instead of posting them again.
    const waiting = session.waiting ?? []
    const adopted = new Map(waiting.map((m) => [m.text.trim(), m.id]))
    // The waiting ids the next prompt delivers, when it is run to deliver them.
    let delivering = []
    const interposes = typeof transport.interpose === 'function'
    // [[REQ-416]] — A CONSULTANT WITH A TALKER: while it works, ▶ and Enter send
    // to the talker beside the work, and Stop building stops the work alone.
    const talks = session.talker === true && interposes
    if (talks) desk.adopt(waiting)
    chat = mountChat(element, {
      // KEYED ON THE CONVERSATION, NOT THE WIRE ID. This is also the composer's
      // draft key, so a half-typed message stays with the business it was typed
      // under rather than surfacing under another business's same-named site.
      id: `${CHAT_ID_PREFIX}${next}`,
      emptyText: EMPTY_TEXT,
      toolPane: true,
      // REFUSED BEFORE THE BOX IS CLEARED ([[REQ-309]]). lagrange-framework
      // REQ-177 enforces this ahead of `clear()`, which is the only place a
      // refusal can still leave the client where they were: the text stays put,
      // nothing is painted, no turn opens, and `sendPrompt`, `onQueue` and
      // `onInterject` below are not called — because nothing was submitted.
      //
      // BOTH OPTIONS ARE OURS AND THE COMPONENT HAS NO DEFAULT FOR EITHER. That is
      // the right division: the panel cannot know why a bound exists or what to do
      // instead, and a figure it invented would be a product decision made by a
      // widget. Absent them there is no bound at all, which is what a build
      // predating REQ-177 falls back to — and the route still refuses, so the
      // client gets the same sentence one step later rather than none.
      maxSubmissionChars: CHAT_MAX_SUBMISSION_CHARS,
      overLongText: CHAT_OVER_LONG_MESSAGE,
      ...(storage ? { storage } : {}),
      // [[BUG-244]] — ATTACH IS THE "+" INSIDE THE TEXT BOX, mirroring ▶.
      ...(attachments ? { composerAction: attachments.action } : {}),
      // [[BUG-244]] — THE STATUS WIDGET IS THE HOST'S TO PLACE: under the plan
      // panel's progress banner, not above the composer.
      ...(statusContainer ? { statusContainer } : {}),
      // [[BUG-224]] — WHILE A TURN RUNS, ▶ AND ENTER INTERPOSE: the message goes
      // to the origin and reaches the assistant at its next tool call. Queue
      // stays on the hold menu. [[REQ-416]] — the consultant TALKS instead.
      ...(talks ? { turnModes: { talk: true } } : interposes ? { turnModes: { interpose: true } } : {}),
      sendPrompt: (text, opts) => {
        const wire = expandPrompt(text)
        // [[BUG-245]] — the client wrote: the reply to it carries any news.
        showNews(false)
        // [[REQ-416]] — WRITTEN WHILE IT WORKS: to the talker, whose reply comes
        // back on the work's own stream. The origin keeps the message, so it is
        // not remembered here.
        if (talks && desk.isOpen()) return desk.talk(id, text, wire, promptView)
        // A MESSAGE THAT MISSED ITS TURN comes back here naming its id, and the
        // origin retires it so it is not delivered into this turn a second time.
        const fromMessages =
          opts && 'fromMessage' in opts ? [opts.fromMessage].filter(Boolean) : delivering.splice(0)
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
        return watchForWrites(desk.wrap(transport.streamPrompt(id, wire, promptView(), fromMessages)), told)
      },
      // THE STREAM STOPPED WITHOUT ENDING THE TURN ([[BUG-123]]). `webui-chat`
      // has kept the bubble, marked it, and declined to offer a resend, because
      // from where it stands the turn's fate is UNKNOWN. This pane is the half
      // that can find out — it has an origin to ask.
      onTurnLost: (lost) => void chaseLostTurn(lost),
      // QUEUED TEXT IS HELD BY THE PANEL, which runs it when the turn ends
      // (lagrange-framework BUG-64) — in this page's memory only, so it is
      // remembered here too ([[BUG-122]]) and survives a reload as unsent.
      onQueue: (text) => sent.remember(text, expandPrompt(text)),
      // [[BUG-224]] — INTERPOSED TEXT IS KEPT BY THE ORIGIN, not by this page:
      // the answer is its id, which the delivery is matched by. A refusal leaves
      // the panel holding it, and it runs as the next turn through `sendPrompt`,
      // which remembers it then.
      // [[REQ-416]] — STOP REACHES THE ORIGIN, which keeps it for the isolate
      // running the work. A talker's reply is stopped by its id; the status
      // widget's Stop building names none, and stops the work.
      ...(talks
        ? { onStop: (turnId) => void Promise.resolve(transport.stop?.(id, turnId ?? null)).catch(() => {}) }
        : {}),
      ...(interposes && !talks
        ? {
            onInterpose: (text) => {
              const held = adopted.get(text.trim())
              if (held !== undefined) {
                adopted.delete(text.trim())
                return held
              }
              return transport.interpose(id, expandPrompt(text))
            },
          }
        : {}),
    })
    // [[REQ-414]] — the chips go with the next message, interposed like any
    // other while a turn runs ([[BUG-224]]).
    unbindAttachments = attachments?.bind(chat, { interposes, talks }) ?? null
    // [[BUG-245]] — news the client has not been told yet survives a reload as the
    // same quiet line, never as the message it replaced.
    showNews(session.news === true)

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
      // WITH THE MOMENT IT HAPPENED ([[BUG-138]]). This is the call that stamps a
      // turn and opens a day, and for the whole of the history it was made with
      // two arguments — so the scheme worked for the one turn the panel had
      // stamped from its own clock and for nothing behind it. One argument is the
      // entire fix on this side; `ts` reaching here is the other half.
      chat.appendMessage(turn.role, turn.markdown, at(turn.ts))
    }
    // `ready` is independent of the transcript: a builder with no API key still
    // has every earlier conversation, and the operator is owed both the history
    // and the reason it is frozen.
    if (session.ready === false) note(session.error || 'The assistant is not available.')
    paintInterrupted(session.interrupted, session.failed)
    // AFTER IT, AND RECONCILED AGAINST THE SAME TWO THINGS ([[BUG-122]]): the
    // transcript just painted, and the record the origin is already handing back.
    // A submission either of them accounts for is dropped rather than repeated.
    // A WAITING MESSAGE IS ACCOUNTED FOR ([[BUG-224]]): the origin has it.
    const held = waiting.map((m) => ({ role: 'user', markdown: m.text }))
    paintUnsent(sent.reconcile([...turns, ...held], session.interrupted), sent)
    if (!resuming) {
      // NO TURN RUNNING, SO NOTHING WILL TAKE THEM: they run now, as one turn,
      // the way the panel runs what was queued during a turn.
      if (waiting.length > 0 && session.ready !== false) {
        delivering = waiting.map((m) => m.id)
        void chat.send(waiting.map((m) => m.text).join('\n\n'))
      }
      return
    }

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
      chat.resume(watchForWrites(desk.wrap(transport.streamReattach(id, session.cursor)), told), {
        markdown: seed?.markdown ?? '',
        // THE SEEDED TURN IS A TRANSCRIPT TURN TOO ([[BUG-138]]). It is not
        // appended by the loop above — it is handed to `resume` so the half
        // already written and the half still coming are one message — and without
        // its moment it would be the one turn in the thread dated by whenever the
        // tail happened to drain. Which is worst for the turn that most often
        // needs it: a reattach whose `turn_end` is already past the cursor drains
        // at once, so "now" is the reload rather than the reply.
        meta: at(seed?.ts),
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
    // [[BUG-224]] — BACK ON SCREEN AS WAITING, adopted rather than re-sent. The
    // running turn takes them at its next tool call; one that misses it runs
    // next, as any interposed message does.
    // [[REQ-416]] — or, to a consultant with a talker, sent to it: adopted by
    // their id, and answered beside the work being rejoined.
    for (const m of waiting) {
      if (talks) chat.talk(m.text)
      else chat.interpose(m.text)
    }
  }

  /**
   * Draw a group chat ([[REQ-357]]): the room's transcript, every contribution
   * labelled with who said it, a composer that posts into the room, and a Stop
   * that ends the exchange.
   *
   * THE SAME PANEL, IN FOLLOW MODE. `webui-chat` already draws an attributed
   * stream — a `turn_start` carrying a `speaker` — so the room is this pane's own
   * chat widget handed the exchange as frames, rather than a second component.
   * The client's own words are drawn on their edge because their contributions
   * are the `user` side; everybody else's carry their name.
   *
   * ECHO-FREE. The composer hands the text to the room and paints nothing: the
   * client's message arrives back as the room's first post, exactly as it is
   * recorded, so what streams live and what a reload draws are the same thing.
   *
   * WHAT A MEMBER SAYS TO ITSELF STAYS OUT. Each member's own events are on the
   * stream — their site writes still move the preview — but only what they post
   * to the room is drawn here. Their deliberation is on the Debug tab.
   */
  function paintRoom(session) {
    const next = sessionKey
    const id = session.sessionId
    const speakers = Object.values(session.group?.names ?? {})
    chat = mountChat(element, {
      id: `${CHAT_ID_PREFIX}${next}`,
      emptyText: ROOM_EMPTY_TEXT,
      toolPane: false,
      maxSubmissionChars: CHAT_MAX_SUBMISSION_CHARS,
      overLongText: CHAT_OVER_LONG_MESSAGE,
      ...(storage ? { storage } : {}),
      ...(statusContainer ? { statusContainer } : {}),
      attribution: (turn) => ({
        side: turn.role === 'user' ? 'right' : 'left',
        self: turn.role === 'user',
        ...(turn.role === 'user' ? {} : { tone: Math.max(0, speakers.indexOf(turn.speaker)) }),
        ...(turn.meta?.marks?.passed ? { diagnostic: ROOM_NOTE } : {}),
      }),
      onSubmit: (text) => {
        if (chat.isFollowing()) {
          // ONE EXCHANGE AT A TIME, and the words are not lost: they go back in
          // the box rather than into a request the room would refuse.
          if ((chat.getInputMarkdown() ?? '').trim() === '') chat.setInputMarkdown(text)
          note(ROOM_BUSY_TEXT)
          return
        }
        void chat.follow(
          roomFrames(watchForWrites(transport.streamPrompt(id, expandPrompt(text), promptView()), told), onRoomActivity),
        )
      },
      onStop: () => {
        void Promise.resolve(transport.stop?.(id)).catch(() => {})
      },
      onTurnLost: (lost) => void chaseLostTurn(lost),
    })
    for (const turn of session.turns ?? []) {
      chat.appendMessage(turn.role, turn.markdown, {
        ...(at(turn.ts) ?? {}),
        speaker: turn.speaker,
        ...(turn.passed ? { marks: { passed: true } } : {}),
      })
    }
    if (session.ready === false) note(session.error || 'The group chat is not available.')
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
   * AND IT ADDS NO NARRATION OF ITS OWN. A repaint that succeeded needs none:
   * either the reply is now whole, or `paint` has already said the true thing
   * about it from what the ORIGIN reported — `interrupted` ([[BUG-121]]) for the
   * words, and `failed` ([[REQ-306]]) for the fact that the turn died rather
   * than the socket. A second sentence composed here would be this pane guessing
   * at a conversation the origin has just described.
   *
   * WHICH IS WHY THE NOTICES BELOW NO LONGER MENTION A CONNECTION ([[REQ-306]]).
   * They fire when the pane could not re-read the conversation AT ALL, so the
   * only honest claim left is that the reply stopped — not that a socket
   * dropped, which is the thing that demonstrably had not happened in the
   * incident this ticket comes from and which sends a customer to check their
   * network instead of telling us.
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
      note(
        'That reply stopped before the turn finished. Reload the builder to see where the ' +
          'turn got to.',
      )
      return
    }
    if (chases >= RECOVERY_CHASES) {
      note(
        'Replies in this conversation keep stopping before they finish, and the conversation ' +
          'could not be re-read. Reload the builder to see where the turn got to.',
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
            chat.resume(watchForWrites(desk.wrap(transport.streamReattach(id, session.cursor)), told), {
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
        'That reply stopped before the turn finished, and the conversation could not be re-read' +
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
    say,
    cue,
    destroy() {
      unbindAttachments?.()
      undecorate?.()
      chat?.destroy()
      chat = null
      sessionId = null
      sessionKey = null
      element.remove()
    },
  }
}
