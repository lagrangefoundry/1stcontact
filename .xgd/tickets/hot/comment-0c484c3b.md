---
uid: comment-0c484c3b
id: COMMENT-3642
type: comment
title: Comment on bug BUG-136
created_by: xgd
created_at: '2026-09-22T00:20:40.959810+00:00'
updated_at: '2026-09-22T00:41:28.916168+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-583068f3
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "fa2e3580-d7b0-43a5-a113-8e239586daa9",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="56c7d253-02c7-4e61-b44f-ad4ae52f3b69-user" -->

<!-- xgd-chat role="user" ts="2026-09-22T00:20:03.291213+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="56c7d253-02c7-4e61-b44f-ad4ae52f3b69-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-22T00:37:11.519750+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

I've read the ticket and the code. One thing the ticket asked me to confirm first, plus one wrinkle I found:

**Confirmed:** `apps/public-site/src/index.ts:395` — `case 'apex': case 'asset':` is *one branch*, routed through the same `serve()`. The apex and `/site/<key>/` are the same code with the same headers. The ticket's premise holds.

**Wrinkle:** `serve()` overrides `cache-control` to `private, no-store` + `vary: cookie` when the HTML carries account chrome (`index.ts:541`). The apex — the product's own front door — is the page most likely to carry it, so `published_cache_policy` asserting `public, max-age=60` at `/` would false-alarm. I'll make that check assert *the policy the Worker actually defines for the response it got* (session policy iff `vary: cookie`), and pin both constants against the Worker. No blocking questions — proceeding.

Baseline is green. Now the implementation:

Now the report format, usage text, workers.dev skip message, and the file header:

Now the file header and `bin/smoke`'s launcher comment:

Now run the existing suites to see what the behaviour change breaks:

All three failures are the intended `n/a` behaviour (requirement 5); BUG-57 and REQ-147 pass unchanged. Updating the three matrix UATs that pinned the superseded behaviour:

Existing suites green. Now BUG-136's own UATs:

Four issues in my own expectations. Fixing, plus adding the target label to the cache-policy detail:

Report shape is right (`fetch failed` is the known sandbox proxy). Now updating the ticket body to record what was built, before committing:

Now version bump and commit:

Both commits recorded, version claimed. Cleaning up the branch:

Done. BUG-136 is at `free_coded` on `xgd-working`.

## What changed

**`tools/generate/bin/smoke.mjs`** (+ `bin/smoke`'s header)

The ticket's premise checked out first: `route()` in `apps/public-site/src/index.ts` handles `case 'apex':` and `case 'asset':` in **one branch** into one `serve()` — the apex and `/site/<key>/` are the same assertion, not two similar ones.

1. **The four root-only checks address `/` with no flag.** A published apex is `GET /` answering 200 with a `text/html` type. An origin answering 200 with something that isn't a page has *no published apex* rather than a broken one, so it skips — four failures about it would be the false alarm a skip exists to avoid. `--site-key` still wins as the target when given, and every one of the four names the root it read.

2. **`skip` and `n/a` are now different words.** `skip` = nobody supplied an argument (and names it). `n/a` = this deployment has nothing to assert against — including what a check reports *instead of a pass when it compared nothing*, which is `unpublished_site_indistinguishable`'s live-revision branch. Counted apart in the summary.

3. **Every remaining skip says what would run it.** The two key-needing checks state what only a key has; the four name both `--site-key` and publishing the apex, reading `APEX_SITE_KEY` out of `apps/public-site/wrangler.toml` (a `node:fs` line match, swallowed on error) to report that it's empty. `control_app_workers_dev_closed` says it **cannot be derived** and why, pointing at the `workers_dev = false` declaration REQ-147 already pins statically.

**One consequence worth flagging:** `serve()` marks a page carrying account chrome `private, no-store` + `vary: cookie`, and the apex is the page most likely to carry it — so asserting only `public, max-age=60` would have failed a correctly-served front door. `published_cache_policy` now asserts the policy the Worker defines for the response it got, `vary: cookie` included; `SESSION_CACHE` is restated and both constants are pinned against the Worker.

**Superseded acceptance:** requirement 5 changes an outcome AC-1336, AC-1337 and AC-1340 pinned. Updated in place, and recorded in the ticket body for reconciliation.

Live shape (the `fetch failed` lines are the known sandbox proxy, not a dead origin):

```
skip  published_assets_resolve
    no --site-key given, and https://1stcontact.io/ is not a published site index
    (it did not answer) — APEX_SITE_KEY is empty in apps/public-site/wrangler.toml,
    so this deployment publishes no apex at all
```

## Tests

New `tests/test_UAT_FC_BUG-136_smoke_runs_without_arguments.test.ts` — 14 tests, each of the four proven to both run *and* fail against the apex breakage it owns. Regression scope (BUG-57, REQ-147, REQ-144, REQ-246, the reconciliation suite) green: **66 passed** on merged `xgd-working`.

Commits `516be6fbfe` + auto-bump `25ee87d90a` (v0.2.315), `story_points: 3`. Branch merged and cleaned; promotion to `ready_to_reconcile` is yours.

<!-- xgd-turn id="29f974a9-9cb2-403d-8f63-31a97bbba01c-user" -->

<!-- xgd-chat role="user" ts="2026-09-22T00:41:28.693111+00:00" -->
#### You
Is this finished

<!-- xgd-chat-end -->