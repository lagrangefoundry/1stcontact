/**
 * The builder's calls back to its origin.
 *
 * Everything the builder needs that a Worker cannot do — list the site store,
 * read a rendered channel off disk, run `publish` — is Node-side, so it is
 * reached over same-origin HTTP rather than imported. Keeping the URL shapes in
 * one module is what lets the pane, the toolbar and the tests agree on them.
 */

import {
  announceSessionEnded,
  isSessionEnded,
  SESSION_EXPIRED,
  SESSION_UNREACHABLE,
  SessionEndedError,
} from './session.js'
// THE NAME'S WIRE KEYS, from the one module that declares the parts ([[REQ-193]]).
import { NAME_PART_NAMES } from './people-name.js'

/**
 * WHICH BUSINESS EVERY URL BELOW IS ABOUT ([[REQ-179]]).
 *
 * ONE PLACE, MODULE-SCOPED, SET BY THE SHELL'S SWITCHER. `scope.ts` parses a
 * `/b/<businessId>` path prefix and `router.ts` strips it before the route table
 * ever sees a path, so scoping the whole builder is a matter of every URL this
 * module builds carrying it — and every URL the builder uses is built here,
 * which is what makes "one place" true rather than aspirational.
 *
 * A MODULE VARIABLE RATHER THAN A PARAMETER, and the reason is the three
 * functions that return a URL instead of fetching one: `previewUrl` into an
 * `<iframe src>`, `assetUrl` into the picker's `<img src>`, `materialFileUrl`
 * into the Library's `<img>`/`<a>`. Their callers are components that know a
 * site key and have no business knowing a business id; threading one through them
 * would put the scope in a dozen call sites, each free to forget it. The browser
 * runs one builder against one selection at a time, so a module variable is
 * exactly as wide as the thing it describes.
 *
 * NULL IS ORDINARY AND MEANS "UNSCOPED". Before the switcher has resolved a
 * selection — and on every host that has no businesses at all — the URLs are
 * what they were, and `resolveScope` answers them from its own fallback. That is
 * what lets this land without every existing caller changing.
 */
let businessScope = null

/** Point every subsequent URL at this business. Pass `null` to unscope. */
export function setBusinessScope(businessId) {
  const next = String(businessId ?? '').trim()
  businessScope = next === '' ? null : next
  return businessScope
}

/** The business every URL below is currently about, or null. */
export function getBusinessScope() {
  return businessScope
}

/**
 * Prefix a same-origin path with the current business.
 *
 * Deliberately NOT applied to `/api/status` or `/api/businesses`: both are asked
 * BEFORE a business is chosen and neither is about one. Everything else is.
 */
function scoped(path) {
  return businessScope === null ? path : `/b/${encodeURIComponent(businessScope)}${path}`
}

/**
 * EVERY request this module makes goes through here ([[BUG-52]]).
 *
 * ONE PLACE, for the reason `scoped()` above is one place: a rule that has to be
 * remembered at each of twenty call sites is a rule the twenty-first will not
 * have. This is the only fetch in the builder client — nothing outside this
 * module calls `fetch` at all — so "the client notices a 401" is mechanically
 * true rather than a convention. What an ended session then MEANS, and who is
 * told, is `session.js`; this function only recognises one.
 *
 * A 401 IS ANNOUNCED AND THEN HANDED BACK. It is deliberately not thrown here:
 * each caller below already has an error contract its own callers depend on
 * (`CopyError` carrying the validator's sentence, the assistant's stream turning
 * a refusal into a frame in the conversation), and rewriting all of them into
 * one shape would be a bigger change than the bug. The three calls the builder
 * makes on load DO throw — see them below — because those are the ones whose
 * defaults draw the empty account this bug is about.
 *
 * A REJECTION IS THROWN AS A SESSION FAILURE, because there is nothing else it
 * could usefully be to a caller: the request did not happen, no status exists,
 * and behind Access the overwhelmingly likely cause is the login redirect the
 * browser refused to follow. The original is kept as `cause`.
 */
async function send(fetchImpl, url, init) {
  let res
  try {
    res = await fetchImpl(url, init)
  } catch (cause) {
    throw announceSessionEnded(new SessionEndedError(SESSION_UNREACHABLE, cause))
  }
  if (res.status === 401) announceSessionEnded(new SessionEndedError(SESSION_EXPIRED))
  return res
}

/**
 * The URL a rendered channel is served at. Same-origin by construction: a
 * relative path, so the iframe is never cross-origin and "open in new tab"
 * lands on this same origin (DOC-28 §10) — on the draft render of the page the
 * pane is on, which is not necessarily the pane's own URL ([[BUG-131]]; see
 * {@link previewChannelUrl}).
 *
 * The business prefix is inherited by the page's own relative sub-resources,
 * which is precisely why `scope.ts` chose a path over a query string — a
 * relative asset reference drops a query string and would arrive unscoped.
 *
 * `rel` is the path WITHIN the channel — what the reader navigated to, carried
 * across a channel switch ([[REQ-215]]). It arrives already percent-encoded,
 * because it comes out of a location the browser wrote; encoding it again would
 * turn one `%20` into two.
 */
export function previewUrl(site, channel, rel = '') {
  const root = `/preview/${encodeURIComponent(site)}/${encodeURIComponent(channel)}/`
  return scoped(rel === '' ? root : `${root}${rel.replace(/^\/+/, '')}`)
}

/**
 * The inverse: which page within the channel a preview pathname names, or `null`
 * for a pathname that is not a preview at all.
 *
 * It is HERE, beside the builder, because the shape of the URL is one fact and
 * two readers of it that each know it separately are one rename away from
 * disagreeing. The scope prefix and the site key are skipped rather than matched:
 * this has to answer for whichever business and site the pane happens to be
 * showing, and neither is what it is being asked about.
 */
export function previewRelPath(pathname) {
  const m = /\/preview\/[^/]+\/[^/]+\/(.*)$/.exec(pathname ?? '')
  return m ? m[1] : null
}

/**
 * The same channel, pointed at a different page within it ([[REQ-248]]).
 *
 * THE THIRD READER OF THE SAME URL SHAPE, and it is here for the reason
 * {@link previewRelPath} is: the shape is one fact, and readers of it that each
 * know it separately are one rename away from disagreeing. It keeps everything
 * up to and including the channel root — scope prefix, site key, channel — and
 * replaces only what comes after, so a caller can move the pane between pages
 * without knowing which business, which site or which channel it is in.
 *
 * A URL THAT NAMES NO CHANNEL IS RETURNED UNTOUCHED. The one caller passes the
 * document's own location, and a frame that has not loaded a preview yet is a
 * frame there is nothing to move.
 */
export function previewPageUrl(url, rel) {
  const m = /^(.*\/preview\/[^/]+\/[^/]+\/)/.exec(url ?? '')
  return m ? `${m[1]}${String(rel ?? '').replace(/^\/+/, '')}` : String(url ?? '')
}

/**
 * The same page, rendered by a different channel ([[BUG-131]]).
 *
 * THE FOURTH READER OF THE SAME URL SHAPE, and the exact dual of
 * {@link previewPageUrl}: that one keeps the channel and replaces the page,
 * this one keeps the page and replaces the channel. It is here for the reason
 * both of its neighbours are — the shape is one fact, and readers of it that
 * each know it separately are one rename away from disagreeing.
 *
 * WHY THE PAGE IS TAKEN FROM A URL rather than composed from the state around
 * the pane. The caller — "open in new tab" — has to answer for the page the
 * operator is looking at NOW, and it is told so by the pane's `src` event,
 * which fires at the moment the pane is re-pointed and before the new document
 * has arrived. Anything derived from the outgoing document at that moment names
 * the page being left; the URL being navigated to names the one being opened.
 *
 * A URL THAT NAMES NO CHANNEL IS RETURNED UNTOUCHED, for the same reason
 * {@link previewPageUrl} does: a pane showing no document is not a pane whose
 * channel there is anything to change.
 */
export function previewChannelUrl(url, channel) {
  const m = /^(.*\/preview\/[^/]+\/)[^/]+\/(.*)$/.exec(url ?? '')
  return m ? `${m[1]}${encodeURIComponent(channel)}/${m[2]}` : String(url ?? '')
}

