---
uid: comment-9ce90ad2
id: COMMENT-3035
type: comment
title: Comment on request REQ-266
created_by: xgd
created_at: '2026-09-17T21:42:44.693484+00:00'
updated_at: '2026-09-17T22:09:43.282120+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-53ddfe1f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c1188c3b-58d5-415b-a96b-d7c6196e7ea7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="8f543f7a-454a-4d94-b23e-14038d7c9ede-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:42:07.657562+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="8f543f7a-454a-4d94-b23e-14038d7c9ede-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T22:09:42.442085+00:00" -->
#### Claude
The ticket is unusually complete — I have no blocking questions. Three decisions I'll make myself and record on the ticket:

1. **Verification goes in all three adapters** (D1/R2, filesystem, memory) via one shared helper, not just D1/R2 — otherwise §5's integrity walk silently reports "sound" on two of the three stores. Consequence: test fixtures that write a literal `sha: 'fixture'` are seeding an impossible state and get fixed to compute a real digest.
2. **The claim union needs a port verb.** `nextRevisionOf(history)` is pure arithmetic over the log and cannot see the claims table, so the port gains `nextRevision(site)`; fs/memory answer it with today's arithmetic, D1/R2 with `MAX` over the union.
3. **§5's walk gets a CLI surface** (`1c verify <slug>`) so the operation has a caller other than a test.

Let me start.

Now the migration.

Now the filesystem adapter.

Now the UATs.

I'll wait for the full suite to finish. Meanwhile, a summary of what's in place:

**Migration `0013_revision_immutability.sql`** — `site_revision_claims (site_id, id, claimed_at)` with `PRIMARY KEY (site_id, id)` cascading from `sites`, and a `BEFORE UPDATE … RAISE(ABORT)` trigger on `site_revisions` on the `contact_events` pattern. `DELETE` deliberately untouched.

**`d1r2-store.ts`** — `writeRevision` now refuses a completed id, then claims the id, *then* writes objects, with the row still last. `readRevision` selects `sha` alongside `id` and returns through `verifiedSnapshot`. `forget()` drops claims with revisions. New `nextRevision` answers `MAX` over the union of both tables.

**`revision-model.ts`** — `RevisionIntegrityError`, `RevisionExistsError`, and `verifiedSnapshot`, the one comparison all three adapters call.

**`publish.ts`** — `id: await store.nextRevision(slug)`, and `verifyRevisions(store, slug)` for §5, surfaced as `1c verify <slug>` (non-zero exit on a non-empty report).

Falsification check passed: neutering the three guards fails exactly four of the six workers cases, and the concurrency case surfaced a raw `UNIQUE constraint failed` — confirming both publishes really did mint the same id before the claim existed.

Done. REQ-266 is at `free_coded` with both commits recorded and version `0.2.236`.

## What landed

**`db/migrations/0013_revision_immutability.sql`** — `site_revision_claims (site_id, id, claimed_at)` with `PRIMARY KEY (site_id, id)` cascading from `sites`, and a `BEFORE UPDATE … RAISE(ABORT)` trigger on `site_revisions`. `DELETE` deliberately untouched (erasure has to reach these rows).

**`d1r2-store.ts`** — `writeRevision` now refuses a completed id, *then* inserts the claim, *then* writes objects, with the `site_revisions` row still last. `readRevision` fetches `sha` on the existence check and returns through `verifiedSnapshot`. `forget()` drops claims alongside revisions. New `nextRevision` answers `MAX` over the union of both tables.

**`revision-model.ts`** — `RevisionIntegrityError`, `RevisionExistsError`, and `verifiedSnapshot` — the one comparison all three adapters call.

**`publish.ts`** — `id: await store.nextRevision(slug)`, read after every refusal so a failed publish burns no revision number; plus `verifyRevisions(store, slug)`, surfaced as `1c verify <slug>` (non-zero exit on a non-empty report).

## Three decisions I made, all recorded on the ticket

1. **Verification is in all three adapters**, not just D1/R2 — otherwise §5's walk reports "sound" on the operator's own disk, where a revision directory is a file anyone with the checkout can edit. Consequence: two fixtures that recorded `sha: 'fixture'` / `sha: 'publish-N'` now compute the real digest, because both seed revisions the capture path reads through `readRevision`.
2. **The claim union needs a port verb** (`nextRevision`). `nextRevisionOf` is arithmetic over a `RevisionEntry[]` and structurally cannot see the claims table; fs/memory answer with today's arithmetic.
3. **`1c verify` exists** so §5's operation has a caller other than a test.

## Evidence

10 UATs across three files, all passing. I ran a falsification pass: neutering the three store guards fails exactly four of the six workers cases, and the concurrency case surfaced a raw `UNIQUE constraint failed` — confirming both publishes really did mint the same id before the claim existed.

Full suite: **4659 passed, 5 failed**. I checked all five. Three (`colour-census`, `colour-retrofit-shade-model`, `system-knowledge-base`) pass in isolation — parallel-load flakes on long CLI-subprocess suites. Two are pre-existing and unrelated: `bug32-webui-scope-rebrand` names `assets.ts` and two REQ-228/REQ-263 test files as its offenders (none mine), and `BUG-67 backend_settings` fails on an upstream settings validator that doesn't throw. Neither touches revisions or publish.

One thing worth flagging: the digest covers a revision's `source/` only, so the integrity walk does **not** detect tampering with a revision's rendered `out/` bytes — which is what `public-site` actually serves. That is what the ticket specifies (`snapshotSha` is defined over `StoredSnapshot`), and closing it would mean a second digest over the render. Worth its own ticket if you want it.

<!-- xgd-chat-end -->