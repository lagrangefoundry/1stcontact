---
uid: comment-e9fa16a7
id: COMMENT-3664
type: comment
title: Comment on request REQ-303
created_by: xgd
created_at: '2026-09-22T23:14:52.364328+00:00'
updated_at: '2026-09-22T23:45:31.329839+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b98dd5a4
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "49528546-6a83-48f7-8153-5ebda34e02e5",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="511b2f43-b8bd-4827-a2b2-f729eddc623f-user" -->

<!-- xgd-chat role="user" ts="2026-09-22T23:13:55.310923+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="511b2f43-b8bd-4827-a2b2-f729eddc623f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-22T23:45:30.768035+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

I have the picture. Let me confirm the shape of the fix before coding.

Now implementing. First, the revision model — an outline is a snapshot with assets *stamped* rather than carried.

Now the diff arithmetic — one comparison shared by both shapes:

Now the port — two verbs that answer a site's shape without its bytes:

Now the D1/R2 adapter — where the etag R2 already recorded makes the stamp exact:

Now `pendingChanges` — the shared answer to "is anything unpublished":

Now the UATs. First let me see the existing workers-side D1/R2 fixture and the REQ-285 test's conventions.

Now writing the node UAT:

Now the regression scope — everything touching the store port, publish, status and the digest:

Good — `generated/` is ignored. Running the full suite to catch anything adjacent:

I'll bump the version while the sweep finishes.

All 24 sweep failures are pre-existing/environmental (webui not installed in this worktree, KB embedding, a cross-suite DNS ordering flake that passes in isolation) — none touch the store, publish or digest. Committing:

Now lock, merge back into `xgd-working`, and mark the ticket:

The gate tripped because ticket auto-commits landed on top of my merge. Re-bumping and gating in one shot:

A tooling race: the dashboard's per-turn transcript auto-commit keeps landing on `xgd-working` while the ~45s gate runs. Retrying the whole sequence in one shot:

The gate has an auto-version path that allocates the bump under its own lock — exactly the race I'm hitting:

Ticket is at `free_coded` with all four commits recorded. Cleaning up the branch:

`package.json` on `xgd-working` is corrupt. Checking:

Another session (REQ-305) is mid-merge in the shared `xgd-working` worktree with conflicts in the store files — that's theirs to resolve, not mine to touch. Verifying my work is intact at `HEAD`:

Done. REQ-303 is `free_coded` on `xgd-working`.

## What changed

The digest's cost came from `pendingChanges`, which read a byte-exact snapshot of **both** the whole draft and the whole live revision, then flattened each through `byteKey` — a JS string built one character per byte. Two values were taken off the result: the live revision id, and a count.

`SiteStore` gains two verbs that answer a site's shape without its content — `draftOutline` and `revisionOutline`. A `SiteOutline` carries the same three path families a snapshot does, with each asset carrying a **stamp** the adapter derives from metadata it already holds:

- **D1/R2** — `size:etag` from one R2 `list()` over the prefix. Exact: R2 stamps an etag at `put`, so a same-length replacement is still seen. Draft and revision stamps compare because a publish copies the same bytes with a single `put`.
- **filesystem / in-memory** — the byte length, from the directory entry (`statSync`, never `readFileSync`). mtime was rejected: a revision's copy is written at publish and the draft's original is older, so it would report every asset modified the moment it was published.

`diffOutlines` and `diffSnapshots` share one comparison over a flattened `path → content` listing, so the count can't drift from the publish it reports on. I changed `pendingChanges` itself rather than the digest alone — `1c status`, `describe_site`, the checkout dirty-check and the per-turn digest keep one answer between them. Publish's own byte-exact path is untouched.

## Evidence

- `tests/test_UAT_FC_REQ-303_the_digest_reads_no_asset_bytes.test.ts` — 12 passing over the filesystem and in-memory adapters, with the store instrumented so the claim is about what was *asked of storage*.
- `tests/test_UAT_FC_REQ-303_a_big_site_still_takes_a_turn.workers.test.ts` — 4 passing against real D1/R2 in workerd, with the **bucket** proxied: a site holding 17 assets and 34 MB takes its turn and not one of those objects crosses the wire; a same-length replacement is still counted.

Full sweep: 5429 passed, 24 failed — all in files that don't touch the store (webui not installed in the branch worktree, KB embedding, one cross-suite DNS ordering flake that passes in isolation); the three I could check fail identically on `xgd-working`.

## Three things to flag

1. **A deliberate tier split.** Requirement 3 is met exactly on D1/R2 and by size alone on the local disk tier — a same-length asset replacement isn't distinguished there until publish's own byte-exact diff runs. I've written this into the ticket body and the `AssetStamp` docs rather than leaving it for reconciliation to discover.

2. **The `move-to-free-coded` gate is unwinnable with `--version` right now.** Its tip-currency check needs `xgd-working`'s tip to stay still for ~65s; with several sessions running, ticket auto-commits land every 20–40s, so it rejected four times as a "foreign publish" of my own version. The `--version`-less auto path (which bumps under its own lock) worked first try. That path is undocumented in FREE-CODING.md and is worth making the default advice.

3. **Another session is mid-merge in the shared worktree.** REQ-305 (`feat(publish): stream ladder renditions`) has an unresolved `git merge` in `/Users/martin/lagrangefoundry/1stcontact` right now, with `UU` conflicts in `site-store.ts`, `d1r2-store.ts`, `fs-store.ts` and `memory-store.ts` — the files I just changed. I left it alone. Whoever resolves it needs to keep both sides: my two new port verbs plus their ladder work.

<!-- xgd-chat-end -->