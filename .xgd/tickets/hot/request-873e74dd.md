---
uid: request-873e74dd
id: REQ-111
type: request
title: 'public-site Worker: serve draft previews and published sites from R2 (SiteStore
  seam)'
created_by: xgd
created_at: '2026-07-30T19:35:00.276283+00:00'
updated_at: '2026-08-06T19:46:27.785148+00:00'
completed_at: '2026-08-06T19:46:27.785148+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 5413d27f5eecb5e7800cacf7fcd699c2b2f6c336
    reconcile_sha: null
    main_sha: null
  version: 0.1.7
  bundled_in: bundle-e0143ffa
  chat_comment: comment-845f9be0
---

## The gap

`apps/public-site/src/index.ts` is a stub:

```ts
export default {
  async fetch(): Promise<Response> {
    return new Response('Hello from 1stcontact.io', …)
  },
} satisfies ExportedHandler
```

Routes for the apex and `*.1stcontact.io` are already declared in
`wrangler.toml`, but `1stcontact.io` has no proxied DNS record, so nothing
resolves. Nothing has ever been served.

## Scope

Make `public-site` serve draft previews and published sites out of the R2 layout
written by `1c deploy`, behind a **`SiteStore` seam** that phase 2 swaps for D1
without touching anything else.

## Route grammar

```
/site/<slug>/draft/<sha>/            →  preview/<sha>/out/index.html
/site/<slug>/draft/<sha>/<path…>     →  preview/<sha>/out/<path>
/site/<slug>/                        →  rev/<live>/out/index.html
/site/<slug>/<path…>                 →  rev/<live>/out/<path>
/                                    →  reserved for the apex marketing site (later)
```

`draft` is a reserved first path segment within a site: a published page may not
be named `draft`. Validate this at deploy time so the collision is impossible
rather than merely unlikely.

### Trailing slash is load-bearing

With document-relative asset URLs, `/site/xgd/draft/<sha>` (no trailing slash)
resolves `assets/x.svg` to `/site/xgd/draft/assets/x.svg` — one level too high.
The Worker **must** 301 the bare form to the trailing-slash form. This is a
correctness requirement, not a nicety.

## The seam

```ts
interface SiteStore {
  resolve(slug: string, channel: 'draft' | 'published', ref?: string): Promise<string | null>  // → R2 prefix
  live(slug: string): Promise<number | null>
}
```

Phase 1 implementation reads `sites/<slug>/manifest.json`. Phase 2 replaces the
implementation with D1 queries against `sites` / `revisions` / `pages`
([[REQ-7]]). Nothing else in the Worker knows where the truth lives.

## Response behaviour

| Concern | Rule |
|---|---|
| Content type | By extension: html, css, js, svg, woff2, png, jpg, webp, json, ico, txt. Unknown → `application/octet-stream`. |
| SHA-addressed caching | `Cache-Control: public, max-age=31536000, immutable` — the bytes can never change |
| Published caching | `Cache-Control: public, max-age=60` (see below) |
| Draft indexing | `X-Robots-Tag: noindex` |
| Missing object | 404 with a plain body, never a directory listing |
| Unknown slug / no live revision | 404, no distinction leaked between the two |

Repeat hits go through the Cache API so warm requests do not touch R2.

### Known wart: published-channel TTL

Published URLs are not revision-scoped, so `/site/<slug>/assets/x.svg` cannot be
cached immutably. Deploying a new revision therefore has a ≤60s window where a
client can mix new HTML with cached old CSS. Accepted for v1; the fix is
revision-scoped published asset paths or a purge-on-deploy hook, both additive.

## Configuration

- Add the R2 binding to `apps/public-site/wrangler.toml`
  (`bucket_name = "1stcontact-sites"`).
- Replace the apex `routes` entry with `custom_domain = true` so wrangler
  provisions the DNS record and certificate itself — the zone currently has no
  proxied record and this avoids a manual dashboard step.
- Leave the `*.1stcontact.io` wildcard route declared but unused; subdomain
  serving is a later, additive step.

## Non-goals

- No authentication. Draft previews are unguessable-URL-private by deliberate
  decision — real ACLs arrive with login, and gating publication on access
  control is not worth it for v1. [[DOC-12]] needs its "author only (private)"
  wording amended to match.
- No apex marketing site yet; `/` may stay a holding response so nothing becomes
  public before the operator chooses.
- No custom domains, no subdomain routing, no D1.

## Acceptance

- `test_UAT_FC_<TICKET>_serves_preview_snapshot` — a request under
  `/site/<slug>/draft/<sha>/` returns `index.html` from the matching R2 prefix,
  and every asset it references resolves 200.
- `test_UAT_FC_<TICKET>_bare_path_redirects_to_trailing_slash` — 301, and assets
  resolve correctly after following it.
