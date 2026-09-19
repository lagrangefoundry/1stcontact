---
uid: report-49a12b7f
id: REPORT-4439
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T13:10:48.368300+00:00'
updated_at: '2026-09-19T13:10:48.368300+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — **UU**, index-only (the path is outside
  the sparse-checkout cone, so there were no working-tree conflict markers).
  Class: **2e — intent/bookkeeping ticket** (`bug-*`, not a matrix-defining spec
  ticket). Rule applied: **same field/section changed differently on each side →
  take the LATER-positioned side, per fact**. Every fact resolved the same way,
  so the composition is ours wholesale. Resolved with `git checkout --ours` +
  `git add --sparse`; staged blob `c0b18a118a`.

  Incoming is `b6b2cfc512` (2026-09-01 15:03 -0700,
  `xgd(ticket): update bug bug-360c5a44`) — the moment BUG-43 was first written
  up. Ours is the same ticket 15 days later, seeded into this branch by
  `seed_local_overlay` and carrying the state it reached at the end of its
  free_coded lifecycle (`status: bundled`, `version: 0.2.40`,
  `bundled_in: bundle-8e1807f6`, `working_sha: 84cc117aa1`).

  Fact-by-fact, exhaustively — the two sides differ in exactly these places:

  | fact | incoming (09-01) | ours (09-16) | later |
  |---|---|---|---|
  | `title` | *Builder preview: the frame is never reloaded…* | identical | — |
  | `severity` | `high` | `high` | — |
  | `chat_comment` | `comment-ab9333e3` | identical | — |
  | `last_field_updated` | `status` | `status` | — |
  | `updated_at` | `2026-09-01T22:03:01` | `2026-09-16T01:48:37` | ours |
  | `completed_at` | `null` | `2026-09-14T10:29:01` | ours |
  | `status` | `draft` | `bundled` | ours |
  | `commits`/`version`/`bundled_in` | absent | present | ours (additive) |
  | body | first-draft analysis | same analysis, refined | ours |

  The body difference is a genuine design revision, not rewrap churn: incoming
  specifies **one** `site_changed` event yielded *after the turn ends*; ours
  specifies the host iterating the model's stream and emitting a signal **after
  every `tool_activity` whose counter moved**, and adds the "What is wanted"
  section explaining why per-write beats per-turn, the requirement that a
  throwing callback not cost the operator the answer, and a third (**app**) test
  bullet. That later design is the one that was actually built and bundled
  (`working_sha 84cc117aa1`, v0.2.40), so it supersedes the earlier text rather
  than competing with it.

  No fact is asserted by incoming and absent from ours — there was nothing
  disjoint to compose in. Taking incoming would have regressed `bundled` →
  `draft`, cleared `completed_at`, dropped `commits`/`version`/`bundled_in`, and
  reverted the fix description to a design that was superseded before
  implementation.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-360c5a44.md` — all of the incoming commit's contributions
  are present in the staged resolution, verified by inspection of the staged
  blob: `title` (line 5), `last_field_updated: status` (10),
  `chat_comment` (16), `severity: high` (17), and every body section it
  introduced — `## Symptom` (26), `## What was verified, and how` (34),
  `## Root cause` (43), `## Fix` (75), `## Test plan` (99) — including the
  specific anchors it added: the `CARETAKER_SYSTEM`/`roles.ts` observation (56),
  the `host-core.ts` `streamPrompt` counter mechanism (79), the `site_changed`
  event kind (83, 103), the `chat.js` `onSiteChanged` callback (86, 109), and the
  "only a counter that actually moved produces a signal" rationale, preserved
  near-verbatim in ours' rewrite of that paragraph.

  No hunk was dropped under the BUG-1301 precedence exception; it was not needed.

## Note for finalize

`git diff --cached HEAD` is empty. This is the redundant case, not the discarded
one (STEP 4 / BUG-1109): HEAD already holds the endpoint of the working timeline
that this commit is an intermediate step of, so the commit's key changes are
present in HEAD rather than absent from it — STEP 3's check above confirms each
one individually. Per STEP 4 I did not call `--skip`; the sequencer is untouched
and `CHERRY_PICK_HEAD` (`b6b2cfc512`) is still in place for
`cherry_pick_finalize_resolution`.
