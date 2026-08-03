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

/** Every site in the store, newest revision included. */
export async function fetchSites(fetchImpl = fetch) {
  const res = await fetchImpl('/api/sites')
  if (!res.ok) throw new Error(`GET /api/sites → ${res.status}`)
  return res.json()
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
