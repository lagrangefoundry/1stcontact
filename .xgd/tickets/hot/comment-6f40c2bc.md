---
uid: comment-6f40c2bc
id: COMMENT-2404
type: comment
title: Comment on request REQ-211
created_by: xgd
created_at: '2026-09-10T00:23:10.279017+00:00'
updated_at: '2026-09-10T17:25:51.848280+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d648490d
  kind: chat_transcript
---

<!-- xgd-turn id="878d810a-cc62-4cd1-a7fc-77702c6bf825-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T00:22:33.182748+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="878d810a-cc62-4cd1-a7fc-77702c6bf825-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T00:53:40.823938+00:00" -->
#### Claude
Ticket read. Before coding, let me confirm a few remaining details in the code.

Design is clear. Cutting the branch.

Now the types and the plain-text projection helper.

Now the text-height estimation over runs.

Now the capture-side inline-flow record.

Now the fold's run recovery.

Now the UAT suites.

<!-- xgd-turn id="04631f76-98fc-4468-baa1-0f5d278d0500-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T17:09:31.754287+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="04631f76-98fc-4468-baa1-0f5d278d0500-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T17:25:51.807189+00:00" -->
#### Claude
Now the version bump and commit.

REQ-211 is free-coded and landed on `xgd-working`.

## What shipped

`text` on an L1 text node is now a union: the string it has always been, or an ordered list of `{ text, axes? }` runs.

**Schema** (`packages/site-schema/src/l1/`)
- `l1TextRunAxesSchema` — `color`, `sizeScale`, `fontWeight`, `fontStyle`, `baselineShiftEm`, and nothing else. Both sizes relative, so a run rides the node's per-width `responsive.fontSizePx` track instead of pinning a desktop pixel value.
- A one-element run array is refused (`min(2)`) — the string stays the only spelling of single-run copy.
- New `text.ts`: `l1PlainText` / `l1TextRuns`, the two projections, stated once so the fold can't join differently from the way the renderer emits.
- Envelope gains `runSizeScale` (0.1–8) and `runBaselineShiftEm` (−10–10).

**Renderer** — one span per *varying* run, none for a run that varies in nothing; run classes hang off the node's name rather than consuming the render counter.

**Capture → fold → oracle** — five new capture fields record which runs share an inline flow (`<br>` and any blockified child end one). `tools/generate/src/l1/inline-runs.ts` states the rejoin decision once, and both the fold and the fidelity oracle ask it — without that, every emphasised word would report phantom `unmatched` runs. Only flows that actually vary are rejoined; a rejoined node lays out in the flow root's rect and takes no `nowrapFromPx` pin.

**Editor** — `text1 … textN`, each a plain string, keeping DOC-28 §3's exposure rule. Per-run axes stay the AI's.

**Round-trip** — the expected manifest projects one element per run, since the browser gives a painting run its own text node.

## Verification

- `tests/test_UAT_FC_REQ-211_multi_variate_text.test.ts` — 11 passing (schema, envelope, renderer, editor, height estimation).
- `tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts` — 3 passing (fold/oracle agreement); 2 browser-gated tests skip, as Chromium is unavailable in this sandbox.
- Typecheck clean across `site-schema`, `framework`, `generate`.
- Full suite: 3260 passed / 18 failed. Every failure baselines identically on `xgd-working` before the change — the KB/priming suites and the workers KB suite — except `test_UAT_FC_BUG-58_invite_modal_fits`, which times out waiting for `.shell` because a branch worktree has no built builder assets (known location artifact, not a code failure).

The generated `kb/system/REF-l1.md` picked up `text run` / `text run axes` and the two new envelope bounds without any doc edit, which is the projection working as intended.

## Ticket

Body extended with three things the tests assert that weren't written down: the longest run carries the node's own axes, a copy field naming no run is refused, and the two matching verification bullets. Status `free_coded`, `story_points: 13`, commits `df9862ce77` (implementation) + `abd3f5388a` (version bump to 0.2.145), both confirmed ancestors of `xgd-working`. Branch merged, lock released, worktree cleaned.

Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->