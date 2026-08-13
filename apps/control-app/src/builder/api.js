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
  const res = await fetchImpl('/api/ai/prompt', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, text }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    yield { kind: 'text', content: `\n\n_${body.error || `the assistant failed (${res.status})`}_` }
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