/**
 * A reference that already names its own origin: an absolute URL, or a
 * protocol-relative one. The same shape `edit.ts` and `l1/assets.ts` treat as
 * "not site-local", written here because the builder cannot import either.
 */
const COMPLETE_REFERENCE = /^([a-z][a-z0-9+.-]*:|\/\/)/i

/**
 * Where the chrome can load an asset handle's bytes from (REQ-132).
 *
 * The picker has to *show* the images it offers, and a handle (`/assets/hero.png`)
 * is an address inside the site, not a URL this document can fetch. The preview
 * server already answers for those bytes — `PreviewRenderer.file` routes anything
 * under `assets/` straight to the store — so a thumbnail costs no new route and
 * no copy of anything.
 *
 * RESOLVED EXACTLY AS THE PAGE RESOLVES IT. The render emits image sources
 * document-relative (`relativizeUrl` drops the leading slash, REQ-109) against
 * the channel root, so appending the handle to the channel URL reproduces the
 * page's own resolution rather than a second convention that could disagree with
 * it — including the deliberate absence of encoding, since the renderer escapes
 * for HTML and encodes nothing.
 *
 * A COMPLETE reference is returned untouched: it names bytes that are not under
 * `draft/assets/` (a folded reproduction can hold an off-site URL the mirror
 * never got), and prefixing it would manufacture a path that resolves to nothing.
 * The `draft` channel is not a choice about freshness — asset bytes are copied
 * through rather than rendered, so every channel serves the identical file.
 */
export function assetUrl(site, handle) {
  const trimmed = String(handle ?? '').trim()
  if (trimmed === '') return ''
  if (COMPLETE_REFERENCE.test(trimmed)) return trimmed
  return previewUrl(site, 'draft') + trimmed.replace(/^\.?\/+/, '')
}

/**
 * Whether this deployment can reach a model at all (REQ-173).
 *
 * ASKED ONCE, AT BOOT, BEFORE ANYTHING IS OFFERED. Nothing in this product works
 * without an API key — no conversation, and since REQ-173 no description of the
 * material a client uploads — so the builder finds out first and says so at the
 * top of the screen, rather than letting the operator infer a deployment-wide
 * fact from a frozen chat panel here and a failed upload there.
 *
 * A FAILURE TO ASK IS NOT A FAILURE TO WORK. If the status call itself falls
 * over, the builder mounts unblocked: an origin that cannot answer this question
 * is a different problem, and refusing to draw the app because of it would turn a
 * transient blip into a blank page.
 */
export async function fetchAiStatus(fetchImpl = fetch) {
  try {
    const res = await send(fetchImpl, '/api/status')
    if (res.status === 401) throw new SessionEndedError(SESSION_EXPIRED)
    if (!res.ok) return { ai: true, message: null }
    const body = await res.json()
    return { ai: body.ai !== false, message: body.message ?? null }
  } catch (error) {
    // AND A REFUSED SESSION IS NOT A BLIP ([[BUG-52]]). The paragraph above is
    // about an origin that could not answer the QUESTION; a 401 answers it, with
    // "not you". Defaulting to `{ai: true}` there reports a healthy assistant to
    // somebody who is signed out — one of the three defaults that together drew
    // a working, empty builder.
    if (isSessionEnded(error)) throw error
    return { ai: true, message: null }
  }
}

/**
 * Which businesses this account may operate, and who the account is ([[REQ-179]]).
 *
 * ASKED FIRST, AND UNSCOPED. It is the call whose answer DECIDES the scope, so
 * it cannot carry one — and it is about the account, which is the one thing in
 * this product that is not business-scoped ([[DOC-40]] §2).
 *
 * A FAILURE TO ASK IS NOT A FAILURE TO WORK, by the same rule
 * {@link fetchAiStatus} follows: an origin that cannot answer this leaves the
 * builder with no switcher and an unscoped session, which is exactly what it had
 * before this existed. Refusing to draw the app over it would turn a blip into a
 * blank page.
 */
/**
 * Tell the origin which surface the operator is now on ([[REQ-235]] §5).
 *
 * WHY THE BROWSER HAS TO SAY THIS AT ALL. Every other thing the activity log
 * knows, it knows because a request arrived. A tab that is being read makes no
 * requests, so *"which tab, for how long"* is not inferable from server traffic:
 * a tab nobody opened and a tab somebody has been reading for twenty minutes
 * look identical. This one post is the difference.
 *
 * ONE POST PER CHANGE, AND NOTHING ELSE. No heartbeat, no timer, no duration
 * computed here. The server timestamps what it receives and derives the rest,
 * which is what keeps a client's clock out of a record — and what keeps this to
 * a handful of requests per session rather than one every few seconds.
 *
 * IT FAILS SILENTLY, ON PURPOSE. A telemetry signal that could interrupt an
 * operator changing tabs would be worse than no signal at all: there is nothing
 * the person could do about it, nothing they asked for that did not happen, and
 * a session lapse is already announced by {@link send} on the very next call
 * that actually needs an answer.
 *
 * WHICH IS WHY THIS IS THE ONE CALL HERE THAT DOES NOT GO THROUGH {@link send},
 * and the exception is the rule working rather than a hole in it. `send`
 * ANNOUNCES — it puts "your session may have ended" on screen when a fetch
 * rejects or answers 401 — and that announcement is right for a call the
 * operator made and wrong for one they did not. A signal nobody asked for must
 * not be able to tell somebody their session is over; a transient blip while
 * they change tabs would then produce a sign-in banner over work that is fine.
 * The 401 this misses is noticed by the next call that actually needs an answer,
 * which is every other function in this module.
 */
export async function postSurface(surface, fetchImpl = fetch) {
  try {
    // STILL INSIDE THIS MODULE, which is what the "one fetch" rule is actually
    // for: nothing outside `api.js` calls `fetch`, so the rule is where a
    // request is made rather than which helper it uses. See above for why this
    // one does not announce.
    await fetchImpl(scoped('/api/activity/surface'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ surface }),
      // The tab has changed; nothing on screen is waiting for this, and a
      // pending request must not hold the page open behind a navigation.
      keepalive: true,
    })
  } catch {
    // See above: there is no failure here that is the operator's to act on.
  }
}

export async function fetchBusinesses(fetchImpl = fetch) {
  try {
    const res = await send(fetchImpl, '/api/businesses')
    if (res.status === 401) throw new SessionEndedError(SESSION_EXPIRED)
    if (!res.ok) return { person: null, businesses: [] }
    const body = await res.json()
    return {
      // `person` AND NOT `account` ([[REQ-194]]). This half has always been who
      // is signed in; it was labelled with the other noun while the account had
      // no table, and an account is the payer rather than whoever is at the
      // keyboard.
      person: body?.person ?? null,
      businesses: Array.isArray(body?.businesses) ? body.businesses : [],
    }
  } catch (error) {
    // EXCEPT A REFUSED ONE ([[BUG-52]]). "No switcher and an unscoped session"
    // is the right answer for a host with no identity behind it; it is the wrong
    // answer for a person who HAS one and whose session lapsed, because the two
    // are then indistinguishable — an empty switcher and an avatar with no
    // account behind it reads as a deleted account rather than an expired login.
    if (isSessionEnded(error)) throw error
    return { person: null, businesses: [] }
  }
}

/**
 * What this business is called, right now ([[REQ-251]]).
 *
 * OVER `/api/businesses` AND NOT A ROUTE OF ITS OWN. There is no `GET
 * /api/business`, and adding one for this would be a second read path to a fact
 * the shell already fetches — the switcher is drawn from exactly this list, so
 * re-reading it is what a rename made in the conversation has to move anyway.
 * The cost of reading the account's list to answer about one of its businesses
 * is one row nobody notices; the cost of a second route is a second place the
 * record's shape is stated.
 *
 * IT ANSWERS ABOUT THE BUSINESS IN SCOPE and takes no id, for the reason every
 * write here takes none: the scope is already resolved, so an id parameter would
 * be the one value a caller could get wrong.
 *
 * `null` WHEN THERE IS NO SCOPE, OR WHEN THE LIST NO LONGER HOLDS IT. Both are
 * ordinary — no business open, or a grant that lapsed between the tab opening
 * and this read — and both mean the same thing to a caller: there is nothing to
 * show, so show nothing rather than the last thing you knew.
 */
