---
uid: comment-dc289615
id: COMMENT-396
type: comment
title: Comment on bug BUG-10
created_by: xgd
created_at: '2026-07-23T19:05:23.834869+00:00'
updated_at: '2026-07-23T19:11:04.745022+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-e4af6a67
  kind: chat_transcript
---

<!-- xgd-turn id="e39795ac-910f-42db-84f0-d789507f0cc1-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T19:05:21.587757+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="e39795ac-910f-42db-84f0-d789507f0cc1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T19:11:04.716432+00:00" -->
#### Claude
I'll start by reading the current ticket state and investigating the relevant code.

The bug is clear: `listMarkerOf(s)` at lines 448-451 returns `s.listStyleType` whenever it's not `none`, but CSS's initial value for `list-style-type` is `disc` on every element. It must gate on `display: list-item`. Let me find how this is tested and the fold consumer.

Now let me look at how EXTRACT_SCRIPT is tested (the jsdom setup) so I write UATs in the same style.

Let me verify how jsdom computes `display` and `list-style-type` so my UAT is meaningful.

jsdom confirms the gate: a non-list-item element with `list-style-type` set (mirroring the real-browser initial `disc`) currently yields a marker; `display: list-item` is the correct gate. Now let me apply the fix.

Now let me look at the req63 test imports and helpers so my new test file matches conventions, and check the test runner config.

Now I'll write the UAT test file, following the jsdom extraction pattern from req63.

Let me verify `RawRun` is exported from the cli barrel, then run the test.

All 4 pass. Now run the adjacent regression scope — the existing extraction/values-diff tests that touch this file.

Let me also run the L1 fold tests since `foldListMarker` consumes this field, then a typecheck.

One failure — a `validateL1` test. Let me check whether it's related to my change or pre-existing.

That failure is in `validateL1` (schema validation in `packages/site-schema`) — a path my capture-side change doesn't touch. Let me confirm it's pre-existing by running it with my change stashed.

Confirmed pre-existing and unrelated (fails with my change stashed). Now a typecheck to be safe.

vitest already validated the test file compiles/runs, and `tools/generate` typechecks clean. Now the free-coding commit steps. First bump the version.

The version bump edited `package.json` (0.0.181 → 0.0.182). The `home.json` change is a pre-existing unrelated site-config edit — I'll leave it out. Let me stage only the BUG-10 files plus the version bump and commit.

Now set story points and update the ticket body to reflect the final implementation (the original body is accurate; I'll append an outcome section).

Done. BUG-10 is free-coded and at a clean resting state.

## Summary

**Root cause** — `listMarkerOf(s)` in the capture's `EXTRACT_SCRIPT` (`tools/generate/src/cli/capture/extract.ts`) read computed `list-style-type` unconditionally. Its CSS initial value is `disc` on *every* element, so the wordmark, headings, and body all got a phantom marker that the renderer faithfully painted.

**Fix** — one gate: `listMarkerOf` now returns `null` unless `s.display === 'list-item'` (the only elements for which the browser generates a `::marker` box). Genuine `<li>` items keep their marker; `none` still suppresses. The fold and renderer were left untouched, per the ticket's direction.

**Tests** — `tests/bug10-list-marker-gate.test.ts`, four `test_UAT_FC_BUG-10_*` UATs running the real `EXTRACT_SCRIPT` under jsdom: non-list runs → null, genuine list item → marker, `none` → null, and a mixed list/non-list regression fixture. All pass.

**Regression scope** — `req63-values-diff-coverage` + `req47-fidelity-structural` (39 pass) and the L1 fold/roundtrip suite all green. One failure surfaced in `reconciliation-l1-substrate` (`validateL1`), but I confirmed it's **pre-existing and unrelated** — it fails identically with my change stashed, and it's in `packages/site-schema`, a path this capture-side fix doesn't touch.

**Lifecycle state**
- Commit `3eceada` with `[FREE-CODED]`, version bumped 0.0.181 → 0.0.182
- `status=free_coded`, `fields.commits=[3eceada…]`, `story_points=1`
- Ticket body updated to describe the implementation as landed

The ticket is parked at `free_coded`. Promotion to `ready_to_reconcile` is yours to make whenever you've validated the fix.

One note: `storage/sites/gigabytealchemy/draft/pages/home.json` was already modified at session start — I left it out of the commit as an unrelated site-config edit. Let me know if it should be included somewhere.

<!-- xgd-chat-end -->