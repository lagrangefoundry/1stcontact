---
uid: request-97d00c2e
id: REQ-113
type: request
title: '1c serve: extensionless URLs 404 (preview disagrees with Cloudflare Pages)'
created_by: xgd
created_at: '2026-07-31T00:45:14.603733+00:00'
updated_at: '2026-08-06T05:11:59.851845+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: medium
  story_points: 2
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 6d94d584e1428b41e0d13f2790e773a2e72d8326
    reconcile_sha: null
    main_sha: null
  - working_sha: 573764b1bde34913f0548c0c117a662d385bed38
    reconcile_sha: null
    main_sha: null
  version: 0.1.10
  bundled_in: bundle-e0143ffa
---

## Scope

`1c serve` cannot serve a multi-page site at its natural URLs. A page authored as slug
`whitepapers` renders to `whitepapers.html` and is reachable **only** at `/whitepapers.html`;
`/whitepapers` returns 404.

`serveRequest` (`tools/generate/src/cli/serve.ts:58`) resolves exactly two shapes: a path ending in
`/` gets `index.html` appended, and a directory gets `index.html` joined. Anything else must match
a file on disk byte for byte. There is no extensionless fallback.

## Why it matters

**The preview server disagrees with production.** Cloudflare Pages — the deployment target — serves
`whitepapers.html` at `/whitepapers` automatically. So the clean URL is correct in production and
broken in preview, which is the worst arrangement: the author writes the right link, sees it 404
locally, and "fixes" it by baking `.html` into the site. That is exactly what happened on xgd.dev
(CHAT-12) and the `.html` is now in the authored nav.

This is the same class of defect as the asset-cache saga in REQ-95: the preview environment and the
viewer's environment disagree, and the author trusts the one in front of them.

## Behaviour

When the requested path does not resolve to a file or directory, and has no extension, try
`<path>.html` before returning 404.

- `/whitepapers` → serves `whitepapers.html`
- `/whitepapers.html` → unchanged, still serves directly
- `/` and `/sub/` → unchanged, still resolve to `index.html`
- `/assets/logo.svg` → unchanged; has an extension, so no fallback is attempted
- `/nope` → still 404 when `nope.html` does not exist
- Path confinement to `rootDir` is unchanged and must still reject traversal — the fallback is
  applied to the already-confined absolute path, never to raw input.

## Acceptance criteria

- **AC1** — a request for an extensionless path resolves to the sibling `.html` file when one
  exists.
- **AC2** — existing resolution is unaffected: exact files, directory requests, and trailing-slash
  requests all behave as before.
- **AC3** — a path with an extension never triggers the fallback, so a genuinely missing asset
  still 404s rather than silently serving HTML.
- **AC4** — traversal is still rejected; the fallback cannot reach outside `rootDir`.

## Out of scope

The authored `.html` links on xgd.dev stay until this lands, then get cleaned up.


---

## Scope extension (2026-07-30) — the production half was never fixed

The original ticket rested on a premise that is **false**:

> Cloudflare Pages — the deployment target — serves `whitepapers.html` at `/whitepapers`
> automatically. So the clean URL is correct in production and broken in preview.

There is no Cloudflare Pages anywhere in the serving path. `apps/public-site/wrangler.toml` binds
the **`public-site` Worker** (REQ-111) to both `1stcontact.io` and `*.1stcontact.io/*`, and it
serves every byte out of R2. `parseRoute` passes the path tail straight through as an object key
(`routes.ts:120`, `routes.ts:130`), and a missing key is a flat 404 (`index.ts:134`).

So the actual state is the **inverse** of what the ticket described: the clean URL now works in
preview and 404s in production. The ticket's stated goal — the preview server and the viewer's
environment agree on the URL the author writes — was never reached, because only one of the two
environments was changed.

Surfaced by BUG-30: xgd.dev's home page links `/whitepapers`, which relativizes to `whitepapers`
(correctly), and `test_UAT_FC_REQ-109_served_under_path_prefix` went red against a server modelled
on the real Worker.

### Additional behaviour — the Worker gains the same mapping