export async function fetchBusinessRecord(fetchImpl = fetch) {
  const id = getBusinessScope()
  if (!id) return null
  const { businesses } = await fetchBusinesses(fetchImpl)
  const mine = businesses.find((b) => b?.id === id)
  return mine ? { id: mine.id, name: mine.name ?? '' } : null
}

/** Every site in the store, newest revision included. */
export async function fetchSites(fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/sites'))
  // NAMED, NOT NUMBERED, WHEN IT IS THE SESSION ([[BUG-52]]). The caller in
  // `app.js` may not discard this one the way it discards a listing that merely
  // failed — an empty site list is what an expired session looked like before —
  // so it has to be able to tell the two apart from the error alone.
  if (res.status === 401) throw new SessionEndedError(SESSION_EXPIRED)
  if (!res.ok) throw new Error(`GET /api/sites → ${res.status}`)
  return res.json()
}

/**
 * Every asset the site can reference (REQ-118 / DOC-28 §9.2).
 *
 * Deliberately not used by the image modal — `fetchCopy` already carries the
 * picker's options, so the modal makes the same two calls it always did. This is
 * here because the listing is the asset *store's* surface, not the modal's: the
 * asset browser mode is the same store shown as a tab, and it calls this.
 */
export async function fetchAssets(site, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped(`/api/assets?site=${encodeURIComponent(site)}`))
  if (!res.ok) throw new Error(`GET /api/assets → ${res.status}`)
  return res.json()
}

/**
 * Every page of the site, and whether a reader could get to it ([[REQ-248]]).
 *
 * The page control's one call. `reachable` arrives WITH the row rather than
 * from a second request, because the control states the mark on every row it
 * draws — a list without it is never the list this surface wants.
 *
 * A FAILURE IS NOT FATAL TO THE CONTROL. The caller keeps whatever it last
 * held, so a blip leaves a control naming a slightly old set of pages rather
 * than an empty one — and the pane the operator is looking at is unaffected
 * either way, because nothing about which page is SHOWN is decided here.
 */
export async function fetchPages(site, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped(`/api/pages?site=${encodeURIComponent(site)}`))
  if (!res.ok) throw new Error(`GET /api/pages → ${res.status}`)
  return res.json()
}

/**
 * What a message arrives as ([[REQ-252]]).
 *
 * BESIDE `fetchPages` AND NOT INSIDE IT, because they are different questions
 * asked at different moments: the listing is re-taken on every document the pane
 * shows, and this is sent once, when an operator finishes typing a subject.
 *
 * IT ANSWERS WITH THE PAGE THE WRITE PRODUCED, which is not always the subject
 * that was sent: clearing the box stores the page's title instead, because a
 * message with no subject line is not a thing this product sends. So the caller
 * shows what came BACK rather than what it typed, and the box ends up holding
 * what a recipient will actually read.
 *
 * FAILURES ARRIVE AS {@link CopyError}, through the same envelope every
 * structured edit refuses with. That matters here for one reason in particular:
 * a subject that dropped a token the message declares is refused by the same
 * placeholder rule that guards the copy, and the refusal names the token.
 */
export async function saveSubject(site, page, subject, fetchImpl = fetch) {
  return copyEnvelope(
    await send(fetchImpl, scoped('/api/pages/subject'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ site, page, subject }),
    }),
  )
}

/**
 * The error a `/api/copy` call failed with.
 *
 * The origin answers a rejected edit with a 400 carrying the validator's own
 * `message`/`path`/`hint`, and that text is the only useful thing the modal can
 * show. Collapsing it to "request failed" would leave the user staring at a
 * form with no idea which field was refused.
 */
export class CopyError extends Error {
  constructor(envelope, status) {
    super(envelope?.message || envelope?.error || `copy request failed (${status})`)
    this.name = 'CopyError'
    this.code = envelope?.code
    this.path = envelope?.path
    this.hint = envelope?.hint
    this.status = status
  }
}

async function copyEnvelope(res) {
  if (res.ok) return res.json()
  let body = null
  try {
    body = await res.json()
  } catch {
    /* a non-JSON failure still has a status worth reporting */
  }
  throw new CopyError(body, res.status)
}

/** The descriptors and current values for one segment — the modal's input. */
export async function fetchCopy(target, fetchImpl = fetch) {
  const q = new URLSearchParams({ site: target.site, page: target.page, path: target.path })
  if (target.module) q.set('module', target.module)
  if (target.slot) q.set('slot', target.slot)
  return copyEnvelope(await send(fetchImpl, scoped(`/api/copy?${q}`)))
}

/**
 * Apply one modal's worth of changes.
 *
 * One call is one diff (DOC-28 §11), which is why the modal runs `mountFields`
 * in `buffered` commit — `auto` would fire this per field and re-render the site
 * on every settled keystroke. The origin re-renders the edit channel before it
 * answers, so a resolved promise means the bytes on disk are already current and
 * the caller only has to refresh the frame.
 */
export async function saveCopy(target, values, place, fetchImpl = fetch) {
  return copyEnvelope(
    await send(fetchImpl, scoped('/api/copy'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // `place` IS PART OF THE SAME BODY ([[REQ-282]]), never a call before it.
      // It names the Library material a staged pick has to put on the site
      // first, and the origin resolves each one into the handle it writes — so
      // a Save that both placed a picture and retitled it is still one post,
      // one diff and one re-render. Omitted when nothing was staged, which is
      // every Save that did not pick something new.
      body: JSON.stringify({
        ...target,
        values,
        ...(place && Object.keys(place).length ? { place } : {}),
      }),
    }),
  )
}

/**
 * The site's palette, with per-entry usage counts (REQ-133).
 *
 * The counts come back with the palette rather than being asked for separately,
 * because the popup has no use for one without the other: every rule it states
 * — what a color change repaints, what a rename rewrites, whether a delete is
 * even offered — is stated in the count.
 */
export async function fetchPalette(site, fetchImpl = fetch) {
  return copyEnvelope(await send(fetchImpl, scoped(`/api/palette?site=${encodeURIComponent(site)}`)))
}

/**
 * Apply one palette operation (REQ-133 §5).
 *
 * `body` is `{site, op, name, …}` where `op` is `set` | `add` | `rm` | `rename`.
 * The reply carries the operation's own result AND the whole re-taken census, so
 * the popup redraws from what the store now holds rather than from its own guess
 * at what changed.
 *
 * Failures arrive as {@link CopyError} — the same envelope every structured edit
 * refuses with, carrying the origin's `message`/`path`/`hint`. That matters more
 * here than anywhere else on this surface: "used 45 times and cannot be deleted"
 * is not an error string, it is the answer.
 */
export async function writePalette(body, fetchImpl = fetch) {
  return copyEnvelope(
    await send(fetchImpl, scoped('/api/palette'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

/**
 * Open a site's conversation (REQ-122).
 *
 * Answers with the stored transcript AND whether the assistant can take a turn,
 * because those are independent: a builder started without an API key still has
 * every earlier conversation, and the panel is supposed to show it alongside the
 * reason it is frozen rather than instead of one or the other.
 */
export async function openChatSession(site, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/ai/session'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ site }),
  })
  if (!res.ok) throw new Error(`POST /api/ai/session → ${res.status}`)
  return res.json()
}

/**
 * The wire value that asks for the BUSINESS's conversation ([[REQ-239]]).
 *
 * THE LITERAL IS DUPLICATED AND A UAT PINS IT. `router.ts` owns
 * `BUSINESS_SESSION_SCOPE`; this file is browser JavaScript and cannot import the
 * Worker's TypeScript, so the two are held equal by a test rather than by an
 * import — the same arrangement `SIGN_OUT_HREF` already has.
 */
export const BUSINESS_SESSION_SCOPE = 'business'

/**
 * Open the settings conversation ([[REQ-239]]).
 *
 * IT NAMES NOTHING, and that is the whole difference from {@link openChatSession}
 * above. A site has to be chosen because a business holds several; the business
 * has already been chosen — it is in the path prefix `scoped()` puts on this very
 * request — so naming it in the body would be this client asserting a scope the
 * origin has already resolved, and would be the one value it could get wrong.
 *
 * THE SAME ROUTE, AND THEREFORE THE SAME ANSWER SHAPE: a transcript, a cursor,
 * and whether a turn can be taken. Everything downstream of it — the pane, the
 * prompt call, the rejoin — is the site conversation's code unchanged, because a
 * conversation is a conversation once it has been opened.
 */
export async function openSettingsSession(fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/ai/session'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scope: BUSINESS_SESSION_SCOPE }),
  })
  if (!res.ok) throw new Error(`POST /api/ai/session → ${res.status}`)
  return res.json()
}

