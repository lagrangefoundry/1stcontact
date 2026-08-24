---
uid: comment-f08ec087
id: COMMENT-1447
type: comment
title: Comment on bug BUG-36
created_by: xgd
created_at: '2026-08-24T01:51:31.111043+00:00'
updated_at: '2026-08-24T01:51:31.111043+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-db356ff8
  kind: note
---

## Lead for the Edit-mode 1102, so it is not lost

Not this ticket's work; recorded because it was found while verifying this one.

Edit mode is `/preview/<slug>/edit/` — the request-time edit-channel render in
workerd. `PreviewRenderer` caches a whole `RenderedSite` per `slug\0channel`,
and the router holds those renderers in

```ts
const PREVIEWS = new WeakMap<TenantSiteStore, PreviewRenderer>()
```

keyed on the **store handle**. But `storeFor` constructs a fresh handle per
request, deliberately (the tenant check must not be memoised across requests).
So in the Worker the WeakMap never hits: every preview request builds a new
`PreviewRenderer` and re-renders the entire site into memory, and each one stays
live until GC. A burst of concurrent previews therefore holds N whole site
renders at once — and Workers memory is per-*isolate*, shared across concurrent
requests, which matches the observed kill (94ms CPU, zero subrequests, one
victim seven seconds after a 12-request burst).

This predates BUG-36 — `storeFor` was already per-request — so nothing here
caused it and nothing here fixes it.

Unverified. Two things would settle it quickly:

1. `[observability]` in `apps/control-app/wrangler.toml` — there are no retained
   logs today, only aggregate analytics, which is why the earlier attempt could
   say *that* a request died but not *which URL*.
2. Probe `/preview/<slug>/edit/` specifically. The earlier "cannot reproduce"
   pass probed `/edit/...`, which matches no route and falls through to
   `env.ASSETS.fetch` — so it may never have exercised the edit render at all.
