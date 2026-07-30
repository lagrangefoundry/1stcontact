---
uid: comment-845f9be0
id: COMMENT-592
type: comment
title: Comment on request REQ-111
created_by: xgd
created_at: '2026-07-30T20:37:31.493539+00:00'
updated_at: '2026-07-30T20:47:55.353608+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-873e74dd
  kind: chat_transcript
---

<!-- xgd-turn id="d7735df3-a69f-4a33-ac6f-b34cdfd33260-user" -->

<!-- xgd-chat role="user" ts="2026-07-30T20:37:29.372369+00:00" -->
#### You
please free code a solution to this

<!-- xgd-turn id="d7735df3-a69f-4a33-ac6f-b34cdfd33260-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-30T20:47:55.324758+00:00" -->
#### Claude
I'll start by reading the ticket and the current state of the code.

Now let me understand the R2 layout produced by `1c deploy`.

The ticket body is already fully populated. Writing the implementation now.

Let me make the redirect carry its channel explicitly rather than sniffing it back out of the path.

Now the wrangler config and the deploy-time reserved-segment guard.

Now update the REQ-1 wrangler assertion that the apex-route change supersedes, then run the tests.

URL parsing normalizes a literal `..` before it reaches the Worker — my expectation was wrong, not the code. Fixing the test to assert the thing that matters.

WHATWG URL normalizes `%2e%2e` too — dot traversal can't even reach the parser through a real `Request`. Asserting the outcome instead.

All green. Now the typecheck/build and a broader regression sweep.

Now the version bump and commit.

Done. REQ-111 is at `free_coded` with commit `02bf9b3` recorded.

## What was built

**`apps/public-site/src/`** — four files replacing the greeting stub:

- `routes.ts` — the pure grammar. `/site/<slug>/draft/<sha>/…` and `/site/<slug>/…`, with the trailing-slash 301, `draft` reserved, and segment decoding that refuses `.`/`..`/embedded separators.
- `content-type.ts` — extension → MIME, derived from the served path rather than R2's stored metadata, mirroring the table `1c deploy` publishes with.
- `site-store.ts` — the `SiteStore` seam plus `R2SiteStore`, answering from `sites/<slug>/manifest.json`. Phase 2 replaces this one class.
- `index.ts` — the handler: Cache API in front, immutable caching on snapshot paths, `max-age=60` on published, `noindex` on the draft channel, uniform 404.

**`wrangler.toml`** — `SITES` binding at top level and under `[env.production]` (a named env does not inherit bindings), and the apex switched to `custom_domain = true`.

**`tools/generate/src/deploy/`** — `assertNoReservedSegment`, called from `cmdDeploy` before upload, so a snapshot containing a top-level `draft` entry is refused rather than silently shadowed.

## Two things worth your attention

**The `wrangler dev` smoke check in the Acceptance section was not run** — it needs the real bucket. The UATs drive the Worker's actual `fetch` with the bucket seeded by a real `1c deploy`, so the serving path is covered; what's unverified is the wiring to a live R2 bucket and the apex custom domain. `wrangler deploy --env production --dry-run` passes and reports the binding.

**The deploy-time `draft` guard is currently unreachable.** `renderSite` emits pages flat and copies assets into `assets/`, so no site definition can produce a top-level `draft` entry today. I tested the gate at its own entry point on a synthetic listing and said so in the ticket rather than dressing it up as end-to-end coverage.

I also updated `test_UAT_FC_REQ-1_public_site_serves_apex_and_wildcard_routes` rather than letting it fail — this ticket deliberately supersedes the apex-route assertion it pinned.

10 UATs green; req110/109/public-site/control-app/deploy-workflow/generate/naming/ci-workflow green; `pnpm -r build` clean.

<!-- xgd-chat-end -->