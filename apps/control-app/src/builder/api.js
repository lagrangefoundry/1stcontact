/**
 * The builder's calls back to its origin.
 *
 * Everything the builder needs that a Worker cannot do — list the site store,
 * read a rendered channel off disk, run `publish` — is Node-side, so it is
 * reached over same-origin HTTP rather than imported. Keeping the URL shapes in
 * one module is what lets the pane, the toolbar and the tests agree on them.
 */

/**
 * The URL a rendered channel is served at. Same-origin by construction: a
 * relative path, so the iframe is never cross-origin and "open in new tab"
 * lands on the identical document (DOC-28 §10).
 */
export function previewUrl(slug, channel) {
  return `/preview/${encodeURIComponent(slug)}/${encodeURIComponent(channel)}/`
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
export function assetUrl(slug, handle) {
  const trimmed = String(handle ?? '').trim()
  if (trimmed === '') return ''
  if (COMPLETE_REFERENCE.test(trimmed)) return trimmed
  return previewUrl(slug, 'draft') + trimmed.replace(/^\.?\/+/, '')
}

/** Every site in the store, newest revision included. */
export async function fetchSites(fetchImpl = fetch) {
  const res = await fetchImpl('/api/sites')
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
export async function fetchAssets(slug, fetchImpl = fetch) {
  const res = await fetchImpl(`/api/assets?slug=${encodeURIComponent(slug)}`)
  if (!res.ok) throw new Error(`GET /api/assets → ${res.status}`)
  return res.json()
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
  const q = new URLSearchParams({ slug: target.slug, page: target.page, path: target.path })
  if (target.module) q.set('module', target.module)
  if (target.slot) q.set('slot', target.slot)
  return copyEnvelope(await fetchImpl(`/api/copy?${q}`))
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
export async function saveCopy(target, values, fetchImpl = fetch) {
  return copyEnvelope(
    await fetchImpl('/api/copy', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...target, values }),
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
export async function fetchPalette(slug, fetchImpl = fetch) {
  return copyEnvelope(await fetchImpl(`/api/palette?slug=${encodeURIComponent(slug)}`))
}

/**
 * Apply one palette operation (REQ-133 §5).
 *
 * `body` is `{slug, op, name, …}` where `op` is `set` | `add` | `rm` | `rename`.
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
    await fetchImpl('/api/palette', {
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
export async function openChatSession(slug, fetchImpl = fetch) {
  const res = await fetchImpl('/api/ai/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug }),
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
    '/api/ai/prompt',
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
    '/api/ai/reattach',
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
  const res = await fetchImpl(path, {
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
export async function publishSite(slug, fetchImpl = fetch) {
  const res = await fetchImpl('/api/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug }),
  })
  if (!res.ok) throw new Error(`POST /api/publish → ${res.status}`)
  return res.json()
}

/**
 * Everything the client has given us, tenant-wide (REQ-161).
 *
 * NO SLUG. The Library is deliberately not site-scoped — DOC-38 §7.7 lets one
 * blob back two sites, and DOC-10 §4.1 makes shared knowledge across a client's
 * sites deliberate. "Used on this site" is a badge the list computes from
 * `placed_on` on each row, never a request the origin filters.
 */
export async function fetchMaterial(fetchImpl = fetch) {
  const res = await fetchImpl('/api/material')
  if (!res.ok) throw new Error(`GET /api/material → ${res.status}`)
  return res.json()
}

/** One piece of material with its description — the row plus the body. */
export async function fetchMaterialItem(uid, fetchImpl = fetch) {
  const res = await fetchImpl(`/api/material/item?uid=${encodeURIComponent(uid)}`)
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
export function materialFileUrl(uid) {
  return `/api/material/file?uid=${encodeURIComponent(uid)}`
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
 * `slug` is optional and means "and put it on this site if the role says so" —
 * the origin promotes it into that site's asset library, so a dropped logo is
 * pickable the same second.
 *
 * IT IS AN INSTRUCTION, NOT A LABEL (BUG-47). The conditional in that sentence
 * is the whole of it: nothing on the material records this slug, because a file
 * dropped on *"just for you to read"* is sent with one and must never come back
 * badged as being on the site. Only the promotion the origin performs writes
 * `placed_on`, and only when the bytes actually land.
 */
export async function uploadMaterial({ file, role, slug }, fetchImpl = fetch) {
  const form = new FormData()
  form.append('file', file)
  form.append('role', role)
  if (slug) form.append('slug', slug)
  return copyEnvelope(await fetchImpl('/api/material', { method: 'POST', body: form }))
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
    await fetchImpl('/api/material/description', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uid, body }),
    }),
  )
}
