/**
 * What the operator has submitted and no transcript has accounted for yet
 * ([[BUG-122]]).
 *
 * THE FAILURE THIS FILE EXISTS FOR. The composer empties itself the instant a
 * message is submitted — `webui-chat`'s `submitWith` calls `clear()` BEFORE the
 * handler runs, and `clear()` deletes the persisted draft — on the reading that
 * the text "has been accepted by the session". At that instant it has been
 * accepted by a fetch that has not resolved. From submit onward the browser holds
 * exactly ONE copy of the prompt: the bubble in the panel. A reload discards it,
 * and a reload is precisely what a stranded turn invites.
 *
 * WHY THE ORIGIN'S OWN RECORD IS NOT ENOUGH. [[BUG-121]] writes the prompt to the
 * session's `chat` ticket before the model is called, which covers every turn the
 * origin got to start. It cannot cover a turn the origin never heard of — a
 * request that failed in the network, was refused, or died before that write —
 * and it keeps ONE record per session, so a later turn replaces an unaccounted
 * one. It also cannot see a message the panel QUEUED: this builder passes no
 * queue transport, so a message submitted while the assistant is streaming is
 * echoed as pending and goes nowhere at all.
 *
 * SO THE BROWSER KEEPS ITS OWN COPY, from submit until a transcript shows the
 * words landed. It is deliberately NOT a second transcript: it holds only what
 * the operator typed, it is reconciled on read against the conversation the
 * origin answers with, and anything the origin accounts for is dropped on sight.
 *
 * WHY HERE AND NOT IN THE COMPOSER. The composer's clear-on-submit is right for
 * the composer — leaving text in the box invites sending it twice — and the thing
 * that knows whether a turn ever reached a transcript is the pane that replays
 * one. That is this side of the seam. `webui-chat` is reached through its public
 * API and not patched (DOC-8 §9.4.1).
 */

/** Where the list lives, within whatever storage the pane was given. */
export const SENT_PREFIX = 'builder-chat-sent:v1:'

/**
 * How many submissions are kept per conversation.
 *
 * A CAP AND NOT A WINDOW, because an entry is dropped by being ACCOUNTED FOR and
 * an ordinary conversation drops each of them on the next page load. What the cap
 * bounds is the pathological case — a browser that never reloads — where the
 * oldest entries are also the ones most certainly recorded.
 */
export const SENT_LIMIT = 10

/** A `Storage` stand-in for environments with none, so a caller never branches. */
function memoryStore() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

/**
 * The stored list, or empty.
 *
 * A CORRUPT VALUE READS AS ABSENT, the judgement `session-pending.ts` makes about
 * the record on the other side of the wire: this is a safety net, and a net that
 * throws into the mount it was protecting has made things worse than none.
 */
function read(store, key) {
  try {
    const raw = store.getItem(key)
    if (typeof raw !== 'string' || raw === '') return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((e) => e && typeof e.text === 'string' && e.text !== '')
      .map((e) => ({
        text: e.text,
        sent: typeof e.sent === 'string' && e.sent !== '' ? e.sent : e.text,
        at: typeof e.at === 'string' ? e.at : '',
      }))
  } catch {
    return []
  }
}

function write(store, key, entries) {
  try {
    if (entries.length === 0) store.removeItem(key)
    else store.setItem(key, JSON.stringify(entries))
  } catch {
    // A full or blocked store costs the safety net and never the turn.
  }
}

/** The comparison both sides of the reconciliation make — the origin's own. */
const same = (a, b) => (a ?? '').trim() === (b ?? '').trim()

/**
 * The submissions of one conversation.
 *
 * @param {Storage} [storage] where the list lives; the pane's own, so the entries
 *   are namespaced exactly as the composer's drafts are.
 * @param {string} key the conversation, in the caller's address space — the same
 *   key the composer's draft is filed under ([[BUG-69]]).
 */
export function sentPrompts(storage, key, now = () => new Date().toISOString()) {
  const store = storage || globalThis.localStorage || memoryStore()
  const slot = SENT_PREFIX + key

  return {
    /**
     * Keep what was just submitted.
     *
     * `text` is what the operator typed and `sent` what went on the wire — they
     * differ when a prompt is expanded on the way out ([[REQ-210]]). The
     * transcript records the expansion, so that is what a later reconciliation
     * must compare against; the short form is what goes back in the box, because
     * that is the one the operator wrote.
     *
     * CALLED BEFORE THE REQUEST IS MADE, which is the whole of the guarantee: the
     * words are in the browser's own durable store before anything can fail.
     */
    remember(text, sent) {
      if (typeof text !== 'string' || text.trim() === '') return
      const entries = read(store, slot)
      entries.push({ text, sent: sent ?? text, at: now() })
      write(store, slot, entries.slice(-SENT_LIMIT))
    },

    /**
     * Drop everything the conversation accounts for, and hand back the rest.
     *
     * THE TRANSCRIPT IS AUTHORITATIVE AND THIS LIST IS ADVISORY, which is the
     * same arrangement `interruptedTurn` has with the record it reconciles: a
     * submission whose words are in the conversation needs no rescue, and one
     * the origin is ALREADY handing back (`interrupted`) must not be handed back
     * twice. What remains is text that exists nowhere but here.
     *
     * A LIVE TURN NEEDS NO SPECIAL CASE. `live` says a turn is open at the cursor
     * this transcript was folded at, so its `turn_start` — which carries the
     * operator's words — is inside the fold and the entry matches an ordinary
     * user turn.
     */
    reconcile(turns = [], interrupted = null) {
      const asked = (turns ?? []).filter((t) => t?.role === 'user').map((t) => t.markdown)
      const unaccounted = read(store, slot).filter(
        (entry) =>
          !asked.some((markdown) => same(markdown, entry.sent)) &&
          !same(interrupted?.text, entry.sent),
      )
      write(store, slot, unaccounted)
      return unaccounted
    },

    /** Forget one entry — it is somewhere safer now. */
    forget(entry) {
      write(
        store,
        slot,
        read(store, slot).filter((e) => !(e.at === entry.at && same(e.sent, entry.sent))),
      )
    },
  }
}