/**
 * Run one turn, as the stream of events the chat panel consumes.
 *
 * NAMED BY SESSION, not by site (REQ-127). The session already knows which site
 * it is about — it was bound to one when {@link openChatSession} created it — so
 * a turn that also named the site would be re-asserting a fact the origin holds
 * authoritatively, and giving this side a site identity to keep in step.
 *
 * The frames are `data: {json}` separated by a blank line; the parse is here
 * rather than in the panel because it is transport, and the panel is deliberately
 * transport-agnostic.
 */
export async function* streamChatPrompt(sessionId, text, fetchImpl = fetch) {
  yield* postEventStream(
    scoped('/api/ai/prompt'),
    { sessionId, text },
    'the assistant failed',
    fetchImpl,
  )
}

/**
 * Rejoin a turn already running, from the cursor `/api/ai/session` handed out
 * (BUG-46).
 *
 * WHY THIS EXISTS AT ALL. A page that loads mid-turn now PAINTS that turn — the
 * origin folds the junction rather than reading the archive, which lags by the
 * whole open turn — but a fold is a still frame of something still moving. The
 * operator would see a reply stopped mid-sentence with no sign it was still
 * being written, and would reload again, which is the loop that lost them a turn
 * in the first place.
 *
 * THE CURSOR IS NOT OPTIONAL AND NOT DEFAULTED. It pairs with the transcript it
 * came back with: the tail resumes at exactly the offset that transcript was
 * folded at, so painted-then-tailed is the reply once, with no gap and nothing
 * repeated. A cursor from anywhere else describes a different fold, and the
 * origin rejects a missing one rather than replaying the conversation into a
 * panel that has already drawn it.
 *
 * SAME EVENT SHAPE AS {@link streamChatPrompt}, because the origin projects the
 * junction's records into the same vocabulary — so a consumer cannot tell a
 * reattached tail from a live turn, and none should have to.
 */
export async function* streamChatReattach(sessionId, cursor, fetchImpl = fetch) {
  yield* postEventStream(
    scoped('/api/ai/reattach'),
    { sessionId, cursor },
    'the assistant could not be rejoined',
    fetchImpl,
  )
}

/**
 * POST `body` and yield the `data: {json}` frames that come back.
 *
 * EXTRACTED RATHER THAN COPIED (BUG-46). The framing is the origin's own —
 * `router.ts` writes `data:` + a blank line, and this is the half that reads it
 * — so the two ends are one decision in two files, not one decision in three.
 * A second transcription of the split-on-blank-line parse is how a fix to one
 * SSE route silently misses the other.
 *
 * A NON-OK RESPONSE BECOMES FRAMES, never a throw: the caller is rendering a
 * conversation, and the honest place to report that the assistant is
 * unreachable is in the conversation.
 */
async function* postEventStream(path, body, failure, fetchImpl) {
  const res = await send(fetchImpl, path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const parsed = await res.json().catch(() => ({}))
    yield { kind: 'text', content: `\n\n_${parsed.error || `${failure} (${res.status})`}_` }
    yield { kind: 'done' }
    return
  }
  yield* readEventStream(res)
}

/**
 * The `data: {json}` frames of an open response, and nothing else.
 *
 * EXTRACTED FROM {@link postEventStream} RATHER THAN COPIED ([[REQ-222]]), on
 * exactly the grounds that function was extracted from the chat routes: the
 * framing is the origin's own, and *"a second transcription of the
 * split-on-blank-line parse is how a fix to one SSE route silently misses the
 * other."* A publish stream is a fourth caller of the parse and a SECOND caller
 * of the non-OK policy — chat renders a refusal as a sentence in the
 * conversation, a publish has no conversation to put one in — so the parse is
 * here, alone, and each caller keeps its own policy above it.
 *
 * IT IS SILENT ABOUT THE END OF THE STREAM, deliberately. Whether a stream that
 * finished without saying so is a success or a failure is the CALLER's question
 * and has different answers: a publish that stops is a publish whose outcome is
 * unknown — which must be read as a failure, because the alternative is telling a
 * client their site is live when it may not be.
 *
 * THIS USED TO SAY "a chat turn that stops is a turn that stopped", AND IT WAS
 * WRONG ([[BUG-123]], `lagrange-framework` BUG-58). A chat stream that ends
 * without the library's terminal `done` did not end the turn — it lost it, and
 * the turn may still be running. That distinction is drawn ABOVE this seam,
 * where it belongs: `webui-chat` already knows what a terminal frame is and
 * reports the difference on `onTurnLost`, and `chat.js` is the only layer with
 * an origin to ask what actually happened. Teaching the parse to re-derive the
 * same predicate would be a second definition of "a turn ended" for the two to
 * drift apart on — which is the failure BUG-64 is already named for, arrived at
 * from the other side.
 */
async function* readEventStream(res) {
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let split
    while ((split = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, split).trim()
      buffer = buffer.slice(split + 2)
      if (frame.startsWith('data:')) yield JSON.parse(frame.slice(5).trim())
    }
  }
}

/** Snapshot the draft into a new revision and render it (DOC-12 §5). */
export async function publishSite(site, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/publish'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ site }),
  })
  if (!res.ok) throw new Error(`POST /api/publish → ${res.status}`)
  return res.json()
}

/**
 * Publish, reporting how far through resizing the images it is ([[REQ-222]]).
 *
 * WHY THE STREAM EXISTS. A first publish of a photo-heavy site has to decode and
 * re-encode every picture on it, which is minutes. A button that goes quiet for a
 * minute reads as a hang, and a client who reloads mid-publish is a client who
 * has learned not to trust the button — so the wait is explained while it happens
 * rather than apologised for afterwards.
 *
 * ASKED FOR BY `Accept`, which is why {@link publishSite} above still exists and
 * is untouched: the two are representations of one resource, and anything with no
 * use for frames keeps getting the envelope.
 *
 * A STREAM THAT ENDS WITHOUT A TERMINAL FRAME IS A FAILURE, and this is the one
 * contract in this file worth reading before changing anything. The response
 * committed `200` before the first rendition was built, so a publish that failed
 * midway cannot report itself as a status — it reports itself in the terminal
 * frame's `ok`. Which means a DROPPED CONNECTION, having produced no terminal
 * frame at all, must not be read as the success the status code claims. Telling a
 * client their site is live when it is not is the worst outcome available here, so
 * the absence of a verdict is treated as the failure it is.
 *
 * @param onProgress told `{total, done}` as the ladder builds. `total` is the
 *   renditions that actually have to be BUILT — a republish finds them all cached
 *   and reports zero, which is what lets the caller stay quiet.
 */
export async function streamPublish(site, onProgress, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/publish'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
    body: JSON.stringify({ site }),
  })
  // A REFUSAL BEFORE THE STREAM OPENS IS STILL AN ORDINARY STATUS, and it is the
  // only failure here that has one — an invalid draft, a missing site, a lapsed
  // session. Read as JSON, because that is what the router answers with when it
  // refuses before committing to a stream.
  //
  // AND THE STATUS SURVIVES THE THROW ([[REQ-250]]). By the time the builder sees
  // this it is an `Error` like every other publish failure, and one of them — a
  // site with no public address — is not a line of text about something that went
  // wrong, it is a decision nobody has made yet and a route to making it. Losing
  // the status here would mean reading the class of a refusal out of its prose,
  // which is a second copy of the rule the Worker already applied. `code` is what
  // is actually branched on, because 409 is a shape and `NO_PUBLIC_ADDRESS` is
  // the answer; `status` rides along because it costs nothing and the next caller
  // to need one should not have to come back here for it.
  if (!res.ok) {
    const parsed = await res.json().catch(() => ({}))
    const refusal = new Error(parsed.error || `POST /api/publish → ${res.status}`)
    refusal.status = res.status
    if (parsed.code) refusal.code = parsed.code
    throw refusal
  }

  let terminal = null
  for await (const frame of readEventStream(res)) {
    if (frame.kind === 'progress') onProgress?.(frame)
    else if (frame.kind === 'done') terminal = frame
  }
  if (terminal === null) {
    throw new Error('The publish stopped before it said whether it finished.')
  }
  if (terminal.ok !== true) throw new Error(terminal.error || 'the publish failed')
  return terminal
}