When a snapshot object does not exist, and the requested path has no extension, try `<path>.html`
before answering 404. Exact keys always win, so nothing that resolves today changes.

**The trailing slash must NOT be eligible**, and this is load-bearing rather than tidiness. Pages
reference their assets document-relatively (REQ-109), so the directory of the request URL is what
every `theme.css` and `./#frag` resolves against:

- `/site/acme/draft/<sha>/whitepapers` -> directory is `.../<sha>/` -> `theme.css` resolves correctly.
- `/site/acme/draft/<sha>/whitepapers/` -> directory is `.../whitepapers/` -> every asset resolves
  one level too low and the page loads unstyled.

That is the same failure the `redirect` route already exists to prevent for the snapshot root. A
trailing-slash path therefore keeps its current behaviour (404 unless a real object matches).

Eligibility is a pure function of the pathname — no trailing slash, and the last segment contains
no `.` — so it stays in `parseRoute` and remains testable without a bucket, per the module's
existing design note. Only the *lookup* of the fallback key happens in the request path.

### Additional acceptance criteria

- **AC5** — the Worker serves `<slug>.html` for an extensionless path, on both the draft and the
  published channel, for `GET` and `HEAD`.
- **AC6** — `content-type` is derived from the key actually served, not the requested path, so a
  fallback hit returns `text/html` rather than a guess from an extensionless name.
- **AC7** — an exact object still wins over the fallback, and a path carrying an extension never
  triggers it (a missing `.svg` still 404s rather than silently returning HTML).
- **AC8** — a trailing-slash path is never eligible, so no URL can serve a page from a directory
  its relative asset references would resolve against incorrectly (REQ-109).
- **AC9** — the route grammar's existing guards are unchanged: traversal, percent-encoding and slug
  validation all still reject before any fallback is considered.


### Resolution of the extension (2026-07-30)

Landed in commit `f782ae74a3`, version `0.1.10`.

- `apps/public-site/src/routes.ts` — `htmlFallbackFor(path, trailingSlash)` decides eligibility as
  a pure function of the URL and hangs the candidate key on the `asset` route as `htmlFallback`.
  Only the last segment is examined for a `.`, so `v1.2/page` stays eligible.
- `apps/public-site/src/index.ts` — `serve` walks `[path, htmlFallback]` in order for both `GET`
  and `HEAD`, setting `content-type` from the key that answered.

`tests/req113-worker-extensionless-urls.test.ts` — 6 UATs driving the Worker's real entry point
over bytes a real `1c deploy` wrote, on a genuinely two-page site:

| UAT | Covers |
|---|---|
| `test_UAT_FC_REQ-113_worker_serves_extensionless_draft_page` | AC5, AC6 |
| `test_UAT_FC_REQ-113_worker_serves_extensionless_published_page` | AC5 (published channel) |
| `test_UAT_FC_REQ-113_worker_head_matches_get` | AC5 (HEAD branch) |
| `test_UAT_FC_REQ-113_exact_keys_win_and_extensions_never_fall_back` | AC7 |
| `test_UAT_FC_REQ-113_trailing_slash_is_never_eligible` | AC8 |
| `test_UAT_FC_REQ-113_fallback_eligibility_is_a_pure_url_rule` | AC9 |

Verified RED: with the two source files stashed, 5 of the 6 fail and the survivor is exactly the
AC7 regression-guard — so they discriminate rather than rubber-stamp.

`tests/req109-relocatable-output.test.ts` also updated: its in-test server now models the same
mapping. It had gone red not as a stale fixture but because it resolved strictly *less* than
production does, which was the honest signal that this half of the ticket was missing.

`tsc --noEmit` clean for `apps/public-site`. Full suite 965 passed / 4 failed, all 4 pre-existing
and unrelated (reconciliation capture fixtures).

### Follow-up now unblocked

The "Out of scope" note above — xgd.dev's authored `.html` links — can now be cleaned up, together
with BUG-30's `/index.html#how` workaround, since both environments finally agree. Not done here:
the xgd page JSON is uncommitted in-flight authoring.