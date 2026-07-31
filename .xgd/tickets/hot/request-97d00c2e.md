---
uid: request-97d00c2e
id: REQ-113
type: request
title: '1c serve: extensionless URLs 404 (preview disagrees with Cloudflare Pages)'
created_by: xgd
created_at: '2026-07-31T00:45:14.603733+00:00'
updated_at: '2026-07-31T00:45:14.603733+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  story_points: 1
  auto_merge_back: true
  needs_review: false
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