/**
 * Everything the client has given us, for the business in scope (REQ-161).
 *
 * NO SITE, AND NOTHING FOR ONE TO NARROW (REQ-181). The scope is carried by the
 * URL prefix `scoped()` writes, and a business holds one site in v1 — so a site
 * key here could only ever repeat what the prefix already says. Material belongs
 * to the business, not to one of its sites.
 *
 * IT ANSWERS `{material, seq}` NOW (REQ-201). `seq` is the change cursor the
 * origin read BEFORE it listed, and it is what {@link subscribeMaterial} opens
 * from — which is the only way to be sure a write landing between the load and
 * the subscription is in one of them. The other order would put it in neither.
 */
export async function fetchMaterial(fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/material'))
  if (!res.ok) throw new Error(`GET /api/material → ${res.status}`)
  return res.json()
}

/**
 * Watch this business's material for changes (REQ-201, DOC-24).
 *
 * `EventSource` RATHER THAN THE HAND-ROLLED READER {@link postEventStream} IS.
 * That one exists because the chat routes are POSTs and a POST cannot be an
 * `EventSource`; this route is a GET precisely so it can be. What the browser
 * then does for free is the part of a subscription least worth writing twice —
 * it reconnects with backoff, and it re-presents the last `id:` it saw as
 * `Last-Event-ID`, so a dropped connection resumes at the exact record it
 * stopped on. The origin seeds that id with a `ready` frame before anything can
 * move it, so there is no window in which the browser has no cursor to present.
 *
 * `since` SEEDS THE FIRST CONNECTION ONLY, and it comes from the list read
 * rather than from here: `fetchMaterial` returns the cursor the origin read
 * at BEFORE it listed, so nothing that lands between the load and the
 * subscription is missed. Every reconnect after that carries the header instead.
 *
 * SCOPED LIKE EVERY OTHER READ. `scoped()` puts the business in the path, so the
 * feed a tab opens is the feed for the business the header names — the origin
 * binds the tenant into the store handle from that prefix, and there is no
 * cross-business form of this URL to construct.
 *
 * RETURNS A CLOSER AND NOTHING ELSE. A business switch closes one and opens
 * another under the new scope, which is the whole of the caller's business with
 * it.
 *
 * @param {number} since the cursor `fetchMaterial` returned
 * @param {(change: object) => void} onChange one frame, already parsed
 * @param {object} [opts]
 * @param {typeof EventSource} [opts.EventSourceImpl] the constructor, injected
 *   by tests — jsdom has no `EventSource`, and a suite driving this would be
 *   asserting a polyfill rather than the contract.
 * @returns {{close: () => void}}
 */
export function subscribeMaterial(since, onChange, { EventSourceImpl = globalThis.EventSource } = {}) {
  if (typeof EventSourceImpl !== 'function') {
    // NOT AN ERROR, AND NOT SILENT EITHER. A browser without `EventSource` still
    // gets a working Library — it is the one that refreshes only when it wrote,
    // which is exactly what this tab did before REQ-201. Throwing would trade a
    // missing improvement for a broken tab.
    return { close: () => {} }
  }
  const source = new EventSourceImpl(scoped(`/api/material/changes?since=${encodeURIComponent(since)}`))
  source.onmessage = (event) => {
    let change
    try {
      change = JSON.parse(event.data)
    } catch {
      // A frame we cannot parse is one we cannot act on, and there is no
      // operator-facing thing to say about it. The next one still arrives.
      return
    }
    onChange(change)
  }
  // NO `onerror` HANDLER, deliberately. `EventSource` reconnects on its own and
  // an error is how it announces that it is about to — handling it here could
  // only mean either duplicating that retry or closing a connection the browser
  // was going to repair.
  return { close: () => source.close() }
}

/** One piece of material with its description — the row plus the body. */
export async function fetchMaterialItem(uid, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped(`/api/material/item?uid=${encodeURIComponent(uid)}`))
  if (!res.ok) throw new Error(`GET /api/material/item → ${res.status}`)
  return res.json()
}

/**
 * Where the detail pane loads a material's own bytes from.
 *
 * A URL rather than a fetch, because the consumer is an `<img>`/`<a>` and the
 * browser is better at streaming bytes into one than we are. Same-origin by
 * construction, like {@link previewUrl}.
 */
export function materialFileUrl(uid, member) {
  const base = scoped(`/api/material/file?uid=${encodeURIComponent(uid)}`)
  // `member` NAMES ONE FILE INSIDE A CAPTURE (REQ-166). A capture is 11–99
  // attachment records on one ticket, so the bare URL — which serves whichever
  // record comes back first — cannot name the screenshot. Absent is unchanged
  // for every single-file material.
  return member ? `${base}&member=${encodeURIComponent(member)}` : base
}

/**
 * Send one dropped file (REQ-161).
 *
 * `role` IS ALWAYS SENT, because this function is only ever reached from the
 * overlay and the overlay has no drop target that is not one of the two areas.
 * The route tolerates its absence for the pipeline's older callers; this side
 * never exercises that tolerance, which is what makes "the client chose"
 * mechanically true rather than a matter of remembering.
 *
 * `site` is optional and means "and put it on this site if the role says so" —
 * the origin promotes it into that site's asset library, so a dropped logo is
 * pickable the same second.
 *
 * IT IS AN INSTRUCTION, NOT A LABEL (BUG-47). The conditional in that sentence
 * is the whole of it: nothing on the material records this site, because a file
 * dropped on *"just for you to read"* is sent with one and must never come back
 * badged as being on the site. Only the promotion the origin performs writes
 * `placed_on`, and only when the bytes actually land.
 */
export async function uploadMaterial({ file, role, site }, fetchImpl = fetch) {
  const form = new FormData()
  form.append('file', file)
  form.append('role', role)
  if (site) form.append('site', site)
  return copyEnvelope(await send(fetchImpl, scoped('/api/material'), { method: 'POST', body: form }))
}

/**
 * Delete one piece of the client's material ([[REQ-281]]).
 *
 * `DELETE` ON THE LIST'S OWN PATH, which is the route's shape and not a choice
 * made here — see `router.ts`. The uid travels in the query string because a
 * `DELETE` body is the one request shape browsers and intermediaries disagree
 * about, and there is nothing else to send.
 *
 * THROUGH `copyEnvelope`, like every other material write, so a refusal arrives
 * as a `CopyError` carrying the origin's own sentence. The pane has somewhere to
 * put that: this is the one action on the Library that cannot be rolled back by
 * simply re-rendering, so a silent failure would leave a client believing a file
 * is gone when it is not.
 */
export async function deleteMaterial(uid, fetchImpl = fetch) {
  return copyEnvelope(
    await send(fetchImpl, scoped(`/api/material?uid=${encodeURIComponent(uid)}`), {
      method: 'DELETE',
    }),
  )
}

/**
 * Correct what we said a piece of material is (REQ-161).
 *
 * The body is the description (DOC-38 §6), and the origin re-indexes it — which
 * is the half that makes the correction reach retrieval rather than just the
 * screen.
 */
export async function saveMaterialDescription(uid, body, fetchImpl = fetch) {
  return copyEnvelope(
    await send(fetchImpl, scoped('/api/material/description'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uid, body }),
    }),
  )
}

/**
 * Fix what a piece of material is CALLED ([[REQ-220]]).
 *
 * THE LIBRARY NAME, WHICH IS THE TICKET'S TITLE. The Library lists a row under it
 * and the modal shows the same one; the filename is a different fact and this
 * never touches it. `material-name.js` is the field both surfaces mount and this
 * is the one call it commits through, which is what *"editing it in either place
 * changes the same thing"* actually rests on.
 *
 * THROUGH `copyEnvelope`, for the reason the role call gives: the origin refuses
 * an empty name with a sentence written for the person who cleared the box, and
 * `mountFields` shows exactly that sentence against the field it rolled back.
 */
export async function saveMaterialName(uid, title, fetchImpl = fetch) {
  return copyEnvelope(
    await send(fetchImpl, scoped('/api/material/name'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uid, title }),
    }),
  )
}