- `test_UAT_FC_<TICKET>_serves_live_published_revision` — `/site/<slug>/` serves
  the revision named by `manifest.live`; bumping `live` changes what is served.
- `test_UAT_FC_<TICKET>_immutable_cache_on_sha_paths` — SHA-addressed responses
  carry `immutable`; published responses carry the short TTL.
- `test_UAT_FC_<TICKET>_draft_is_noindex` — draft responses carry `X-Robots-Tag`,
  published responses do not.
- `test_UAT_FC_<TICKET>_unknown_slug_and_missing_object_404` — no directory
  listing, no leak distinguishing unknown slug from unpublished site.
- `test_UAT_FC_<TICKET>_content_types` — each supported extension maps correctly.

Route parsing, `SiteStore`, and content-type mapping are pure functions, unit
tested with plain vitest against a faked R2 binding — **no new dependencies**. A
proper Workers test pool (`@cloudflare/vitest-pool-workers`) would need an
install and is not required here; end-to-end verification is a scripted
`wrangler dev` smoke check.

## Dependencies

Consumes the R2 layout from the `1c deploy` ticket. Needs the relocatable-output
ticket, without which assets 404 under the path prefix. Closes the open question
in [[DOC-7]] §11.3: R2 + Worker rather than Workers Static Assets, because Static
Assets binds artifacts to a Worker *deployment* — every publish and every preview
link would require a deploy, which does not go multi-tenant. Matches [[DOC-5]] §5
(R2 for static build artifacts).


---

## As built (2026-07-30)

Implemented as specified. Files: `apps/public-site/src/routes.ts` (pure grammar),
`content-type.ts` (pure extension map), `site-store.ts` (`SiteStore` +
`R2SiteStore`), `index.ts` (handler); R2 binding `SITES` in
`apps/public-site/wrangler.toml`; the deploy-time reserved-segment gate as
`assertNoReservedSegment` in `tools/generate/src/deploy/content.ts`, called from
`cmdDeploy` before upload.

### Decisions taken during implementation

- **The manifest is the authority on what is servable, and untrusted input never
  reaches a key.** A draft id from the URL is *looked up* in `manifest.previews`
  and the prefix is then built from the manifest's own value; the published
  prefix is built from `manifest.live`, which the URL cannot influence. A
  side-effect worth having: an orphaned snapshot (interrupted upload, or one
  `--prune` has unlinked but not swept) is unreachable rather than quietly live.

- **Dot-segment traversal never reaches the parser.** WHATWG URL normalises both
  `..` and its `%2e%2e` spelling before dispatch, so those attempts resolve to
  some other harmless route. `%2f` is *not* normalised and does reach the parser,
  which refuses it. The parser rejects `.`/`..`/embedded separators anyway —
  defence in depth, exercised directly rather than through a `Request`.

- **404s are not cached.** A 404 is the answer for both "never existed" and "not
  deployed yet"; caching the second would make a fresh deploy look broken.

- **`X-Robots-Tag: noindex` on every draft-channel response**, not only the
  successful ones — including the 301 and the 404. A crawler that reached a
  preview should be told so whatever it found there.

- **Beyond the stated scope, all small and all in the same direction**: `HEAD` is
  served (via `bucket.head`, no body); anything other than `GET`/`HEAD` is a
  `405` with `Allow`, since the server is read-only; the trailing-slash 301
  preserves the query string; and `/site/<slug>` redirects on the same rule as
  the draft form.

- **`test_UAT_FC_REQ-1_public_site_serves_apex_and_wildcard_routes` was updated**,
  not left to fail: this ticket deliberately replaces the apex zone route with
  `custom_domain = true`, which supersedes the assertion that test pinned. The
  wildcard-route half is unchanged.

### Not done

The deploy-time `draft` guard is a standing invariant rather than a currently
reachable one: `renderSite` emits pages flat and copies assets into `assets/`, so
no site definition can presently produce a top-level `draft` entry. The gate is
tested on a synthetic snapshot listing at its own entry point, and will start
earning its keep the day rendered output gains nesting.

The `wrangler dev` smoke check named under Acceptance was not run — it needs the
real bucket and a deploy. The UATs drive the Worker's actual `fetch` entry point
with the bucket seeded by a real `1c deploy`, so the serving path is covered; what
remains unverified is the wiring to a live R2 bucket and the apex custom domain.
`wrangler deploy --env production --dry-run` passes and reports the `SITES`
binding.

### Evidence

`tests/req111-public-site-serving.test.ts` — 10 UATs, one per acceptance bullet
plus the route grammar, the reserved segment, and warm-cache behaviour. Bucket
faked at the R2 binding (the one boundary we do not own); route grammar,
`SiteStore`, header policy and cache are real. Suites run green:
req111, req110, req109, public-site, control-app, deploy-workflow, generate,
naming, ci-workflow. `pnpm -r build` clean.