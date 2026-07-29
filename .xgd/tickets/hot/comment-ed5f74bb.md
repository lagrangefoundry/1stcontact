---
uid: comment-ed5f74bb
id: COMMENT-530
type: comment
title: Comment on request REQ-101
created_by: xgd
created_at: '2026-07-27T20:27:05.335808+00:00'
updated_at: '2026-07-29T00:32:10.256302+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b63bbed5
  kind: chat_transcript
---

<!-- xgd-turn id="1b554fcb-5829-467f-93b1-f540c729f1e0-user" -->

<!-- xgd-chat role="user" ts="2026-07-27T20:27:03.278439+00:00" -->
#### You
PLlease free code this ticket

<!-- xgd-turn id="77ea9efb-089c-416b-b55c-84500bf35a46-user" -->

<!-- xgd-chat role="user" ts="2026-07-29T00:24:24.864236+00:00" -->
#### You
PLease free code this ticket

<!-- xgd-turn id="77ea9efb-089c-416b-b55c-84500bf35a46-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-29T00:32:10.224713+00:00" -->
#### Claude
I'll start by reading the ticket and investigating the current state.

Interesting — `fonts/` and `cli/fonts.ts` already exist. Let me check whether prior work landed.

A prior session committed the work but never recorded it on the ticket. Let me verify state.

Work is committed but the ticket was never updated and there's no version bump in the commit. Let me verify tests pass and check the version bump requirement.

Tests pass. Let me verify the test naming convention, the registry backfill, and run the CLI end-to-end.

Now let me run the CLI end-to-end and the broader regression scope.

Implementation works. Now the regression scope — full test suite plus a clean build/typecheck.

All 900 tests pass. Now a typecheck — green vitest doesn't prove type-clean.

Typecheck clean. Let me review the schema additions before finalising.

Let me verify the backfill is genuinely complete against what's actually on disk.

Backfill is exactly complete (23 on disk, 23 registered, no drift). One gap: those `storage/references/**` capture fonts are registered but nothing *enforces* it — they aren't referenced by any site, so only a hardcoded 7-name list in the test holds them. Let me check the layout.

`storage/dist/` is derived and gitignored; the real trees are sites/, sandbox/, references/. Note `sandbox/joyfulculinary` has 7 fonts no site references — exactly the blind spot. Let me look at the helpers.

Now let me close the drift hole — enforce that every font file in the source trees is registered, not just the ones a site references.

Now the disk scan itself:

Now wire the scan into the check and the import list:

Now update the report header line so the disk scan is visible in output:

Now export the new symbols and fix the test's now-optional `usage` access:

Now the UAT for the new behaviour. Let me look at the workspace fixture helper first:

Now add the `writeFontFile` helper and the import:

11 pass, and the new UAT is a proper before/after discriminator. Now typecheck and the full suite.

All 902 pass, typecheck clean, CLI green. Now the version bump and commit.

Now update the ticket body (preserving the operator's content) and move to `free_coded`.

Done — REQ-101 is at `free_coded` with both commits recorded.

## What I found

A prior session had already implemented and committed the bulk of this (`a2b2f7a2d`), but never completed the free-coding lifecycle: no version bump, `fields.commits` empty, status still `draft`. That commit was one sync away from being reverted.

## What was already there (verified, not assumed)

- `fonts/registry.yaml` — 10 families, 23 files, with `licence.redistribute_in_product` as a three-state value (`true` / `false` / `REVIEW_REQUIRED`), every gate treating the unresolved state as *no*.
- `siteConfig.distribution: 'internal' | 'product'` as the marker that switches on the strict gate.
- `1c fonts check` joining sites against the registry.
- Backfill complete — I checked disk against registry programmatically: 23 files, 23 registered, zero drift in either direction.

## The gap I closed

The check joined only what a page *referenced*. That left the class this ticket cares most about invisible: a capture bundle mirrors third-party fonts into `storage/references/`, and those bytes are in the repo whether or not anything points at them — with exactly the redistribution status least likely to be clear. `sandbox/joyfulculinary` has 7 such files today that no site references. Their registration was held only by a hardcoded 7-filename list in a test.

That is the documentation-drift failure mode the registry exists to prevent. Added a source-tree scan and a fourth violation kind, `unprovenanced-file`: every font file under `storage/` (minus derived `dist/` and vendored `node_modules/`) must be accounted for. Acceptance criterion 4 went from a state someone asserted once to a live gate holding in both directions.

## Verification

- Full suite: **902 passing / 128 files** (up from 900 — 2 new UATs).
- `tsc --noEmit` clean for `tools/generate` and `packages/site-schema`. Green vitest doesn't prove type-clean here, so I checked separately.
- `1c fonts check` on the real repo: exit 0, 10 families, 13 references across 3 sites, 23 files on disk, 7 families with advisory open actions.
- The new UAT is a proper before/after discriminator — asserts `pass: true`, drops an unregistered file, asserts `pass: false`.

## One thing I deliberately did not build

No acquisition verb (`1c fonts add <url>`). The gap statement mentions one, but the operator direction and all four acceptance criteria are about *tracking*, not automation — and a download command is only useful once the font menu it draws from exists. Flagged in the ticket body under "Not done (deliberate)" so it's a visible decision rather than a silent omission. Say the word if you want it.

Ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->