/**
 * Write how a picture is edited and framed ([[REQ-220]], [[REQ-219]]).
 *
 * IT SENDS A RECIPE AND NEVER BYTES. The original is untouched by construction:
 * there is no byte in this request, so no call on this path can destroy a
 * photograph however it fails.
 *
 * IT SENDS THE LIST AND NOTHING BESIDE IT. Per-placement framing — *when a band
 * forces an aspect on this picture, keep this bit in frame* — is a property of
 * the L1 image node and not of the material, so there is nothing else on this
 * path for it to carry.
 */
export async function saveMaterialRecipe(uid, recipe, fetchImpl = fetch) {
  return copyEnvelope(
    await send(fetchImpl, scoped('/api/material/recipe'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uid, recipe }),
    }),
  )
}

/**
 * The material a file URL names, or `null` for a URL that names none.
 *
 * **THE INVERSE OF `materialFileUrl`, AND IT LIVES BESIDE IT.** The chat shows a
 * picture as markdown, so what reaches the DOM is an `<img>` carrying a URL and
 * nothing else — and opening the editor from it needs the uid. That makes the
 * parse a real contract between the tool that writes the line and the surface
 * that reads it, so it is written once, here, next to the function that forms the
 * address. Two places that each knew the shape is how they come to disagree about
 * it.
 *
 * RELATIVE OR ABSOLUTE, because a browser resolves an `<img src>` against the
 * document before anyone reads it back: the string written into the markdown and
 * the string read off the element are not the same string, and only one of them
 * has an origin on the front.
 *
 * IT ANSWERS FOR THE FILE ROUTE AND FOR NOTHING ELSE. A picture from anywhere
 * else in the world is a picture in a conversation, which is fine, and is not a
 * material this product can open.
 */
export function materialUidFromUrl(src) {
  let url
  try {
    url = new URL(String(src ?? ''), 'http://local.invalid/')
  } catch {
    return null
  }
  if (url.pathname !== '/api/material/file') return null
  // A MEMBER NAMES ONE FILE INSIDE A CAPTURE ([[REQ-166]]), and a capture is not
  // a picture the editor opens — so a URL that addresses one is declined here
  // rather than resolved to a uid the editor would then have to refuse.
  if (url.searchParams.get('member')) return null
  const uid = url.searchParams.get('uid')
  return uid || null
}

/**
 * Correct what a piece of material is FOR ([[REQ-213]]).
 *
 * `role` IS THE WIRE VALUE (`site` | `reference`) AND NOT THE LABEL the client
 * saw. The Library's select is built from the upload overlay's own areas so the
 * two surfaces cannot show different words for the same thing, but the words are
 * a presentation of the value and the origin has never been asked to parse them.
 *
 * THROUGH `copyEnvelope`, WHICH IS THE POINT OF THE CALL AS MUCH AS THE WRITE.
 * The origin refuses this in two named ways — material whose role was inferred
 * rather than chosen, and a file already on the site — and each refusal carries a
 * sentence written for the person who clicked. `copyEnvelope` turns the failure
 * envelope into a `CopyError` whose `message` IS that sentence, which is what
 * `mountFields` then shows inline against the field it rolled back.
 */
export async function saveMaterialRole(uid, role, fetchImpl = fetch) {
  return copyEnvelope(
    await send(fetchImpl, scoped('/api/material/role'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uid, role }),
    }),
  )
}

// --- the User tab ([[REQ-170]]) -----------------------------------------------
//
// SCOPED LIKE EVERY OTHER READ. `scoped()` puts the selected business in the
// path, so "the people of this business" is answered by the same mechanism that
// decides which site the editor is editing — the tab has no scope of its own and
// cannot acquire one ([[DOC-42]] §7).

/**
 * Everyone in this business, contacts included, plus whether we may fulfil.
 *
 * IT ALSO CARRIES `seq` ([[REQ-233]]) — the cursor the origin read BEFORE it
 * listed, which is what {@link subscribeContacts} opens the change feed at. Read
 * in that order, a write landing between the two is in the page and in the
 * replay, which patches a row the pane already drew and is idempotent.
 */
export async function fetchPeople(fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/people'))
  if (!res.ok) throw new Error(`GET /api/people → ${res.status}`)
  return res.json()
}

/**
 * Watch this business's contacts for changes ([[REQ-233]]).
 *
 * THE SAME MECHANISM AS {@link subscribeMaterial} AND FOR THE SAME REASONS —
 * a `GET` so it can be an `EventSource`, so the browser does the reconnect and
 * the `Last-Event-ID` resume for free; `scoped()` so the feed a tab opens is the
 * feed for the business the prefix names; a closer and nothing else, so a
 * business switch is close-one-open-another.
 *
 * `since` IS A STRING HERE AND A NUMBER THERE, and the difference is real rather
 * than cosmetic. Material rides a change log with a monotonic counter; a contact
 * is a `users` row whose cursor is `<updated_at>|<id>` — an instant and a tie
 * break. Nothing on this side interprets it: it comes from `fetchPeople`'s
 * answer and goes back out unread, which is what keeps its shape the origin's.
 *
 * SEEDS THE FIRST CONNECTION ONLY. `fetchPeople` returns the cursor the origin
 * read at BEFORE it listed, so nothing that lands between the load and the
 * subscription is missed. Every reconnect after that carries the header instead.
 *
 * @param {string} since the cursor `fetchPeople` returned
 * @param {(change: object) => void} onChange one frame, already parsed
 * @param {object} [opts]
 * @param {typeof EventSource} [opts.EventSourceImpl] the constructor, injected
 *   by tests — jsdom has no `EventSource`, and a suite driving this would be
 *   asserting a polyfill rather than the contract.
 * @returns {{close: () => void}}
 */
export function subscribeContacts(since, onChange, { EventSourceImpl = globalThis.EventSource } = {}) {
  if (typeof EventSourceImpl !== 'function') {
    // NOT AN ERROR, AND NOT SILENT EITHER. A browser without `EventSource` still
    // gets a working Contacts pane — the one that redraws when the operator
    // wrote, which is exactly what this tab did before REQ-233. Throwing would
    // trade a missing improvement for a broken tab.
    return { close: () => {} }
  }
  const source = new EventSourceImpl(scoped(`/api/people/changes?since=${encodeURIComponent(since)}`))
  source.onmessage = (event) => {
    let change
    try {
      change = JSON.parse(event.data)
    } catch {
      // A frame we cannot parse is one we cannot act on, and there is no
      // operator-facing thing to say about it. The next one still arrives.
      return
    }
    onChange(change)
  }
  // NO `onerror` HANDLER, deliberately — see {@link subscribeMaterial}.
  return { close: () => source.close() }
}

/** One person, with the businesses they run and the grants they hold. */
export async function fetchPerson(id, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped(`/api/people/detail?id=${encodeURIComponent(id)}`))
  if (!res.ok) throw new Error(`GET /api/people/detail → ${res.status}`)
  return res.json()
}

/**
 * What we have said to one person, and whether it arrived ([[REQ-198]]).
 *
 * A SECOND CALL RATHER THAN A FIELD ON THE DETAIL. The detail is identity-schema
 * data and this is the tenant's ticket store; keeping them apart lets the pane
 * draw who somebody is without waiting on a second store, which is the read most
 * likely to be slow.
 */
export async function fetchPersonMessages(id, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped(`/api/people/messages?id=${encodeURIComponent(id)}`))
  if (!res.ok) throw new Error(`GET /api/people/messages → ${res.status}`)
  return res.json()
}

/**
 * The rest of one contact's history ([[REQ-267]] §8).
 *
 * THE DETAIL CARRIES THE FIRST PAGE AND THIS CARRIES THE NEXT. Paging on first
 * paint would cost a whole round trip for a control most contacts never need;
 * what this answers is *the page after the one you have*, which nobody needs
 * until they have pressed something.
 *
 * THE CURSOR IS THE SERVER'S AND IS PASSED BACK UNREAD. It encodes the
 * timeline's own ordering; a client that parsed or composed one would be a
 * second definition of that ordering, free to disagree with the query's.
 */
export async function fetchPersonEvents(id, before, fetchImpl = fetch) {
  const url = scoped(
    `/api/people/events?id=${encodeURIComponent(id)}&before=${encodeURIComponent(before ?? '')}`,
  )
  const res = await send(fetchImpl, url)
  if (!res.ok) throw new Error(`GET /api/people/events → ${res.status}`)
  return res.json()
}

