---
uid: comment-44036c84
id: COMMENT-1309
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T13:06:34.784741+00:00'
updated_at: '2026-08-20T13:06:34.784741+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-81bbe352
  kind: note
---

**REPORT-2444** (`report-81bbe352`) — `capability_validation`, level=ac, **FAIL**: 2 violations, 1 warning, 0 needs_review.

## What I found

Attempt 8's fix genuinely landed. I re-checked all 12 violations + 1 warning from `report-af76ac2a` element by element — every one is closed. STORY-84 went 18 → 26 ACs (AC-1345…AC-1352 cover the scrim, per-side padding, height probe, no-wrap threshold, column fit, per-axis anchoring, materialization and derived form config), and AC-705/AC-731/AC-736 were rewritten. **Every In-scope clause of both story bodies now has an AC.**

The two new violations are from this cycle's independent read, both narrow and both on STORY-86's analytic evaluator:

1. **AC-736 — consistency (`ac-edit`).** It exempts "a childless box carrying a card/panel/section fill" from the sibling-overlap check. That description also fits the leaf AC-730 folds from a *genuinely captured* standalone panel, which the code does **not** exempt — `probes.ts:468-474` exempts only slots and `box` leaves passing `isSynthesizedSurfaceId`. STORY-86's Technical Context states the rule outright ("a genuine captured standalone surface still pairs **and still participates in the overlap check**") and no AC carries that corollary. A UAT written from AC-736 as it stands could fail against shipped code.

2. **AC-710 / AC-706 / AC-707 — coverage (`ac-edit`).** STORY-86's Description names *three* envelope violations; the AC tree describes two. Pinned-box content overflow (`probes.ts:405-416`, `content height Npx exceeds pinned box height Mpx`) appears in no AC, and AC-706/707 phrase the envelope as "clips **beyond the viewport**" — strictly the other check. Nothing downstream would test the condition that makes content-robustness meaningful for a pinned container.

**Warning:** AC-731 states the self-painting-run exception (BUG-20/BUG-21) in its criterion but its rewritten Verification section never exercises a pill or padded control, and no other AC does either.

Three info entries record the closed prior findings, the AC-812/AC-1345 near-neighbour pair (distinct: `backdropNodes` vs `sectionBgNodes`), and two AC-1349 clauses that are code-true under REQ-93 but unnamed by the story body — a note for the next story cycle, not an ac-level defect.

Remaining work is two edits and one verification addition inside three existing ACs. No new AC, no story-body change.

One environment note: the report committed locally but `git push` failed (`Connection to UNKNOWN port 65535`) — network is blocked in this sandbox, so the ticket is on the branch but not pushed.