/**
 * Mail from senders this business does not know ([[REQ-267]] §6).
 *
 * NOT A LIST OF PEOPLE. Nothing was created for any of them — the whole point of
 * the queue is that a stranger's message does not mint a contact — so what comes
 * back is messages, and what the operator does with one is decide whether it
 * should become a person at all.
 */
export async function fetchPendingInbound(fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/people/inbound'))
  if (!res.ok) throw new Error(`GET /api/people/inbound → ${res.status}`)
  return res.json()
}

/** This stranger is a contact: create them, and give them their mail. */
export async function promoteInbound(uid, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/people/inbound/promote'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ uid }),
  })
  if (!res.ok) throw new Error(`POST /api/people/inbound/promote → ${res.status}`)
  return res.json()
}

/**
 * Stop asking about this sender, or start again ([[REQ-267]] §6).
 *
 * ONE FUNCTION WITH A DIRECTION rather than two exports, because the caller is
 * one control with two states and the pair would otherwise be kept in step by
 * whoever remembered. The two PATHS stay separate — a client sending the wrong
 * string must not be able to perform the opposite act.
 */
export async function setInboundSuppressed(address, suppressed, fetchImpl = fetch) {
  const path = suppressed ? '/api/people/inbound/discard' : '/api/people/inbound/restore'
  const res = await send(fetchImpl, scoped(path), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address }),
  })
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`)
  return res.json()
}

/**
 * Correct who somebody is: the address, and every part of the name ([[BUG-54]],
 * [[REQ-193]]).
 *
 * A PATCH AND NOT A RECORD. The fields panel commits one field at a time, so
 * what arrives here is `{email}` or `{knownAs}` and the route changes only what
 * it was given. Sending the whole record instead would write back every other
 * value this pane happened to be holding — including one a concurrent edit had
 * already moved on from.
 *
 * ONLY THE DECLARED KEYS ARE FORWARDED, chosen here rather than spread. The
 * panel's change object is the widget's, and a route that took whatever it was
 * handed would grow whatever the widget's schema grows — silently, and on a
 * table where the other columns are the record of what the system observed. The
 * name's own keys come from `people-name.js`, so a part added to the model
 * travels without this file being edited and cannot be a box that saves nothing.
 *
 * `nameReason` IS FORWARDED AND IS NEVER SUPPLIED HERE. The record pane omits it
 * and the server reads that as a correction; only the name-change dialog sends
 * `changed`, because a former name that is searched and displayed has to come
 * from a deliberate act ([[REQ-193]]).
 *
 * THE MESSAGE IS READ BACK on a refusal, like the invite's. 400 here is a
 * malformed address or one somebody in this business already holds, and those
 * are different problems with the same number; the panel prints the sentence
 * beside the box rather than the status code.
 */
export async function savePersonRecord(id, patch = {}, fetchImpl = fetch) {
  const body = { id }
  if ('email' in patch) body.email = patch.email
  for (const key of NAME_PART_NAMES) if (key in patch) body[key] = patch[key]
  if ('nameReason' in patch) body.nameReason = patch.nameReason
  const res = await send(fetchImpl, scoped('/api/people/record'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const said = await res.json().catch(() => null)
    throw new Error(said?.error || `POST /api/people/record → ${res.status}`)
  }
  return res.json()
}

/**
 * Add a contact, and do nothing else ([[REQ-199]]).
 *
 * ITS OWN CALL AND NOT A FLAG ON THE INVITE. Adding somebody records them as a
 * **Lead**; inviting them emails a stranger. One function with an `alsoInvite`
 * boolean would make that difference a parameter, and that parameter eventually
 * defaults wrong in the direction that mails people.
 *
 * `scoped()` LIKE EVERY OTHER WRITE, which is what makes one control serve both
 * levels: the business in the path is the business the row lands in, so the tab
 * has no level of its own to declare ([[DOC-42]] §3).
 */
export async function addContact(email, displayName, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/people/add'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, displayName }),
  })
  // The message is READ BACK on a refusal rather than discarded for the status.
  // 403 here means "you do not own this business" and 400 means "you typed
  // nothing"; a caller shown only the number has to guess which, and the panel
  // puts the sentence in front of the operator.
  if (!res.ok) {
    const said = await res.json().catch(() => null)
    throw new Error(said?.error || `POST /api/people/add → ${res.status}`)
  }
  return res.json()
}

/**
 * What the invite modal opens with: the sender, and the template's copy
 * ([[REQ-199]], [[REQ-197]]).
 *
 * READ FROM THE SERVER RATHER THAN HELD HERE. The copy lives in this business's
 * own ticket store and changes without a deploy, so a default written into the
 * browser bundle would be a second answer that is stale the moment anybody edits
 * the template — and stale in the one direction nobody notices, because the
 * modal would still look filled in.
 */
export async function fetchInviteDraft(fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/people/invite'))
  if (!res.ok) {
    const said = await res.json().catch(() => null)
    throw new Error(said?.error || `GET /api/people/invite → ${res.status}`)
  }
  return res.json()
}

/**
 * Invite the checked contacts — one message each ([[REQ-199]]).
 *
 * IDS AND NOT ADDRESSES. The rows are already here; the address each message
 * goes to is that contact's PRIMARY one, which the schema guarantees rather than
 * this client choosing. Sending addresses from the browser would let a stale
 * list mail somewhere the row no longer says.
 *
 * NO `from` IS SENT. The sending address is the deployment's and the modal shows
 * it without offering it — a field a client could set and the server ignored is
 * a field that eventually gets believed.
 *
 * `subject` AND `body` ARE FOR THIS SEND. They go up because the operator may
 * have changed them, and nothing on this path writes them back to the template.
 */
export async function invitePeople(ids, subject, body, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/people/invite'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids, subject, body }),
  })
  if (!res.ok) {
    const said = await res.json().catch(() => null)
    throw new Error(said?.error || `POST /api/people/invite → ${res.status}`)
  }
  return res.json()
}

/**
 * Provision a business for an existing account — 1st Contact filling an order.
 *
 * `/api/admin/` AND NOT `scoped()`, and the difference is the ticket's ([[REQ-180]]
 * D2). Inviting is scoped because it writes into the business you are in;
 * provisioning MAKES a business and belongs to no existing one, which is also why
 * it is gated on the second of [[DOC-42]] §7's two conditions and the invite is
 * not.
 */
export async function provisionBusinessFor(accountEmail, name, fetchImpl = fetch) {
  const res = await send(fetchImpl, '/api/admin/businesses', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accountEmail, name }),
  })
  if (!res.ok) {
    const said = await res.json().catch(() => null)
    throw new Error(said?.error || `POST /api/admin/businesses → ${res.status}`)
  }
  return res.json()
}

/** Open a dated grant. `businessId` is required; `accountId` null is capacity. */
export async function openGrant(spec, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/grants'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(spec),
  })
  if (!res.ok) throw new Error(`POST /api/grants → ${res.status}`)
  return res.json()
}

/** Withdraw one. The row survives — see the route's comment. */
export async function revokeGrant(id, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/grants/revoke'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) throw new Error(`POST /api/grants/revoke → ${res.status}`)
  return res.json()
}

/**
 * Change what the business is called ([[REQ-239]], [[REQ-237]]).
 *
 * THE SAME OPERATION THE ASSISTANT CALLS, reached the only way a browser can.
 * `/api/business/name` and the `settings` surface's `rename_business` both bottom
 * out in `business.ts`'s one rule, over the account that owns the business — so
 * the field and the conversation cannot come to permit different names, which is
 * the failure that would leave a customer told two different things with no way
 * to know which is right.
 *
 * `scoped()` LIKE EVERY OTHER WRITE, and here it is what makes the call safe to
 * have no id in it: the business in the path is the business being renamed, so
 * there is no name-a-business parameter for anything to get wrong.
 *
 * THE MESSAGE IS READ BACK ON A REFUSAL. A 409 is a name another of this
 * account's businesses already holds and names it; a 400 is an empty one; a 403
 * is a membership that may operate this business but not re-label it. Those are
 * three different things to do next and a status code is not one of them.
 */
export async function saveBusinessName(name, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/business/name'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const said = await res.json().catch(() => null)
    throw new Error(said?.error || `POST /api/business/name → ${res.status}`)
  }
  return res.json()
}

/**
 * The three calls the free web address is chosen with ([[REQ-249]], [[REQ-238]]).
 *
 * THREE ORDINARY CALLERS OF ROUTES THAT ALREADY EXIST, and nothing below decides
 * anything. What a hostname may be, which labels are kept, and whether one is
 * free are [[REQ-238]]'s and are answered by the Worker — this module carries the
 * question there and the answer back. A client that re-derived any of it would be
 * a second rule that can disagree with the first, and the customer would have no
 * way to tell which is right.
 */

/**
 * What addresses this business holds, and the apex they sit under.
 *
 * THE APEX COMES WITH THEM AND IS NOT WRITTEN HERE. A surface about to ask
 * somebody to choose a permanent name has to show the WHOLE host as it will be,
 * and `1stc.site` composed in the browser would be a second place that string
 * lives — one that can fall out of step with the one the Worker actually issues.
 */
export async function fetchAddresses(fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/hostname'), { method: 'GET' })
  if (!res.ok) throw new Error(`GET /api/hostname → ${res.status}`)
  return res.json()
}

/**
 * Is this one free?
 *
 * IT ANSWERS 200 FOR A NAME IT REFUSES, so a refusal is read out of the body and
 * never out of the status. "Taken" is the answer to the question rather than a
 * failure to answer it, and treating it as an error is what would turn the most
 * ordinary outcome of a first-come namespace into something that looks broken.
 */
export async function checkHostname(label, fetchImpl = fetch) {
  const res = await send(
    fetchImpl,
    scoped(`/api/hostname/check?label=${encodeURIComponent(label)}`),
    { method: 'GET' },
  )
  if (!res.ok) throw new Error(`GET /api/hostname/check → ${res.status}`)
  return res.json()
}

/**
 * The refusal a claim came back with.
 *
 * IT CARRIES THE ROUTE'S OWN DISTINCTION rather than a status code. `taken` is
 * the race — somebody took it between the check and the press — and is the one
 * the pane has a sentence of its own for; `held` is this business already having
 * one, and names it. Everything else is the Worker's sentence, shown as it came.
 */
export class HostnameClaimError extends Error {
  constructor(envelope, status) {
    super(envelope?.error || `claim refused (${status})`)
    this.name = 'HostnameClaimError'
    this.status = status
    this.taken = envelope?.taken === true
    this.host = envelope?.host ?? null
    this.held = envelope?.held ?? null
  }
}

/**
 * Take it. Final.
 *
 * IT DOES NOT CHECK FIRST. The Worker's unique index is the authority and a
 * check immediately beforehand would be the same race with an extra round trip
 * and a more confident-looking answer.
 */
export async function claimHostname(label, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/hostname/claim'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ label }),
  })
  if (!res.ok) throw new HostnameClaimError(await res.json().catch(() => null), res.status)
  return res.json()
}

/**
 * The customer's own domain — the selector, the sending toggle, and release
 * ([[REQ-259]]).
 *
 * FOUR ORDINARY CALLERS OF `/api/domain`, and nothing below decides anything.
 * Which domains this account holds, whether one is free, whether this person may
 * spend it, and where the sending verification got to are all answered by the
 * Worker; this module carries the question there and the answer back. A client
 * that re-derived any of it would be a second rule that can disagree with the
 * first — and here the disagreement would be a selector offering a domain the
 * attach then refuses.
 *
 * NOTHING HERE NAMES A RECORD. The wire shape carries a domain, an availability,
 * a sentence and a state word; there is no field for a record type or a zone id,
 * which is what makes *"if a customer is being shown a record type, we have
 * failed"* a property of the API rather than a discipline of the section.
 */

/** What the domain section draws itself from, including the verification state. */
export async function fetchDomain(fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/domain'), { method: 'GET' })
  if (!res.ok) throw new Error(`GET /api/domain → ${res.status}`)
  return res.json()
}

/**
 * Point one at this site.
 *
 * `email` DEFAULTS ON AND IS SENT EXPLICITLY. The Worker treats anything but
 * `false` as on, so the two agree by construction — and sending it explicitly is
 * what lets the toggle beside the selector mean something before the attach
 * rather than only after it.
 */
export async function attachDomain(domain, email = true, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/domain'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ domain, email }),
  })
  if (!res.ok) {
    const said = await res.json().catch(() => null)
    throw new Error(said?.error || `POST /api/domain → ${res.status}`)
  }
  return res.json()
}

/** Take it off this site. The zone stays on the account and stays in the pool. */
export async function releaseDomain(fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/domain'), { method: 'DELETE' })
  if (!res.ok) {
    const said = await res.json().catch(() => null)
    throw new Error(said?.error || `DELETE /api/domain → ${res.status}`)
  }
  return res.json()
}

/**
 * What we have changed about this domain, newest first ([[REQ-260]]).
 *
 * SENTENCES AND NOT RECORDS. The origin answers with the sentence each change
 * was announced with; there is no record type, value or zone anywhere in it,
 * which is what makes *"if a customer is being shown a record type, we have
 * failed"* a property of the API rather than a discipline of the section.
 */
export async function fetchDnsChanges(fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/domain/changes'), { method: 'GET' })
  if (!res.ok) throw new Error(`GET /api/domain/changes -> ${res.status}`)
  return res.json()
}

/**
 * Put one back ([[REQ-260]]).
 *
 * THE REFUSAL IS THE INTERESTING ANSWER and it arrives as a 409 carrying a
 * sentence — the settings have moved since, so putting this back would undo the
 * newer change as well. It is shown verbatim: it was written to be read out.
 */
export async function undoDnsChange(change, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/domain/changes/undo'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ change }),
  })
  if (!res.ok) {
    const said = await res.json().catch(() => null)
    throw new Error(said?.error || `POST /api/domain/changes/undo -> ${res.status}`)
  }
  return res.json()
}

/** Send from it, or stop. Separately reversible from the attachment itself. */
export async function setDomainEmail(enabled, fetchImpl = fetch) {
  const res = await send(fetchImpl, scoped('/api/domain/email'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ enabled }),
  })
  if (!res.ok) {
    const said = await res.json().catch(() => null)
    throw new Error(said?.error || `POST /api/domain/email → ${res.status}`)
  }
  return res.json()
}

/**
 * A `from`/`to` pair as the meter routes take it ([[REQ-297]]).
 *
 * BOTH ENDS OMITTED WHEN NULL, rather than sent empty. The routes read absent as
 * UNBOUNDED and an empty string as absent, but a query string that carries
 * `from=` says the caller meant to name one and could not — which is a different
 * thing from not asking, and only one of them should be indistinguishable from
 * the other.
 */
function periodParams({ from = null, to = null } = {}, into = new URLSearchParams()) {
  if (from) into.set('from', from)
  if (to) into.set('to', to)
  return into
}

/** The same, as a `?…` suffix — empty when nothing is bounded. */
function query(params) {
  const text = params.toString()
  return text === '' ? '' : `?${text}`
}

/**
 * Every business's cost over a period, dearest first ([[REQ-297]]).
 *
 * `/api/admin/` AND NOT `scoped()`, on `provisionBusinessFor`'s reasoning: this
 * is a question about the PLATFORM rather than about the business the operator
 * happens to have selected, and prefixing it with one would suggest the answer
 * varied by which. An operator comparing two of them is asking about somebody
 * else's meter by definition.
 */
export async function fetchTenantCost(period = {}, fetchImpl = fetch) {
  const path = `/api/admin/spend/businesses${query(periodParams(period))}`
  const res = await send(fetchImpl, path, {})
  if (!res.ok) {
    const said = await res.json().catch(() => null)
    throw new Error(said?.error || `GET ${path} → ${res.status}`)
  }
  return res.json()
}

/**
 * One tenant's period in detail — the report, its days, and what it delegated.
 *
 * THE SAME ROUTE [[REQ-293]] ALREADY OWNS, widened rather than duplicated. The
 * report this returns IS that route's report, which is what makes the console's
 * figures checkable against the one endpoint that is authoritative about them.
 */
export async function fetchTenantSpend(business, period = {}, fetchImpl = fetch) {
  const params = new URLSearchParams({ business })
  const path = `/api/admin/spend${query(periodParams(period, params))}`
  const res = await send(fetchImpl, path, {})
  if (!res.ok) {
    const said = await res.json().catch(() => null)
    throw new Error(said?.error || `GET ${path} → ${res.status}`)
  }
  return res.json()
}
